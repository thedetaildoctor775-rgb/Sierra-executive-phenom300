(function(){
if(window.sxTripPlannerLoaded)return;
window.sxTripPlannerLoaded=true;
var KEY='sx_vip_trips_v1';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}}
function save(a){localStorage.setItem(KEY,JSON.stringify(a))}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function render(){
var box=document.getElementById('sxVipPlanner');
if(!box){box=document.createElement('section');box.id='sxVipPlanner';box.style.cssText='margin:16px 0;padding:16px;border:1px solid #2fe3f2;border-radius:12px;background:#101a1c;color:white';(document.getElementById('fleetBar')?.parentElement||document.body).appendChild(box)}
var trips=load();
box.innerHTML='<h3>VIP MULTI-LEG TRIP PLANNER</h3><p>Plan charter legs, repositioning and overnight expenses. Planning estimates only.</p><input id="sxLegs" placeholder="KMEV, KLAS, KSDL, KMEV" style="width:100%;padding:9px"><p><label>Nights <input id="sxNights" type="number" min="0" max="30" value="1" style="width:60px"></label> <label>Passengers <input id="sxPax" type="number" min="0" max="8" value="4" style="width:60px"></label> <button id="sxPlan">Create Trip</button></p><div id="sxTrips"></div>';
box.querySelector('#sxPlan').onclick=function(){
var codes=box.querySelector('#sxLegs').value.toUpperCase().split(/[ ,;]+/).filter(Boolean);
var nights=Number(box.querySelector('#sxNights').value),pax=Number(box.querySelector('#sxPax').value);
if(codes.length<2||codes.length>12||codes.some(function(c){return !/^[A-Z]{4}$/.test(c)})||!Number.isInteger(nights)||nights<0||nights>30||!Number.isInteger(pax)||pax<0||pax>8){alert('Enter 2–12 ICAO airport codes, 0–30 nights and 0–8 passengers.');return}
var a=typeof selectedAircraft==='function'?selectedAircraft():null;
if(!a){alert('Select an aircraft first');return}
var legs=codes.slice(1).map(function(to,i){return {from:codes[i],to:to,kind:i===codes.length-2?'Return / reposition':'Passenger / charter',status:'Planned'}});
var expenses={hotel:nights*370,perDiem:nights*190,parking:nights*90,handling:legs.length*250,maintenanceReserve:legs.length*750};
trips.unshift({id:Date.now(),tail:a.tail,legs:legs,nights:nights,pax:pax,expenses:expenses,status:'Planned'});
save(trips.slice(0,40));render();
};
box.querySelector('#sxTrips').innerHTML=trips.length?trips.map(function(t){
var total=Object.values(t.expenses).reduce(function(a,b){return a+b},0);
return '<div style="border-top:1px solid #28727b;padding:10px 0"><strong>'+esc(t.tail)+' • '+t.legs.map(function(l){return esc(l.from)}).join(' → ')+' → '+esc(t.legs[t.legs.length-1].to)+'</strong><br>'+t.legs.length+' legs • '+t.nights+' nights • '+t.pax+' passengers<br>Hotel $'+t.expenses.hotel+' • Crew per diem $'+t.expenses.perDiem+' • Parking $'+t.expenses.parking+' • Handling $'+t.expenses.handling+' • Maintenance reserve $'+t.expenses.maintenanceReserve+'<br><b>Estimated ground/reserve costs: $'+total.toLocaleString()+'</b><br><small>Fuel, flight time, crew wages, landing fees and taxes excluded. Verify runway performance, duty/rest and customs separately.</small><br><button data-del="'+t.id+'">Delete trip</button></div>'
}).join(''):'<p>No planned trips.</p>';
box.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){save(load().filter(function(t){return String(t.id)!==b.dataset.del}));render()}});
}
setTimeout(render,1600);
})();