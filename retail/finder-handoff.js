/* Carry only fixed, non-personal service-finder choices into an editable inquiry field.
   No storage, tracking event, automatic submission or changes to required vehicle details. */
(function(){
'use strict';
const form=document.getElementById('tune-intake');
if(!form||document.getElementById('finder-handoff'))return;
const params=new URLSearchParams(window.location.search);
if(params.getAll('finder').length!==1||params.get('finder')!=='1')return;
const labels={
 job:{new:'New custom tune',retune:'Update to an existing Keith tune',base:'Starting / base map',project:'Dyno session or custom project'},
 vehicle:{ej:'WRX / STI with an EJ engine',va:'2015–2021 WRX',vb:'2022+ WRX',porsche:'Porsche',other:'Another vehicle'},
 platform:{ap:'COBB Accessport',standalone:'Standalone ECU',other:'Other / not sure'},
 fuel:{single:'One agreed fuel',flex:'Flex fuel',unsure:'Not decided yet'}
};
const headings={job:'Job',vehicle:'Vehicle group',platform:'Platform',fuel:'Fuel plan'};
const lines=[];
for(const key of Object.keys(labels)){
 const values=params.getAll('finder_'+key);
 if(values.length!==1||!Object.prototype.hasOwnProperty.call(labels[key],values[0]))return;
 lines.push(headings[key]+': '+labels[key][values[0]]);
}
const section=document.createElement('div');section.id='finder-handoff';
const label=document.createElement('label');label.htmlFor='finder-selections';label.textContent='Your service finder selections (optional)';
const field=document.createElement('textarea');field.id='finder-selections';field.name='service_finder_selections';field.rows=4;field.maxLength=500;field.value=lines.join('\n');field.defaultValue=field.value;
field.setAttribute('aria-describedby','finder-handoff-note');label.append(field);
const note=document.createElement('p');note.id='finder-handoff-note';note.className='form-note';note.textContent='Check or edit these selections. They are sent with your inquiry only when you submit it. They do not confirm compatibility or reserve a service. Add the exact vehicle and your questions below.';
const remove=document.createElement('button');remove.type='button';remove.className='button small';remove.textContent='Remove these selections';remove.addEventListener('click',function(){section.remove();const next=form.querySelector('[name="name"]');if(next)next.focus();});
section.append(label,note,remove);
const intro=form.querySelector('.inquiry-intro');if(intro)intro.after(section);else form.prepend(section);
})();
