// Public merchandising only. No dealer costs, part numbers or payment requests.
// Haltech publishes calendar dates in AEDT, not an exact cutoff time.
// Storefront expiry is end of its final published AEDT day; recheck if terms change.
function tbkS3SaleActive(now=new Date()){
 return now.getTime()>=Date.parse('2026-10-30T00:00:00+11:00')&&now.getTime()<Date.parse('2026-12-09T00:00:00+11:00');
}
(()=>{
 const root=document.getElementById('subaru-ecu-packages');if(!root)return;
 const catalog={
  's3-ecu':{name:'Haltech Nexus S3 ECU only',price:null,platform:'Haltech',items:['Haltech Nexus S3 ECU'],note:'ECU-only supply. Adapter harness, sensors, installation and calibration are separate. Exact fitment and price confirmed before purchase.'},
  'link-ecu':{name:'Link Subaru plug-in ECU only',price:null,platform:'Link ECU',items:['Link Subaru plug-in ECU matched to your vehicle'],note:'ECU-only supply. The exact plug-in model is confirmed for your year and market. Sensors, expansion hardware and calibration are separate.'},
  'emtron-ecu':{name:'Emtron KV8 ECU only',price:null,platform:'Emtron',items:['Emtron KV8 ECU'],note:'ECU-only supply. Harness, sensors, installation and calibration are separate. Final price and availability confirmed before purchase.'},
  's3-basic':{name:'Haltech S3 Basic',price:3304,platform:'Haltech',items:['Haltech Nexus S3 ECU','Boomslang adapter harness matched to your vehicle','Bosch wideband hardware pack'],note:'Uses the S3’s internal MAP sensor. Charge-air temperature measurement and installation connections are confirmed for your setup.'},
  's3-protection':{name:'Haltech S3 Protection',price:3865,platform:'Haltech',items:['Everything in S3 Basic','Oil-pressure sensor','Fuel-pressure sensor','High-range oil-temperature sensor','Post-intercooler air-temperature sensor'],note:'Engine-protection configuration and validation are part of the separately quoted calibration work.'},
  'link-protection':{name:'Link Plug-In Protection',price:null,platform:'Link ECU',items:['Subaru Link plug-in ECU matched to your vehicle','CAN wideband kit','Oil-pressure and fuel-pressure sensors','Oil-temperature and charge-air temperature sensors','ECU expansion and CAN connection hardware'],note:'Connects to the factory ECU harness using the appropriate plug-in version. Package price confirmed for your application.'},
  'emtron-tmf':{name:'Emtron KV8 TMF / EMAP',price:null,platform:'Emtron',items:['Emtron KV8 ECU and vehicle-matched Boomslang harness','Oil-pressure, fuel-pressure and oil-temperature sensors','Wideband sensor and charge-air temperature measurement','Pre-throttle and post-throttle pressure sensors','Exhaust pressure sensor, EMAP canister and pressure plumbing','Additional sensor connection hardware'],note:'Designed for throttle mass flow blended with speed density and measured exhaust-pressure correction. Package price confirmed for your application.'}
 };
 const model=root.querySelector('[name=package_model]'),year=root.querySelector('[name=package_year]'),market=root.querySelector('[name=package_market]'),trans=root.querySelector('[name=package_transmission]'),configuration=root.querySelector('[name=package_configuration]');
 const selection=root.querySelector('[name=ecu_package]'),summary=root.querySelector('[data-package-summary]'),price=root.querySelector('[data-package-price]'),list=root.querySelector('[data-package-items]'),note=root.querySelector('[data-package-note]'),button=root.querySelector('[data-package-inquiry]');
 const scope=root.querySelector('[name=package_scope]');
 const requestedScope=new URLSearchParams(location.search).get('hardware_option');
 if(requestedScope==='ecu-only'||requestedScope==='complete-sti-package')scope.value=requestedScope;
 function optionsForScope(){selection.replaceChildren(new Option(scope.value==='ecu-only'?'Choose ECU':'Choose package',''));for(const [key,p] of Object.entries(catalog)){if(key.endsWith('-ecu')===(scope.value==='ecu-only'))selection.add(new Option(p.name,key));}update();}
 scope.addEventListener('change',optionsForScope);
 let autoVehicle=null;
 const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
 function saleAmount(p){return p.price&&p.platform==='Haltech'&&tbkS3SaleActive()?p.price-225:p.price;}
 for(const el of [model,year,market,trans,configuration,selection])el.setAttribute('aria-label',el.parentElement.firstChild.textContent.trim());
 function years(){const previous=year.value;year.replaceChildren(new Option('Choose year',''));const min=model.value==='STI'?2004:2002,max=model.value==='STI'?2021:2014;if(model.value)for(let y=max;y>=min;y--)year.add(new Option(String(y),String(y)));year.value=[...year.options].some(o=>o.value===previous)?previous:'';year.disabled=!model.value;}
 function update(){
  const p=catalog[selection.value];const validYear=model.value&&Number(year.value)>=(model.value==='STI'?2004:2002)&&Number(year.value)<=(model.value==='STI'?2021:2014);
  const standard=market.value==='USDM'&&trans.value==='Manual'&&configuration.value==='Factory';const ready=Boolean(p&&validYear&&market.value&&trans.value&&configuration.value);
  summary.textContent=p?p.name:(scope.value==='ecu-only'?'Choose your vehicle and ECU':'Choose your vehicle and package');button.textContent=scope.value==='ecu-only'?'Confirm my ECU with Keith →':'Confirm my package with Keith →';list.replaceChildren();
  if(p)for(const item of p.items){const li=document.createElement('li');li.textContent=item;list.append(li);}
  price.replaceChildren();
  if(p?.price){
   if(!standard){const scope=document.createElement('small');scope.style.cssText='display:block;font-size:14px;line-height:1.5';scope.textContent='Standard USDM manual package';price.append(scope);}
   const amount=saleAmount(p);
   if(amount!==p.price){const normal=document.createElement('s');normal.textContent=money(p.price);normal.setAttribute('aria-label','Regular package price '+money(p.price));normal.style.cssText='font-size:20px;opacity:.75;margin-right:12px';price.append(normal);}
   const current=document.createElement('strong');current.textContent=money(amount);price.append(current);
   if(amount!==p.price){const saving=document.createElement('small');saving.textContent='Sale · Save $225';saving.style.cssText='display:block;font-size:16px;color:#ffb777;margin-top:8px';price.append(saving);}
  }else if(p)price.textContent='Application pricing on request';
  for(const option of selection.options){const item=catalog[option.value];if(item?.price)option.textContent=item.name+' — '+money(saleAmount(item))+(saleAmount(item)!==item.price?' sale (regular '+money(item.price)+')':'');}
  note.textContent=p?(p.note+(ready&&!standard?' Imported vehicles, automatic transmissions and changed engine/harness configurations require a separate fitment and price review.':'')):'';
  if(p?.platform==='Haltech'&&tbkS3SaleActive()){
   const terms=document.createElement('a');terms.href='https://www.haltech.com/haltech-40th-birthday-sale-terms-and-conditions/';terms.textContent='Haltech sale terms';
   note.append(document.createTextNode(' Sale scheduled through December 8, 2026 (AEDT), subject to manufacturer changes. '),terms,document.createTextNode('. Availability and delivery timing are confirmed before payment.'));
  }
  button.disabled=!ready;
 }
 model.addEventListener('change',()=>{years();update();});for(const el of [year,market,trans,configuration,selection])el.addEventListener('change',update);
 button.addEventListener('click',()=>{
  if(button.disabled)return;const p=catalog[selection.value],form=document.getElementById('tune-intake');if(!form)return;
  const field=(name)=>form.querySelector('[name="'+name+'"]');
  if(field('vehicle')&&(!field('vehicle').value||field('vehicle').value===autoVehicle)){autoVehicle=year.value+' Subaru '+model.value;field('vehicle').value=autoVehicle;}
  const details=(scope.value==='ecu-only'?'ECU-only selection: ':'Hardware package: ')+p.name+' | '+year.value+' Subaru '+model.value+' | '+market.value+' | '+trans.value+' | '+configuration.value+' engine/harness configuration';
  let context=field('hardware_package_selection');if(!context){context=document.createElement('input');context.type='hidden';context.name='hardware_package_selection';form.append(context);}context.value=details;
  let display=document.getElementById('hardware-package-context');if(!display){display=document.createElement('p');display.id='hardware-package-context';display.className='form-note';form.prepend(display);}display.textContent=details;
  if(field('platform'))field('platform').value=p.platform;
  if(field('tuning_interest'))field('tuning_interest').value='ECU sales / complete package — individual quote';
  if(field('hardware_option'))field('hardware_option').value=scope.value;
  field('tuning_interest')?.dispatchEvent(new Event('change',{bubbles:true}));
  field('platform')?.dispatchEvent(new Event('change',{bubbles:true}));
  const extra=form.querySelector('.inquiry-details');if(extra)extra.open=true;
  location.hash='request';form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});field('name')?.focus({preventScroll:true});
 });
 years();optionsForScope();
 // Refresh an open page when the scheduled offer ends, as well as on selection.
 setInterval(update,60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
})();