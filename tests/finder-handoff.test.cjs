const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..');
const finder=fs.readFileSync(path.join(root,'retail/service-finder.js'),'utf8');
const original=fs.readFileSync(path.join(root,'tests/fixtures/finder-before-handoff.js'),'utf8');
const handoff=fs.readFileSync(path.join(root,'retail/finder-handoff.js'),'utf8');
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.events={};this.hidden=false;this.textContent='';}
 append(...nodes){nodes.forEach(n=>{n.parent=this;this.children.push(n);});}
 prepend(n){n.parent=this;this.children.unshift(n);}
 after(n){n.parent=this.parent;this.parent.children.splice(this.parent.children.indexOf(this)+1,0,n);}
 remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 addEventListener(e,fn){this.events[e]=fn;}
 setAttribute(k,v){this[k]=v;}
 focus(){this.focused=true;}
 scrollIntoView(){}
 reportValidity(){return true;}
 querySelector(q){return walk(this).find(n=>q[0]==='.'?n.className===q.slice(1):q==='[name="name"]'&&n.name==='name')||null;}
}
function walk(n){return [n,...n.children.flatMap(walk)];}
function env(kind,values={},search=''){
 const container=new Element('root'),form=new Element('form');form.id=kind==='finder'?'service-finder':'tune-intake';container.append(form);
 const out=new Element('div');out.id='finder-result';container.append(out);
 const intro=new Element('p');intro.className='inquiry-intro';form.append(intro);
 const name=new Element('input');name.name='name';name.value='Existing name';form.append(name);
 const vehicle=new Element('input');vehicle.name='vehicle';vehicle.value='Existing exact vehicle';form.append(vehicle);
 const message=new Element('textarea');message.name='message';message.value='Existing typed question';form.append(message);
 const document={getElementById:id=>walk(container).find(n=>n.id===id)||null,createElement:tag=>new Element(tag)};
 const window={location:{search},matchMedia:()=>({matches:true})};
 const ctx={document,window,URLSearchParams,FormData:function(){return Object.entries(values);}};
 return {container,form,out,ctx,document,vehicle,message,name};
}
function runFinder(code,values){const e=env('finder',values);vm.runInNewContext(code,e.ctx);e.form.events.submit({preventDefault(){}});return e;}
const choices={job:['new','retune','base','project'],vehicle:['ej','va','vb','porsche','other'],platform:['ap','standalone','other'],fuel:['single','flex','unsure']};let cases=0,projects=0;
for(const job of choices.job)for(const vehicle of choices.vehicle)for(const platform of choices.platform)for(const fuel of choices.fuel){
 const v={job,vehicle,platform,fuel},old=runFinder(original,v),now=runFinder(finder,v);cases++;
 assert.equal(now.out.children[0].textContent,old.out.children[0].textContent,'Title/price regression');
 const links=walk(now.out).filter(n=>n.tagName==='a'),oldLinks=walk(old.out).filter(n=>n.tagName==='a');
 const isProject=job==='project'||platform==='other'||fuel==='unsure';
 if(isProject){projects++;const url=new URL(links[0].href,'https://www.tunedbykeith.com');assert.equal(url.pathname,'/shop.html');assert.equal(url.hash,'#request');assert.equal([...url.searchParams].length,5);for(const k of Object.keys(v))assert.equal(url.searchParams.get('finder_'+k),v[k]);
  const e=env('handoff',{},url.search);vm.runInNewContext(handoff,e.ctx);const box=e.document.getElementById('finder-selections');assert.ok(box);assert.equal(box.value.split('\n').length,4);assert.equal(box.name,'service_finder_selections');assert.equal(box.required,undefined);assert.equal(e.vehicle.value,'Existing exact vehicle');assert.equal(e.message.value,'Existing typed question');assert.equal(e.name.value,'Existing name');
  vm.runInNewContext(handoff,e.ctx);assert.equal(walk(e.container).filter(n=>n.id==='finder-selections').length,1,'Repeated initialization duplicated field');
  box.value='Customer can edit';assert.equal(box.value,'Customer can edit');const remove=walk(e.container).find(n=>n.tagName==='button');assert.equal(remove.type,'button');remove.events.click();assert.equal(e.document.getElementById('finder-selections'),null);assert.equal(e.name.focused,true);
 }else assert.equal(links[0].href,oldLinks[0].href,'Paid/base service route changed');
 assert.equal(links[1].href,oldLinks[1].href,'Preparation guide changed');
 assert.equal(links.some(n=>n.href==='/atlas-wrx-tuning.html'),platform==='other'&&['va','vb'].includes(vehicle));
 now.form.events.change();assert.equal(now.out.hidden,true);assert.equal(now.out.children.length,0);
}
const valid='?finder=1&finder_job=project&finder_vehicle=va&finder_platform=other&finder_fuel=unsure';
for(const search of ['', '?finder=1',valid.replace('finder_job=project','finder_job=<script>'),valid+'&finder_vehicle=ej',valid.replace('finder_vehicle=va','finder_vehicle=__proto__'),valid.replace('finder=1','finder=2'),valid+'&finder=1']){const e=env('handoff',{},search);vm.runInNewContext(handoff,e.ctx);assert.equal(e.document.getElementById('finder-handoff'),null,'Invalid query created handoff');}
const e=env('handoff',{},valid+'&email=PRIVATE&name=PRIVATE&utm_campaign=PRIVATE&finder_extra=PRIVATE');vm.runInNewContext(handoff,e.ctx);assert.ok(!e.document.getElementById('finder-selections').value.includes('PRIVATE'),'Unknown personal query copied');
const bad=runFinder(finder,{job:'project',vehicle:'bad',platform:'other',fuel:'unsure'});assert.equal(bad.out.children.length,0);
const shop=fs.readFileSync(path.join(root,'retail/shop.html'),'utf8');assert.equal(require('node:crypto').createHash('sha256').update(shop.match(/<form[\s\S]*?<\/form>/)[0]).digest('hex'),'f6ec24815c1c8db213ccf12df8a16c7d3e72b6555e1fd11f2c30066aa0bff393','Existing form changed');assert.equal(shop.split('finder-handoff.js').length,2);
assert.ok(!/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\b/.test(handoff),'Handoff should not send data or use storage');
console.log(`PASS: ${cases} finder combinations, ${projects} project handoffs, unchanged prices/service routes, Atlas routing, validation, edit/remove, duplicate init, no personal query carryover, original form preserved.`);
