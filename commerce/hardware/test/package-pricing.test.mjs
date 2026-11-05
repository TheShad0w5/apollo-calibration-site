import test from 'node:test';
import assert from 'node:assert/strict';
import {packagePriceOffer,s3Promotion} from '../src/package-pricing.mjs';
test('S3 totals use sale during promotion and restore normal at expiry',()=>{
 for(const [id,regular,sale] of [['sti-haltech-s3-basic',330400,307900],['sti-haltech-s3',386500,364000]]){
  assert.equal(packagePriceOffer(id,new Date(Date.parse(s3Promotion.startsAt)-1)).priceCents,regular);
  assert.equal(packagePriceOffer(id,new Date(s3Promotion.startsAt)).priceCents,sale);
  assert.equal(packagePriceOffer(id,new Date(Date.parse(s3Promotion.endsAt)-1)).priceCents,sale);
  const expired=packagePriceOffer(id,new Date(s3Promotion.endsAt));assert.equal(expired.priceCents,regular);assert.equal(expired.sale,false);assert.equal(expired.endsAt,null);
 }
});
test('unconfirmed packages have no checkout offer',()=>{for(const id of ['sti-link-wrx11x','sti-emtron-kv8','missing'])assert.equal(packagePriceOffer(id),null)});
