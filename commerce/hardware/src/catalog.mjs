import {draftComponents} from './package-boms.mjs';
// Hardware catalog foundation. Not connected to production routes yet.
export const packages = [
  {id:'sti-link-wrx11x', family:'link-wrx11x', option:'complete-package', name:'Subaru WRX / STI Link Plug-In Protection Package', ecuSku:null},
  {id:'sti-haltech-s3', family:'haltech-s3', option:'complete-package', name:'Subaru WRX / STI Haltech S3 Protection Package', ecuSku:'HT-213000'},
  {id:'sti-emtron-kv8', family:'emtron-kv8', option:'complete-package', name:'Subaru WRX / STI Emtron KV8 TMF/EMAP Package', ecuSku:'1122-082'},
  {id:'link-wrx11x-ecu-only', family:'link-wrx11x', option:'ecu-only', name:'Subaru Link plug-in — ECU only, application selected', ecuSku:null},
  {id:'haltech-s3-ecu-only', family:'haltech-s3', option:'ecu-only', name:'Haltech Nexus S3 — ECU only', ecuSku:'HT-213000'},
  {id:'emtron-kv8-ecu-only', family:'emtron-kv8', option:'ecu-only', name:'Emtron KV8 — ECU only', ecuSku:'1122-082'}
  ,{id:'sti-haltech-s3-basic', family:'haltech-s3', option:'basic-package', name:'Subaru WRX / STI Haltech S3 Basic', ecuSku:'HT-213000'}
].map(p => ({...p, revision:1, status:'draft', currency:'USD',
  applications:[{model:'STI',yearFrom:2004,yearTo:2021},{model:'WRX',yearFrom:2002,yearTo:2014}],
  fitment:{year:null,market:null,model:null,engine:null,transmission:null,verified:false},
  components:[], priceCents:null, pricingApproval:null, availability:null,
  fulfillmentPolicyVersion:null, returnsPolicyVersion:null, qboItemId:null
})).map(product=>({...product,components:draftComponents(product)}));

export function publicationIssues(product, now = new Date()) {
  const issues=[];
  if(product.status!=='active') issues.push('Package is unpublished');
  if(!product.fitment?.verified) issues.push('Exact fitment needs confirmation');
  if(!Array.isArray(product.components)||!product.components.length||product.components.some(c=>!c.sku||!c.name||!Number.isSafeInteger(c.quantity)||c.quantity<1||c.verified!==true)) issues.push('Component list is incomplete');
  if(!Number.isSafeInteger(product.priceCents)||product.priceCents<=0) issues.push('Public price is unconfirmed');
  const approval=product.pricingApproval;
  if(!approval?.reference||approval.bundleApproved!==true||!Number.isFinite(Date.parse(approval.validUntil))||Date.parse(approval.validUntil)<=now.getTime()) issues.push('Current price and bundle approval required');
  if(approval?.productId!==product.id||approval?.revision!==product.revision||approval?.currency!==product.currency||approval?.approvedPriceCents!==product.priceCents) issues.push('Pricing approval does not match this product revision and price');
  if(!product.availability?.confirmed||!Number.isSafeInteger(product.availability.availableQuantity)||product.availability.availableQuantity<1||!Number.isFinite(Date.parse(product.availability.validUntil))||Date.parse(product.availability.validUntil)<=now.getTime()) issues.push('Availability needs confirmation');
  if(!product.fulfillmentPolicyVersion||!product.returnsPolicyVersion) issues.push('Hardware fulfillment and returns terms required');
  if(!product.qboItemId) issues.push('Hardware accounting item required');
  return issues;
}

// Explicit projection: never serialize internal supplier costs or pricing evidence.
export function publicProduct(product, now) {
  if(publicationIssues(product,now).length) return null;
  return {id:product.id,name:product.name,family:product.family,option:product.option,revision:product.revision,currency:product.currency,
    priceCents:product.priceCents,fitment:Object.fromEntries(['year','market','model','engine','transmission','verified'].map(key=>[key,product.fitment[key]])),
    components:product.components.map(({name,quantity})=>({name,quantity})),
    fulfillmentPolicyVersion:product.fulfillmentPolicyVersion,returnsPolicyVersion:product.returnsPolicyVersion};
}

// Called only by the server after resolving an ID from its own catalog.
// Shipping/tax and inventory reservation must be added before invoice creation.
export function snapshotHardwareLine(catalog, request, now) {
  const product=catalog.find(p=>p.id===request.productId);
  if(!product) throw new Error('Unknown hardware package');
  const issues=publicationIssues(product,now);
  if(issues.length) throw new Error(issues.join('; '));
  const quantity=request.quantity;
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>product.availability.availableQuantity) throw new Error('Invalid or unavailable quantity');
  const subtotalCents=product.priceCents*quantity;
  if(!Number.isSafeInteger(subtotalCents)) throw new Error('Amount exceeds supported range');
  return {...publicProduct(product,now),kind:'hardware',quantity,subtotalCents,
    components:product.components.map(({sku,name,quantity})=>({sku,name,quantity})),
    qboItemId:product.qboItemId,fulfillmentStatus:'unfulfilled',revisionAllowance:null};
}


