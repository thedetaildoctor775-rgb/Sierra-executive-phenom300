(()=>{
'use strict';
if(window.__sxFlightAutomationV1)return;
window.__sxFlightAutomationV1=true;

const $=id=>document.getElementById(id);
const read=id=>$(id)?.value||'';
const now=()=>new Date().toISOString();

function getState(){return (typeof state!=='undefined'&&state)?state:null}
function persist(){
  try{ if(typeof saveState==='function')saveState(); else localStorage.setItem('sierra_phenom300_state',JSON.stringify(getState()||{})); }catch(e){}
}
function ensureGroundOps(fid){
  const s=getState(); if(!s)return null;
  s.groundOps=s.groundOps||{};
  s.groundOps[fid]=s.groundOps[fid]||{departure:{},arrival:{},updatedAt:null};
  const g=s.groundOps[fid];
  g.departure={fuel:'REQUESTED',gpu:'NOT REQUESTED',catering:'REQUESTED',boarding:'NOT REQUESTED',...(g.departure||{})};
  g.arrival={transport:'REQUESTED',crewcar:'NOT REQUESTED',fuel:'NOT REQUESTED',lav:'NOT REQUESTED',hangar:'NOT REQUESTED',...(g.arrival||{})};
  g.updatedAt=now();
  return g;
}
function buildPackage(){
  const s=getState(),a=s?.activeAssignment;
  if(!s||!a)return;
  const fid=String(a.flight||read('flightId')||'').toUpperCase();
  if(!fid)return;

  const g=ensureGroundOps(fid);
  const manifest=Array.isArray(a.manifest)?a.manifest:[];
  const route=[a.origin||read('origin'),a.dest||a.destination||read('destination')].filter(Boolean).join(' → ');

  s.flightPackage={
    id:fid,
    status:'READY',
    createdAt:now(),
    aircraft:a.aircraft||s.activeAircraft||s.selectedAircraft||'',
    route,
    dispatch:{
      origin:a.origin||read('origin'),
      destination:a.dest||a.destination||read('destination'),
      alternate:a.alternate||read('alternate'),
      date:a.departureDate||read('depDate'),
      time:a.departureTime||read('depTime'),
      callsign:read('callsign'),
      mission:a.mission||read('mission'),
      client:a.client||read('clientName'),
      clientContact:a.clientContact||read('clientContact'),
      specialRequests:a.specialRequests||read('specialRequests')
    },
    manifest:{
      pax:Number(a.pax??read('paxCount')??0),
      passengerWeight:Number(a.paxWeight??read('paxWeight')??0),
      baggage:Number(a.bags??read('bags')??0),
      roster:manifest,
      notes:read('manifestNotes')
    },
    fuelLoad:{
      blockFuel:Number(read('blockFuel')||0),
      taxiFuel:Number(read('taxiFuel')||0),
      tripFuel:Number(read('tripFuel')||0),
      zfw:Number(read('zfw')||0),
      tow:Number(read('tow')||0)
    },
    groundOps:g,
    duty:{status:'NOT STARTED',dutyStart:null,blockOut:null,takeoff:null,landing:null,blockIn:null,dutyEnd:null},
    finance:{
      charterRevenue:Number(a.revenue??read('revenue')??0),
      fees:Number(read('fees')||0),
      cateringGround:Number(read('catering')||0),
      otherExpense:Number(read('otherExpense')||0),
      paymentStatus:'UNPAID'
    }
  };

  // Keep the trip dossier in sync automatically.
  s.tripDossier=s.tripDossier||{};
  s.tripDossier.client=a.client||s.tripDossier.client||'Sierra Executive Client';
  s.tripDossier.title=a.mission||s.tripDossier.title||'Executive Charter';
  s.tripDossier.legs=Array.isArray(s.tripDossier.legs)?s.tripDossier.legs:[];
  const exists=s.tripDossier.legs.some(x=>String(x.id||x.flight||'')===fid);
  if(!exists){
    s.tripDossier.legs.push({
      id:fid,
      origin:a.origin||read('origin'),
      destination:a.dest||a.destination||read('destination'),
      date:a.departureDate||read('depDate'),
      departure:a.departureTime||read('depTime'),
      pax:Number(a.pax||0),
      bags:Number(a.bags||0),
      revenue:Number(a.revenue||0),
      aircraft:a.aircraft||s.activeAircraft||s.selectedAircraft||'',
      status:'accepted',
      mission:a.mission||read('mission'),
      client:a.client||read('clientName')
    });
    s.tripDossier.activeLeg=s.tripDossier.legs.length-1;
  }

  persist();
}
function updatePackageFromWorkflow(stage){
  const s=getState(),p=s?.flightPackage;
  if(!s||!p)return;
  p.status=String(stage||s.workflow||'').toUpperCase();
  p.duty=p.duty||{};
  if(stage==='duty')p.duty.dutyStart=read('dutyStart')||now();
  if(stage==='departed'){p.duty.blockOut=read('blockOut')||now();p.duty.takeoff=read('takeoffTime')||now();}
  if(stage==='landed')p.duty.landing=read('landingTime')||now();
  if(stage==='parked')p.duty.blockIn=read('blockIn')||now();
  persist();
}
function finishPackage(){
  const s=getState(),p=s?.flightPackage;
  if(!s||!p)return;
  p.status='CLOSED';p.closedAt=now();
  p.duty=p.duty||{};p.duty.dutyEnd=read('dutyEnd')||now();
  p.finance={
    ...p.finance,
    charterRevenue:Number(read('revenue')||p.finance?.charterRevenue||0),
    fees:Number(read('fees')||0),
    cateringGround:Number(read('catering')||0),
    otherExpense:Number(read('otherExpense')||0),
    paymentStatus:s.billingStage==='paid'?'PAID':'DUE'
  };
  s.completedTrips=Array.isArray(s.completedTrips)?s.completedTrips:[];
  s.completedTrips=s.completedTrips.filter(x=>x.id!==p.id);
  s.completedTrips.unshift(JSON.parse(JSON.stringify(p)));
  s.completedTrips=s.completedTrips.slice(0,100);
  s.lastFlightPackage=JSON.parse(JSON.stringify(p));
  persist();
}

const oldAccept=window.acceptMarket;
if(typeof oldAccept==='function'){
  window.acceptMarket=function(i){
    const result=oldAccept.apply(this,arguments);
    setTimeout(()=>{
      buildPackage();
      try{
        const ops=document.querySelector('nav.tabs .tab[data-tab="opsCenter"]');
        if(ops)ops.click();
        if(typeof render==='function' && document.getElementById('opsCenter')?.classList.contains('active'))render();
      }catch(e){}
      const msg=$('workflowMessage');
      const s=getState(),fid=s?.activeAssignment?.flight||read('flightId');
      if(msg&&fid)msg.textContent=fid+' accepted • complete flight package created automatically.';
    },120);
    return result;
  };
}

const oldStep=window.step;
if(typeof oldStep==='function'){
  window.step=async function(stage){
    const result=await oldStep.apply(this,arguments);
    updatePackageFromWorkflow(stage);
    return result;
  };
}

const oldClose=window.closeFlight;
if(typeof oldClose==='function'){
  window.closeFlight=function(){
    const s=getState(),fid=s?.flightPackage?.id||read('flightId');
    finishPackage();
    const result=oldClose.apply(this,arguments);
    if(fid){
      setTimeout(()=>{
        const st=getState();
        if(st?.lastFlightPackage?.id===fid){
          st.lastFlightPackage.status='CLOSED';
          persist();
        }
      },100);
    }
    return result;
  };
}

console.info('Sierra Executive automatic flight-package workflow active');
})();