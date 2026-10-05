(()=>{
'use strict';
if(window.__sxOpsCenterV2)return;
window.__sxOpsCenterV2=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString();
const STATUSES=['NOT REQUESTED','REQUESTED','CONFIRMED','COMPLETE'];

function getState(){try{return (typeof state!=='undefined'&&state)?state:JSON.parse(localStorage.getItem('sierra_phenom300_state')||'{}')}catch(e){return {}}}
function save(){
  try{
    if(typeof saveState==='function')saveState();
    else localStorage.setItem('sierra_phenom300_state',JSON.stringify(getState()));
  }catch(e){
    try{localStorage.setItem('sierra_phenom300_state',JSON.stringify(getState()))}catch(_){}
  }
}
function active(){
  const s=getState();
  return s.activeAssignment||s.activeFlight||s.currentFlight||null;
}
function workflow(){
  const s=getState(),a=active();
  return String(s.workflow||a?.status||'scheduled').toLowerCase();
}
function aircraftText(){
  const s=getState(),a=active();
  return a?.aircraft||s.activeAircraft||s.selectedAircraft||$('sideAircraft')?.textContent||'Aircraft not selected';
}
function routeText(){
  const a=active();
  if(!a)return 'NO ACTIVE CHARTER';
  return [a.origin||$('origin')?.value,a.destination||a.dest||$('destination')?.value].filter(Boolean).join(' → ').toUpperCase()||'ACTIVE CHARTER';
}
function flightId(){
  const a=active();
  return String(a?.flight||a?.id||a?.callsign||$('flightId')?.value||'STANDBY').toUpperCase();
}
function ensureGroundOps(){
  const s=getState();
  s.groundOps=s.groundOps||{};
  const key=flightId();
  s.groundOps[key]=s.groundOps[key]||{departure:{},arrival:{},updatedAt:null};
  return s.groundOps[key];
}
function cycleService(side,key){
  const g=ensureGroundOps();
  const cur=String(g[side]?.[key]||'NOT REQUESTED').toUpperCase();
  const i=STATUSES.indexOf(cur);
  g[side][key]=STATUSES[(i+1)%STATUSES.length];
  g.updatedAt=new Date().toISOString();
  save(); render();
}
function statusClass(v){
  v=String(v||'').toUpperCase();
  if(v==='COMPLETE')return 'done';
  if(v==='CONFIRMED')return 'confirmed';
  if(v==='REQUESTED')return 'requested';
  return '';
}
function setWorkflow(next){
  try{
    if(typeof step==='function'){step(next);setTimeout(render,120);return;}
    const s=getState();s.workflow=next;save();render();
  }catch(e){console.error(e)}
}
function openTab(name){
  const b=document.querySelector('nav.tabs .tab[data-tab="'+name+'"]');
  if(b)b.click();
}
function closeActive(){
  if(typeof closeFlight==='function')return closeFlight();
}
function installStyles(){
  if($('sxOpsCenterStyles'))return;
  const s=document.createElement('style');s.id='sxOpsCenterStyles';
  s.textContent=`
  body.sx-ops-mode main.content > .grid2,
  body.sx-ops-mode main.content > section.card:not(.panel){display:none!important}
  body.sx-ops-mode #opsCenter{display:block!important;margin-top:0!important}
  #opsCenter{padding:0!important;border:0!important;background:transparent!important}
  .sx-ops-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:10px;margin-bottom:10px}
  .sx-ops-card{background:#10141a;border:1px solid #35414b;border-radius:8px;overflow:hidden}
  .sx-ops-main{padding:17px;background:radial-gradient(circle at 85% 12%,rgba(47,227,242,.10),transparent 30%),linear-gradient(140deg,#121820,#0d1116)}
  .sx-ops-eyebrow{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#e9bf62;font-weight:800}
  .sx-ops-flightline{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:5px}
  .sx-ops-flight{font-size:22px;font-weight:900;color:#fff}
  .sx-ops-route{font-size:38px;font-weight:950;letter-spacing:.01em;color:#63ddeb;line-height:1.06;margin:7px 0}
  .sx-ops-client{font-size:13px;color:#b6c6cc}
  .sx-ops-state{font-size:10px;border:1px solid #53616b;padding:6px 8px;border-radius:999px;color:#e9bf62;white-space:nowrap}
  .sx-ops-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}
  .sx-kpi{background:#151c23;border:1px solid #283743;border-radius:6px;padding:9px}.sx-kpi span{display:block;color:#8eb4bf;font-size:8px;letter-spacing:.1em;text-transform:uppercase}.sx-kpi b{display:block;font-size:15px;margin-top:3px}
  .sx-career{padding:14px}.sx-career h3,.sx-services h3,.sx-quick h3{margin:0 0 10px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9eb2b4}
  .sx-career-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #252d34;font-size:12px}.sx-career-row:last-child{border-bottom:0}.sx-career-row span{color:#8eb4bf}.sx-career-row b{font-size:13px}
  .sx-progress{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin:10px 0}
  .sx-progress-step{padding:8px 5px;border:1px solid #323d46;background:#11161c;text-align:center;font-size:9px;font-weight:800;color:#667781;border-radius:5px}
  .sx-progress-step.live{color:#e9bf62;border-color:#806d34;background:#1b180f}.sx-progress-step.past{color:#62e887;border-color:#315e42;background:#0e1913}
  .sx-section-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .sx-services,.sx-quick{padding:14px}
  .sx-service-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
  .sx-svc{border:1px solid #35414b;background:#151b21;color:#fff;border-radius:7px;padding:9px 10px;text-align:left;cursor:pointer}
  .sx-svc small{display:block;color:#7f949f;font-size:8px;text-transform:uppercase;letter-spacing:.1em}.sx-svc strong{display:block;font-size:12px;margin-top:3px}
  .sx-svc.requested{border-color:#7b6324;background:#211b0d}.sx-svc.requested strong{color:#ffd166}
  .sx-svc.confirmed{border-color:#216a76;background:#0d2024}.sx-svc.confirmed strong{color:#63ddeb}
  .sx-svc.done{border-color:#315e42;background:#0f1b14}.sx-svc.done strong{color:#62e887}
  .sx-action-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
  .sx-action{border:1px solid #44515c;background:#171b20;color:#f5f7f8;border-radius:7px;padding:10px;font-weight:800;font-size:11px;cursor:pointer}.sx-action.primary{border-color:#806d34;background:#1d190f;color:#f0cb75}.sx-action.good{border-color:#315e42;background:#0f1b14;color:#62e887}
  .sx-toolbar2{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.sx-link{border:1px solid #35414b;background:#10151a;color:#a9bbc3;border-radius:6px;padding:8px 10px;font-size:10px;font-weight:800;cursor:pointer}
  .sx-muted{color:#748892;font-size:10px;margin-top:8px}
  .sx-opnav{display:flex;gap:4px;overflow:auto;margin-bottom:9px;padding:5px;background:#0c1015;border:1px solid #313b44;border-radius:6px;scrollbar-width:none}
  .sx-opnav::-webkit-scrollbar{display:none}.sx-opnav button{flex:0 0 auto;border:0;background:transparent;color:#83939c;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;padding:7px 9px;border-radius:4px;cursor:pointer}
  .sx-opnav button.active{background:#2a2313;color:#f0cb75}.sx-opnav button:hover{color:#fff}
  .sx-contact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:0 0 9px}
  .sx-contact-card{background:#111820;border:1px solid #33414a;border-radius:5px;padding:9px;min-width:0}
  .sx-contact-card small{display:block;color:#d6b45e;font-size:8px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
  .sx-contact-card b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sx-contact-card span{display:block;color:#8498a2;font-size:9px;margin-top:3px;line-height:1.25}
  .sx-phasebar{display:grid;grid-template-columns:repeat(5,1fr);gap:0;margin:0 0 10px;border:1px solid #303a43;border-radius:5px;overflow:hidden;background:#0d1217}
  .sx-phase{position:relative;padding:9px 4px;text-align:center;color:#697a84;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;border-right:1px solid #263039}
  .sx-phase:last-child{border-right:0}.sx-phase:before{content:'';width:6px;height:6px;border:1px solid #667780;border-radius:50%;display:block;margin:0 auto 5px;background:#0d1217}
  .sx-phase.past{color:#8fc9a1}.sx-phase.past:before{background:#62e887;border-color:#62e887}.sx-phase.live{color:#f0cb75;background:#17140d}.sx-phase.live:before{background:#e9bf62;border-color:#e9bf62}
  .sx-services{padding:0!important}.sx-services h3{padding:10px 12px;margin:0!important;border-bottom:1px solid #303a43;background:#0e1318}
  .sx-service-grid{display:block!important}.sx-svc{width:100%;display:grid!important;grid-template-columns:minmax(110px,1fr) auto;align-items:center;border:0!important;border-bottom:1px solid #27323a!important;border-radius:0!important;padding:10px 12px!important;background:#11171d!important}
  .sx-svc:last-child{border-bottom:0!important}.sx-svc small{font-size:10px!important;color:#d8dee1!important;letter-spacing:0!important;text-transform:none!important}.sx-svc strong{text-align:right;font-size:9px!important;margin:0!important;letter-spacing:.05em}
  .sx-svc.requested{background:#18160f!important}.sx-svc.confirmed{background:#0e1b1e!important}.sx-svc.done{background:#0f1913!important}
  .sx-service-note{padding:8px 12px;border-top:1px solid #27323a;color:#6f828d;font-size:9px}
  .sx-bottom-status{display:grid;grid-template-columns:auto auto 1fr auto auto;gap:8px;align-items:center;margin-top:9px;padding:7px 9px;background:#090d11;border:1px solid #303a43;border-radius:5px;font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:#788b95}
  .sx-bottom-status b{color:#d5dde1}.sx-bottom-status .live{color:#62e887}
  @media(max-width:950px){.sx-ops-hero,.sx-section-grid{grid-template-columns:1fr}.sx-ops-grid{grid-template-columns:repeat(2,1fr)}.sx-progress{grid-template-columns:repeat(3,1fr)}.sx-contact-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:700px){.sx-ops-route{font-size:29px}.sx-service-grid,.sx-action-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}
function installTab(){
  const nav=document.querySelector('nav.tabs'); if(!nav)return;
  if(!nav.querySelector('[data-tab="opsCenter"]')){
    const b=document.createElement('button');b.className='tab';b.dataset.tab='opsCenter';b.textContent='Operations';
    nav.prepend(b);
    b.addEventListener('click',show);
  }
}
function installPanel(){
  if($('opsCenter'))return;
  const main=document.querySelector('main.content');if(!main)return;
  const sec=document.createElement('section');sec.id='opsCenter';sec.className='panel';main.prepend(sec);
}
function progressHTML(){
  const w=workflow();
  const stages=['accepted','duty','boarded','departed','landed','parked'];
  const labels=['Accepted','On Duty','Boarded','Enroute','Landed','Parked'];
  let ix=stages.indexOf(w);
  if(w==='fuel'||w==='ready')ix=stages.indexOf('duty');
  if(w==='scheduled')ix=-1;
  if(['closed','complete','completed'].includes(w))ix=stages.length;
  return labels.map((x,i)=>'<div class="sx-progress-step '+(i<ix?'past':i===ix?'live':'')+'">'+x+'</div>').join('');
}
function phaseHTML(){
  const w=workflow();
  const order=['accepted','departed','departed','landed','parked'];
  const labels=['Pre-flight','Departure','En route','Approach','Arrival'];
  let ix=0;
  if(['accepted','duty','fuel','boarded','ready'].includes(w))ix=0;
  else if(w==='departed')ix=2;
  else if(w==='landed')ix=3;
  else if(w==='parked')ix=4;
  else if(['closed','complete','completed'].includes(w))ix=5;
  return labels.map((x,i)=>'<div class="sx-phase '+(i<ix?'past':i===ix?'live':'')+'">'+x+'</div>').join('');
}
function serviceButton(side,key,label){
  const g=ensureGroundOps();
  const v=String(g[side]?.[key]||'NOT REQUESTED').toUpperCase();
  return '<button class="sx-svc '+statusClass(v)+'" data-side="'+side+'" data-key="'+key+'"><small>'+esc(label)+'</small><strong>'+esc(v)+'</strong></button>';
}
function render(){
  installStyles();installTab();installPanel();
  const el=$('opsCenter');if(!el)return;
  const s=getState(),a=active(),c=s.career||{};
  const pax=Number(a?.pax??$('paxCount')?.value??0),bags=Number(a?.bags??$('bags')?.value??0),rev=Number(a?.revenue??$('revenue')?.value??0);
  const client=a?.client||$('clientName')?.value||'No active client';
  const dep=a?.origin||$('origin')?.value||'—',arr=a?.destination||a?.dest||$('destination')?.value||'—';
  const dispatcher='Sierra Dispatch';
  const depFbo=$('fboName')?.value||('Handler at '+dep);
  const arrFbo=(a?.arrivalFbo||a?.destinationFbo||'Handler at '+arr);
  const clientContact=a?.clientContact||$('clientContact')?.value||'Client representative';
  el.innerHTML=`
  <div class="sx-opnav">
    <button data-workspace="dispatch">Dispatch</button>
    <button data-workspace="ofp">OFP</button>
    <button data-workspace="weather">Weather</button>
    <button data-workspace="airports">Airports</button>
    <button class="active" data-workspace="ground">Ground Ops</button>
    <button data-workspace="tracker">Flight Tracker</button>
    <button data-workspace="comms">ACARS / Comms</button>
    <button data-workspace="financials">Financials</button>
  </div>
  <div class="sx-contact-grid">
    <div class="sx-contact-card"><small>Dispatcher</small><b>${esc(dispatcher)}</b><span>Flight watch • release • passenger coordination</span></div>
    <div class="sx-contact-card"><small>Departure FBO • ${esc(dep)}</small><b>${esc(depFbo)}</b><span>Fuel • catering • ramp • boarding</span></div>
    <div class="sx-contact-card"><small>Arrival FBO • ${esc(arr)}</small><b>${esc(arrFbo)}</b><span>Transport • fuel • lav • parking</span></div>
    <div class="sx-contact-card"><small>Client Representative</small><b>${esc(clientContact)}</b><span>${esc(client)}</span></div>
  </div>
  <div class="sx-phasebar">${phaseHTML()}</div>
  <div class="sx-ops-hero">
    <div class="sx-ops-card sx-ops-main">
      <div class="sx-ops-eyebrow">Sierra Executive • Live Operations</div>
      <div class="sx-ops-flightline"><div class="sx-ops-flight">${esc(flightId())}</div><div class="sx-ops-state">${esc(workflow().replace(/_/g,' ').toUpperCase())}</div></div>
      <div class="sx-ops-route">${esc(routeText())}</div>
      <div class="sx-ops-client">${esc(client)} • ${esc(aircraftText())}</div>
      <div class="sx-ops-grid">
        <div class="sx-kpi"><span>Passengers</span><b>${pax||'—'}</b></div>
        <div class="sx-kpi"><span>Baggage</span><b>${bags?Math.round(bags)+' lb':'—'}</b></div>
        <div class="sx-kpi"><span>Charter Value</span><b>${rev?money(rev):'—'}</b></div>
        <div class="sx-kpi"><span>Destination</span><b>${esc(arr)}</b></div>
      </div>
    </div>
    <div class="sx-ops-card sx-career">
      <h3>Company Snapshot</h3>
      <div class="sx-career-row"><span>Fleet aircraft</span><b>${s.fleet&&typeof s.fleet==='object'?Object.keys(s.fleet).length:'—'}</b></div>
      <div class="sx-career-row"><span>Career charters</span><b>${Number(c.charters)||0}</b></div>
      <div class="sx-career-row"><span>Passengers carried</span><b>${Number(c.pax)||0}</b></div>
      <div class="sx-career-row"><span>Flight hours</span><b>${Number(c.hours||0).toFixed(1)}</b></div>
      <div class="sx-career-row"><span>Career profit</span><b style="color:#62e887">${money(c.profit||0)}</b></div>
      <div class="sx-career-row"><span>Current base/location</span><b>${esc(c.location||dep||'—')}</b></div>
    </div>
  </div>

  <div class="sx-section-grid">
    <div class="sx-ops-card sx-services">
      <h3>Departure Services • ${esc(dep)}</h3>
      <div class="sx-service-grid">
        ${serviceButton('departure','fuel','Fuel')}
        ${serviceButton('departure','gpu','GPU')}
        ${serviceButton('departure','catering','Catering')}
        ${serviceButton('departure','boarding','Boarding')}
      </div>
      <div class="sx-service-note">Tap a service to move it through Not Requested → Requested → Confirmed → Complete.</div>
    </div>
    <div class="sx-ops-card sx-services">
      <h3>Arrival Services • ${esc(arr)}</h3>
      <div class="sx-service-grid">
        ${serviceButton('arrival','transport','PAX Transport')}
        ${serviceButton('arrival','crewcar','Crew Car')}
        ${serviceButton('arrival','fuel','Fuel')}
        ${serviceButton('arrival','lav','Lav Service')}
        ${serviceButton('arrival','hangar','Hangar / Parking')}
      </div>
    </div>
  </div>

  <div class="sx-ops-card sx-quick" style="margin-top:10px">
    <h3>Flight Actions</h3>
    <div class="sx-action-grid">
      <button class="sx-action primary" data-wf="duty">Start Duty</button>
      <button class="sx-action primary" data-wf="boarded">Passengers Boarded</button>
      <button class="sx-action good" data-wf="departed">Departed</button>
      <button class="sx-action good" data-wf="landed">Landed</button>
      <button class="sx-action" data-wf="parked">Parked</button>
      <button class="sx-action" id="sxCloseFlight">Close Flight</button>
    </div>
    <div class="sx-toolbar2">
      <button class="sx-link" data-open="dispatch">Dispatch</button>
      <button class="sx-link" data-open="manifest">Manifest</button>
      <button class="sx-link" data-open="fuel">Fuel & Load</button>
      <button class="sx-link" data-open="fbo">Full FBO Page</button>
      <button class="sx-link" data-open="finance">Financials</button>
      <button class="sx-link" id="sxOpenPhone">Dispatch Phone</button>
    </div>
  </div>
  <div class="sx-bottom-status">
    <span class="live">● OPS LIVE</span>
    <span>${esc(flightId())}</span>
    <b>${esc(routeText())}</b>
    <span>${esc(aircraftText())}</span>
    <span>Phase: ${esc(workflow().toUpperCase())}</span>
  </div>`;
  el.querySelectorAll('.sx-svc').forEach(b=>b.onclick=()=>cycleService(b.dataset.side,b.dataset.key));
  el.querySelectorAll('[data-wf]').forEach(b=>b.onclick=()=>setWorkflow(b.dataset.wf));
  el.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openTab(b.dataset.open));
  if(window.sxOpsWorkspaces?.bind)window.sxOpsWorkspaces.bind(el);
  $('sxCloseFlight')?.addEventListener('click',closeActive);
  $('sxOpenPhone')?.addEventListener('click',()=>window.sxDispatchPhone?.open?.());
  $('sxOpenPhoneTop')?.addEventListener('click',()=>window.sxDispatchPhone?.open?.());
}
function show(){
  document.body.classList.add('sx-ops-mode');
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('nav.tabs .tab').forEach(b=>b.classList.remove('active'));
  $('opsCenter')?.classList.add('active');
  document.querySelector('[data-tab="opsCenter"]')?.classList.add('active');
  if($('pageTitle'))$('pageTitle').textContent='Operations Center';
  render();
}
function polishHeader(){
  const badge=document.querySelector('.topbar .badge.green');
  if(badge)badge.textContent='SIERRA EXECUTIVE • OPS V2';
}
let sxUserNavigated=false;
function bindModeReset(){
  document.querySelectorAll('nav.tabs .tab').forEach(b=>{
    if(b.dataset.tab==='opsCenter'||b.dataset.sxOpsBound)return;
    b.dataset.sxOpsBound='1';
    b.addEventListener('click',(e)=>{
      if(!e.isTrusted)return;
      sxUserNavigated=true;
      document.body.classList.remove('sx-ops-mode');
    });
  });
  const opsBtn=document.querySelector('nav.tabs .tab[data-tab="opsCenter"]');
  if(opsBtn&&!opsBtn.dataset.sxOpsBound){
    opsBtn.dataset.sxOpsBound='1';
    opsBtn.addEventListener('click',(e)=>{
      if(e.isTrusted)sxUserNavigated=false;
    });
  }
}
function firstRun(){
  installStyles();installTab();installPanel();bindModeReset();polishHeader();render();
  if(!sxUserNavigated)show();
}
firstRun();
[250,700,1400,2600,4200].forEach(ms=>setTimeout(()=>{if(!sxUserNavigated)firstRun()},ms));
setInterval(()=>{
  if(!sxUserNavigated && !$('opsCenter')?.classList.contains('active'))show();
  if($('opsCenter')?.classList.contains('active'))render();
},2500);
console.info('Sierra Executive Operations Center v2 active');
})();