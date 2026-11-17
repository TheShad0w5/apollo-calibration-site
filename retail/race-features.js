(function(){
'use strict';
const labels={'gear-cut':'Gear cut / shift cut','rolling-anti-lag':'Rolling anti-lag','launch-control':'Custom launch control','boost-by-gear':'Boost by gear / speed','traction-control':'Traction control setup','pit-limiter':'Pit-lane speed limiter'};
const picker=document.getElementById('race-feature-picker');
if(picker){
 const fields=Array.from(picker.querySelectorAll('input[name="feature"]'));
 const estimate=document.getElementById('feature-estimate');
 function update(){
  const count=fields.filter(field=>field.checked).length;
  fields[0].setCustomValidity('');
  estimate.textContent=count?count+' '+(count===1?'feature':'features')+' selected · packages start at $150 USD. Final pricing depends on complexity and customization.':'Feature packages start at $150. Select the tools you want; final pricing depends on complexity and customization.';
 }
 picker.addEventListener('change',update);
 picker.addEventListener('submit',function(event){
  if(!fields.some(field=>field.checked)){event.preventDefault();fields[0].setCustomValidity('Choose at least one feature to request a quote.');fields[0].reportValidity();}
 });
 update();
}
const form=document.getElementById('tune-intake'),params=new URLSearchParams(window.location.search);
if(!form||params.get('service')!=='race-features'||document.getElementById('track-feature-request'))return;
const section=document.createElement('div');section.id='track-feature-request';
const label=document.createElement('label');label.textContent='Features and intended use';label.htmlFor='requested-track-features';
const field=document.createElement('textarea');field.id='requested-track-features';field.name='requested_track_features';field.rows=4;field.maxLength=1500;
const selected=[...new Set(params.getAll('feature'))].filter(key=>Object.hasOwn(labels,key));
field.value=selected.map(key=>labels[key]).join('\n');field.placeholder='List the features you want and how you will use the car.';
label.append(field);
const orderLabel=document.createElement('label');orderLabel.textContent='Existing Keith order reference (optional)';orderLabel.htmlFor='feature-order-reference';
const order=document.createElement('input');order.id='feature-order-reference';order.name='feature_order_reference';order.maxLength=150;order.placeholder='For an add-on to an existing tuning job';orderLabel.append(order);
const note=document.createElement('p');note.textContent='Feature packages start at $150; final pricing depends on complexity and customization. Edit the list and include your ECU model, firmware, gearbox and controls. Configuration, testing and validation scope are confirmed in your quote before payment.';
section.append(label,orderLabel,note);
const intro=form.querySelector('.inquiry-intro');if(intro)intro.after(section);else form.prepend(section);
})();
