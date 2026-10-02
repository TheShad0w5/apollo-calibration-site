(() => {
  const form = document.getElementById('tune-intake');
  if (!form) return;
  if (globalThis.crypto?.randomUUID) {
    const reference = 'TBK-' + new Date().toISOString().slice(0,10).replaceAll('-','') + '-' + crypto.randomUUID().toUpperCase();
    form.elements.inquiry_reference.value = reference;
    document.getElementById('inquiry-reference').textContent = 'Your inquiry reference: ' + reference;
    form.elements._subject.value = 'Tuned by Keith setup review — ' + reference;
  }
  document.querySelectorAll('[data-base-map]').forEach(link => link.addEventListener('click', () => {
    form.elements.tuning_interest.value = 'Base map service — $50';
    form.elements.hardware_package.value = 'Other / custom e-tune / unsure';
  }));
  document.querySelectorAll('[data-etune]').forEach(link => link.addEventListener('click', () => {
    form.elements.tuning_interest.value = 'Custom e-tune — $400 for most setups';
    form.elements.hardware_package.value = 'Other / custom e-tune / unsure';
  }));
})();
