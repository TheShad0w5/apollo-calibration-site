// Mount only in the authenticated admin shell. Never embeds credentials.
const bound=new WeakSet();
export function bindHardwareForms(root,{onSaved,request=fetch}){
 for(const form of root.querySelectorAll('.fulfillment-form')){
  if(bound.has(form))continue;
  bound.add(form);
  let pending=null,busy=false;
  const button=form.querySelector('button[type="submit"]'),status=form.querySelector('.save-status');
  const originalLabel=button.textContent;
  const lockFields=locked=>{for(const input of form.querySelectorAll('input'))input.disabled=locked;};
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   if(busy)return;
   if(!pending){
    if(!form.reportValidity())return;
    const components=[...form.querySelectorAll('[data-sku]')].map(input=>({sku:input.dataset.sku,quantity:Number(input.value)})).filter(c=>c.quantity>0);
    if(!components.length){status.textContent='Choose at least one component quantity before saving.';return;}
    const event={id:crypto.randomUUID(),type:form.dataset.eventType,occurredAt:new Date().toISOString(),components};
    for(const name of event.type==='shipment'?['carrier','trackingNumber']:['supplier','reference'])event[name]=form.elements.namedItem(name).value.trim();
    pending={version:Number(form.dataset.version),event};
   }
   busy=true;button.disabled=true;lockFields(true);status.textContent='Saving…';
   let saved;
   try{
    const response=await request('/admin/hardware-orders/'+encodeURIComponent(form.dataset.orderId)+'/fulfillment',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(pending)});
    const result=await response.json();
    if(!response.ok){
     if(response.status===409||response.status===404){status.textContent=(result.error||'This order changed.')+' Reload the order before continuing.';button.textContent='Reload order to continue';return;}
     if(response.status>=400&&response.status<500){pending=null;lockFields(false);status.textContent=result.error||'Unable to save. Check your session and details.';button.disabled=false;button.textContent=originalLabel;return;}
     throw Error('Save not confirmed');
    }
    saved=result;
   }catch{
    status.textContent='The save could not be confirmed. Retry this same action; its reference is preserved to prevent duplication.';
    button.textContent='Retry save';button.disabled=false;
    return;
   }finally{busy=false;}
   // Once acknowledged, never resubmit even if the display refresh fails.
   pending=null;button.textContent='Saved';status.textContent=saved.message||'Saved successfully.';
   try{await onSaved(saved);}catch{status.textContent+=' The display could not refresh. Reload the order to see the saved update.';}
  });
 }
}
