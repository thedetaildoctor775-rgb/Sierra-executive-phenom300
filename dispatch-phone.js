(function(){
  if(window.__sxDispatchPhone)return;
  window.__sxDispatchPhone=true;

  const DISPATCHER='Benjamin Cole';
  const STORAGE_KEY='sx_dispatch_threads_v1';
  const css=`
  #sxDispatchFab{position:fixed;right:22px;bottom:22px;z-index:2147483000;width:58px;height:58px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:#111927;color:#fff;box-shadow:0 14px 40px rgba(0,0,0,.45);font-size:24px;cursor:pointer}
  #sxDispatchBadge{position:absolute;right:-2px;top:-3px;min-width:20px;height:20px;border-radius:10px;padding:0 5px;background:#df4e4e;color:#fff;font:700 11px/20px -apple-system,BlinkMacSystemFont,sans-serif;display:none}
  #sxDispatchPhone{position:fixed;right:22px;bottom:92px;z-index:2147482999;width:min(370px,calc(100vw - 24px));height:min(690px,calc(100vh - 120px));background:#0d1420;border:1px solid rgba(255,255,255,.16);border-radius:34px;box-shadow:0 24px 70px rgba(0,0,0,.58);overflow:hidden;display:none;color:#eef4fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  #sxDispatchPhone.open{display:flex;flex-direction:column}
  .sx-notch{width:112px;height:22px;border-radius:0 0 14px 14px;background:#03060a;margin:0 auto;flex:0 0 auto}
  .sx-d-head{padding:9px 16px 12px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px;background:linear-gradient(180deg,#121c2a,#0d1420)}
  .sx-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#24344b;font-weight:800;color:#f3cf7a}
  .sx-d-name{font-weight:800;font-size:15px}.sx-d-sub{font-size:11px;color:#93a4b8;margin-top:2px}.sx-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#53d889;margin-right:5px}
  .sx-close{margin-left:auto;border:0;background:transparent;color:#9fb0c1;font-size:22px;cursor:pointer;padding:6px}
  .sx-tripbar{padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.07);background:#0a111b;color:#b8c7d5;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #sxDispatchMsgs{flex:1;overflow:auto;padding:14px 12px;background:radial-gradient(circle at 40% 0,#142031 0,#0a1019 44%,#070c13 100%)}
  .sx-day{text-align:center;color:#6f8397;font-size:10px;margin:8px 0 12px}
  .sx-bubble{max-width:82%;padding:10px 12px;border-radius:17px;margin:6px 0;font-size:13px;line-height:1.34;white-space:pre-wrap;box-shadow:0 4px 12px rgba(0,0,0,.12)}
  .sx-in{background:#182536;border-bottom-left-radius:5px;color:#eef4fb}.sx-out{background:#b8974f;color:#101318;margin-left:auto;border-bottom-right-radius:5px}
  .sx-time{font-size:9px;opacity:.58;margin-top:5px;text-align:right}
  #sxQuickReplies{padding:8px 10px;display:flex;gap:6px;overflow-x:auto;border-top:1px solid rgba(255,255,255,.06);background:#0c131e}
  .sx-chip{flex:0 0 auto;border:1px solid #4a5b6d;background:#111c29;color:#dfe9f2;border-radius:999px;padding:7px 10px;font-size:11px;cursor:pointer}
  .sx-compose{display:flex;gap:7px;padding:10px;background:#0d1420;border-top:1px solid rgba(255,255,255,.08)}
  #sxDispatchInput{flex:1;min-width:0;border:1px solid #354558;background:#0a111a;color:#eef4fb;border-radius:18px;padding:9px 12px;font-size:13px;outline:none}
  #sxDispatchSend{width:38px;height:38px;border-radius:50%;border:0;background:#c4a65d;color:#101318;font-weight:900;cursor:pointer}
  @media(max-width:700px){#sxDispatchPhone{right:8px;bottom:78px;width:calc(100vw - 16px);height:calc(100vh - 100px);border-radius:28px}#sxDispatchFab{right:14px;bottom:14px}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  const fab=document.createElement('button');
  fab.id='sxDispatchFab';fab.innerHTML='💬<span id="sxDispatchBadge"></span>';fab.setAttribute('aria-label','Open Sierra Dispatch');
  const phone=document.createElement('div');phone.id='sxDispatchPhone';
  phone.innerHTML=`<div class="sx-notch"></div><div class="sx-d-head"><div class="sx-avatar">BC</div><div><div class="sx-d-name">${DISPATCHER}</div><div class="sx-d-sub"><span class="sx-dot"></span>Sierra Dispatch • online</div></div><button class="sx-close" aria-label="Close">×</button></div><div class="sx-tripbar" id="sxTripBar">No active charter</div><div id="sxDispatchMsgs"></div><div id="sxQuickReplies"></div><div class="sx-compose"><input id="sxDispatchInput" placeholder="Message Dispatch…" autocomplete="off"><button id="sxDispatchSend">↑</button></div>`;
  document.body.appendChild(phone);document.body.appendChild(fab);

  const q=s=>document.querySelector(s),msgs=q('#sxDispatchMsgs'),badge=q('#sxDispatchBadge'),tripbar=q('#sxTripBar'),input=q('#sxDispatchInput');
  let open=false,unread=0,opsTimer=null;

  function appState(){try{return typeof state!=='undefined'&&state?state:JSON.parse(localStorage.getItem('sierra_phenom300_state')||'{}')}catch{return {}}}
  function activeTrip(){const s=appState();let a=s.activeAssignment||s.activeFlight||s.currentFlight||null;if(!a&&Array.isArray(s.marketBoard))a=s.marketBoard.find(x=>x&&x.status==='Accepted')||null;return a||{} }
  function key(){const a=activeTrip();return String(a.flight||a.id||a.callsign||'general')}
  function allThreads(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
  function thread(){const all=allThreads();return all[key()]||[]}
  function saveThread(t){const all=allThreads();all[key()]=t.slice(-80);localStorage.setItem(STORAGE_KEY,JSON.stringify(all))}
  function now(){return new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}
  function classify(a){const text=[a.category,a.charterType,a.client,a.event].join(' ').toLowerCase();if(/athlete|sports|team|player|arena/.test(text))return'sports';if(/celebrity|artist|talent|music|record|production|media|entertain/.test(text))return'talent';if(/vip|family office|principal|security/.test(text))return'vip';return'exec'}
  function route(a){return [a.origin,a.dest||a.destination].filter(Boolean).join(' → ')||'Active charter'}
  function add(who,text,quiet){const t=thread();t.push({who,text,time:now(),ts:Date.now()});saveThread(t);if(who==='dispatch'&&!open&&!quiet){unread++;updateBadge()}renderMessages()}
  function updateBadge(){badge.textContent=unread>9?'9+':String(unread);badge.style.display=unread?'block':'none'}
  function seed(){const a=activeTrip();const t=thread();if(t.length)return;const c=classify(a),rt=route(a),client=a.client||'the client';add('dispatch',`Morning. I have ${rt} on my board${a.flight?' as '+a.flight:''}. I’ll keep you posted on passenger, FBO and ground details.`,true);if(c==='sports')add('dispatch',`Sports movement today. ${client} wants a clean, low-friction departure. I’ll flag any agent or passenger timing changes.`,true);else if(c==='talent')add('dispatch',`Talent movement today. ${client} is asking for discreet boarding and minimal ramp exposure. I’ll handle any last-minute schedule changes.`,true);else if(c==='vip')add('dispatch',`VIP movement today. I’m tracking security, vehicle timing and privacy requests for ${client}.`,true);else add('dispatch',`Executive charter today. I’m tracking car service, passenger ETA and any schedule shifts for ${client}.`,true);}
  function renderMessages(){seed();const t=thread();msgs.innerHTML='<div class="sx-day">SIERRA EXECUTIVE • DISPATCH</div>'+t.map(m=>`<div class="sx-bubble ${m.who==='me'?'sx-out':'sx-in'}">${esc(m.text)}<div class="sx-time">${esc(m.time||'')}</div></div>`).join('');msgs.scrollTop=msgs.scrollHeight;renderQuick()}
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function renderQuick(){const a=activeTrip(),c=classify(a);let items=['Ready to push','Passenger status','Check weather','Ground transport'];if(c==='talent')items=['Passenger ETA','Discreet boarding','Catering status','Ready to push'];if(c==='sports')items=['Player ETA','Bags/equipment','SUV status','Ready to push'];if(c==='vip')items=['Principal ETA','Security status','SUV status','Ready to push'];q('#sxQuickReplies').innerHTML=items.map(x=>`<button class="sx-chip" data-msg="${esc(x)}">${esc(x)}</button>`).join('');q('#sxQuickReplies').querySelectorAll('.sx-chip').forEach(b=>b.onclick=()=>send(b.dataset.msg))}
  function updateTripbar(){const a=activeTrip();tripbar.textContent=(a.flight?`${a.flight} • `:'')+route(a)+(a.client?` • ${a.client}`:'')}
  function response(text){const a=activeTrip(),c=classify(a),l=text.toLowerCase(),dest=a.dest||a.destination||'destination';if(/ready|push/.test(l))return`Copy. I have you marked ready. I’ll keep the line open and let you know immediately if anything changes before push.`;if(/weather/.test(l))return`Copy. I’m checking the destination weather package for ${dest}. No action needed from you right now; I’ll message if it affects timing or the plan.`;if(/fuel/.test(l))return`Fuel is on the ops list. I’ll confirm the release and uplift status with the FBO before departure.`;if(/cater/.test(l))return c==='talent'?`Catering is being handled with the client profile. I’ll flag any last-minute rider change.`:`Catering is on the order. I’ll confirm once the FBO marks it delivered.`;if(/suv|transport|car/.test(l))return`Ground transport is being tracked. I’ll send you the vehicle status and pickup point as soon as it’s confirmed.`;if(/passenger|player|principal|eta/.test(l))return c==='sports'?`Agent has the movement. Current plan is passengers on property shortly before departure; I’ll give you a heads-up when they’re actually inbound.`:c==='talent'?`Management has the movement. I’m watching the arrival window and will give you the actual curb/ramp ETA when it firms up.`:c==='vip'?`Security has the movement. I’ll give you the principal’s arrival window when the vehicle checks in.`:`Passenger timing is being tracked. I’ll send the actual arrival estimate when dispatch gets it.`;if(/bag|equipment/.test(l))return`Copy. I’ve noted the baggage/equipment load. I’ll flag anything that changes the cabin or baggage plan.`;if(/security|discreet|privacy/.test(l))return`Understood. I’ll keep the handling discreet and coordinate the boarding side with the FBO.`;if(/delay|late/.test(l))return`Copy. I’m marking the delay and protecting the downstream services. Keep me posted if your new estimate changes.`;return`Copy. I’ve got it on the trip. I’ll message you if it changes anything operationally.`}
  function send(text){text=String(text||input.value||'').trim();if(!text)return;add('me',text,true);input.value='';setTimeout(()=>add('dispatch',response(text)),650+Math.random()*650)}
  function scheduleOps(){clearTimeout(opsTimer);const a=activeTrip();if(!a||!a.flight)return;const c=classify(a);const bank={sports:[`Agent update: passenger timing is still holding. I’ll ping you when the player vehicle checks in.`,`Ground team has the baggage/equipment note. No change to departure time right now.`],talent:[`Management update: client still wants discreet boarding. FBO has the handling note.`,`Passenger window is still holding. I’ll send the actual vehicle ETA when it’s confirmed.`],vip:[`Security note is on file with the FBO. I’ll message when the principal vehicle is inbound.`,`SUV coordination is still on schedule. No change to wheels-up at the moment.`],exec:[`Passenger timing is holding. Car service and FBO handling are both still tracking.`,`No schedule change right now. I’ll let you know if the client moves wheels-up.`]};opsTimer=setTimeout(()=>{const arr=bank[c]||bank.exec;add('dispatch',arr[Math.floor(Math.random()*arr.length)]);scheduleOps()},90000+Math.random()*90000)}
  function openPhone(){open=true;phone.classList.add('open');unread=0;updateBadge();updateTripbar();renderMessages();setTimeout(()=>input.focus(),150)}
  function closePhone(){open=false;phone.classList.remove('open')}
  fab.onclick=()=>open?closePhone():openPhone();q('.sx-close').onclick=closePhone;q('#sxDispatchSend').onclick=()=>send();input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send()}});

  updateTripbar();seed();renderMessages();scheduleOps();
  setInterval(()=>{const before=tripbar.textContent;updateTripbar();if(before!==tripbar.textContent){renderMessages();scheduleOps()}},8000);
})();