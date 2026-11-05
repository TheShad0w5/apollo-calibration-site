import test from 'node:test';
import assert from 'node:assert/strict';
import {draftHardwareInvoice,purchaseQuoteBasis,taxQuoteBasis} from '../src/invoice-draft.mjs';
const now=new Date('2026-11-04T12:00:00Z');
function rawFixture(){return {order:{id:'fixture',customerId:'customer-test',customer:{email:'test@example.test'},currency:'USD',shipTo:{Line1:'Test address',City:'Test city',PostalCode:'90001',Country:'US',CountrySubDivisionCode:'CA'},lines:[{kind:'hardware',qboItemId:'ecu-test',name:'ECU only',quantity:2,priceCents:10000,subtotalCents:20000}]},quotes:{shipping:{confirmed:true,reference:'shipping-test',shipTo:{Line1:'Test address',City:'Test city',PostalCode:'90001',Country:'US',CountrySubDivisionCode:'CA'},expiresAt:'2026-11-05',amountCents:1500,itemId:'shipping-test',taxCode:'NON'},tax:{confirmed:true,reference:'tax-test',shipTo:{Line1:'Test address',City:'Test city',PostalCode:'90001',Country:'US',CountrySubDivisionCode:'CA'},expiresAt:'2026-11-05',amountCents:2000},itemTaxCodes:{'ecu-test':'TAX'}}};}
function fixture(){const f=rawFixture();for(const q of [f.quotes.shipping,f.quotes.tax])q.purchaseBasis=purchaseQuoteBasis(f.order);f.quotes.tax.taxBasis=taxQuoteBasis(f.order,f.quotes.shipping,f.quotes.itemTaxCodes);return f;}
test('draft carries exact customer address, hardware and explicit shipping; it does not force Intuit tax totals',()=>{const {order,quotes}=fixture(),draft=draftHardwareInvoice(order,quotes,now);assert.equal(draft.totalCents,23500);assert.equal(draft.payload.Line.length,2);assert.deepEqual(draft.payload.ShipAddr,order.shipTo);assert.equal(draft.payload.TxnTaxDetail,undefined);assert.equal(draft.expected.taxCents,2000);assert.equal(draft.requestId,'hardware-fixture');});
test('missing, stale or unconfirmed quotes block an invoice draft; explicit zero shipping is allowed',()=>{for(const key of ['shipping','tax'])for(const change of [{amountCents:undefined},{confirmed:false},{expiresAt:'2026-11-03'}]){const {order,quotes}=fixture();Object.assign(quotes[key],change);assert.throws(()=>draftHardwareInvoice(order,quotes,now));}const {order,quotes}=fixture();quotes.shipping.amountCents=0;quotes.tax.taxBasis=taxQuoteBasis(order,quotes.shipping,quotes.itemTaxCodes);assert.equal(draftHardwareInvoice(order,quotes,now).payload.Line[1].Amount,0);});
test('changed line totals and missing hardware tax mapping block drafting',()=>{const {order,quotes}=fixture();order.lines[0].subtotalCents=1;assert.throws(()=>draftHardwareInvoice(order,quotes,now));order.lines[0].subtotalCents=20000;delete quotes.itemTaxCodes['ecu-test'];assert.throws(()=>draftHardwareInvoice(order,quotes,now));});


test('changing destination invalidates both previously confirmed quotes',()=>{const {order,quotes}=fixture();order.shipTo.PostalCode='10001';assert.throws(()=>draftHardwareInvoice(order,quotes,now),/address changed/);});

test('valid but different cart cannot reuse an existing shipping or tax quote',()=>{
 for(const change of [{quantity:1,subtotalCents:10000},{priceCents:12000,subtotalCents:24000},{option:'complete-package'},{revision:2}]){
  const {order,quotes}=fixture();Object.assign(order.lines[0],change);
  assert.throws(()=>draftHardwareInvoice(order,quotes,now),/hardware changed/);
 }
});
test('shipping price and tax treatment changes invalidate tax quote',()=>{
 for(const change of ['shipping','hardwareTax','shippingTax']){
  const {order,quotes}=fixture();
  if(change==='shipping')quotes.shipping.amountCents=2500;
  if(change==='hardwareTax')quotes.itemTaxCodes['ecu-test']='NON';
  if(change==='shippingTax')quotes.shipping.taxCode='TAX';
  assert.throws(()=>draftHardwareInvoice(order,quotes,now),/tax treatment changed/);
 }
});

