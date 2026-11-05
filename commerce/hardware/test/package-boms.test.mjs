import test from 'node:test';
import assert from 'node:assert/strict';
import {packages,publicProduct} from '../src/catalog.mjs';
test('S3 Basic keeps installation measurements distinct from protection sensors',()=>{
 const p=packages.find(p=>p.id==='sti-haltech-s3-basic');
 assert.ok(p.components.some(c=>c.name.includes('Boomslang Nexus S3')));
 assert.ok(p.components.some(c=>c.name.includes('LSU4.9')));
 assert.ok(p.components.some(c=>c.name.includes('air-temperature')));
 assert.ok(!p.components.some(c=>['HT-010904','HT-010306'].includes(c.sku)));
 assert.equal(publicProduct(p),null);
});
test('draft BOMs never activate unverified hardware checkout',()=>{
 for(const p of packages){assert.ok(p.components.length);assert.equal(publicProduct(p),null);assert.equal(p.priceCents,null);assert.ok(p.components.every(c=>c.verified===false));}
});
test('Link package has external wideband and current CAN cable without adapter',()=>{
 const p=packages.find(p=>p.id==='sti-link-wrx11x');
 assert.ok(p.components.some(c=>c.sku==='125-1000'));
 assert.ok(p.components.some(c=>c.name.includes('101-0198')));
 assert.ok(!p.components.some(c=>c.sku?.startsWith('BF')));
});
test('Emtron package has separate pre/post throttle and exhaust pressure measurements',()=>{
 const p=packages.find(p=>p.id==='sti-emtron-kv8');
 for(const text of ['Pre-throttle','Post-throttle','Exhaust manifold','EMAP damper','heat-resistant'])assert.ok(p.components.some(c=>c.name.includes(text)));
});
test('ECU-only options do not acquire package sensors',()=>{
 for(const p of packages.filter(p=>p.option==='ecu-only')){assert.equal(p.components.length,1);assert.equal(p.components[0].sku,p.ecuSku);}
});

