import {HardwareError} from './errors.mjs';
import {reviewHardwareInvoice} from './invoice-review.mjs';
const cents=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&Number.isSafeInteger(Math.round(n*100))&&Math.abs(n*100-Math.round(n*100))<0.00001?Math.round(n*100):null;
// Call only with freshly retrieved provider records, never a browser return URL
// or webhook body alone. Webhooks trigger a fresh server-to-server fetch.
export function reconcileHardwarePayment(order,{invoice,payments,observedAt},now=new Date()){
 if(['refunded','cancelled'].includes(order.paymentStatus))throw new HardwareError('Closed order requires manual payment review',409);
 const time=Date.parse(observedAt);
 if(!Number.isFinite(time)||time>now.getTime()+5000||now.getTime()-time>300000)throw new HardwareError('Fresh QuickBooks evidence required');
 if(order.paymentEvidence?.observedAt&&time<Date.parse(order.paymentEvidence.observedAt))throw new HardwareError('Stale payment evidence',409);
 if(!order.invoice?.id||!order.invoice.expected||String(invoice?.Id)!==String(order.invoice.id))throw new HardwareError('Invoice does not belong to this hardware order');
 const review=reviewHardwareInvoice(invoice,order.invoice.expected);
 if(!review.ready)throw new HardwareError('Invoice review failed: '+review.issues.join('; '),409);
 if(!Array.isArray(payments))throw new HardwareError('Retrieved payment records required');
 const seen=new Map(),applied=[];
 for(const payment of payments){
  const linked=(payment.Line||[]).filter(l=>(l.LinkedTxn||[]).some(t=>t.TxnType==='Invoice'&&String(t.TxnId)===String(invoice.Id)));
  if(!linked.length)continue;
  if(!payment.Id||String(payment.CustomerRef?.value)!==String(order.customerId)||payment.CurrencyRef?.value!=='USD')throw new HardwareError('Payment identity, customer or currency mismatch',409);
  let amount=0;
  for(const line of linked){
   // One line associated to multiple invoices is ambiguous for allocation.
   if(line.LinkedTxn.length!==1||cents(line.Amount)===null)throw new HardwareError('Ambiguous payment allocation',409);
   amount+=cents(line.Amount);
  }
  if(cents(payment.TotalAmt)===null||cents(payment.TotalAmt)<amount||!Number.isSafeInteger(amount)||amount<=0)throw new HardwareError('Invalid applied payment amount',409);
  const prior=seen.get(String(payment.Id));
  if(prior!==undefined){if(prior!==amount)throw new HardwareError('Conflicting payment records',409);continue;}
  seen.set(String(payment.Id),amount);applied.push({id:String(payment.Id),amountCents:amount});
 }
 applied.sort((a,b)=>a.id.localeCompare(b.id));
 const paid=applied.reduce((n,p)=>n+p.amountCents,0),balance=cents(invoice.Balance);
 if(!Number.isSafeInteger(paid)||balance===null)throw new HardwareError('Invalid invoice balance',409);
 const fullyPaid=balance===0&&paid===review.totalCents;
 const discrepancy=paid>review.totalCents||paid+balance!==review.totalCents||(order.paymentStatus==='paid'&&!fullyPaid);
 const next=structuredClone(order);
 next.paymentStatus=discrepancy?'payment_review':fullyPaid?'paid':'unpaid';
 next.hold=order.hold===true||discrepancy;
 next.paymentEvidence={invoiceId:String(invoice.Id),observedAt,appliedPayments:applied,appliedCents:paid,balanceCents:balance,totalCents:review.totalCents};
 // Payment never creates supplier orders, shipments, tune jobs or file grants.
 return next;
}
