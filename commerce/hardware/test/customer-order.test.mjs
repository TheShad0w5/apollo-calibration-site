import test from 'node:test';
import assert from 'node:assert/strict';
import {customerHardwareOrder} from '../src/customer-order.mjs';

const fixture=()=>({id:'test-order',paymentStatus:'paid',privateNotes:'internal-only',customer:{email:'private@example.test'},supplierCost:123,lines:[{kind:'hardware',id:'ecu-kit',name:'ECU kit',option:'complete-package',quantity:1,currency:'USD',priceCents:10000,subtotalCents:10000,qboItemId:'secret-accounting-item',components:[{sku:'ECU',name:'ECU',quantity:1,dealerCost:123},{sku:'HARNESS',name:'Harness',quantity:1}]}],fulfillmentEvents:[{id:'supplier-1',type:'supplier_order',supplier:'Internal supplier',reference:'private-po',recordedBy:'internal-admin',components:[{sku:'ECU',quantity:1}]},{id:'shipment-1',type:'shipment',carrier:'Example',trackingNumber:'TRACK-1',occurredAt:'2026-11-04T12:00:00Z',recordedBy:'internal-admin',privateNotes:'internal shipment note',components:[{sku:'ECU',quantity:1}]}]});

test('customer order includes shipment evidence without internal procurement or accounting data',()=>{
 const result=customerHardwareOrder(fixture()),text=JSON.stringify(result);
 assert.equal(result.fulfillmentStatus,'partially_shipped');assert.equal(result.shipments[0].trackingNumber,'TRACK-1');
 for(const forbidden of ['internal','private-po','dealerCost','supplierCost','qboItemId','private@example.test'])assert.ok(!text.includes(forbidden));
});
test('payment does not imply shipment and customer projection is independent of future mutations',()=>{
 const source=fixture();source.fulfillmentEvents=[];
 const result=customerHardwareOrder(source);assert.equal(result.paymentStatus,'paid');assert.equal(result.fulfillmentStatus,'awaiting_fulfillment');assert.deepEqual(result.shipments,[]);
 source.lines[0].components[0].name='Changed';assert.equal(result.lines[0].components[0].name,'ECU');
});

