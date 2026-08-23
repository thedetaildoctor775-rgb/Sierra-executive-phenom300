(function(){
  if(window.__sxKmevHomeBaseFix)return;
  window.__sxKmevHomeBaseFix=true;

  const HOME='KMEV';
  const originalEnsureFleet=typeof ensureFleet110==='function'?ensureFleet110:null;

  function enforceHomeOnly(){
    try{
      if(typeof state==='undefined'||!state)return;
      state.fleet=state.fleet||{};
      Object.values(state.fleet).forEach(a=>{if(a&&typeof a==='object')a.home=HOME;});
      state.homeBase=HOME;
      state.operatorHomeBase=HOME;
      if(typeof saveState==='function')saveState();
    }catch(err){console.error('KMEV home base update failed',err)}
  }

  // Wrap the fleet initializer so later sync/cloud refreshes cannot restore KRNO.
  if(originalEnsureFleet){
    ensureFleet110=function(...args){
      const result=originalEnsureFleet.apply(this,args);
      enforceHomeOnly();
      return result;
    };
  }

  function refreshHomeDisplay(){
    enforceHomeOnly();
    try{if(typeof renderFleet==='function')renderFleet();}catch(e){}
    try{
      const selected=typeof selectedAircraft==='function'?selectedAircraft():null;
      const el=document.getElementById('aircraftHome');
      if(el)el.textContent=(selected&&selected.home)||HOME;
    }catch(e){}
  }

  refreshHomeDisplay();
  setTimeout(refreshHomeDisplay,500);
  setTimeout(refreshHomeDisplay,1800);
  setInterval(enforceHomeOnly,10000);
  window.sxApplyHomeBaseKMEV=refreshHomeDisplay;
})();