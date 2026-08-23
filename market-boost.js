(function(){
  if(typeof seedMarket!=='function'||typeof state==='undefined'||typeof selectedAircraft!=='function')return;
  if(window.__sxWestCoastMarketRuntime)return;
  window.__sxWestCoastMarketRuntime=true;

  const AIRPORTS={
    KMEV:{r:'sierra'},KRNO:{r:'sierra'},KTRK:{r:'sierra'},KTVL:{r:'sierra'},KMMH:{r:'sierra'},
    KSFO:{r:'bay'},KOAK:{r:'bay'},KSJC:{r:'bay'},KSQL:{r:'bay'},KHWD:{r:'bay'},KCCR:{r:'bay'},KAPC:{r:'bay'},KSTS:{r:'bay'},
    KMRY:{r:'centralca'},KSNS:{r:'centralca'},KSMF:{r:'centralca'},KSAC:{r:'centralca'},KMHR:{r:'centralca'},KSBP:{r:'centralca'},KSMX:{r:'centralca'},KSBA:{r:'centralca'},KIZA:{r:'centralca'},
    KLAX:{r:'socal'},KVNY:{r:'socal'},KBUR:{r:'socal'},KSMO:{r:'socal'},KLGB:{r:'socal'},KSNA:{r:'socal'},KONT:{r:'socal'},KCMA:{r:'socal'},KSAN:{r:'socal'},KMYF:{r:'socal'},KCRQ:{r:'socal'},KPSP:{r:'socal'},
    KSEA:{r:'pnw'},KBFI:{r:'pnw'},KPAE:{r:'pnw'},KTIW:{r:'pnw'},KOLM:{r:'pnw'},KGEG:{r:'pnw'},KPDX:{r:'pnw'},KHIO:{r:'pnw'},KTTD:{r:'pnw'},KEUG:{r:'pnw'},KRDM:{r:'pnw'},KMFR:{r:'pnw'},
    KLAS:{r:'desert'},KHND:{r:'desert'},KVGT:{r:'desert'},KPHX:{r:'desert'},KSDL:{r:'desert'},KIWA:{r:'desert'},KBOI:{r:'mountain'},KSLC:{r:'mountain'},KAPA:{r:'mountain'},KDEN:{r:'mountain'}
  };

  const REGION_POOLS={
    sierra:['KMEV','KRNO','KTRK','KTVL','KSFO','KOAK','KSJC','KSQL','KSTS','KSMF','KMRY','KSBP','KSBA','KVNY','KLAX','KPSP','KLAS','KHND','KPDX','KSEA'],
    bay:['KMEV','KRNO','KTRK','KTVL','KSMF','KMRY','KSTS','KAPC','KSBA','KSBP','KVNY','KLAX','KSNA','KSAN','KPSP','KPDX','KSEA','KHND'],
    centralca:['KMEV','KRNO','KSFO','KOAK','KSJC','KSMF','KSTS','KVNY','KLAX','KBUR','KSNA','KSAN','KPSP','KLAS','KHND','KPDX','KSEA'],
    socal:['KMEV','KSFO','KOAK','KSJC','KMRY','KSMF','KSBP','KSBA','KPSP','KLAS','KHND','KSDL','KPHX','KRNO','KTRK','KPDX','KSEA'],
    pnw:['KSEA','KBFI','KPAE','KPDX','KHIO','KEUG','KRDM','KMFR','KGEG','KSFO','KOAK','KSJC','KMEV','KRNO','KTRK','KSMF','KVNY','KLAX','KBOI'],
    desert:['KVNY','KLAX','KSNA','KSAN','KPSP','KSFO','KOAK','KMEV','KRNO','KTRK','KSLC','KBOI','KPDX','KSEA'],
    mountain:['KMEV','KRNO','KTRK','KSFO','KVNY','KLAX','KLAS','KSDL','KPHX','KPDX','KSEA']
  };

  const PROFILES=[
    {client:'Sierra Peak Capital',category:'Corporate',type:'Executive Charter',event:'Executive meetings and investor travel',pax:[3,6],bagMode:'business',premium:4700},
    {client:'Pacific Crest Technology',category:'Corporate',type:'Tech Executive Charter',event:'Leadership and engineering team movement',pax:[4,7],bagMode:'business',premium:5200},
    {client:'Redwood Family Office',category:'VIP',type:'Private Family Charter',event:'Private family and guest travel',pax:[3,7],bagMode:'leisure',premium:6900},
    {client:'Westline Artist Management',category:'Entertainment',type:'Talent Charter',event:'Artist appearance and production schedule',pax:[4,8],bagMode:'talent',premium:7900},
    {client:'Pacific Sports Group',category:'Sports',type:'Athlete Charter',event:'Athlete, agent and staff movement',pax:[3,7],bagMode:'sports',premium:6100},
    {client:'Golden State Productions',category:'Entertainment',type:'Production Charter',event:'Film and production leadership travel',pax:[5,8],bagMode:'production',premium:6700},
    {client:'Northwest Venture Partners',category:'Corporate',type:'Investor Charter',event:'Partner meetings and portfolio company visit',pax:[3,6],bagMode:'business',premium:5000},
    {client:'Cascadia Medical Group',category:'Medical',type:'Medical Team Charter',event:'Specialist and medical leadership travel',pax:[3,6],bagMode:'medical',premium:5600},
    {client:'Monterey Luxury Travel',category:'VIP',type:'Luxury Leisure Charter',event:'Resort and leisure travel',pax:[2,6],bagMode:'leisure',premium:6500},
    {client:'Napa Valley Estates',category:'Hospitality',type:'Hospitality Charter',event:'Winery principals and private guests',pax:[3,7],bagMode:'leisure',premium:6100},
    {client:'Summit Resort Holdings',category:'Hospitality',type:'Resort Charter',event:'Resort ownership and guest movement',pax:[4,8],bagMode:'leisure',premium:6400},
    {client:'Coastal Real Estate Partners',category:'Corporate',type:'Real Estate Charter',event:'Property tour and acquisition meetings',pax:[3,7],bagMode:'business',premium:5000},
    {client:'Velocity Motorsports',category:'Sports',type:'Motorsports Charter',event:'Driver, sponsor and team executive movement',pax:[4,8],bagMode:'sports',premium:7000},
    {client:'Pacific Legal Group',category:'Corporate',type:'Legal Team Charter',event:'Counsel and client business travel',pax:[3,6],bagMode:'business',premium:4900},
    {client:'West Coast Golf Management',category:'Sports',type:'Golf Charter',event:'Player and management tournament travel',pax:[3,6],bagMode:'golf',premium:6200},
    {client:'Bluewater Private Office',category:'VIP',type:'Principal Charter',event:'Principal, assistant and security movement',pax:[3,6],bagMode:'vip',premium:7600}
  ];

  const TIMES=['06:20','07:05','07:50','08:35','09:20','10:10','11:05','12:15','13:20','14:30','15:40','16:50','18:05','19:20'];
  const REGION_ORDER=['sierra','bay','centralca','socal','pnw','desert','mountain'];
  function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
  function shuffle(arr){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
  function day(days){const d=new Date(Date.now()+days*86400000);return d.toISOString().slice(0,10)}
  function nextNumber(used){let n=nextFlight();while(used.has('SXR'+n))n++;return n}
  function region(icao){return (AIRPORTS[icao]&&AIRPORTS[icao].r)||'other'}
  function round5(n){return Math.max(0,Math.round(n/5)*5)}
  function timePlusHours(hours){const d=new Date(Date.now()+hours*3600000);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}

  function realisticBaggage(profile,pax,distance){
    const mode=profile.bagMode||'business';
    let perMin=18,perMax=30,equipmentMin=0,equipmentMax=0;
    if(mode==='business'){perMin=15;perMax=28}
    if(mode==='vip'){perMin=22;perMax=38}
    if(mode==='leisure'){perMin=28;perMax=48}
    if(mode==='talent'){perMin=25;perMax=42;equipmentMin=15;equipmentMax=55}
    if(mode==='sports'){perMin=22;perMax=36;equipmentMin=25;equipmentMax=85}
    if(mode==='production'){perMin=20;perMax=34;equipmentMin=60;equipmentMax=150}
    if(mode==='medical'){perMin=18;perMax=30;equipmentMin=10;equipmentMax=45}
    if(mode==='golf'){perMin=24;perMax=38;equipmentMin=pax*24;equipmentMax=pax*38}
    const tripFactor=distance>850?1.18:distance>500?1.08:distance<220?.82:1;
    const personal=rand(perMin*pax,perMax*pax)*tripFactor;
    const equipment=equipmentMax?rand(equipmentMin,equipmentMax):0;
    return round5(personal+equipment);
  }

  function approximateDistance(origin,dest){const a=region(origin),b=region(dest);if(a===b)return rand(90,420);const near={sierra:new Set(['bay','centralca','desert']),bay:new Set(['sierra','centralca']),centralca:new Set(['sierra','bay','socal']),socal:new Set(['centralca','desert']),pnw:new Set(['sierra','bay','mountain']),desert:new Set(['sierra','socal','mountain']),mountain:new Set(['pnw','sierra','desert'])};if(near[a]&&near[a].has(b))return rand(280,760);if((a==='pnw'&&b==='socal')||(a==='socal'&&b==='pnw'))return rand(850,1250);return rand(520,1050)}
  function routePool(base){const own=region(base);const primary=(REGION_POOLS[own]||[]).slice();const allWest=Object.keys(AIRPORTS).filter(x=>x!==base);const local=allWest.filter(x=>region(x)===own);const otherRegions=REGION_ORDER.filter(r=>r!==own);const regional=[];otherRegions.forEach(r=>regional.push(...shuffle(allWest.filter(x=>region(x)===r)).slice(0,4)));return [...shuffle(local),...shuffle(primary),...shuffle(regional),...shuffle(allWest)]}
  function pickDiverseDestinations(base,count){const pool=routePool(base).filter(x=>x!==base);const out=[];const seenRegions=new Set();for(const dest of pool){const r=region(dest);if(!seenRegions.has(r)&&!out.includes(dest)){out.push(dest);seenRegions.add(r)}if(out.length>=Math.min(count,6))break}for(const dest of pool){if(out.length>=count)break;if(!out.includes(dest))out.push(dest)}return out}

  function sxWestCoastMarket(silent){
    ensureFleet110();
    const base=String(selectedAircraft().location||state.homeBase||'KMEV').toUpperCase();
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
      const p=profiles[i%profiles.length],dest=destinations[i],distance=approximateDistance(base,dest),pax=rand(p.pax[0],p.pax[1]);
      const lastMinute=i<3;
      const bags=realisticBaggage(p,pax,distance);
      const rushPremium=lastMinute?rand(1800,4200):0;
      const value=Math.round((p.premium+4200+distance*8.2+pax*275+rushPremium)/50)*50;
      const depDay=lastMinute?0:(i<7?0:(i<11?1:2));
      const departureTime=lastMinute?timePlusHours(1.5+i*.75):(depDay===0?timePlusHours(4+i*.45):TIMES[i%TIMES.length]);
      const expiryHours=lastMinute?(0.7+i*.35):(4.5+i*1.15);
      const event=lastMinute?('LAST-MINUTE REQUEST • '+p.event+' • Client needs rapid confirmation and expedited FBO coordination.'):p.event;

      generated.push({
        flight:'SXR'+n,origin:base,dest,client:p.client,pax,bags,value,
        expiry:new Date(now+expiryHours*3600000).toISOString(),event,
        category:p.category,charterType:lastMinute?'Last-Minute '+p.type:p.type,jobType:'MARKET',
        minClass:distance>1050?'Midsize Jet':distance>650?'Super Light Jet':'Light Jet',distance,
        departureDate:day(depDay),departureTime,status:'Available',westCoastMarket:true,
        lastMinute,availability:lastMinute?'LAST MINUTE':'SCHEDULED',rushPremium
      });
      used.add('SXR'+n);n++;
    }

    state.marketBoard=[...protectedRows,...generated];
    state.marketRevision='West Coast Diverse Market v2.3 KMEV Home Base';
    state.marketLocation=base;
    state.marketSeeded=true;
    saveState();
    if(!silent&&typeof renderMarket==='function')renderMarket();
    if(!silent&&typeof g==='function'&&g('marketStatus'))g('marketStatus').textContent='West Coast charter market active from '+base+' — KMEV home base, realistic baggage, scheduled and last-minute charter opportunities.';
  }

  const originalSeedMarket=seedMarket;
  seedMarket=function(silent){originalSeedMarket(silent);sxWestCoastMarket(silent)};
  window.sxWestCoastMarket=sxWestCoastMarket;
  window.sxBalancedMarket=sxWestCoastMarket;

  function loadHomeBase(){
    if(document.getElementById('sierraHomeBaseRuntime'))return;
    const s=document.createElement('script');
    s.id='sierraHomeBaseRuntime';
    s.src='/home-base-fix.js?v=20260823-kmev1';
    s.onload=()=>sxWestCoastMarket(false);
    document.body.appendChild(s);
  }
  loadHomeBase();
  sxWestCoastMarket(false);
  setTimeout(()=>sxWestCoastMarket(false),1200);

  function loadDispatchPhone(){if(document.getElementById('sierraDispatchPhoneRuntime'))return;const s=document.createElement('script');s.id='sierraDispatchPhoneRuntime';s.src='/dispatch-phone.js?v=20260823-iphone2';document.body.appendChild(s)}
  loadDispatchPhone();
})();