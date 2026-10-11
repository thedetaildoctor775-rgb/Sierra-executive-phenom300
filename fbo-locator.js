(()=>{
'use strict';
if(window.__sxFboLocator)return;window.__sxFboLocator=true;
// Curated operators verified on AirNav October 2026. Unknown airports remain unverified.
const directory={
 KLAX:[{name:'Signature Aviation',address:'6201 W Imperial Highway, Los Angeles, CA',phone:'310-410-9605'},{name:'Atlantic Aviation',phone:'310-258-9884'}],
 KVNY:[{name:'Signature Aviation VNY West',phone:'818-464-9500'},{name:'Signature Aviation VNY North',address:'7415 Hayvenhurst Place, Van Nuys, CA',phone:'818-988-8385'},{name:'Jet Aviation Van Nuys',phone:'818-722-5103'}],
 KSEA:[{name:'Signature Aviation',address:'18291 Starling Road, Seattle, WA',phone:'206-433-5481'}]
};
const STORE='sierra_fbo_locator_choices_v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const code=s=>{s=String(s||'').trim().toUpperCase();return /^[A-Z0-9]{3,4}$/.test(s)?s:''};
const load=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}};
const route=()=>{let s={};try{s=typeof state!=='undefined'?state:JSON.parse(localStorage.getItem('sierra_phenom300_state')||'{}')}catch{};const a=s.activeAssignment||s.activeFlight||s.currentFlight||{};return {a,dep:code(a.origin||document.getElementById('origin')?.value),arr:code(a.destination||a.dest||document.getElementById('destination')?.value)}};
const airportUrl=c=>'https://www.airnav.com/airport/'+encodeURIComponent(c);
const mapUrl=(c,n)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((n?n+' ':'FBO ')+c+' airport');
let last='',editing=false;
function syncSelection(side,c,name){const saved=load();saved[c]=name;localStorage.setItem(STORE,JSON.stringify(saved));
 // Only populate legacy FBO fields if an actual operator is selected. Preserve flight history.
 try{const r=route(),a=r.a;if(side==='departure'){const field=document.getElementById('fboName');if(field){field.value=name;field.dispatchEvent(new Event('change',{bubbles:true}));}}
 if(a&&typeof a==='object'){if(side==='departure')a.departureFbo=name;else a.arrivalFbo=name;if(typeof saveState==='function')saveState();}
 }catch(e){console.warn('FBO preference stored; flight sync pending',e)}
 render(true);
}
function sideHTML(side,c){if(!c)return '<div class="sxf-empty">No '+side+' airport on selected charter</div>';
 const choices=load(),existing=choices[c]||'',items=directory[c]||[];
 const first=items.length===1?items[0]:null;const name=existing||(first?first.name:'');
 const verified=Boolean(name&&items.some(x=>x.name===name));
 const selected=items.find(x=>x.name===name);
 const ops=items.length?items.map(x=>'<option value="'+esc(x.name)+'" '+(x.name===name?'selected':'')+'>'+esc(x.name)+'</option>').join(''):'';
 return '<div class="sxf-side"><div class="sxf-head"><b>'+esc(side)+' FBO · '+esc(c)+'</b><span>'+(existing?'Saved preference':first?'Single listed operator':'Select FBO')+'</span></div>'+
 '<select data-sxf-side="'+side.toLowerCase()+'" data-sxf-code="'+c+'"><option value="">'+(items.length?'Choose an operator':'FBO not yet identified')+'</option>'+ops+(name&&!items.some(x=>x.name===name)?'<option selected value="'+esc(name)+'">'+esc(name)+' (saved)</option>':'')+'</select>'+
 (selected?.address?'<div class="sxf-detail">'+esc(selected.address)+'</div>':'')+
 (selected?.phone?'<div class="sxf-detail">Phone: '+esc(selected.phone)+'</div>':'')+
 (verified?'<div class="sxf-detail">Known operator · Confirm ramp and handling before flight</div>':'<div class="sxf-detail">Check current FBO operators before choosing your ramp.</div>')+
 '<div class="sxf-actions"><a href="'+airportUrl(c)+'" target="_blank" rel="noopener">FBO directory</a><a href="'+mapUrl(c,name)+'" target="_blank" rel="noopener">FBO map</a><a href="'+mapUrl(c,'airport diagram')+'" target="_blank" rel="noopener">Airport diagram search</a></div>'+
 '<div class="sxf-custom"><input aria-label="Custom FBO at '+c+'" placeholder="Enter another FBO name" maxlength="100" data-sxf-custom="'+side.toLowerCase()+'"/><button data-sxf-save="'+side.toLowerCase()+'" data-sxf-code="'+c+'">Save</button></div></div>';
}
function css(){if(document.getElementById('sxf-style'))return;const e=document.createElement('style');e.id='sxf-style';e.textContent=`
 #sx-fbo-locator{background:#101820;border:1px solid #35606a;color:#f5f8fa;border-radius:8px;padding:13px;margin:0 0 12px;font-family:inherit}
 #sx-fbo-locator h3{margin:0 0 5px;font-size:14px;letter-spacing:.06em;color:#64dce8}
 #sx-fbo-locator .sxf-sub{color:#a3b7bf;font-size:11px;margin:0 0 10px}
 #sx-fbo-locator .sxf-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
 #sx-fbo-locator .sxf-side{border:1px solid #314551;background:#0b1218;padding:12px;border-radius:7px;min-width:0}
 #sx-fbo-locator .sxf-head{display:flex;justify-content:space-between;gap:8px;font-size:12px;margin-bottom:8px}
 #sx-fbo-locator .sxf-head span{color:#a7b5bc;font-size:10px}
 #sx-fbo-locator select,#sx-fbo-locator input{width:100%;background:#172531;color:#fff;border:1px solid #45606d;border-radius:5px;padding:10px;font-size:12px}
 #sx-fbo-locator .sxf-detail{font-size:10px;color:#b4c3cb;margin-top:7px}
 #sx-fbo-locator .sxf-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
 #sx-fbo-locator a,#sx-fbo-locator button{font-size:10px;color:#6be2f4;border:1px solid #386270;background:#11262c;text-decoration:none;border-radius:4px;padding:8px;cursor:pointer}
 #sx-fbo-locator .sxf-custom{display:flex;gap:6px;margin-top:10px}
 #sx-fbo-locator .sxf-custom input{min-width:0;flex:1}
 #sx-fbo-locator .sxf-empty{color:#a3b7bf;font-size:12px}
 @media(max-width:700px){#sx-fbo-locator .sxf-grid{grid-template-columns:1fr}}
 `;document.head.appendChild(e)}
function render(force=false){const host=document.getElementById('opsCenter')||document.querySelector('main.content');if(!host)return;const r=route(),key=r.dep+'|'+r.arr+'|'+JSON.stringify(load());
 if(!force&&key===last&&document.getElementById('sx-fbo-locator'))return;if(editing&&!force)return;last=key;css();
 let el=document.getElementById('sx-fbo-locator');if(!el){el=document.createElement('section');el.id='sx-fbo-locator';if(host.id==='opsCenter')host.before(el);else host.prepend(el);}
 el.innerHTML='<h3>FBO Locator · Sierra Executive Charter</h3><p class="sxf-sub">Follows your active charter. Saves your preferred handler for repeat visits. Links open FBO listings, map locations and airport-diagram searches.</p><div class="sxf-grid">'+sideHTML('Departure',r.dep)+sideHTML('Arrival',r.arr)+'</div>';
 el.querySelectorAll('select[data-sxf-side]').forEach(x=>x.onchange=()=>{if(x.value)syncSelection(x.dataset.sxfSide,x.dataset.sxfCode,x.value)});
 el.querySelectorAll('button[data-sxf-save]').forEach(x=>x.onclick=()=>{const field=el.querySelector('[data-sxf-custom="'+x.dataset.sxfSave+'"]');const value=field?.value?.trim();if(value)syncSelection(x.dataset.sxfSave,x.dataset.sxfCode,value)});
 el.querySelectorAll('input').forEach(x=>{x.onfocus=()=>editing=true;x.onblur=()=>{editing=false;};x.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const b=el.querySelector('[data-sxf-save="'+x.dataset.sxfCustom+'"]');b?.click();}}});
}
window.sxFboLocator={render,lookup:c=>directory[code(c)]||[],saved:load};
render(true);setInterval(()=>render(),3000);
})();