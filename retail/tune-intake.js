(() => {
  const form = document.getElementById('tune-intake');
  if (!form) return;
  const query = new URLSearchParams(location.search);
  const service = query.get('service');
  const supportedServices = {
    road: 'Orange County road tuning — individual quote',
    cobb: 'COBB custom tuning — quote after setup review',
    etune: 'Custom e-tune — $400 for most setups',
    ecutek: 'EcuTek tuning / package — individual quote',
    porsche: 'Porsche tuning / project — quote after setup review',
    standalone: 'Standalone ECU tuning — individual quote',
    package: 'ECU sales / complete package — individual quote'
  };
  if (Object.hasOwn(supportedServices, service)) {
    form.elements.tuning_interest.value = supportedServices[service];
    form.elements.hardware_package.value = 'Other / custom e-tune / unsure';
    if (service === 'road') {
      const context = document.getElementById('inquiry-service-context');
      if (context) { context.textContent = 'Orange County road tuning: include your city, preferred dates, vehicle, fuel and modifications. Advance coordination is required; plan to leave the car for the day and arrange transportation. Scope, price and handover details are confirmed before booking.'; context.hidden = false; }
    }
    const vehicle = query.get('vehicle');
    if (vehicle) form.elements.vehicle.placeholder = 'Exact year and model — ' + vehicle.slice(0, 200);
    const platform = service === 'ecutek' ? 'EcuTek — BRZ / Nissan / Infiniti / Toyota GR' : service === 'cobb' ? 'COBB Accessport' : query.get('platform');
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
    if (service === 'cobb') {
      const context = document.getElementById('inquiry-service-context');
      if (context) { context.textContent = 'COBB setup review: include your exact year, model, engine, transmission, market and Accessport details if known. Compatibility, scope and price are confirmed before payment.'; context.hidden = false; }
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
    const context = document.getElementById('inquiry-service-context');
    if (context) { context.textContent = 'Base map review: a starting calibration for an approved setup and agreed use. Follow-up tuning is scoped separately.'; context.hidden = false; }
  }));
  document.querySelectorAll('[data-ecu-package]').forEach(link => link.addEventListener('click', () => {
    form.elements.tuning_interest.value = supportedServices.package;
    form.elements.hardware_package.value = 'Other / custom e-tune / unsure';
    form.elements.platform.value = 'Help choosing';
    const context = document.getElementById('inquiry-service-context');
    if (context) { context.textContent = 'ECU package review: tell me about the engine, intended use and equipment you already own. Hardware, installation responsibilities and calibration are quoted for your project.'; context.hidden = false; }
  }));
  document.querySelectorAll('[data-open-source]').forEach(link => link.addEventListener('click', () => {
    form.elements.tuning_interest.value = supportedServices.etune;
    form.elements.hardware_package.value = 'Other / custom e-tune / unsure';
    form.elements.platform.value = 'Open source / unsure which tools';
    const context = document.getElementById('inquiry-service-context');
    if (context) { context.textContent = 'Open-source setup review: include your ECU/ROM and interface if known. EcuFlash, RomRaider and Atlas compatibility is checked for your vehicle before a quote.'; context.hidden = false; }
  }));
  document.querySelectorAll('[data-etune]').forEach(link => link.addEventListener('click', () => {
    form.elements.tuning_interest.value = 'Custom e-tune — $400 for most setups';
    form.elements.hardware_package.value = 'Other / custom e-tune / unsure';
    const context = document.getElementById('inquiry-service-context');
    if (context) { context.textContent = 'Custom e-tune review: send your exact vehicle, modifications, fuel and goals. Compatibility and the included revision scope are confirmed before payment.'; context.hidden = false; }
  }));
  const otsInterests = {
    va: '2015–2021 WRX OTS map — $150',
    vb: '2022+ WRX OTS map — $150'
  };
  // Manual selections must not retain guidance from a previous landing page.
  const serviceGuidance = new Map([
    [supportedServices.road, 'Orange County road tuning: include your city, preferred dates, vehicle, fuel and modifications. Advance coordination is required; plan to leave the car for the day and arrange transportation. Scope, price and handover details are confirmed before booking.'],
    [supportedServices.cobb, 'COBB setup review: include your exact year, model, engine, transmission, market and Accessport details if known. Compatibility, scope and price are confirmed before payment.'],
    [supportedServices.etune, 'Custom e-tune review: send your exact vehicle, modifications, fuel and goals. Compatibility and the included revision scope are confirmed before payment.'],
    [supportedServices.ecutek, 'EcuTek setup review: include your exact vehicle, transmission, fuel, modifications and any interface or license you already own. Compatibility, equipment and revision scope are confirmed before a quote.'],
    [supportedServices.porsche, 'Porsche setup review: include your exact model year, model and transmission. Scope and pricing are confirmed after review.'],
    [supportedServices.standalone, 'Standalone project review: include your exact ECU model, engine specification, current running condition and location. Equipment, calibration and travel are scoped before a quote.'],
    [supportedServices.package, 'ECU package review: tell me about the engine, intended use and equipment you already own. Hardware, installation responsibilities and calibration are quoted for your project.'],
    ['Base map service — $50', 'Base map review: a starting calibration for an approved setup and agreed use. Follow-up tuning is scoped separately.'],
    [otsInterests.va, '2015–2021 WRX OTS inquiry: maps are planned. Send your exact model year, fuel and hardware combination for availability and compatibility review before payment.'],
    [otsInterests.vb, '2022+ WRX OTS inquiry: maps are planned. Send your exact model year, fuel and hardware combination for availability and compatibility review before payment.']
  ]);
  function updateServiceGuidance() {
    const context = document.getElementById('inquiry-service-context');
    if (context) {
      context.textContent = serviceGuidance.get(form.elements.tuning_interest.value) || '';
      context.hidden = !context.textContent;
    }
    form.elements.vehicle.placeholder = 'Exact year, make and model';
  }
  form.elements.tuning_interest.addEventListener('change', updateServiceGuidance);
  document.querySelectorAll('[data-ots]').forEach(link => link.addEventListener('click', () => {
    const interest = otsInterests[link.dataset.ots];
    if (!interest) return;
    form.elements.tuning_interest.value = interest;
    updateServiceGuidance();
    if (form.elements.hardware_package.value === 'Other / custom e-tune / unsure') {
      form.elements.hardware_package.value = '';
    }
  }));
})();
