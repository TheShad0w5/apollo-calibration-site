import {bindHardwareForms} from './admin-client.mjs';
import {hardwareOrderPanel} from './order-view.mjs';
const root=document.querySelector('#hardware-content');
function bind(){bindHardwareForms(root,{onSaved(result){
 root.innerHTML=hardwareOrderPanel(result.order,{version:result.version,actions:true});
 const message=document.querySelector('#hardware-save-message');message.textContent=result.message||'Saved successfully.';message.scrollIntoView({block:'nearest'});
 bind();
}});}
if(root)bind();
