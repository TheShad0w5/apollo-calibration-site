import {HardwareError} from './errors.mjs';
import {invoicePaymentOptions} from './payment-options.mjs';
const cents=value=>Number.isSafeInteger(value)&&value>=0;
const text=value=>typeof value==='string'&&value.trim().length>0;
const addressKeys=['Line1','Line2','City','CountrySubDivisionCode','PostalCode','Country'];

// Stored alongside server-confirmed quotes; never accepted from customer input.
export function purchaseQuoteBasis(order){
 return JSON.stringify({orderId:order.id,customerId:order.customerId,currency:order.currency,lines:(order.lines||[]).map(l=>({id:l.id,revision:l.revision,option:l.option,item:l.qboItemId,quantity:l.quantity,priceCents:l.priceCents,subtotalCents:l.subtotalCents,components:l.components}))});
}
export function taxQuoteBasis(order,shipping,itemTaxCodes){
 return JSON.stringify({purchase:purchaseQuoteBasis(order),shipping:{amountCents:shipping.amountCents,itemId:shipping.itemId,taxCode:shipping.taxCode},itemTaxCodes:(order.lines||[]).map(l=>[l.qboItemId,itemTaxCodes?.[l.qboItemId]])});
}

// Trusted server-side purchase snapshot and separately confirmed quotes only.
// Does not create an invoice, calculate taxes, or expose a payment URL.
// Intuit must calculate/return tax; reviewHardwareInvoice must verify it against
// expected before the customer can pay. US tax/account settings require validation.
export function draftHardwareInvoice(order,{shipping,tax,itemTaxCodes,affirm},at=new Date()){
 if(!text(order.id)||!text(order.customerId)||!text(order.customer?.email)||order.currency!=='USD')throw new HardwareError('Customer, order and USD currency required');
 const shipTo=Object.fromEntries(addressKeys.filter(k=>text(order.shipTo?.[k])).map(k=>[k,order.shipTo[k].trim()]));
 if(['Line1','City','PostalCode','Country'].some(k=>!shipTo[k]))throw new HardwareError('Complete shipping address required');
 for(const quote of [shipping,tax])if(quote?.confirmed!==true||!text(quote.reference)||!Number.isFinite(Date.parse(quote.expiresAt))||Date.parse(quote.expiresAt)<=at.getTime()||!cents(quote.amountCents))throw new HardwareError('Current confirmed shipping and tax quotes required');
 for(const quote of [shipping,tax])if(addressKeys.some(k=>String(quote.shipTo?.[k]||'').trim()!==String(shipTo[k]||'')))throw new HardwareError('Shipping address changed; obtain new quotes');
 if(!text(shipping.itemId)||!text(shipping.taxCode))throw new HardwareError('Shipping accounting item and tax treatment required');
 if(!Array.isArray(order.lines)||!order.lines.length)throw new HardwareError('Purchased hardware required');
 const lines=order.lines.map(l=>{
  if(l.kind!=='hardware'||!text(l.qboItemId)||!text(l.name)||!Number.isSafeInteger(l.quantity)||l.quantity<1||!cents(l.priceCents)||l.priceCents===0||!cents(l.subtotalCents)||l.quantity*l.priceCents!==l.subtotalCents||!text(itemTaxCodes?.[l.qboItemId]))throw new HardwareError('Verified hardware price, quantity and accounting mapping required');
  return {itemId:l.qboItemId,quantity:l.quantity,unitPriceCents:l.priceCents,amountCents:l.subtotalCents,description:l.name,taxCode:itemTaxCodes[l.qboItemId]};
 });
 if(shipping.purchaseBasis!==purchaseQuoteBasis(order)||tax.purchaseBasis!==purchaseQuoteBasis(order))throw new HardwareError('Purchased hardware changed; obtain new shipping and tax quotes');
 if(tax.taxBasis!==taxQuoteBasis(order,shipping,itemTaxCodes))throw new HardwareError('Shipping or tax treatment changed; obtain a new tax quote');
 lines.push({itemId:shipping.itemId,quantity:1,unitPriceCents:shipping.amountCents,amountCents:shipping.amountCents,description:'Shipping',taxCode:shipping.taxCode});
 const totalCents=lines.reduce((sum,l)=>sum+l.amountCents,0)+tax.amountCents;
 if(!Number.isSafeInteger(totalCents)||totalCents<=0)throw new HardwareError('Invalid invoice total');
 const expected={customerId:order.customerId,billEmail:order.customer.email.trim(),currency:'USD',shipTo,lines:lines.map(({itemId,quantity,unitPriceCents,amountCents})=>({itemId,quantity,unitPriceCents,amountCents})),taxCents:tax.amountCents};
 const payload={CustomerRef:{value:order.customerId},BillEmail:{Address:order.customer.email.trim()},CurrencyRef:{value:'USD'},ShipAddr:{...shipTo},PrivateNote:'TBK hardware order '+order.id,AllowOnlineCreditCardPayment:true,Line:lines.map(l=>({Description:l.description,Amount:l.amountCents/100,DetailType:'SalesItemLineDetail',SalesItemLineDetail:{ItemRef:{value:l.itemId},Qty:l.quantity,UnitPrice:l.unitPriceCents/100,TaxCodeRef:{value:l.taxCode}}}))};
 Object.assign(payload,invoicePaymentOptions(affirm,order.customerId,at));
 return {requestId:'hardware-'+order.id,payload,expected,totalCents,quoteReferences:{shipping:shipping.reference,tax:tax.reference}};
}