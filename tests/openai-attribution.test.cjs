const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const source = fs.readFileSync(require('node:path').join(__dirname, '../retail/site-measurement.js'), 'utf8');
// Execute the actual production OpenAI functions in an isolated browser fixture.
// No network, Google tag, FormSubmit request or OpenAI pixel can leave this process.
const functions = source.slice(source.indexOf('  function openAIMeasurementAllowed()'), source.indexOf('  const pendingKey'));
function storage(initial = {}) { const values = new Map(Object.entries(initial)); return {getItem:k=>values.get(k)??null, setItem:(k,v)=>values.set(k,String(v)), removeItem:k=>values.delete(k)}; }
function fixture(options = {}) {
  let now = 10000000;
  const localStorage = storage({'analytics':'yes','ads':'yes','openai':'yes',...options.consent});
  const sessionStorage = storage(); const pixels=[];
  const ctx = {Date:{now:()=>now}, URL, URLSearchParams, Number, JSON, crypto:{randomUUID:()=> 'receipt-123'},
    localStorage,sessionStorage,navigator:{},internalVisit:false,privacySignal:false,qaCampaign:false,
    testQuery:new URLSearchParams(),testKey:'test',ownerKey:'owner',key:'analytics',adsKey:'ads',openAIConsentKey:'openai',
    openAIClickKey:'click',openAIReturnKey:'pending',openAIClickLifetime:3600000,
    subaruPath:'/subaru-wrx-sti-tuning.html',inquiryReturnPath:'/inquiry-received.html',receiptParameter:'subaru_inquiry_receipt',
    clickReferenceFormat:/^[A-Za-z0-9._~=-]{1,2048}$/,formReturn:true,
    location:{pathname:'/subaru-wrx-sti-tuning.html',search:'?oppref=real-click-abc'},
    document:{referrer:'https://formsubmit.co/',body:{append:p=>pixels.push(p)}},Image:function(){}, ...options.context};
  vm.createContext(ctx);vm.runInContext(functions,ctx);
  const next={value:''};const form={id:'inquiry-form',querySelector:q=>q.includes('_next')?next:null};
  return {ctx,next,form,pixels,advance:ms=>now+=ms,call:(fn)=>vm.runInContext(fn,ctx)};
}
test('consented click survives another page and return without URL reference',()=>{
 const f=fixture();f.call('captureOpenAIClick()');f.ctx.location.search='';f.ctx.location.pathname='/2022-plus-wrx-etuning.html';f.call('captureOpenAIClick()');
 f.ctx.location.pathname=f.ctx.subaruPath;f.ctx.form=f.form;f.call('prepareSubaruLead(form)');assert.equal(JSON.parse(f.ctx.sessionStorage.getItem('pending')).click,'real-click-abc');assert.match(f.next.value,/subaru_inquiry_receipt=receipt-123/);
});
test('each required consent prevents capture',()=>{for(const key of ['analytics','ads','openai']){const f=fixture({consent:{[key]:'no'}});f.call('captureOpenAIClick()');assert.equal(f.ctx.sessionStorage.getItem('click'),null);}});
test('grant after page load permits capture',()=>{const f=fixture({consent:{openai:'no'}});f.call('captureOpenAIClick()');f.ctx.localStorage.setItem('openai','yes');f.call('captureOpenAIClick()');assert.equal(f.call('savedOpenAIClick()'),'real-click-abc');});
test('owner, test, QA and browser privacy exclusions prevent storage',()=>{for(const context of [{internalVisit:true},{privacySignal:true},{qaCampaign:true},{navigator:{globalPrivacyControl:true}},{navigator:{doNotTrack:'1'}},{testQuery:new URLSearchParams('tbk_test=1')},{testQuery:new URLSearchParams('tbk_owner=1')}]){const f=fixture({context});f.call('captureOpenAIClick()');assert.equal(f.ctx.sessionStorage.getItem('click'),null);}});
test('revocation clears click and pending receipt',()=>{const f=fixture();f.call('captureOpenAIClick()');f.ctx.sessionStorage.setItem('pending','{}');f.ctx.localStorage.setItem('ads','no');assert.equal(f.call('savedOpenAIClick()'),'');assert.equal(f.ctx.sessionStorage.getItem('click'),null);assert.equal(f.ctx.sessionStorage.getItem('pending'),null);});
test('one-hour expiry is not extended by revisiting same reference',()=>{const f=fixture();f.call('captureOpenAIClick()');const initial=f.ctx.sessionStorage.getItem('click');f.advance(1000);f.call('captureOpenAIClick()');assert.equal(f.ctx.sessionStorage.getItem('click'),initial);f.advance(3600000);assert.equal(f.call('savedOpenAIClick()'),'');});
test('invalid URL reference clears saved attribution',()=>{const f=fixture();f.call('captureOpenAIClick()');f.ctx.location.search='?oppref=%3Cscript%3E';f.call('captureOpenAIClick()');assert.equal(f.ctx.sessionStorage.getItem('click'),null);});
test('missing, malformed and future-dated storage fails closed',()=>{const f=fixture();for(const value of ['null','{bad',JSON.stringify({click:'bad value',time:10000000}),JSON.stringify({click:'valid',time:20000000})]){f.ctx.sessionStorage.setItem('click',value);assert.equal(f.call('savedOpenAIClick()'),'');}});
test('matching receipt reports once; refresh cannot report again',()=>{const f=fixture();f.call('captureOpenAIClick()');f.ctx.form=f.form;f.call('prepareSubaruLead(form)');f.ctx.location.pathname=f.ctx.inquiryReturnPath;f.ctx.testQuery=new URLSearchParams('subaru_inquiry_receipt=receipt-123');f.call('reportSubaruLead()');f.call('reportSubaruLead()');assert.equal(f.pixels.length,1);assert.match(f.pixels[0].src,/oppref=real-click-abc/);});
test('expired receipt and revoked consent cannot report',()=>{for(const revoke of [false,true]){const f=fixture();f.call('captureOpenAIClick()');f.ctx.form=f.form;f.call('prepareSubaruLead(form)');f.ctx.location.pathname=f.ctx.inquiryReturnPath;f.ctx.testQuery=new URLSearchParams('subaru_inquiry_receipt=receipt-123');if(revoke)f.ctx.localStorage.setItem('openai','no');else f.advance(3600001);f.call('reportSubaruLead()');assert.equal(f.pixels.length,0);}});

test('whole script initializes and storage/pageshow revocation clears data',()=>{
 const f=fixture();const listeners={};
 const el=()=>({style:{},dataset:{},hidden:false,append(){},setAttribute(){},addEventListener(){},insertBefore(){},querySelector(){return el();}});
 f.ctx.location={hostname:'www.tunedbykeith.com',origin:'https://www.tunedbykeith.com',pathname:'/subaru-wrx-sti-tuning.html',search:'?oppref=real-click-abc',href:'https://www.tunedbykeith.com/subaru-wrx-sti-tuning.html?oppref=real-click-abc',hash:''};
 f.ctx.window={addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn)};
 f.ctx.document={title:'Test',cookie:'',referrer:'',head:{append(){}},body:el(),createElement:el,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
 f.ctx.Date=Date;
 f.ctx.localStorage=storage({'tbk-analytics-choice':'yes','tbk-ad-measurement-choice':'yes','tbk-openai-ad-measurement-v1':'yes'});
 vm.runInContext(source,f.ctx);
 assert.equal(JSON.parse(f.ctx.sessionStorage.getItem('tbk-openai-click-v1')).click,'real-click-abc');
 f.ctx.localStorage.setItem('tbk-openai-ad-measurement-v1','no');
 for(const fn of listeners.storage)fn({key:'tbk-openai-ad-measurement-v1',newValue:'no'});
 assert.equal(f.ctx.sessionStorage.getItem('tbk-openai-click-v1'),null);
 for(const fn of listeners.pageshow)fn({persisted:true});
 assert.equal(f.ctx.sessionStorage.getItem('tbk-openai-click-v1'),null);
});
