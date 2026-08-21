(function(){
  if(typeof seedMarket!=='function'||typeof state==='undefined'||typeof selectedAircraft!=='function')return;
  if(window.__sxNortheastMarketRuntime)return;
  window.__sxNortheastMarketRuntime=true;

  const ROUTES={
    KTEB:['KHPN','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM','KALB'],
    KHPN:['KTEB','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM','KALB'],
    KBED:['KTEB','KHPN','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM','KALB'],
    KBOS:['KTEB','KHPN','KBED','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM','KALB'],
    KPVD:['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM','KALB'],
    KACK:['KTEB','KHPN','KBED','KBOS','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM','KALB'],
    KMVY:['KTEB','KHPN','KBED','KBOS','KACK','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM','KALB'],
    KPHL:['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPVD','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM','KALB'],
    KIAD:['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KBWI','KBUF','KPIT','KBTV','KPWM','KALB'],
    KBWI:['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBUF','KPIT','KBTV','KPWM','KALB'],
    KBUF:['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KPIT','KBTV','KPWM','KALB'],
    KPIT:['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KBTV','KPWM','KALB'],
    KALB:['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM'],
    KBTV:['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KPWM','KALB'],
    KPWM:['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KALB'],
    KVNY:['KTEB','KHPN','KBED','KPHL','KIAD','KBOS'],
    KSFO:['KTEB','KHPN','KBED','KPHL','KIAD','KBOS'],
    KSDL:['KTEB','KHPN','KPHL','KIAD','KBOS'],
    KLAS:['KTEB','KHPN','KPHL','KIAD','KBOS'],
    KAPA:['KTEB','KHPN','KBED','KPHL','KIAD','KBOS'],
    KRNO:['KTEB','KHPN','KBED','KPHL','KIAD','KBOS']
  };

  const COORD={
    KTEB:[40.8501,-74.0608],KHPN:[41.0670,-73.7076],KBED:[42.4700,-71.2890],KBOS:[42.3656,-71.0096],
    KACK:[41.2531,-70.0602],KMVY:[41.3931,-70.6143],KPVD:[41.7240,-71.4282],KPHL:[39.8744,-75.2424],
    KIAD:[38.9531,-77.4565],KBWI:[39.1754,-76.6684],KBUF:[42.9405,-78.7322],KPIT:[40.4915,-80.2329],
    KBTV:[44.4719,-73.1533],KPWM:[43.6462,-70.3093],KALB:[42.7483,-73.8017],KVNY:[34.2098,-118.4899],
    KSFO:[37.6213,-122.3790],KSDL:[33.6229,-111.9105],KLAS:[36.0840,-115.1537],KAPA:[39.5701,-104.8493],KRNO:[39.4991,-119.7681]
  };

  const PROFILES=[
    {client:'Hudson Sports Representation',category:'Sports',type:'Athlete Charter',event:'Professional athlete + agent movement',pax:4,bags:260,premium:6200},
    {client:'Atlantic Player Management',category:'Sports',type:'Athlete Charter',event:'Pro athlete family / offseason travel',pax:5,bags:310,premium:6800},
    {client:'Metro Team Operations',category:'Sports',type:'Team Executive Charter',event:'Team ownership and operations movement',pax:6,bags:360,premium:7600},
    {client:'Sterling Artist Management',category:'Entertainment',type:'Celebrity / Talent Charter',event:'Recording artist appearance and media schedule',pax:5,bags:300,premium:8200},
    {client:'Beacon Talent Group',category:'Entertainment',type:'Celebrity / Talent Charter',event:'A-list talent and management movement',pax:6,bags:340,premium:9000},
    {client:'Broadway Touring Partners',category:'Entertainment',type:'Production Charter',event:'Lead talent / producer movement',pax:5,bags:320,premium:7000},
    {client:'Park Avenue Family Office',category:'VIP',type:'VIP Leisure Charter',event:'Private family weekend movement',pax:5,bags:300,premium:7200},
    {client:'North Shore Private Office',category:'VIP',type:'VIP Executive Charter',event:'Principal and security team movement',pax:4,bags:250,premium:8000},
    {client:'Arena Hospitality Group',category:'Sports',type:'Event Charter',event:'Courtside sponsor / event principal movement',pax:7,bags:390,premium:6500},
    {client:'Capitol Media Productions',category:'Entertainment',type:'Production Charter',event:'Live-event production leadership movement',pax:6,bags:360,premium:6800},
    {client:'Hudson Capital Partners',category:'Corporate',type:'Executive Charter',event:'Same-day Northeast executive meetings',pax:4,bags:220,premium:4600},
    {client:'Atlantic Private Equity',category:'Corporate',type:'Executive Charter',event:'Deal team / board travel',pax:6,bags:300,premium:5200}
  ];

  const NE=new Set(['KTEB','KHPN','KBED','KBOS','KACK','KMVY','KPVD','KPHL','KIAD','KBWI','KBUF','KPIT','KBTV','KPWM','KALB']);
  function nm(a,b){const A=COORD[a],B=COORD[b];if(!A||!B)return 0;const r=3440.065,t=x=>x*Math.PI/180,dl=t(B[0]-A[0]),dn=t(B[1]-A[1]);const q=Math.sin(dl/2)**2+Math.cos(t(A[0]))*Math.cos(t(B[0]))*Math.sin(dn/2)**2;return Math.round(r*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)))}
  function day(days){const d=new Date(Date.now()+days*86400000);return d.toISOString().slice(0,10)}
  function nextNumber(used){let n=nextFlight();while(used.has('SXR'+n))n++;return n}

  function sxBoostNortheastMarket(silent){
    ensureFleet110();
    const base=String(selectedAircraft().location||'KVNY').toUpperCase();
    const routes=ROUTES[base];
    if(!routes||!routes.length)return;
    state.marketBoard=Array.isArray(state.marketBoard)?state.marketBoard:[];
    const now=Date.now();
    const protectedRows=state.marketBoard.filter(x=>x&&(x.protected===true||x.manual===true||x.jobType==='CONTRACT'||x.status==='Accepted'));
    const used=new Set(protectedRows.map(x=>String(x.flight||'')));
    let n=nextNumber(used);
    const target=NE.has(base)?10:8;
    const premium=[];
    for(let i=0;i<PROFILES.length&&premium.length<target;i++){
      while(used.has('SXR'+n))n++;
      const p=PROFILES[i],dest=routes[i%routes.length];
      if(!dest||dest===base)continue;
      const miles=nm(base,dest)||Math.round(350+Math.random()*1600);
      const value=Math.round((p.premium+7200+miles*(miles>1200?7.4:9.2))/50)*50;
      premium.push({
        flight:'SXR'+n,origin:base,dest,client:p.client,pax:p.pax,bags:sxRealisticBaggage(p.pax,p.bags),
        value,expiry:new Date(now+(5+i*1.75)*3600000).toISOString(),event:p.event,
        category:p.category,charterType:p.type,jobType:'MARKET',
        minClass:miles>1800?'Midsize Jet':miles>900?'Super Light Jet':'Light Jet',distance:miles,
        departureDate:day(i<5?0:1),departureTime:['07:10','08:20','09:45','11:15','13:05','14:40','16:10','17:35','19:00','20:15'][premium.length%10],
        status:'Available',northeastPremium:true
      });
      used.add('SXR'+n);n++;
    }
    const normalKeep=state.marketBoard.filter(x=>x&&!x.northeastPremium&&!protectedRows.includes(x)&&x.status!=='Declined').slice(0,2);
    state.marketBoard=[...protectedRows,...premium,...normalKeep];
    state.marketRevision='Northeast Premium Market v2.0';
    state.marketLocation=base;
    state.marketSeeded=true;
    saveState();
    if(!silent&&typeof renderMarket==='function')renderMarket();
    if(!silent&&typeof g==='function'&&g('marketStatus'))g('marketStatus').textContent='Northeast premium market active — sports, talent, VIP and executive demand boosted from '+base+'.';
  }

  const originalSeedMarket=seedMarket;
  seedMarket=function(silent){originalSeedMarket(silent);sxBoostNortheastMarket(silent)};
  window.sxBoostNortheastMarket=sxBoostNortheastMarket;
  sxBoostNortheastMarket(false);
  setTimeout(()=>sxBoostNortheastMarket(false),1800);
})();