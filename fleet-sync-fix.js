(()=>{
'use strict';

const DEFAULT_FLEET={
  N300SE:{tail:'N300SE',type:'Embraer Phenom 300E',model:'E55P',home:'KRNO',location:'KRNO',status:'Available'},
  N24NV:{tail:'N24NV',type:'Cessna Citation Longitude',model:'C700',home:'KRNO',location:'KRNO',status:'Available'},
  N88SX:{tail:'N88SX',type:'Cessna Citation X',model:'C750',home:'KRNO',location:'KRNO',status:'Available'},
  N72LX:{tail:'N72LX',type:'Cessna Citation Latitude',model:'C680A',home:'KRNO',location:'KRNO',status:'Available'}
};

function ensureFleetFixed(){
  state.fleet=state.fleet||{};
  for(const [tail,defaults] of Object.entries(DEFAULT_FLEET)){
    state.fleet[tail]={...defaults,...(state.fleet[tail]||{})};
  }
  if(!state.selectedAircraft||!state.fleet[state.selectedAircraft]) state.selectedAircraft='N300SE';
  if(state.activeAircraft && !state.fleet[state.activeAircraft]) state.activeAircraft=state.selectedAircraft;
  return state.fleet;
}

function activeTail(){
  ensureFleetFixed();
  if(state.selectedAircraft&&state.fleet[state.selectedAircraft]) return state.selectedAircraft;
  const assignmentTail=state.activeAssignment?.aircraft;
  if(assignmentTail&&state.fleet[assignmentTail]) return assignmentTail;
  if(state.activeAircraft&&state.fleet[state.activeAircraft]) return state.activeAircraft;
  return 'N300SE';
}

function selectedAircraftFixed(){
  ensureFleetFixed();
  const tail=activeTail();
  return state.fleet[tail]||state.fleet.N300SE;
}

function workflowBusy(){
  return ['accepted','duty','fuel','boarded','ready','departed','landed','parked'].includes(String(state.workflow||'').toLowerCase());
}
function actuallyAirborne(){
  return ['departed','landed'].includes(String(state.workflow||'').toLowerCase());
}

function persistAndRefresh(){
  try{ saveState(); }catch(e){ console.warn('Fleet sync save failed',e); }
  try{ if(typeof scheduleCloudSave==='function') scheduleCloudSave(); }catch(e){}
  try{ if(typeof renderFleet==='function') renderFleet(); }catch(e){}
  try{ if(typeof sync==='function') sync(); }catch(e){}
  try{ if(typeof renderMarket==='function') renderMarket(); }catch(e){}
  try{ if(typeof calcFuelLoad==='function') calcFuelLoad(); }catch(e){}
  try{ if(typeof svRender==='function') svRender(); }catch(e){}
}

function reconcileFleetFixed(){
  ensureFleetFixed();
  const tail=activeTail();
  const a=state.fleet[tail];
  if(!a) return;

  a.charters=Number(a.charters||0);
  a.passengers=Number(a.passengers||0);
  a.hours=Number(a.hours||0);
  a.profit=Number(a.profit||0);
  a.cycles=Number(a.cycles||0);

  state.selectedAircraft=tail;
  state.activeAircraft=tail;
  if(state.activeAssignment) state.activeAssignment.aircraft=tail;

  for(const [t,aircraft] of Object.entries(state.fleet)){
    if(t===tail && workflowBusy()){
      aircraft.status=String(state.workflow||'').toLowerCase()==='departed'?'In Flight':'Assigned';
    }else if(t!==tail && ['Assigned','In Flight','Landed'].includes(aircraft.status)){
      aircraft.status='Available';
    }
  }
}

function selectAircraftFixed(tail){
  ensureFleetFixed();
  if(!state.fleet[tail]) return;

  // Do not swap airplanes once the aircraft is airborne. Before departure,
  // the selected aircraft is the source of truth for the active charter.
  if(actuallyAirborne() && state.activeAircraft && state.activeAircraft!==tail){
    alert('Land or reset the active flight before switching aircraft.');
    return;
  }

  state.selectedAircraft=tail;
  state.activeAircraft=tail;
  if(state.activeAssignment) state.activeAssignment.aircraft=tail;
  persistAndRefresh();
}

function destinationICAO(){
  const raw=(typeof val==='function'&&val('destination')) || state.activeAssignment?.dest || state.activeAssignment?.destination || '';
  return String(raw||'').trim().toUpperCase();
}

function originICAO(){
  const raw=(typeof val==='function'&&val('origin')) || state.activeAssignment?.origin || '';
  return String(raw||'').trim().toUpperCase();
}

function syncLocationForStep(stepName,tail){
  ensureFleetFixed();
  const a=state.fleet[tail];
  if(!a) return;
  const s=String(stepName||'').toLowerCase();

  if(['accepted','duty','fuel','boarded','ready'].includes(s)){
    const origin=originICAO();
    if(origin) a.location=origin;
    a.status='Assigned';
  }else if(s==='departed'){
    a.location='ENROUTE';
    a.status='In Flight';
  }else if(s==='landed'){
    const dest=destinationICAO();
    if(dest) a.location=dest;
    a.status='Landed';
  }else if(s==='parked'){
    const dest=destinationICAO();
    if(dest) a.location=dest;
    a.status='Assigned';
  }
}

// Replace the old Phenom-only logic that always forced N300SE.
ensureFleet110=ensureFleetFixed;
selectedAircraft=selectedAircraftFixed;
reconcileFleet130=reconcileFleetFixed;
selectAircraft=selectAircraftFixed;

if(typeof step==='function'){
  const legacyStep=step;
  step=async function(stepName){
    ensureFleetFixed();
    const tail=activeTail();
    state.selectedAircraft=tail;
    state.activeAircraft=tail;
    if(state.activeAssignment) state.activeAssignment.aircraft=tail;
    const result=await legacyStep(stepName);
    syncLocationForStep(stepName,tail);
    state.selectedAircraft=tail;
    state.activeAircraft=tail;
    if(state.activeAssignment) state.activeAssignment.aircraft=tail;
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
      if(dest) state.fleet[tail].location=dest;
      state.fleet[tail].status='Available';
    }
    state.selectedAircraft=tail;
    state.activeAircraft=tail;
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
    state.activeAircraft=tail;
    if(state.fleet[tail]) state.fleet[tail].status='Available';
    persistAndRefresh();
    return result;
  };
}

// Immediately repair stale aircraft assignment left by the old hard-coded logic.
ensureFleetFixed();
state.activeAircraft=state.selectedAircraft;
if(state.activeAssignment) state.activeAssignment.aircraft=state.selectedAircraft;
reconcileFleetFixed();
persistAndRefresh();

console.info('Sierra Fleet Sync Fix active');
})();