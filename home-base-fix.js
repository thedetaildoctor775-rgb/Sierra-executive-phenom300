(function(){
  if(window.__sxKmevHomeBaseFix)return;
  window.__sxKmevHomeBaseFix=true;

  const HOME='KMEV';

  function applyHomeBase(){
    try{
      if(typeof state==='undefined'||!state)return;
      if(typeof ensureFleet110==='function')ensureFleet110();
      state.fleet=state.fleet||{};
      const selected=state.selectedAircraft&&state.fleet[state.selectedAircraft]
        ? state.fleet[state.selectedAircraft]
        : state.fleet.N300SE;

      Object.values(state.fleet).forEach(a=>{if(a&&typeof a==='object')a.home=HOME;});

      // Only move the aircraft to KMEV automatically when there is no active flight.
      const active=state.activeAssignment||state.activeAircraft||
        (state.workflow&&!['scheduled','completed'].includes(String(state.workflow).toLowerCase()));
      if(!active){
        if(selected)selected.location=HOME;
        if(state.career)state.career.location=HOME;
        state.marketLocation=HOME;
        state.marketBoard=[];
        state.marketSeeded=false;
      }

      state.homeBase=HOME;
      state.operatorHomeBase=HOME;
      if(typeof saveState==='function')saveState();
      if(!active&&typeof seedMarket==='function')seedMarket(true);
      if(typeof renderFleet==='function')renderFleet();
      if(typeof renderMarket==='function')renderMarket();
    }catch(err){console.error('KMEV home base update failed',err)}
  }

  applyHomeBase();
  setTimeout(applyHomeBase,800);
  window.sxApplyHomeBaseKMEV=applyHomeBase;
})();