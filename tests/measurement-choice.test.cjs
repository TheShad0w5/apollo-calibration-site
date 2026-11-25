const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const source = fs.readFileSync(require('node:path').join(__dirname, '../retail/site-measurement.js'), 'utf8');
const decision = source.slice(source.indexOf('  function needsMeasurementChoice()'), source.indexOf('  function purchaseGranted()'));
function needsChoice(choice, purchase, overrides = {}) {
  const context = {choice, internalVisit:false, privacySignal:false,purchaseConsentKey:'purchase',
    localStorage:{getItem:()=>purchase,setItem:()=>{throw Error('Must never infer consent');}},...overrides};
  vm.createContext(context);vm.runInContext(decision,context);
  return vm.runInContext('needsMeasurementChoice()',context);
}
test('returning analytics visitor sees the updated choice without granting permission',()=>{
  assert.equal(needsChoice('yes',null),true);
});
test('recorded purchase choices and declined analytics are respected',()=>{
  for(const purchase of ['yes','no'])assert.equal(needsChoice('yes',purchase),false);
  assert.equal(needsChoice('no',null),false);
});
test('new visitors see options and excluded returning visits are not prompted',()=>{
  assert.equal(needsChoice('',null),true);
  assert.equal(needsChoice('yes',null,{internalVisit:true}),false);
  assert.equal(needsChoice('yes',null,{privacySignal:true}),false);
});
test('unavailable storage does not trigger repeated consent prompts',()=>{
  assert.equal(needsChoice('yes',null,{localStorage:{getItem:()=>{throw Error('Storage blocked');}}}),false);
});
