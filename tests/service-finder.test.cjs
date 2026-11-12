const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let submit,change,selected={},children=[];
const out={hidden:true,replaceChildren(){children=[]},append(...x){children.push(...x)},setAttribute(){},focus(){},scrollIntoView(){}};
const form={addEventListener(n,fn){if(n==='submit')submit=fn;else change=fn},reportValidity(){return true}};
const element=()=>({textContent:'',children:[],append(...v){this.children.push(...v)}});
vm.runInNewContext(fs.readFileSync('retail/service-finder.js','utf8'),{document:{getElementById:id=>id==='service-finder'?form:out,createElement:element},URLSearchParams,FormData:class{constructor(){return Object.entries(selected)}},window:{matchMedia:()=>({matches:true})}});
let count=0;const shop=fs.readFileSync('retail/shop.html','utf8');
for(const job of ['new','retune','base','project'])for(const vehicle of ['ej','va','vb','porsche','other'])for(const platform of ['ap','standalone','other'])for(const fuel of ['single','flex','unsure']){
selected={job,vehicle,platform,fuel};submit({preventDefault(){}});
assert.equal(out.hidden,false);assert(!children[0].textContent.includes('undefined'));
for(const link of children[2].children){const [p,hash]=link.href.split('#');assert(fs.existsSync('retail'+p.split('?')[0]));if(p.split('?')[0]==='/shop.html'&&hash)assert(shop.includes('id="'+hash+'"'));}
change();assert.equal(out.hidden,true);assert.equal(children.length,0);count++;
}
console.log(count+' finder combinations, destination links and reset behavior passed');
