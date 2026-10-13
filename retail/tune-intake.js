(() => {
  const form = document.getElementById('tune-intake');
  if (!form) return;
  const query = new URLSearchParams(location.search);
  const service = query.get('service');
  const supportedServices = {
    etune: 'Custom e-tune — $400 for most setups',
    ecutek: 'EcuTek tuning / package — individual quote',
    porsche: 'Porsche tuning / project — quote after setup review',
    standalone: 'Standalone ECU tuning — individual quote',
    package: 'ECU sales / complete package — individual quote'
  };
  if (Object.hasOwn(supportedServices, service)) {
    form.elements.tuning_interest.value = supportedServices[service];
    form.elements.hardware_package.value = 'Other / custom e-tune / unsure';
    const vehicle = query.get('vehicle');
    if (vehicle) form.elements.vehicle.placeholder = 'Exact year and model — ' + vehicle.slice(0, 200);
    const platform = service === 'ecutek' ? 'EcuTek — BRZ / Nissan / Infiniti / Toyota GR' : query.get('platform');
    if ([...form.elements.platform.options].some(option => option.value === platform)) form.elements.platform.value = platform;
    if (service === 'ecutek') {
      const applications = {
        vr30: {placeholder:'Year, model and trim, e.g. 2018 Infiniti Q50 Red Sport',text:'VR30 EcuTek review: include your year, model, trim, transmission, fuel and modifications. Interface, licensing, compatibility and revision scope are confirmed before a quote.'},
        brz: {placeholder:'Year and model, e.g. 2024 Toyota GR86',text:'BRZ / GR86 EcuTek review: include your model year, transmission, fuel and modifications. Tell me whether you need tuning only or a hardware package.'}
      };
      const application = query.get('application');
      const context = document.getElementById('inquiry-service-context');
      if (Object.hasOwn(applications, application)) {
        form.elements.vehicle.placeholder = applications[application].placeholder;
        if (context) { context.textContent = applications[application].text; context.hidden = false; }
      }
    }
    if (service === 'porsche') {
      form.elements.vehicle.placeholder = 'Year and model, e.g. 2018 Porsche 911 Turbo S';
      const context = document.getElementById('inquiry-service-context');
      if (context) {
        context.textContent = 'Porsche setup review: include your exact model year, model and transmission. Scope and pricing are confirmed after review.';
        context.hidden = false;
      }
    }
    if (service === 'standalone' || service === 'package') {
      const context = document.getElementById('inquiry-service-context');
      if (context) {
        context.textContent = 'Standalone project review: include your exact ECU model, engine specification, current running condition and location. Equipment, calibration and travel are scoped before a quote.';
        context.hidden = false;
      }
    }
  }
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
