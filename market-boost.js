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
    KLAS:{r:'desert'},KHND:{r:'desert'},KVGT:{r:'desert'},KPHX:{r:'desert'},KSDL:{r:'desert'},KIWA:{r:'desert'},KBOI:{r:'mountain'},KSLC:{r:'mountain'},KAPA:{r:'mountain'},KDEN:{r:'mountain'},
    KTEB:{r:'east'},KHPN:{r:'east'},KBOS:{r:'east'},KIAD:{r:'east'},KORD:{r:'central'},KMDW:{r:'central'},KDAL:{r:'central'},KDFW:{r:'central'},KAUS:{r:'central'},KHOU:{r:'central'},KMSY:{r:'south'},KATL:{r:'south'},KMIA:{r:'south'},KOPF:{r:'south'},KPBI:{r:'south'},KTPA:{r:'south'},KMCO:{r:'south'},KBNA:{r:'south'},KASE:{r:'mountain'},KEGE:{r:'mountain'},KJAC:{r:'mountain'},KBZN:{r:'mountain'},KMSP:{r:'central'},KDTW:{r:'east'},CYVR:{r:'canada'},CYYC:{r:'canada'},CYYZ:{r:'canada'},MMTJ:{r:'mexico'},MMSD:{r:'mexico'},MMPR:{r:'mexico'},MMMX:{r:'mexico'},MYNN:{r:'caribbean'},TJSJ:{r:'caribbean'}
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
  const REGION_ORDER=['sierra','bay','centralca','socal','pnw','desert','mountain','central','south','east','canada','mexico','caribbean'];
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

  // Approximate airport reference coordinates, used to calculate great-circle NM.
  // Planning-only values; operational routing and fuel always come from the OFP.
  const COORD={
    KMEV:[39.00,-119.75],KRNO:[39.50,-119.77],KTRK:[39.32,-120.14],KTVL:[38.89,-119.99],KMMH:[37.62,-118.84],
    KSFO:[37.62,-122.38],KOAK:[37.72,-122.22],KSJC:[37.36,-121.93],KSQL:[37.51,-122.25],KHWD:[37.66,-122.12],KCCR:[37.99,-122.06],KAPC:[38.21,-122.28],KSTS:[38.51,-122.81],
    KMRY:[36.59,-121.84],KSNS:[36.66,-121.61],KSMF:[38.70,-121.59],KSAC:[38.51,-121.49],KMHR:[38.55,-121.30],KSBP:[35.24,-120.64],KSMX:[34.90,-120.46],KSBA:[34.43,-119.84],KIZA:[34.61,-120.08],
    KLAX:[33.94,-118.41],KVNY:[34.21,-118.49],KBUR:[34.20,-118.36],KSMO:[34.02,-118.45],KLGB:[33.82,-118.15],KSNA:[33.68,-117.87],KONT:[34.06,-117.60],KCMA:[34.21,-119.09],KSAN:[32.73,-117.19],KMYF:[32.82,-117.14],KCRQ:[33.13,-117.28],KPSP:[33.83,-116.51],
    KSEA:[47.45,-122.31],KBFI:[47.53,-122.30],KPAE:[47.91,-122.28],KTIW:[47.27,-122.58],KOLM:[46.97,-122.90],KGEG:[47.62,-117.53],KPDX:[45.59,-122.60],KHIO:[45.54,-122.95],KTTD:[45.55,-122.40],KEUG:[44.12,-123.21],KRDM:[44.25,-121.15],KMFR:[42.37,-122.87],
    KLAS:[36.08,-115.15],KHND:[35.97,-115.13],KVGT:[36.21,-115.19],KPHX:[33.43,-112.01],KSDL:[33.62,-111.91],KIWA:[33.31,-111.65],KBOI:[43.56,-116.22],KSLC:[40.79,-111.98],KAPA:[39.57,-104.85],KDEN:[39.86,-104.67],
    KTEB:[40.85,-74.06],KHPN:[41.07,-73.71],KBOS:[42.36,-71.01],KIAD:[38.95,-77.46],KORD:[41.98,-87.90],KMDW:[41.79,-87.75],KDAL:[32.85,-96.85],KDFW:[32.90,-97.04],KAUS:[30.20,-97.67],KHOU:[29.65,-95.28],KMSY:[29.99,-90.26],KATL:[33.64,-84.43],KMIA:[25.80,-80.29],KOPF:[25.91,-80.28],KPBI:[26.68,-80.10],KTPA:[27.98,-82.53],KMCO:[28.43,-81.31],KBNA:[36.12,-86.68],KASE:[39.22,-106.87],KEGE:[39.64,-106.92],KJAC:[43.61,-110.74],KBZN:[45.78,-111.15],KMSP:[44.88,-93.22],KDTW:[42.21,-83.35],CYVR:[49.19,-123.18],CYYC:[51.12,-114.02],CYYZ:[43.68,-79.63],MMTJ:[32.54,-116.97],MMSD:[23.15,-109.72],MMPR:[20.68,-105.25],MMMX:[19.44,-99.07],MYNN:[25.04,-77.47],TJSJ:[18.44,-66.00]
  };
  function approximateDistance(origin,dest){
    const a=COORD[origin],b=COORD[dest];if(!a||!b)return null;
    const rad=Math.PI/180,dlat=(b[0]-a[0])*rad,dlon=(b[1]-a[1])*rad;
    const h=Math.sin(dlat/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dlon/2)**2;
    return Math.round(3440.065*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h))));
  }
  function aircraftProfile(){
    const a=selectedAircraft(),tail=String(a.tail||state.selectedAircraft||'');
    return /LONGITUDE|C700/i.test(tail+' '+(a.type||'')+' '+(a.model||''))?{tail,maxPax:8,maxBags:900,cruise:470,rate:7800,maxNm:3000,cls:'Super Midsize Jet'}:/800|HAWKER/i.test(tail+' '+(a.type||''))?
      {tail,maxPax:8,maxBags:600,cruise:410,rate:5900,maxNm:2050,cls:'Midsize Jet'}:
      {tail,maxPax:8,maxBags:700,cruise:490,rate:7400,maxNm:2600,cls:'Super Midsize Jet'};
  }
  function routePool(base){const own=region(base);const primary=(REGION_POOLS[own]||[]).slice();const allWest=Object.keys(AIRPORTS).filter(x=>x!==base);const local=allWest.filter(x=>region(x)===own);const otherRegions=REGION_ORDER.filter(r=>r!==own);const regional=[];otherRegions.forEach(r=>regional.push(...shuffle(allWest.filter(x=>region(x)===r)).slice(0,4)));return [...shuffle(local),...shuffle(primary),...shuffle(regional),...shuffle(allWest)]}
  function pickDiverseDestinations(base,count){const pool=routePool(base).filter(x=>x!==base);const out=[];const seenRegions=new Set();for(const dest of pool){const r=region(dest);if(!seenRegions.has(r)&&!out.includes(dest)){out.push(dest);seenRegions.add(r)}if(out.length>=Math.min(count,6))break}for(const dest of pool){if(out.length>=count)break;if(!out.includes(dest))out.push(dest)}return out}

  function sxWestCoastMarket(silent){
    ensureFleet110();
    const rawBase=String(selectedAircraft().location||state.homeBase||'KMEV').toUpperCase();
    const base=COORD[rawBase]?rawBase:String(state.homeBase||'KMEV').toUpperCase();
    const plane=aircraftProfile();
    state.marketBoard=Array.isArray(state.marketBoard)?state.marketBoard:[];
    const now=Date.now();
    const protectedRows=state.marketBoard.filter(x=>x&&(x.protected===true||x.manual===true||x.jobType==='CONTRACT'||x.status==='Accepted'));
    const used=new Set(protectedRows.map(x=>String(x.flight||'')));
    let n=nextNumber(used);
    const destinations=pickDiverseDestinations(base,45).filter(dest=>{const nm=approximateDistance(base,dest);return nm!==null&&nm>=70&&nm<=plane.maxNm}).slice(0,18);
    const profiles=shuffle(PROFILES);
    const generated=[];

    for(let i=0;i<destinations.length;i++){
      while(used.has('SXR'+n))n++;
      const p=profiles[i%profiles.length],dest=destinations[i],distance=approximateDistance(base,dest),pax=rand(Math.min(p.pax[0],plane.maxPax),Math.min(p.pax[1],plane.maxPax));
      const lastMinute=i<3;
      const bags=Math.min(plane.maxBags,realisticBaggage(p,pax,distance));
      const flightHours=Math.round((distance*1.08/plane.cruise+.35)*10)/10;
      const rushPremium=lastMinute?rand(1800,4200):0;
      const value=Math.round((Math.max(1.2,flightHours)*plane.rate+p.premium*.35+rushPremium)/50)*50;
      const estimatedCost=Math.round((Math.max(1.2,flightHours)*(plane.rate*.57)+650+bags*.5)/50)*50;
      const depDay=lastMinute?0:(i<7?0:(i<11?1:2));
      const departureTime=lastMinute?timePlusHours(1.5+i*.75):(depDay===0?timePlusHours(4+i*.45):TIMES[i%TIMES.length]);
      const expiryHours=lastMinute?(0.7+i*.35):(4.5+i*1.15);
      const event=lastMinute?('LAST-MINUTE REQUEST • '+p.event+' • Client needs rapid confirmation and expedited FBO coordination.'):p.event;

      generated.push({
        flight:'SXR'+n,origin:base,dest,client:p.client,pax,bags,value,
        expiry:new Date(now+expiryHours*3600000).toISOString(),event,
        category:p.category,charterType:lastMinute?'Last-Minute '+p.type:p.type,jobType:'MARKET',
        minClass:plane.cls,distance,estimatedFlightHours:flightHours,estimatedCost,estimatedProfit:value-estimatedCost,aircraft:plane.tail,
        departureDate:day(depDay),departureTime,status:'Available',westCoastMarket:true,
        lastMinute,availability:lastMinute?'LAST MINUTE':'SCHEDULED',rushPremium
      });
      used.add('SXR'+n);n++;
    }

    state.marketBoard=[...protectedRows,...generated];
    state.marketRevision='Expanded Domestic & International Charter Market v4.0';
    state.marketLocation=base;
    state.marketSeeded=true;
    saveState();
    if(!silent&&typeof renderMarket==='function')renderMarket();
    if(!silent&&typeof g==='function'&&g('marketStatus'))g('marketStatus').textContent='Charter market from '+base+' • '+plane.tail+' • great-circle distances, aircraft loads, estimated costs and last-minute requests.';
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