// Optional Google Analytics. No Google tag loads until the visitor opts in.
(() => {
  if (!['www.tunedbykeith.com', 'tunedbykeith.com'].includes(location.hostname)) return;
  const id = 'G-NTVQD1HRNV';
  const key = 'tbk-analytics-choice';
  const pendingKey = 'tbk-inquiry-pending';
  let choice = '';
  try { choice = localStorage.getItem(key) || ''; } catch {}
  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  if (privacySignal) choice = 'no';
  let started = false;
  window.dataLayer = window.dataLayer || [];
  function tag() { window.dataLayer.push(arguments); }
  let referrer = '';
  try { referrer = new URL(document.referrer).origin + '/'; } catch {}
  const page = () => ({page_location: location.origin + location.pathname, page_referrer: referrer, page_title: document.title});
  function event(name, params = {}) {
    if (choice === 'yes' && started) tag('event', name, {...page(), ...params});
  }
  function confirmation() {
    if (location.pathname !== '/inquiry-received.html' || choice !== 'yes') return;
    let pending;
    try { pending = Number(sessionStorage.getItem(pendingKey)); } catch { return; }
    if (!pending || Date.now() - pending > 60 * 60 * 1000 || pending > Date.now()) return;
    try { sessionStorage.removeItem(pendingKey); } catch { return; }
    // A return from the form workflow, not proof of email delivery or a paid order.
    event('inquiry_confirmation', {form_name: 'website_inquiry'});
  }
  function start() {
    if (choice !== 'yes' || privacySignal) return;
    if (started) { window['ga-disable-' + id] = false; return; }
    started = true;
    window['ga-disable-' + id] = false;
    tag('consent', 'default', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    tag('js', new Date());
    tag('config', id, {...page(), send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.append(script);
    event('page_view');
    confirmation();
  }
  function removeCookies() {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) continue;
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
  panel.setAttribute('aria-label','Optional analytics');
  panel.hidden = Boolean(choice);
  panel.innerHTML = '<p><strong>Help improve this website?</strong><br>Allow optional Google Analytics cookies to measure visits and contact actions. Your message contents are not sent. <a href="/privacy.html">Privacy details</a></p><button type="button" data-choice="yes">Allow analytics</button><button type="button" data-choice="no">No thanks</button>';
  document.body.append(panel);
  panel.addEventListener('click', e => {
    const button = e.target.closest('button[data-choice]');
    if (!button) return;
    choice = privacySignal ? 'no' : button.dataset.choice;
    try { localStorage.setItem(key, choice); } catch {}
    panel.hidden = true;
    if (choice === 'yes') start();
    else {
      window['ga-disable-' + id] = true;
      removeCookies();
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
      if (privacySignal) allow.textContent = 'Browser privacy signal respected';
      panel.querySelector('[data-choice="no"]').focus();
    });
    footer.append(settings);
  }
  document.querySelectorAll('form[action*="formsubmit.co"]').forEach(form => {
    if (!form.querySelector('input[name="_next"]')) {
      const next = document.createElement('input');
      next.type = 'hidden'; next.name = '_next';
      next.value = 'https://www.tunedbykeith.com/inquiry-received.html';
      form.append(next);
    }
    form.addEventListener('submit', () => {
      try { sessionStorage.setItem(pendingKey, String(Date.now())); } catch {}
      event('inquiry_start', {form_name:'website_inquiry'});
    });
  });
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    let url; try { url = new URL(link.href); } catch { return; }
    const channel = url.protocol === 'mailto:' ? 'email' : url.protocol === 'tel:' ? 'phone' : url.protocol === 'sms:' ? 'sms' : url.hostname === 'wa.me' ? 'whatsapp' : url.hostname === 'calendar.google.com' ? 'booking' : '';
    if (channel) event('contact_click', {contact_method:channel});
  });
  start();
})();

