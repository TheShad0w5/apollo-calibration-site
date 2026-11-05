// Pure verification only: no invoice creation or payment calls.
// Read the returned QBO invoice before exposing its payment URL.
function cents(value) {
  if(typeof value!=='number'||!Number.isFinite(value)||value<0) return null;
  const result=Math.round(value*100);
  return Number.isSafeInteger(result)&&Math.abs(value*100-result)<0.00001?result:null;
}
function sameAddress(actual, expected) {
  const keys=['Line1','Line2','City','CountrySubDivisionCode','PostalCode','Country'];
  return !!actual&&!!expected&&keys.every(k=>String(actual[k]||'').trim()===String(expected[k]||'').trim());
}
export function reviewHardwareInvoice(invoice, expected) {
  const issues=[];
  if(!invoice?.Id) return {ready:false,issues:['Invoice missing']};
  if(String(invoice.CustomerRef?.value)!==String(expected.customerId)) issues.push('Customer mismatch');
  if(typeof expected.billEmail!=='string'||!expected.billEmail.trim()||invoice.BillEmail?.Address?.trim()!==expected.billEmail.trim()) issues.push('Billing email mismatch');
  if(invoice.CurrencyRef?.value!=='USD'||expected.currency!=='USD') issues.push('Currency mismatch');
  if(!expected.shipTo?.Line1||!expected.shipTo?.City||!expected.shipTo?.PostalCode||!expected.shipTo?.Country||!sameAddress(invoice.ShipAddr,expected.shipTo)) issues.push('Shipping destination mismatch');
  const lines=(invoice.Line||[]).filter(l=>l.DetailType==='SalesItemLineDetail');
  if(!expected.lines?.length||lines.length!==expected.lines.length) issues.push('Invoice line count mismatch');
  for(let i=0;i<(expected.lines||[]).length;i++) {
    const wanted=expected.lines[i], actual=lines[i], detail=actual?.SalesItemLineDetail;
    if(!actual||String(detail?.ItemRef?.value)!==String(wanted.itemId)||detail?.Qty!==wanted.quantity||cents(detail?.UnitPrice)!==wanted.unitPriceCents||cents(actual?.Amount)!==wanted.amountCents) issues.push('Invoice line mismatch: '+i);
  }
  const tax=cents(invoice.TxnTaxDetail?.TotalTax);
  if(!Number.isSafeInteger(expected.taxCents)||expected.taxCents<0||tax!==expected.taxCents) issues.push('Tax requires review');
  const sum=(expected.lines||[]).reduce((n,l)=>n+l.amountCents,0)+expected.taxCents;
  if(!Number.isSafeInteger(sum)||sum<=0||cents(invoice.TotalAmt)!==sum) issues.push('Invoice total mismatch');
  // Unexpected discounts/additions must not disappear inside a matching headline total.
  if((invoice.Line||[]).some(l=>!['SalesItemLineDetail','SubTotalLineDetail','DescriptionOnly'].includes(l.DetailType))) issues.push('Unexpected invoice adjustment');
  return {ready:issues.length===0,issues,totalCents:sum,paymentOptions:{affirm:typeof invoice.AllowOnlineAffirmPayment==='boolean'?invoice.AllowOnlineAffirmPayment:null}};
}