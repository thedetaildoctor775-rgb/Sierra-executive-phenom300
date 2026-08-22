(function(){
  if(typeof seedMarket!=='function'||typeof state==='undefined'||typeof selectedAircraft!=='function')return;
  if(window.__sxBalancedMarketRuntime)return;
  window.__sxBalancedMarketRuntime=true;

  const ROUTES={
    KRNO:['KSFO','KOAK','KSJC','KVNY','KLAX','KSDL','KLAS','KAPA','KSEA','KPDX','KSLC','KPHX','KDAL','KAUS','KTEB','KORD'],
    KSFO:['KRNO','KOAK','KSJC','KVNY','KLAX','KSEA','KPDX','KLAS','KSDL','KSLC','KAPA','KPHX','KDAL','KORD','KTEB'],
    KVNY:['KSFO','KRNO','KLAS','KSDL','KPHX','KSEA','KPDX','KSLC','KAPA','KDAL','KAUS','KORD','KTEB','KBOS'],
    KLAS:['KRNO','KSFO','KVNY','KSDL','KPHX','KSLC','KAPA','KSEA','KPDX','KDAL','KAUS','KORD','KTEB'],
    KSDL:['KRNO','KSFO','KVNY','KLAS','KPHX','KAPA','KSLC','KDAL','KAUS','KORD','KTEB','KBOS'],
    KAPA:['KRNO','KSFO','KVNY','KLAS','KSDL','KSLC','KDAL','KAUS','KORD','KTEB','KIAD'],
    KTEB:['KHPN','KBOS','KPHL','KIAD','KPIT','KORD','KATL','KMIA','KDAL','KDEN','KSFO','KVNY'],
    KHPN:['KTEB','KBOS','KPHL','KIAD','KPIT','KORD','KATL','KMIA','KDEN','KSFO','KVNY'],
    KBOS:['KTEB','KHPN','KPHL','KIAD','KORD','KATL','KMIA','KDEN','KSFO','KVNY'],
    KPHL:['KTEB','KHPN','KBOS','KIAD','KORD','KATL','KMIA','KDAL','KDEN','KSFO'],
    KIAD:['KTEB','KHPN','KBOS','KPHL','KATL','KMIA','KORD','KDAL','KDEN','KSFO'],
    KORD:['KTEB','KBOS','KIAD','KATL','KMIA','KDAL','KAUS','KDEN','KSFO','KLAX'],
    KDAL:['KAUS','KHOU','KDEN','KORD','KATL','KMIA','KPHX','KLAS','KSFO','KTEB'],
    KAUS:['KDAL','KHOU','KDEN','KORD','KATL','KMIA','KPHX','KLAS','KSFO','KTEB'],
    KSEA:['KPDX','KSFO','KRNO','KLAS','KDEN','KORD','KDAL','KTEB'],
    KPDX:['KSEA','KSFO','KRNO','KLAS','KDEN','KORD','KDAL','KTEB']
  };

  const PROFILES=[
    {client:'Hudson Sports Representation',category:'Sports',type:'Athlete Charter',event:'Professional athlete + agent movement',pax:4,bags:260,premium:6200},
    {client:'Sterling Artist Management',category:'Entertainment',type:'Celebrity / Talent Charter',event:'Recording artist appearance and media schedule',pax:5,bags:300,premium:8200},
    {client:'Park Avenue Family Office',category:'VIP',type:'VIP Leisure Charter',event:'Private family weekend movement',pax:5,bags:300,premium:7200},
    {client:'Vantage Peak Capital',category:'Corporate',type:'Executive Charter',event:'Executive meetings',pax:4,bags:220,premium:5000},
    {client:'Arena Hospitality Group',category:'Sports',type:'Event Charter',event:'Sponsor / event principal movement',pax:7,bags:390,premium:6500},
    {client:'Capitol Media Productions',category:'Entertainment',type:'Production Charter',event:'Live-event production leadership movement',pax:6,bags:360,premium:6800},
    {client:'North Shore Private Office',category:'VIP',type:'VIP Executive Charter',event:'Principal and security team movement',pax:4,bags:250,premium:8000},
    {client:'Atlantic Private Equity',category:'Corporate',type:'Executive Charter',event:'Deal team / board travel',pax:6,bags:300,premium:5200}
  ];

  const WEST=new Set(['KRNO','KSFO','KOAK','KSJC','KVNY','KLAX','KSEA','KPDX','KLAS','KSDL','KPHX','KSLC','KAPA','KDEN']);
  const CENTRAL=new Set(['KDAL','KAUS','KHOU','KORD','KMSP','KMCI']);
  const EAST=new Set(['KTEB','KHPN','KBOS','KPHL','KIAD','KPIT','KATL','KMIA']);

  function region(icao){if(WEST.has(icao))return'west';if(CENTRAL.has(icao))return'central';if(EAST.has(icao))return'east';return'other'}
  function day(days){const d=new Date(Date.now()+days*86400000);return d.toISOString().slice(0,10)}
  function nextNumber(used){let n=nextFlight();while(used.has('SXR'+n))n++;return n}

  function pickBalanced(routes,base,count){
    const groups={west:[],central:[],east:[],other:[]};
    routes.filter(x=>x!==base).forEach(x=>groups[region(x)].push(x));
    const order=['west','central','east','west','central','east','other','west','east','central'];
    const out=[];
    for(const r of order){
      const arr=groups[r];
      if(arr&&arr.length){
        const dest=arr.shift();
        if(!out.includes(dest))out.push(dest);
      }
      if(out.length>=count)break;
    }
    for(const dest of routes){if(out.length>=count)break;if(dest!==base&&!out.includes(dest))out.push(dest)}
    return out;
  }

  function sxBalancedMarket(silent){
    ensureFleet110();
    const base=String(selectedAircraft().location||'KRNO').toUpperCase();
    const routes=ROUTES[base]||['KSFO','KVNY','KLAS','KSDL','KAPA','KSEA','KPDX','KDAL','KORD','KTEB'];
    state.marketBoard=Array.isArray(state.marketBoard)?state.marketBoard:[];
    const now=Date.now();
    const protectedRows=state.marketBoard.filter(x=>x&&(x.protected===true||x.manual===true||x.jobType==='CONTRACT'||x.status==='Accepted'));
    const used=new Set(protectedRows.map(x=>String(x.flight||'')));
    let n=nextNumber(used);
    const destinations=pickBalanced(routes,base,8);
    const generated=[];
    for(let i=0;i<destinations.length;i++){
      while(used.has('SXR'+n))n++;
      const p=PROFILES[i%PROFILES.length],dest=destinations[i];
      const approx=region(base)===region(dest)?Math.round(250+Math.random()*850):Math.round(900+Math.random()*1800);
      const value=Math.round((p.premium+6500+approx*7.5)/50)*50;
      generated.push({
        flight:'SXR'+n,origin:base,dest,client:p.client,pax:p.pax,bags:sxRealisticBaggage(p.pax,p.bags),
        value,expiry:new Date(now+(5+i*1.6)*3600000).toISOString(),event:p.event,
        category:p.category,charterType:p.type,jobType:'MARKET',minClass:approx>1800?'Midsize Jet':approx>900?'Super Light Jet':'Light Jet',distance:approx,
        departureDate:day(i<4?0:1),departureTime:['07:10','08:20','09:45','11:15','13:05','14:40','16:10','17:35'][i%8],
        status:'Available',balancedMarket:true
      });
      used.add('SXR'+n);n++;
    }
    state.marketBoard=[...protectedRows,...generated];
    state.marketRevision='Balanced National Market v1.0';
    state.marketLocation=base;
    state.marketSeeded=true;
    saveState();
    if(!silent&&typeof renderMarket==='function')renderMarket();
    if(!silent&&typeof g==='function'&&g('marketStatus'))g('marketStatus').textContent='Balanced charter market active from '+base+' — regional, cross-country and East Coast options mixed.';
  }

  const originalSeedMarket=seedMarket;
  seedMarket=function(silent){originalSeedMarket(silent);sxBalancedMarket(silent)};
  window.sxBalancedMarket=sxBalancedMarket;
  sxBalancedMarket(false);
  setTimeout(()=>sxBalancedMarket(false),1200);
})();