import {hardwareOrderPanel,hardwareOrderStyles} from './order-view.mjs';
import {loadHardwareOrder} from './repository.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const shell=content=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hardware orders | Tuned by Keith</title><link rel="stylesheet" href="/hardware-ui/style.css"><script type="module" src="/hardware-ui/browser.mjs"></script></head><body><header class="hardware-nav"><a href="/manage">Tuning orders</a><a href="/manage/hardware">Hardware orders</a></header><main id="hardware-content">${content}</main><p id="hardware-save-message" role="status" aria-live="polite"></p></body></html>`;

export async function hardwarePageRoute(req,env,{admin,fail,json,assets}){
 const url=new URL(req.url),path=url.pathname;
 if(path!=='/manage/hardware'&&!path.startsWith('/hardware-ui/'))return null;
 admin(req,env);
 if(env.HARDWARE_COMMERCE_ENABLED!=='true')return json({error:'Hardware ordering is not enabled'},503);
 if(req.method!=='GET')fail(405,'Method not allowed');
 if(path==='/hardware-ui/style.css')return new Response(`body{margin:0;background:#090f17}.hardware-nav{display:flex;gap:24px;flex-wrap:wrap;max-width:1120px;margin:auto;padding:24px;font:16px system-ui}.hardware-nav a,.hardware-order a{color:#f6d6ad}#hardware-save-message{max-width:1024px;margin:20px auto;padding:16px;color:#fff;font:16px system-ui}#hardware-save-message:empty{display:none}${hardwareOrderStyles}`,{headers:{...headers,'Content-Type':'text/css'}});
 if(path.startsWith('/hardware-ui/')){
  const name=path.slice('/hardware-ui/'.length);
  if(!Object.hasOwn(assets,name))fail(404,'Not found');
  return new Response(assets[name],{headers:{...headers,'Content-Type':'text/javascript'}});
 }
 let content;
 const id=url.searchParams.get('order');
 if(id){
  if(!/^[A-Za-z0-9_-]{1,100}$/.test(id))fail(400,'Invalid order reference');
  const result=await loadHardwareOrder(env.DB,id);if(!result)fail(404,'Hardware order not found');
  content=hardwareOrderPanel(result.order,{version:result.version,actions:true});
 }else{
  const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0)fail(400,'Invalid offset');
  const rows=await env.DB.prepare('SELECT id,document,version,created_at FROM hardware_orders ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET ?').bind(offset).all();
  const orders=rows.results||[];
  content=`<section class="hardware-order"><p class="eyebrow">Manual fulfillment</p><h1>Hardware orders</h1><p>Review payment, record supplier orders and add shipment tracking.</p>${orders.length?orders.slice(0,50).map(row=>{const o=JSON.parse(row.document);return `<article class="panel"><h2><a href="/manage/hardware?order=${encodeURIComponent(row.id)}">${escape(row.id)}</a></h2><p>${escape(o.customer?.name||'Customer')}</p><p>Payment: ${escape(o.paymentStatus)} · Fulfillment: ${escape((o.fulfillmentStatus||'awaiting_fulfillment').replaceAll('_',' '))}</p><p>${(o.lines||[]).map(l=>escape(l.name)+' × '+escape(l.quantity)).join(' · ')}</p></article>`;}).join(''):'<section class="panel"><h2>No hardware orders yet</h2><p>Published hardware purchases will appear here when ordering is enabled.</p></section>'}${orders.length>50?`<a href="/manage/hardware?offset=${offset+50}">Next orders →</a>`:''}</section>`;
 }
 return new Response(shell(content),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
}
