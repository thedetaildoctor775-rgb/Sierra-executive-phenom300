(function(){
  if(typeof seedMarket!=='function'||typeof state==='undefined'||typeof selectedAircraft!=='function')return;
  if(window.__sxWestCoastMarketRuntime)return;
  window.__sxWestCoastMarketRuntime=true;

  const AIRPORTS={
    // Northern California / Sierra
    KRNO:{r:'sierra'},KTRK:{r:'sierra'},KTVL:{r:'sierra'},KMMH:{r:'sierra'},
    KSFO:{r:'bay'},KOAK:{r:'bay'},KSJC:{r:'bay'},KSQL:{r:'bay'},KHWD:{r:'bay'},KCCR:{r:'bay'},KAPC:{r:'bay'},KSTS:{r:'bay'},
    KMRY:{r:'centralca'},KSNS:{r:'centralca'},KSMF:{r:'centralca'},KSAC:{r:'centralca'},KMHR:{r:'centralca'},KSBP:{r:'centralca'},KSMX:{r:'centralca'},KSBA:{r:'centralca'},KIZA:{r:'centralca'},

    // Southern California
    KLAX:{r:'socal'},KVNY:{r:'socal'},KBUR:{r:'socal'},KSMO:{r:'socal'},KLGB:{r:'socal'},KSNA:{r:'socal'},KONT:{r:'socal'},KCMA:{r:'socal'},
    KSAN:{r:'socal'},KMYF:{r:'socal'},KCRQ:{r:'socal'},KPSP:{r:'socal'},

    // Pacific Northwest
    KSEA:{r:'pnw'},KBFI:{r:'pnw'},KPAE:{r:'pnw'},KTIW:{r:'pnw'},KOLM:{r:'pnw'},KGEG:{r:'pnw'},
    KPDX:{r:'pnw'},KHIO:{r:'pnw'},KTTD:{r:'pnw'},KEUG:{r:'pnw'},KRDM:{r:'pnw'},KMFR:{r:'pnw'},

    // Western business/leisure extensions
    KLAS:{r:'desert'},KHND:{r:'desert'},KVGT:{r:'desert'},KPHX:{r:'desert'},KSDL:{r:'desert'},KIWA:{r:'desert'},
    KBOI:{r:'mountain'},KSLC:{r:'mountain'},KAPA:{r:'mountain'},KDEN:{r:'mountain'}
  };

  const REGION_POOLS={
    sierra:['KSFO','KOAK','KSJC','KSQL','KSTS','KSMF','KMRY','KSBP','KSBA','KVNY','KLAX','KPSP','KLAS','KHND','KPDX','KSEA'],
    bay:['KRNO','KTRK','KTVL','KSMF','KMRY','KSTS','KAPC','KSBA','KSBP','KVNY','KLAX','KSNA','KSAN','KPSP','KPDX','KSEA','KHND'],
    centralca:['KRNO','KSFO','KOAK','KSJC','KSMF','KSTS','KVNY','KLAX','KBUR','KSNA','KSAN','KPSP','KLAS','KHND','KPDX','KSEA'],
    socal:['KSFO','KOAK','KSJC','KMRY','KSMF','KSBP','KSBA','KPSP','KLAS','KHND','KSDL','KPHX','KRNO','KTRK','KPDX','KSEA'],
    pnw:['KSEA','KBFI','KPAE','KPDX','KHIO','KEUG','KRDM','KMFR','KGEG','KSFO','KOAK','KSJC','KRNO','KTRK','KSMF','KVNY','KLAX','KBOI'],
    desert:['KVNY','KLAX','KSNA','KSAN','KPSP','KSFO','KOAK','KRNO','KTRK','KSLC','KBOI','KPDX','KSEA'],
    mountain:['KRNO','KTRK','KSFO','KVNY','KLAX','KLAS','KSDL','KPHX','KPDX','KSEA']
  };

  const PROFILES=[
    {client:'Sierra Peak Capital',category:'Corporate',type:'Executive Charter',event:'Executive meetings and investor travel',pax:[3,6],bags:[150,300],premium:4700},
    {client:'Pacific Crest Technology',category:'Corporate',type:'Tech Executive Charter',event:'Leadership and engineering team movement',pax:[4,7],bags:[180,340],premium:5200},
    {client:'Redwood Family Office',category:'VIP',type:'Private Family Charter',event:'Private family and guest travel',pax:[3,7],bags:[220,420],premium:6900},
    {client:'Westline Artist Management',category:'Entertainment',type:'Talent Charter',event:'Artist appearance and production schedule',pax:[4,8],bags:[260,520],premium:7900},
    {client:'Pacific Sports Group',category:'Sports',type:'Athlete Charter',event:'Athlete, agent and staff movement',pax:[3,7],bags:[220,460],premium:6100},
    {client:'Golden State Productions',category:'Entertainment',type:'Production Charter',event:'Film and production leadership travel',pax:[5,8],bags:[300,560],premium:6700},
    {client:'Northwest Venture Partners',category:'Corporate',type:'Investor Charter',event:'Partner meetings and portfolio company visit',pax:[3,6],bags:[160,300],premium:5000},
    {client:'Cascadia Medical Group',category:'Medical',type:'Medical Team Charter',event:'Specialist and medical leadership travel',pax:[3,6],bags:[170,320],premium:5600},
    {client:'Monterey Luxury Travel',category:'VIP',type:'Luxury Leisure Charter',event:'Resort and leisure travel',pax:[2,6],bags:[180,420],premium:6500},
    {client:'Napa Valley Estates',category:'Hospitality',type:'Hospitality Charter',event:'Winery principals and private guests',pax:[3,7],bags:[180,360],premium:6100},
    {client:'Summit Resort Holdings',category:'Hospitality',type:'Resort Charter',event:'Resort ownership and guest movement',pax:[4,8],bags:[280,560],premium:6400},
    {client:'Coastal Real Estate Partners',category:'Corporate',type:'Real Estate Charter',event:'Property tour and acquisition meetings',pax:[3,7],bags:[160,320],premium:5000},
    {client:'Velocity Motorsports',category:'Sports',type:'Motorsports Charter',event:'Driver, sponsor and team executive movement',pax:[4,8],bags:[250,500],premium:7000},
    {client:'Pacific Legal Group',category:'Corporate',type:'Legal Team Charter',event:'Counsel and client business travel',pax:[3,6],bags:[150,300],premium:4900},
    {client:'West Coast Golf Management',category:'Sports',type:'Golf Charter',event:'Player and management tournament travel',pax:[3,6],bags:[260,520],premium:6200},
    {client:'Bluewater Private Office',category:'VIP',type:'Principal Charter',event:'Principal, assistant and security movement',pax:[3,6],bags:[180,360],premium:7600}
  ];

  const TIMES=['06:20','07:05','07:50','08:35','09:20','10:10','11:05','12:15','13:20','14:30','15:40','16:50','18:05','19:20'];
  const REGION_ORDER=['sierra','bay','centralca','socal','pnw','desert','mountain'];

  function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
  function sample(arr){return arr[Math.floor(Math.random()*arr.length)]}
  function shuffle(arr){
    const out=arr.slice();
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
    return out;
  }
  function day(days){const d=new Date(Date.now()+days*86400000);return d.toISOString().slice(0,10)}
  function nextNumber(used){let n=nextFlight();while(used.has('SXR'+n))n++;return n}
  function region(icao){return (AIRPORTS[icao]&&AIRPORTS[icao].r)||'other'}

  function approximateDistance(origin,dest){
    const a=region(origin),b=region(dest);
    if(a===b)return rand(90,420);
    const near={
      sierra:new Set(['bay','centralca','desert']),
      bay:new Set(['sierra','centralca']),
      centralca:new Set(['sierra','bay','socal']),
      socal:new Set(['centralca','desert']),
      pnw:new Set(['sierra','bay','mountain']),
      desert:new Set(['sierra','socal','mountain']),
      mountain:new Set(['pnw','sierra','desert'])
    };
    if(near[a]&&near[a].has(b))return rand(280,760);
    if((a==='pnw'&&b==='socal')||(a==='socal'&&b==='pnw'))return rand(850,1250);
    return rand(520,1050);
  }

  function routePool(base){
    const own=region(base);
    const primary=(REGION_POOLS[own]||[]).slice();
    const allWest=Object.keys(AIRPORTS).filter(x=>x!==base);
    const local=allWest.filter(x=>region(x)===own);
    const otherRegions=REGION_ORDER.filter(r=>r!==own);
    const regional=[];
    otherRegions.forEach(r=>regional.push(...shuffle(allWest.filter(x=>region(x)===r)).slice(0,4)));
    return [...shuffle(local),...shuffle(primary),...shuffle(regional),...shuffle(allWest)];
  }

  function pickDiverseDestinations(base,count){
    const pool=routePool(base).filter(x=>x!==base);
    const out=[];
    const seenRegions=new Set();

    // First pass deliberately spreads the board around the western regions.
    for(const dest of pool){
      const r=region(dest);
      if(!seenRegions.has(r)&&!out.includes(dest)){
        out.push(dest);seenRegions.add(r);
      }
      if(out.length>=Math.min(count,6))break;
    }

    // Second pass adds high-demand and secondary airports without duplicates.
    for(const dest of pool){
      if(out.length>=count)break;
      if(!out.includes(dest))out.push(dest);
    }
    return out;
  }

  function sxWestCoastMarket(silent){
    ensureFleet110();
    const base=String(selectedAircraft().location||'KRNO').toUpperCase();
    state.marketBoard=Array.isArray(state.marketBoard)?state.marketBoard:[];
    const now=Date.now();
    const protectedRows=state.marketBoard.filter(x=>x&&(x.protected===true||x.manual===true||x.jobType==='CONTRACT'||x.status==='Accepted'));
    const used=new Set(protectedRows.map(x=>String(x.flight||'')));
    let n=nextNumber(used);

    const destinations=pickDiverseDestinations(base,12);
    const profiles=shuffle(PROFILES);
    const generated=[];

    for(let i=0;i<destinations.length;i++){
      while(used.has('SXR'+n))n++;
      const p=profiles[i%profiles.length];
      const dest=destinations[i];
      const distance=approximateDistance(base,dest);
      const pax=rand(p.pax[0],p.pax[1]);
      const bagBase=rand(p.bags[0],p.bags[1]);
      const value=Math.round((p.premium+4200+distance*8.2+pax*275)/50)*50;
      const depDay=i<7?0:(i<11?1:2);

      generated.push({
        flight:'SXR'+n,
        origin:base,
        dest,
        client:p.client,
        pax,
        bags:sxRealisticBaggage(pax,bagBase),
        value,
        expiry:new Date(now+(4.5+i*1.15)*3600000).toISOString(),
        event:p.event,
        category:p.category,
        charterType:p.type,
        jobType:'MARKET',
        minClass:distance>1050?'Midsize Jet':distance>650?'Super Light Jet':'Light Jet',
        distance,
        departureDate:day(depDay),
        departureTime:TIMES[i%TIMES.length],
        status:'Available',
        westCoastMarket:true
      });
      used.add('SXR'+n);n++;
    }

    state.marketBoard=[...protectedRows,...generated];
    state.marketRevision='West Coast Diverse Market v2.0';
    state.marketLocation=base;
    state.marketSeeded=true;
    saveState();

    if(!silent&&typeof renderMarket==='function')renderMarket();
    if(!silent&&typeof g==='function'&&g('marketStatus')){
      g('marketStatus').textContent='West Coast charter market active from '+base+' — 12 diverse offers across California, Nevada, Arizona, Oregon, Washington and western business destinations.';
    }
  }

  const originalSeedMarket=seedMarket;
  seedMarket=function(silent){originalSeedMarket(silent);sxWestCoastMarket(silent)};
  window.sxWestCoastMarket=sxWestCoastMarket;
  window.sxBalancedMarket=sxWestCoastMarket;
  sxWestCoastMarket(false);
  setTimeout(()=>sxWestCoastMarket(false),1200);
})();