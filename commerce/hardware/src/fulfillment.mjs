import {HardwareError} from './errors.mjs';
// Pure manual-fulfillment reducer. The future admin route must authenticate,
// load trusted payment state and persist events transactionally with a unique ID.
export function requiredComponents(lines) {
  const quantities=new Map();
  for(const line of lines){
    if(line.kind!=='hardware'||!Number.isSafeInteger(line.quantity)||line.quantity<1) throw new HardwareError('Invalid hardware order');
    for(const c of line.components||[]){
      const amount=c.quantity*line.quantity;
      if(!c.sku||!Number.isSafeInteger(amount)||amount<1) throw new HardwareError('Invalid component');
      quantities.set(c.sku,(quantities.get(c.sku)||0)+amount);
      if(!Number.isSafeInteger(quantities.get(c.sku))) throw new HardwareError('Quantity overflow');
    }
  }
  if(!quantities.size) throw new HardwareError('Hardware components required');
  return quantities;
}
export function fulfillmentStatus(order) {
  const required=requiredComponents(order.lines);
  const sent=new Map();
  for(const e of order.fulfillmentEvents||[]) if(e.type==='shipment') for(const c of e.components) sent.set(c.sku,(sent.get(c.sku)||0)+c.quantity);
  if([...required].every(([sku,n])=>(sent.get(sku)||0)>=n))return 'shipped';
  if(sent.size)return 'partially_shipped';
  if((order.fulfillmentEvents||[]).some(e=>e.type==='supplier_order'))return 'supplier_ordered';
  return 'awaiting_fulfillment';
}
export function recordFulfillment(order,event) {
  const events=order.fulfillmentEvents||[];
  if(!event.id||typeof event.id!=='string')throw new HardwareError('Event ID required');
  const previous=events.find(e=>e.id===event.id);
  if(previous){
    if(JSON.stringify(previous)!==JSON.stringify(event))throw new HardwareError('Event ID already used with different data',409);
    return structuredClone(order);
  }
  if(order.paymentStatus!=='paid'||order.hold===true)throw new HardwareError('Paid, unheld order required');
  if(!['supplier_order','shipment'].includes(event.type))throw new HardwareError('Unknown fulfillment event');
  if(!event.recordedBy||!Number.isFinite(Date.parse(event.occurredAt)))throw new HardwareError('Operator and date required');
  if(event.type==='supplier_order'&&(!event.supplier||!event.reference))throw new HardwareError('Supplier and order reference required');
  if(event.type==='shipment'&&(!event.carrier||!event.trackingNumber))throw new HardwareError('Carrier and tracking required');
  const required=requiredComponents(order.lines), used=new Map();
  for(const e of events.filter(e=>e.type===event.type))for(const c of e.components)used.set(c.sku,(used.get(c.sku)||0)+c.quantity);
  if(!Array.isArray(event.components)||!event.components.length)throw new HardwareError('Component quantities required');
  for(const c of event.components){
    if(!required.has(c.sku)||!Number.isSafeInteger(c.quantity)||c.quantity<1)throw new HardwareError('Invalid component quantity');
    used.set(c.sku,(used.get(c.sku)||0)+c.quantity);
    if(used.get(c.sku)>required.get(c.sku))throw new HardwareError('Quantity exceeds purchased components');
  }
  const result=structuredClone(order);
  result.fulfillmentEvents=[...structuredClone(events),structuredClone(event)];
  result.fulfillmentStatus=fulfillmentStatus(result);
  return result;
}

