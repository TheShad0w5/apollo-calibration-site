(function(){
'use strict';
const form=document.getElementById('service-finder'),out=document.getElementById('finder-result');if(!form||!out)return;
const choices={job:['new','retune','base','project'],vehicle:['ej','va','vb','brz-fa20','brz-fa24','porsche','other'],platform:['ap','ecutek','standalone','other'],fuel:['single','flex','unsure']};
const guides={ej:['EJ WRX / STI preparation','/ej-wrx-sti-etuning.html'],va:['2015–2021 WRX preparation','/2015-2021-wrx-etuning.html'],vb:['2022+ WRX preparation','/2022-plus-wrx-etuning.html'],porsche:['Porsche tuning','/porsche-tuning.html'],other:['Platform coverage','/cobb-custom-tuning.html']};
const ecutekGuide=['EcuTek equipment and licensing','/knowledge/ecutek.html#ecu-connect-kits'];
const ecutekGenerations={'brz-fa20':'fa20','brz-fa24':'fa24'};
const prices={'ap-single':400,'ap-flex':600,'standalone-single':500,'standalone-flex':750,'ap-single-retune':200,'ap-flex-retune':300,'standalone-single-retune':250,'standalone-flex-retune':500};
function projectUrl(v){
 const params=new URLSearchParams({finder:'1'});
 for(const key of Object.keys(choices))params.set('finder_'+key,v[key]);
 return '/shop.html?'+params.toString()+'#request';
}
function result(v){
 const generation=Object.hasOwn(ecutekGenerations,v.vehicle)?ecutekGenerations[v.vehicle]:null;
 if(generation&&v.job==='new'&&['ecutek','other'].includes(v.platform)){
  const params=new URLSearchParams({generation});
  if(v.fuel==='flex')params.set('plan','boosted-flex');
  return {
   title:'EcuTek '+generation.toUpperCase()+' setup review',
   body:'Naturally aspirated calibration is $400, boosted single-fuel starts at $500, and boosted flex-fuel starts at $750. Choose your package and send your setup to Keith for a quote.',
   href:'https://tbk-store-production.keith-787.workers.dev/ecutek?'+params,
   cta:'Choose an EcuTek package',
   guide:ecutekGuide
  };
 }
 const guide=v.platform==='standalone'?['Standalone preparation','/standalone-ecu-tuning.html']:generation||v.platform==='ecutek'?ecutekGuide:guides[v.vehicle];
 if(v.platform==='ecutek'||(generation&&v.platform==='ap')){
  return {title:'Request a setup review.',body:'Send the exact year, engine, tuning device and what you need so Keith can confirm compatibility and scope.',href:projectUrl(v),cta:'Send setup details',guide};
 }
 if(v.job==='project'||v.platform==='other'||v.fuel==='unsure')return {title:'Start with a project review.',body:'This needs a little more detail before choosing a paid service. Your selections carry into the inquiry for you to check. Add the exact year and model, ECU or tuning tool, parts list, fuel and what you want the car to do.',href:projectUrl(v),cta:'Send project details',guide};
 if(v.job==='base')return {title:'Base map · $50',body:'A starting calibration for an approved setup, not a finished tune or clearance for full-load driving. Confirm the hardware and intended use before ordering.',href:'/checkout?service=base-map#setup',cta:'Continue with $50 base map',guide};
 const key=v.platform+'-'+v.fuel+(v.job==='retune'?'-retune':'');
 const title=(v.platform==='ap'?'Accessport':'Standalone')+' '+(v.fuel==='flex'?'flex-fuel':'single-fuel')+(v.job==='retune'?' retune':' tune')+' · $'+prices[key];
 let body='This is the service to review for your setup. Hardware, licenses and mechanical readiness still need to be confirmed before tuning.';
 if(v.job==='retune')body+=' Retunes are for an existing Keith calibration; include your previous order and what changed.';
 if(v.fuel==='flex')body+=' Flex fuel requires compatible ECU support, ethanol measurement and a suitable fuel system. The service does not include that hardware.';
 return {title,body,href:'/checkout?service='+key+'#setup',cta:'Continue with $'+prices[key]+' '+(v.job==='retune'?'retune':'tune'),guide};
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
 if(r.href.startsWith('/checkout?')){
  const scope=document.createElement('p');scope.className='finder-scope';
  scope.textContent=data.job==='base'?'Starting calibration only. Follow-up tuning is separate.':data.job==='retune'?'For an existing Keith calibration. Eligibility and the changes to your setup are reviewed before work begins.':data.platform==='standalone'?'Includes four one-hour live tuning sessions for your approved setup, scheduled subject to availability. Agree on dates with Keith before booking a dyno or making other arrangements. Additional session time is quoted separately.':(data.fuel==='flex'?'Up to 12 revisions':'Up to 8 revisions')+' within the approved setup. Initial map and each revision: usually same business day, within one business day once the required information is received. Monday–Friday, 8 a.m.–6 p.m. Pacific.';
  out.append(scope);
  const portal=document.createElement('p');portal.className='finder-scope';portal.textContent='Enter your exact vehicle details next. Compatibility is reviewed before file delivery. Files, requested logs and messages stay on your private order page. Hardware, licensing and diagnostics are separate.';out.append(portal);
  const compare=document.createElement('a');compare.href='/shop.html#'+(data.job==='base'?'base-map':data.platform+'-'+data.fuel+(data.job==='retune'?'-retune':''));compare.textContent='Compare this service before ordering →';out.append(compare);
 }
 if(data.job==='new'&&r.href.startsWith('/checkout?')){
  const proof=document.createElement('p');proof.className='finder-proof';
  const standalone=data.platform==='standalone';
  proof.textContent=standalone?'From Keith’s AWD Tuning work: Lucas’s Emtron STI paired three SI-Drive power modes with a documented 564.5 hp E80 report. ':'From Keith’s AWD Tuning work: Cinderelli’s 2024 WRX E70 feature reported 388 whp / 417 wtq. ';
  const link=document.createElement('a');link.href=standalone?'/lucas-2018-sti-emtron.html':'/2024-wrx-cinderelli-e70.html';link.textContent='See the build and source records →';proof.append(link);out.append(proof);
  const note=document.createElement('p');note.className='finder-scope';note.textContent='Historical results for those builds; output depends on the individual car, hardware, fuel and test conditions.';out.append(note);
 }
 if(data.platform==='other'&&(data.vehicle==='va'||data.vehicle==='vb')){
  const note=document.createElement('p');note.textContent='Considering Atlas? Exact year, transmission, market and ECU identification still need review. Accessport pricing does not apply. ';
  const a=document.createElement('a');a.href='/atlas-wrx-tuning.html';a.textContent='Read the Atlas WRX guide →';note.append(a);out.append(note);
 }
 out.hidden=false;out.setAttribute('tabindex','-1');out.focus({preventScroll:true});
 out.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
});
form.addEventListener('change',()=>{out.hidden=true;out.replaceChildren();});
})();
