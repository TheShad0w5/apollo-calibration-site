// Public USD package totals from the November 2026 Haltech retail sheet,
// verified Boomslang application prices and current manufacturer S3 promotion.
// A price offer alone does not activate a draft catalog variant or approve fitment.
export const s3Promotion={startsAt:'2026-10-30T00:00:00+11:00',endsAt:'2026-12-09T00:00:00+11:00',discountCents:22500,reference:'https://www.haltech.com/haltech-40th-birthday-sale-terms-and-conditions/'};
const normal={'sti-haltech-s3-basic':330400,'sti-haltech-s3':386500};
export function packagePriceOffer(productId,now=new Date()){
 const regularPriceCents=normal[productId];
 if(regularPriceCents===undefined)return null;
 const time=now.getTime();if(!Number.isFinite(time))throw new Error('Valid price evaluation time required');
 const sale=time>=Date.parse(s3Promotion.startsAt)&&time<Date.parse(s3Promotion.endsAt);
 return {productId,currency:'USD',regularPriceCents,priceCents:regularPriceCents-(sale?s3Promotion.discountCents:0),sale,endsAt:sale?s3Promotion.endsAt:null,reference:sale?s3Promotion.reference:'Haltech November 2026 public retail sheet and verified Boomslang application pricing'};
}
