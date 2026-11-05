import {HardwareError} from './errors.mjs';
import {snapshotHardwareLine} from './catalog.mjs';
const text=(value,max,label)=>{
 if(typeof value!=='string'||!value.trim()||value.trim().length>max||/[\x00-\x1f]/.test(value))throw new HardwareError('Invalid '+label);
 return value.trim();
};
// The caller resolves productId to a specific, verified vehicle variant on the
// server. Browser prices, accounting IDs, inventory and paid flags are ignored.
export function hardwareCheckoutIntake(input,{catalog,orderId,customerId},now=new Date()){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new HardwareError('Checkout details required');
 const model=input.vehicle?.model,year=Number(input.vehicle?.year);
 if(!['STI','WRX'].includes(model)||!Number.isInteger(year)||year<(model==='STI'?2004:2002)||year>(model==='STI'?2021:2014))throw new HardwareError('Unsupported vehicle year and model');
 const vehicle={year,model,market:text(input.vehicle.market,30,'vehicle market'),engine:text(input.vehicle.engine,100,'engine configuration'),transmission:text(input.vehicle.transmission,30,'transmission')};
 const product=catalog.find(p=>p.id===input.productId);
 if(!product)throw new HardwareError('Unknown hardware package');
 if(Object.keys(vehicle).some(k=>product.fitment?.[k]!==vehicle[k]))throw new HardwareError('Select the verified package variant for this vehicle');
 const line=snapshotHardwareLine(catalog,{productId:product.id,quantity:input.quantity},now);
 // Stale browser pages must show the updated price, never silently charge it.
 if(input.acceptedRevision!==line.revision||input.acceptedPriceCents!==line.priceCents)throw new HardwareError('Package price or revision changed; review the current offer',409);
 if(input.termsVersion!==product.returnsPolicyVersion||input.fulfillmentPolicyVersion!==product.fulfillmentPolicyVersion)throw new HardwareError('Review the current hardware terms',409);
 const customer={name:text(input.customer?.name,150,'customer name'),email:text(input.customer?.email,254,'customer email')};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))throw new HardwareError('Invalid customer email');
 const shipTo={};for(const key of ['Line1','City','CountrySubDivisionCode','PostalCode','Country'])shipTo[key]=text(input.shipTo?.[key],key==='Line1'?200:100,'shipping '+key);
 if(shipTo.Country!=='US'||!/^[A-Z]{2}$/.test(shipTo.CountrySubDivisionCode)||!/^\d{5}(-\d{4})?$/.test(shipTo.PostalCode))throw new HardwareError('A supported US shipping address is required');
 if(input.shipTo.Line2)shipTo.Line2=text(input.shipTo.Line2,200,'shipping Line2');
 if(input.acceptHardwareTerms!==true)throw new HardwareError('Hardware terms acceptance required');
 return {id:text(orderId,100,'order ID'),customerId:text(customerId,100,'accounting customer ID'),currency:'USD',customer,shipTo,vehicle,lines:[line],paymentStatus:'unpaid',fulfillmentEvents:[],hold:false,createdAt:now.toISOString(),termsAcceptance:{returnsPolicyVersion:product.returnsPolicyVersion,fulfillmentPolicyVersion:product.fulfillmentPolicyVersion,acceptedAt:now.toISOString()},checkoutState:'shipping_and_tax_required'};
}
