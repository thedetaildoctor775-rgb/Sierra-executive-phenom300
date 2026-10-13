(()=>{
'use strict';
if(window.sxAirlineStyle)return;
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('en-US');
const input=id=>$(id)?.value||'';
const data=()=>typeof state!=='undefined'?state:{};
const assignment=()=>data().activeAssignment;
const tail=()=>data().activeAircraft||assignment()?.aircraft||data().selectedAircraft;
const flight=()=>assignment()?.flight||assignment()?.id||input('flightId');
const statuses={scheduled:'Scheduled',accepted:'Scheduled',duty:'Preflight',fuel:'Preflight',boarded:'Boarding',ready:'Ready',departed:'Airborne',landed:'Landed',parked:'Parked',completed:'Completed',closed:'Completed'};
let filter='All flights',view='airlineOverview',message='',busy=false,lastMarkup='';
const phase=()=>String(data().workflow||'scheduled').toLowerCase();
const live=()=>!!assignment()&&!['completed','closed'].includes(phase());
const sim=()=>window.sxRealismSuite?.data?.()||{};
function rows(){
 const s=data(),a=assignment(),out=[],seen=new Set();
 const add=r=>{const key=r.flight||r.id||[r.origin,r.dest,r.date].join('|');if(seen.has(key))return;seen.add(key);out.push({...r,key})};
 if(live())add({...a,flight:flight(),dest:a.dest||a.destination,status:statuses[phase()]||phase(),aircraft:tail(),date:a.departureDate||a.date||input('depDate'),time:a.departureTime||a.depTime||input('depTime'),active:true});
 for(const l of s.tripDossier?.legs||[])if(!['completed','complete','closed'].includes(String(l.status).toLowerCase())){
   if(a&&l.origin===a.origin&&(l.destination||l.dest)===(a.dest||a.destination)&&(!l.date||l.date===(a.departureDate||a.date)))continue;
   add({...l,flight:l.flight||l.id,dest:l.dest||l.destination,status:'Planned',time:l.departure||l.departureTime,planned:true});
 }
 for(const l of [...(s.log||[])].reverse()){
   const [origin,dest]=String(l.route||'').split(/\s*[→>]\s*/);
   add({...l,origin,dest,status:'Completed',time:l.blockOut||'',completed:true});
 }
 return out;
}
function formatTime(r){
 if(!r.time)return r.date?esc(r.date):'—';
 const d=new Date(r.time);return Number.isNaN(d.getTime())?esc([r.date,r.time].filter(Boolean).join(' '))+' (local)':esc(d.toISOString().slice(11,16))+'Z';
}
function badge(status){return `<span class="sx-air-pill ${esc(status.toLowerCase())}">${esc(status)}</span>`}
function metric(label,value,note){return `<div class="sx-air-metric"><small>${label}</small><b>${esc(value)}</b><p>${esc(note)}</p></div>`}
function title(name,sub){return `<div class="sx-air-title"><div><div class="sx-air-kicker">SIERRA EXECUTIVE / OPERATIONS CONTROL</div><h2>${name}</h2><p>${sub}</p></div><button class="btn" data-action="schedule">＋ Schedule charter</button></div>`}
function table(){const list=rows().filter(r=>filter==='All flights'||r.status===filter);return `<section class="sx-air-card"><div class="sx-air-head"><div><h3>Flight operations</h3><p>Accepted charters, planned trip legs, and completed flights</p></div><select id="sxAirFilter" aria-label="Filter flights" style="width:auto">${['All flights','Scheduled','Preflight','Planned','Boarding','Ready','Airborne','Landed','Parked','Completed'].map(x=>`<option${filter===x?' selected':''}>${x}</option>`).join('')}</select></div><div class="sx-air-table-wrap"><table class="sx-air-table"><thead><tr><th>FLIGHT / ROUTE</th><th>DEPARTURE</th><th>AIRCRAFT</th><th>CLIENT</th><th>LOAD</th><th>STATUS</th><th></th></tr></thead><tbody>${list.map((r,i)=>`<tr><td><strong>${esc(r.flight||r.id||'Charter')}</strong><small>${esc(r.origin||'—')} → ${esc(r.dest||'—')}</small></td><td>${formatTime(r)}</td><td>${esc(r.aircraft||'Unassigned')}</td><td>${esc(r.client||data().tripDossier?.client||'—')}</td><td>${Number(r.pax)||0} pax<small>${Number(r.bags)||0} lb baggage</small></td><td>${badge(r.status)}</td><td><button class="btn secondary" data-row="${i}" aria-label="Open ${esc(r.flight||r.id||'charter')}">↗</button></td></tr>`).join('')}</tbody></table>${!list.length?'<div class="sx-air-empty">No flights in this view. Schedule a charter or accept one from the Charter Market.</div>':''}</div></section>`}
function overview(){
 const s=data(),list=rows(),active=list.filter(r=>!r.completed),fleet=Object.values(s.fleet||{}),c=s.career||{};
 const r=sim(),events=(r.events||[]).slice(-3).reverse(),issues=live()?readiness():[];
 return title('Your charter company. In motion.','A clear view of every charter, from dispatch to touchdown.')+
 `<div class="sx-air-metrics">${metric('ACTIVE CHARTERS',String(active.length).padStart(2,'0'),active.filter(r=>r.status==='Airborne').length+' currently airborne')}${metric('PASSENGERS SCHEDULED',active.reduce((n,r)=>n+(Number(r.pax)||0),0),'Across your accepted and planned trips')}${metric('FLEET AIRCRAFT',fleet.length,fleet.filter(a=>a.status==='Available').length+' available in your current fleet')}${metric('CAREER NET PROFIT',money(c.profit),(Number(c.charters)||0)+' completed charters')}</div>`+
 `<div class="sx-air-grid"><section class="sx-air-card"><div class="sx-air-head"><div><h3>Fleet overview</h3><p>Your aircraft, locations, and current assignments.</p></div>${badge('Manual status')}</div><div class="sx-air-inner sx-air-fleet">${fleet.map(a=>`<div class="sx-air-fleet-row"><div><b>${esc(a.tail)}</b><small>${esc(a.type)} · ${esc(a.model)} · ${esc(a.location)}</small></div><div>${badge(a.status||'Available')}<small>${esc(live()&&tail()===a.tail?flight():'No active assignment')}</small></div></div>`).join('')||'<div class="sx-air-empty">Your saved fleet will appear here.</div>'}</div></section><section class="sx-air-card"><div class="sx-air-head"><h3>Operations pulse</h3><span>◉</span></div><div class="sx-air-inner"><div class="sx-air-pulse">${live()?issues.length?issues.length+' dispatch checks need attention':'Active charter checks passed':'Ready for your next charter'}</div>${live()?`<div class="sx-air-event">${esc(flight())} · ${esc(assignment().origin)} → ${esc(assignment().dest||assignment().destination)}<small>${esc(statuses[phase()]||phase())} · ${esc(tail())}</small></div>`:''}${events.map(e=>`<div class="sx-air-event">${esc(e.type)} · ${esc(e.tail)}<small>${esc(e.note)}</small></div>`).join('')}<div class="toolbar" style="margin-top:20px"><button class="btn secondary" data-action="dispatch">Open dispatch queue →</button><button class="btn secondary" data-action="market">Charter Market</button></div></div></section></div>`+table();
}
function readiness(){
 const s=data(),a=assignment(),sb=s.simbrief,r=sim(),f=s.fleet?.[tail()],problems=[];
 if(!live())return ['Accept or activate a charter first'];
 if(!f)problems.push('Assigned aircraft is missing');
 if(!window.sxRealismSuite?.canDispatch?.(tail()))problems.push('Aircraft maintenance or crew availability check is not clear');
 const crew=(r.crew||[]).find(c=>c.id===r.assignments?.[tail()]);
 if(!crew)problems.push('Assign a qualified crew');
 else {
   if(!String(crew.types||'').split(/[,\s]+/).map(t=>t.toUpperCase()).includes(String(f?.model||'').toUpperCase()))problems.push('Crew aircraft qualification does not match');
   if(Number(crew.dutyHours)>=12)problems.push('Crew duty limit reached (12-hour simulation policy)');
   if(Date.parse(crew.restUntil)>Date.now())problems.push('Crew rest is incomplete');
 }
 if(!sb?.importedAt||sb.origin!==a.origin||sb.destination!==(a.dest||a.destination))problems.push('Import a matching SimBrief route');
 if(!sb?.aircraft||String(sb.aircraft).toUpperCase()!==String(f?.model||'').toUpperCase())problems.push('SimBrief aircraft type does not match');
 if(sb?.registration&&sb.registration!==tail())problems.push('SimBrief registration does not match');
 if(!(Number(input('blockFuel'))>0)||!input('route'))problems.push('Planned route and block fuel are required');
 if(input('origin')!==a.origin||input('destination')!==(a.dest||a.destination))problems.push('Planning fields differ from the accepted charter');
 return [...new Set(problems)];
}
function fingerprint(){const s=data(),a=assignment(),sb=s.simbrief,r=sim(),f=s.fleet?.[tail()];return JSON.stringify({id:flight(),tail:tail(),origin:a?.origin,dest:a?.dest||a?.destination,pax:a?.pax,bags:a?.bags,imported:sb?.importedAt,route:input('route'),fuel:input('blockFuel'),crew:r.assignments?.[tail()],model:f?.model})}
function released(){return data().airlineStyleReleases?.[flight()]?.fingerprint===fingerprint()}
function datum(label,value){return `<div><small>${label}</small><b>${esc(value||'—')}</b></div>`}
function dispatch(){
 if(!live())return title('Dispatch','Plan, release, and progress your active charter.')+'<div class="sx-air-card sx-air-empty">No active charter. Accept one from the Charter Market or activate a planned leg in Schedule.<div class="toolbar" style="margin-top:15px"><button class="btn" data-action="market">Open Charter Market</button></div></div>';
 const a=assignment(),s=data(),sb=s.simbrief,issues=readiness(),signed=released(),stages=['accepted','duty','fuel','boarded','ready','departed','landed','parked'],ix=stages.indexOf(phase());
 const next={accepted:['duty','Start duty'],duty:['fuel','Confirm fuel loaded'],fuel:['boarded','Passengers boarded'],boarded:['ready','Ready for departure'],ready:['departed','Depart flight'],departed:['landed','Record landing'],landed:['parked','Record block in'],parked:['close','Complete flight & post finances']}[phase()];
 return title('Dispatch','Connected planning, ground handling, and flight progression.')+`<div class="sx-air-grid"><section class="sx-air-card"><div class="sx-air-head"><div><h3>${esc(flight())} ${badge(statuses[phase()]||phase())}</h3><p>${esc(a.client||input('clientName'))}</p></div><span>✈</span></div><div class="sx-air-inner"><div class="sx-air-route"><b>${esc(a.origin)}</b><span>✈ →</span><b>${esc(a.dest||a.destination)}</b></div><div class="sx-air-data">${datum('Aircraft',tail())}${datum('Passengers',String(a.pax??input('paxCount')))}${datum('Baggage',(a.bags??input('bags'))+' lb')}${datum('Charter revenue',money(a.revenue??input('revenue')))}</div><div class="sx-air-kicker">FLIGHT PLANNING</div><div class="toolbar" style="margin:15px 0"><button class="btn" data-action="simbrief">Prepare in SimBrief ↗</button><button class="btn secondary" data-action="import"${busy?' disabled':''}>Import latest OFP</button><button class="btn secondary" data-action="planning">Planning details</button></div>${sb?.importedAt?`<div class="sx-air-pre">${esc(sb.route||'Route missing')}<div class="sx-air-data" style="margin:18px 0 0">${datum('Block fuel',(sb.blockFuel||'—')+' lb')}${datum('Cruise',sb.cruiseLevel)}${datum('Alternate',sb.alternate)}${datum('Aircraft',sb.aircraft)}</div></div>`:'<div class="sx-air-empty">Generate the matching charter in SimBrief, then import its OFP here.</div>'}<div class="sx-air-kicker" style="margin-top:23px">GROUND HANDLING & PASSENGERS</div><div class="toolbar" style="margin-top:15px"><button class="btn secondary" data-action="ground">FBO ground operations</button><button class="btn secondary" data-action="manifest">Passenger manifest</button><button class="btn secondary" data-action="fuel">Fuel & load</button><button class="btn secondary" data-action="weather">Weather</button></div></div></section><section class="sx-air-card"><div class="sx-air-head"><h3>Dispatch readiness</h3></div><div class="sx-air-inner">${issues.length?issues.map(x=>`<div class="sx-air-check warn">○ ${esc(x)}</div>`).join(''):'<div class="sx-air-check">✓ Aircraft, crew, and matching OFP checks passed</div>'}<div class="sx-air-check ${signed?'':'warn'}">${signed?'✓ Dispatch release signed':'○ Dispatch release pending'}</div><button class="btn" style="width:100%" data-action="release"${issues.length||signed||busy?' disabled':''}>${signed?'Release signed':'Sign dispatch release'}</button><div class="toolbar" style="margin-top:12px"><button class="btn secondary" data-action="crew">Crew & maintenance</button></div><div class="sx-air-kicker" style="margin-top:24px">FLIGHT PROGRESSION</div><div class="sx-air-steps">${['accepted','duty','fuel','boarded','ready','departed','landed','parked'].map((x,i)=>`<div class="${i<=ix?'current':''}">${i<ix?'✓':i===ix?'●':'○'} ${esc(statuses[x]==='Scheduled'?'Accepted':x==='fuel'?'Fuel loaded':x==='duty'?'On duty':statuses[x])}</div>`).join('')}</div>${next?`<button class="btn" style="width:100%" data-next="${next[0]}"${busy||(!signed&&ix<5)||issues.length&&ix<5?' disabled':''}>${next[1]} →</button>`:''}<p class="small" style="margin-top:16px">Update milestones as you fly in MSFS. Completion uses your existing flight log, aircraft location, duty, invoice, and finance workflow.</p>${message?`<div class="sx-air-error" role="status">${esc(message)}</div>`:''}</div></section></div>`;
}
function fleetHTML(){return title('Fleet','Your saved aircraft and their current availability.')+`<div class="sx-air-cards">${Object.values(data().fleet||{}).map(a=>`<section class="sx-air-card"><div class="sx-air-head" style="background:#e9f5f7"><h3>✈ ${esc(a.model)}</h3>${badge(a.status||'Available')}</div><div class="sx-air-inner"><h3>${esc(a.tail)}</h3><p class="small">${esc(a.type)}</p><div class="sx-air-data">${datum('Location',a.location)}${datum('Home base',a.home)}${datum('Flight hours',Number(a.hours||0).toFixed(1))}${datum('Assignment',live()&&tail()===a.tail?flight():'Available for dispatch')}</div><button class="btn secondary" data-aircraft="${esc(a.tail)}">Select aircraft</button><button class="btn secondary" data-action="maintenance">Maintenance records</button></div></section>`).join('')}</div>`}
function open(id){
 view=id;message='';lastMarkup='';document.body.classList.remove('sx-ops-mode');document.body.classList.add('sx-airline-panel');
 document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('nav.tabs .tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
 $(id)?.classList.add('active');$('pageTitle').textContent={airlineOverview:'Operations',airlineDispatch:'Dispatch',airlineFleet:'Fleet',airlineCrew:'Crew & realism'}[id]||'Operations';
 render();
}
function native(id){document.body.classList.remove('sx-airline-panel','sx-ops-mode');document.querySelector(`nav.tabs .tab[data-tab="${id}"]`)?.click()}
function ground(ws='ground'){native('opsCenter');window.sxOpsWorkspaces?.open?.(ws)}
function prepare(){
 const a=assignment(),f=data().fleet?.[tail()];if(!live()||!f)return;
 const d=new Date((a.departureDate||a.date||input('depDate'))+'T'+(a.departureTime||a.depTime||input('depTime')||'12:00'));
 const params=new URLSearchParams({airline:'SXR',fltnum:flight().replace(/^SXR/i,''),type:f.model||'',orig:a.origin,dest:a.dest||a.destination,reg:tail(),pax:String(a.pax??input('paxCount')),cargo:String(Number(a.bags??input('bags'))/1000),units:'LBS'});
 if(!Number.isNaN(d.getTime())){params.set('date',d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit',timeZone:'UTC'}).replaceAll(' ','').toUpperCase());params.set('deph',String(d.getUTCHours()));params.set('depm',String(d.getUTCMinutes()))}
 window.open('https://dispatch.simbrief.com/options/custom?'+params,'_blank','noopener,noreferrer');
}
async function progress(next){
 if(busy||!live())return;
 if(['duty','fuel','boarded','ready','departed'].includes(next)&&(!released()||readiness().length)){message='Resolve dispatch checks and sign the current release before progressing.';render(true);return}
 busy=true;render(true);
 try{if(next==='close')await closeFlight();else await step(next)}catch(e){message=e.message||String(e)}finally{busy=false;render(true)}
}
function bind(root){
 root.querySelector('#sxAirFilter')?.addEventListener('change',e=>{filter=e.target.value;render(true)});
 root.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{
   const action=b.dataset.action;
   if(action==='schedule'){native('market');if(typeof openCharterEditor==='function')openCharterEditor();return}
   if(action==='dispatch')return open('airlineDispatch');
   if(action==='market')return native('market');
   if(action==='planning')return native('dispatch');
   if(action==='crew')return open('airlineCrew');
   if(action==='ground')return ground();
   if(action==='weather')return ground('weather');
   if(action==='manifest'||action==='fuel')return native(action);
   if(action==='maintenance')return native('maint');
   if(action==='simbrief')return prepare();
   if(action==='release'){if(!readiness().length){const s=data();s.airlineStyleReleases=s.airlineStyleReleases||{};s.airlineStyleReleases[flight()]={fingerprint:fingerprint(),signedAt:new Date().toISOString()};saveState();render(true)}return}
   if(action==='import'){busy=true;render(true);try{await importSimBrief()}finally{busy=false;render(true)}}
 });
 root.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>progress(b.dataset.next));
 const list=rows().filter(r=>filter==='All flights'||r.status===filter);
 root.querySelectorAll('[data-row]').forEach(b=>b.onclick=()=>{const r=list[Number(b.dataset.row)];if(r.active)open('airlineDispatch');else native(r.completed?'log':'tripDossier')});
 root.querySelectorAll('[data-aircraft]').forEach(b=>b.onclick=()=>{selectAircraft(b.dataset.aircraft);render(true)});
}
function render(force=false){
 if(!$(view)?.classList.contains('active'))return;
 if(view==='airlineCrew'){
   const suite=$('sxRealismSuite');if(suite&&suite.parentElement!==$('airlineCrew'))$('airlineCrew').appendChild(suite);
   return;
 }
 if(document.activeElement?.matches('input,textarea,select')&&!force)return;
 const markup=view==='airlineOverview'?overview():view==='airlineDispatch'?dispatch():fleetHTML();
 if(markup!==lastMarkup||force){lastMarkup=markup;$(view).innerHTML=markup;bind($(view))}
}
function install(){
 const link=document.createElement('link');link.rel='stylesheet';link.href='/airline-style.css?v=20261013';document.head.appendChild(link);
 const nav=document.querySelector('nav.tabs'),main=document.querySelector('main.content');if(!nav||!main)return;
 const label=document.createElement('div');label.className='sx-workspace-label';label.textContent='WORKSPACE';nav.before(label);
 const newTabs=[['airlineOverview','Operations','▦'],['tripDossier','Schedule','▤'],['airlineDispatch','Dispatch','☷'],['airlineFleet','Fleet','✈'],['manifest','Passengers','♙'],['airlineCrew','Crew & realism','♧'],['opsCenter','Ground Ops','▥'],['finance','Finance','$']];
 newTabs.slice().reverse().forEach(([id,name,icon])=>{
   let b=nav.querySelector(`[data-tab="${id}"]`);
   if(!b){b=document.createElement('button');b.className='tab';b.dataset.tab=id;const p=document.createElement('section');p.id=id;p.className='panel';main.appendChild(p);b.onclick=()=>open(id)}
   b.innerHTML=`<span class="sx-nav-icon" aria-hidden="true">${icon}</span>${name}`;nav.prepend(b);
 });
 const planning=nav.querySelector('[data-tab="dispatch"]');if(planning)planning.textContent='Planning details';
 const backup=nav.querySelector('[data-tab="backup"]');if(backup)backup.textContent='Settings & backup';
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;if(!b.dataset.tab.startsWith('airline')){view=b.dataset.tab;lastMarkup='';document.body.classList.remove('sx-airline-panel');if(b.dataset.tab!=='opsCenter')document.body.classList.remove('sx-ops-mode')}});
 const clock=document.createElement('span');clock.className='sx-utc';clock.id='sxAirClock';document.querySelector('.topbar>div:last-child')?.prepend(clock);
 const tick=()=>{clock.textContent=new Date().toISOString().slice(11,19)+' Z'};tick();setInterval(tick,1000);
 open('airlineOverview');
 setInterval(()=>{if(document.visibilityState!=='hidden')render()},2000);
}
window.sxAirlineStyle={open,render,readiness,rows,prepare};
install();
})();
