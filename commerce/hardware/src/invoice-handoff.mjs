import {HardwareError} from './errors.mjs';
import {draftHardwareInvoice} from './invoice-draft.mjs';
import {reviewHardwareInvoice} from './invoice-review.mjs';

// Server-only service. qbo uses the existing authenticated company connection.
// store.reserve must atomically bind (realmId, orderId) to the immutable draft,
// and store.attach must atomically bind that record to exactly one invoice ID.
// No email/send endpoint is called and a redirect never marks an order paid.
export async function hardwareInvoiceHandoff({order,quotes,realmId,enabled,taxReady,store,qbo},now=new Date()) {
 if(enabled!==true)throw new HardwareError('Hardware checkout is not enabled',503);
 if(taxReady!==true)throw new HardwareError('Hardware tax setup is pending',409);
 if(!/^\d+$/.test(String(realmId)))throw new HardwareError('Connected accounting company required',503);
 if(order.paymentStatus!=='unpaid'||order.hold===true)throw new HardwareError('Order cannot accept payment',409);
 const draft=draftHardwareInvoice(order,quotes,now);
 const document=JSON.stringify({payload:draft.payload,expected:draft.expected});
 const bytes=new TextEncoder().encode(String(realmId)+'\n'+order.id);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const requestId='hw-'+Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('').slice(0,40);
 const record=await store.reserve({realmId:String(realmId),orderId:order.id,document,requestId});
 if(record.document!==document||record.requestId!==requestId)throw new HardwareError('Invoice details changed; review the original checkout',409);
 let invoiceId=record.invoiceId;
 if(!invoiceId){
  // Reuse the identical provider request ID and payload after any lost response.
  const result=await qbo('invoice?requestid='+encodeURIComponent(requestId),{method:'POST',body:JSON.stringify(draft.payload)});
  invoiceId=result?.Invoice?.Id;
  if(!/^\d+$/.test(String(invoiceId||'')))throw new HardwareError('Invoice creation not confirmed',502);
  await store.attach({realmId:String(realmId),orderId:order.id,invoiceId:String(invoiceId)});
 }
 const invoice=(await qbo('invoice/'+encodeURIComponent(invoiceId)+'?include=invoiceLink')).Invoice;
 if(String(invoice?.Id)!==String(invoiceId)||invoice?.PrivateNote!==draft.payload.PrivateNote)throw new HardwareError('Invoice ownership requires review',409);
 const review=reviewHardwareInvoice(invoice,draft.expected);
 if(!review.ready)throw new HardwareError('Invoice totals or destination require review',409);
 if(invoice.AllowOnlineCreditCardPayment!==true)throw new HardwareError('Online invoice payment is unavailable',409);
 if(Math.round(invoice.Balance*100)!==review.totalCents)throw new HardwareError('Invoice balance changed; refresh payment status',409);
 let url;try{url=new URL(invoice.InvoiceLink);}catch{throw new HardwareError('Invoice payment link is not available yet',409);}
 if(url.protocol!=='https:'||url.username||url.password||!['connect.intuit.com','connect.intuit.ca'].includes(url.hostname))throw new HardwareError('Unrecognized invoice payment destination',502);
 return {invoiceId:String(invoiceId),invoiceLink:url.href,totalCents:review.totalCents,paymentOptions:review.paymentOptions};
}

export const hardwareInvoiceSchema=`CREATE TABLE IF NOT EXISTS hardware_invoice_requests (
 realm_id TEXT NOT NULL, order_id TEXT NOT NULL, document TEXT NOT NULL,
 request_id TEXT NOT NULL, invoice_id TEXT,
 PRIMARY KEY(realm_id,order_id), UNIQUE(realm_id,request_id)
);`;
export function hardwareInvoiceStore(db){return {
 async reserve({realmId,orderId,document,requestId}){
  await db.prepare('INSERT INTO hardware_invoice_requests(realm_id,order_id,document,request_id) VALUES(?,?,?,?) ON CONFLICT(realm_id,order_id) DO NOTHING').bind(realmId,orderId,document,requestId).run();
  const row=await db.prepare('SELECT document,request_id,invoice_id FROM hardware_invoice_requests WHERE realm_id=? AND order_id=?').bind(realmId,orderId).first();
  if(!row)throw new HardwareError('Invoice request could not be saved',503);
  return {document:row.document,requestId:row.request_id,invoiceId:row.invoice_id};
 },
 async attach({realmId,orderId,invoiceId}){
  await db.prepare('UPDATE hardware_invoice_requests SET invoice_id=? WHERE realm_id=? AND order_id=? AND (invoice_id IS NULL OR invoice_id=?)').bind(invoiceId,realmId,orderId,invoiceId).run();
  const row=await db.prepare('SELECT invoice_id FROM hardware_invoice_requests WHERE realm_id=? AND order_id=?').bind(realmId,orderId).first();
  if(row?.invoice_id!==invoiceId)throw new HardwareError('Conflicting accounting invoice requires review',409);
 }
};}
