const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const source = fs.readFileSync(require('node:path').join(__dirname, '../retail/site-measurement.js'), 'utf8');
const functions = source.slice(source.indexOf('  function prepareInquiryReturn('), source.indexOf('  function start()'));
function fixture(overrides = {}) {
  const values = new Map(); const events = [];
  const next = {value:'https://www.tunedbykeith.com/inquiry-received.html?subaru_inquiry_receipt=existing'};
  const ctx = {URL, URLSearchParams, Date:{now:()=>10000000}, crypto:{randomUUID:()=> 'unique-receipt'},
    location:{origin:'https://www.tunedbykeith.com',pathname:'/subaru-wrx-sti-tuning.html',search:''},
    document:{referrer:'https://formsubmit.co/'}, formReturn:true, internalVisit:false, privacySignal:false,
    inquiryReturnPath:'/inquiry-received.html',pendingKey:'pending',choice:'yes',adsStarted:true,adsChoice:'yes',
    context:{inquiry_page:'/subaru-wrx-sti-tuning.html'}, inquiryPages:new Set(['/subaru-wrx-sti-tuning.html']),builds:new Set(),
    inquiryConversion:'conversion-label',page:()=>({}),tag:(...args)=>events.push(args),event:(...args)=>events.push(args),
    sessionStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},
    form:{querySelector:()=>next},...overrides};
  vm.createContext(ctx); vm.runInContext(functions,ctx);
  return {ctx,next,events,call:code=>vm.runInContext(code,ctx),returnTo:(receipt='unique-receipt')=>{
    ctx.location.pathname=ctx.inquiryReturnPath;ctx.location.search=receipt?'?inquiry_receipt='+receipt:'';
  }};
}
test('matching return reports once and preserves existing Subaru receipt',()=>{
  const f=fixture();f.call('prepareInquiryReturn(form)');
  assert.match(f.next.value,/subaru_inquiry_receipt=existing/);assert.match(f.next.value,/inquiry_receipt=unique-receipt/);
  f.returnTo();f.call('confirmation()');assert.equal(f.events.length,2);
  f.call('confirmation()');assert.equal(f.events.length,2);
});
test('direct visit, wrong receipt and legacy timestamp cannot confirm an inquiry',()=>{
  for(const receipt of ['', 'wrong']){const f=fixture();f.call('prepareInquiryReturn(form)');f.returnTo(receipt);f.call('confirmation()');assert.equal(f.events.length,0);}
  const f=fixture();f.ctx.sessionStorage.setItem('pending','10000000');f.returnTo();f.call('confirmation()');assert.equal(f.events.length,0);
});
test('expired, future and malformed pending returns cannot confirm',()=>{
  for(const value of ['{bad',JSON.stringify({receipt:'unique-receipt',time:1}),JSON.stringify({receipt:'unique-receipt',time:10000001})]){
    const f=fixture();f.ctx.sessionStorage.setItem('pending',value);f.returnTo();f.call('confirmation()');assert.equal(f.events.length,0);
  }
});
test('consent, internal visit, privacy and unexpected referrer exclusions apply',()=>{
  for(const override of [{choice:'no'},{internalVisit:true},{privacySignal:true},{formReturn:false,document:{referrer:'https://example.com/'}}]){
    const f=fixture();f.call('prepareInquiryReturn(form)');Object.assign(f.ctx,override);f.returnTo();f.call('confirmation()');assert.equal(f.events.length,0);
  }
});
test('missing referrer can confirm with matching receipt; external return URLs are untouched',()=>{
  const f=fixture({document:{referrer:''},formReturn:false});f.call('prepareInquiryReturn(form)');f.returnTo();f.call('confirmation()');assert.equal(f.events.length,2);
  const external=fixture();external.next.value='https://example.com/inquiry-received.html';external.call('prepareInquiryReturn(form)');assert.equal(external.ctx.sessionStorage.getItem('pending'),null);
});
