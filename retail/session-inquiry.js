(() => {
  const form = document.getElementById('inquiry-form');
  if (!form) return;
  const services = {dyno: 'Dyno tuning', travel: 'Worldwide travel tuning', shop: 'Host a shop dyno day'};
  const service = services[new URLSearchParams(location.search).get('session')];
  if (service) form.elements.service.value = service;
})();
