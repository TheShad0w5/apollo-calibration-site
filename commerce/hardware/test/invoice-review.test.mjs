import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewHardwareInvoice} from '../src/invoice-review.mjs';
function fixture(){
 const shipTo={Line1:'1 Test Street',City:'Test City',CountrySubDivisionCode:'CA',PostalCode:'90001',Country:'US'};
 const expected={customerId:'test',billEmail:'customer@example.test',currency:'USD',shipTo,lines:[{itemId:'hardware-test',quantity:1,unitPriceCents:10000,amountCents:10000},{itemId:'shipping-test',quantity:1,unitPriceCents:1500,amountCents:1500}],taxCents:1000};
 const invoice={Id:'test-invoice',BillEmail:{Address:'customer@example.test'},CustomerRef:{value:'test'},CurrencyRef:{value:'USD'},ShipAddr:{...shipTo},Line:expected.lines.map(l=>({DetailType:'SalesItemLineDetail',Amount:l.amountCents/100,SalesItemLineDetail:{ItemRef:{value:l.itemId},Qty:l.quantity,UnitPrice:l.unitPriceCents/100}})),TxnTaxDetail:{TotalTax:10},TotalAmt:125};
 return {invoice,expected};
}
test('hardware, shipping, tax and destination match before payment link release',()=>{const {invoice,expected}=fixture();assert.equal(reviewHardwareInvoice(invoice,expected).ready,true);});
test('Affirm availability comes from returned invoice, never inferred from credit-card flag',()=>{
 const {invoice,expected}=fixture();invoice.AllowOnlineCreditCardPayment=true;
 assert.equal(reviewHardwareInvoice(invoice,expected).paymentOptions.affirm,null);
 invoice.AllowOnlineAffirmPayment=true;assert.equal(reviewHardwareInvoice(invoice,expected).paymentOptions.affirm,true);
 invoice.AllowOnlineAffirmPayment=false;assert.equal(reviewHardwareInvoice(invoice,expected).paymentOptions.affirm,false);
});
test('wrong destination and changed customer block release',()=>{for(const edit of [i=>i.ShipAddr.PostalCode='99999',i=>i.CustomerRef.value='other']){const {invoice,expected}=fixture();edit(invoice);assert.equal(reviewHardwareInvoice(invoice,expected).ready,false);}});
test('missing or recalculated tax blocks release even if item subtotal matches',()=>{for(const tax of [undefined,0,11]){const {invoice,expected}=fixture();invoice.TxnTaxDetail.TotalTax=tax;assert.equal(reviewHardwareInvoice(invoice,expected).ready,false);}});
test('wrong hardware item, shipping charge, total or currency blocks release',()=>{for(const edit of [i=>i.Line[0].SalesItemLineDetail.ItemRef.value='tuning-service',i=>i.Line[1].Amount=20,i=>i.TotalAmt=126,i=>i.CurrencyRef.value='CAD']){const {invoice,expected}=fixture();edit(invoice);assert.equal(reviewHardwareInvoice(invoice,expected).ready,false);}});
test('unexpected discount cannot pass a superficially matching total',()=>{const {invoice,expected}=fixture();invoice.Line.push({DetailType:'DiscountLineDetail',Amount:0});assert.equal(reviewHardwareInvoice(invoice,expected).ready,false);});

test('wrong or missing invoice email blocks release despite matching customer ID',()=>{for(const email of [undefined,'other@example.test','']){const {invoice,expected}=fixture();invoice.BillEmail.Address=email;assert.equal(reviewHardwareInvoice(invoice,expected).ready,false);}});