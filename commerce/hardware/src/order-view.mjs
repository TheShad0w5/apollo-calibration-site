import {requiredComponents,fulfillmentStatus} from './fulfillment.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={awaiting_fulfillment:'Awaiting fulfillment',supplier_ordered:'Ordered from supplier',partially_shipped:'Partially shipped',shipped:'Shipped',paid:'Paid',unpaid:'Awaiting payment',refunded:'Refunded'};

export function componentProgress(order){
 const required=requiredComponents(order.lines), names=new Map();
 for(const line of order.lines)for(const c of line.components)names.set(c.sku,c.name||c.sku);
 return [...required].map(([sku,quantity])=>{
  let ordered=0,shipped=0;
  for(const e of order.fulfillmentEvents||[])for(const c of e.components||[])if(c.sku===sku){if(e.type==='supplier_order')ordered+=c.quantity;if(e.type==='shipment')shipped+=c.quantity;}
  return {sku,name:names.get(sku),quantity,ordered,shipped,remaining:Math.max(0,quantity-shipped)};
 });
}

// Server-rendered admin panel. All order text is escaped; no customer data enters script.
export function fulfillmentForms(order,version){
 if(order.paymentStatus!=='paid'||order.hold)return '<section class="panel"><h2>Fulfillment actions</h2><p>Fulfillment is available after payment is confirmed and any order hold is cleared.</p></section>';
 const rows=componentProgress(order);
 return ['supplier_order','shipment'].map(type=>{
  const remaining=rows.map(c=>({...c,available:type==='shipment'?c.remaining:Math.max(0,c.quantity-c.ordered)})).filter(c=>c.available>0);
  if(!remaining.length)return '';
  const shipment=type==='shipment',title=shipment?'Record a shipment':'Record a manufacturer order';
  return `<section class="panel"><h2>${title}</h2><p>${shipment?'Record only the components that have actually shipped.':'Place the order with your supplier first, then record its reference here. This form does not purchase anything.'}</p><form class="fulfillment-form" data-order-id="${escape(order.id)}" data-version="${escape(version)}" data-event-type="${type}">
  <label>${shipment?'Carrier':'Supplier'}<input name="${shipment?'carrier':'supplier'}" required maxlength="200" autocomplete="off"></label>
  <label>${shipment?'Tracking number':'Supplier order reference'}<input name="${shipment?'trackingNumber':'reference'}" required maxlength="200" autocomplete="off"></label>
  <fieldset><legend>${shipment?'Components in this shipment':'Components ordered'}</legend><p>Enter zero for items not included in this action.</p>${remaining.map(c=>`<label>${escape(c.name)} · ${c.available} remaining<input type="number" data-sku="${escape(c.sku)}" min="0" max="${c.available}" step="1" value="0" required inputmode="numeric"></label>`).join('')}</fieldset>
  <button type="submit">${shipment?'Save shipment':'Save supplier reference'}</button><p class="save-status" role="status" aria-live="polite"></p></form></section>`;
 }).join('');
}

export function hardwareOrderPanel(order,{version=0,actions=false}={}){
 const status=fulfillmentStatus(order),rows=componentProgress(order);
 const address=order.shipTo||{};
 const addressLines=[address.Line1,address.Line2,address.City,address.CountrySubDivisionCode,address.PostalCode,address.Country].filter(Boolean);
 const history=(order.fulfillmentEvents||[]).map(e=>`<li><strong>${e.type==='shipment'?'Shipment recorded':'Supplier order recorded'}</strong><p>${escape(e.type==='shipment'?e.carrier:e.supplier)} · ${escape(e.type==='shipment'?e.trackingNumber:e.reference)}</p><p>${escape(e.occurredAt)}</p><ul>${e.components.map(c=>`<li>${escape(c.sku)} × ${escape(c.quantity)}</li>`).join('')}</ul></li>`).join('');
 return `<section class="hardware-order" aria-labelledby="hardware-order-title">
 <header><p class="eyebrow">Hardware order</p><h1 id="hardware-order-title">${escape(order.id)}</h1><div class="badges"><span>Payment: ${escape(labels[order.paymentStatus]||order.paymentStatus)}</span><span>Fulfillment: ${escape(labels[status])}</span>${order.hold?'<span>On hold</span>':''}</div></header>
 <div class="order-columns"><section class="panel"><h2>Customer</h2><p>${escape(order.customer?.name||'Name unavailable')}</p><p class="break">${escape(order.customer?.email||'Email unavailable')}</p></section><section class="panel"><h2>Ship to</h2>${addressLines.length?addressLines.map(l=>`<p>${escape(l)}</p>`).join(''):'<p>Shipping address not yet recorded.</p>'}</section></div>
 <section class="panel"><h2>Purchased components</h2><p>Supplier orders and shipments are tracked separately. A paid invoice does not mark an order shipped.</p><div class="components">${rows.map(c=>`<article><h3>${escape(c.name)}</h3><p class="break">${escape(c.sku)}</p><dl><div><dt>Purchased</dt><dd>${c.quantity}</dd></div><div><dt>Supplier ordered</dt><dd>${c.ordered}</dd></div><div><dt>Shipped</dt><dd>${c.shipped}</dd></div><div><dt>Still to ship</dt><dd>${c.remaining}</dd></div></dl></article>`).join('')}</div></section>
 ${actions?fulfillmentForms(order,version):''}<section class="panel"><h2>Fulfillment history</h2>${history?`<ol class="history">${history}</ol>`:'<p>No supplier orders or shipments recorded yet.</p>'}</section></section>`;
}

export const hardwareOrderStyles=`
 .hardware-order{max-width:1120px;margin:auto;padding:clamp(16px,4vw,48px);color:#f5f6f8;font:16px/1.6 system-ui,sans-serif;box-sizing:border-box}
 .hardware-order *{box-sizing:border-box}.hardware-order h1{font-size:clamp(26px,4vw,40px);line-height:1.2;overflow-wrap:anywhere;margin:8px 0 20px}.hardware-order h2{font-size:23px;margin:0 0 12px}.hardware-order h3{font-size:18px;margin:0 0 4px}.hardware-order p{margin:4px 0 12px}.hardware-order .eyebrow{color:#e69549;font-weight:700;text-transform:uppercase;letter-spacing:.1em}
 .hardware-order .badges{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px}.hardware-order .badges span{border:1px solid #56647a;border-radius:8px;padding:8px 12px;background:#182436}.hardware-order .panel{background:#182436;border:1px solid #3b4759;border-radius:12px;padding:24px;margin-bottom:20px;min-width:0}.hardware-order .order-columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.hardware-order .break,.hardware-order .history{overflow-wrap:anywhere}.hardware-order .components{display:grid;gap:16px}.hardware-order article{border-top:1px solid #445168;padding-top:16px}.hardware-order dl{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.hardware-order dt{font-size:14px;color:#c2cfdf}.hardware-order dd{margin:0;font-size:22px;font-weight:700}.hardware-order .history>li{padding:0 0 20px 4px}.hardware-order .history ul{padding-left:20px}
 .hardware-order label{display:block;font-weight:600;margin:16px 0}.hardware-order input{display:block;width:100%;font:16px system-ui;padding:12px;margin-top:6px;border:1px solid #78869a;border-radius:6px;background:#0e1622;color:#fff;min-height:48px}.hardware-order fieldset{min-width:0;border:1px solid #56647a;padding:16px;border-radius:8px}.hardware-order button{font:700 16px system-ui;min-height:48px;padding:14px 20px;border:0;border-radius:6px;background:#cf7d33;color:#0b1018;cursor:pointer}.hardware-order button:disabled{opacity:.65;cursor:wait}.hardware-order :focus-visible{outline:3px solid #ffe0ac;outline-offset:3px}.hardware-order .save-status{margin-top:16px}
 @media(max-width:640px){.hardware-order .order-columns{grid-template-columns:1fr;gap:0}.hardware-order .panel{padding:18px}.hardware-order dl{grid-template-columns:1fr 1fr}.hardware-order .badges span{width:100%}.hardware-order button{width:100%}}
`;
