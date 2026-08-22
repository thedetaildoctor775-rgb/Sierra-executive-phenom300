(()=>{
'use strict';

const DEFAULT_FLEET={
  N300SE:{tail:'N300SE',type:'Embraer Phenom 300E',model:'E55P',home:'KRNO',location:'KRNO',status:'Available',profile:'Light-jet / short-medium executive charter'},
  N24NV:{tail:'N24NV',type:'Cessna Citation Longitude',model:'C700',home:'KRNO',location:'KRNO',status:'Available',profile:'Super-midsize / long-range executive charter'},
  N88SX:{tail:'N88SX',type:'Cessna Citation X',model:'C750',home:'KRNO',location:'KRNO',status:'Available',profile:'High-speed / long-range executive charter'},
  N72LX:{tail:'N72LX',type:'Cessna Citation Latitude',model:'C680A',home:'KRNO',location:'KRNO',status:'Available',profile:'Midsize / executive charter'}
};

function ensureFleetFixed(){
  state.fleet=state.fleet||{};
  for(const [tail,defaults] of Object.entries(DEFAULT_FLEET)){
    const old=state.fleet[tail]||{};
    // Aircraft identity is canonical. Never allow stale cloud/local state to turn
    // one tail number into another aircraft type.
    state.fleet[tail]={
      ...old,
      ...defaults,
      location:String(old.location||defaults.location).toUpperCase(),
      status:old.status||defaults.status,
      charters:Number(old.charters||0),
      passengers:Number(old.passengers||0),
      hours:Number(old.hours||0),
      profit:Number(old.profit||0),
      cycles:Number(old.cycles||0)
    };
  }
  if(!state.selectedAircraft||!state.fleet[state.selectedAircraft]) state.selectedAircraft='N300SE';
  if(state.activeAircraft&&!state.fleet[state.activeAircraft]) state.activeAircraft=state.selectedAircraft;
  return state.fleet;
}

function workflowName(){return String(state.workflow||'').toLowerCase();}
function workflowBusy(){return ['accepted','duty','fuel','boarded','ready','departed','landed','parked'].includes(workflowName());}
function actuallyAirborne(){return workflowName()==='departed';}

function originICAO(){
  const raw=(typeof val==='function'&&val('origin'))||state.activeAssignment?.origin||'';
  return String(raw||'').trim().toUpperCase();
}
function destinationICAO(){
  const raw=(typeof val==='function'&&val('destination'))||state.activeAssignment?.dest||state.activeAssignment?.destination||'';
  return String(raw||'').trim().toUpperCase();
}

function activeTail(){
  ensureFleetFixed();
  // While a flight is active, the explicit active aircraft is authoritative.
  // Otherwise the user's selected aircraft is authoritative.
  if(workflowBusy()&&state.activeAircraft&&state.fleet[state.activeAircraft]) return state.activeAircraft;
  if(state.selectedAircraft&&state.fleet[state.selectedAircraft]) return state.selectedAircraft;
  const assignmentTail=state.activeAssignment?.aircraft;
  if(assignmentTail&&state.fleet[assignmentTail]) return assignmentTail;
  return 'N300SE';
}

function selectedAircraftFixed(){
  ensureFleetFixed();
  return state.fleet[activeTail()]||state.fleet.N300SE;
}

function enforceLocationFromWorkflow(tail){
  ensureFleetFixed();
  const a=state.fleet[tail];
  if(!a)return;
  const w=workflowName();
  if(['accepted','duty','fuel','boarded','ready'].includes(w)){
    const o=originICAO();
    if(o)a.location=o;
    a.status='Assigned';
  }else if(w==='departed'){
    a.location='ENROUTE';
    a.status='In Flight';
  }else if(w==='landed'){
    const d=destinationICAO();
    if(d)a.location=d;
    a.status='Landed';
  }else if(w==='parked'){
    const d=destinationICAO();
    if(d)a.location=d;
    a.status='Assigned';
  }
}

function reconcileFleetFixed(){
  ensureFleetFixed();
  let tail=activeTail();

  // If a charter exists but no active tail has been committed yet, commit the
  // user's selected aircraft to the assignment once and use it everywhere.
  if(workflowBusy()){
    if(!state.activeAircraft||!state.fleet[state.activeAircraft]) state.activeAircraft=state.selectedAircraft;
    tail=state.activeAircraft;
    state.selectedAircraft=tail;
    if(state.activeAssignment) state.activeAssignment.aircraft=tail;
    enforceLocationFromWorkflow(tail);
  }

  for(const [t,a] of Object.entries(state.fleet)){
    if(t!==tail&&['Assigned','In Flight','Landed'].includes(a.status)) a.status='Available';
  }
}

function selectAircraftFixed(tail){
  ensureFleetFixed();
  if(!state.fleet[tail])return;
  if(actuallyAirborne()&&state.activeAircraft&&state.activeAircraft!==tail){
    alert('Land or reset the active flight before switching aircraft.');
    return;
  }
  state.selectedAircraft=tail;
  state.activeAircraft=tail;
  if(state.activeAssignment)state.activeAssignment.aircraft=tail;
  enforceLocationFromWorkflow(tail);
  persistAndRefresh();
}

function correctRenderedAircraft(){
  try{
    ensureFleetFixed();
    const tail=activeTail();
    const a=state.fleet[tail];
    if(!a)return;

    const put=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text;};
    put('aircraftTail',tail);
    put('aircraftType',a.type+' • '+a.model);
    put('currentLocation',a.location||'—');
    put('aircraftHome',a.home||'—');
    put('careerCharters',Number(a.charters||0));
    put('careerPax',Number(a.passengers||0));
    put('careerHours',Number(a.hours||0).toFixed(1));
    if(document.getElementById('careerProfit'))document.getElementById('careerProfit').textContent=typeof money==='function'?money(Number(a.profit||0)):'$'+Number(a.profit||0).toLocaleString();
    put('sideAircraft',tail+' • '+a.type);
    put('dispatchAircraft',tail);
    put('fuelAircraft',tail);

    const status=document.getElementById('aircraftStatus');
    if(status){
      if(workflowName()==='departed')status.textContent='● '+tail+' IN FLIGHT';
      else if(workflowBusy())status.textContent='● '+tail+' ASSIGNED';
      else status.textContent='● '+tail+' AVAILABLE';
    }

    // Legacy renderFleet has a fourth metadata line that can print "undefined".
    // Replace it with the aircraft's real profile when present.
    document.querySelectorAll('.fleet-aircraft').forEach(card=>{
      const tailEl=card.querySelector('.tail');
      const ft=tailEl?.textContent?.trim();
      const fa=state.fleet[ft];
      if(!fa)return;
      const metas=card.querySelectorAll('.meta');
      metas.forEach(m=>{if(m.textContent.trim()==='undefined')m.textContent=fa.profile||'';});
    });
  }catch(e){console.warn('Aircraft render correction failed',e);}
}

function persistAndRefresh(){
  try{saveState();}catch(e){console.warn('Fleet sync save failed',e);}
  try{if(typeof scheduleCloudSave==='function')scheduleCloudSave();}catch(e){}
  try{if(typeof renderFleet==='function')renderFleet();}catch(e){}
  try{if(typeof sync==='function')sync();}catch(e){}
  try{if(typeof renderMarket==='function')renderMarket();}catch(e){}
  try{if(typeof calcFuelLoad==='function')calcFuelLoad();}catch(e){}
  try{if(typeof svRender==='function')svRender();}catch(e){}
  correctRenderedAircraft();
}

// Replace hard-coded Phenom-only fleet functions.
ensureFleet110=ensureFleetFixed;
selectedAircraft=selectedAircraftFixed;
reconcileFleet130=reconcileFleetFixed;
selectAircraft=selectAircraftFixed;

// The legacy sync() still explicitly renders state.fleet.N300SE. Keep all of its
// existing behavior, then correct every aircraft-facing field from the real tail.
if(typeof sync==='function'){
  const legacySync=sync;
  sync=function(...args){
    reconcileFleetFixed();
    const result=legacySync.apply(this,args);
    reconcileFleetFixed();
    correctRenderedAircraft();
    return result;
  };
}

if(typeof step==='function'){
  const legacyStep=step;
  step=async function(stepName){
    ensureFleetFixed();
    const tail=activeTail();
    state.selectedAircraft=tail;
    state.activeAircraft=tail;
    if(state.activeAssignment)state.activeAssignment.aircraft=tail;
    const result=await legacyStep(stepName);
    enforceLocationFromWorkflow(tail);
    state.selectedAircraft=tail;
    state.activeAircraft=tail;
    if(state.activeAssignment)state.activeAssignment.aircraft=tail;
    persistAndRefresh();
    return result;
  };
}

if(typeof closeFlight==='function'){
  const legacyCloseFlight=closeFlight;
  closeFlight=async function(...args){
    ensureFleetFixed();
    const tail=activeTail();
    const dest=destinationICAO();
    const result=await legacyCloseFlight.apply(this,args);
    ensureFleetFixed();
    if(state.fleet[tail]){
      if(dest)state.fleet[tail].location=dest;
      state.fleet[tail].status='Available';
    }
    state.selectedAircraft=tail;
    state.activeAircraft=null;
    persistAndRefresh();
    return result;
  };
}

if(typeof resetFlight==='function'){
  const legacyResetFlight=resetFlight;
  resetFlight=function(...args){
    ensureFleetFixed();
    const tail=activeTail();
    const result=legacyResetFlight.apply(this,args);
    ensureFleetFixed();
    state.selectedAircraft=tail;
    state.activeAircraft=null;
    if(state.fleet[tail])state.fleet[tail].status='Available';
    persistAndRefresh();
    return result;
  };
}

// Sierra Voice also had the Phenom name hard-coded. Make voice/ATC context use
// the same aircraft as Career OS so the two sides cannot disagree.
if(typeof svBuildContext==='function'){
  const legacySvBuildContext=svBuildContext;
  svBuildContext=function(...args){
    const ctx=legacySvBuildContext.apply(this,args)||{};
    ensureFleetFixed();
    const tail=activeTail();
    const a=state.fleet[tail];
    ctx.tail=tail;
    ctx.aircraft=a?(a.type+' • '+a.model):ctx.aircraft;
    return ctx;
  };
}

// Repair stale state immediately, and again after cloud data has had time to load.
function repairNow(){
  ensureFleetFixed();
  if(workflowBusy()){
    if(!state.activeAircraft||!state.fleet[state.activeAircraft])state.activeAircraft=state.selectedAircraft;
    if(state.activeAssignment)state.activeAssignment.aircraft=state.activeAircraft;
  }
  reconcileFleetFixed();
  try{saveState();}catch(e){}
  correctRenderedAircraft();
}
repairNow();
setTimeout(repairNow,500);
setTimeout(()=>{repairNow();try{sync();}catch(e){}},1800);

console.info('Sierra Fleet Sync Fix v2 active');
})();