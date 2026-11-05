import test from 'node:test';
import assert from 'node:assert/strict';
import {invoicePaymentOptions} from '../src/payment-options.mjs';
const now=new Date('2026-11-04T18:00:00Z');
const verified=()=>({mode:'enabled',subscriptionStatus:'ACTIVE',paymentsEnabled:true,customerId:'customer',verifiedAt:now.toISOString()});
test('default does not disable or force QuickBooks Affirm',()=>{assert.deepEqual(invoicePaymentOptions(undefined,'customer',now),{});assert.deepEqual(invoicePaymentOptions({mode:'inherit'},'customer',now),{});});
test('verified active capability emits Intuit native invoice flag',()=>{assert.deepEqual(invoicePaymentOptions(verified(),'customer',now),{AllowOnlineAffirmPayment:true});});
test('unverified, inactive, wrong-customer and expired checks cannot force Affirm',()=>{
 for(const edit of [{subscriptionStatus:'PENDING'},{paymentsEnabled:false},{customerId:'other'},{verifiedAt:'2026-11-02T18:00:00Z'},{verifiedAt:null},{mode:'anything'}])assert.throws(()=>invoicePaymentOptions({...verified(),...edit},'customer',now));
});