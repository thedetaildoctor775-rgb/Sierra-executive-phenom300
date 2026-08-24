(()=>{
'use strict';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString();

function addStyles(){
  if($('sierraOpsDashboardStyles'))return;
  const s=document.createElement('style');
  s.id='sierraOpsDashboardStyles';
  s.textContent=`
  /* Sierra Executive dense aviation-ops layout */
  .shell{grid-template-columns:215px 1fr!important}
  .sidebar{padding:12px 9px!important;background:#090b0f!important}
  .side-brand{padding:8px 8px 13px!important}
  .side-card{padding:9px!important;margin-bottom:7px!important;background:#10141a!important;border-color:#313a45!important}
  .side-main{font-size:15px!important}
  .tab{padding:9px 8px!important;font-size:11px!important;border-radius:4px!important}
  .tab.active{background:#171719!important;color:#e9bf62!important;border-left:3px solid #e9bf62!important}
  .content{padding:12px 14px 22px!important}
  .topbar{padding:3px 1px 10px!important}
  .topbar h1{font-size:27px!important}
  .card{border-radius:6px!important;padding:12px!important}

  #tripDossier .td-shell{grid-template-columns:minmax(330px,.80fr) minmax(520px,1.20fr)!important;gap:8px!important}
  #tripDossier .td-panel{border-radius:5px!important;background:#10141a!important;border-color:#3c4650!important}
  #tripDossier .td-head{padding:13px 14px!important;background:linear-gradient(135deg,#17181f,#101319)!important}
  #tripDossier .td-kicker{font-size:9px!important}
  #tripDossier .td-title{font-size:26px!important;margin:2px 0!important}
  #tripDossier .td-route{font-size:14px!important;margin-top:5px!important;color:#63ddeb!important}
  #tripDossier .td-overview{padding:11px 14px!important;min-height:80px!important;font-size:12px!important;line-height:1.42!important}
  #tripDossier .td-stats{grid-template-columns:repeat(2,1fr)!important;gap:5px!important;padding:0 12px 10px!important}
  #tripDossier .td-stat{padding:7px 8px!important;border-radius:4px!important;background:#151c23!important}
  #tripDossier .td-stat b{font-size:15px!important}
  #tripDossier .td-list{padding:7px 9px!important}
  #tripDossier .td-leg{grid-template-columns:28px minmax(0,1fr) auto!important;gap:7px!important;padding:7px 8px!important;margin-bottom:5px!important;border-radius:4px!important;background:#151820!important}
  #tripDossier .td-leg.active{background:#1a1a16!important;border-color:#e9bf62!important;box-shadow:inset 3px 0 #e9bf62!important}
  #tripDossier .td-num{font-size:18px!important}
  #tripDossier .td-route2{font-size:17px!important}
  #tripDossier .td-meta{font-size:9.5px!important;margin-top:2px!important}
  #tripDossier .td-money{font-size:14px!important}
  #tripDossier .td-status{font-size:8px!important}
  #tripDossier .td-actions{gap:5px!important;padding:0 9px 9px!important}
  #tripDossier .td-actions .btn{padding:8px 9px!important;font-size:10px!important}
  #tripDossier .td-map{min-height:620px!important;border:1px solid #3c4650!important;border-radius:5px!important;background:radial-gradient(circle at 44% 42%,rgba(47,227,242,.08),transparent 34%),linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px),#0b1118!important;background-size:auto,34px 34px,34px 34px!important}
  #tripDossier .td-map-title{font-size:9px!important;background:rgba(8,11,15,.8);padding:5px 7px;border-radius:3px}
  #tripDossier .td-map-label{font-size:9px!important;padding:3px 5px!important;border-radius:2px!important;background:#17140d!important}

  #dispatch .ops-flight-strip{display:grid;grid-template-columns:1.15fr .85fr .75fr .75fr .75fr;gap:6px;margin-bottom:8px;padding:8px;background:#10141a;border:1px solid #3c4650;border-radius:5px}
  #dispatch .ops-strip-cell{min-width:0;padding:7px 8px;background:#151c23;border:1px solid #283743;border-radius:4px}
  #dispatch .ops-strip-label{font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:#8eb4bf}
  #dispatch .ops-strip-main{font-size:16px;font-weight:900;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #dispatch .ops-strip-main.route{color:#63ddeb}
  #dispatch .ops-strip-main.money{color:#62e887}
  #dispatch .form2,#dispatch .form3{gap:7px!important}
  #dispatch input,#dispatch select,#dispatch textarea{padding:8px!important;font-size:14px!important;border-radius:5px!important}
  #dispatch .label{font-size:9px!important}

  @media(max-width:900px){
    .shell{grid-template-columns:175px 1fr!important}
    #tripDossier .td-shell{grid-template-columns:1fr!important}
    #tripDossier .td-map{min-height:390px!important}
    #dispatch .ops-flight-strip{grid-template-columns:repeat(2,1fr)!important}
  }
  @media(max-width:700px){
    .shell{display:block!important}
    .sidebar{position:relative!important;height:auto!important;max-height:none!important}
    #tripDossier .td-map{min-height:340px!important}
  }
  `;
  document.head.appendChild(s);
}

function dispatchValues(){
  const a=state?.activeAssignment||{};
  const route=((a.origin||window.val?.('origin')||'—')+' → '+(a.destination||window.val?.('destination')||'—')).toUpperCase();
  const aircraft=state?.activeAircraft||state?.selectedAircraft||a.aircraft||'—';
  const status=String(state?.workflow||a.status||'scheduled').replace(/_/g,' ').toUpperCase();
  const client=a.client||window.val?.('clientName')||state?.tripDossier?.client||'—';
  const revenue=Number(a.revenue??window.val?.('revenue')??0);
  return {route,aircraft,status,client,revenue};
}

function ensureDispatchStrip(){
  const panel=$('dispatch');
  if(!panel)return;
  let strip=$('opsFlightStrip');
  if(!strip){
    strip=document.createElement('div');
    strip.id='opsFlightStrip';
    strip.className='ops-flight-strip';
    panel.prepend(strip);
  }
  const v=dispatchValues();
  strip.innerHTML=`
    <div class="ops-strip-cell"><div class="ops-strip-label">Active Route</div><div class="ops-strip-main route">${esc(v.route)}</div></div>
    <div class="ops-strip-cell"><div class="ops-strip-label">Client</div><div class="ops-strip-main">${esc(v.client)}</div></div>
    <div class="ops-strip-cell"><div class="ops-strip-label">Aircraft</div><div class="ops-strip-main">${esc(v.aircraft)}</div></div>
    <div class="ops-strip-cell"><div class="ops-strip-label">Status</div><div class="ops-strip-main">${esc(v.status)}</div></div>
    <div class="ops-strip-cell"><div class="ops-strip-label">Revenue</div><div class="ops-strip-main money">${money(v.revenue)}</div></div>`;
}

function updateSidebarTrip(){
  const d=state?.tripDossier;
  if(!d)return;
  const cards=[...document.querySelectorAll('.side-card')];
  const trip=cards.find(c=>/Active Trip/i.test(c.textContent||''));
  if(trip){
    const main=trip.querySelector('.side-main');
    const small=trip.querySelector('.small');
    if(main)main.textContent=d.client||d.title||d.id||'Active Trip';
    if(small){
      const legs=Array.isArray(d.legs)?d.legs:[];
      const done=legs.filter(l=>['completed','complete','closed'].includes(String(l.status||'').toLowerCase())).length;
      small.textContent=legs.length?`${done}/${legs.length} legs completed`:'Trip dossier';
    }
  }
}

function refresh(){addStyles();ensureDispatchStrip();updateSidebarTrip();}
refresh();
setTimeout(refresh,400);
setTimeout(refresh,1200);
setInterval(refresh,2500);
console.info('Sierra Executive dense operations dashboard style active');
})();