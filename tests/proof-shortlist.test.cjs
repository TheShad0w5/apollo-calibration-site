const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');
const path='retail/subaru-wrx-sti-tuning.html',html=fs.readFileSync(path,'utf8'),base=cp.execFileSync('git',['show','e35de4f417724d4d2f0c879c53b09814e63f5fe8:'+path],{encoding:'utf8'});
const section=html.match(/<section class="section proof-shortlist"[\s\S]*?<\/section>/)[0];
assert(html.indexOf('id="proof-shortlist"')<html.indexOf('id="generation"'));
for(const href of ['/chris-2020-sti-flex-fuel.html','/james-2024-wrx-build.html','#industry-references'])assert(section.includes('href="'+href+'"'));
assert(section.includes('not current endorsements'));assert(section.includes('not a promise of output'));
assert.deepEqual(html.match(/<form[\s\S]*?<\/form>/g),base.match(/<form[\s\S]*?<\/form>/g));
assert.equal(html.replace(section,'').replace(/<style id="proof-shortlist-style">[\s\S]*?<\/style>/,''),base);
console.log('Proof placement, source links, historical caveats, unchanged forms and all pre-existing content passed');
