import test from 'node:test';
import assert from 'node:assert/strict';
import {hardwareAdminRoute} from '../src/admin-route.mjs';
const deps={admin(req){if(req.headers.get('Authorization')!=='Bearer test')throw Object.assign(Error('Unauthorized'),{status:401});},body:r=>r.json(),json:(data,status=200)=>Response.json(data,{status}),fail:(status,message)=>{throw Object.assign(Error(message),{status});}};
const request=(path,options={})=>new Request('https://example.test'+path,{headers:{Authorization:'Bearer test'},...options});
test('unrelated tuning routes are untouched',async()=>assert.equal(await hardwareAdminRoute(request('/admin/orders'),{},deps),null));
test('hardware feature is disabled by default and reads no database',async()=>{const r=await hardwareAdminRoute(request('/admin/hardware-orders'),{},deps);assert.equal(r.status,503);});
test('anonymous callers cannot inspect feature state or order data',async()=>{await assert.rejects(hardwareAdminRoute(request('/admin/hardware-orders',{headers:{}}),{},deps),e=>e.status===401);});
test('queue response omits shipping address, dealer cost and private notes',async()=>{const document=JSON.stringify({customer:{name:'Test',email:'private@example.test'},shipTo:{Line1:'Private'},dealerCost:1,privateNote:'secret',paymentStatus:'paid',fulfillmentStatus:'awaiting_fulfillment',lines:[{name:'ECU kit',quantity:1,priceCents:123}]});const env={HARDWARE_COMMERCE_ENABLED:'true',DB:{prepare(){return {bind(){return {async all(){return {results:[{id:'a',document,version:0,created_at:'test'}]}}}}}}}};const r=await hardwareAdminRoute(request('/admin/hardware-orders'),env,deps);const data=await r.json();assert.equal(data.orders[0].name,'Test');assert.equal(data.nextOffset,null);assert.ok(!JSON.stringify(data).includes('Private'));assert.ok(!JSON.stringify(data).includes('dealerCost'));});
test('invalid pagination fails before database access',async()=>{await assert.rejects(hardwareAdminRoute(request('/admin/hardware-orders?offset=-1'),{HARDWARE_COMMERCE_ENABLED:'true'},deps),e=>e.status===400);});

test('malformed fulfillment requests fail cleanly before storage access',async()=>{
 const event={id:'event-1',type:'shipment',occurredAt:'2026-11-04T15:00:00Z',carrier:'UPS',trackingNumber:'test',components:[{sku:'ecu',quantity:1}]};
 const cases=[null,[],{version:0,event:[]},{version:0,event:{...event,components:[null]}},{version:0,event:{...event,components:[]}},{version:0,event:{...event,occurredAt:'not a date'}},{version:0,event:{...event,components:[{sku:'ecu',quantity:1.5}]}}];
 for(const data of cases)await assert.rejects(hardwareAdminRoute(request('/admin/hardware-orders/test/fulfillment',{method:'POST',body:JSON.stringify(data)}),{HARDWARE_COMMERCE_ENABLED:'true'},deps),e=>e.status===400);
});

test('missing orders return a useful 404 and database failures are not mislabeled',async()=>{
 const event={id:'event-1',type:'shipment',occurredAt:'2026-11-04T15:00:00Z',carrier:'UPS',trackingNumber:'test',components:[{sku:'ecu',quantity:1}]};
 const req=()=>request('/admin/hardware-orders/test/fulfillment',{method:'POST',body:JSON.stringify({version:0,event})});
 const missing={HARDWARE_COMMERCE_ENABLED:'true',DB:{prepare(){return {bind(){return {first:async()=>null}}}}}};
 await assert.rejects(hardwareAdminRoute(req(),missing,deps),e=>e.status===404);
 const outage=new Error('Database unavailable');
 const broken={HARDWARE_COMMERCE_ENABLED:'true',DB:{prepare(){throw outage;}}};
 await assert.rejects(hardwareAdminRoute(req(),broken,deps),e=>e===outage&&!e.status);
});
