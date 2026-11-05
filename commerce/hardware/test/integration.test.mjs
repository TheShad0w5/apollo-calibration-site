import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../integration/worker-production.mjs';
import {DatabaseSync} from 'node:sqlite';
import {hardwareSchema} from '../src/repository.mjs';
import {seal,hash,now} from '../integration/security.mjs';
const token='integration-test-token-not-a-live-secret';
const env={MODE:'production',PRODUCTION_ENABLED:'true',BASE_URL:'https://example.test',ADMIN_TOKEN:token};
test('normal admin session cookie opens hardware pages and rejects expired or changed sessions',async()=>{
 const DB={prepare(){return {bind(){return {all:async()=>({results:[]})};}};}};
 const sessionEnv={...env,HARDWARE_COMMERCE_ENABLED:'true',ADMIN_PASSWORD_HASH:'fixture-password-version',TOKEN_ENCRYPTION_KEY:Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'),DB};
 const ticket={kind:'admin-session',expires:now()+3600,version:await hash(sessionEnv.ADMIN_PASSWORD_HASH)};
 async function get(data,path='/manage/hardware'){
  const value=await seal(data,sessionEnv.TOKEN_ENCRYPTION_KEY);
  return worker.fetch(new Request(env.BASE_URL+path,{headers:{Cookie:'__Host-tbk-admin='+encodeURIComponent(value)}}),sessionEnv);
 }
 const page=await get(ticket);assert.equal(page.status,200);assert.match(await page.text(),/No hardware orders yet/);
 const script=await get(ticket,'/hardware-ui/browser.mjs');assert.equal(script.status,200);
 assert.equal((await get({...ticket,expires:now()-1})).status,401);
 assert.equal((await get({...ticket,version:'previous-password-version'})).status,401);
});
test('integrated hardware route authenticates before feature checks and does not require tables when disabled',async()=>{
 const anonymous=await worker.fetch(new Request(env.BASE_URL+'/admin/hardware-orders'),env);
 assert.equal(anonymous.status,401);
 const authorized=await worker.fetch(new Request(env.BASE_URL+'/admin/hardware-orders',{headers:{Authorization:'Bearer '+token}}),env);
 assert.equal(authorized.status,503);assert.match((await authorized.json()).error,/not enabled/);
});
test('integrated mutation preserves the existing same-origin restriction',async()=>{
 const response=await worker.fetch(new Request(env.BASE_URL+'/admin/hardware-orders/test/fulfillment',{method:'POST',headers:{Authorization:'Bearer '+token,Origin:'https://different.test'},body:'{}'}),{...env,HARDWARE_COMMERCE_ENABLED:'true'});
 assert.equal(response.status,403);
});
test('existing service checkout and health remain available with hardware disabled',async()=>{
 const health=await worker.fetch(new Request(env.BASE_URL+'/health'),env);assert.equal(health.status,200);
 const shop=await worker.fetch(new Request(env.BASE_URL+'/shop?service=ap-single'),env);assert.equal(shop.status,200);assert.match(await shop.text(),/Your setup/);
});
test('paid hardware queue and partial shipment work through the integrated authenticated route',async()=>{
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(hardwareSchema);
 const order={id:'fixture',customer:{name:'Fixture'},paymentStatus:'paid',lines:[{kind:'hardware',name:'Fixture kit',quantity:1,components:[{sku:'ECU',quantity:1},{sku:'HARNESS',quantity:1}]}],fulfillmentEvents:[],fulfillmentStatus:'awaiting_fulfillment'};
 const document=JSON.stringify(order);
 sqlite.prepare('INSERT INTO hardware_orders(id,request_key,request_document,document,created_at,updated_at) VALUES(?,?,?,?,?,?)').run('fixture','fixture-key',document,document,'2026-11-04','2026-11-04');
 const DB={
  prepare(sql){
   return {
    bind(...params){
     return {
      async all(){return {results:sqlite.prepare(sql).all(...params)};},
      async first(){return sqlite.prepare(sql).get(...params)||null;},
      async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...params).changes)}};}
     };
    }
   };
  }
 };
 const testEnv={...env,HARDWARE_COMMERCE_ENABLED:'true',DB};
 const headers={Authorization:'Bearer '+token,Origin:env.BASE_URL,'Content-Type':'application/json'};
 const payload={version:0,event:{id:'test-shipment',type:'shipment',occurredAt:'2026-11-04T17:00:00Z',carrier:'Fixture carrier',trackingNumber:'TEST-ONLY',components:[{sku:'ECU',quantity:1}]}};
 try{
  const queue=await worker.fetch(new Request(env.BASE_URL+'/admin/hardware-orders',{headers}),testEnv);assert.equal(queue.status,200);assert.equal((await queue.json()).orders.length,1);
  const detail=await worker.fetch(new Request(env.BASE_URL+'/manage/hardware?order=fixture',{headers}),testEnv);
  assert.equal(detail.status,200);assert.equal(detail.headers.get('Cache-Control'),'no-store');assert.match(detail.headers.get('Content-Security-Policy'),/script-src 'self'/);assert.match(await detail.text(),/Record a manufacturer order/);
  for(const path of ['browser.mjs','admin-client.mjs','order-view.mjs','fulfillment.mjs','errors.mjs','style.css']){
   const asset=await worker.fetch(new Request(env.BASE_URL+'/hardware-ui/'+path,{headers}),testEnv);assert.equal(asset.status,200);assert.ok((await asset.text()).length>0);
  }
  const anonymousPage=await worker.fetch(new Request(env.BASE_URL+'/manage/hardware?order=fixture'),testEnv);assert.equal(anonymousPage.status,401);
  const unknownAsset=await worker.fetch(new Request(env.BASE_URL+'/hardware-ui/repository.mjs',{headers}),testEnv);assert.equal(unknownAsset.status,404);
  for(let retry=0;retry<2;retry++){
   const response=await worker.fetch(new Request(env.BASE_URL+'/admin/hardware-orders/fixture/fulfillment',{method:'POST',headers,body:JSON.stringify(payload)}),testEnv);
   assert.equal(response.status,200);const saved=await response.json();assert.equal(saved.version,1);assert.equal(saved.order.fulfillmentStatus,'partially_shipped');assert.equal(saved.order.fulfillmentEvents.length,1);
  }
  const changed={...payload,event:{...payload.event,id:'second-shipment',components:[{sku:'HARNESS',quantity:1}]}};
  const conflict=await worker.fetch(new Request(env.BASE_URL+'/admin/hardware-orders/fixture/fulfillment',{method:'POST',headers,body:JSON.stringify(changed)}),testEnv);assert.equal(conflict.status,409);
 }finally{sqlite.close();}
});
