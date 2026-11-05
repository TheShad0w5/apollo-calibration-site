import {loadHardwareOrder,saveFulfillmentEvent} from './repository.mjs';
import {HardwareError} from './errors.mjs';

// Mount after the existing sessionRequest conversion and same-origin checks.
// Feature remains off until migration and full checkout integration are ready.
export async function hardwareAdminRoute(req,env,{admin,body,json,fail}){
 const path=new URL(req.url).pathname;
 if(path!=='/admin/hardware-orders'&&!path.startsWith('/admin/hardware-orders/'))return null;
 admin(req,env);
 if(env.HARDWARE_COMMERCE_ENABLED!=='true')return json({error:'Hardware ordering is not enabled'},503);
 if(path==='/admin/hardware-orders'){
  if(req.method!=='GET')fail(405,'Method not allowed');
  const url=new URL(req.url),offset=Number(url.searchParams.get('offset')||0);
  if(!Number.isSafeInteger(offset)||offset<0)fail(400,'Invalid offset');
  const rows=await env.DB.prepare('SELECT id,document,version,created_at FROM hardware_orders ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET ?').bind(offset).all();
  const items=(rows.results||[]).slice(0,50).map(r=>{const o=JSON.parse(r.document);return {id:r.id,version:r.version,createdAt:r.created_at,name:o.customer?.name||'',paymentStatus:o.paymentStatus,fulfillmentStatus:o.fulfillmentStatus,lines:(o.lines||[]).map(l=>({name:l.name,quantity:l.quantity}))};});
  return json({orders:items,nextOffset:(rows.results||[]).length>50?offset+50:null});
 }
 const match=path.match(/^\/admin\/hardware-orders\/([A-Za-z0-9_-]{1,100})(\/fulfillment)?$/);
 if(!match)fail(404,'Not found');
 if(req.method==='GET'&&!match[2]){
  const result=await loadHardwareOrder(env.DB,match[1]);
  if(!result)fail(404,'Hardware order not found');
  return json(result);
 }
 if(req.method!=='POST'||!match[2])fail(405,'Method not allowed');
 const data=await body(req);
 if(!data||typeof data!=='object'||!Number.isSafeInteger(data.version)||data.version<0||!data.event||typeof data.event!=='object'||Array.isArray(data.event))fail(400,'Version and fulfillment action required');
 const input=data.event;
 const bounded=v=>typeof v==='string'&&v.trim().length>0&&v.length<=200&&!/[\x00-\x1f]/.test(v);
 if(!bounded(input.id)||!bounded(input.occurredAt)||!Number.isFinite(Date.parse(input.occurredAt))||!['supplier_order','shipment'].includes(input.type)||!Array.isArray(input.components)||input.components.length===0||input.components.length>100)fail(400,'Invalid fulfillment action');
 for(const c of input.components)if(!c||typeof c!=='object'||!bounded(c.sku)||!Number.isSafeInteger(c.quantity)||c.quantity<1)fail(400,'Invalid component quantity');
 const event={id:input.id,type:input.type,occurredAt:input.occurredAt,recordedBy:'authenticated-admin',components:input.components.map(c=>({sku:c.sku,quantity:c.quantity}))};
 for(const key of input.type==='shipment'?['carrier','trackingNumber']:['supplier','reference']){
  if(!bounded(input[key]))fail(400,'Missing or invalid '+key);
  event[key]=input[key];
 }
 for(const c of event.components)if(!bounded(c.sku)||!Number.isSafeInteger(c.quantity)||c.quantity<1)fail(400,'Invalid component quantity');
 let result;
 try{result=await saveFulfillmentEvent(env.DB,match[1],data.version,event,new Date().toISOString());}
 catch(error){if(error instanceof HardwareError)fail(error.status,error.message);throw error;}
 return json({...result,message:input.type==='shipment'?'Shipment saved.':'Supplier order recorded.'});
}
