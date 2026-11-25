(()=>{
'use strict';
const root=document.getElementById('hero-builds');
if(!root)return;
const picture=root.querySelector('picture');
const caption=root.querySelector('figcaption a');
const controls=root.querySelector('.build-carousel-controls');
const count=root.querySelector('.build-carousel-count');
const status=root.querySelector('.build-carousel-status');
const prev=root.querySelector('[data-carousel="previous"]');
const next=root.querySelector('[data-carousel="next"]');
const play=root.querySelector('[data-carousel="play"]');
const slides=[
  {
    "title": "Cinderelli / Subiefest",
    "href": "/2024-wrx-cinderelli-e70.html",
    "alt": "Cinderelli, the orange 2024 WRX, with the hood open at Subiefest 2025",
    "src": "/assets/builds/cinderelli-subiefest-front.webp",
    "set": "/assets/builds/cinderelli-subiefest-front-400.webp 400w, /assets/builds/cinderelli-subiefest-front-720.webp 720w, /assets/builds/cinderelli-subiefest-front.webp 1200w",
    "width": 1200,
    "height": 951
  },
  {
    "title": "Lucas / Emtron STI",
    "href": "/lucas-2018-sti-emtron.html",
    "alt": "Lucas’s grey 2018 STI on AWD Tuning’s dyno",
    "src": "/assets/builds/lucas-2018-sti-awd.webp",
    "set": "/assets/builds/lucas-2018-sti-awd-400.webp 400w, /assets/builds/lucas-2018-sti-awd-720.webp 720w, /assets/builds/lucas-2018-sti-awd.webp 1200w",
    "width": 1200,
    "height": 900
  },
  {
    "title": "James / WRX on track",
    "href": "/james-2024-wrx-build.html",
    "alt": "James’s blue 2024 WRX, number 27, on track at MotorSport Ranch",
    "src": "/assets/builds/james-wrx-msr-track.webp",
    "set": "/assets/builds/james-wrx-msr-track-400.webp 400w, /assets/builds/james-wrx-msr-track.webp 720w",
    "width": 720,
    "height": 480
  },
  {
    "title": "Thomas / HKS turbo GR86",
    "href": "/thomas-2024-gr86-hks-turbo.html",
    "alt": "Thomas’s white GR86 with gold wheels",
    "src": "/assets/builds/thomas-gr86-hks-front.webp",
    "set": "/assets/builds/thomas-gr86-hks-front-400.webp 400w, /assets/builds/thomas-gr86-hks-front-720.webp 720w, /assets/builds/thomas-gr86-hks-front.webp 1200w",
    "width": 1200,
    "height": 802
  },
  {
    "title": "Keith / STI workshop development",
    "href": "/keith-2015-sti.html",
    "alt": "Keith’s white 2015 STI with its hood open in the AWD Tuning workshop",
    "src": "/assets/builds/keith-2015-sti-workshop-front.webp",
    "set": "/assets/builds/keith-2015-sti-workshop-front-400.webp 400w, /assets/builds/keith-2015-sti-workshop-front-720.webp 720w, /assets/builds/keith-2015-sti-workshop-front.webp 1200w",
    "width": 1200,
    "height": 800
  },
  {
    "title": "Krispy / Haltech Legacy GT",
    "href": "/krispy-2005-legacy-gt-haltech.html",
    "alt": "Krispy’s finished Legacy GT at Subiefest",
    "src": "/assets/builds/krispy-lgt-finished.webp",
    "set": "/assets/builds/krispy-lgt-finished.webp 1599w",
    "width": 1599,
    "height": 1600
  },
  {
    "title": "Juan / Haltech STI",
    "href": "/juan-2013-sti-haltech-build.html",
    "alt": "Juan’s finished dark grey 2013 STI parked outside AWD Tuning",
    "src": "/assets/builds/juan-sti-finished-exterior.webp",
    "set": "/assets/builds/juan-sti-finished-exterior.webp 1280w",
    "width": 1280,
    "height": 720
  },
  {
    "title": "Keith / STI at sunset",
    "href": "/keith-2015-sti.html",
    "alt": "Side view of Keith’s white STI against a sunset sky",
    "src": "/assets/builds/keith-2015-sti-sunset-side.webp",
    "set": "/assets/builds/keith-2015-sti-sunset-side-400.webp 400w, /assets/builds/keith-2015-sti-sunset-side-720.webp 720w, /assets/builds/keith-2015-sti-sunset-side.webp 1200w",
    "width": 1200,
    "height": 800
  },
  {
    "title": "Lucas / Emtron engine bay",
    "href": "/lucas-2018-sti-emtron.html",
    "alt": "Engine bay of Lucas’s grey 2018 STI in the AWD Tuning workshop",
    "src": "/assets/builds/lucas-2018-sti-engine-bay.webp",
    "set": "/assets/builds/lucas-2018-sti-engine-bay-400.webp 400w, /assets/builds/lucas-2018-sti-engine-bay-720.webp 720w, /assets/builds/lucas-2018-sti-engine-bay.webp 750w",
    "width": 750,
    "height": 1000,
    "position": "center 42%"
  },
  {
    "title": "Thomas / Haltech STI build",
    "href": "/thomas-2004-sti-haltech-build.html",
    "alt": "Thomas’s blue 2004 STI showing its front intercooler and engine during the 2024 build",
    "src": "/assets/builds/thomas-2004-sti-front-2024.webp",
    "set": "/assets/builds/thomas-2004-sti-front-2024-400.webp 400w, /assets/builds/thomas-2004-sti-front-2024-720.webp 720w, /assets/builds/thomas-2004-sti-front-2024.webp 1200w",
    "width": 1200,
    "height": 900
  },
  {
    "title": "Jaycee / Focus RS workshop build",
    "href": "/jaycee-2017-focus-rs-build.html",
    "alt": "Jaycee’s grey 2017 Focus RS with its hood open during its AWD Tuning workshop build",
    "src": "/assets/builds/jaycee-2017-focus-rs-awd.jpg",
    "set": "/assets/builds/jaycee-2017-focus-rs-awd-400.webp 400w, /assets/builds/jaycee-2017-focus-rs-awd.jpg 720w",
    "width": 720,
    "height": 540
  },
  {
    "title": "Cinderelli / Under the hood",
    "href": "/2024-wrx-cinderelli-e70.html",
    "alt": "Engine bay of Cinderelli’s orange 2024 WRX at Subiefest 2025",
    "src": "/assets/builds/cinderelli-subiefest-engine.webp",
    "set": "/assets/builds/cinderelli-subiefest-engine-400.webp 400w, /assets/builds/cinderelli-subiefest-engine-720.webp 720w, /assets/builds/cinderelli-subiefest-engine.webp 1200w",
    "width": 1200,
    "height": 800
  }
];
let index=0,playing=false,busy=false,visible=true,timer;
const motion=window.matchMedia('(prefers-reduced-motion: reduce)');

function schedule(){
  clearTimeout(timer);
  // Explicit Play must work even while its button retains focus and hover.
  if(playing&&!busy&&visible&&!document.hidden){
    timer=setTimeout(()=>show(index+1,false),7000);
  }
}
function setPlaying(value){
  playing=value;
  play.textContent=playing?'Pause slideshow':'Play slideshow';
  schedule();
}
function pauseForInteraction(){
  if(!playing)return;
  setPlaying(false);
  status.textContent='Slideshow paused. Choose Play slideshow to resume.';
}
async function show(value,manual){
  if(busy)return;
  if(manual)setPlaying(false);
  const target=(value+slides.length)%slides.length;
  const slide=slides[target];
  if(target===index)return;
  busy=true;
  prev.disabled=next.disabled=true;
  root.setAttribute('aria-busy','true');
  clearTimeout(timer);
  const img=new Image();
  img.alt=slide.alt;
  img.width=slide.width;
  img.height=slide.height;
  img.decoding='async';
  img.sizes='(max-width: 800px) 88vw, calc(40.93vw - 1.4rem)';
  img.style.objectPosition=slide.position||'center';
  img.srcset=slide.set;
  img.src=slide.src;
  try{
    await img.decode();
    picture.replaceChildren(img);
    caption.href=slide.href;
    caption.textContent=slide.title+' / Explore the build →';
    index=target;
    count.textContent=(index+1)+' / '+slides.length;
    if(manual)status.textContent='Build '+(index+1)+' of '+slides.length+': '+slide.title;
  }catch(error){
    setPlaying(false);
    status.textContent='That photo could not load. Please try again.';
  }finally{
    busy=false;
    prev.disabled=next.disabled=false;
    root.removeAttribute('aria-busy');
    schedule();
  }
}
prev.addEventListener('click',()=>show(index-1,true));
next.addEventListener('click',()=>show(index+1,true));
play.addEventListener('click',()=>{
  setPlaying(!playing);
  status.textContent=playing?'Slideshow playing. Photos change every seven seconds.':'Slideshow paused.';
});
// Reading the picture or focusing its links pauses rotation. The toggle is
// excluded so moving back to Pause cannot pause before the click and restart.
root.addEventListener('focusin',event=>{
  if(event.target!==play)pauseForInteraction();
});
picture.addEventListener('mouseenter',pauseForInteraction);
document.addEventListener('visibilitychange',schedule);
motion.addEventListener('change',()=>{if(motion.matches)setPlaying(false);});
if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    schedule();
  },{threshold:.4}).observe(root);
}
// No rotation or extra image request until the visitor chooses a control.
count.textContent='1 / '+slides.length;
controls.hidden=false;
})();
