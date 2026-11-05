import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import assert from 'node:assert/strict';
import {hardwareSchema,createHardwareOrder,loadHardwareOrder,saveFulfillmentEvent,saveHardwarePayment} from '../src/repository.mjs';
const now='2026-11-04T12:00:00Z';
function database(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(hardwareSchema);
 return {
  sqlite,
  prepare(sql){
   return {
    bind(...params){
     return {
      async first(){return sqlite.prepare(sql).get(...params)||null;},
      async run(){const r=sqlite.prepare(sql).run(...params);return {meta:{changes:Number(r.changes)}};}
     };
    }
   };
  }
 };
}
function order(){return {id:'test-order',paymentStatus:'unpaid',lines:[{kind:'hardware',quantity:1,components:[{sku:'ecu',quantity:1},{sku:'sensor',quantity:1}]}]};}
function shipment(id,sku){return {id,type:'shipment',recordedBy:'test-admin',occurredAt:now,carrier:'Test',trackingNumber:id,components:[{sku,quantity:1}]};}
function markFixturePaid(db){const data=JSON.parse(db.sqlite.prepare('SELECT document FROM hardware_orders').get().document);data.paymentStatus='paid';db.sqlite.prepare('UPDATE hardware_orders SET document=?').run(JSON.stringify(data));}

test('payment persistence is idempotent and cannot overwrite concurrent fulfillment',async()=>{
 const db=database();try{
  const original={...order(),customerId:'customer',customer:{email:'test@example.test'},hold:false};
  const shipTo={Line1:'123 Test St',City:'Test City',PostalCode:'90001',Country:'US'};
  original.invoice={id:'invoice',expected:{customerId:'customer',billEmail:'test@example.test',currency:'USD',shipTo,lines:[{itemId:'hardware',quantity:1,unitPriceCents:10000,amountCents:10000}],taxCents:0}};
  const invoice={Id:'invoice',CustomerRef:{value:'customer'},BillEmail:{Address:'test@example.test'},CurrencyRef:{value:'USD'},ShipAddr:shipTo,TotalAmt:100,Balance:0,TxnTaxDetail:{TotalTax:0},Line:[{DetailType:'SalesItemLineDetail',Amount:100,SalesItemLineDetail:{ItemRef:{value:'hardware'},Qty:1,UnitPrice:100}}]};
  const payment={Id:'payment',CustomerRef:{value:'customer'},CurrencyRef:{value:'USD'},TotalAmt:100,Line:[{Amount:100,LinkedTxn:[{TxnId:'invoice',TxnType:'Invoice'}]}]};
  const evidence={invoice,payments:[payment],observedAt:now};
  await createHardwareOrder(db,original,'payment-request',now);
  const paid=await saveHardwarePayment(db,original.id,0,evidence,now);assert.equal(paid.version,1);assert.equal(paid.order.paymentStatus,'paid');
  assert.equal((await saveHardwarePayment(db,original.id,0,evidence,now)).version,1);
  await saveFulfillmentEvent(db,original.id,1,shipment('sent-after-payment','ecu'),now);
  assert.equal((await saveHardwarePayment(db,original.id,0,evidence,now)).version,2);
  const changed=structuredClone(evidence);changed.invoice.Balance=100;changed.payments=[];
  await assert.rejects(saveHardwarePayment(db,original.id,1,changed,now),e=>e.status===409);
  const current=await loadHardwareOrder(db,original.id);assert.equal(current.order.fulfillmentEvents.length,1);assert.equal(current.order.paymentStatus,'paid');
  const review=await saveHardwarePayment(db,original.id,2,changed,now);assert.equal(review.order.paymentStatus,'payment_review');assert.equal(review.order.hold,true);assert.equal(review.order.fulfillmentEvents.length,1);
 }finally{db.sqlite.close();}
});
test('create persists an unpaid order without touching tuning tables',async()=>{const db=database();try{await createHardwareOrder(db,order(),'request-1',now);assert.equal((await loadHardwareOrder(db,'test-order')).order.paymentStatus,'unpaid');assert.deepEqual(db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r=>r.name),['hardware_orders']);}finally{db.sqlite.close();}});
test('duplicate creation is idempotent and a conflicting request key fails',async()=>{const db=database();try{await createHardwareOrder(db,order(),'request-1',now);await createHardwareOrder(db,order(),'request-1',now);await assert.rejects(createHardwareOrder(db,{...order(),id:'another'},'request-1',now));assert.equal(db.sqlite.prepare('SELECT count(*) n FROM hardware_orders').get().n,1);}finally{db.sqlite.close();}});
test('paid partial shipment persists; retries do not duplicate and stale updates fail',async()=>{const db=database();try{await createHardwareOrder(db,order(),'request-1',now);markFixturePaid(db);const e=shipment('shipment-1','ecu');const first=await saveFulfillmentEvent(db,'test-order',0,e,now);assert.equal(first.order.fulfillmentStatus,'partially_shipped');assert.equal(first.version,1);assert.equal((await saveFulfillmentEvent(db,'test-order',0,e,now)).version,1);await assert.rejects(saveFulfillmentEvent(db,'test-order',0,shipment('shipment-2','sensor'),now));const done=await saveFulfillmentEvent(db,'test-order',1,shipment('shipment-2','sensor'),now);assert.equal(done.order.fulfillmentStatus,'shipped');assert.equal((await loadHardwareOrder(db,'test-order')).order.fulfillmentEvents.length,2);}finally{db.sqlite.close();}});
test('unpaid shipment failure leaves database unchanged',async()=>{const db=database();try{await createHardwareOrder(db,order(),'request-1',now);await assert.rejects(saveFulfillmentEvent(db,'test-order',0,shipment('shipment-1','ecu'),now));const saved=await loadHardwareOrder(db,'test-order');assert.equal(saved.version,0);assert.equal(saved.order.fulfillmentEvents.length,0);}finally{db.sqlite.close();}});

test('creation retry after payment and shipment returns current order without resetting fulfillment',async()=>{
 const db=database();
 try{
  const original=order();
  await createHardwareOrder(db,original,'request-retry',now);
  markFixturePaid(db);
  await saveFulfillmentEvent(db,original.id,0,shipment('sent-1','ecu'),now);
  const retried=await createHardwareOrder(db,original,'request-retry','2026-11-05T12:00:00Z');
  assert.equal(retried.version,1);
  assert.equal(retried.order.paymentStatus,'paid');
  assert.equal(retried.order.fulfillmentStatus,'partially_shipped');
  assert.equal(retried.order.fulfillmentEvents.length,1);
  const changed=structuredClone(original);changed.lines[0].quantity=2;
  await assert.rejects(createHardwareOrder(db,changed,'request-retry',now),e=>e.status===409);
  assert.equal(db.sqlite.prepare('SELECT count(*) n FROM hardware_orders').get().n,1);
 }finally{db.sqlite.close();}
});
