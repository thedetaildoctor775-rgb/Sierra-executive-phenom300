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
 if(currentHours+c.flight>=t.settings.inspectionInterval*Math.ceil((currentHours+.001)/t.settings.inspectionInterval))flags.push('Maintenance planning: projected aircraft hours may cross a '+t.settings.inspectionInterval+'-hour inspection milestone.');
 if(t.legs.some(l=>!l.to.startsWith('K')&&!l.to.startsWith('PH')))flags.push('International legs: verify customs, permits, entry requirements and handling.');
 flags.push('Runway suitability, fuel stops, terrain, weather and real crew duty/rest rules require manual verification.');
 return '<article data-trip="'+esc(t.id)+'" style="border-top:2px solid #2fe3f2;margin-top:15px;padding-top:10px"><h4>'+esc(t.tail)+' • '+t.legs.map(l=>esc(l.from)).join(' → ')+' → '+esc(t.legs.at(-1).to)+'</h4><p>'+t.nights+' nights • '+t.pax+' passengers • '+c.flight.toFixed(1)+' estimated flight hours • '+t.legs.length+' cycles</p>'+legHtml+'<p>Estimated revenue <b>'+dollars(c.revenue)+'</b> • Estimated operating costs <b>'+dollars(c.total)+'</b> • Estimated profit <b>'+dollars(c.profit)+'</b></p><details><summary>Operating cost breakdown & rates</summary>'+Object.entries(c.costs).map(([k,v])=>esc(k)+': '+dollars(v)).join(' • ')+'<p>Fuel $/hr <input data-setting="fuelPerHour" type="number" min="0" value="'+t.settings.fuelPerHour+'" style="width:90px"> Crew $/hr <input data-setting="crewHourly" type="number" min="0" value="'+t.settings.crewHourly+'" style="width:90px"> Maintenance $/hr <input data-setting="maintenanceHour" type="number" min="0" value="'+t.settings.maintenanceHour+'" style="width:90px"></p></details><p>Aircraft logged: '+currentHours.toFixed(1)+' hr / '+cycles+' cycles. Projected: '+(currentHours+c.flight).toFixed(1)+' hr / '+(cycles+t.legs.length)+' cycles. (Not posted to fleet until flights are closed.)</p><p style="color:#ffd991">'+[...new Set(flags)].map(esc).join('<br>')+'</p><button data-save>Save Changes</button> <button data-remove>Delete Trip</button></article>';
 }).join(''):'<p>No planned trips yet.</p>';
 plans.querySelectorAll('[data-trip]').forEach(card=>{
  const id=card.dataset.trip;
  card.querySelector('[data-save]').onclick=()=>{
   const all=read(),t=all.find(x=>x.id===id);if(!t)return;
   card.querySelectorAll('[data-i]').forEach(el=>{const l=t.legs[Number(el.dataset.i)],k=el.dataset.k;l[k]=k==='status'?el.value:Math.max(0,num(el.value))});
   card.querySelectorAll('[data-setting]').forEach(el=>t.settings[el.dataset.setting]=Math.max(0,num(el.value)));
   save(all);render();
  };
  card.querySelector('[data-remove]').onclick=()=>{if(confirm('Delete this trip plan?')){save(read().filter(x=>x.id!==id));render()}};
 });
}
setTimeout(render,1500);
})();