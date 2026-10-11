(()=>{
'use strict';
if(window.__sxDashboardUI)return;window.__sxDashboardUI=true;
const CSS=`
#sxRealismSuite{max-width:none!important;background:linear-gradient(145deg,#102831,#0b151c)!important;border:1px solid #287785!important;box-shadow:0 12px 32px #0005;font:inherit}
#sxRealismSuite *{box-sizing:border-box}
#sxRealismSuite h3{letter-spacing:.06em;font-size:1.15rem;margin:0 0 12px}
#sxRealismSuite>p{color:#9db8c1;font-size:.88rem}
#sxRealismSuite table{border-collapse:collapse;min-width:620px;font-size:.88rem}
#sxRealismSuite th{color:#78dce6;text-transform:uppercase;font-size:.72rem;letter-spacing:.07em}
#sxRealismSuite th,#sxRealismSuite td{padding:12px 10px;border-bottom:1px solid #31505b}
#sxRealismSuite details{display:none;border:1px solid #284b58;border-radius:12px;padding:16px;background:#142932;margin:0}
#sxRealismSuite details[open]{display:block}
#sxRealismSuite summary{color:#d6f8fc;cursor:pointer;font-size:1rem;margin-bottom:12px}
#sxRealismSuite input,#sxRealismSuite select,#sxRealismSuite textarea{background:#0a1c25!important;color:#f0fbff!important;border:1px solid #4b7886!important;border-radius:7px!important;padding:10px!important;max-width:100%;min-height:40px}
#sxRealismSuite input::placeholder{color:#9db2bd}
#sxRealismSuite button,#sxVipPlanner button{background:#126778!important;color:#fff!important;border:1px solid #3aa8b5!important;border-radius:8px!important;padding:10px 13px!important;font-weight:650!important;min-height:40px;cursor:pointer}
#sxRealismSuite button:hover,#sxVipPlanner button:hover{background:#188296!important}
#sxRealismSuite .sxNav{display:flex;gap:8px;overflow-x:auto;scrollbar-width:thin;padding:5px 0 15px;margin-bottom:8px}
#sxRealismSuite .sxNav button{white-space:nowrap;flex-shrink:0;background:#193741!important;border-color:#2e6571!important}
#sxRealismSuite .sxNav button[aria-selected=true]{background:#1b899a!important;border-color:#65d6e0!important;box-shadow:inset 0 -3px 0 #b3f6fb}
#sxRealismSuite .sxPanel{display:none}
#sxRealismSuite .sxPanel.sxCurrent{display:block}
#sxRealismSuite .sxStatGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:8px 0 15px}
#sxRealismSuite .sxStat{padding:13px;border:1px solid #295763;border-radius:10px;background:#10242d}
#sxRealismSuite .sxStat strong{display:block;font-size:1.2rem;color:#a9eff5;margin-top:5px}
#sxVipPlanner{background:#10242d!important;border:1px solid #2a6974!important}
#sxVipPlanner input{background:#0b1c24!important;color:#fff!important;border:1px solid #4b7886!important;border-radius:7px!important;padding:10px!important}
@media(max-width:650px){#sxRealismSuite{padding:12px!important}#sxRealismSuite details{padding:10px}#sxRealismSuite th,#sxRealismSuite td{padding:8px 6px}}
`;
if(!document.getElementById('sxDashboardStyles')){const st=document.createElement('style');st.id='sxDashboardStyles';st.textContent=CSS;document.head.appendChild(st)}
let tab='Fleet';
const tabs=['Fleet','Dispatch','Crew','Maintenance','Finance','VIP Clients','Events','Career'];
function decorate(){
 const root=document.getElementById('sxRealismSuite');if(!root)return;
 const details=Array.from(root.querySelectorAll(':scope > details'));
 if(details.length!==7)return;
 let nav=root.querySelector('.sxNav');
 if(!nav){nav=document.createElement('nav');nav.className='sxNav';nav.setAttribute('aria-label','Sierra operations sections');const heading=root.querySelector('h3');heading?.insertAdjacentElement('afterend',nav)}
 nav.innerHTML=tabs.map(x=>'<button type="button" data-sx-tab="'+x+'" aria-selected="'+(x===tab)+'">'+x+'</button>').join('');
 const board=root.querySelector('table')?.parentElement;
 const panels=[board,details[0],details[1],details[2],details[3],details[4],details[5],details[6]];
 panels.forEach((el,i)=>{if(!el)return;el.classList.add('sxPanel');el.classList.toggle('sxCurrent',tabs[i]===tab);if(el.tagName==='DETAILS')el.open=true});
 const stats=root.querySelector('.sxStatGrid')||document.createElement('div');
 stats.className='sxStatGrid';
 const s=typeof state!=='undefined'?state:{},fleet=s.fleet||{},active=s.activeAssignment;
 const count=Object.values(fleet).filter(a=>a.status==='Available').length;
 stats.innerHTML='<div class="sxStat">Fleet aircraft<strong>3</strong></div><div class="sxStat">Available reported<strong>'+count+'</strong></div><div class="sxStat">Active charter<strong>'+(active?String(active.flight).replace(/[^A-Z0-9]/gi,''):'None')+'</strong></div><div class="sxStat">Home base<strong>KMEV</strong></div>';
 nav.insertAdjacentElement('afterend',stats);
 nav.querySelectorAll('[data-sx-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.sxTab;decorate()});
}
const observe=()=>{
 const root=document.getElementById('sxRealismSuite');
 if(!root){setTimeout(observe,700);return}
 const observer=new MutationObserver(()=>{if(root.__sxUpdating)return;root.__sxUpdating=true;observer.disconnect();decorate();observer.observe(root,{childList:true,subtree:false});root.__sxUpdating=false});
 decorate();observer.observe(root,{childList:true,subtree:false});
};
setTimeout(observe,2300);
})();