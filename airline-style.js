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
function icon(name,size=18){
 const paths={Operations:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',Schedule:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',Dispatch:'<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/>',Fleet:'<path d="m22 2-7 20-4-9-9-4Z M22 2 11 13"/>',Passengers:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18"/>',Crew:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8M22 21v-2a7 7 0 0 0-5-6"/>',FBOs:'<path d="M3 21V7l9-4 9 4v14M8 9h1M15 9h1M8 13h1M15 13h1M10 21v-4h4v4"/>',Finance:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 14h5"/>',Settings:'<circle cx="12" cy="12" r="3"/><path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 2-1 3 3 3-2 1-3 3-1 2-3-2-2 1-3-3-2-3 1Z"/>',Globe:'<circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/>'};
 return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.Fleet}</svg>`;
}
function network(){
 const pts={KSFO:[98,126],KLAX:[123,181],KDEN:[253,125],KORD:[418,94],KIAH:[343,220],KEWR:[544,108],KIAD:[512,150],KMEV:[137,116],KRNO:[132,103],KVNY:[119,169],KBUR:[125,164],KLAS:[178,158],KSDL:[201,201],KSEA:[102,44],KPDX:[96,73],KSJC:[105,136],KMRY:[99,147],KSTS:[94,112],KAPA:[258,134],KTEB:[539,100],KASE:[235,133]};
 const list=rows().filter(r=>!r.completed),codes=[...new Set([...Object.values(data().fleet||{}).map(a=>a.location),...list.flatMap(r=>[r.origin,r.dest])])].filter(c=>pts[c]);
 const paths=list.filter(r=>pts[r.origin]&&pts[r.dest]).map(r=>{const[x,y]=pts[r.origin],[u,v]=pts[r.dest];return `<path d="M${x} ${y} Q${(x+u)/2} ${Math.min(y,v)-65} ${u} ${v}" fill="none" stroke="#006ce4" stroke-width="2" opacity=".75"/>`}).join('');
 return `<svg class="map" viewBox="0 0 650 285" role="img" aria-label="Schematic charter network"><defs><pattern id="dots" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#cbdbe8"/></pattern></defs><rect width="650" height="285" fill="url(#dots)"/><path d="M76 57 L151 61 193 46 250 61 304 54 365 61 404 52 427 78 467 66 498 58 514 77 548 70 567 95 579 124 555 145 530 161 521 196 481 214 480 239 460 253 443 218 399 221 370 240 337 248 307 219 257 205 231 210 195 194 168 184 140 185 119 165 100 153 85 116Z" fill="#eef5fa" stroke="#d6e3ed"/>${paths}${codes.map(c=>{const[x,y]=pts[c];return `<g><circle cx="${x}" cy="${y}" r="9" fill="#0072ce" opacity=".12"/><circle cx="${x}" cy="${y}" r="4" fill="#0065b8" stroke="white" stroke-width="2"/><text x="${x}" y="${y+23}" text-anchor="middle" font-size="11" fill="#183f65" font-weight="700">${esc(c.slice(1))}</text></g>`}).join('')}</svg>`;
}
function overview(){
 const s=data(),list=rows(),active=list.filter(r=>!r.completed),fleet=Object.values(s.fleet||{}),c=s.career||{};
 const r=sim(),events=(r.events||[]).slice(-3).reverse(),issues=live()?readiness():[];
 return title('Your company. In motion.','A clear view of every flight, from dispatch to touchdown.')+
 `<div class="sx-air-metrics">${metric('ACTIVE FLIGHTS',String(active.length).padStart(2,'0'),active.filter(r=>r.status==='Airborne').length+' currently airborne')}${metric('PASSENGERS SCHEDULED',active.reduce((n,r)=>n+(Number(r.pax)||0),0),'Across your active schedule')}${metric('FLEET AVAILABILITY',(fleet.length?Math.round(fleet.filter(a=>a.status==='Available').length/fleet.length*100):0)+'%',fleet.length+' aircraft in your saved fleet')}${metric('REALIZED NET PROFIT',money(c.profit),(Number(c.charters)||0)+' completed flights')}</div>`+
 `<div class="sx-air-grid"><section class="sx-air-card network"><div class="sx-air-head"><div><h3>Network overview</h3><p>Your fleet. One connected operation.</p></div><span class="pill">SCHEMATIC NETWORK</span></div>${network()}<div class="networkFoot"><span><i class="liveDot"></i> Sierra Executive charter network</span><span>Manual flight status · known airport positions</span></div></section><section class="sx-air-card activity"><div class="sx-air-head"><h3>Operations pulse</h3>${icon('Dispatch',17)}</div><div class="sx-air-inner"><div class="sx-air-pulse"><span class="liveDot"></span>${live()?issues.length?'1 flight needs attention':'Active flight checks passed':'Ready for your next flight'}</div>${live()?`<div class="sx-air-event">${esc(flight())} · ${esc(assignment().origin)} → ${esc(assignment().dest||assignment().destination)}<small>${esc(statuses[phase()]||phase())} · ${esc(tail())}</small></div>`:'<div class="sx-air-event">Your charter workspace is ready<small>Accept a charter to begin dispatch</small></div>'}${events.map(e=>`<div class="sx-air-event">${esc(e.type)} · ${esc(e.tail)}<small>${esc(e.note)}</small></div>`).join('')}<button class="textBtn" data-action="dispatch" style="margin-top:18px">Open dispatch queue →</button></div></section></div>`+table();
}
function scheduleHTML(){return title('Schedule','Manage your charters with connected, saved operations.')+`<div class="flightTabs"><button class="selected" data-action="flights">Flight schedule</button><button data-action="market">Charter Market</button><button data-action="trip">Multi-leg trips</button></div>`+table()}
function settingsHTML(){return title('Settings','Manage your company preferences and connections.')+`<section class="sx-air-card settings"><div class="sx-air-head"><h3>Company preferences</h3></div><div class="sx-air-inner"><div class="sx-air-data">${datum('Operator','Sierra Executive')}${datum('Simulation','MSFS 2024')}${datum('Connection',$('cloudStatus')?.textContent||'Local mode')}${datum('Fleet',Object.keys(data().fleet||{}).length+' aircraft')}</div><div class="buttons"><button class="btn" data-action="signin">Account & cloud sign in</button><button class="btn secondary" data-action="backup">Export & restore backup</button><button class="btn secondary" data-action="atc">ATC</button></div><div class="sectionLabel">OPERATIONS TOOLS</div><div class="buttons"><button class="btn secondary" data-action="fuel">Fuel & load</button><button class="btn secondary" data-action="weather">Weather</button><button class="btn secondary" data-action="maintenance">Maintenance</button><button class="btn secondary" data-action="duty">Duty log</button><button class="btn secondary" data-action="log">Flight log</button><button class="btn secondary" data-action="invoice">Invoices</button><button class="btn secondary" data-action="planning">Planning details</button></div></div></section>`}
function field(label,id,type='text',value=input(id)){return `<label>${esc(label)}<input data-field="${esc(id)}" type="${type}" value="${esc(value)}"${type==='number'?' min="0" step="any"':''}></label>`}
function formNotice(){return message?`<div class="notice" role="status">${esc(message)}</div>`:''}
function crewHTML(){
 const r=sim(),crew=r.crew||[],fleet=Object.values(data().fleet||{});
 return title('Crew','Assign qualified crews and track duty and rest.')+formNotice()+`<div class="notice">Simulation policy: 12-hour duty cap, 10-hour rest, matching aircraft qualification.</div><div class="sx-air-cards">${crew.map(c=>`<section class="sx-air-card sx-air-inner"><div class="cardTitle"><span class="avatar">${esc(c.name.slice(0,2).toUpperCase())}</span><span class="pill">${esc(String(c.types))} QUALIFIED</span></div><h3>${esc(c.name)}</h3><p>Crew member · ${esc(fleet.find(a=>r.assignments?.[a.tail]===c.id)?.tail||'Unassigned')}</p><div class="sx-air-data">${datum('Logged duty',Number(c.dutyHours||0).toFixed(1)+' / 12 h')}${datum('Next available',Date.parse(c.restUntil)>Date.now()?new Date(c.restUntil).toISOString().slice(0,16)+'Z':'Available')}</div><button class="btn secondary" data-rest="${esc(c.id)}">Begin 10-hour rest</button></section>`).join('')||'<div class="sx-air-card sx-air-empty">No crew saved yet. Add a crew member below.</div>'}</div><div class="sx-air-grid" style="margin-top:24px"><section class="sx-air-card"><div class="sx-air-head"><h3>Add crew member</h3></div><form id="sxModernCrewAdd" class="sx-air-inner"><div class="formGrid"><label>Crew name<input name="name" required></label><label>Aircraft qualifications<input name="types" placeholder="C750, C700, H25B" required></label></div><button class="btn">Save crew</button></form></section><section class="sx-air-card"><div class="sx-air-head"><h3>Aircraft assignment</h3></div><form id="sxModernCrewAssign" class="sx-air-inner"><div class="formGrid"><label>Aircraft<select name="tail">${fleet.map(a=>`<option value="${esc(a.tail)}">${esc(a.tail)} · ${esc(a.model)}</option>`).join('')}</select></label><label>Crew<select name="crew"><option value="">Unassigned</option>${crew.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label></div><button class="btn"${crew.length?'':' disabled'}>Save assignment</button><p>Qualification, rest, duty, and conflicting aircraft assignments are checked before saving.</p></form></section></div>`;
}
function passengersHTML(){
 const a=assignment();if(!live())return title('Passengers','Passenger and load manifest for your active charter.')+'<div class="sx-air-card sx-air-empty">Accept or activate a charter to manage its passengers.</div>';
 return title('Passengers','Passenger preferences and load manifest for your active charter.')+formNotice()+`<div class="detailGrid"><section class="sx-air-card"><div class="sx-air-head"><div><h3>${esc(flight())}</h3><p>${esc(a.client)} · ${esc(a.origin)} → ${esc(a.dest||a.destination)}</p></div>${badge(statuses[phase()]||phase())}</div><form class="sx-air-inner" data-save="passengers"><div class="sectionLabel">PASSENGER & LOAD MANIFEST</div><div class="formGrid">${field('Passengers','paxCount','number')}${field('Total passenger weight (lb)','paxWeight','number')}${field('Baggage / cargo (lb)','bags','number')}</div><label>Passenger names, preferences, and requests<textarea data-field="manifestNotes">${esc(input('manifestNotes'))}</textarea></label><button class="btn"${['departed','landed','parked'].includes(phase())?' disabled':''}>Save manifest</button></form></section><section class="sx-air-card"><div class="sx-air-head"><h3>Passenger roster</h3></div><div class="sx-air-inner">${(a.manifest||[]).map(p=>`<div class="sx-air-event"><b>${esc(p.name)}</b><small>${Number(p.weight)||0} lb · ${esc(p.role||'Passenger')}</small></div>`).join('')||'<p>Aggregate passenger load. Add passenger names and requests to the manifest notes.</p>'}<div class="buttons"><button class="btn secondary" data-action="fuel">Fuel & load</button><button class="btn secondary" data-action="clients">VIP clients</button></div></div></section></div>`;
}
function fboHTML(){
 return title('FBOs','Coordinate handling, fuel, and passenger services.')+formNotice()+`<div class="sx-air-grid"><section class="sx-air-card"><div class="sx-air-head"><h3>Ground handling · ${esc(assignment()?.origin||'No active charter')}</h3>${badge(input('fboRequestStatus')||'Not requested')}</div><form class="sx-air-inner" data-save="fbo"><div class="formGrid">${field('FBO / handler','fboName')}${field('Fuel order (lb)','fboFuelOrder','number')}${field('Fuel price ($ / U.S. gal)','fboFuelPrice','number')}${field('Ramp / handling fee ($)','fboHandlingFee','number')}${field('Catering ($)','fboCateringCost','number')}${field('Ground transport ($)','fboTransportCost','number')}</div><label>Service status<select data-field="fboRequestStatus">${['Not Requested','Requested','Confirmed','Complete'].map(v=>`<option${v===input('fboRequestStatus')?' selected':''}>${v}</option>`).join('')}</select></label><label>Handling notes<textarea data-field="fboNotes">${esc(input('fboNotes'))}</textarea></label><button class="btn"${live()?'':' disabled'}>Save handling request</button><button type="button" class="btn secondary" data-action="pricing">Refresh departure pricing</button></form></section><section class="sx-air-card"><div class="sx-air-head"><h3>Requested services</h3></div><div class="sx-air-inner" id="sxModernServices">${[['svcFuel','Fuel'],['svcGPU','GPU'],['svcLav','Lav service'],['svcWater','Potable water'],['svcCatering','Catering'],['svcBaggage','Baggage handling'],['svcTransport','Passenger transport'],['svcParking','Parking / hangar'],['svcDeice','Deicing']].map(([id,name])=>`<label class="sx-service-check"><input type="checkbox" data-service="${id}"${$(id)?.checked?' checked':''}>${name}</label>`).join('')}<p>Service selections save with your handling request.</p><div class="buttons"><button class="btn secondary" data-action="locator">FBO directory & airport maps</button><button class="btn secondary" data-action="weather">Weather</button></div></div></section></div>`;
}
function financeHTML(){
 const s=data(),logs=s.log||[],sum=key=>logs.reduce((n,l)=>n+(Number(l[key])||0),0),expenses=sum('operatingCost')+sum('airportFbo')+sum('cateringGround')+sum('otherExpense');
 const rev=Number(input('revenue')||0),fees=Number(input('fees')||0),cat=Number(input('catering')||0),other=Number(input('otherExpense')||0),op=Number(input('hourlyCost')||4200)*Number(input('billableHours')||0);
 return title('Finance','Charter revenue, operating expenses, and realized profitability.')+formNotice()+`<div class="sx-air-metrics">${metric('CHARTER REVENUE',money(sum('revenue')),'Completed flights')}${metric('OPERATING EXPENSES',money(expenses),'Operations + airport + ground')}${metric('REALIZED NET PROFIT',money(sum('profit')),'Completed flight ledger')}${metric('PROJECTED FLIGHT PROFIT',money(live()?rev-op-fees-cat-other:0),live()?flight():'No active charter')}</div><section class="sx-air-card"><div class="sx-air-head"><h3>Flight economics</h3><span class="pill">SIMULATED · USD</span></div><div class="sx-air-table-wrap"><table class="sx-air-table"><thead><tr><th>FLIGHT</th><th>REVENUE</th><th>OPERATIONS</th><th>AIRPORT / FBO</th><th>GROUND / OTHER</th><th>NET PROFIT</th></tr></thead><tbody>${[...(live()?[{flight:flight(),revenue:rev,operatingCost:op,airportFbo:fees,cateringGround:cat,otherExpense:other,profit:rev-op-fees-cat-other,projected:true}]:[]),...logs.slice().reverse()].map(l=>`<tr><td><b>${esc(l.flight)}</b><small>${l.projected?'Projected':'Posted'}</small></td><td>${money(l.revenue)}</td><td>${money(l.operatingCost)}</td><td>${money(l.airportFbo)}</td><td>${money(Number(l.cateringGround||0)+Number(l.otherExpense||0))}</td><td class="positive">${money(l.profit)}</td></tr>`).join('')}</tbody></table>${!logs.length&&!live()?'<div class="sx-air-empty">Completed charter finances will appear here.</div>':''}</div></section>${live()?`<section class="sx-air-card" style="margin-top:24px"><div class="sx-air-head"><h3>Current charter expenses</h3></div><form class="sx-air-inner" data-save="finance"><div class="formGrid">${field('Charter revenue ($)','revenue','number')}${field('Operating cost ($ / hour)','hourlyCost','number')}${field('Billable hours','billableHours','number')}${field('Airport / FBO fees ($)','fees','number')}${field('Catering / ground ($)','catering','number')}${field('Other expenses ($)','otherExpense','number')}</div><button class="btn">Save economics</button><button type="button" class="btn secondary" data-action="invoice">Open invoice</button></form></section>`:''}`;
}
function marketHTML(){
 const board=data().marketBoard||[];
 return title('Charter Market','Choose your next assignment for the selected aircraft.')+`<section class="sx-air-card"><div class="sx-air-head"><div><h3>Available charters</h3><p>${esc(data().selectedAircraft)} · ${esc(data().fleet?.[data().selectedAircraft]?.location)}</p></div><button class="btn secondary" data-action="refreshmarket">Refresh market</button></div><div class="sx-air-table-wrap"><table class="sx-air-table"><thead><tr><th>FLIGHT / ROUTE</th><th>CLIENT</th><th>DEPARTURE</th><th>PASSENGERS</th><th>CHARTER VALUE</th><th>STATUS</th><th></th></tr></thead><tbody>${board.map((a,i)=>`<tr><td><b>${esc(a.flight)}</b><small>${esc(a.origin)} → ${esc(a.dest||a.destination)}</small></td><td>${esc(a.client)}<small>${esc(a.charterType)}</small></td><td>${esc(a.departureDate||'—')}<small>${esc(a.departureTime||'—')} local</small></td><td>${Number(a.pax)||0} pax</td><td>${money(a.value||a.revenue)}</td><td>${badge(Date.parse(a.expiry)<Date.now()?'Expired':a.status||'Available')}</td><td><button class="btn" data-accept="${i}"${Date.parse(a.expiry)<Date.now()?' disabled':''}>Accept charter</button></td></tr>`).join('')}</tbody></table></div></section>`;
}

function clientsHTML(){return title('VIP Clients','Client preferences and repeat charter history.')+formNotice()+`<div class="sx-air-cards">${(sim().clients||[]).map(c=>`<section class="sx-air-card sx-air-inner"><h3>${esc(c.name)}</h3><p>${esc(c.preferences||'No preferences recorded')}</p><div class="sx-air-data">${datum('Completed trips',String(c.completed||0))}${datum('Charter spend',money(c.spend))}</div></section>`).join('')}</div><section class="sx-air-card" style="margin-top:24px"><div class="sx-air-head"><h3>Save client preferences</h3></div><form id="sxModernClient" class="sx-air-inner"><div class="formGrid"><label>Client / company<input name="name" required></label><label>Preferences and requests<input name="preferences"></label></div><button class="btn">Save client</button></form></section>`}
function maintenanceHTML(){const r=sim();return title('Maintenance','Inspection milestones, defects, and simulated releases.')+formNotice()+`<div class="sx-air-cards">${Object.values(data().fleet||{}).map(a=>{const m=r.maintenance?.[a.tail]||{lastInspectionHours:0,inspectionEvery:100,defects:[]},due=Number(m.lastInspectionHours)+Number(m.inspectionEvery||100);return `<section class="sx-air-card"><div class="sx-air-head"><h3>${esc(a.tail)}</h3>${badge(m.grounded||(m.defects||[]).some(d=>!d.cleared)||Number(a.hours||0)>=due?'Maintenance hold':'Available')}</div><div class="sx-air-inner"><div class="sx-air-data">${datum('Logged hours',Number(a.hours||0).toFixed(1))}${datum('Inspection due',due.toFixed(1)+' h')}</div>${(m.defects||[]).filter(d=>!d.cleared).map(d=>`<div class="notice">${esc(d.note)}</div>`).join('')}<form data-defect="${esc(a.tail)}"><label>Record a defect<input name="note" required></label><button class="btn secondary">Add defect & hold aircraft</button></form><div class="buttons"><button class="btn secondary" data-maint="inspect" data-tail="${esc(a.tail)}">Record inspection</button><button class="btn secondary" data-maint="release" data-tail="${esc(a.tail)}">Clear defects / release</button></div></div></section>`}).join('')}</div><p>Maintenance records and releases are simulation actions.</p>`}
function readiness(){
 const s=data(),a=assignment(),sb=s.simbrief,f=s.fleet?.[tail()],problems=[];
 if(!live())return ['Accept or activate a charter first'];
 if(!f)problems.push('Assigned aircraft is missing');
 if(!window.sxRealismSuite?.canDispatch?.(tail()))problems.push('Aircraft is on a maintenance hold');
  if(!sb?.importedAt||sb.origin!==a.origin||sb.destination!==(a.dest||a.destination))problems.push('Import a matching SimBrief route');
 if(!sb?.aircraft||String(sb.aircraft).toUpperCase()!==String(f?.model||'').toUpperCase())problems.push('SimBrief aircraft type does not match');
 if(sb?.registration&&sb.registration!==tail())problems.push('SimBrief registration does not match');
 if(!(Number(input('blockFuel'))>0)||!input('route'))problems.push('Planned route and block fuel are required');
 if(input('origin')!==a.origin||input('destination')!==(a.dest||a.destination))problems.push('Planning fields differ from the accepted charter');
 return [...new Set(problems)];
}
function fingerprint(){const s=data(),a=assignment(),sb=s.simbrief,r=sim(),f=s.fleet?.[tail()];return JSON.stringify({id:flight(),tail:tail(),origin:a?.origin,dest:a?.dest||a?.destination,pax:a?.pax,bags:a?.bags,imported:sb?.importedAt,route:input('route'),fuel:input('blockFuel'),model:f?.model})}
function released(){return data().airlineStyleReleases?.[flight()]?.fingerprint===fingerprint()}
function datum(label,value){return `<div><small>${label}</small><b>${esc(value||'—')}</b></div>`}
function dispatch(){
 if(!live())return title('Dispatch','Plan, release, and progress your active charter.')+'<div class="sx-air-card sx-air-empty">No active charter. Accept one from the Charter Market or activate a planned leg in Schedule.<div class="toolbar" style="margin-top:15px"><button class="btn" data-action="market">Open Charter Market</button></div></div>';
 const a=assignment(),s=data(),sb=s.simbrief,issues=readiness(),signed=released(),stages=['accepted','duty','fuel','boarded','ready','departed','landed','parked'],ix=stages.indexOf(phase());
 const next={accepted:['duty','Start duty'],duty:['fuel','Confirm fuel loaded'],fuel:['boarded','Passengers boarded'],boarded:['ready','Ready for departure'],ready:['departed','Depart flight'],departed:['landed','Record landing'],landed:['parked','Record block in'],parked:['close','Complete flight & post finances']}[phase()];
 return title('Dispatch','Connected planning, ground handling, and flight progression.')+`<div class="sx-air-grid"><section class="sx-air-card"><div class="sx-air-head"><div><h3>${esc(flight())} ${badge(statuses[phase()]||phase())}</h3><p>${esc(a.client||input('clientName'))}</p></div><span>✈</span></div><div class="sx-air-inner"><div class="sx-air-route"><b>${esc(a.origin)}</b><span>✈ →</span><b>${esc(a.dest||a.destination)}</b></div><div class="sx-air-data">${datum('Aircraft',tail())}${datum('Passengers',String(a.pax??input('paxCount')))}${datum('Baggage',(a.bags??input('bags'))+' lb')}${datum('Charter revenue',money(a.revenue??input('revenue')))}</div><div class="sx-air-kicker">FLIGHT PLANNING</div><div class="toolbar" style="margin:15px 0"><button class="btn" data-action="simbrief">Prepare in SimBrief ↗</button><button class="btn secondary" data-action="import"${busy?' disabled':''}>Import latest OFP</button><button class="btn secondary" data-action="planning">Planning details</button></div>${sb?.importedAt?`<div class="sx-air-pre">${esc(sb.route||'Route missing')}<div class="sx-air-data" style="margin:18px 0 0">${datum('Block fuel',(sb.blockFuel||'—')+' lb')}${datum('Cruise',sb.cruiseLevel)}${datum('Alternate',sb.alternate)}${datum('Aircraft',sb.aircraft)}</div></div>`:'<div class="sx-air-empty">Generate the matching charter in SimBrief, then import its OFP here.</div>'}<div class="sx-air-kicker" style="margin-top:23px">GROUND HANDLING & PASSENGERS</div><div class="toolbar" style="margin-top:15px"><button class="btn secondary" data-action="ground">FBO ground operations</button><button class="btn secondary" data-action="manifest">Passenger manifest</button><button class="btn secondary" data-action="fuel">Fuel & load</button><button class="btn secondary" data-action="weather">Weather</button></div></div></section><section class="sx-air-card"><div class="sx-air-head"><h3>Dispatch readiness</h3></div><div class="sx-air-inner">${issues.length?issues.map(x=>`<div class="sx-air-check warn">○ ${esc(x)}</div>`).join(''):'<div class="sx-air-check">✓ Aircraft and matching OFP checks passed</div>'}<div class="sx-air-check ${signed?'':'warn'}">${signed?'✓ Dispatch release signed':'○ Dispatch release pending'}</div><button class="btn" style="width:100%" data-action="release"${issues.length||signed||busy?' disabled':''}>${signed?'Release signed':'Sign dispatch release'}</button><div class="toolbar" style="margin-top:12px"><button class="btn secondary" data-action="maintenance">Maintenance</button></div><div class="sx-air-kicker" style="margin-top:24px">FLIGHT PROGRESSION</div><div class="sx-air-steps">${['accepted','duty','fuel','boarded','ready','departed','landed','parked'].map((x,i)=>`<div class="${i<=ix?'current':''}">${i<ix?'✓':i===ix?'●':'○'} ${esc(statuses[x]==='Scheduled'?'Accepted':x==='fuel'?'Fuel loaded':x==='duty'?'On duty':statuses[x])}</div>`).join('')}</div>${next?`<button class="btn" style="width:100%" data-next="${next[0]}"${busy||(!signed&&ix<5)||issues.length&&ix<5?' disabled':''}>${next[1]} →</button>`:''}<div class="toolbar" style="margin-top:16px"><button class="btn secondary" data-action="cancelTrip"${busy?" disabled":""}>Cancel Active Trip</button></div><p class="small" style="margin-top:16px">Update milestones as you fly in MSFS. Completion uses your existing flight log, aircraft location, duty, invoice, and finance workflow.</p>${message?`<div class="sx-air-error" role="status">${esc(message)}</div>`:''}</div></section></div>`;
}
function fleetHTML(){return title('Fleet','Your saved aircraft and their current availability.')+`<div class="sx-air-cards">${Object.values(data().fleet||{}).map(a=>`<section class="sx-air-card"><div class="sx-air-head" style="background:#e9f5f7"><h3>${icon('Fleet',30)} ${esc(a.model)}</h3>${badge(a.status||'Available')}</div><div class="sx-air-inner"><h3>${esc(a.tail)}</h3><p class="small">${esc(a.type)}</p><div class="sx-air-data">${datum('Location',a.location)}${datum('Home base',a.home)}${datum('Flight hours',Number(a.hours||0).toFixed(1))}${datum('Assignment',live()&&tail()===a.tail?flight():'Available for dispatch')}</div><button class="btn secondary" data-aircraft="${esc(a.tail)}">Select aircraft</button><button class="btn secondary" data-action="maintenance">Maintenance records</button></div></section>`).join('')}</div>`}
function open(id){
 view=id;message='';lastMarkup='';document.body.classList.remove('sx-ops-mode');document.body.classList.add('sx-airline-panel');
 document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('nav.tabs .tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
 $(id)?.classList.add('active');$('pageTitle').textContent={airlineOverview:'Operations',airlineDispatch:'Dispatch',airlineFleet:'Fleet',airlineCrew:'Crew',airlineSchedule:'Schedule',airlineSettings:'Settings',airlinePassengers:'Passengers',airlineFinance:'Finance',airlineFBO:'FBOs',airlineMarket:'Charter Market',airlineClients:'VIP Clients',airlineMaintenance:'Maintenance'}[id]||'Operations';
 if($('sxBreadcrumb'))$('sxBreadcrumb').textContent=$('pageTitle').textContent;
 render();
}
function native(id){const modern={market:'airlineMarket',manifest:'airlinePassengers',finance:'airlineFinance',fbo:'airlineFBO'};if(modern[id])return open(modern[id]);document.body.classList.remove('sx-airline-panel','sx-ops-mode');document.querySelector(`nav.tabs .tab[data-tab="${id}"]`)?.click()}
function ground(ws='ground'){native('opsCenter');window.sxOpsWorkspaces?.open?.(ws)}
function prepare(){
 const a=assignment(),f=data().fleet?.[tail()];if(!live()||!f)return;
 const d=new Date((a.departureDate||a.date||input('depDate'))+'T'+(a.departureTime||a.depTime||input('depTime')||'12:00'));
 const replay=String(a.id||a.flight||'').startsWith('N102LJ-') && a.route;
 const params=new URLSearchParams({airline:replay?'':'SXR',fltnum:replay?'':flight().replace(/^SXR/i,''),type:f.model||'',orig:a.origin,dest:a.dest||a.destination,reg:tail(),pax:String(a.pax??input('paxCount')),cargo:String(Number(a.bags??input('bags'))/1000),units:'LBS'});
 if(replay){params.set('route',a.route);params.set('fl',String(Math.round(Number(a.cruiseAltitudeFt||41000)/100)));params.set('deph','13');params.set('depm','55');params.set('date','18OCT26');}
 if(!replay&&!Number.isNaN(d.getTime())){params.set('date',d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit',timeZone:'UTC'}).replaceAll(' ','').toUpperCase());params.set('deph',String(d.getUTCHours()));params.set('depm',String(d.getUTCMinutes()))}
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
   if(action==='cancelTrip'){
     if(busy||!live())return;
     const s=data(),a=assignment(),fid=flight(),aircraft=tail();
     if(!confirm('Cancel '+fid+'? This ends the active assignment without marking it flown, billing it, or deleting completed flights.'))return;
     busy=true;
     try{
       if(typeof resetFlight!=='function')throw Error('Cancellation workflow unavailable.');
       // Existing reset routine retains location and fleet repair behavior.
       resetFlight(true);
       if(s.activeAssignment)throw Error('Cancellation was not confirmed; the assignment remains active.');
       s.cancelledTrips=Array.isArray(s.cancelledTrips)?s.cancelledTrips:[];
       if(!s.cancelledTrips.some(x=>x.flight===fid))s.cancelledTrips.unshift({flight:fid,aircraft,origin:a?.origin,destination:a?.dest||a?.destination,client:a?.client,status:'Cancelled',cancelledAt:new Date().toISOString()});
       if(Array.isArray(s.tripDossier?.legs))s.tripDossier.legs.forEach(x=>{if(x.id===fid||x.flight===fid)x.status='cancelled'});
       if(s.airlineStyleReleases)delete s.airlineStyleReleases[fid];
       if(s.flightPackage?.id===fid)s.flightPackage.status='CANCELLED';
       if(typeof saveState==='function')saveState();
       message=fid+' cancelled. Aircraft available for dispatch.';
     }catch(e){message=e.message||String(e)}finally{busy=false;open('airlineDispatch');}
     return;
   }
   if(action==='dispatch')return open('airlineDispatch');
   if(action==='market')return native('market');
   if(action==='trip')return typeof window.sxOpenTripDossier==='function'?window.sxOpenTripDossier():native('tripDossier');
   if(action==='flights')return open('airlineSchedule');
   if(action==='backup'||action==='duty'||action==='log'||action==='invoice')return native(action);
   if(action==='signin')return typeof openAuth==='function'&&openAuth();
   if(action==='atc')return parent.sxShowATC?.();
   if(action==='planning')return native('dispatch');
   if(action==='crew')return open('airlineCrew');
   if(action==='ground')return ground();
   if(action==='weather')return ground('weather');
   if(action==='manifest'||action==='fuel')return native(action);
   if(action==='maintenance')return open('airlineMaintenance');
   if(action==='simbrief')return prepare();
   if(action==='clients')return open('airlineClients');
   if(action==='locator')return ground('airports');
   if(action==='pricing'){await refreshLiveFboPricing(true);return render(true)}
   if(action==='refreshmarket'){seedMarket(false);return render(true)}
   if(action==='release'){if(!readiness().length){const s=data();s.airlineStyleReleases=s.airlineStyleReleases||{};s.airlineStyleReleases[flight()]={fingerprint:fingerprint(),signedAt:new Date().toISOString()};saveState();render(true)}return}
   if(action==='import'){busy=true;render(true);try{await importSimBrief()}finally{busy=false;render(true)}}
 });
 root.querySelectorAll('[data-save]').forEach(form=>form.onsubmit=e=>{
   e.preventDefault();try{
     if(!live())throw Error('Activate a charter before saving.');
     if(form.dataset.save==='passengers'&&['departed','landed','parked'].includes(phase()))throw Error('Manifest is locked after departure.');
     const entries=[...form.querySelectorAll('[data-field]')].map(f=>[f.dataset.field,f.value,f.type]);
     for(const [id,value,type] of entries)if(type==='number'&&(!Number.isFinite(Number(value))||Number(value)<0))throw Error('Enter valid nonnegative numbers.');
     if(form.dataset.save==='passengers'&&!Number.isInteger(Number(entries.find(x=>x[0]==='paxCount')?.[1])))throw Error('Passenger count must be a whole number.');
     for(const [id,value] of entries)if($(id))$(id).value=value;
     if(form.dataset.save==='passengers'){
       if(['departed','landed','parked'].includes(phase()))throw Error('Manifest is locked after departure.');
       const a=assignment();a.pax=Number(input('paxCount'));a.bags=Number(input('bags'));a.paxWeight=Number(input('paxWeight'));calcFuelLoad();
     }
     if(form.dataset.save==='fbo'){document.querySelectorAll('#sxModernServices [data-service]').forEach(c=>{if($(c.dataset.service))$(c.dataset.service).checked=c.checked});calcFboCosts();syncFboSummary();}
     if(form.dataset.save==='finance'){assignment().revenue=Number(input('revenue'));calcFinance();}
     saveAll();message='Saved to your charter workspace.';render(true);
   }catch(err){message=err.message;render(true)}
 });
 root.querySelector('#sxModernCrewAdd')?.addEventListener('submit',e=>{e.preventDefault();try{const f=new FormData(e.target);sxRealismSuite.addCrew(f.get('name'),f.get('types'));message='Crew saved.';render(true)}catch(err){message=err.message;render(true)}});
 root.querySelector('#sxModernCrewAssign')?.addEventListener('submit',e=>{e.preventDefault();try{const f=new FormData(e.target);sxRealismSuite.assignCrew(f.get('tail'),f.get('crew'));message='Assignment saved.';render(true)}catch(err){message=err.message;render(true)}});
 root.querySelectorAll('[data-rest]').forEach(b=>b.onclick=()=>{try{sxRealismSuite.restCrew(b.dataset.rest);message='10-hour rest started.';render(true)}catch(err){message=err.message;render(true)}});
 root.querySelectorAll('[data-accept]').forEach(b=>b.onclick=async()=>{try{await acceptMarket(Number(b.dataset.accept));if(assignment()?.flight===data().marketBoard?.[Number(b.dataset.accept)]?.flight||live())open('airlineDispatch');else render(true)}catch(err){message=err.message;render(true)}});
 root.querySelector('#sxModernClient')?.addEventListener('submit',e=>{e.preventDefault();try{const f=new FormData(e.target);sxRealismSuite.saveClient(f.get('name'),f.get('preferences'));message='Client saved.';render(true)}catch(err){message=err.message;render(true)}});
 root.querySelectorAll('[data-defect]').forEach(f=>f.onsubmit=e=>{e.preventDefault();try{sxRealismSuite.maintenance(f.dataset.defect,'defect',new FormData(f).get('note'));message='Defect recorded; aircraft held.';render(true)}catch(err){message=err.message;render(true)}});
 root.querySelectorAll('[data-maint]').forEach(b=>b.onclick=()=>{try{sxRealismSuite.maintenance(b.dataset.tail,b.dataset.maint);message='Simulated maintenance record saved.';render(true)}catch(err){message=err.message;render(true)}});
 root.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>progress(b.dataset.next));
 const list=rows().filter(r=>filter==='All flights'||r.status===filter);
 root.querySelectorAll('[data-row]').forEach(b=>b.onclick=()=>{const r=list[Number(b.dataset.row)];if(r.active)open('airlineDispatch');else (r.completed?native('log'):(typeof window.sxOpenTripDossier==='function'?window.sxOpenTripDossier():native('tripDossier')))});
 root.querySelectorAll('[data-aircraft]').forEach(b=>b.onclick=()=>{selectAircraft(b.dataset.aircraft);render(true)});
}
function render(force=false){
 if(!$(view)?.classList.contains('active'))return;
 if(document.activeElement?.matches('input,textarea,select')&&!force)return;
 const markup=view==='airlineOverview'?overview():view==='airlineDispatch'?dispatch():view==='airlineSchedule'?scheduleHTML():view==='airlineSettings'?settingsHTML():view==='airlineCrew'?crewHTML():view==='airlinePassengers'?passengersHTML():view==='airlineFinance'?financeHTML():view==='airlineFBO'?fboHTML():view==='airlineMarket'?marketHTML():view==='airlineClients'?clientsHTML():view==='airlineMaintenance'?maintenanceHTML():fleetHTML();
 if(markup!==lastMarkup||force){lastMarkup=markup;$(view).innerHTML=markup;bind($(view))}
}
function install(){
 $('detail-doctor-theme')?.remove();
 const link=document.createElement('link');link.rel='stylesheet';link.href='/airline-style.css?v=20261013-pages3';document.head.appendChild(link);
 const nav=document.querySelector('nav.tabs'),main=document.querySelector('main.content'),side=document.querySelector('.sidebar');if(!nav||!main||!side)return;
 const content=document.createElement('div');content.className='sx-content';while(main.firstChild)content.appendChild(main.firstChild);main.appendChild(content);
 const brand=document.createElement('div');brand.className='brand';brand.innerHTML=icon('Globe',35)+'<div>SIERRA<span>EXECUTIVE OPERATIONS</span></div>';side.prepend(brand);
 const workspace=document.createElement('div');workspace.className='workspace';workspace.innerHTML='<span class="avatar">SE</span><div>Charter control center<small>MSFS 2024 · Simulation</small></div>';nav.before(workspace);
 const label=document.createElement('div');label.className='navlabel';label.textContent='WORKSPACE';nav.before(label);
 const newTabs=[['airlineOverview','Operations'],['airlineSchedule','Schedule'],['airlineDispatch','Dispatch'],['airlineFleet','Fleet'],['airlinePassengers','Passengers'],['airlineFBO','FBOs'],['airlineFinance','Finance'],['airlineSettings','Settings']];
 nav.querySelectorAll('[data-tab]').forEach(b=>b.hidden=true);
 newTabs.slice().reverse().forEach(([id,name])=>{
   let b=nav.querySelector(`[data-tab="${id}"]`);
   if(!b){b=document.createElement('button');b.className='tab';b.dataset.tab=id;const p=document.createElement('section');p.id=id;p.className='panel';content.appendChild(p);b.onclick=()=>open(id)}
   b.hidden=false;b.title=name;b.setAttribute('aria-label',name);b.innerHTML=icon(name)+name;nav.prepend(b);
 });
 ['airlineMarket','airlineClients','airlineMaintenance'].forEach(id=>{const p=document.createElement('section');p.id=id;p.className='panel';content.appendChild(p)});
 const foot=document.createElement('div');foot.className='sidebarFoot';foot.innerHTML='<span class="liveDot"></span> Charter workspace<small>Independent simulation<br/>Sierra Executive</small>';side.appendChild(foot);
 const head=document.createElement('header');head.className='commercialHeader';head.innerHTML='<div class="breadcrumb">Charter workspace <span>›</span> <b id="sxBreadcrumb">Operations</b></div><div class="headRight"><span class="clock" id="sxAirClock">UTC CLOCK</span><button class="iconBtn" id="sxRefresh" aria-label="Refresh operations">↻</button><span class="avatar">DD</span></div>';main.prepend(head);
 $('sxRefresh').onclick=()=>render(true);
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;if(!b.dataset.tab.startsWith('airline')){view=b.dataset.tab;lastMarkup='';document.body.classList.remove('sx-airline-panel');if(b.dataset.tab!=='opsCenter')document.body.classList.remove('sx-ops-mode')}if($('sxBreadcrumb'))$('sxBreadcrumb').textContent=b.textContent});
 const tick=()=>{$('sxAirClock').textContent=new Date().toISOString().slice(11,19)+' Z'};tick();setInterval(tick,1000);
 open('airlineOverview');
 setInterval(()=>{if(document.visibilityState!=='hidden')render()},2000);
}
window.sxAirlineStyle={open,render,readiness,rows,prepare};
install();
})();
