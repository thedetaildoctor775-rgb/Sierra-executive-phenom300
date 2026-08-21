(function(){
  if(typeof ensureSameDayOffer103!=='function'||window.__sxNortheastCapFix)return;
  window.__sxNortheastCapFix=true;
  const originalEnsureSameDayOffer103=ensureSameDayOffer103;
  ensureSameDayOffer103=function(){
    originalEnsureSameDayOffer103();
    if(typeof window.sxBoostNortheastMarket==='function')window.sxBoostNortheastMarket(true);
  };
  if(typeof window.sxBoostNortheastMarket==='function')window.sxBoostNortheastMarket(false);
})();
