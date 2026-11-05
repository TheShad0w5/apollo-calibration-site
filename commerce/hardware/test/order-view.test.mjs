import test from 'node:test';
import assert from 'node:assert/strict';
import {componentProgress,hardwareOrderPanel} from '../src/order-view.mjs';
const order={id:'test',paymentStatus:'paid',customer:{name:'<img src=x onerror=alert(1)>',email:'example@example.test'},lines:[{kind:'hardware',quantity:2,components:[{sku:'ECU',name:'ECU & harness',quantity:1}]}],fulfillmentEvents:[{type:'supplier_order',supplier:'Test',reference:'PO1',components:[{sku:'ECU',quantity:2}]},{type:'shipment',carrier:'Test',trackingNumber:'TRACK1',components:[{sku:'ECU',quantity:1}]}]};
test('component view distinguishes purchased, ordered and shipped quantities',()=>assert.deepEqual(componentProgress(order),[{sku:'ECU',name:'ECU & harness',quantity:2,ordered:2,shipped:1,remaining:1}]));
test('order panel escapes customer markup and shows separate payment and partial shipment state',()=>{const html=hardwareOrderPanel(order);assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));assert.ok(html.includes('Payment: Paid'));assert.ok(html.includes('Fulfillment: Partially shipped'));assert.ok(html.includes('ECU &amp; harness'));assert.ok(html.includes('TRACK1'));});

test('manual actions are unavailable for unpaid or held orders',()=>{
 for(const change of [{paymentStatus:'unpaid'},{hold:true}])assert.ok(!hardwareOrderPanel({...order,...change},{actions:true}).includes('<form'));
});

test('partial shipment form offers only remaining quantities and keeps zero defaults',()=>{
 const html=hardwareOrderPanel(order,{version:3,actions:true});
 assert.ok(html.includes('data-version="3"'));
 assert.ok(html.includes('data-event-type="shipment"'));
 assert.ok(!html.includes('data-event-type="supplier_order"'));
 assert.ok(html.includes('max="1" step="1" value="0"'));
 assert.ok(html.includes('role="status"'));
});
