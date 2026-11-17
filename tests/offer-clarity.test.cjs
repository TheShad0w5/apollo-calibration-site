'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const prep=fs.readFileSync('retail/prepare-for-tuning-consultation.html','utf8');
assert.ok(!prep.includes('Custom e-tunes include up to eight'));
assert.ok(!prep.includes('understand eight revisions'));
assert.match(prep,/Accessport single-fuel tunes include up to eight revisions; Accessport flex-fuel tunes include up to twelve/);
assert.match(prep,/initial calibration is separate and does not count as a revision/);
const landing=fs.readFileSync('retail/subaru-wrx-sti-tuning.html','utf8');
assert.match(landing,/href="\/checkout\?service=ap-single#setup">Start my \$400 single-fuel tune/);
assert.match(landing,/href="#generation">Check my Subaru requirements/);
assert.match(landing,/href="#inquiry-form">Ask about a custom setup/);
console.log('Offer scope and buyer/requirements/inquiry routes passed');

const shop=fs.readFileSync('retail/shop.html','utf8');
for(const key of ['standalone-single','standalone-flex']){
 const card=shop.split('<article id="'+key+'">')[1].split('</article>')[0];
 assert.match(card,/4 × 1-hour live sessions/);
 assert.doesNotMatch(card,/up to (8|12) revisions/);
}
assert.match(shop,/From \$150/);
assert.match(shop,/USD starting price/);
assert.match(fs.readFileSync('retail/terms.html','utf8'),/four one-hour live tuning sessions/);
console.log('Standalone live-session scope and feature pricing passed');

assert.doesNotMatch(shop,/\$150 (each|per feature)/);
assert.doesNotMatch(fs.readFileSync('retail/race-features.js','utf8'),/count\s*\*\s*150/);
