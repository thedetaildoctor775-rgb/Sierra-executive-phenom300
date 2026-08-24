const PRIMARY_BASE='https://fboairport.com/fuel-prices/';
const AIRNAV_BASE='https://www.airnav.com/airport/';

function send(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control',status===200?'s-maxage=900, stale-while-revalidate=1800':'no-store');
  res.end(JSON.stringify(body));
}

function decodeHtml(s=''){
  return String(s)
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&ndash;/gi,'–')
    .replace(/&mdash;/gi,'—')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}

function text(s=''){
  return decodeHtml(String(s)
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' '))
    .replace(/\s+/g,' ')
    .trim();
}

function price(s=''){
  const m=String(s).match(/\$\s*([0-9]+(?:\.[0-9]+)?)/);
  return m?Number(m[1]):0;
}

function normalizeName(s=''){
  return String(s)
    .toLowerCase()
    .replace(/best\s*price/gi,'')
    .replace(/\b(fbo|aviation|airport|international|executive|services?)\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function matchScore(candidate,requested){
  if(!requested)return 0;
  const c=normalizeName(candidate),r=normalizeName(requested.split('/')[0]);
  if(!c||!r)return 0;
  if(c===r)return 100;
  if(c.includes(r)||r.includes(c))return 80;
  const ct=new Set(c.split(' ')),rt=r.split(' ');
  return rt.reduce((n,w)=>n+(ct.has(w)?10:0),0);
}

function parseFboAirport(html){
  const rows=[];
  const rowRe=/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm;
  while((rm=rowRe.exec(html))){
    const cells=[];
    const cellRe=/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cm;
    while((cm=cellRe.exec(rm[1])))cells.push(text(cm[1]));
    if(cells.length<2 || !/\$\s*\d/.test(cells.join(' | ')))continue;
    const prices=cells.map(price).filter(n=>n>0);
    if(!prices.length)continue;
    let name='';
    for(const c of cells){
      if(!/^#?$/.test(c)&&!/^\d+$/.test(c)&&!/^\$/.test(c)&&!/^(jet-?a|100ll)$/i.test(c)){
        name=c.replace(/\s*Best\s*Price\s*/gi,' ').trim();
        if(name)break;
      }
    }
    if(name)rows.push({name,jet_a:prices[0]||0,avgas_100ll:prices[1]||0});
  }
  const body=text(html);
  const updated=(body.match(/Last updated\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i)||[])[1]||'';
  const airportName=(body.match(/Fuel Prices at [A-Z0-9]{3,4}\s+([^·]+?)\s*·/i)||[])[1]?.trim()||'';
  return {rows,updated,airportName};
}

function parseAirNav(html,requested=''){
  const body=text(html);
  const rows=[];
  const updatedMatches=[...body.matchAll(/Fuel prices as last reported on\s+(\d{1,2}-[A-Za-z]{3}-\d{4})/gi)];
  const updated=updatedMatches[0]?.[1]||'';

  // AirNav airport pages repeat each FBO followed by its reported fuel block. Split around
  // common price-report wording and recover the closest preceding FBO/business label.
  const blockRe=/(.{0,700}?)(?:Fuel prices as last reported on\s+[^.]{0,40}|Updated\s+\d{1,2}-[A-Za-z]{3}-\d{4})(.{0,900})/gi;
  let bm;
  while((bm=blockRe.exec(body))){
    const before=bm[1]||'';
    const after=bm[2]||'';
    const jet=(after.match(/Jet\s*A(?:\s+Full\s+service|\s+FS)?\s*\$\s*([0-9]+(?:\.[0-9]+)?)/i)||[])[1]
      ||(after.match(/Jet\s*A[^$]{0,120}\$\s*([0-9]+(?:\.[0-9]+)?)/i)||[])[1];
    if(!jet)continue;
    const av=(after.match(/100LL(?:\s+Avgas)?(?:\s+Full\s+service|\s+FS)?\s*\$\s*([0-9]+(?:\.[0-9]+)?)/i)||[])[1];
    const nameCandidates=before.match(/([A-Z][A-Za-z0-9&' .-]{2,70})/g)||[];
    let name=nameCandidates.reverse().find(x=>!/^(Image|Services|Aviation fuel services|More info|Fueling hours|Prices include|Located at)$/i.test(x.trim()))||'';
    name=name.trim().replace(/^(at\s+)/i,'');
    if(name)rows.push({name,jet_a:Number(jet),avgas_100ll:Number(av)||0});
  }

  // Requested-FBO fallback: this reliably handles pages where AirNav text layout changes.
  if(!rows.length){
    const lower=body.toLowerCase();
    const req=String(requested||'').split('/')[0].trim();
    const idx=req?lower.indexOf(req.toLowerCase()):-1;
    const scope=idx>=0?body.slice(idx,idx+2400):body;
    const jet=(scope.match(/Jet\s*A[^$]{0,180}\$\s*([0-9]+(?:\.[0-9]+)?)/i)||[])[1];
    const av=(scope.match(/100LL[^$]{0,180}\$\s*([0-9]+(?:\.[0-9]+)?)/i)||[])[1];
    if(jet)rows.push({name:req||'Airport FBO',jet_a:Number(jet),avgas_100ll:Number(av)||0});
  }

  return {rows,updated,airportName:''};
}

function airportMultiplier(airport){
  const a=String(airport||'').toUpperCase();
  const premium=new Set(['KLAX','KSFO','KLAS','KASE','KTEB','KHPN','KSNA','KSDL']);
  const high=new Set(['KVNY','KBUR','KAPC','KSJC','KOAK','KSEA','KSAN','KPSP','KSMO','KPAO','KPDX','KBOI','KPHX']);
  const low=new Set(['KMEV','KCXP','KTVL','KTRK','KMER','KMOD','KSCK']);
  if(premium.has(a))return 1.65;
  if(high.has(a))return 1.30;
  if(low.has(a))return 0.85;
  return 1.0;
}

function aircraftMultiplier(cls){
  const c=String(cls||'light').toLowerCase();
  if(c.includes('heavy')||c.includes('large'))return 2.2;
  if(c.includes('super'))return 1.55;
  if(c.includes('mid'))return 1.28;
  return 1.0;
}

function estimateServices({airport,aircraftClass,pax,fuelGallons}){
  const am=airportMultiplier(airport),cm=aircraftMultiplier(aircraftClass);
  const scale=am*cm;
  const round=n=>Math.round(n/5)*5;
  const people=Math.max(1,Number(pax)||4);
  const waiverThreshold=aircraftClass&&String(aircraftClass).toLowerCase().includes('super')?300:
    aircraftClass&&String(aircraftClass).toLowerCase().includes('mid')?225:150;
  const fuelWaiverLikely=Number(fuelGallons||0)>=waiverThreshold;
  return {
    handling_fee:round(150*scale),
    handling_fee_after_estimated_fuel_waiver:fuelWaiverLikely?0:round(150*scale),
    handling_waiver_threshold_gal:waiverThreshold,
    handling_waiver_likely:fuelWaiverLikely,
    parking_fee:round(85*scale),
    hangar_fee:round(350*scale),
    gpu_fee:round(85*scale),
    lav_fee:round(95*scale),
    potable_water_fee:round(35*scale),
    baggage_handling_fee:round(60*scale),
    catering_fee:round((90+people*55)*am),
    ground_transport_fee:round((people>4?220:165)*am),
    deice_fee:round(700*scale),
    airport_cost_multiplier:am,
    aircraft_cost_multiplier:cm,
    estimate_note:'Non-fuel service prices are Sierra Executive estimates unless the FBO publishes a confirmed fee. Fuel-waiver rules vary by FBO and must be confirmed.'
  };
}

async function fetchHtml(url){
  const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 SierraExecutiveOps/2.0','Accept':'text/html,application/xhtml+xml'},redirect:'follow'});
  if(!r.ok)throw new Error('HTTP '+r.status+' from '+new URL(url).hostname);
  return r.text();
}

function chooseRow(rows,requested){
  const withJet=(rows||[]).filter(x=>Number(x.jet_a)>0);
  if(!withJet.length)return {selected:null,matched:false,all:[]};
  let selected=null,matched=false;
  if(requested){
    selected=withJet.map(x=>({...x,score:matchScore(x.name,requested)})).sort((a,b)=>b.score-a.score)[0];
    matched=!!(selected&&selected.score>=10);
    if(!matched)selected=null;
  }
  if(!selected)selected=[...withJet].sort((a,b)=>a.jet_a-b.jet_a)[0];
  return {selected,matched,all:withJet};
}

module.exports=async function handler(req,res){
  if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
  const airport=String(req.query.airport||'').trim().toUpperCase();
  const requested=String(req.query.fbo||'').trim();
  const aircraftClass=String(req.query.aircraftClass||'light').trim().toLowerCase();
  const pax=Number(req.query.pax||4);
  const fuelGallons=Number(req.query.fuelGallons||0);
  if(!/^[A-Z0-9]{3,4}$/.test(airport))return send(res,400,{ok:false,error:'Enter a valid airport ICAO/FAA code.'});

  const estimates=estimateServices({airport,aircraftClass,pax,fuelGallons});
  let parsed={rows:[],updated:'',airportName:''};
  let source='';
  let sourceUrl='';
  const errors=[];

  try{
    sourceUrl=PRIMARY_BASE+encodeURIComponent(airport)+'/';
    parsed=parseFboAirport(await fetchHtml(sourceUrl));
    if(parsed.rows.some(x=>Number(x.jet_a)>0))source='FBOAirport.com';
  }catch(e){errors.push(String(e.message||e));}

  if(!source){
    try{
      sourceUrl=AIRNAV_BASE+encodeURIComponent(airport);
      parsed=parseAirNav(await fetchHtml(sourceUrl),requested);
      if(parsed.rows.some(x=>Number(x.jet_a)>0))source='AirNav';
    }catch(e){errors.push(String(e.message||e));}
  }

  const chosen=chooseRow(parsed.rows,requested);
  if(!chosen.selected){
    return send(res,200,{
      ok:true,
      airport,
      requested_fbo:requested||null,
      matched_requested_fbo:false,
      fbo_name:requested||null,
      jet_a:0,
      avgas_100ll:0,
      fuel_live:false,
      fuel_status:'LIVE FUEL UNAVAILABLE',
      ...estimates,
      aircraft_class:aircraftClass,
      pax,
      checked_at:new Date().toISOString(),
      source:'Sierra Estimate',
      source_url:sourceUrl||null,
      guaranteed:false,
      warnings:errors,
      all_fbos:[]
    });
  }

  return send(res,200,{
    ok:true,
    airport,
    airport_name:parsed.airportName||null,
    requested_fbo:requested||null,
    matched_requested_fbo:chosen.matched,
    fbo_name:chosen.selected.name,
    jet_a:Number(chosen.selected.jet_a)||0,
    avgas_100ll:Number(chosen.selected.avgas_100ll)||0,
    fuel_live:true,
    fuel_status:'LIVE',
    ...estimates,
    aircraft_class:aircraftClass,
    pax,
    price_updated:parsed.updated||null,
    checked_at:new Date().toISOString(),
    source,
    source_url:sourceUrl,
    guaranteed:false,
    all_fbos:chosen.all.map(x=>({name:x.name,jet_a:x.jet_a,avgas_100ll:x.avgas_100ll}))
  });
};
