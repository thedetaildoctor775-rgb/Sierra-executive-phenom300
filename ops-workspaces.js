(()=>{
'use strict';
if(window.__sxOpsWorkspacesV1)return;
window.__sxOpsWorkspacesV1=true;

let current='ground';
let weatherCache=null;
let weatherLoading=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString();
const val=id=>$(id)?.value||'';
function s(){try{return (typeof state!=='undefined'&&state)?state:JSON.parse(localStorage.getItem('sierra_phenom300_state')||'{}')}catch(e){return {}}}
function active(){const x=s();return x.activeAssignment||x.activeFlight||x.currentFlight||null}
function dep(){const a=active();return String(a?.origin||val('origin')||'—').toUpperCase()}
function arr(){const a=active();return String(a?.dest||a?.destination||val('destination')||'—').toUpperCase()}
function fid(){const a=active();return String(a?.flight||a?.id||val('flightId')||'STANDBY').toUpperCase()}
function aircraft(){const x=s(),a=active();return a?.aircraft||x.activeAircraft||x.selectedAircraft||'—'}
function wf(){const x=s(),a=active();return String(x.workflow||a?.status||'scheduled').toUpperCase()}
function fboDefault(code){
  try{if(typeof SX_FBO_DEFAULTS!=='undefined'&&SX_FBO_DEFAULTS[code])return SX_FBO_DEFAULTS[code]}catch(e){}
  return code==='KLAX'?'Atlantic Aviation':code==='KPDX'?'Atlantic Aviation':code+' FBO / Handler';
}
function depFbo(){return val('fboName')||fboDefault(dep())}
function arrivalFbo(){const a=active();return a?.arrivalFbo||a?.destinationFbo||fboDefault(arr())}
function client(){const a=active();return a?.client||val('clientName')||'—'}
function clientContact(){const a=active();return a?.clientContact||val('clientContact')||'Client representative'}
function setClass(host){
  host.classList.toggle('sx-workspace-active',current!=='ground');
  host.querySelectorAll('.sx-opnav [data-workspace]').forEach(b=>b.classList.toggle('active',b.dataset.workspace===current));
}
function installStyles(){
 if($('sxOpsWorkspaceStyles'))return;
 const st=document.createElement('style');st.id='sxOpsWorkspaceStyles';st.textContent=`
 #opsCenter.sx-workspace-active>.sx-contact-grid,
 #opsCenter.sx-workspace-active>.sx-phasebar,
 #opsCenter.sx-workspace-active>.sx-ops-hero,
 #opsCenter.sx-workspace-active>.sx-section-grid,
 #opsCenter.sx-workspace-active>.sx-quick,
 #opsCenter.sx-workspace-active>.sx-bottom-status{display:none!important}
 .sx-workspace-host{display:none}.sx-workspace-active>.sx-workspace-host{display:block}
 .sx-ws{background:#0d1217;border:1px solid #34404a;border-radius:6px;overflow:hidden}
 .sx-ws-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:13px 14px;background:#111820;border-bottom:1px solid #33404a}
 .sx-ws-head h2{font-size:18px;margin:0}.sx-ws-head p{margin:4px 0 0;color:#82949e;font-size:10px}
 .sx-ws-route{font-size:11px;color:#e9bf62;font-weight:900;white-space:nowrap}
 .sx-ws-body{padding:12px}.sx-ws-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.sx-ws-grid.three{grid-template-columns:repeat(3,1fr)}
 .sx-ws-card{background:#111820;border:1px solid #2e3942;border-radius:5px;padding:11px;min-width:0}.sx-ws-card h3{margin:0 0 8px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9dafb8}
 .sx-ws-row{display:flex;justify-content:space-between;gap:14px;padding:6px 0;border-bottom:1px solid #252f37;font-size:10px}.sx-ws-row:last-child{border-bottom:0}.sx-ws-row span{color:#82949e}.sx-ws-row b{text-align:right}
 .sx-ws-big{font-size:25px;font-weight:950;color:#63ddeb}.sx-ws-pre{white-space:pre-wrap;background:#090d11;border:1px solid #29343d;padding:10px;border-radius:4px;min-height:110px;font:10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;color:#cad5da;overflow:auto}
 .sx-ws-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.sx-ws-btn{border:1px solid #6f5d27;background:#1c180e;color:#e9bf62;padding:8px 10px;border-radius:5px;font-size:9px;font-weight:900;cursor:pointer}.sx-ws-btn.secondary{border-color:#34404a;background:#12181e;color:#c8d3d8}
 .sx-weather-strip{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.sx-weather-box{padding:11px;background:#111820;border:1px solid #2f3a43;border-radius:5px}.sx-weather-box h3{margin:0 0 4px;font-size:12px}.sx-metar{font:10px/1.45 ui-monospace,monospace;color:#dce6ea;word-break:break-word}.sx-taf{font:9px/1.4 ui-monospace,monospace;color:#9fb2bc;word-break:break-word;margin-top:7px}
 .sx-timeline{display:grid;gap:5px}.sx-event{display:grid;grid-template-columns:82px 1fr auto;gap:9px;align-items:center;padding:8px 9px;background:#111820;border:1px solid #29343d;border-radius:4px;font-size:10px}.sx-event time{color:#e9bf62}.sx-event span{color:#91a4ad}.sx-event b{font-size:9px}
 .sx-msgs{display:grid;gap:6px}.sx-msg{padding:8px 10px;border-radius:5px;background:#151a20;border:1px solid #2c3740;font-size:10px}.sx-msg.me{border-color:#25586a;background:#0d1c22}.sx-msg small{display:block;color:#6f828c;margin-top:4px}
 @media(max-width:850px){.sx-ws-grid,.sx-ws-grid.three,.sx-weather-strip{grid-template-columns:1fr}}
 `;document.head.appendChild(st);
}
function shell(title,subtitle,body){
 return `<div class="sx-ws"><div class="sx-ws-head"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><div class="sx-ws-route">${esc(fid())} • ${esc(dep())} → ${esc(arr())}</div></div><div class="sx-ws-body">${body}</div></div>`;
}
function dispatchHTML(){
 const a=active(),x=s();
 return shell('Dispatch','Operational release and charter brief',`
 <div class="sx-ws-grid">
  <div class="sx-ws-card"><h3>Flight Release</h3>
   <div class="sx-ws-big">${esc(dep())} → ${esc(arr())}</div>
   <div class="sx-ws-row"><span>Flight</span><b>${esc(fid())}</b></div>
   <div class="sx-ws-row"><span>Aircraft</span><b>${esc(aircraft())}</b></div>
   <div class="sx-ws-row"><span>Callsign</span><b>${esc(val('callsign')||'—')}</b></div>
   <div class="sx-ws-row"><span>Alternate</span><b>${esc(val('alternate')||'—')}</b></div>
   <div class="sx-ws-row"><span>Departure</span><b>${esc((a?.departureDate||val('depDate')||'')+' '+(a?.departureTime||val('depTime')||''))}</b></div>
  </div>
  <div class="sx-ws-card"><h3>Charter</h3>
   <div class="sx-ws-row"><span>Client</span><b>${esc(client())}</b></div>
   <div class="sx-ws-row"><span>Representative</span><b>${esc(clientContact())}</b></div>
   <div class="sx-ws-row"><span>Mission</span><b>${esc(a?.mission||val('mission')||'—')}</b></div>
   <div class="sx-ws-row"><span>Passengers</span><b>${esc((a?.pax ?? val('paxCount')) || '—')}</b></div>
   <div class="sx-ws-row"><span>Baggage</span><b>${esc((a?.bags ?? val('bags')) || '—')} lb</b></div>
  </div>
 </div>
 <div class="sx-ws-card" style="margin-top:9px"><h3>Mission Brief</h3><div class="sx-ws-pre">${esc(val('missionBrief')||'No mission brief saved.')}</div></div>
 <div class="sx-ws-actions"><button class="sx-ws-btn" data-oldtab="dispatch">Open Full Dispatch</button><button class="sx-ws-btn secondary" data-action="copybrief">Copy Brief</button></div>`);
}
function ofpHTML(){
 const x=s(),sb=x.simbrief||{};
 const route=val('route')||sb.route||'No SimBrief route imported';
 return shell('OFP','SimBrief operational flight plan',`
 <div class="sx-ws-grid three">
  <div class="sx-ws-card"><h3>Routing</h3><div class="sx-ws-pre">${esc(route)}</div></div>
  <div class="sx-ws-card"><h3>Planning</h3>
   <div class="sx-ws-row"><span>Cruise</span><b>${esc(val('cruiseLevel')||sb.cruise||'—')}</b></div>
   <div class="sx-ws-row"><span>Block Fuel</span><b>${esc(val('blockFuel')||'—')} lb</b></div>
   <div class="sx-ws-row"><span>Trip Fuel</span><b>${esc(val('tripFuel')||'—')} lb</b></div>
   <div class="sx-ws-row"><span>Taxi Fuel</span><b>${esc(val('taxiFuel')||'—')} lb</b></div>
  </div>
  <div class="sx-ws-card"><h3>Load</h3>
   <div class="sx-ws-row"><span>ZFW</span><b>${esc(val('zfw')||'—')} lb</b></div>
   <div class="sx-ws-row"><span>TOW</span><b>${esc(val('tow')||'—')} lb</b></div>
   <div class="sx-ws-row"><span>Arrival Fuel</span><b>${esc(val('arrivalFuel')||'—')} lb</b></div>
   <div class="sx-ws-row"><span>Imported</span><b>${esc(sb.importedAt?new Date(sb.importedAt).toLocaleString():'Not imported')}</b></div>
  </div>
 </div>
 <div class="sx-ws-card" style="margin-top:9px"><h3>Imported OFP Summary</h3><div class="sx-ws-pre">${esc(val('simbriefOFP')||'Generate the flight in SimBrief, then import the latest OFP.')}</div></div>
 <div class="sx-ws-actions"><button class="sx-ws-btn" data-action="simbrief">Import Latest SimBrief</button><button class="sx-ws-btn secondary" data-oldtab="fuel">Fuel & Load</button></div>`);
}
function rawWx(obj){return obj?.rawOb||obj?.raw_text||obj?.rawTAF||obj?.raw_text||'No report available'}
function weatherHTML(){
 if(weatherLoading)return shell('Weather','Live aviation weather','<div class="sx-ws-card">Loading current METAR and TAF…</div>');
 const data=weatherCache;
 if(!data)return shell('Weather','Live METAR and TAF for the active route',`<div class="sx-ws-card">Weather has not been loaded yet.<div class="sx-ws-actions"><button class="sx-ws-btn" data-action="weather">Load Live Weather</button></div></div>`);
 if(!data.ok)return shell('Weather','Live aviation weather',`<div class="sx-ws-card">Weather unavailable: ${esc(data.error||'Unknown error')}<div class="sx-ws-actions"><button class="sx-ws-btn" data-action="weather">Retry</button></div></div>`);
 const find=(list,id)=>list?.find(x=>String(x.icaoId||x.station_id||x.stationId||'').toUpperCase()===id)||null;
 const box=id=>{const m=find(data.metars,id),t=find(data.tafs,id);return `<div class="sx-weather-box"><h3>${esc(id)}</h3><div class="sx-metar">${esc(rawWx(m))}</div><div class="sx-taf">${esc(rawWx(t))}</div></div>`};
 return shell('Weather','Live METAR + TAF • refreshed '+new Date(data.fetchedAt).toLocaleTimeString(),`<div class="sx-weather-strip">${box(dep())}${box(arr())}</div><div class="sx-ws-actions"><button class="sx-ws-btn" data-action="weather">Refresh Weather</button></div>`);
}
function airportsHTML(){
 const departure=dep(),arrival=arr();
 return shell('Airports','Departure and arrival handling',`
 <div class="sx-ws-grid">
  <div class="sx-ws-card"><h3>Departure • ${esc(departure)}</h3>
   <div class="sx-ws-big">${esc(departure)}</div>
   <div class="sx-ws-row"><span>FBO / Handler</span><b>${esc(depFbo())}</b></div>
   <div class="sx-ws-row"><span>Fuel price</span><b>${esc(val('fboFuelPrice')?('$'+Number(val('fboFuelPrice')).toFixed(2)+'/gal'):'—')}</b></div>
   <div class="sx-ws-row"><span>Handling fee</span><b>${money(val('fboHandlingFee'))}</b></div>
   <div class="sx-ws-row"><span>Status</span><b>${esc(val('fboRequestStatus')||'Not Requested')}</b></div>
  </div>
  <div class="sx-ws-card"><h3>Arrival • ${esc(arrival)}</h3>
   <div class="sx-ws-big">${esc(arrival)}</div>
   <div class="sx-ws-row"><span>FBO / Handler</span><b>${esc(arrivalFbo())}</b></div>
   <div class="sx-ws-row"><span>PAX Transport</span><b>${esc(s().groundOps?.[fid()]?.arrival?.transport||'NOT REQUESTED')}</b></div>
   <div class="sx-ws-row"><span>Crew Car</span><b>${esc(s().groundOps?.[fid()]?.arrival?.crewcar||'NOT REQUESTED')}</b></div>
   <div class="sx-ws-row"><span>Hangar / Parking</span><b>${esc(s().groundOps?.[fid()]?.arrival?.hangar||'NOT REQUESTED')}</b></div>
  </div>
 </div>
 <div class="sx-ws-actions"><button class="sx-ws-btn" data-oldtab="fbo">Open Full FBO Services</button><button class="sx-ws-btn secondary" data-action="pricing">Refresh Departure Pricing</button></div>`);
}
function trackerHTML(){
 const x=s(),p=x.flightPackage||{},d=p.duty||{};
 const rows=[
  ['Duty start',val('dutyStart')||d.dutyStart,'ON DUTY'],
  ['Block out',val('blockOut')||d.blockOut,'OUT'],
  ['Takeoff',val('takeoffTime')||d.takeoff,'AIRBORNE'],
  ['Landing',val('landingTime')||d.landing,'LANDED'],
  ['Block in',val('blockIn')||d.blockIn,'IN'],
  ['Duty end',val('dutyEnd')||d.dutyEnd,'OFF DUTY']
 ];
 const ev=rows.map(([name,time,status])=>`<div class="sx-event"><time>${esc(time?new Date(time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'—')}</time><span>${esc(name)}</span><b>${time?esc(status):'PENDING'}</b></div>`).join('');
 return shell('Flight Tracker','Operational phase and event timeline',`
 <div class="sx-ws-grid"><div class="sx-ws-card"><h3>Current Flight</h3><div class="sx-ws-big">${esc(dep())} → ${esc(arr())}</div><div class="sx-ws-row"><span>Status</span><b>${esc(wf())}</b></div><div class="sx-ws-row"><span>Aircraft</span><b>${esc(aircraft())}</b></div><div class="sx-ws-row"><span>Distance</span><b>${esc(x.simbrief?.distance?x.simbrief.distance+' NM':'—')}</b></div></div><div class="sx-ws-card"><h3>Timeline</h3><div class="sx-timeline">${ev}</div></div></div>
 <div class="sx-ws-actions"><button class="sx-ws-btn secondary" data-oldtab="duty">Open Duty Log</button><button class="sx-ws-btn secondary" data-oldtab="log">Open Flight Log</button></div>`);
}
function commsHTML(){
 let threads={};try{threads=JSON.parse(localStorage.getItem('sx_dispatch_threads_v2')||'{}')}catch(e){}
 const list=(threads[fid()]||[]).slice(-8);
 const msgs=list.length?list.map(m=>`<div class="sx-msg ${m.who==='me'?'me':''}">${esc(m.text)}<small>${esc(m.who==='me'?'You':'Sierra Dispatch')} • ${esc(m.time||'')}</small></div>`).join(''):'<div class="sx-ws-card">No dispatch messages for this flight yet.</div>';
 return shell('ACARS / Comms','Dispatch and operational messaging',`<div class="sx-ws-grid"><div class="sx-ws-card"><h3>Contacts</h3><div class="sx-ws-row"><span>Dispatch</span><b>Sierra Dispatch</b></div><div class="sx-ws-row"><span>Departure FBO</span><b>${esc(depFbo())}</b></div><div class="sx-ws-row"><span>Arrival FBO</span><b>${esc(arrivalFbo())}</b></div><div class="sx-ws-row"><span>Client Rep</span><b>${esc(clientContact())}</b></div></div><div><div class="sx-msgs">${msgs}</div></div></div><div class="sx-ws-actions"><button class="sx-ws-btn" data-action="phone">Open Dispatch Phone</button></div>`);
}
function financialHTML(){
 const revenue=Number(val('revenue')||active()?.revenue||0),fees=Number(val('fees')||0),cat=Number(val('catering')||0),other=Number(val('otherExpense')||0),hr=Number(val('hourlyCost')||0),hours=Number(val('billableHours')||0);
 const operating=hr*hours,profit=revenue-fees-cat-other-operating;
 return shell('Financials','Live charter economics',`
 <div class="sx-ws-grid three">
  <div class="sx-ws-card"><h3>Revenue</h3><div class="sx-ws-big" style="color:#62e887">${money(revenue)}</div><div class="sx-ws-row"><span>Charter value</span><b>${money(revenue)}</b></div><div class="sx-ws-row"><span>Payment</span><b>${esc(s().billingStage==='paid'?'PAID':'UNPAID')}</b></div></div>
  <div class="sx-ws-card"><h3>Costs</h3><div class="sx-ws-row"><span>Operating</span><b>${money(operating)}</b></div><div class="sx-ws-row"><span>Airport / FBO</span><b>${money(fees)}</b></div><div class="sx-ws-row"><span>Catering / Ground</span><b>${money(cat)}</b></div><div class="sx-ws-row"><span>Other</span><b>${money(other)}</b></div></div>
  <div class="sx-ws-card"><h3>Projected Profit</h3><div class="sx-ws-big" style="color:${profit>=0?'#62e887':'#ff7d7d'}">${money(profit)}</div><div class="sx-ws-row"><span>Billable hours</span><b>${hours.toFixed(1)}</b></div><div class="sx-ws-row"><span>Hourly cost</span><b>${money(hr)}</b></div></div>
 </div><div class="sx-ws-actions"><button class="sx-ws-btn" data-oldtab="finance">Open Full Financials</button><button class="sx-ws-btn secondary" data-oldtab="invoice">Invoice</button></div>`);
}
function html(){
 if(current==='dispatch')return dispatchHTML();
 if(current==='ofp')return ofpHTML();
 if(current==='weather')return weatherHTML();
 if(current==='airports')return airportsHTML();
 if(current==='tracker')return trackerHTML();
 if(current==='comms')return commsHTML();
 if(current==='financials')return financialHTML();
 return '';
}
function openOldTab(name){
 const b=document.querySelector('nav.tabs .tab[data-tab="'+name+'"]');if(b)b.click();
}
async function loadWeather(){
 weatherLoading=true;render();
 try{
  const res=await fetch('/api/weather?ids='+encodeURIComponent(dep()+','+arr()),{cache:'no-store'});
  weatherCache=await res.json();
 }catch(e){weatherCache={ok:false,error:e?.message||String(e)}}
 weatherLoading=false;render();
}
function bindActions(host){
 host.querySelectorAll('[data-oldtab]').forEach(b=>b.onclick=()=>openOldTab(b.dataset.oldtab));
 host.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{
  const a=b.dataset.action;
  if(a==='simbrief'&&typeof importSimBrief==='function'){await importSimBrief();render()}
  if(a==='weather')loadWeather();
  if(a==='phone')window.sxDispatchPhone?.open?.();
  if(a==='copybrief'&&typeof copyDispatchBrief==='function')copyDispatchBrief();
  if(a==='pricing'&&typeof refreshLiveFboPricing==='function'){await refreshLiveFboPricing(true);render()}
 });
}
function render(){
 const host=$('opsCenter');if(!host)return;
 setClass(host);
 let pane=host.querySelector('.sx-workspace-host');
 if(!pane){pane=document.createElement('div');pane.className='sx-workspace-host';const nav=host.querySelector('.sx-opnav');if(nav)nav.after(pane);else host.prepend(pane)}
 pane.innerHTML=html();
 bindActions(pane);
}
function bind(host){
 installStyles();
 host.querySelectorAll('.sx-opnav [data-workspace]').forEach(b=>{
  b.onclick=()=>{
    current=b.dataset.workspace||'ground';
    if(current==='weather'&&!weatherCache&&!weatherLoading)loadWeather();
    render();
  };
 });
 render();
}
window.sxOpsWorkspaces={bind,render,open:(name)=>{current=name||'ground';render()}};
installStyles();
const mo=new MutationObserver(()=>{const h=$('opsCenter');if(h&&h.querySelector('.sx-opnav'))bind(h)});
mo.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{const h=$('opsCenter');if(h)bind(h)},800);
console.info('Sierra Executive dedicated operations workspaces active');
})();