(function(){
'use strict';
const form=document.getElementById('service-finder'),out=document.getElementById('finder-result');if(!form||!out)return;
const choices={job:['new','retune','base','project'],vehicle:['ej','va','vb','porsche','other'],platform:['ap','standalone','other'],fuel:['single','flex','unsure']};
const guides={ej:['EJ WRX / STI preparation','/ej-wrx-sti-etuning.html'],va:['2015–2021 WRX preparation','/2015-2021-wrx-etuning.html'],vb:['2022+ WRX preparation','/2022-plus-wrx-etuning.html'],porsche:['Porsche tuning','/porsche-tuning.html'],other:['Platform coverage','/cobb-custom-tuning.html']};
const prices={'ap-single':400,'ap-flex':600,'standalone-single':500,'standalone-flex':750,'ap-single-retune':200,'ap-flex-retune':300,'standalone-single-retune':250,'standalone-flex-retune':500};
function projectUrl(v){
 const params=new URLSearchParams({finder:'1'});
 for(const key of Object.keys(choices))params.set('finder_'+key,v[key]);
 return '/shop.html?'+params.toString()+'#request';
}
function result(v){
 const guide=v.platform==='standalone'?['Standalone preparation','/standalone-ecu-tuning.html']:guides[v.vehicle];
 if(v.job==='project'||v.platform==='other'||v.fuel==='unsure')return {title:'Start with a project review.',body:'This needs a little more detail before choosing a paid service. Your selections carry into the inquiry for you to check. Add the exact year and model, ECU or tuning tool, parts list, fuel and what you want the car to do.',href:projectUrl(v),cta:'Send project details',guide};
 if(v.job==='base')return {title:'Base map · $50',body:'A starting calibration for an approved setup, not a finished tune or clearance for full-load driving. Confirm the hardware and intended use before ordering.',href:'/shop.html#base-map',cta:'Read the base-map scope',guide};
 const key=v.platform+'-'+v.fuel+(v.job==='retune'?'-retune':'');
 const title=(v.platform==='ap'?'Accessport':'Standalone')+' '+(v.fuel==='flex'?'flex-fuel':'single-fuel')+(v.job==='retune'?' retune':' tune')+' · $'+prices[key];
 let body='This is the service to review for your setup. Hardware, licenses and mechanical readiness still need to be confirmed before tuning.';
 if(v.job==='retune')body+=' Retunes are for an existing Keith calibration; include your previous order and what changed.';
 if(v.fuel==='flex')body+=' Flex fuel requires compatible ECU support, ethanol measurement and a suitable fuel system. The service does not include that hardware.';
 return {title,body,href:'/shop.html#'+key,cta:'See this service and what’s included',guide};
}
form.addEventListener('submit',function(e){
 e.preventDefault();if(!form.reportValidity())return;
 const data=Object.fromEntries(new FormData(form));
 if(!Object.entries(choices).every(([key,values])=>values.includes(data[key])))return;
 const r=result(data);out.replaceChildren();
 const title=document.createElement('h3');title.textContent=r.title;
 const p=document.createElement('p');p.textContent=r.body;
 const links=document.createElement('div');links.className='finder-links';
 for(const [label,url,primary] of [[r.cta,r.href,true],[r.guide[0],r.guide[1],false]]){
  const a=document.createElement('a');a.textContent=label+' →';a.href=url;if(primary)a.className='button';links.append(a);
 }
 out.append(title,p,links);
 if(data.platform==='other'&&(data.vehicle==='va'||data.vehicle==='vb')){
  const note=document.createElement('p');note.textContent='Considering Atlas? Exact year, transmission, market and ECU identification still need review. Accessport pricing does not apply. ';
  const a=document.createElement('a');a.href='/atlas-wrx-tuning.html';a.textContent='Read the Atlas WRX guide →';note.append(a);out.append(note);
 }
 out.hidden=false;out.setAttribute('tabindex','-1');out.focus({preventScroll:true});
 out.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
});
form.addEventListener('change',()=>{out.hidden=true;out.replaceChildren();});
})();
