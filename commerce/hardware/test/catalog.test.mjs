import test from 'node:test';
import assert from 'node:assert/strict';
import {packages,publicationIssues,publicProduct,snapshotHardwareLine} from '../src/catalog.mjs';
const now=new Date('2026-11-04T12:00:00Z');
function fixture(){return {...structuredClone(packages[1]),status:'active',fitment:{year:2020,market:'USDM',model:'STI',engine:'EJ257',transmission:'manual',verified:true},components:[{sku:'TEST-ONLY',name:'Fixture component',quantity:1,verified:true,dealerCost:1}],priceCents:10000,pricingApproval:{reference:'test evidence',bundleApproved:true,validUntil:'2026-11-05',productId:packages[1].id,revision:1,currency:'USD',approvedPriceCents:10000},availability:{confirmed:true,availableQuantity:2,validUntil:'2026-11-05'},fulfillmentPolicyVersion:'test-1',returnsPolicyVersion:'test-1',qboItemId:'test-only',dealerCost:100};}
test('all real package drafts are excluded from sale',()=>{for(const p of packages){assert.equal(publicProduct(p,now),null);assert.throws(()=>snapshotHardwareLine(packages,{productId:p.id,quantity:1},now));}});
test('each release requirement independently blocks checkout',()=>{for(const change of [{status:'draft'},{fitment:{verified:false}},{components:[]},{priceCents:null},{pricingApproval:null},{availability:null},{fulfillmentPolicyVersion:null},{returnsPolicyVersion:null},{qboItemId:null}]){const p={...fixture(),...change};assert.ok(publicationIssues(p,now).length);assert.equal(publicProduct(p,now),null);}});
test('expired price and inventory evidence blocks checkout',()=>{for(const key of ['pricingApproval','availability']){const p=fixture();p[key].validUntil='2026-11-03';assert.ok(publicationIssues(p,now).length);}});
test('client price is ignored and hardware remains unfulfilled',()=>{const p=fixture();const line=snapshotHardwareLine([p],{productId:p.id,quantity:2,priceCents:1,subtotalCents:1,partner:'awd',paid:true},now);assert.equal(line.subtotalCents,20000);assert.equal(line.fulfillmentStatus,'unfulfilled');assert.equal(line.revisionAllowance,null);assert.equal(line.kind,'hardware');});
test('invalid quantities and unknown IDs are rejected',()=>{const p=fixture();for(const quantity of [0,-1,1.5,3,'1',NaN])assert.throws(()=>snapshotHardwareLine([p],{productId:p.id,quantity},now));assert.throws(()=>snapshotHardwareLine([p],{productId:'missing',quantity:1},now));});
test('public data omits dealer costs and private approvals',()=>{const json=JSON.stringify(publicProduct(fixture(),now));assert.ok(!json.includes('dealerCost'));assert.ok(!json.includes('pricingApproval'));assert.ok(!json.includes('qboItemId'));});

test('private fitment evidence stays out of product and purchase projections',()=>{
 const p=fixture();
 p.fitment.supplierNotes='PRIVATE supplier discussion';
 p.fitment.evidence={dealerCost:123,contact:'PRIVATE contact'};
 for(const view of [publicProduct(p,now),snapshotHardwareLine([p],{productId:p.id,quantity:1},now)]){
  assert.deepEqual(view.fitment,{year:2020,market:'USDM',model:'STI',engine:'EJ257',transmission:'manual',verified:true});
  assert.ok(!JSON.stringify(view).includes('PRIVATE'));
 }
});
test('purchase snapshot does not change with later catalog edits',()=>{const p=fixture();const line=snapshotHardwareLine([p],{productId:p.id,quantity:1},now);p.priceCents=20000;p.components[0].name='Changed';p.fitment.year=2021;assert.equal(line.priceCents,10000);assert.equal(line.components[0].name,'Fixture component');assert.equal(line.fitment.year,2020);});

test('each ECU family offers separate ECU-only and complete-package drafts',()=>{
 assert.equal(new Set(packages.map(p=>p.id)).size,7);
 for(const family of ['link-wrx11x','haltech-s3','emtron-kv8'])assert.deepEqual(packages.filter(p=>p.family===family).map(p=>p.option).sort(),family==='haltech-s3'?['basic-package','complete-package','ecu-only']:['complete-package','ecu-only']);
});

test('selected option and its own price are retained in the purchase snapshot',()=>{
 const bundle=fixture(),ecu={...fixture(),id:'fixture-ecu-only',option:'ecu-only',priceCents:7000};
 ecu.pricingApproval={...ecu.pricingApproval,productId:ecu.id,approvedPriceCents:7000};
 const line=snapshotHardwareLine([bundle,ecu],{productId:ecu.id,quantity:1,option:'complete-package'},now);
 assert.equal(line.option,'ecu-only');assert.equal(line.subtotalCents,7000);assert.equal(line.id,ecu.id);
});

test('price approval cannot be reused after changing amount, currency, product or revision',()=>{
 for(const change of [{priceCents:9000},{currency:'AUD'},{id:'different-ecu'},{revision:2}]){
  const p={...fixture(),...change};
  assert.equal(publicProduct(p,now),null);
  assert.throws(()=>snapshotHardwareLine([p],{productId:p.id,quantity:1},now),/Pricing approval does not match/);
 }
});

