(()=>{
const STATE_KEY='sierra_phenom300_state';
const DEFAULTS={
  N300SE:{tail:'N300SE',type:'Embraer Phenom 300E',model:'E55P',home:'KRNO',location:'KRNO',status:'Available'},
  N24NV:{tail:'N24NV',type:'Cessna Citation Longitude',model:'C700',home:'KRNO',location:'KRNO',status:'Available'},
  N88SX:{tail:'N88SX',type:'Cessna Citation X',model:'C750',home:'KRNO',location:'KRNO',status:'Available'},
  N72LX:{tail:'N72LX',type:'Cessna Citation Latitude',model:'C680A',home:'KRNO',location:'KRNO',status:'Available'}
};
const load=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return {}}};
const save=s=>localStorage.setItem(STATE_KEY,JSON.stringify(s));
function ensureFleet(s){s.fleet=s.fleet||{};Object.entries(DEFAULTS).forEach(([k,v])=>s.fleet[k]={...v,...(s.fleet[k]||{})});if(!s.selectedAircraft||!s.fleet[s.selectedAircraft])s.selectedAircraft='N300SE';save(s);return s}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function isBusy(s){return ['accepted','duty','fuel','boarded','ready','departed','landed','parked'].includes(String(s.workflow||'').toLowerCase())}
function selectAircraft(tail){const s=ensureFleet(load());if(isBusy(s)&&s.activeAircraft&&s.activeAircraft!==tail){alert('Finish or reset the active flight before switching aircraft.');return;}s.selectedAircraft=tail;if(!isBusy(s))s.activeAircraft=tail;save(s);render();window.dispatchEvent(new StorageEvent('storage',{key:STATE_KEY,newValue:JSON.stringify(s)}));}
function setLocation(tail){const s=ensureFleet(load()),a=s.fleet[tail];if(!a)return;const loc=prompt('Enter current airport ICAO for '+tail,a.location||a.home||'KRNO');if(!loc)return;a.location=loc.trim().toUpperCase();save(s);render();}
function render(){const host=document.getElementById('fleetPanelBody');if(!host)return;const s=ensureFleet(load());const selected=s.selectedAircraft;host.innerHTML=`<div class="fleetbar">${Object.values(s.fleet).map(a=>`<div class="fleet-aircraft ${selected===a.tail?'selected':''}"><div class="tail">${esc(a.tail)}</div><div style="font-size:16px;font-weight:800;margin-top:2px">${esc(a.type)}</div><div class="meta">${esc(a.model)} • ${esc(a.status||'Available')}</div><div class="meta">Location ${esc(a.location||a.home||'—')} • Home ${esc(a.home||'—')}</div><div class="toolbar" style="margin-top:10px"><button class="btn ${selected===a.tail?'':'secondary'}" data-select="${esc(a.tail)}">${selected===a.tail?'SELECTED':'SELECT AIRCRAFT'}</button><button class="btn secondary" data-loc="${esc(a.tail)}">SET LOCATION</button></div></div>`).join('')}</div>`;
  host.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>selectAircraft(b.dataset.select));
  host.querySelectorAll('[data-loc]').forEach(b=>b.onclick=()=>setLocation(b.dataset.loc));
}
function install(){
  const nav=document.querySelector('.tabs');
  if(!nav||document.querySelector('[data-tab="fleet"]'))return;
  const marketBtn=nav.querySelector('[data-tab="market"]');
  const btn=document.createElement('button');btn.className='tab';btn.dataset.tab='fleet';btn.textContent='Fleet';
  if(marketBtn?.nextSibling)nav.insertBefore(btn,marketBtn.nextSibling);else nav.appendChild(btn);
  const main=document.querySelector('main.content');
  if(!main)return;
  const panel=document.createElement('section');panel.id='fleet';panel.className='panel';panel.innerHTML='<div class="market-hero"><div><div class="market-title">Fleet</div><div class="market-sub">Sierra Executive aircraft</div></div></div><div class="card"><div class="label">Select Aircraft</div><div class="small" style="margin-top:4px">Choose the aircraft you want to use for the next charter. Aircraft location and selection are saved with your Career OS data.</div><div id="fleetPanelBody"></div></div>';
  main.appendChild(panel);
  btn.onclick=()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');panel.classList.add('active');
    const title=document.getElementById('pageTitle');if(title)title.textContent='Fleet';
    render();
  };
  render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
setInterval(()=>{if(!document.querySelector('[data-tab="fleet"]'))install()},1500);
})();