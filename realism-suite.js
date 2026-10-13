(()=>{
'use strict';
if(window.__sxRealismSuite)return;window.__sxRealismSuite=true;
const KEY='sx_realism_suite_v1',TAILS=['N88SX','N750SX','N800SX'];
const defaults=()=>({crew:[],assignments:{},maintenance:{},clients:[],events:[],finance:{},reputation:75,processed:[],history:[],rates:{flightHour:3900,fuelHour:900,crewHour:300,maintenanceHour:550,handlingLeg:350,repositionHour:2400},dispatch:{}});
const load=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');return {...defaults(),...d}}catch{return defaults()}};
let data=load();
const persist=()=>localStorage.setItem(KEY,JSON.stringify(data));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=n=>'$'+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:0});
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const fleet=()=>typeof state!=='undefined'&&state.fleet||{};
const log=()=>typeof state!=='undefined'&&Array.isArray(state.log)?state.log:[];
const active=()=>typeof state!=='undefined'?state.activeAssignment:null;
const maint=tail=>data.maintenance[tail]||(data.maintenance[tail]={inspectionEvery:100,lastInspectionHours:0,defects:[],grounded:false});
const assigned=tail=>data.assignments[tail]||'';
const crewById=id=>data.crew.find(x=>x.id===id);
const due=tail=>{const m=maint(tail),h=n(fleet()[tail]?.hours);return m.grounded||m.defects.some(d=>!d.cleared)||h>=n(m.lastInspectionHours)+Math.max(1,n(m.inspectionEvery,100))};
const unavailable=tail=>due(tail)||!!(assigned(tail)&&crewById(assigned(tail))?.restUntil&&Date.parse(crewById(assigned(tail)).restUntil)>Date.now());
function syncLogs(){
 const seen=new Set(data.processed);let changed=false;
 for(const entry of log()){
  const id=String(entry.flight||'');if(!id||seen.has(id)||entry.status!=='Completed')continue;
  seen.add(id);data.processed.push(id);changed=true;
  const rev=n(entry.customerTotal,n(entry.revenue)),cost=n(entry.operatingCost)+n(entry.airportFbo)+n(entry.cateringGround)+n(entry.otherExpense);
  data.history.push({flight:id,tail:entry.aircraft,route:entry.route,client:entry.client,rev,cost,profit:rev-cost,date:entry.date});
  const client=data.clients.find(c=>c.name.toLowerCase()===String(entry.client||'').toLowerCase());
  if(client){client.completed=(client.completed||0)+1;client.spend=(client.spend||0)+rev}
  data.reputation=Math.min(100,data.reputation+1);
  const crew=crewById(assigned(entry.aircraft));if(crew){
   const hrs=n(entry.dutyHours,n(entry.blockHours));crew.dutyHours=n(crew.dutyHours)+hrs;
   const end=Date.parse(entry.blockIn)||Date.now();
   crew.restUntil=new Date(end+Math.max(10,hrs>10?12:10)*3600000).toISOString();
  }
 }
 if(changed){data.history=data.history.slice(-300);data.processed=data.processed.slice(-500);persist()}
}
function show(){
 syncLogs();
 let root=document.getElementById('sxRealismSuite');
 if(!root){root=document.createElement('section');root.id='sxRealismSuite';root.style.cssText='margin:18px 0;padding:16px;border:1px solid #27cbd6;border-radius:12px;background:#0d1b20;color:#f4f7f8';(document.getElementById('fleetBar')?.parentElement||document.body).appendChild(root)}
 const act=active(),fl=fleet();
 const board=TAILS.map(t=>{
  const a=fl[t]||{},m=maint(t),c=crewById(assigned(t));
  const status=due(t)?'MAINTENANCE HOLD':act?.aircraft===t?'ACTIVE CHARTER':a.status||'Available';
  const next=act?.aircraft===t?act.dest:(a.location||'KMEV');
  return '<tr><td>'+esc(t)+'</td><td>'+esc(a.location||'KMEV')+'</td><td>'+esc(c?.name||'Unassigned')+'</td><td>'+esc(act?.aircraft===t?act.flight:'—')+'</td><td>'+esc(status)+'</td><td>'+esc(next)+'</td></tr>';
 }).join('');
 const opts=TAILS.map(t=>'<option>'+t+'</option>').join('');
 const crewOptions='<option value="">Unassigned</option>'+data.crew.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');
 const mRows=TAILS.map(t=>{const m=maint(t),h=n(fl[t]?.hours),next=n(m.lastInspectionHours)+n(m.inspectionEvery,100);return '<p><b>'+t+'</b> • '+h.toFixed(1)+'h • next inspection '+next.toFixed(1)+'h • '+(due(t)?'HOLD':'OK')+' • '+m.defects.filter(x=>!x.cleared).length+' open defects <button data-tail="'+t+'" data-act="inspect">Record inspection</button> <button data-tail="'+t+'" data-act="defect">Add defect</button> <button data-tail="'+t+'" data-act="clear">Clear defects / release</button></p>'}).join('');
 const eventRows=data.events.slice(-8).reverse().map(e=>'<p>'+esc(e.time.slice(0,16))+' • '+esc(e.tail)+' • '+esc(e.type)+' • '+esc(e.note)+'</p>').join('');
 const completed=data.history.slice(-8).reverse().map(x=>'<p>'+esc(x.flight)+' • '+esc(x.route)+' • '+$(x.profit)+' profit</p>').join('');
 root.innerHTML='<h3 style="color:#35e2ee">SIERRA EXECUTIVE • LIVE OPERATIONS CENTER</h3><p>Local simulation data • '+new Date().toLocaleString()+' • Reputation '+data.reputation+'/100</p><div style="overflow:auto"><table style="width:100%;text-align:left"><thead><tr><th>Aircraft</th><th>Location</th><th>Crew</th><th>Assignment</th><th>Status</th><th>Next location</th></tr></thead><tbody>'+board+'</tbody></table></div>'+
 '<details open><summary><b>Dispatch release / SimBrief</b></summary><p>Active: '+esc(act?act.flight+' '+act.origin+' → '+act.dest:'No active charter')+'</p><button id="sxRelease">Prepare release</button> <button id="sxSimBrief">Open SimBrief dispatch</button> <button id="sxImportOFP">Import OFP text</button><p id="sxReleaseResult"></p><small>SimBrief is external; OFP text is stored as an unverified reference, not auto-approved fuel or weather data.</small></details>'+
 '<details><summary><b>Crew scheduling</b></summary><p><input id="sxCrewName" placeholder="Pilot name"> <input id="sxCrewType" placeholder="Qualified models: C750,C700,H25B"> <button id="sxAddCrew">Add crew</button></p><select id="sxCrewTail">'+opts+'</select> <select id="sxCrewPerson">'+crewOptions+'</select> <button id="sxAssignCrew">Assign crew</button><div>'+data.crew.map(c=>'<p>'+esc(c.name)+' • '+esc(c.types)+' • duty '+n(c.dutyHours).toFixed(1)+'h • rest until '+esc(c.restUntil||'available')+'</p>').join('')+'</div></details>'+
 '<details><summary><b>Maintenance & airworthiness simulation</b></summary>'+mRows+'<small>Maintenance release is a simulated operator action; not an actual airworthiness determination.</small></details>'+
 '<details><summary><b>Charter quotes & expenses</b></summary><p>Billable flight hours <input id="sxQuoteHours" type="number" min=".1" step=".1" value="2" style="width:70px"> Reposition hours <input id="sxQuoteRepo" type="number" min="0" step=".1" value="0" style="width:70px"> Legs <input id="sxQuoteLegs" type="number" min="1" value="1" style="width:60px"> <button id="sxQuote">Calculate quote</button></p><p id="sxQuoteResult"></p></details>'+
 '<details><summary><b>VIP customer management</b></summary><p><input id="sxClientName" placeholder="Client / company"> <input id="sxClientPrefs" placeholder="Preferences and requests"> <button id="sxAddClient">Save client</button></p>'+data.clients.map(c=>'<p>'+esc(c.name)+' • '+esc(c.preferences)+' • '+n(c.completed)+' trips • '+$(c.spend)+' spend</p>').join('')+'</details>'+
 '<details><summary><b>Operational events</b></summary><p><select id="sxEventTail">'+opts+'</select> <button id="sxEvent">Generate simulation event</button></p>'+eventRows+'<small>Events are fictional. Mechanical events can ground an aircraft; weather events are not live METAR/TAF information.</small></details>'+
 '<details><summary><b>Career & completed flights</b></summary><p>Completed flights processed: '+data.processed.length+' • Simulated reputation '+data.reputation+'/100</p>'+completed+'<button id="sxRefresh">Sync completed flight log</button></details>';
 root.querySelector('#sxAddCrew').onclick=()=>{const name=root.querySelector('#sxCrewName').value.trim(),types=root.querySelector('#sxCrewType').value.toUpperCase().split(/[ ,;]+/).filter(Boolean);if(!name||!types.length){alert('Enter pilot name and qualified models.');return}data.crew.push({id:'crew-'+Date.now(),name,types,dutyHours:0,restUntil:''});persist();show()};
 root.querySelector('#sxAssignCrew').onclick=()=>{const tail=root.querySelector('#sxCrewTail').value,id=root.querySelector('#sxCrewPerson').value,c=crewById(id),model=fl[tail]?.model;if(c&&!c.types.includes(model)){alert('Crew not qualified for '+model);return}if(c&&c.restUntil&&Date.parse(c.restUntil)>Date.now()){alert('Crew still in rest period');return}if(c&&Object.entries(data.assignments).some(([t,v])=>t!==tail&&v===id)){alert('Crew assigned to another aircraft');return}data.assignments[tail]=id;persist();show()};
 root.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{const t=b.dataset.tail,m=maint(t);if(b.dataset.act==='defect'){const note=prompt('Describe aircraft defect');if(!note)return;m.defects.push({note,cleared:false,date:new Date().toISOString()});m.grounded=true}else if(b.dataset.act==='inspect'){if(!confirm('Record a completed simulated inspection for '+t+'?'))return;m.lastInspectionHours=n(fl[t]?.hours)}else{if(!confirm('Confirm simulated defects resolved and release '+t+'?'))return;m.defects.forEach(x=>x.cleared=true);m.grounded=false}persist();show()});
 root.querySelector('#sxQuote').onclick=()=>{const h=Math.max(0,n(root.querySelector('#sxQuoteHours').value)),r=Math.max(0,n(root.querySelector('#sxQuoteRepo').value)),legs=Math.max(1,n(root.querySelector('#sxQuoteLegs').value)),p=data.rates;const rev=h*p.flightHour+r*p.repositionHour,cost=(h+r)*(p.fuelHour+p.crewHour+p.maintenanceHour)+legs*p.handlingLeg;root.querySelector('#sxQuoteResult').textContent='Quote '+$(rev)+' • estimated costs '+$(cost)+' • projected profit '+$(rev-cost)+' • margin '+(rev?Math.round((rev-cost)/rev*100):0)+'%. Excludes taxes, airport-specific fees and additional overnight expenses.'};
 root.querySelector('#sxAddClient').onclick=()=>{const name=root.querySelector('#sxClientName').value.trim(),preferences=root.querySelector('#sxClientPrefs').value.trim();if(!name)return;let c=data.clients.find(x=>x.name.toLowerCase()===name.toLowerCase());if(c)c.preferences=preferences;else data.clients.push({name,preferences,completed:0,spend:0});persist();show()};
 root.querySelector('#sxEvent').onclick=()=>{const t=root.querySelector('#sxEventTail').value,types=['ATC delay','Weather disruption','VIP schedule change','FBO handling delay','Mechanical defect','Diversion request'];const type=types[Math.floor(Math.random()*types.length)];const note=type==='Mechanical defect'?'Simulated defect: maintenance review required':'Scenario only; dispatcher must decide how to respond';data.events.push({tail:t,type,note,time:new Date().toISOString()});if(type==='Mechanical defect'){maint(t).grounded=true;maint(t).defects.push({note,cleared:false})}persist();show()};
 root.querySelector('#sxRefresh').onclick=show;
 root.querySelector('#sxRelease').onclick=()=>{const a=active();if(!a){alert('No active charter');return}const t=a.aircraft||state.activeAircraft,m=fl[t]?.model,c=crewById(assigned(t));const problems=[];if(due(t))problems.push('Maintenance hold');if(!c)problems.push('No crew assigned');else if(!c.types.includes(m))problems.push('Crew type qualification missing');else if(c.restUntil&&Date.parse(c.restUntil)>Date.now())problems.push('Crew rest incomplete');const result='Flight '+a.flight+' | '+t+' ('+m+') | '+a.origin+'-'+a.dest+' | PAX '+a.pax+' | Crew '+(c?.name||'NONE')+' | '+(problems.length?'BLOCKED: '+problems.join('; '):'Preliminary checklist ready; verify OFP, weather, NOTAMs, fuel, payload and runway performance before release');data.dispatch[a.flight]={summary:result,created:new Date().toISOString(),status:problems.length?'BLOCKED':'PRELIMINARY'};persist();root.querySelector('#sxReleaseResult').textContent=result};
 root.querySelector('#sxSimBrief').onclick=()=>{const a=active();if(!a){alert('Accept a charter first');return}const model=fl[a.aircraft]?.model||'';const url='https://dispatch.simbrief.com/options/custom?orig='+encodeURIComponent(a.origin)+'&dest='+encodeURIComponent(a.dest)+'&type='+encodeURIComponent(model);window.open(url,'_blank','noopener,noreferrer')};
 root.querySelector('#sxImportOFP').onclick=()=>{const a=active();if(!a){alert('No active charter');return}const raw=prompt('Paste SimBrief OFP reference or short extracted flight plan text (max 4000 characters):');if(!raw)return;data.dispatch[a.flight]={...(data.dispatch[a.flight]||{}),ofpText:raw.slice(0,4000),imported:new Date().toISOString(),verified:false};persist();root.querySelector('#sxReleaseResult').textContent='OFP reference saved for '+a.flight+' (unverified).'};
}
const originalAccept=typeof acceptMarket==='function'?acceptMarket:null;
if(originalAccept){acceptMarket=function(i){const offer=state.marketBoard?.[i],tail=state.selectedAircraft;if(offer&&due(tail)){alert(tail+' is on a maintenance hold. Resolve defects and inspections in Operations Center before accepting this flight.');return}const c=crewById(assigned(tail));if(c&&(c.restUntil&&Date.parse(c.restUntil)>Date.now()||!c.types.includes(fleet()[tail]?.model))){alert('Assigned crew is unavailable or unqualified.');return}return originalAccept.apply(this,arguments)}}
const originalClose=typeof closeFlight==='function'?closeFlight:null;
if(originalClose){closeFlight=function(...args){const before=log().length;const result=originalClose.apply(this,args);if(log().length!==before){syncLogs();show()}return result}}
setTimeout(show,1900);
window.sxRealismSuite={refresh:show,canDispatch:tail=>!unavailable(tail),data:()=>data,
 addCrew:(name,types)=>{name=String(name||'').trim();types=String(types||'').toUpperCase().split(/[ ,;]+/).filter(Boolean);if(!name||!types.length)throw Error('Enter a crew name and aircraft qualifications.');data.crew.push({id:'crew-'+Date.now(),name,types,dutyHours:0,restUntil:''});persist();},
 assignCrew:(tail,id)=>{if(!fleet()[tail])throw Error('Select an existing aircraft.');const c=crewById(id);if(id&&!c)throw Error('Select an existing crew.');if(c&&!c.types.includes(fleet()[tail].model))throw Error('Crew aircraft qualification does not match.');if(c&&Date.parse(c.restUntil)>Date.now())throw Error('Crew rest is incomplete.');if(c&&n(c.dutyHours)>=12)throw Error('Crew duty limit reached.');if(c&&Object.entries(data.assignments).some(([t,v])=>t!==tail&&v===id))throw Error('Crew is assigned to another aircraft.');data.assignments[tail]=id;persist();},
 saveClient:(name,preferences)=>{name=String(name||'').trim();if(!name)throw Error('Enter a client name.');let c=data.clients.find(x=>x.name.toLowerCase()===name.toLowerCase());if(c)c.preferences=String(preferences||'');else data.clients.push({name,preferences:String(preferences||''),completed:0,spend:0});persist();},
 maintenance:(tail,action,note)=>{if(!fleet()[tail])throw Error('Aircraft not found.');const m=maint(tail);if(action==='defect'){note=String(note||'').trim();if(!note)throw Error('Describe the defect.');m.defects.push({note,cleared:false,date:new Date().toISOString()});m.grounded=true;}else if(action==='inspect')m.lastInspectionHours=n(fleet()[tail].hours);else if(action==='release'){m.defects.forEach(d=>d.cleared=true);m.grounded=false;}else throw Error('Unknown maintenance action.');persist();},
 restCrew:id=>{const c=crewById(id);if(!c)throw Error('Crew not found.');c.restUntil=new Date(Date.now()+10*3600000).toISOString();c.dutyHours=0;persist();}
};
})();
