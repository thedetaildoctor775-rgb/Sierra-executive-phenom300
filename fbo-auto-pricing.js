(()=>{
'use strict';

const FBO_RUNTIME_VERSION='20260823-fbo2';
let sxLastDynamicPricing=null;
let sxFboRefreshTimer=null;

function sxTail(){
  return state?.activeAircraft||state?.activeAssignment?.aircraft||state?.selectedAircraft||'';
}

function sxAutoAircraftClass(){
  const tail=sxTail().toUpperCase();
  if(tail==='N72LX')return 'midsize';          // Citation Latitude
  if(tail==='N24NV')return 'super_midsize';   // Citation Longitude
  if(tail==='N88SX')return 'super_midsize';   // Citation X
  if(tail==='N300SE')return 'light';          // Phenom 300E
  const a=state?.fleet?.[tail]||{};
  const hay=String(a.model||a.type||a.name||a.icao||'').toLowerCase();
  if(/longitude|citation x|c750|c700/.test(hay))return 'super_midsize';
  if(/latitude|c680a|midsize/.test(hay))return 'midsize';
  if(/heavy|large|gulfstream|global|challenger 60|falcon 7/.test(hay))return 'heavy';
  return 'light';
}

try{sxAircraftFeeClass=sxAutoAircraftClass;}catch(e){}

function sxFuelGallons(){
  const lb=Number(val('fboFuelOrder')||0);
  return lb>0?lb/6.7:0;
}

function sxChecked(id){return !!g(id)?.checked;}
function sxMoney(n){return '$'+Math.round(Number(n||0)).toLocaleString();}

function sxEnsureDynamicPricingUi(){
  if(!g('fbo')||g('fboDynamicPricing'))return;
  const anchor=g('fboTotalCost')?.closest('.grid4')||g('fboPriceUpdated')?.closest('.grid4');
  if(!anchor)return;
  const wrap=document.createElement('div');
  wrap.id='fboDynamicPricing';
  wrap.innerHTML=`
    <div class="divider"></div>
    <div class="label">Automatic Service Pricing</div>
    <div class="grid4" style="margin-top:10px">
      <div class="stat"><div class="label">Handling</div><b id="sxFeeHandling">—</b></div>
      <div class="stat"><div class="label">GPU</div><b id="sxFeeGpu">—</b></div>
      <div class="stat"><div class="label">Lav / Water</div><b id="sxFeeLavWater">—</b></div>
      <div class="stat"><div class="label">Parking / Hangar</div><b id="sxFeeParking">—</b></div>
    </div>
    <div class="grid4" style="margin-top:10px">
      <div class="stat"><div class="label">Baggage</div><b id="sxFeeBaggage">—</b></div>
      <div class="stat"><div class="label">Catering</div><b id="sxFeeCatering">—</b></div>
      <div class="stat"><div class="label">Ground Transport</div><b id="sxFeeTransport">—</b></div>
      <div class="stat"><div class="label">Deicing</div><b id="sxFeeDeice">—</b></div>
    </div>
    <div id="sxPricingNote" class="note" style="margin-top:9px">Fuel is live when a source reports it. Other FBO fees are automatically estimated for this airport, aircraft and passenger load.</div>`;
  anchor.insertAdjacentElement('afterend',wrap);
}

function sxServiceFee(data,key,checkboxId){
  return sxChecked(checkboxId)?Number(data?.[key]||0):0;
}

function sxRenderDynamicFees(data){
  sxEnsureDynamicPricingUi();
  if(!data)return;
  const fuelGal=sxFuelGallons();
  const useWaiver=!!data.handling_waiver_likely && sxChecked('svcFuel') && fuelGal>=Number(data.handling_waiver_threshold_gal||Infinity);
  const handling=useWaiver?Number(data.handling_fee_after_estimated_fuel_waiver||0):Number(data.handling_fee||0);
  if(g('sxFeeHandling'))g('sxFeeHandling').textContent=sxMoney(handling)+(useWaiver?'*':'');
  if(g('sxFeeGpu'))g('sxFeeGpu').textContent=sxChecked('svcGPU')?sxMoney(data.gpu_fee):'NOT REQ';
  const lw=sxServiceFee(data,'lav_fee','svcLav')+sxServiceFee(data,'potable_water_fee','svcWater');
  if(g('sxFeeLavWater'))g('sxFeeLavWater').textContent=lw?sxMoney(lw):'NOT REQ';
  const park=sxServiceFee(data,'parking_fee','svcParking');
  if(g('sxFeeParking'))g('sxFeeParking').textContent=park?sxMoney(park):'NOT REQ';
  if(g('sxFeeBaggage'))g('sxFeeBaggage').textContent=sxChecked('svcBaggage')?sxMoney(data.baggage_handling_fee):'NOT REQ';
  if(g('sxFeeCatering'))g('sxFeeCatering').textContent=sxChecked('svcCatering')?sxMoney(data.catering_fee):'NOT REQ';
  if(g('sxFeeTransport'))g('sxFeeTransport').textContent=sxChecked('svcTransport')?sxMoney(data.ground_transport_fee):'NOT REQ';
  if(g('sxFeeDeice'))g('sxFeeDeice').textContent=sxChecked('svcDeice')?sxMoney(data.deice_fee):'NOT REQ';
  if(g('sxPricingNote')){
    const mult=Number(data.airport_cost_multiplier||1).toFixed(2);
    const cls=sxAutoAircraftClass().replace('_',' ').toUpperCase();
    g('sxPricingNote').textContent=(data.fuel_live?'LIVE FUEL • ':'FUEL ESTIMATE/UNAVAILABLE • ')+'SERVICES AUTO-ESTIMATED • '+(val('origin')||'—')+' airport factor '+mult+'× • '+cls+(useWaiver?' • *handling waiver estimated from fuel uplift; confirm with FBO':'');
  }
}

function sxApplyDynamicServiceInputs(data){
  if(!data)return;
  sxLastDynamicPricing=data;
  const fuelGal=sxFuelGallons();
  const useWaiver=!!data.handling_waiver_likely && sxChecked('svcFuel') && fuelGal>=Number(data.handling_waiver_threshold_gal||Infinity);
  const handling=useWaiver?Number(data.handling_fee_after_estimated_fuel_waiver||0):Number(data.handling_fee||0);
  set('fboHandlingFee',Math.round(handling||0));
  if(sxChecked('svcCatering'))set('fboCateringCost',Math.round(Number(data.catering_fee||0)));
  else set('fboCateringCost','0');
  if(sxChecked('svcTransport'))set('fboTransportCost',Math.round(Number(data.ground_transport_fee||0)));
  else set('fboTransportCost','0');
  sxRenderDynamicFees(data);
}

const sxOldCalcFboCosts=typeof calcFboCosts==='function'?calcFboCosts:null;
calcFboCosts=function(){
  const fuelLb=Number(val('fboFuelOrder')||0);
  const fuelPrice=Number(val('fboFuelPrice')||0);
  const fuelGal=fuelLb>0?fuelLb/6.7:0;
  const fuelCost=(sxChecked('svcFuel')&&fuelGal>0&&fuelPrice>0)?fuelGal*fuelPrice:0;
  if(g('fboFuelCost'))set('fboFuelCost',fuelCost?fuelCost.toFixed(2):'0');

  const d=sxLastDynamicPricing||{};
  const useWaiver=!!d.handling_waiver_likely && sxChecked('svcFuel') && fuelGal>=Number(d.handling_waiver_threshold_gal||Infinity);
  const handling=Number(val('fboHandlingFee')||0);
  const catering=sxChecked('svcCatering')?Number(val('fboCateringCost')||0):0;
  const transport=sxChecked('svcTransport')?Number(val('fboTransportCost')||0):0;
  const gpu=sxServiceFee(d,'gpu_fee','svcGPU');
  const lav=sxServiceFee(d,'lav_fee','svcLav');
  const water=sxServiceFee(d,'potable_water_fee','svcWater');
  const baggage=sxServiceFee(d,'baggage_handling_fee','svcBaggage');
  const parking=sxServiceFee(d,'parking_fee','svcParking');
  const deice=sxServiceFee(d,'deice_fee','svcDeice');
  const total=handling+fuelCost+catering+transport+gpu+lav+water+baggage+parking+deice;

  if(g('fboTotalCost'))g('fboTotalCost').textContent=sxMoney(total);
  state.fboEstimatedCost=total;
  state.fboCostBreakdown={fuel:fuelCost,handling,catering,transport,gpu,lav,water,baggage,parking,deice,fuelGallons:fuelGal,fuelPrice,handlingWaiverEstimated:useWaiver};
  if(g('fboFuelStatus'))g('fboFuelStatus').textContent=sxChecked('svcFuel')?(fuelLb?fuelLb+' lb / '+fuelGal.toFixed(0)+' gal':'REQUESTED'):'NOT REQ';
  if(g('fboCateringStatus'))g('fboCateringStatus').textContent=sxChecked('svcCatering')?'REQUESTED':'NOT REQ';
  if(g('fboTransportStatus'))g('fboTransportStatus').textContent=sxChecked('svcTransport')?'REQUESTED':'NOT REQ';
  sxRenderDynamicFees(d);
  return total;
};

sxApplyServiceEstimates=function(){
  if(sxLastDynamicPricing)sxApplyDynamicServiceInputs(sxLastDynamicPricing);
};

sxApplyLivePriceData=function(data,fromCache=false){
  if(!data)return;
  sxLastDynamicPricing=data;
  if(data.fbo_name && (!val('fboName') || val('fboName').includes('/')))set('fboName',data.fbo_name);
  if(Number(data.jet_a)>0)set('fboFuelPrice',Number(data.jet_a).toFixed(2));
  else if(!data.fuel_live)set('fboFuelPrice','0');

  sxApplyDynamicServiceInputs(data);
  const source=data.source||'Sierra Estimate';
  const freshness=data.price_updated||data.checked_at||'';
  const formattedFreshness=typeof sxFormatPriceUpdated==='function'?sxFormatPriceUpdated(freshness):String(freshness||'—');
  set('fboPricingSourceValue',source+(data.fuel_live?' • live fuel':' • service estimate'));
  set('fboPriceUpdatedValue',formattedFreshness);
  if(g('fboPricingSource'))g('fboPricingSource').textContent=source+(data.fuel_live?' • LIVE FUEL':' • ESTIMATE');
  if(g('fboPriceStatus'))g('fboPriceStatus').textContent=data.fuel_live?(fromCache?'CACHED LIVE':'LIVE'):'LIVE FUEL UNAVAILABLE';
  if(g('fboPriceUpdated'))g('fboPriceUpdated').textContent=formattedFreshness;
  if(g('fboAutoPricingStatus'))g('fboAutoPricingStatus').textContent='AUTO • '+sxAutoAircraftClass().replace('_',' ').toUpperCase();
  calcFboCosts();
  if(typeof syncFboSummary==='function')syncFboSummary();
};

refreshLiveFboPricing=async function(force=false){
  if(!g('fboFlight')||!val('origin'))return;
  const airport=(val('origin')||'').toUpperCase();
  const fbo=(val('fboName')||(typeof sxDefaultFboName==='function'?sxDefaultFboName():'')).split('/')[0].trim();
  const aircraftClass=sxAutoAircraftClass();
  const pax=Math.max(1,Number(val('paxCount')||4));
  const fuelGallons=sxFuelGallons();
  const key=[airport,fbo,aircraftClass,pax,Math.round(fuelGallons/25)*25].join('|').toUpperCase();
  state.fboPriceCache=state.fboPriceCache||{};
  const ttl=30*60*1000;
  const cached=state.fboPriceCache[key];
  if(!force&&cached&&(Date.now()-Number(cached.savedAt||0))<ttl){sxApplyLivePriceData(cached.data,true);return;}
  if(g('fboPriceStatus'))g('fboPriceStatus').textContent='CHECKING…';
  try{
    const url='/api/fbo-pricing?airport='+encodeURIComponent(airport)+'&fbo='+encodeURIComponent(fbo)+'&aircraftClass='+encodeURIComponent(aircraftClass)+'&pax='+encodeURIComponent(pax)+'&fuelGallons='+encodeURIComponent(fuelGallons.toFixed(0))+'&v='+FBO_RUNTIME_VERSION;
    const res=await fetch(url,{cache:'no-store'});
    const data=await res.json();
    if(!res.ok||!data.ok)throw new Error(data.error||'FBO pricing unavailable');
    state.fboPriceCache[key]={savedAt:Date.now(),data};
    sxApplyLivePriceData(data,false);
    saveState();
    try{scheduleCloudSave();}catch(e){}
    if(g('workflowMessage'))g('workflowMessage').textContent=data.fuel_live?'Live fuel + automatic FBO service pricing refreshed.':'Automatic FBO service pricing refreshed; live fuel was unavailable for this airport.';
  }catch(e){
    console.error('FBO auto pricing:',e);
    if(g('fboPriceStatus'))g('fboPriceStatus').textContent='PRICING ERROR';
    if(g('fboPricingSource'))g('fboPricingSource').textContent='ESTIMATE / MANUAL';
    if(g('workflowMessage'))g('workflowMessage').textContent='FBO pricing could not refresh. Existing values were kept.';
  }
};

function sxDebouncedRefresh(force=false){
  clearTimeout(sxFboRefreshTimer);
  sxFboRefreshTimer=setTimeout(()=>refreshLiveFboPricing(force),450);
}

function sxWireFboAutoPricing(){
  sxEnsureDynamicPricingUi();
  const serviceIds=['svcFuel','svcGPU','svcLav','svcWater','svcCatering','svcBaggage','svcTransport','svcParking','svcDeice'];
  serviceIds.forEach(id=>g(id)?.addEventListener('change',()=>{
    if(sxLastDynamicPricing)sxApplyDynamicServiceInputs(sxLastDynamicPricing);
    calcFboCosts();
    try{syncFboSummary();}catch(e){}
    if(id==='svcFuel')sxDebouncedRefresh(false);
  }));
  ['origin','fboName','paxCount','fboFuelOrder'].forEach(id=>g(id)?.addEventListener('change',()=>sxDebouncedRefresh(true)));
  g('fboFuelOrder')?.addEventListener('input',()=>{
    if(sxLastDynamicPricing)sxApplyDynamicServiceInputs(sxLastDynamicPricing);
    calcFboCosts();
  });
  const fboTab=document.querySelector('.tab[data-tab="fbo"]');
  fboTab?.addEventListener('click',()=>setTimeout(()=>refreshLiveFboPricing(false),150));
  setTimeout(()=>{if(g('fbo')&&val('origin'))refreshLiveFboPricing(false);},900);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sxWireFboAutoPricing);
else sxWireFboAutoPricing();

console.info('Sierra FBO automatic pricing v2 active');
})();
