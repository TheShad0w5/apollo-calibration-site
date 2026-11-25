const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const test=require('node:test');
const script=fs.readFileSync('retail/build-carousel.js','utf8');
const slides=JSON.parse(script.match(/const slides=(\[[\s\S]*?\]);/)[1]);

function setup(){
  const events=new Map(),elements={},timers=new Map();
  let loads=0,failed=false,seq=0,motionListener,intersection;
  for(const key of ['picture','figcaption a','.build-carousel-controls','.build-carousel-count','.build-carousel-status','[data-carousel="previous"]','[data-carousel="next"]','[data-carousel="play"]']){
    elements[key]={hidden:true,disabled:false,textContent:'',addEventListener(name,fn){events.set(key+name,fn);},replaceChildren(img){this.image=img;}};
  }
  const root={querySelector:s=>elements[s],setAttribute(){},removeAttribute(){},contains(el){return Object.values(elements).includes(el);},addEventListener(n,f){events.set(n,f);}};
  const document={getElementById:()=>root,hidden:false,activeElement:null,addEventListener(n,f){events.set('document'+n,f);}};
  class Image{constructor(){loads++;this.style={};}decode(){return failed?Promise.reject(Error('network')):Promise.resolve();}}
  const motion={matches:false,addEventListener(n,f){motionListener=f;}};
  class IntersectionObserver{constructor(fn){intersection=fn;}observe(){}}
  vm.runInNewContext(script,{document,window:{matchMedia:()=>motion,IntersectionObserver},IntersectionObserver,Image,setTimeout:(fn,delay)=>{timers.set(++seq,{fn,delay});return seq;},clearTimeout:id=>timers.delete(id)});
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  return {
    elements,document,motion,timers,events,
    get loads(){return loads;},
    failImages(){failed=true;},
    async click(name){events.get('[data-carousel="'+name+'"]click')();await flush();},
    async tick(){assert.equal(timers.size,1);const [id,{fn,delay}]=[...timers][0];assert.equal(delay,7000);timers.delete(id);fn();await flush();},
    focusPlay(){document.activeElement=elements['[data-carousel="play"]'];events.get('focusin')({target:document.activeElement});},
    focusCaption(){document.activeElement=elements['figcaption a'];events.get('focusin')({target:document.activeElement});},
    hover(){events.get('picturemouseenter')();},
    visibility(hidden){document.hidden=hidden;events.get('documentvisibilitychange')();},
    intersect(visible){intersection([{isIntersecting:visible}]);},
    reduceMotion(){motion.matches=true;motionListener();}
  };
}

test('no unsolicited playback or image loading; curated assets and destinations exist',()=>{
  const h=setup();assert.equal(h.loads,0);assert.equal(h.timers.size,0);
  assert.equal(h.elements['.build-carousel-controls'].hidden,false);
  assert.equal(slides.length,12);
  assert.equal(new Set(slides.map(s=>s.href)).size,9);
  assert.equal(new Set(slides.map(s=>s.src)).size,slides.length);
  for(const slide of slides){
    for(const url of [slide.href,slide.src,...slide.set.split(',').map(s=>s.trim().split(' ')[0])]){
      assert.ok(fs.existsSync(path.join('retail',url)),url);
    }
  }
});

test('Play advances with pointer inside the carousel and focus still on Play',async()=>{
  const h=setup();h.hover();h.focusPlay();await h.click('play');
  assert.equal(h.timers.size,1);
  assert.equal(h.elements['[data-carousel="play"]'].textContent,'Pause slideshow');
  await h.tick();assert.equal(h.elements['.build-carousel-count'].textContent,'2 / 12');
  assert.equal(h.elements['figcaption a'].href,'/lucas-2018-sti-emtron.html');
  await h.tick();assert.equal(h.elements['.build-carousel-count'].textContent,'3 / 12');
  assert.equal(h.document.activeElement,h.elements['[data-carousel="play"]']);
  await h.click('play');assert.equal(h.timers.size,0);
});

test('reading the picture or focusing its caption pauses until explicit Play resumes',async()=>{
  const h=setup();await h.click('play');h.hover();assert.equal(h.timers.size,0);
  assert.equal(h.elements['[data-carousel="play"]'].textContent,'Play slideshow');
  await h.click('play');assert.equal(h.timers.size,1);
  h.focusCaption();assert.equal(h.timers.size,0);
  await h.click('play');assert.equal(h.timers.size,1);
});

test('returning focus to Pause does not restart playback when it is clicked',async()=>{
  const h=setup();await h.click('play');h.focusPlay();
  assert.equal(h.elements['[data-carousel="play"]'].textContent,'Pause slideshow');
  await h.click('play');assert.equal(h.timers.size,0);
  assert.equal(h.elements['[data-carousel="play"]'].textContent,'Play slideshow');
});

test('manual controls wrap, stop playback and apply the selected crop',async()=>{
  const h=setup();await h.click('previous');assert.equal(h.elements['.build-carousel-count'].textContent,'12 / 12');
  await h.click('next');assert.equal(h.elements['.build-carousel-count'].textContent,'1 / 12');
  for(let i=0;i<8;i++)await h.click('next');
  assert.equal(h.elements['.build-carousel-count'].textContent,'9 / 12');
  assert.equal(h.elements.picture.image.style.objectPosition,'center 42%');
  await h.click('play');await h.click('next');assert.equal(h.timers.size,0);
});

test('hidden tab, offscreen carousel and motion preference stop unnecessary timers',async()=>{
  const h=setup();await h.click('play');h.visibility(true);assert.equal(h.timers.size,0);
  h.visibility(false);assert.equal(h.timers.size,1);
  h.intersect(false);assert.equal(h.timers.size,0);
  h.intersect(true);assert.equal(h.timers.size,1);
  h.reduceMotion();assert.equal(h.timers.size,0);
  assert.equal(h.elements['[data-carousel="play"]'].textContent,'Play slideshow');
});

test('failed photos retain the current slide and restore usable controls',async()=>{
  const h=setup();await h.click('next');const caption=h.elements['figcaption a'].href;
  h.failImages();await h.click('play');await h.tick();
  assert.equal(h.elements['.build-carousel-count'].textContent,'2 / 12');
  assert.equal(h.elements['figcaption a'].href,caption);
  assert.match(h.elements['.build-carousel-status'].textContent,/could not load/);
  assert.equal(h.elements['[data-carousel="next"]'].disabled,false);
  assert.equal(h.timers.size,0);
});
