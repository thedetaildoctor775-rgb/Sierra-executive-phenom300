(()=>{
'use strict';

const $=id=>document.getElementById(id);
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const AIRPORTS={
 KMEV:[39.00,-119.75],KRNO:[39.50,-119.77],KTRK:[39.32,-120.14],KTVL:[38.89,-119.99],KAPC:[38.21,-122.28],KSFO:[37.62,-122.38],KOAK:[37.72,-122.22],KSJC:[37.36,-121.93],KVNY:[34.21,-118.49],KBUR:[34.20,-118.36],KLAX:[33.94,-118.41],KSNA:[33.68,-117.87],KSAN:[32.73,-117.19],KPSP:[33.83,-116.51],KLAS:[36.08,-115.15],KPHX:[33.43,-112.01],KSDL:[33.62,-111.91],KBOI:[43.56,-116.22],KPDX:[45.59,-122.60],KSEA:[47.45,-122.31],KGEG:[47.62,-117.53],KSLC:[40.79,-111.98],KMTJ:[38.51,-107.89],KSBS:[40.52,-106.87],KASE:[39.22,-106.87],KAPA:[39.57,-104.85],KDEN:[39.86,-104.67],KSMX:[34.90,-120.46],KMRY:[36.59,-121.84],KSBP:[35.24,-120.64],KSMO:[34.02,-118.45]
};

function currentAssignment(){return state?.activeAssignment||null;}
function flightFromAssignment(a){
 if(!a)return null;
 return {
   id:a.id||a.flightId||val?.('flightId')||'LEG-'+Date.now(),
   origin:String(a.origin||val?.('origin')||'').toUpperCase(),
   destination:String(a.destination||val?.('destination')||'').toUpperCase(),
   departure:a.departure||a.depTime||val?.('depTime')||'',
   date:a.date||a.depDate||val?.('depDate')||'',
   pax:Number(a.pax??val?.('paxCount')??0),
   bags:Number(a.bags??val?.('bags')??0),
   revenue:Number(a.revenue??val?.('revenue')??0),
   aircraft:a.aircraft||state?.activeAircraft||state?.selectedAircraft||'',
   status:String(a.status||state?.workflow||'scheduled').toLowerCase(),
   mission:a.mission||val?.('mission')||'',
   client:a.client||val?.('clientName')||''
 };
}
function ensureDossier(){
 state.tripDossier=state.tripDossier||{};
 const d=state.tripDossier;
 const a=currentAssignment();
 const af=flightFromAssignment(a);
 d.id=d.id||('TRIP-'+new Date().toISOString().slice(0,10).replace(/-/g,''));
 d.client=d.client||af?.client||val?.('clientName')||'Sierra Executive Client';
 d.title=d.title||af?.mission||'Executive Charter';
 d.overview=d.overview||'Multi-leg Sierra Executive charter itinerary. Each leg keeps its own dispatch, passenger, baggage, fuel, FBO and financial data.';
 d.legs=Array.isArray(d.legs)?d.legs:[];
 if(af?.origin&&af?.destination&&!d.legs.some(x=>x.id===af.id || (x.origin===af.origin&&x.destination===af.destination&&x.date===af.date))){d.legs.push(af);}
 if(!Number.isInteger(d.activeLeg))d.activeLeg=Math.max(0,d.legs.findIndex(x=>!['completed','complete'].includes(String(x.status).toLowerCase())));
 if(d.activeLeg<0)d.activeLeg=0;
 return d;
}
function persist(){try{saveState();}catch(e){try{localStorage.setItem('sierra_phenom300_state',JSON.stringify(state));}catch(_){}}}
function completed(leg){return ['completed','complete','closed'].includes(String(leg?.status||'').toLowerCase());}
function routeText(d){if(!d.legs.length)return 'No legs yet';return [d.legs[0].origin,...d.legs.map(x=>x.destination)].filter(Boolean).join(' → ');}
function tripTotals(d){return d.legs.reduce((o,l)=>{o.revenue+=Number(l.revenue)||0;o.pax+=Number(l.pax)||0;o.bags+=Number(l.bags)||0;o.completed+=completed(l)?1:0;return o;},{revenue:0,pax:0,bags:0,completed:0});}

function injectStyles(){
 if($('tripDossierStyles'))return;
 const s=document.createElement('style');s.id='tripDossierStyles';s.textContent=`
 #tripDossier{padding:0!important;background:transparent!important;border:0!important}
 .td-shell{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr);gap:12px}
 .td-panel{background:#0b1b23;border:1px solid #244754;border-radius:10px;overflow:hidden}
 .td-head{padding:18px;border-bottom:1px solid #244754;background:linear-gradient(135deg,#121720,#0c1118)}
 .td-kicker{font-size:10px;letter-spacing:.16em;color:#e9bf62;text-transform:uppercase}.td-title{font-family:Georgia,serif;font-size:32px;margin:4px 0;color:#eee8df}.td-route{font-weight:900;color:#72b7ff;font-size:16px;margin-top:8px}
 .td-overview{padding:16px;line-height:1.55;color:#c8d6da;font-size:13px;min-height:110px}.td-overview textarea{min-height:100px}
 .td-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 16px 16px}.td-stat{background:#102832;border:1px solid #244754;border-radius:8px;padding:10px}.td-stat span{display:block;color:#8eb4bf;font-size:9px;text-transform:uppercase}.td-stat b{font-size:18px;display:block;margin-top:3px}
 .td-list{padding:12px}.td-leg{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #2b4050;background:#101722;border-radius:8px;padding:11px;margin-bottom:8px}.td-leg.active{border-color:#e9bf62;box-shadow:inset 3px 0 #e9bf62}.td-leg.done{opacity:.72}.td-num{font-size:22px;font-weight:900;color:#e9bf62;text-align:center}.td-route2{font-size:20px;font-weight:900}.td-meta{font-size:11px;color:#8eb4bf;margin-top:4px}.td-money{font-size:16px;font-weight:900;color:#62e887;text-align:right}.td-status{font-size:9px;text-transform:uppercase;color:#ffd166;text-align:right;margin-top:4px}
 .td-actions{display:flex;flex-wrap:wrap;gap:8px;padding:0 12px 14px}
 .td-map{position:relative;min-height:520px;background:radial-gradient(circle at 30% 40%,rgba(47,227,242,.08),transparent 36%),linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px),#071116;background-size:auto,42px 42px,42px 42px;overflow:hidden}.td-map svg{position:absolute;inset:0;width:100%;height:100%}.td-map-label{position:absolute;transform:translate(-50%,-50%);background:#17140d;border:1px solid #e9bf62;color:#ffe9a3;padding:4px 6px;border-radius:5px;font-size:10px;font-weight:900;z-index:2}.td-map-title{position:absolute;left:14px;top:12px;z-index:3;color:#8eb4bf;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
 .td-empty{padding:28px;text-align:center;color:#8eb4bf}.td-edit{padding:0 16px 16px;display:none}.td-edit.open{display:block}
 @media(max-width:900px){.td-shell{grid-template-columns:1fr}.td-map{min-height:360px}.td-stats{grid-template-columns:repeat(2,1fr)}}
 `;document.head.appendChild(s);
}

function installTab(){
 const nav=document.querySelector('nav.tabs');if(!nav||document.querySelector('[data-tab="tripDossier"]'))return;
 const btn=document.createElement('button');btn.className='tab';btn.dataset.tab='tripDossier';btn.textContent='Trip Dossier';
 const dispatch=[...nav.querySelectorAll('.tab')].find(x=>x.dataset.tab==='dispatch');
 if(dispatch)dispatch.after(btn);else nav.appendChild(btn);
 btn.addEventListener('click',()=>showDossier());
}
function installPanel(){
 if($('tripDossier'))return;
 const main=document.querySelector('main.content');if(!main)return;
 const sec=document.createElement('section');sec.id='tripDossier';sec.className='panel';main.appendChild(sec);
}
function showDossier(){
 document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
 document.querySelectorAll('nav.tabs .tab').forEach(b=>b.classList.remove('active'));
 $('tripDossier')?.classList.add('active');document.querySelector('[data-tab="tripDossier"]')?.classList.add('active');
 if($('pageTitle'))$('pageTitle').textContent='Trip Dossier';
 render();
}
function mapPoints(d){
 const codes=[d.legs[0]?.origin,...d.legs.map(l=>l.destination)].filter(Boolean);
 const uniq=[...new Set(codes)];
 const pts=uniq.map((code,i)=>({code,coord:AIRPORTS[code]||null,i}));
 const known=pts.filter(p=>p.coord);
 if(known.length>=2){
   const lats=known.map(p=>p.coord[0]),lons=known.map(p=>p.coord[1]);const minLat=Math.min(...lats)-1,maxLat=Math.max(...lats)+1,minLon=Math.min(...lons)-1,maxLon=Math.max(...lons)+1;
   pts.forEach((p,i)=>{if(p.coord){p.x=8+84*(p.coord[1]-minLon)/(maxLon-minLon||1);p.y=90-80*(p.coord[0]-minLat)/(maxLat-minLat||1);}else{p.x=15+70*(i/Math.max(1,pts.length-1));p.y=50;}});
 }else pts.forEach((p,i)=>{p.x=12+76*(i/Math.max(1,pts.length-1));p.y=50+(i%2?10:-10);});
 return {pts,codes};
}
function renderMap(d){
 if(!d.legs.length)return '<div class="td-map"><div class="td-empty">Add a leg to display the trip route.</div></div>';
 const {pts,codes}=mapPoints(d), lookup=Object.fromEntries(pts.map(p=>[p.code,p]));
 const segs=[];for(let i=0;i<codes.length-1;i++){const a=lookup[codes[i]],b=lookup[codes[i+1]];if(a&&b)segs.push(`<line x1="${a.x}%" y1="${a.y}%" x2="${b.x}%" y2="${b.y}%" stroke="${i<d.activeLeg?'#62e887':i===d.activeLeg?'#e9bf62':'#72b7ff'}" stroke-width="3" stroke-linecap="round"/>`)}
 return `<div class="td-map"><div class="td-map-title">Trip route</div><svg>${segs.join('')}</svg>${pts.map(p=>`<div class="td-map-label" style="left:${p.x}%;top:${p.y}%">${esc(p.code)}</div>`).join('')}</div>`;
}
function render(){
 installPanel();const d=ensureDossier(),t=tripTotals(d),el=$('tripDossier');if(!el)return;
 el.innerHTML=`<div class="td-shell">
 <div class="td-panel">
  <div class="td-head"><div class="td-kicker">Sierra Executive • Multi-Leg Charter</div><div class="td-title">${esc(d.client)}</div><div style="font-size:18px;font-weight:800">${esc(d.title)}</div><div class="td-route">${esc(routeText(d))}</div></div>
  <div class="td-overview"><div id="tdOverviewText">${esc(d.overview)}</div><div class="td-edit" id="tdEdit"><textarea id="tdOverviewInput">${esc(d.overview)}</textarea><div style="margin-top:8px"><button class="btn" id="tdSaveOverview">Save Brief</button></div></div></div>
  <div class="td-stats"><div class="td-stat"><span>Legs</span><b>${t.completed}/${d.legs.length} complete</b></div><div class="td-stat"><span>Trip revenue</span><b>${money(t.revenue)}</b></div><div class="td-stat"><span>Passenger legs</span><b>${t.pax}</b></div><div class="td-stat"><span>Baggage</span><b>${Math.round(t.bags)} lb</b></div></div>
  <div class="td-list">${d.legs.length?d.legs.map((l,i)=>`<div class="td-leg ${i===d.activeLeg?'active':''} ${completed(l)?'done':''}" data-leg="${i}"><div class="td-num">${i+1}</div><div><div class="td-route2">${esc(l.origin)} → ${esc(l.destination)}</div><div class="td-meta">${esc(l.date||'Date TBD')} ${esc(l.departure||'')} • ${Number(l.pax)||0} PAX • ${Math.round(Number(l.bags)||0)} lb bags • ${esc(l.aircraft||'Aircraft TBD')}</div></div><div><div class="td-money">${money(l.revenue)}</div><div class="td-status">${esc(completed(l)?'Completed':i===d.activeLeg?'Active Leg':l.status||'Pending')}</div></div></div>`).join(''):'<div class="td-empty">No legs in this trip yet.</div>'}</div>
  <div class="td-actions"><button class="btn" id="tdDispatch">Open Active Leg in Dispatch</button><button class="btn secondary" id="tdAdd">Add Leg</button><button class="btn secondary" id="tdComplete">Complete Active Leg</button><button class="btn secondary" id="tdBrief">Edit Trip Brief</button></div>
 </div>${renderMap(d)}</div>`;
 bind(d);
}
function bind(d){
 $('tdDispatch')?.addEventListener('click',()=>openLeg(d.activeLeg));
 $('tdAdd')?.addEventListener('click',addLeg);
 $('tdComplete')?.addEventListener('click',completeActive);
 $('tdBrief')?.addEventListener('click',()=>{$('tdEdit')?.classList.toggle('open');$('tdOverviewText').style.display=$('tdEdit')?.classList.contains('open')?'none':'block';});
 $('tdSaveOverview')?.addEventListener('click',()=>{d.overview=$('tdOverviewInput')?.value||'';persist();render();});
 document.querySelectorAll('.td-leg').forEach(x=>x.addEventListener('click',()=>{d.activeLeg=Number(x.dataset.leg)||0;persist();render();}));
}
function addLeg(){
 const d=ensureDossier();const prev=d.legs[d.legs.length-1];
 const origin=(prompt('Departure airport ICAO',prev?.destination||'KMEV')||'').trim().toUpperCase();if(!origin)return;
 const destination=(prompt('Arrival airport ICAO','')||'').trim().toUpperCase();if(!destination)return;
 const pax=Number(prompt('Passengers','4')||0);const revenue=Number(prompt('Leg revenue ($)','7500')||0);
 d.legs.push({id:'SXR-'+Date.now().toString().slice(-5),origin,destination,date:'',departure:'',pax,bags:Math.round(pax*35),revenue,aircraft:state?.selectedAircraft||state?.activeAircraft||'',status:'pending',mission:d.title,client:d.client});
 persist();render();
}
function completeActive(){
 const d=ensureDossier(),l=d.legs[d.activeLeg];if(!l)return;
 l.status='completed';
 const next=d.legs.findIndex((x,i)=>i>d.activeLeg&&!completed(x));if(next>=0)d.activeLeg=next;
 persist();render();
}
function setField(id,v){try{if(typeof set==='function')set(id,v??'');else if($(id))$(id).value=v??'';}catch(e){if($(id))$(id).value=v??'';}}
function openLeg(i){
 const d=ensureDossier(),l=d.legs[i];if(!l)return;
 d.activeLeg=i;
 state.selectedAircraft=l.aircraft||state.selectedAircraft||state.activeAircraft;
 setField('flightId',l.id);setField('origin',l.origin);setField('destination',l.destination);setField('depDate',l.date);setField('depTime',l.departure);setField('paxCount',l.pax);setField('bags',l.bags);setField('revenue',l.revenue);setField('mission',l.mission||d.title);setField('clientName',l.client||d.client);
 state.activeAssignment={...(state.activeAssignment||{}),id:l.id,origin:l.origin,destination:l.destination,date:l.date,depTime:l.departure,pax:l.pax,bags:l.bags,revenue:l.revenue,aircraft:l.aircraft||state.selectedAircraft,mission:l.mission||d.title,client:l.client||d.client};
 persist();try{if(typeof saveAll==='function')saveAll();else if(typeof sync==='function')sync();}catch(e){}
 const btn=document.querySelector('[data-tab="dispatch"]');if(btn)btn.click();
}

// If the normal flight close routine runs, mark the matching dossier leg complete and advance.
if(typeof closeFlight==='function'){
 const oldClose=closeFlight;closeFlight=async function(...args){const d=ensureDossier(),active=d.legs[d.activeLeg],result=await oldClose.apply(this,args);if(active){active.status='completed';const next=d.legs.findIndex((x,i)=>i>d.activeLeg&&!completed(x));if(next>=0)d.activeLeg=next;persist();}return result;};
}

injectStyles();installTab();installPanel();ensureDossier();persist();
setTimeout(()=>{installTab();installPanel();},400);
console.info('Sierra Trip Dossier v1 active');
})();