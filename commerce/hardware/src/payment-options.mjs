import {HardwareError} from './errors.mjs';
// No separate Affirm integration: the Intuit-hosted invoice owns financing.
// Omitting the flag preserves QuickBooks' company default. Only a trusted
// server-side company capability check may explicitly request Affirm.
export function invoicePaymentOptions(affirm,customerId,now=new Date()){
 if(affirm===undefined||affirm?.mode==='inherit')return {};
 if(affirm?.mode!=='enabled')throw new HardwareError('Unsupported Affirm setting');
 const checked=Date.parse(affirm.verifiedAt);
 if(affirm.subscriptionStatus!=='ACTIVE'||affirm.paymentsEnabled!==true||String(affirm.customerId)!==String(customerId)||!Number.isFinite(checked)||checked>now.getTime()+5000||now.getTime()-checked>86400000)throw new HardwareError('Verify active QuickBooks Affirm capability before enabling it');
 return {AllowOnlineAffirmPayment:true};
}