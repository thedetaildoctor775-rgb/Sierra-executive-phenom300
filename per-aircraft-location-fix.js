(()=>{
'use strict';

const HOME_BASE='KMEV';
const REPAIR_KEY='sierra_aircraft_location_repair_20260823_v1';
const CORRECT_LOCATIONS={
  N24NV:'KVNY',
  N72LX:'KBUR',
  N88SX:'KAPC',
  N300SE:'KMEV'
};

function activeTail(){
  const t=state?.activeAircraft||state?.activeAssignment?.aircraft||state?.selectedAircraft;
  return t&&state?.fleet?.[t]?t:null;
}

function snapshotOtherLocations(){
  const active=activeTail();
  const snap={};
  Object.entries(state?.fleet||{}).forEach(([tail,a])=>{
    if(tail!==active&&a) snap[tail]=a.location;
  });
  return {active,snap};
}

function restoreOtherLocations(saved){
  if(!saved||!state?.fleet)return;
  Object.entries(saved.snap||{}).forEach(([tail,loc])=>{
    if(state.fleet[tail]&&loc) state.fleet[tail].location=loc;
  });
  Object.values(state.fleet).forEach(a=>{if(a)a.home=HOME_BASE;});
  state.homeBase=HOME_BASE;
  state.operatorHomeBase=HOME_BASE;
}

function applyOneTimeRepair(){
  try{
    if(localStorage.getItem(REPAIR_KEY)==='done')return;
    if(!state?.fleet)return;
    Object.entries(CORRECT_LOCATIONS).forEach(([tail,loc])=>{
      if(state.fleet[tail]){
        state.fleet[tail].location=loc;
        state.fleet[tail].home=HOME_BASE;
      }
    });
    state.homeBase=HOME_BASE;
    state.operatorHomeBase=HOME_BASE;
    try{saveState();}catch(e){}
    try{if(typeof scheduleCloudSave==='function')scheduleCloudSave();}catch(e){}
    localStorage.setItem(REPAIR_KEY,'done');
  }catch(e){console.warn('One-time fleet location repair failed',e);}
}

function repairFleetCards(){
  try{
    Object.values(state?.fleet||{}).forEach(a=>{if(a)a.home=HOME_BASE;});
    document.querySelectorAll('.fleet-aircraft').forEach(card=>{
      const tail=card.querySelector('.tail')?.textContent?.trim();
      const a=tail&&state?.fleet?.[tail];
      if(!a)return;
      const metas=[...card.querySelectorAll('.meta')];
      const locationMeta=metas.find(m=>/Location\s/i.test(m.textContent));
      if(locationMeta) locationMeta.textContent=`Location ${a.location||'—'} • Home ${HOME_BASE}`;
      else if(metas.length) metas[0].textContent=`Location ${a.location||'—'} • Home ${HOME_BASE} • ${a.status||'Available'}`;
    });
  }catch(e){console.warn('Per-aircraft fleet card repair failed',e);}
}

if(typeof sync==='function'){
  const previousSync=sync;
  sync=function(...args){
    const saved=snapshotOtherLocations();
    const result=previousSync.apply(this,args);
    restoreOtherLocations(saved);
    repairFleetCards();
    return result;
  };
}

if(typeof renderFleet==='function'){
  const previousRenderFleet=renderFleet;
  renderFleet=function(...args){
    const result=previousRenderFleet.apply(this,args);
    repairFleetCards();
    return result;
  };
}

if(typeof step==='function'){
  const previousStep=step;
  step=async function(...args){
    const saved=snapshotOtherLocations();
    const result=await previousStep.apply(this,args);
    restoreOtherLocations(saved);
    repairFleetCards();
    try{saveState();}catch(e){}
    try{if(typeof scheduleCloudSave==='function')scheduleCloudSave();}catch(e){}
    return result;
  };
}

if(typeof closeFlight==='function'){
  const previousCloseFlight=closeFlight;
  closeFlight=async function(...args){
    const saved=snapshotOtherLocations();
    const result=await previousCloseFlight.apply(this,args);
    restoreOtherLocations(saved);
    repairFleetCards();
    try{saveState();}catch(e){}
    try{if(typeof scheduleCloudSave==='function')scheduleCloudSave();}catch(e){}
    return result;
  };
}

if(typeof resetFlight==='function'){
  const previousResetFlight=resetFlight;
  resetFlight=function(...args){
    const saved=snapshotOtherLocations();
    const result=previousResetFlight.apply(this,args);
    restoreOtherLocations(saved);
    repairFleetCards();
    try{saveState();}catch(e){}
    try{if(typeof scheduleCloudSave==='function')scheduleCloudSave();}catch(e){}
    return result;
  };
}

applyOneTimeRepair();
setTimeout(()=>{applyOneTimeRepair();repairFleetCards();},300);
setTimeout(repairFleetCards,1200);
setInterval(repairFleetCards,2500);

console.info('Sierra Per-Aircraft Location Fix v2 active');
})();