(() => {
  const form = document.getElementById('inquiry-form');
  if (!form) return;
  const services = {dyno: 'Dyno tuning', travel: 'Worldwide travel tuning', shop: 'Host a shop dyno day'};
  const key = new URLSearchParams(location.search).get('session');
  if (!Object.prototype.hasOwnProperty.call(services, key)) return;
  const service = services[key];
  if (form.elements.service) form.elements.service.value = service;
  const details = form.querySelector('details');
  if (details) details.open = true;
  const context = document.createElement('p');
  context.className = 'form-note';
  context.id = 'session-inquiry-context';
  context.textContent = 'Session inquiry: ' + service + '. Share your location and any preferred dates below. This does not book a session; availability and pricing are confirmed with Keith.';
  form.prepend(context);
})();
