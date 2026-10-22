(() => {
  const form = document.getElementById('tune-intake');
  if (!form) return;
  const query = new URLSearchParams(location.search);
  const service = query.get('service');
  const supportedServices = {
"ap-single": "Single-fuel AP tune — $400",
"ap-flex": "Flex-fuel AP tune — $600",
"standalone-single": "Standalone single-fuel tune — $500",
"standalone-flex": "Standalone flex-fuel tune — $750",
"ap-single-retune": "Single-fuel AP retune — $200",
"ap-flex-retune": "Flex-fuel AP retune — $300",
"standalone-single-retune": "Standalone single-fuel retune — $250",
"standalone-flex-retune": "Standalone flex-fuel retune — $500",
"base-map": "Base map — $50",
    road: 'Orange County road / dyno tuning — individual quote',
    cobb: 'COBB custom tuning — quote after setup review',
    etune: 'Single-fuel AP tune — $400',
    ecutek: 'EcuTek tuning / package — individual quote',
    porsche: 'Porsche tuning / project — quote after setup review',
    standalone: 'Standalone project / additional work — individual quote',
    package: 'ECU sales / complete package — individual quote'
  };
  if (Object.hasOwn(supportedServices, service)) {
    form.elements.tuning_interest.value = supportedServices[service];

    if (service === 'road') {
      const context = document.getElementById('inquiry-service-context');
      if (context) { context.textContent = 'Orange County road / dyno tuning: include your city, preferred dates, vehicle, fuel and modifications. For road tuning, plan to leave the car for the day and arrange transportation. If you have a dyno location arranged, include its name, location and dyno type. Scope, price and session arrangements are confirmed before booking.'; context.hidden = false; }
    }
    const vehicle = query.get('vehicle');
    if (vehicle) form.elements.vehicle.placeholder = 'Exact year and model — ' + vehicle.slice(0, 200);
    const platform = service === 'ecutek' ? 'EcuTek — BRZ / Nissan / Infiniti / Toyota GR' : service === 'cobb' ? 'COBB Accessport' : query.get('platform');
    if ([...form.elements.platform.options].some(option => option.value === platform)) form.elements.platform.value = platform;
    if (service === 'ecutek') {
      const applications = {
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
    form.elements.tuning_interest.value = 'Base map — $50';

    const context = document.getElementById('inquiry-service-context');
    if (context) { context.textContent = 'Base map review: a starting calibration for an approved setup and agreed use. Follow-up tuning is scoped separately.'; context.hidden = false; }
  }));
  document.querySelectorAll('[data-ecu-package]').forEach(link => link.addEventListener('click', () => {
    form.elements.tuning_interest.value = supportedServices.package;

    form.elements.platform.value = 'Help choosing';
    const context = document.getElementById('inquiry-service-context');
    if (context) { context.textContent = 'ECU package review: tell me about the engine, intended use and equipment you already own. Hardware, installation responsibilities and calibration are quoted for your project.'; context.hidden = false; }
  }));
  document.querySelectorAll('[data-open-source]').forEach(link => link.addEventListener('click', () => {
    form.elements.tuning_interest.value = 'Help choosing';

    form.elements.platform.value = 'Open source / unsure which tools';
    const context = document.getElementById('inquiry-service-context');
    if (context) { context.textContent = 'Open-source setup review: include your ECU/ROM and interface if known. EcuFlash, RomRaider and Atlas compatibility is checked for your vehicle before a quote.'; context.hidden = false; }
  }));
  document.querySelectorAll('[data-etune]').forEach(link => link.addEventListener('click', () => {
    form.elements.tuning_interest.value = 'Single-fuel AP tune — $400';

    const context = document.getElementById('inquiry-service-context');
    if (context) { context.textContent = 'Custom e-tune review: send your exact vehicle, modifications, fuel and goals. Ask any compatibility or revision-scope questions before choosing checkout.'; context.hidden = false; }
  }));
  // Manual selections must not retain guidance from a previous landing page.
  const serviceGuidance = new Map([
    [supportedServices.road, 'Orange County road / dyno tuning: include your city, preferred dates, vehicle, fuel and modifications. For road tuning, plan to leave the car for the day and arrange transportation. If you have a dyno location arranged, include its name, location and dyno type. Scope, price and session arrangements are confirmed before booking.'],
    [supportedServices.cobb, 'COBB setup review: include your exact year, model, engine, transmission, market and Accessport details if known. Compatibility, scope and price are confirmed before payment.'],
    [supportedServices.etune, 'Custom e-tune review: send your exact vehicle, modifications, fuel and goals. Ask any compatibility or revision-scope questions before choosing checkout.'],
    [supportedServices.ecutek, 'EcuTek setup review: include your exact vehicle, transmission, fuel, modifications and any interface or license you already own. Compatibility, equipment and revision scope are confirmed before a quote.'],
    [supportedServices.porsche, 'Porsche setup review: include your exact model year, model and transmission. Scope and pricing are confirmed after review.'],
    [supportedServices.standalone, 'Standalone project review: include your exact ECU model, engine specification, current running condition and location. Equipment, calibration and travel are scoped before a quote.'],
    [supportedServices.package, 'ECU package review: tell me about the engine, intended use and equipment you already own. Hardware, installation responsibilities and calibration are quoted for your project.'],
    ['Base map — $50', 'Base map review: a starting calibration for an approved setup and agreed use. Follow-up tuning is scoped separately.'],


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

})();
