// Public merchandising only. No dealer costs, part numbers or payment requests.
(()=>{
 const root=document.getElementById('subaru-ecu-packages');if(!root)return;
 const catalog={
  's3-basic':{name:'Haltech S3 Basic',price:3304,platform:'Haltech',items:['Haltech Nexus S3 ECU','Boomslang adapter harness matched to your vehicle','Bosch wideband hardware pack'],note:'Uses the S3’s internal MAP sensor. Charge-air temperature measurement and installation connections are confirmed for your setup.'},
  's3-protection':{name:'Haltech S3 Protection',price:3865,platform:'Haltech',items:['Everything in S3 Basic','Oil-pressure sensor','Fuel-pressure sensor','High-range oil-temperature sensor','Post-intercooler air-temperature sensor'],note:'Engine-protection configuration and validation are part of the separately quoted calibration work.'},
  'link-protection':{name:'Link Plug-In Protection',price:null,platform:'Link ECU',items:['Subaru Link plug-in ECU matched to your vehicle','CAN wideband kit','Oil-pressure and fuel-pressure sensors','Oil-temperature and charge-air temperature sensors','ECU expansion and CAN connection hardware'],note:'Connects to the factory ECU harness using the appropriate plug-in version. Package price confirmed for your application.'},
  'emtron-tmf':{name:'Emtron KV8 TMF / EMAP',price:null,platform:'Emtron',items:['Emtron KV8 ECU and vehicle-matched Boomslang harness','Oil-pressure, fuel-pressure and oil-temperature sensors','Wideband sensor and charge-air temperature measurement','Pre-throttle and post-throttle pressure sensors','Exhaust pressure sensor, EMAP canister and pressure plumbing','Additional sensor connection hardware'],note:'Designed for throttle mass flow blended with speed density and measured exhaust-pressure correction. Package price confirmed for your application.'}
 };
 const model=root.querySelector('[name=package_model]'),year=root.querySelector('[name=package_year]'),market=root.querySelector('[name=package_market]'),trans=root.querySelector('[name=package_transmission]'),configuration=root.querySelector('[name=package_configuration]');
 const selection=root.querySelector('[name=ecu_package]'),summary=root.querySelector('[data-package-summary]'),price=root.querySelector('[data-package-price]'),list=root.querySelector('[data-package-items]'),note=root.querySelector('[data-package-note]'),button=root.querySelector('[data-package-inquiry]');
 function years(){const previous=year.value;year.replaceChildren(new Option('Choose year',''));const min=model.value==='STI'?2004:2002,max=model.value==='STI'?2021:2014;if(model.value)for(let y=max;y>=min;y--)year.add(new Option(String(y),String(y)));year.value=[...year.options].some(o=>o.value===previous)?previous:'';year.disabled=!model.value;}
 function update(){
  const p=catalog[selection.value];const validYear=model.value&&Number(year.value)>=(model.value==='STI'?2004:2002)&&Number(year.value)<=(model.value==='STI'?2021:2014);
  const standard=market.value==='USDM'&&trans.value==='Manual'&&configuration.value==='Factory';const ready=Boolean(p&&validYear&&market.value&&trans.value&&configuration.value);
  summary.textContent=p?p.name:'Choose your vehicle and package';list.replaceChildren();
  if(p)for(const item of p.items){const li=document.createElement('li');li.textContent=item;list.append(li);}
  price.textContent=!p?'':p.price&&standard?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(p.price):p.price?'Standard USDM manual package: '+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(p.price):'Application pricing on request';
  note.textContent=p?(p.note+(ready&&!standard?' Imported vehicles, automatic transmissions and changed engine/harness configurations require a separate fitment and price review.':'')):'';
  button.disabled=!ready;
 }
 model.addEventListener('change',()=>{years();update();});for(const el of [year,market,trans,configuration,selection])el.addEventListener('change',update);
 button.addEventListener('click',()=>{
  if(button.disabled)return;const p=catalog[selection.value],form=document.getElementById('tune-intake');if(!form)return;
  const field=(name)=>form.querySelector('[name="'+name+'"]');
  if(field('vehicle')&&!field('vehicle').value)field('vehicle').value=year.value+' Subaru '+model.value;
  const details='Hardware package: '+p.name+' | '+year.value+' Subaru '+model.value+' | '+market.value+' | '+trans.value+' | '+configuration.value+' engine/harness configuration';
  let context=field('hardware_package_selection');if(!context){context=document.createElement('input');context.type='hidden';context.name='hardware_package_selection';form.append(context);}context.value=details;
  let display=document.getElementById('hardware-package-context');if(!display){display=document.createElement('p');display.id='hardware-package-context';display.className='form-note';form.prepend(display);}display.textContent=details;
  if(field('platform'))field('platform').value=p.platform;
  if(field('tuning_interest'))field('tuning_interest').value='ECU sales / complete package — individual quote';
  const extra=form.querySelector('.inquiry-details');if(extra)extra.open=true;
  location.hash='request';form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});field('name')?.focus({preventScroll:true});
 });
 years();update();
})();