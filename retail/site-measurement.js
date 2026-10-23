// Optional Google Analytics. No Google tag loads until the visitor opts in.
(() => {
  if (!['www.tunedbykeith.com', 'tunedbykeith.com'].includes(location.hostname)) return;
  const id = 'G-NTVQD1HRNV';
  const key = 'tbk-analytics-choice';
  const adsKey = 'tbk-ad-measurement-choice';
  let adsChoice = '';
  try { adsChoice = localStorage.getItem(adsKey) || ''; } catch {}
  const pendingKey = 'tbk-inquiry-pending';
  // Explicit QA sessions use separate event names and mark form submissions.
  const testKey = 'tbk-measurement-test';
  const testOption = new URLSearchParams(location.search).get('tbk_test');
  let isTest = testOption === '1';
  try {
    if (testOption === '1') sessionStorage.setItem(testKey, '1');
    if (testOption === '0') sessionStorage.removeItem(testKey);
    isTest = sessionStorage.getItem(testKey) === '1';
  } catch {}
  let choice = '';
  try { choice = localStorage.getItem(key) || ''; } catch {}
  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  if (privacySignal) { choice = 'no'; adsChoice = 'no'; }
  let started = false;
  window.dataLayer = window.dataLayer || [];
  function tag() { window.dataLayer.push(arguments); }
  let referrer = '';
  try { referrer = new URL(document.referrer).origin + '/'; } catch {}
  // FormSubmit is a workflow return, not a new acquisition source.
  const formReturn = referrer === 'https://formsubmit.co/' || referrer === 'https://www.formsubmit.co/';
  // Keep deliberate campaign labels while excluding arbitrary query strings.
  const campaign = {};
  const query = new URLSearchParams(location.search);
  for (const [param, field] of Object.entries({utm_source:'campaign_source', utm_medium:'campaign_medium', utm_campaign:'campaign_name', utm_content:'campaign_content'})) {
    const value = query.get(param) || '';
    if (/^[a-zA-Z0-9_.-]{1,100}$/.test(value)) campaign[field] = value;
  }
  // Only an explicit ad-measurement opt-in permits click identifiers. Never forward arbitrary queries.
  function measuredLocation() {
    const url = new URL(location.origin + location.pathname);
    if (choice === 'yes' && adsChoice === 'yes' && !privacySignal && !isTest) {
      for (const name of ['gclid', 'gbraid', 'wbraid']) {
        const value = query.get(name) || '';
        if (/^[A-Za-z0-9_-]{1,256}$/.test(value)) url.searchParams.set(name, value);
      }
    }
    return url.href;
  }
  function consentState() {
    const analytics = choice === 'yes' && !privacySignal;
    const ads = analytics && adsChoice === 'yes' && !isTest;
    return {analytics_storage:analytics?'granted':'denied', ad_storage:ads?'granted':'denied',
      ad_user_data:ads?'granted':'denied', ad_personalization:'denied'};
  }
  tag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
  const page = () => ({page_location: measuredLocation(), page_referrer: referrer, page_title: document.title, ...(formReturn ? {ignore_referrer:true} : {})});
  const inquiryPages = new Set(['/porsche-tuning.html', '/subaru-wrx-sti-tuning.html', '/shop.html', '/', '/index.html', '/dyno-tuning/']);
  const builds = new Set(['911-cobb','macan-cobb','964-kinsler','james-wrx','lucas-sti','cinderelli-wrx','keith-sti','2019-sti']);
  const sourceBuild = builds.has(query.get('build')) ? query.get('build') : '';
  const context = {inquiry_page:location.pathname, ...(sourceBuild ? {build_source:sourceBuild} : {})};

  const attributionKey='tbk-campaign-attribution';
  const pageBuilds={'/porsche-911-turbo-s-cobb-results.html':'911-cobb','/porsche-964-kinsler-engine-tuning.html':'964-kinsler','/lucas-bamford-2018-sti-emtron.html':'lucas-sti','/2024-wrx-cinderelli-e70.html':'cinderelli-wrx','/keith-fields-white-2015-sti.html':'keith-sti','/2019-sti-bcp-turbo-93-octane.html':'2019-sti'};
  function attribution(){
    if(choice!=='yes')return {};
    let saved={};try{saved=JSON.parse(sessionStorage.getItem(attributionKey)||'{}')}catch{}
    const vehicle=/porsche/.test(location.pathname)?'porsche':/wrx|sti|subaru/.test(location.pathname)?'subaru':saved.vehicle;
    const a={...saved,...(vehicle?{vehicle}:{}),...(sourceBuild||pageBuilds[location.pathname]?{build:sourceBuild||pageBuilds[location.pathname]}:{})};
    for(const [k,v]of Object.entries(campaign))a[{campaign_source:'source',campaign_medium:'medium',campaign_name:'campaign',campaign_content:'content'}[k]]=v;
    try{sessionStorage.setItem(attributionKey,JSON.stringify(a))}catch{}
    return a;
  }
  function funnelContext(){const a=attribution();return {...(a.vehicle?{vehicle_group:a.vehicle}:{}),...(a.build?{build_source:a.build}:{}),...(a.campaign?{promotion_campaign:a.campaign}:{})};}

  function event(name, params = {}) {
    if (choice === 'yes' && started) tag('event', isTest ? 'test_' + name : name, {...page(), ...funnelContext(), ...params});
  }
  function confirmation() {
    if (location.pathname !== '/inquiry-received.html' || choice !== 'yes') return;
    let pending;
    try { pending = JSON.parse(sessionStorage.getItem(pendingKey) || 'null'); } catch { return; }
    const time = typeof pending === 'number' ? pending : pending?.time;
    if (!time || Date.now() - time > 60 * 60 * 1000 || time > Date.now()) return;
    try { sessionStorage.removeItem(pendingKey); } catch { return; }
    // A return from the form workflow, not proof of email delivery or a paid order.
    event('inquiry_confirmation', {form_name: 'website_inquiry', ...(inquiryPages.has(pending.inquiry_page) ? {inquiry_page:pending.inquiry_page} : {}), ...(builds.has(pending.build_source) ? {build_source:pending.build_source} : {})});
  }
  function start() {
    if (choice !== 'yes' || privacySignal) return;
    tag('consent', 'update', consentState());
    if (started) { window['ga-disable-' + id] = false; tag('config', id, {...page(), ...campaign, send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false}); return; }
    started = true;
    window['ga-disable-' + id] = false;
    tag('js', new Date());
    tag('config', id, {...page(), ...campaign, send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.append(script);
    event('page_view');
    confirmation();
  }
  function removeCookies(adsOnly = false) {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (!(adsOnly ? /^_gcl_/.test(name) : /^(_ga(?:_|$)|_gcl_)/.test(name))) continue;
      for (const domain of ['', '; domain=' + location.hostname, '; domain=.tunedbykeith.com']) {
        document.cookie = name + '=; Max-Age=0; path=/' + domain + '; SameSite=Lax; Secure';
      }
    }
  }
  const style = document.createElement('style');
  style.textContent = '#tbk-analytics-choice{position:fixed;bottom:88px;left:16px;z-index:999;background:#fff;color:#111720;border:1px solid #66717c;border-radius:10px;padding:16px;box-shadow:0 4px 18px #0002;width:360px;max-width:calc(100vw - 32px);box-sizing:border-box;font:14px/1.5 sans-serif}#tbk-analytics-choice[hidden]{display:none}#tbk-analytics-choice p{margin:0 0 12px;color:#111720}#tbk-analytics-choice a{color:#873216}#tbk-analytics-choice button{font:inherit;padding:9px 14px;margin-right:8px;border:1px solid #111720;border-radius:5px;background:#fff;color:#111720;cursor:pointer}#tbk-analytics-choice button:focus-visible{outline:3px solid #236ac2;outline-offset:3px}.tbk-analytics-settings{font:inherit;background:none;border:0;padding:0;color:inherit;text-decoration:underline;cursor:pointer}';
  document.head.append(style);
  const panel = document.createElement('section');
  panel.id = 'tbk-analytics-choice';
  panel.setAttribute('aria-label','Optional website measurement');
  panel.hidden = Boolean(choice);
  panel.innerHTML = '<p><strong>Help improve this website?</strong><br>Analytics measures visits and contact actions. Optional ad measurement also uses Google click identifiers and cookies to connect ad visits with inquiries. No message contents are sent; personalized ads stay off. <a href="/privacy.html">Privacy details</a></p><button type="button" data-choice="yes">Analytics only</button><button type="button" data-choice="ads">Analytics + ad measurement</button><button type="button" data-choice="no">No thanks</button>';
  document.body.append(panel);
  panel.addEventListener('click', e => {
    const button = e.target.closest('button[data-choice]');
    if (!button) return;
    choice = privacySignal || button.dataset.choice === 'no' ? 'no' : 'yes';
    adsChoice = !privacySignal && button.dataset.choice === 'ads' ? 'yes' : 'no';
    try { localStorage.setItem(key, choice); localStorage.setItem(adsKey, adsChoice); } catch {}
    if (started) tag('consent', 'update', consentState());
    if (adsChoice !== 'yes') removeCookies(true);
    panel.hidden = true;
    if (choice === 'yes') start();
    else {
      window['ga-disable-' + id] = true;
      removeCookies();
      try{sessionStorage.removeItem(attributionKey)}catch{}
    }
  });
  const footer = document.querySelector('footer nav');
  if (footer) {
    const settings = document.createElement('button');
    settings.type = 'button'; settings.className = 'tbk-analytics-settings';
    settings.textContent = 'Analytics preferences';
    settings.addEventListener('click', () => {
      panel.hidden = false;
      const allow = panel.querySelector('[data-choice="yes"]');
      allow.disabled = privacySignal;
      panel.querySelector('[data-choice="ads"]').disabled = privacySignal;
      if (privacySignal) allow.textContent = 'Browser privacy signal respected';
      panel.querySelector('[data-choice="no"]').focus();
    });
    footer.append(settings);
  }
  document.querySelectorAll('form[action*="formsubmit.co"]').forEach(form => {
    let engaged = false;
    form.addEventListener('input', () => {
      if (engaged || choice !== 'yes' || !started) return;
      engaged = true;
      event('inquiry_form_engaged', {form_name:'website_inquiry', ...context});
    });
    if (!form.querySelector('input[name="_next"]')) {
      const next = document.createElement('input');
      next.type = 'hidden'; next.name = '_next';
      next.value = 'https://www.tunedbykeith.com/inquiry-received.html';
      form.append(next);
    }
    if (isTest) {
      const marker = document.createElement('input');
      marker.type = 'hidden'; marker.name = 'website_test'; marker.value = 'YES - exclude from customer leads';
      form.append(marker);
    }
    form.addEventListener('submit', () => {
      const a=attribution();for(const [key,value]of Object.entries(a)){let field=form.querySelector('input[name="attribution_'+key+'"]');if(!field){field=document.createElement('input');field.type='hidden';field.name='attribution_'+key;form.append(field)}field.value=value;}
      try { sessionStorage.setItem(pendingKey, JSON.stringify({time:Date.now(), ...context})); } catch {}
      event('inquiry_start', {form_name:'website_inquiry', ...context});
    });
  });
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    let url; try { url = new URL(link.href); } catch { return; }
    const channel = url.protocol === 'mailto:' ? 'email' : url.protocol === 'tel:' ? 'phone' : url.protocol === 'sms:' ? 'sms' : url.hostname === 'wa.me' ? 'whatsapp' : url.hostname === 'calendar.google.com' ? 'booking' : '';
    const checkout = (url.origin===location.origin && url.pathname==='/tune') || (url.hostname==='tbk-store-production.keith-787.workers.dev'&&url.pathname==='/shop');
    if(checkout&&choice==='yes'){
      const a=attribution();url.searchParams.set('tbk_consent','1');
      for(const [k,p]of Object.entries({vehicle:'vehicle',build:'build',source:'utm_source',medium:'utm_medium',campaign:'utm_campaign',content:'utm_content'}))if(a[k])url.searchParams.set(p,a[k]);
      link.href=url.href;
      event('begin_checkout',{service_id:url.searchParams.get('service')||'unspecified',destination_path:'/shop'});
    }
    if (channel) event('contact_click', {contact_method:channel});
    const guides = new Set(['/downloads/subaru-etuning-process.pdf', '/downloads/subaru-datalogging-guide.pdf', '/downloads/vehicle-tuning-readiness-checklist.pdf']);
    if (url.origin === location.origin && guides.has(url.pathname)) event('guide_download', {guide_path:url.pathname});
    if (url.origin === location.origin && inquiryPages.has(url.pathname) && ['#request', '#inquiry-form', '#contact', '#ask-about-setup'].includes(url.hash)) {
      event('inquiry_cta_click', {destination_path:url.pathname, destination_section:url.hash.slice(1), ...(builds.has(url.searchParams.get('build')) ? {build_source:url.searchParams.get('build')} : {})});
    }
    if (url.origin === location.origin && link.closest?.('.vehicle-choices')) event('vehicle_option_click', {destination_path:url.pathname, destination_section:url.hash.slice(1)});
  });
  start();
})();


