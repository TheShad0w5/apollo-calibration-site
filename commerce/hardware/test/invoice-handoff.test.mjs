import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {hardwareInvoiceHandoff,hardwareInvoiceStore,hardwareInvoiceSchema} from '../src/invoice-handoff.mjs';
import {purchaseQuoteBasis,taxQuoteBasis} from '../src/invoice-draft.mjs';
const now=new Date('2026-11-04T12:00:00Z');
function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(hardwareInvoiceSchema);
 const db={prepare(sql){return {bind(...args){return {async first(){return sqlite.prepare(sql).get(...args)},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}}}}};
 const order={id:'test-order',paymentStatus:'unpaid',customerId:'11',customer:{email:'buyer@example.test'},currency:'USD',shipTo:{Line1:'1 Test Street',City:'Test City',CountrySubDivisionCode:'CA',PostalCode:'90001',Country:'US'},lines:[{kind:'hardware',qboItemId:'20',name:'Package',quantity:1,priceCents:10000,subtotalCents:10000}]};
 const quotes={shipping:{confirmed:true,reference:'shipping',amountCents:1000,itemId:'24',taxCode:'NON'},tax:{confirmed:true,reference:'tax',amountCents:800},itemTaxCodes:{'20':'TAX'}};
 for(const q of [quotes.shipping,quotes.tax])Object.assign(q,{shipTo:{...order.shipTo},expiresAt:'2026-11-05',purchaseBasis:purchaseQuoteBasis(order)});
 quotes.tax.taxBasis=taxQuoteBasis(order,quotes.shipping,quotes.itemTaxCodes);
 let invoice,postCount=0,getCount=0;const requestIds=[];
 const state={loseCreate:false,loseRead:false,edit:null};
 const qbo=async(path,options)=>{
  if(options?.method==='POST'){
   postCount++;requestIds.push(path);
   invoice??={...JSON.parse(options.body),Id:'501',TxnTaxDetail:{TotalTax:8},TotalAmt:118,Balance:118,AllowOnlineAffirmPayment:true,InvoiceLink:'https://connect.intuit.com/portal/app/CommerceNetwork/view/scs-v1-test'};
   if(state.loseCreate){state.loseCreate=false;throw new Error('lost response')}
   return {Invoice:invoice};
  }
  getCount++;if(state.loseRead){state.loseRead=false;throw new Error('read timeout')}
  const result=structuredClone(invoice);state.edit?.(result);return {Invoice:result};
 };
 return {args:{order,quotes,realmId:'123',enabled:true,taxReady:true,store:hardwareInvoiceStore(db),qbo},state,sqlite,counts:()=>({postCount,getCount,requestIds})};
}
test('verified invoice link uses persisted company/order mapping and retries without another create',async()=>{
 const f=fixture();try{const first=await hardwareInvoiceHandoff(f.args,now),second=await hardwareInvoiceHandoff(f.args,now);assert.deepEqual(first,second);assert.equal(first.totalCents,11800);assert.equal(first.paymentOptions.affirm,true);assert.equal(f.counts().postCount,1);assert.equal(f.args.order.paymentStatus,'unpaid')}finally{f.sqlite.close()}
});
test('lost create response retries identical request ID; lost read does not create again',async()=>{
 const f=fixture();try{f.state.loseCreate=true;await assert.rejects(hardwareInvoiceHandoff(f.args,now));f.state.loseRead=true;await assert.rejects(hardwareInvoiceHandoff(f.args,now));await hardwareInvoiceHandoff(f.args,now);const c=f.counts();assert.equal(c.postCount,2);assert.equal(new Set(c.requestIds).size,1);assert.ok(c.requestIds[0].split('=')[1].length<=50)}finally{f.sqlite.close()}
});
test('changed draft cannot reuse reserved request after an uncertain result',async()=>{
 const f=fixture();try{f.state.loseCreate=true;await assert.rejects(hardwareInvoiceHandoff(f.args,now));f.args.order.customer.email='other@example.test';await assert.rejects(hardwareInvoiceHandoff(f.args,now),/details changed/);assert.equal(f.counts().postCount,1)}finally{f.sqlite.close()}
});
test('launch, tax, paid and held gates prevent all provider operations',async()=>{
 for(const change of [a=>a.enabled=false,a=>a.taxReady=false,a=>a.order.paymentStatus='paid',a=>a.order.hold=true]){const f=fixture();try{change(f.args);await assert.rejects(hardwareInvoiceHandoff(f.args,now));assert.equal(f.counts().postCount,0)}finally{f.sqlite.close()}}
});
test('ownership, changed totals, partial balance and unsafe links never release payment URL',async()=>{
 for(const edit of [i=>i.PrivateNote='other order',i=>i.Id='502',i=>i.TotalAmt=1,i=>i.Balance=10,i=>i.AllowOnlineCreditCardPayment=false,i=>i.InvoiceLink='https://connect.intuit.com.evil.test/pay',i=>i.InvoiceLink='http://connect.intuit.com/pay',i=>i.InvoiceLink='https://user:pass@connect.intuit.com/pay']){const f=fixture();try{f.state.edit=edit;await assert.rejects(hardwareInvoiceHandoff(f.args,now))}finally{f.sqlite.close()}}
});
test('persisted invoice cannot be replaced with a different provider invoice',async()=>{
 const f=fixture();try{await hardwareInvoiceHandoff(f.args,now);await assert.rejects(f.args.store.attach({realmId:'123',orderId:'test-order',invoiceId:'502'}),/Conflicting/)}finally{f.sqlite.close()}
});
