import {fulfillmentStatus} from './fulfillment.mjs';

// Call only after verifying the private customer-order capability/session.
// This projection is not an authorization boundary and has no public route yet.
export function customerHardwareOrder(order){
 return {
  id:order.id,
  paymentStatus:order.paymentStatus,
  fulfillmentStatus:fulfillmentStatus(order),
  onHold:order.hold===true,
  lines:order.lines.map(line=>({
   id:line.id,name:line.name,option:line.option,quantity:line.quantity,
   currency:line.currency,priceCents:line.priceCents,subtotalCents:line.subtotalCents,
   components:line.components.map(c=>({sku:c.sku,name:c.name,quantity:c.quantity}))
  })),
  shipments:(order.fulfillmentEvents||[]).filter(e=>e.type==='shipment').map(e=>({
   id:e.id,recordedAt:e.occurredAt,carrier:e.carrier,trackingNumber:e.trackingNumber,
   components:e.components.map(c=>({sku:c.sku,quantity:c.quantity}))
  }))
 };
}
