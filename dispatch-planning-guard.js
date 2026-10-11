(()=>{
'use strict';
if(window.__sxDispatchPlanningGuardV1)return;
window.__sxDispatchPlanningGuardV1=true;
const el=id=>document.getElementById(id);
const input=(id,value)=>{const node=el(id);if(node)node.value=value;};
const label=(id,value)=>{const node=el(id);if(node)node.textContent=value;};
function currentState(){try{return typeof state!=='undefined'?state:null}catch(e){return null}}
function distanceFor(a,offer){
  const value=Number(offer?.distance||a?.distance);
  if(value>0)return value;
  // Common regional legs; used only to offer a conservative planning prompt.
  const key=[a?.origin,a?.dest].join('>');
  const known={'KLAX>KCRQ':75,'KCRQ>KLAX':75};
  return known[key]||null;
}
function clearStaleFields(){
  for(const id of ['route','simbriefOFP','blockFuel','tripFuel','taxiFuel','arrivalFuel','zfw','rampWeight','tow']){
    input(id,'');
    try{localStorage.setItem('p300_'+id,'')}catch(e){}
  }
}
function setSuggestedLevel(st,a,offer){
  const suggested=suggestLevel(distanceFor(a,offer));
  if(suggested){
    st.cruiseLevel=suggested;
    input('cruiseLevel',suggested);
  }
}
function suggestLevel(nm){
  if(!Number.isFinite(nm)||nm<=0)return '';
  if(nm<100)return 'FL160';
  if(nm<180)return 'FL220';
  if(nm<300)return 'FL280';
  if(nm<450)return 'FL340';
  if(nm<700)return 'FL390';
  return 'FL410';
}
function updateWarning(){
  const a=currentState()?.activeAssignment;
  if(!a)return;
  let note=el('sxDispatchPlanningAdvisory');
  const field=el('alternate');if(!field)return;
  if(!note){
    note=document.createElement('div');
    note.id='sxDispatchPlanningAdvisory';
    note.style.cssText='margin:8px 0;padding:9px 11px;border:1px solid #96783a;border-radius:6px;background:#211b10;color:#ead4a0;font-size:12px;line-height:1.5';
    field.parentElement?.appendChild(note);
  }
  const alt=field.value.trim().toUpperCase();
  const level=el('cruiseLevel')?.value||'—';
  const sb=currentState()?.simbrief;
  const matching=sb&&sb.origin===a.origin&&sb.destination===a.dest;
  note.textContent='Planning check • '+(alt?'Alternate '+alt+' entered — verify weather/minima and suitability.':'Alternate not entered — evaluate IFR alternate requirements and select a suitable airport before release.')+' Suggested cruise '+level+' (planning estimate only). '+(matching?'SimBrief route matches assignment; verify aircraft, date and fuel.':'A current matching SimBrief OFP is required before using flight-plan fuel or route data.');
}
function resetForAccepted(offer){
  const st=currentState(),a=st?.activeAssignment;if(!a)return;
  // Never transfer a previous OFP to a newly accepted assignment.
  st.simbrief=null;
  setSuggestedLevel(st,a,offer);
  clearStaleFields();
  label('simbriefStatus','NOT IMPORTED — NEW CHARTER');
  label('simbriefImportedAt','—');
  // Do not populate a guessed alternate as if it were approved.
  input('alternate','');
  a.alternate='';
  if(typeof saveAll==='function')saveAll();
  else if(typeof saveState==='function')saveState();
  updateWarning();
}
function install(){
  if(typeof acceptMarket!=='function')return false;
  if(!acceptMarket.__sxPlanningWrapped){
    const previous=acceptMarket;
    const wrapped=function(i){
      const st=currentState();const offer=st?.marketBoard?.[i];
      const before=st?.activeAssignment?.flight;
      const result=previous.apply(this,arguments);
      const after=currentState()?.activeAssignment?.flight;
      if(offer&&after===offer.flight&&after!==before)resetForAccepted(offer);
      return result;
    };
    wrapped.__sxPlanningWrapped=true;
    acceptMarket=wrapped;
  }
  if(typeof restoreSimBriefDisplay==='function'&&!restoreSimBriefDisplay.__sxPlanningWrapped){
    const previous=restoreSimBriefDisplay;
    const wrapped=function(){
      const st=currentState(),a=st?.activeAssignment,sb=st?.simbrief;
      if(a&&sb&&(sb.origin!==a.origin||sb.destination!==a.dest)){
        st.simbrief=null;
        input('simbriefOFP','');
        input('route','');
        label('simbriefStatus','STALE OFP — IMPORT REQUIRED');
        label('simbriefImportedAt','—');
        return;
      }
      const result=previous.apply(this,arguments);
      if(a&&!sb){label('simbriefStatus','NOT IMPORTED — NEW CHARTER');label('simbriefImportedAt','—');}
      return result;
    };
    wrapped.__sxPlanningWrapped=true;
    restoreSimBriefDisplay=wrapped;
  }
  document.addEventListener('input',e=>{if(e.target?.id==='alternate'||e.target?.id==='cruiseLevel')updateWarning();});
  // Repair a charter accepted before this guard was installed, without
  // invalidating a matching, newly imported OFP.
  const st=currentState(),a=st?.activeAssignment,sb=st?.simbrief;
  if(a&&String(st.workflow||'').toLowerCase()!=='completed'){
    const matching=sb&&sb.origin===a.origin&&sb.destination===a.dest;
    if(!matching){
      const offer=(st.marketBoard||[]).find(x=>x.flight===a.flight);
      st.simbrief=null;
      clearStaleFields();
      label('simbriefStatus','NOT IMPORTED — MATCHING OFP NEEDED');
      label('simbriefImportedAt','—');
      setSuggestedLevel(st,a,offer);
      if(typeof saveState==='function')saveState();
    }
  }
  updateWarning();
  return true;
}
if(!install())setTimeout(install,400);
console.info('Sierra dispatch flight-specific planning guard active');
})();