import {HardwareError} from './errors.mjs';
import {recordFulfillment,fulfillmentStatus} from './fulfillment.mjs';
import {reconcileHardwarePayment} from './payment-reconciliation.mjs';

export const hardwareSchema=`CREATE TABLE IF NOT EXISTS hardware_orders (
 id TEXT PRIMARY KEY,
 request_key TEXT NOT NULL UNIQUE,
 request_document TEXT NOT NULL CHECK(json_valid(request_document)),
 document TEXT NOT NULL CHECK(json_valid(document)),
 version INTEGER NOT NULL DEFAULT 0 CHECK(version >= 0),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);`;

// D1-compatible interface. Schema application is an explicit deployment step.
export async function loadHardwareOrder(db,id){
 const row=await db.prepare('SELECT document,version FROM hardware_orders WHERE id=?').bind(id).first();
 return row?{order:JSON.parse(row.document),version:row.version}:null;
}

// Provider evidence is retrieved by the server. A version check prevents a
// payment refresh from overwriting a concurrently recorded shipment or hold.
export async function saveHardwarePayment(db,id,expectedVersion,evidence,now){
 const current=await loadHardwareOrder(db,id);
 if(!current)throw new HardwareError('Hardware order not found',404);
 const next=reconcileHardwarePayment(current.order,evidence,new Date(now));
 const sameProof=(a,b)=>JSON.stringify({...a,observedAt:undefined})===JSON.stringify({...b,observedAt:undefined});
 if(current.order.paymentStatus===next.paymentStatus&&current.order.hold===next.hold&&sameProof(current.order.paymentEvidence,next.paymentEvidence))return current;
 if(current.version!==expectedVersion)throw new HardwareError('Order changed; reload before reconciling payment',409);
 const result=await db.prepare('UPDATE hardware_orders SET document=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(JSON.stringify(next),now,id,expectedVersion).run();
 if(result.meta?.changes!==1)throw new HardwareError('Order changed; reload before reconciling payment',409);
 return {order:next,version:expectedVersion+1};
}

// Trusted server-generated order only. Not a public request-body handler.
export async function createHardwareOrder(db,order,requestKey,now){
 if(!order.id||!requestKey||order.paymentStatus!=='unpaid')throw new HardwareError('New unpaid order and request key required');
 fulfillmentStatus(order); // Validate purchased hardware quantities.
 const document=JSON.stringify({...order,fulfillmentEvents:[],fulfillmentStatus:'awaiting_fulfillment'});
 await db.prepare('INSERT INTO hardware_orders(id,request_key,request_document,document,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING').bind(order.id,requestKey,document,document,now,now).run();
 const saved=await db.prepare('SELECT id,request_document,document,version FROM hardware_orders WHERE request_key=?').bind(requestKey).first();
 if(!saved||saved.id!==order.id||saved.request_document!==document)throw new HardwareError('Request key already belongs to another order',409);
 return {order:JSON.parse(saved.document),version:saved.version};
}

export async function saveFulfillmentEvent(db,orderId,expectedVersion,event,now){
 const current=await loadHardwareOrder(db,orderId);
 if(!current)throw new HardwareError('Hardware order not found',404);
 const existing=(current.order.fulfillmentEvents||[]).find(e=>e.id===event.id);
 // A lost response may be retried with an older version; return its original result.
 if(existing){recordFulfillment(current.order,event);return current;}
 if(current.version!==expectedVersion)throw new HardwareError('Order changed; reload before saving',409);
 const next=recordFulfillment(current.order,event);
 const result=await db.prepare('UPDATE hardware_orders SET document=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(JSON.stringify(next),now,orderId,expectedVersion).run();
 if(result.meta?.changes!==1)throw new HardwareError('Order changed; reload before saving',409);
 return {order:next,version:expectedVersion+1};
}

