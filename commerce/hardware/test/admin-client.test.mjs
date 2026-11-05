import test from 'node:test';
import assert from 'node:assert/strict';
import {bindHardwareForms} from '../src/admin-client.mjs';

function fixture(){
 const button={textContent:'Save shipment',disabled:false},status={textContent:''};
 const carrier={value:'Test carrier',disabled:false},tracking={value:'TRACK-1',disabled:false};
 const quantity={value:'1',dataset:{sku:'ECU'},disabled:false};
 let submit;
 const form={dataset:{orderId:'test',version:'0',eventType:'shipment'},reportValidity:()=>true,elements:{namedItem:name=>({carrier,trackingNumber:tracking})[name]},querySelector:s=>s.startsWith('button')?button:status,querySelectorAll:s=>s==='input'?[carrier,tracking,quantity]:[quantity],addEventListener:(_,fn)=>{submit=fn;}};
 return {root:{querySelectorAll:()=>[form]},button,status,tracking,quantity,submit:()=>submit({preventDefault(){}})};
}
test('lost response retries the identical event instead of creating a second shipment',async()=>{
 const ui=fixture(),bodies=[];let calls=0,saved=0;
 bindHardwareForms(ui.root,{onSaved:()=>{saved++;},request:async(_,options)=>{bodies.push(options.body);if(++calls===1)throw Error('Response lost');return Response.json({message:'Shipment saved.'});}});
 await ui.submit();assert.equal(ui.button.textContent,'Retry save');assert.equal(ui.tracking.disabled,true);
 await ui.submit();assert.equal(bodies[0],bodies[1]);assert.equal(saved,1);assert.equal(ui.button.disabled,true);assert.equal(ui.button.textContent,'Saved');
});
test('double submit during an outstanding save sends only one request',async()=>{
 const ui=fixture();let resolve,calls=0;
 const response=new Promise(r=>{resolve=r;});
 bindHardwareForms(ui.root,{onSaved:()=>{},request:()=>{calls++;return response;}});
 const first=ui.submit();await ui.submit();assert.equal(calls,1);
 resolve(Response.json({message:'Saved'}));await first;
});
test('version conflict requires reload instead of retrying stale quantities',async()=>{
 const ui=fixture();bindHardwareForms(ui.root,{onSaved:()=>assert.fail('must not render success'),request:async()=>Response.json({error:'Order changed'},{status:409})});
 await ui.submit();assert.equal(ui.button.disabled,true);assert.equal(ui.tracking.disabled,true);assert.match(ui.status.textContent,/Reload/);
});
test('a display refresh failure does not turn an acknowledged save into a retry',async()=>{
 const ui=fixture();bindHardwareForms(ui.root,{onSaved:()=>{throw Error('Render failed');},request:async()=>Response.json({message:'Shipment saved.'})});
 await ui.submit();assert.equal(ui.button.textContent,'Saved');assert.equal(ui.button.disabled,true);assert.match(ui.status.textContent,/saved update/);
});
