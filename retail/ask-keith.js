(() => {
  if (document.getElementById('ask-keith')) return;
  const style = document.createElement('style');
  style.textContent = `#ask-keith{position:fixed;right:20px;bottom:20px;z-index:1000;font:15px/1.5 'DM Sans',sans-serif;color:#111720}#ask-keith summary{list-style:none;cursor:pointer;background:#ff6336;color:#111720;border:2px solid #111720;border-radius:12px;padding:12px 10px;font-weight:700;box-shadow:0 4px 20px #0003;min-height:48px;width:115px;height:50.5px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:7px;margin-left:auto}#ask-keith summary::-webkit-details-marker{display:none}#ask-keith summary:focus-visible,#ask-keith a:focus-visible,#ask-keith button:focus-visible{outline:3px solid #2371c8;outline-offset:4px}#ask-keith .ask-panel{position:absolute;right:0;bottom:66px;background:#fff;border:1px solid #dce0e5;border-radius:16px;padding:24px;width:340px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 110px);overflow:auto;box-shadow:0 12px 40px #0003}#ask-keith h2{font:700 24px/1.2 'DM Sans',sans-serif;margin:0 35px 12px 0}#ask-keith p{margin:0 0 16px;font-size:15px}#ask-keith .ask-close{position:absolute;right:12px;top:12px;border:0;background:#edf0f3;border-radius:50%;width:36px;height:36px;font-size:24px;cursor:pointer;color:#111720}#ask-keith .ask-link{display:block;text-decoration:none;font-weight:700;border-radius:8px;padding:13px;margin:10px 0;text-align:center;background:#ff6336;color:#111720}#ask-keith .ask-book{background:#111720;color:#fff}#ask-keith .ask-hours{font-size:13px;color:#59616b;margin-top:16px;margin-bottom:0}body{padding-bottom:86px}@media(max-width:600px){#ask-keith{right:16px;bottom:calc(16px + env(safe-area-inset-bottom))}}`;
  document.head.append(style);
  const box = document.createElement('details'); box.id = 'ask-keith';
  const message = encodeURIComponent('Hi Keith! I found Tuned by Keith and would like to discuss my setup.\nVehicle/year:\nECU or tuning platform:\nModifications and fuel:\nGoals or questions:');
  box.innerHTML = `<summary aria-label="Talk to Keith" title="Talk to Keith"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 10h8M8 14h5"/></svg></summary><section class="ask-panel" aria-label="Contact Keith"><button class="ask-close" type="button" aria-label="Close Ask Keith">×</button><h2>Talk to Keith.</h2><p>Tell me about your vehicle, tuning platform and goals.</p><a class="ask-link" href="mailto:keith@acalibrations.com?subject=Tuned%20by%20Keith%20inquiry">Email Keith directly ↗</a><a class="ask-link" href="sms:+14699337075">Text Keith ↗</a><a class="ask-link" href="https://wa.me/14699337075?text=${message}" target="_blank" rel="noopener noreferrer">Chat on WhatsApp ↗</a><a class="ask-link ask-book" href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1uwmWzZYBTlf0F6ZN7jSnhNaSlM-oJDkHatsmJCgnErI9C6S3hx7M77WzOxICKiBd8jdaE5WOm" target="_blank" rel="noopener noreferrer">Book a 30-minute appointment ↗</a><p class="ask-hours">Monday–Friday · 8 a.m.–6 p.m. Pacific<br>Messages open in WhatsApp. I’ll reply when available.</p></section>`;
  const close = () => { box.open=false; box.querySelector('summary').focus(); };
  box.querySelector('button').addEventListener('click',close);
  box.addEventListener('keydown',event => {if(event.key==='Escape'){event.preventDefault();close();}});
  document.body.append(box);
})();

// Traffic measurement and inquiry attribution. Never send form contents to analytics.
(() => {
  const clean = value => String(value || '').replace(/[^a-zA-Z0-9_ .-]/g, '').slice(0, 100);
  const query = new URLSearchParams(location.search);
  let attribution = {};
  try { attribution = JSON.parse(sessionStorage.getItem('tbk-attribution') || '{}'); } catch {}
  if (query.has('utm_source')) {
    attribution = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(key => {
      if (query.has(key)) attribution[key] = clean(query.get(key));
    });
    try { sessionStorage.setItem('tbk-attribution', JSON.stringify(attribution)); } catch {}
  }
  // Keep the first landing page and most recent service guide with the inquiry.
  // Store only known public paths, never query strings, fragments or form values.
  const knownPages = new Set(["/","/about-keith-fields.html","/cobb-custom-tuning.html","/dyno-tuning/","/build-examples.html","/2024-wrx-cinderelli-e70.html","/2019-sti-bcp-turbo-93-octane.html","/prepare-for-tuning-consultation.html","/tuning-glossary.html","/shop.html","/cobb-green-speed.html","/lucas-bamford-2018-sti-emtron.html","/keith-fields-white-2015-sti.html","/2022-plus-wrx-etuning.html","/2015-2021-wrx-etuning.html","/ej-wrx-sti-etuning.html","/emtron-tuning.html","/haltech-tuning.html","/motec-tuning.html","/link-ecu-tuning.html","/ecutek-brz-tuning.html","/ecutek-tuning.html","/porsche-tuning.html","/subaru-wrx-sti-tuning.html","/standalone-ecu-tuning.html","/media.html","/terms.html","/privacy.html","/vr30-ecutek-tuning.html"]);
  const servicePages = new Set(["/cobb-custom-tuning.html","/dyno-tuning/","/2022-plus-wrx-etuning.html","/2015-2021-wrx-etuning.html","/ej-wrx-sti-etuning.html","/emtron-tuning.html","/haltech-tuning.html","/motec-tuning.html","/link-ecu-tuning.html","/ecutek-brz-tuning.html","/ecutek-tuning.html","/porsche-tuning.html","/subaru-wrx-sti-tuning.html","/standalone-ecu-tuning.html","/vr30-ecutek-tuning.html"]);
  let journey = {};
  try {
    const saved = JSON.parse(sessionStorage.getItem('tbk-journey') || '{}');
    if (saved && knownPages.has(saved.landing_page)) journey.landing_page = saved.landing_page;
    if (saved && servicePages.has(saved.service_page)) journey.service_page = saved.service_page;
  } catch {}
  if (!journey.landing_page && knownPages.has(location.pathname)) journey.landing_page = location.pathname;
  if (servicePages.has(location.pathname)) journey.service_page = location.pathname;
  try { sessionStorage.setItem('tbk-journey', JSON.stringify(journey)); } catch {}
  document.querySelectorAll('form[action*="formsubmit.co"]').forEach(form => {
    const values = { ...attribution, ...journey, inquiry_page: location.pathname };
    for (const [name, value] of Object.entries(values)) {
      const field = document.createElement('input');
      field.type = 'hidden'; field.name = name; field.value = value;
      form.append(field);
    }
  });
  if (location.hostname !== 'www.tunedbykeith.com' && location.hostname !== 'tunedbykeith.com') return;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.va('beforeSend', event => {
    const url = new URL(event.url);
    const tags = new URLSearchParams();
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(key => {
      if (url.searchParams.has(key)) tags.set(key, clean(url.searchParams.get(key)));
    });
    url.search = tags.toString(); url.hash = '';
    return { ...event, url: url.toString() };
  });
  if (!document.querySelector('script[src="/_vercel/insights/script.js"]')) {
    const script = document.createElement('script');
    script.src = '/_vercel/insights/script.js'; script.defer = true;
    document.head.append(script);
  }
})();

// Give existing customers a direct route to leave honest feedback.
(() => {
  const footer = document.querySelector('footer nav');
  if (!footer || footer.querySelector('[data-google-review]')) return;
  const link = document.createElement('a');
  link.href = 'https://g.page/r/CfxLTGqJjOFTEBM/review';
  link.textContent = 'Review Tuned by Keith on Google';
  link.dataset.googleReview = 'true';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  footer.append(link);
})();

// Keep customer policies accessible from every shared footer.
(() => {
 const footer = document.querySelector('footer nav');
 if (!footer) return;
 for (const [href, label] of [['/terms.html', 'Terms & refunds'], ['/privacy.html', 'Privacy']]) {
  if ([...footer.querySelectorAll('a')].some(a => new URL(a.href).pathname === href)) continue;
  const a = document.createElement('a'); a.href = href; a.textContent = label; footer.append(a);
 }
})();
