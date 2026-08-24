const PRIMARY='https://fboairport.com/fuel-prices/';
const AIRNAV='https://www.airnav.com/airport/';

function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',status===200?'s-maxage=900, stale-while-revalidate=1800':'no-store');res.end(JSON.stringify(body));}
function clean(s=''){return String(s).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();}
function norm(s=''){return String(s).toLowerCase().replace(/best\s*price/gi,'').replace(/\b(fbo|aviation|airport|international|executive|services?)\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function score(a,b){const x=norm(a),y=norm(String(b||'').split('/')[0]);if(!x||!y)return 0;if(x===y)return 100;if(x.includes(y)||y.includes(x))return 80;const set=new Set(x.split(' '));return y.split(' ').reduce((n,w)=>n+(set.has(w)?10:0),0);}
async function getHtml(url){const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 SierraExecutiveOps/2.1','Accept':'text/html,application/xhtml+xml'},redirect:'follow'});if(!r.ok)throw new Error('HTTP '+r.status+' from '+new URL(url).hostname);return r.text();}

function parseFboAirport(html){
  const rows=[];let rm;const rr=/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  while((rm=rr.exec(html))){const cells=[];let cm;const cr=/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;while((cm=cr.exec(rm[1])))cells.push(clean(cm[1]));if(cells.length<2)continue;const joined=cells.join(' | ');if(!/\$\s*\d/.test(joined))continue;let name='';for(const c of cells){if(!/^\d+$/.test(c)&&!/^\$/.test(c)&&!/^(jet-?a|100ll)$/i.test(c)){name=c.replace(/\s*Best\s*Price\s*/gi,' ').trim();if(name)break;}}const nums=cells.map(c=>(c.match(/\$\s*([0-9]+(?:\.[0-9]+)?)/)||[])[1]).filter(Boolean).map(Number);if(name&&nums.length)rows.push({name,jet_a:nums[0]||0,avgas_100ll:nums[1]||0});}
  const body=clean(html);return {rows,updated:(body.match(/Last updated\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i)||[])[1]||'',airportName:(body.match(/Fuel Prices at [A-Z0-9]{3,4}\s+([^·]+?)\s*·/i)||[])[1]?.trim()||''};
}

function airnavFuelPair(scope){
  // Airport overview layout: "100LL Jet A FS $8.99 $10.49". First value is 100LL, second is Jet-A.
  let m=scope.match(/100LL\s+Jet\s*A\s+(?:FS|Full\s+service)\s*\$\s*([0-9]+(?:\.[0-9]+)?)\s*\$\s*([0-9]+(?:\.[0-9]+)?)/i);
  if(m)return {avgas_100ll:Number(m[1]),jet_a:Number(m[2])};
  // Individual FBO page layout.
  const av=(scope.match(/100LL(?:\s+Avgas)?\s+Full\s+service\s*\$\s*([0-9]+(?:\.[0-9]+)?)/i)||[])[1];
  const jet=(scope.match(/Jet\s*A\s+Full\s+service\s*\$\s*([0-9]+(?:\.[0-9]+)?)/i)||[])[1];
  if(jet)return {avgas_100ll:Number(av)||0,jet_a:Number(jet)};
  return null;
}

function parseAirNav(html,requested=''){
  const body=clean(html),rows=[];const req=String(requested||'').split('/')[0].trim();
  if(req){const idx=body.toLowerCase().indexOf(req.toLowerCase());if(idx>=0){const pair=airnavFuelPair(body.slice(idx,idx+2600));if(pair)rows.push({name:req,...pair});}}
  // Parse every airport-page fuel table pair so we can still choose the lowest live Jet-A when the requested FBO name is stale or different.
  const re=/100LL\s+Jet\s*A\s+(?:FS|Full\s+service)\s*\$\s*([0-9]+(?:\.[0-9]+)?)\s*\$\s*([0-9]+(?:\.[0-9]+)?)/gi;let m,i=0;
  while((m=re.exec(body))){i++;const jet=Number(m[2]),av=Number(m[1]);if(jet>0&&!rows.some(r=>r.jet_a===jet&&r.avgas_100ll===av))rows.push({name:'AirNav FBO '+i,jet_a:jet,avgas_100ll:av});}
  if(!rows.length){const pair=airnavFuelPair(body);if(pair)rows.push({name:req||'Airport FBO',...pair});}
  const updated=(body.match(/Updated\s+(\d{1,2}-[A-Za-z]{3}-\d{4})/i)||body.match(/last reported on\s+(\d{1,2}-[A-Za-z]{3}-\d{4})/i)||[])[1]||'';
  return {rows,updated,airportName:''};
}

function airportMult(a){a=String(a||'').toUpperCase();if(['KLAX','KSFO','KLAS','KASE','KTEB','KHPN','KSNA','KSDL'].includes(a))return 1.65;if(['KVNY','KBUR','KAPC','KSJC','KOAK','KSEA','KSAN','KPSP','KSMO','KPAO','KPDX','KBOI','KPHX'].includes(a))return 1.30;if(['KMEV','KCXP','KTVL','KTRK','KMER','KMOD','KSCK'].includes(a))return .85;return 1;}
function aircraftMult(c){c=String(c||'light').toLowerCase();if(c.includes('heavy')||c.includes('large'))return 2.2;if(c.includes('super'))return 1.55;if(c.includes('mid'))return 1.28;return 1;}
function estimates(airport,cls,pax,fuelGallons){const am=airportMult(airport),cm=aircraftMult(cls),s=am*cm,r=n=>Math.round(n/5)*5,p=Math.max(1,Number(pax)||4),th=String(cls).includes('super')?300:String(cls).includes('mid')?225:150,waive=Number(fuelGallons||0)>=th;return {handling_fee:r(150*s),handling_fee_after_estimated_fuel_waiver:waive?0:r(150*s),handling_waiver_threshold_gal:th,handling_waiver_likely:waive,parking_fee:r(85*s),hangar_fee:r(350*s),gpu_fee:r(85*s),lav_fee:r(95*s),potable_water_fee:r(35*s),baggage_handling_fee:r(60*s),catering_fee:r((90+p*55)*am),ground_transport_fee:r((p>4?220:165)*am),deice_fee:r(700*s),airport_cost_multiplier:am,aircraft_cost_multiplier:cm,estimate_note:'Non-fuel services are Sierra Executive estimates unless an FBO publishes a confirmed fee. Fuel-waiver rules vary by FBO and must be confirmed.'};}
function choose(rows,requested){const live=(rows||[]).filter(x=>Number(x.jet_a)>0);if(!live.length)return {selected:null,matched:false,all:[]};let selected=null,matched=false;if(requested){selected=live.map(x=>({...x,_s:score(x.name,requested)})).sort((a,b)=>b._s-a._s)[0];matched=!!(selected&&selected._s>=10);if(!matched)selected=null;}if(!selected)selected=[...live].sort((a,b)=>a.jet_a-b.jet_a)[0];return {selected,matched,all:live};}

module.exports=async function(req,res){
  if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
  const airport=String(req.query.airport||'').trim().toUpperCase(),requested=String(req.query.fbo||'').trim(),cls=String(req.query.aircraftClass||'light').trim().toLowerCase(),pax=Number(req.query.pax||4),fuelGallons=Number(req.query.fuelGallons||0);
  if(!/^[A-Z0-9]{3,4}$/.test(airport))return send(res,400,{ok:false,error:'Enter a valid airport ICAO/FAA code.'});
  const est=estimates(airport,cls,pax,fuelGallons);let parsed={rows:[],updated:'',airportName:''},source='',sourceUrl='',warnings=[];
  try{sourceUrl=PRIMARY+encodeURIComponent(airport)+'/';parsed=parseFboAirport(await getHtml(sourceUrl));if(parsed.rows.some(x=>x.jet_a>0))source='FBOAirport.com';}catch(e){warnings.push(String(e.message||e));}
  if(!source){try{sourceUrl=AIRNAV+encodeURIComponent(airport);parsed=parseAirNav(await getHtml(sourceUrl),requested);if(parsed.rows.some(x=>x.jet_a>0))source='AirNav';}catch(e){warnings.push(String(e.message||e));}}
  const c=choose(parsed.rows,requested),base={ok:true,airport,requested_fbo:requested||null,...est,aircraft_class:cls,pax,checked_at:new Date().toISOString(),guaranteed:false};
  if(!c.selected)return send(res,200,{...base,matched_requested_fbo:false,fbo_name:requested||null,jet_a:0,avgas_100ll:0,fuel_live:false,fuel_status:'LIVE FUEL UNAVAILABLE',source:'Sierra Estimate',source_url:sourceUrl||null,warnings,all_fbos:[]});
  return send(res,200,{...base,airport_name:parsed.airportName||null,matched_requested_fbo:c.matched,fbo_name:c.matched?c.selected.name:(requested||c.selected.name),jet_a:Number(c.selected.jet_a),avgas_100ll:Number(c.selected.avgas_100ll||0),fuel_live:true,fuel_status:'LIVE',price_updated:parsed.updated||null,source,source_url:sourceUrl,all_fbos:c.all.map(x=>({name:x.name,jet_a:x.jet_a,avgas_100ll:x.avgas_100ll}))});
};
