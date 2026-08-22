(()=>{
'use strict';

function text(id){
  return document.getElementById(id)?.textContent?.trim()||'';
}

function put(id,value){
  const el=document.getElementById(id);
  if(el&&el.textContent!==value)el.textContent=value;
}

function fixAvailabilityBanner(){
  try{
    const flightTop=text('flightTop');
    const noActiveFlight=!flightTop||flightTop==='NO ACTIVE ASSIGNMENT';
    if(!noActiveFlight)return;

    const tail=text('aircraftTail');
    const location=text('currentLocation');
    if(!tail||!location||location==='—')return;

    put('missionTop',`${tail} available at ${location}`);
    put('originTop',location);
    put('destTop','—');
    put('altTop','—');
    put('depTop','—');
    put('dateTop','—');
  }catch(err){
    console.warn('Availability banner fix failed',err);
  }
}

fixAvailabilityBanner();
setTimeout(fixAvailabilityBanner,250);
setTimeout(fixAvailabilityBanner,1000);
setInterval(fixAvailabilityBanner,1000);

console.info('Sierra availability banner fix active');
})();
