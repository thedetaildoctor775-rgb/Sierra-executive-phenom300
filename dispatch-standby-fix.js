(function(){
  if(window.__sxDispatchStandbyFix)return;
  window.__sxDispatchStandbyFix=true;

  const standbyHtml='<div class="sx-day">SIERRA EXECUTIVE • DISPATCH</div><div class="sx-bubble sx-in">Dispatch standby. Accept a charter to start a trip thread.<div class="sx-time">STANDBY</div></div>';

  function appState(){
    try{
      if(typeof state!=='undefined'&&state)return state;
      return JSON.parse(localStorage.getItem('sierra_phenom300_state')||'{}')||{};
    }catch{return {}}
  }

  function hasRealAssignment(){
    const s=appState();
    const a=s.activeAssignment||s.activeFlight||s.currentFlight;
    if(!a||typeof a!=='object')return false;
    return !!(a.flight||a.id||a.callsign||((a.origin||a.departure)&&(a.dest||a.destination||a.arrival)));
  }

  function enforceStandby(){
    const phone=document.getElementById('sxDispatchPhone');
    if(!phone)return;
    const msgs=document.getElementById('sxDispatchMsgs');
    const quick=document.getElementById('sxQuickReplies');
    const input=document.getElementById('sxDispatchInput');
    const send=document.getElementById('sxDispatchSend');
    const trip=document.getElementById('sxTripBar');
    const badge=document.getElementById('sxDispatchBadge');

    if(!hasRealAssignment()){
      phone.dataset.dispatchStandby='1';
      if(trip)trip.textContent='Dispatch standby • No active charter';
      if(msgs&&msgs.innerHTML!==standbyHtml)msgs.innerHTML=standbyHtml;
      if(quick)quick.innerHTML='';
      if(input){input.value='';input.disabled=true;input.placeholder='Accept a charter to message Dispatch';}
      if(send)send.disabled=true;
      if(badge){badge.style.display='none';badge.textContent='';}
    }else if(phone.dataset.dispatchStandby==='1'){
      phone.dataset.dispatchStandby='0';
      if(input){input.disabled=false;input.placeholder='Message Dispatch…';}
      if(send)send.disabled=false;
    }
  }

  enforceStandby();
  setInterval(enforceStandby,500);
})();