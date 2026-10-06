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
  const otsInterests = {
    va: '2015–2021 WRX OTS map — $150',
    vb: '2022+ WRX OTS map — $150'
  };
  document.querySelectorAll('[data-ots]').forEach(link => link.addEventListener('click', () => {
    const interest = otsInterests[link.dataset.ots];
    if (!interest) return;
    form.elements.tuning_interest.value = interest;
    if (form.elements.hardware_package.value === 'Other / custom e-tune / unsure') {
      form.elements.hardware_package.value = '';
    }
  }));
})();