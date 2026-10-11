(()=>{
'use strict';
if(window.sxTripPlannerLoaded)return;window.sxTripPlannerLoaded=true;
const KEY='sx_vip_trips_v2',MX=40;
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}};
const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dollars=n=>'$'+Math.round(n).toLocaleString('en-US');
const num=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
const aircraft=()=>typeof selectedAircraft==='function'?selectedAircraft():null;
const DEFAULT={hourly:3200,fuelPerHour:310,crewHourly:230,hotelNight:370,perDiemNight:190,parkingNight:90,handlingLeg:250,landingLeg:250,maintenanceHour:500,maintenanceCycle:250,inspectionInterval:100,crewMaxDuty:12,crewMinRest:10};
function normalize(t){t.settings={...DEFAULT,...(t.settings||{})};t.legs=(t.legs||[]).map(l=>({status:'Planned',flightHours:1.5,groundHours:1,passengers:t.pax||0,revenue:0,...l}));return t}
function calculate(t){
 const s=t.settings,legs=t.legs;
 const flight=legs.reduce((v,l)=>v+num(l.flightHours),0),ground=legs.reduce((v,l)=>v+num(l.groundHours),0);
 const revenue=legs.reduce((v,l)=>v+num(l.revenue),0);
 const costs={
 fuel:flight*s.fuelPerHour,crew:flight*s.crewHourly,
 hotel:t.nights*s.hotelNight,perDiem:t.nights*s.perDiemNight,
 parking:t.nights*s.parkingNight,handling:legs.length*s.handlingLeg,
 landing:legs.length*s.landingLeg,maintenance:flight*s.maintenanceHour+legs.length*s.maintenanceCycle
 };
 const total=Object.values(costs).reduce((a,b)=>a+b,0);
 return {flight,ground,revenue,costs,total,profit:revenue-total,margin:revenue>0?(revenue-total)/revenue*100:null};
}
function render(){
 let box=document.getElementById('sxVipPlanner');
 if(!box){box=document.createElement('section');box.id='sxVipPlanner';box.style.cssText='margin:16px 0;padding:16px;border:1px solid #2fe3f2;border-radius:12px;background:#101a1c;color:#fff';(document.getElementById('fleetBar')?.parentElement||document.body).appendChild(box)}
 const trips=read().map(normalize);
 box.innerHTML='<h3 style="color:#2fe3f2">SIERRA EXECUTIVE • TRIP OPERATIONS</h3><p>Multi-leg dispatch planning, crew duty, maintenance reserves and trip profitability. Estimates only; verify aircraft performance and regulations.</p><input id="sxRoute" placeholder="KMEV, KLAS, KSDL, KMEV" style="width:100%;padding:9px"><p>Departure <input id="sxStart" type="datetime-local"> Nights <input id="sxNights" type="number" min="0" max="30" value="1" style="width:55px"> Passengers <input id="sxPax" type="number" min="0" max="8" value="4" style="width:55px"> <button id="sxCreate">Create Trip</button></p><div id="sxPlans"></div>';
 box.querySelector('#sxCreate').onclick=()=>{
  const stops=box.querySelector('#sxRoute').value.toUpperCase().split(/[ ,;]+/).filter(Boolean);
  const nights=num(box.querySelector('#sxNights').value),pax=num(box.querySelector('#sxPax').value),a=aircraft(),start=box.querySelector('#sxStart').value;
  if(!a||stops.length<2||stops.length>12||stops.some(x=>!/^[A-Z]{4}$/.test(x))||!Number.isInteger(nights)||nights<0||nights>30||!Number.isInteger(pax)||pax<0||pax>8||!start){alert('Select an aircraft, departure date/time, 2–12 ICAO codes, 0–30 nights and 0–8 passengers.');return}
  const legs=stops.slice(1).map((to,i)=>({from:stops[i],to,kind:i===stops.length-2?'Return / reposition':'Passenger charter',flightHours:1.5,groundHours:1,revenue:0,passengers:pax,status:'Planned'}));
  const t={id:String(Date.now()),tail:a.tail,nights,pax,start,legs,settings:{...DEFAULT},status:'Planned',created:new Date().toISOString()};
  save([t,...read()].slice(0,MX));render();
 };
 const active=typeof state!=='undefined'&&state.activeAssignment;
 if(active)box.insertAdjacentHTML('beforeend','<p style="color:#ffd991">Active dispatch: '+esc(active.flight)+' • '+esc(active.origin)+' → '+esc(active.dest)+' • '+esc(active.aircraft)+'. Existing flight will not be replaced.</p>');
 const plans=box.querySelector('#sxPlans');
 plans.innerHTML=trips.length?trips.map(t=>{
 const c=calculate(t),a=typeof state!=='undefined'?state.fleet?.[t.tail]:null;
 const currentHours=num(a?.hours),cycles=num(a?.cycles);
 let cursor=new Date(t.start),duty=0,flags=[],legHtml='';
 t.legs.forEach((l,i)=>{
  const start=Number.isFinite(cursor.getTime())?cursor.toLocaleString():'Set departure';
  duty+=num(l.flightHours)+num(l.groundHours);
  if(duty>t.settings.crewMaxDuty)flags.push('Crew duty estimate exceeds '+t.settings.crewMaxDuty+' hours; add a rest break and review duty limits.');
  if(num(l.flightHours)<=0||num(l.groundHours)<0)flags.push('Check leg '+(i+1)+' time estimates.');
  cursor=new Date(cursor.getTime()+(num(l.flightHours)+num(l.groundHours))*3600000);
  legHtml+='<div style="padding:7px;border-top:1px solid #285056"><b>Leg '+(i+1)+': '+esc(l.from)+' → '+esc(l.to)+'</b> • '+esc(l.kind)+'<br><small>Estimated departure '+esc(start)+'</small><br>Flight hours <input data-i="'+i+'" data-k="flightHours" type="number" min=".1" max="20" step=".1" value="'+num(l.flightHours)+'" style="width:65px"> Ground hours <input data-i="'+i+'" data-k="groundHours" type="number" min="0" max="72" step=".5" value="'+num(l.groundHours)+'" style="width:65px"> Revenue $<input data-i="'+i+'" data-k="revenue" type="number" min="0" max="10000000" step="100" value="'+num(l.revenue)+'" style="width:100px"> <select data-i="'+i+'" data-k="status">'+['Planned','Ready','Departed','Landed','Completed'].map(v=>'<option '+(l.status===v?'selected':'')+'>'+v+'</option>').join('')+'</select></div>';
 });
 if(t.settings.inspectionInterval>0&&currentHours+c.flight>=t.settings.inspectionInterval*Math.ceil((currentHours+.001)/t.settings.inspectionInterval))flags.push('Maintenance planning: projected aircraft hours may cross a '+t.settings.inspectionInterval+'-hour inspection milestone.');
 if(t.legs.some(l=>!l.to.startsWith('K')&&!l.to.startsWith('PH')))flags.push('International legs: verify customs, permits, entry requirements and handling.');
 flags.push('Runway suitability, fuel stops, terrain, weather and real crew duty/rest rules require manual verification.');
 return '<article data-trip="'+esc(t.id)+'" style="border-top:2px solid #2fe3f2;margin-top:15px;padding-top:10px"><h4>'+esc(t.tail)+' • '+t.legs.map(l=>esc(l.from)).join(' → ')+' → '+esc(t.legs.at(-1).to)+'</h4><p>'+t.nights+' nights • '+t.pax+' passengers • '+c.flight.toFixed(1)+' estimated flight hours • '+t.legs.length+' cycles</p>'+legHtml+'<p>Estimated revenue <b>'+dollars(c.revenue)+'</b> • Estimated operating costs <b>'+dollars(c.total)+'</b> • Estimated profit <b>'+dollars(c.profit)+'</b></p><details><summary>Operating cost breakdown & rates</summary>'+Object.entries(c.costs).map(([k,v])=>esc(k)+': '+dollars(v)).join(' • ')+'<p>Fuel $/hr <input data-setting="fuelPerHour" type="number" min="0" value="'+t.settings.fuelPerHour+'" style="width:90px"> Crew $/hr <input data-setting="crewHourly" type="number" min="0" value="'+t.settings.crewHourly+'" style="width:90px"> Maintenance $/hr <input data-setting="maintenanceHour" type="number" min="0" value="'+t.settings.maintenanceHour+'" style="width:90px"></p></details><p>Aircraft logged: '+currentHours.toFixed(1)+' hr / '+cycles+' cycles. Projected: '+(currentHours+c.flight).toFixed(1)+' hr / '+(cycles+t.legs.length)+' cycles. (Not posted to fleet until flights are closed.)</p><p style="color:#ffd991">'+[...new Set(flags)].map(esc).join('<br>')+'</p><button data-save>Save Changes</button> <button data-dispatch>Dispatch Next Leg</button> <button data-remove>Delete Trip</button></article>';
 }).join(''):'<p>No planned trips yet.</p>';
 plans.querySelectorAll('[data-trip]').forEach(card=>{
  const id=card.dataset.trip;
  card.querySelector('[data-save]').onclick=()=>{
   const all=read(),t=all.find(x=>x.id===id);if(!t)return;
   card.querySelectorAll('[data-i]').forEach(el=>{const l=t.legs[Number(el.dataset.i)],k=el.dataset.k;l[k]=k==='status'?el.value:Math.max(0,num(el.value))});
   card.querySelectorAll('[data-setting]').forEach(el=>t.settings[el.dataset.setting]=Math.max(0,num(el.value)));
   save(all);render();
  };
  card.querySelector('[data-dispatch]').onclick=()=>{
   const all=read(),t=all.find(x=>x.id===id);if(!t)return;
   const busy=typeof state!=='undefined'&&['accepted','duty','fuel','boarded','ready','departed','landed','parked'].includes(String(state.workflow||'').toLowerCase());
   if(busy){alert('Finish the active charter before dispatching another leg.');return}
   const next=t.legs.findIndex(l=>l.status!=='Completed');
   if(next<0){alert('All trip legs completed.');return}
   const l=t.legs[next],a=state.fleet?.[t.tail];
   if(!a){alert('Aircraft is not in the fleet.');return}
   if(String(a.location||'').toUpperCase()!==l.from){alert('Aircraft is at '+a.location+', not '+l.from+'. Reposition or correct the plan first.');return}
   if(!confirm('Create dispatch for '+t.tail+' '+l.from+' → '+l.to+'? Flight will still require normal pilot confirmation.'))return;
   const flight='SXR'+String(Date.now()).slice(-7);
   const dep=new Date(t.start);
   const day=Number.isFinite(dep.getTime())?dep.toISOString().slice(0,10):new Date().toISOString().slice(0,10);
   const time=Number.isFinite(dep.getTime())?String(dep.getHours()).padStart(2,'0')+':'+String(dep.getMinutes()).padStart(2,'0'):'12:00';
   const pax=l.kind==='Return / reposition'?0:t.pax;
   const offer={flight,origin:l.from,dest:l.to,aircraft:t.tail,client:'Sierra Executive VIP Trip',pax,bags:0,value:num(l.revenue),category:'VIP',charterType:l.kind,jobType:'CONTRACT',minClass:a.type,departureDate:day,departureTime:time,expiry:new Date(Date.now()+86400000).toISOString(),event:'Multi-leg trip • leg '+(next+1)+'/'+t.legs.length+' • verify route, fuel, alternate, crew and performance',status:'Available',protected:true,manual:true,tripId:t.id,tripLeg:next};
   state.selectedAircraft=t.tail;
   state.marketBoard=Array.isArray(state.marketBoard)?state.marketBoard:[];
   state.marketBoard.push(offer);
   if(typeof saveState==='function')saveState();
   if(typeof renderMarket==='function')renderMarket();
   if(typeof acceptMarket==='function'){
      const idx=state.marketBoard.indexOf(offer);
      if(idx>=0)acceptMarket(idx);
   }
   if(state.activeAssignment?.flight===flight){l.status='Dispatched';l.flight=flight;save(all);render()}
 };
  card.querySelector('[data-remove]').onclick=()=>{if(confirm('Delete this trip plan?')){save(read().filter(x=>x.id!==id));render()}};
 });
}
if(typeof closeFlight==='function'){
 const originalClose=closeFlight;
 closeFlight=function(...args){
  const before=state.activeAssignment?.flight||document.getElementById('flightId')?.value;
  const result=originalClose.apply(this,args);
  const completed=(state.log||[]).some(x=>x.flight===before&&x.status==='Completed');
  if(completed){
   const all=read();let changed=false;
   all.forEach(t=>t.legs.forEach(l=>{if(l.flight===before&&l.status!=='Completed'){l.status='Completed';changed=true}}));
   if(changed){save(all);render()}
  }
  return result;
 };
}
setTimeout(render,1500);
})();