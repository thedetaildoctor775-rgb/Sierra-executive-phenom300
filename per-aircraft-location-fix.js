(()=>{
'use strict';

const HOME_BASE='KMEV';
const STORE_KEY='sierra_aircraft_locations_v4';
const RESET_KEY='sierra_aircraft_locations_v4_seeded';
const CORRECT_LOCATIONS={
  N24NV:'KVNY',
  N72LX:'KBUR',
  N88SX:'KAPC',
  N300SE:'KMEV'
};

function workflowName(){return String(state?.workflow||'').toLowerCase();}
function workflowBusy(){return ['accepted','duty','fuel','boarded','ready','departed','landed','parked'].includes(workflowName());}
function getActiveTail(){
  const t=state?.activeAircraft||state?.activeAssignment?.aircraft||null;
  return t&&state?.fleet?.[t]?t:null;
}
function readLocations(){
  try{return {...CORRECT_LOCATIONS,...JSON.parse(localStorage.getItem(STORE_KEY)||'{}')}}catch{return {...CORRECT_LOCATIONS}}
}
function writeLocations(map){
  try{localStorage.setItem(STORE_KEY,JSON.stringify(map));}catch(e){}
}
function seedLocations(){
  if(!state?.fleet)return;
  if(localStorage.getItem(RESET_KEY)!=='done'){
    writeLocations({...CORRECT_LOCATIONS});
    localStorage.setItem(RESET_KEY,'done');
  }
  applyStoredLocations(true);
}
function applyStoredLocations(forceAll=false){
  if(!state?.fleet)return;
  const map=readLocations();
  const active=getActiveTail();
  const busy=workflowBusy();
  Object.entries(map).forEach(([tail,loc])=>{
    const a=state.fleet[tail];
    if(!a)return;
    a.home=HOME_BASE;
    if(forceAll || !busy || tail!==active) a.location=String(loc).toUpperCase();
  });
  state.homeBase=HOME_BASE;
  state.operatorHomeBase=HOME_BASE;
}
function captureActiveLocation(){
  if(!state?.fleet)return;
  const active=getActiveTail();
  if(!active)return;
  const loc=state.fleet[active]?.location;
  if(!loc||loc==='ENROUTE')return;
  const map=readLocations();
  map[active]=String(loc).toUpperCase();
  writeLocations(map);
}
function saveCleanState(){
  try{saveState();}catch(e){}
  try{if(typeof scheduleCloudSave==='function')scheduleCloudSave();}catch(e){}
}
function repairFleetCards(){
  try{
    applyStoredLocations(false);
    document.querySelectorAll('.fleet-aircraft').forEach(card=>{
      const tail=card.querySelector('.tail')?.textContent?.trim();
      const a=tail&&state?.fleet?.[tail];
      if(!a)return;
      const metas=[...card.querySelectorAll('.meta')];
      const locMeta=metas.find(m=>/Location\s/i.test(m.textContent));
      if(locMeta)locMeta.textContent=`Location ${a.location||'—'} • Home ${HOME_BASE}`;
      else if(metas.length)metas[0].textContent=`Location ${a.location||'—'} • Home ${HOME_BASE} • ${a.status||'Available'}`;
    });
    const selected=state?.selectedAircraft;
    const selectedA=selected&&state?.fleet?.[selected];
    if(selectedA){
      const el=document.getElementById('currentLocation');
      if(el)el.textContent=selectedA.location||'—';
    }
  }catch(e){console.warn('Fleet location render repair failed',e);}
}

// IMPORTANT: selecting a plane only selects it. It does NOT make it the active flight aircraft
// and it does NOT inherit the current charter origin/destination.
selectAircraft=function(tail){
  if(!state?.fleet?.[tail])return;
  const active=getActiveTail();
  if(workflowBusy() && active && active!==tail){
    alert('Finish or reset the active flight before switching aircraft.');
    return;
  }
  state.selectedAircraft=tail;
  if(!workflowBusy()) state.activeAircraft=null;
  applyStoredLocations(false);
  saveCleanState();
  try{if(typeof renderFleet==='function')renderFleet();}catch(e){}
  try{if(typeof sync==='function')sync();}catch(e){}
  repairFleetCards();
};

if(typeof sync==='function'){
  const previousSync=sync;
  sync=function(...args){
    applyStoredLocations(false);
    const result=previousSync.apply(this,args);
    captureActiveLocation();
    applyStoredLocations(false);
    repairFleetCards();
    return result;
  };
}
if(typeof renderFleet==='function'){
  const previousRenderFleet=renderFleet;
  renderFleet=function(...args){
    applyStoredLocations(false);
    const result=previousRenderFleet.apply(this,args);
    repairFleetCards();
    return result;
  };
}
if(typeof step==='function'){
  const previousStep=step;
  step=async function(...args){
    applyStoredLocations(false);
    const result=await previousStep.apply(this,args);
    captureActiveLocation();
    applyStoredLocations(false);
    saveCleanState();
    repairFleetCards();
    return result;
  };
}
if(typeof closeFlight==='function'){
  const previousCloseFlight=closeFlight;
  closeFlight=async function(...args){
    const activeBefore=getActiveTail()||state?.selectedAircraft;
    const result=await previousCloseFlight.apply(this,args);
    if(activeBefore&&state?.fleet?.[activeBefore]){
      const loc=state.fleet[activeBefore].location;
      if(loc&&loc!=='ENROUTE'){
        const map=readLocations();
        map[activeBefore]=String(loc).toUpperCase();
        writeLocations(map);
      }
    }
    applyStoredLocations(true);
    saveCleanState();
    repairFleetCards();
    return result;
  };
}
if(typeof resetFlight==='function'){
  const previousResetFlight=resetFlight;
  resetFlight=function(...args){
    const result=previousResetFlight.apply(this,args);
    state.activeAircraft=null;
    applyStoredLocations(true);
    saveCleanState();
    repairFleetCards();
    return result;
  };
}

seedLocations();
setTimeout(()=>{seedLocations();repairFleetCards();saveCleanState();},250);
setTimeout(()=>{applyStoredLocations(false);repairFleetCards();},1000);
setInterval(()=>{applyStoredLocations(false);repairFleetCards();},1500);

console.info('Sierra per-aircraft locations v4 active');
})();