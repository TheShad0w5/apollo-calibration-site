// Engineering candidates only. A part number is not proof of supplied fitment,
// availability or manufacturer MAP. No dealer costs belong in this module.
const part=(sku,name,quantity=1)=>({sku,name,quantity,verified:false});
const safety=()=>[
 part('HT-010904','150 psi oil-pressure sensor; remote mounted'),
 part('HT-010904','150 psi fuel-pressure sensor; remote mounted'),
 part('HT-010306','High-range oil-temperature sensor'),
 part('HT-010200','Post-intercooler air-temperature sensor'),
 part(null,'Remote pressure lines, vehicle adapters, bungs and sensor wiring')
];
export function draftComponents(product){
 const ecu=part(product.ecuSku,product.family==='link-wrx11x'?'Link G4X Subaru plug-in ECU: select version for vehicle year, market and ECU pinout':product.family==='haltech-s3'?'Haltech Nexus S3 ECU':'Emtron KV8 ECU');
 if(product.option==='ecu-only')return [ecu];
 if(product.family==='haltech-s3'&&product.option==='basic-package')return [ecu,
  part(null,'Boomslang Nexus S3 adapter harness: select correct vehicle/engine harness version'),
  part('HT-010746','Bosch LSU4.9 wideband hardware pack'),
  part(null,'S3 wideband connection wiring: confirm adapter supplied with harness'),
  part(null,'Post-intercooler air-temperature measurement: validate existing sensor or select sensor and wiring'),
  part(null,'MAP reference hose and required mounting/connection hardware')];
 if(product.family==='link-wrx11x')return [ecu,...safety(),
  part('125-1000','Link CAN Lambda kit with Bosch LSU4.9 sensor and bung'),
  part(null,'CAN cable matching selected Link plug-in ECU; CANJST4 101-0198 for current USDM WRX11X'),
  part(null,'ECU expansion loom and CAN connection/termination hardware')];
 if(product.family==='haltech-s3')return [ecu,
  part(null,'Boomslang Nexus S3 adapter harness: select correct vehicle/engine harness version'),
  ...safety(),part('HT-010746','Bosch LSU4.9 wideband hardware pack'),
  part(null,'S3 wideband connection wiring: confirm adapter supplied with harness')];
 if(product.family==='emtron-kv8')return [ecu,
  part(null,'Boomslang KV8 adapter harness: select correct vehicle/engine harness version'),
  ...safety(),
  part(null,'Post-throttle manifold absolute pressure sensor'),
  part(null,'Pre-throttle charge absolute pressure sensor'),
  part(null,'Exhaust manifold absolute pressure sensor'),
  part(null,'T1 EMAP damper/canister, without pressure sensor'),
  part(null,'Exhaust pressure takeoff, heat-resistant tubing and mounting'),
  part(null,'Bosch LSU4.9 sensor and bung; verify harness sensor lead'),
  part(null,'Additional TMF/EMAP wiring and connectors')];
 throw new Error('Unknown ECU family');
}
export const packageNotes={
 'link-wrx11x':{adapterRequired:false,widebandController:'External CAN Lambda included in complete package',map:'Retain factory MAP only after range and calibration verification; upgrade separately if required'},
 'haltech-s3':{adapterRequired:true,widebandController:'One internal controller; sensor and wiring included separately',map:'Internal 4-bar absolute MAP; confirm pressure range suits build'},
 'emtron-kv8':{adapterRequired:true,widebandController:'Internal LSU4.9 controllers; one sensor included',map:'Separate pre-throttle and post-throttle absolute sensors plus measured EMAP',calibration:'TMF blended with speed density; throttle-body model and EMAP correction require calibration'}
};
