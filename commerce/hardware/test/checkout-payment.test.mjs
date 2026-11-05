import test from 'node:test';
import assert from 'node:assert/strict';
import {hardwareCheckoutIntake} from '../src/checkout-intake.mjs';
import {reconcileHardwarePayment} from '../src/payment-reconciliation.mjs';
const now=new Date('2026-11-04T18:00:00Z');
function fixture(){
 const fitment={year:2020,model:'STI',market:'USDM',engine:'EJ257',transmission:'manual',verified:true};
 const product={id:'test-s3-2020',family:'haltech-s3',option:'basic-package',name:'S3 Basic',revision:2,status:'active',currency:'USD',fitment,components:[{sku:'fixture-ecu',name:'ECU',quantity:1,verified:true}],priceCents:307900,pricingApproval:{reference:'TEST ONLY',bundleApproved:true,validUntil:'2026-12-01',productId:'test-s3-2020',revision:2,currency:'USD',approvedPriceCents:307900},availability:{confirmed:true,availableQuantity:2,validUntil:'2026-11-05'},fulfillmentPolicyVersion:'shipping-v1',returnsPolicyVersion:'returns-v1',qboItemId:'hardware-item'};
 const input={productId:product.id,quantity:1,vehicle:{...fitment},customer:{name:'Test Customer',email:'test@example.test'},shipTo:{Line1:'123 Test St',City:'Test City',CountrySubDivisionCode:'CA',PostalCode:'90001',Country:'US'},acceptedRevision:2,acceptedPriceCents:307900,termsVersion:'returns-v1',fulfillmentPolicyVersion:'shipping-v1',acceptHardwareTerms:true,priceCents:1,paid:true};
 const options={catalog:[product],orderId:'hw-test',customerId:'customer-test'};
 const order=hardwareCheckoutIntake(input,options,now);
 order.invoice={id:'invoice-test',expected:{customerId:order.customerId,billEmail:order.customer.email,currency:'USD',shipTo:order.shipTo,lines:[{itemId:'hardware-item',quantity:1,unitPriceCents:307900,amountCents:307900},{itemId:'shipping-item',quantity:1,unitPriceCents:2500,amountCents:2500}],taxCents:20000}};
 const invoice={Id:'invoice-test',CustomerRef:{value:order.customerId},BillEmail:{Address:order.customer.email},CurrencyRef:{value:'USD'},ShipAddr:order.shipTo,Line:order.invoice.expected.lines.map(l=>({DetailType:'SalesItemLineDetail',Amount:l.amountCents/100,SalesItemLineDetail:{ItemRef:{value:l.itemId},Qty:l.quantity,UnitPrice:l.unitPriceCents/100}})),TxnTaxDetail:{TotalTax:200},TotalAmt:3304,Balance:0};
 const payment={Id:'payment-test',CustomerRef:{value:order.customerId},CurrencyRef:{value:'USD'},TotalAmt:3304,Line:[{Amount:3304,LinkedTxn:[{TxnId:invoice.Id,TxnType:'Invoice'}]}]};
 return {product,input,options,order,invoice,payment,evidence:{invoice,payments:[payment],observedAt:now.toISOString()}};
}
test('checkout ignores client totals and paid flags; requires shipping and tax next',()=>{
 const {order}=fixture();assert.equal(order.paymentStatus,'unpaid');assert.equal(order.lines[0].priceCents,307900);assert.equal(order.checkoutState,'shipping_and_tax_required');assert.deepEqual(order.fulfillmentEvents,[]);
});
test('unsupported years, mismatched ECU variants and stale offer cannot become orders',()=>{
 for(const modify of [f=>f.input.vehicle.year=2015,f=>f.input.vehicle.model='WRX',f=>f.input.vehicle.market='JDM',f=>f.input.acceptedPriceCents=300000,f=>f.input.acceptedRevision=1,f=>f.input.acceptHardwareTerms=false]){const f=fixture();modify(f);assert.throws(()=>hardwareCheckoutIntake(f.input,f.options,now));}
});
test('incomplete shipping, invalid email and stale policies fail before payment',()=>{
 for(const modify of [f=>delete f.input.shipTo.Line1,f=>f.input.shipTo.Country='CA',f=>f.input.shipTo.PostalCode='bad',f=>f.input.customer.email='invalid',f=>f.input.termsVersion='old']){const f=fixture();modify(f);assert.throws(()=>hardwareCheckoutIntake(f.input,f.options,now));}
});
test('fresh matched invoice plus allocated payment marks paid without fulfillment',()=>{
 const f=fixture(),paid=reconcileHardwarePayment(f.order,f.evidence,now);assert.equal(paid.paymentStatus,'paid');assert.equal(paid.hold,false);assert.deepEqual(paid.fulfillmentEvents,[]);assert.equal(f.order.paymentStatus,'unpaid');
});
test('zero-balance writeoff or browser success alone cannot mark paid',()=>{
 const f=fixture();f.evidence.payments=[];const next=reconcileHardwarePayment(f.order,f.evidence,now);assert.equal(next.paymentStatus,'payment_review');assert.equal(next.hold,true);assert.throws(()=>reconcileHardwarePayment(f.order,{paid:true},now));
});
test('partial payment remains unpaid and duplicate provider records do not double count',()=>{
 const f=fixture();f.payment.TotalAmt=1000;f.payment.Line[0].Amount=1000;f.invoice.Balance=2304;assert.equal(reconcileHardwarePayment(f.order,f.evidence,now).paymentStatus,'unpaid');f.evidence.payments.push(structuredClone(f.payment));assert.equal(reconcileHardwarePayment(f.order,f.evidence,now).paymentEvidence.appliedCents,100000);
});
test('multiple payments must exactly cover the invoice',()=>{
 const f=fixture();f.payment.TotalAmt=1000;f.payment.Line[0].Amount=1000;const second=structuredClone(f.payment);second.Id='payment-2';second.TotalAmt=2304;second.Line[0].Amount=2304;f.evidence.payments.push(second);assert.equal(reconcileHardwarePayment(f.order,f.evidence,now).paymentStatus,'paid');
});
test('wrong customer, currency, amount, invoice and stale evidence are rejected',()=>{
 for(const modify of [f=>f.payment.CustomerRef.value='wrong',f=>f.payment.CurrencyRef.value='AUD',f=>f.invoice.Id='wrong',f=>f.invoice.TotalAmt=1,f=>f.evidence.observedAt='2026-11-04T17:00:00Z',f=>f.payment.Line[0].LinkedTxn.push({TxnId:'another',TxnType:'Invoice'})]){const f=fixture();modify(f);assert.throws(()=>reconcileHardwarePayment(f.order,f.evidence,now));}
});
test('lost payment allocation places previously paid orders on hold',()=>{
 const f=fixture();const paid=reconcileHardwarePayment(f.order,f.evidence,now);f.invoice.Balance=3304;f.evidence.payments=[];const next=reconcileHardwarePayment(paid,f.evidence,now);assert.equal(next.paymentStatus,'payment_review');assert.equal(next.hold,true);
});
test('a valid payment never clears a manual hold or reopens a refunded order',()=>{
 const f=fixture();f.order.hold=true;assert.equal(reconcileHardwarePayment(f.order,f.evidence,now).hold,true);f.order.paymentStatus='refunded';assert.throws(()=>reconcileHardwarePayment(f.order,f.evidence,now));
});
