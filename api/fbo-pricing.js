const SOURCE_BASE='https://fboairport.com/fuel-prices/';

function send(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control',status===200?'s-maxage=1800, stale-while-revalidate=3600':'no-store');
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

function parsePage(html){
  const rows=[];
  const rowRe=/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm;
  while((rm=rowRe.exec(html))){
    const cells=[];
    const cellRe=/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cm;
    while((cm=cellRe.exec(rm[1])))cells.push(text(cm[1]));
    if(cells.length<2)continue;
    if(!/\$\s*\d/.test(cells.join(' | ')))continue;
    const prices=cells.map(price).filter(n=>n>0);
    if(!prices.length)continue;
    let name='';
    for(const c of cells){
      if(!/^#?$/.test(c)&&!/^\d+$/.test(c)&&!/^\$/.test(c)&&!/^(jet-?a|100ll)$/i.test(c)){
        name=c.replace(/\s*Best\s*Price\s*/gi,' ').trim();
        if(name)break;
      }
    }
    if(!name)continue;
    rows.push({name,jet_a:prices[0]||0,avgas_100ll:prices[1]||0});
  }

  if(!rows.length){
    const body=text(html);
    const section=(body.split(/All FBOs at [A-Z0-9]{3,4}/i)[1]||'').split(/Prices may vary/i)[0]||'';
    const re=/(?:^|\s)\d+\s+([A-Za-z0-9&' .\-/]+?)(?:\s+Best Price)?\s+\$([0-9.]+)(?:\s+\$([0-9.]+)|\s+N\/A)/g;
    let m;
    while((m=re.exec(section))){
      rows.push({name:m[1].trim(),jet_a:Number(m[2])||0,avgas_100ll:Number(m[3])||0});
    }
  }

  const body=text(html);
  const updated=(body.match(/Last updated\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i)||[])[1]||'';
  const airportName=(body.match(/Fuel Prices at [A-Z0-9]{3,4}\s+([^·]+?)\s*·/i)||[])[1]?.trim()||'';
  return {rows,updated,airportName};
}

module.exports=async function handler(req,res){
  if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
  const airport=String(req.query.airport||'').trim().toUpperCase();
  const requested=String(req.query.fbo||'').trim();
  const aircraftClass=String(req.query.aircraftClass||'').trim().toLowerCase();

  if(!/^[A-Z0-9]{3,4}$/.test(airport)){
    return send(res,400,{ok:false,error:'Enter a valid airport ICAO/FAA code.'});
  }

  const url=SOURCE_BASE+encodeURIComponent(airport)+'/';
  try{
    const upstream=await fetch(url,{
      headers:{
        'User-Agent':'SierraExecutiveOps/1.0 (+MSFS virtual operations)',
        'Accept':'text/html,application/xhtml+xml'
      },
      redirect:'follow'
    });
    if(!upstream.ok)throw new Error('Pricing source returned HTTP '+upstream.status);
    const html=await upstream.text();
    const parsed=parsePage(html);
    const withJet=parsed.rows.filter(x=>Number(x.jet_a)>0);
    if(!withJet.length){
      return send(res,404,{ok:false,error:'No current Jet-A pricing was found for '+airport+'.',airport,source:'FBOAirport.com',source_url:url});
    }

    let selected=null,matched=false;
    if(requested){
      selected=withJet.map(x=>({...x,score:matchScore(x.name,requested)})).sort((a,b)=>b.score-a.score)[0];
      matched=!!(selected&&selected.score>=10);
      if(!matched)selected=null;
    }
    if(!selected)selected=[...withJet].sort((a,b)=>a.jet_a-b.jet_a)[0];

    return send(res,200,{
      ok:true,
      airport,
      airport_name:parsed.airportName||null,
      requested_fbo:requested||null,
      matched_requested_fbo:matched,
      fbo_name:selected.name,
      jet_a:Number(selected.jet_a)||0,
      avgas_100ll:Number(selected.avgas_100ll)||0,
      handling_fee:0,
      handling_fee_type:'manual',
      aircraft_class:aircraftClass||null,
      price_updated:parsed.updated||null,
      checked_at:new Date().toISOString(),
      source:'FBOAirport.com',
      source_url:url,
      guaranteed:false,
      all_fbos:withJet.map(x=>({name:x.name,jet_a:x.jet_a,avgas_100ll:x.avgas_100ll}))
    });
  }catch(err){
    return send(res,502,{
      ok:false,
      error:'Live FBO pricing is temporarily unavailable.',
      detail:String(err&&err.message||err),
      airport,
      source:'FBOAirport.com',
      source_url:url
    });
  }
};
