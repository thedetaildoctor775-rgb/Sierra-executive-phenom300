function altNumber(v){
  const s=String(v||'').toUpperCase().replace(/,/g,'').trim();
  if(!s)return 0;
  const fl=s.match(/FL\s*(\d{2,3})/); if(fl)return Number(fl[1])*100;
  const n=s.match(/\d{3,5}/); return n?Number(n[0]):0;
}
function reportedAltitude(text){
  const s=String(text||'').toLowerCase().replace(/,/g,'');
  let m=s.match(/\b(\d{4,5})\s+(?:climbing|for)\s+\d{4,5}\b/); if(m)return Number(m[1]);
  m=s.match(/\b(?:passing|level|at|leaving|through)\s+(\d{4,5})\b/); if(m)return Number(m[1]);
  return 0;
}
async function simbriefProfile(){
  const userid=process.env.SIMBRIEF_USERID||'1237035';
  try{
    const r=await fetch(`https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(userid)}&json=v2`,{headers:{Accept:'application/json','User-Agent':'Sierra-Executive-Phenom300/1.0'}});
    if(!r.ok)return null;
    const x=await r.json();
    const fixes=Array.isArray(x?.navlog?.fix)?x.navlog.fix:[];
    return {
      route:String(x?.general?.route||x?.general?.route_ifps||''),
      cruise:String(x?.general?.initial_altitude||x?.general?.cruise_altitude||''),
      fixes:fixes.slice(0,40).map(f=>({
        ident:String(f?.ident||f?.name||''),
        airway:String(f?.via_airway||f?.airway||''),
        altitude:Number(f?.altitude_feet||f?.altitude||f?.plan_altitude||0)||0,
        minAltitude:Number(f?.altitude_min||f?.min_altitude||0)||0,
        maxAltitude:Number(f?.altitude_max||f?.max_altitude||0)||0,
        constraint:String(f?.altitude_constraint||f?.restriction||'')
      })).filter(f=>f.ident)
    };
  }catch{return null}
}
function nextClimb(profile,assigned,cruise){
  const cr=altNumber(cruise)||45000;
  const a=assigned||5000;
  const explicit=(profile?.fixes||[])
    .flatMap(f=>[Number(f.minAltitude)||0,Number(f.maxAltitude)||0])
    .filter(x=>x>a+500&&x<=cr).sort((x,y)=>x-y)[0]||0;
  const planned=(profile?.fixes||[]).map(f=>Number(f.altitude)||0).filter(x=>x>a+1000&&x<=cr).sort((x,y)=>x-y)[0]||0;
  let fallback=a<10000?10000:a<18000?18000:a<28000?28000:Math.min(a+10000,cr);
  if(explicit)fallback=Math.min(fallback,explicit);
  else if(planned)fallback=Math.min(fallback,planned);
  return Math.max(a,Math.min(fallback,cr));
}
function sameRunway(a,b){
  const clean=x=>String(x||'').toUpperCase().replace(/RUNWAY|RWY|\s/g,'');
  return clean(a)&&clean(a)===clean(b);
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(500).json({error:'OPENAI_API_KEY is not configured'});
  const b=req.body||{};
  const state=b.state||{};
  const pilot=String(b.transmission||'').trim();
  if(!pilot) return res.status(400).json({error:'No transmission'});

  const loadedCallsign=String(state.callsign||state.flight||state.tail||'').trim();
  const cs=loadedCallsign||'Aircraft';
  const p=pilot.toLowerCase();
  const currentController=String(state.controller||'').toLowerCase();
  const runway=String(state.runway||'').trim();

  const readyForDeparture=/ready for departure|ready for takeoff/.test(p);
  const takeoffReadback=/\b(?:cleared|clear) for takeoff\b/.test(p)&&!readyForDeparture;
  const holdingShort=/holding short|hold short/.test(p);
  const airborne=/\bairborne\b|passing\s+\d|climbing out|positive rate/.test(p);
  const readyToTaxi=/ready to taxi|request(?:ing)? taxi|\btaxi request\b/.test(p);
  const pushback=/ready for pushback|request(?:ing)? pushback|pushback and start|push and start/.test(p);
  const ifrClearanceRequest=/ready for ifr clearance|request(?:ing)? ifr clearance|\bifr clearance\b/.test(p);
  const groundCheckin=/\bground\b/.test(p)&&!/departure frequency|after departure/.test(p);
  const towerCheckin=/\btower\b/.test(p)&&!/contact tower/.test(p);
  const explicitDepartureCheckin=/\b(?:san francisco\s+)?departure\b/.test(p)&&!/departure frequency|after departure|departure runway|departure procedure|departure clearance|contact departure/.test(p);
  const centerCheckin=/\bcenter\b/.test(p)&&!/contact center/.test(p);
  const approachCheckin=/\bapproach\b/.test(p)&&!/contact approach/.test(p);
  const groundMovement=readyToTaxi||pushback||/taxi to parking|runway vacated|clear of runway/.test(p);
  const clearanceContext=ifrClearanceRequest || (currentController.includes('clearance') && !groundCheckin && !groundMovement && !readyForDeparture && !holdingShort && !airborne && !explicitDepartureCheckin);

  // Hard facility-state guards. These prevent the model from falling back into the wrong phase.
  if(pushback){
    return res.status(200).json({ok:true,reply:`${cs}, pushback approved, start at your discretion.`,controller:'Ground',frequency:'121.8',runway:state.runway||'',squawk:state.squawk||'',heading:state.heading||'',altitude:state.altitude||'',speed:state.speed||'',clearance:'Pushback approved; start at your discretion',phase:'Ground'});
  }
  if(readyToTaxi){
    const rwy=runway||'28L';
    return res.status(200).json({ok:true,reply:`${cs}, runway ${rwy}, taxi via Alpha, hold short of runway ${rwy}.`,controller:'Ground',frequency:'121.8',runway:rwy,squawk:state.squawk||'',heading:state.heading||'',altitude:state.altitude||'',speed:state.speed||'',clearance:`Runway ${rwy}, taxi via Alpha, hold short of runway ${rwy}`,phase:'Ground'});
  }
  if(takeoffReadback && currentController.includes('tower')){
    return res.status(200).json({ok:true,reply:`${cs}, readback correct.`,controller:state.controller||'Tower',frequency:state.frequency||'120.5',runway:state.runway||'',squawk:state.squawk||'',heading:state.heading||'',altitude:state.altitude||'',speed:state.speed||'',clearance:state.clearance||`Cleared for takeoff runway ${runway||'assigned'}`,phase:'Takeoff'});
  }
  if(readyForDeparture && currentController.includes('ground')){
    return res.status(200).json({ok:true,reply:`${cs}, contact Tower 120.5.`,controller:'Tower',frequency:'120.5',runway:state.runway||'',squawk:state.squawk||'',heading:state.heading||'',altitude:state.altitude||'',speed:state.speed||'',clearance:state.clearance||'',phase:'Tower'});
  }
  if(readyForDeparture && currentController.includes('tower')){
    return res.status(200).json({ok:true,reply:`${cs}, runway ${runway||'assigned'}, cleared for takeoff.`,controller:state.controller||'Tower',frequency:'120.5',runway:state.runway||'',squawk:state.squawk||'',heading:state.heading||'',altitude:state.altitude||'',speed:state.speed||'',clearance:`Cleared for takeoff runway ${runway||'assigned'}`,phase:'Takeoff'});
  }
  if(holdingShort && currentController.includes('tower') && !readyForDeparture){
    return res.status(200).json({ok:true,reply:`${cs}, runway ${runway||'assigned'}, cleared for takeoff.`,controller:state.controller||'Tower',frequency:'120.5',runway:state.runway||'',squawk:state.squawk||'',heading:state.heading||'',altitude:state.altitude||'',speed:state.speed||'',clearance:`Cleared for takeoff runway ${runway||'assigned'}`,phase:'Takeoff'});
  }

  const inferredStage=
    /runway vacated|clear of runway|taxi to parking/.test(p)?'ground':
    groundMovement||groundCheckin?'ground':
    towerCheckin||readyForDeparture||holdingShort||takeoffReadback?'tower':
    approachCheckin||/ready for descent|descending|established|final|landing/.test(p)?'approach':
    centerCheckin?'center':
    explicitDepartureCheckin||airborne?'departure':
    clearanceContext?'clearance':'';

  const repAlt=reportedAltitude(pilot);
  const sb=(currentController.includes('departure')||currentController.includes('center')||inferredStage==='departure'||inferredStage==='center')?await simbriefProfile():null;

  const system=`You are SIERRA ATC, a realistic U.S. FAA-style air traffic controller for a FLIGHT SIMULATOR ONLY. Use concise, natural FAA-style radio phraseology and one controller transmission at a time.

CALLSIGN LOCK:
- Loaded callsign is authoritative: ${loadedCallsign||'(none loaded)'}.
- Never replace it with a misheard transcript callsign.

FACILITY STATE MACHINE:
- Clearance Delivery handles only IFR clearance and clearance readbacks.
- Ground handles Ground check-in, pushback, start, taxi, and post-landing ground movement.
- Tower handles hold-short, runway, takeoff and landing operations.
- Departure handles the initial climb after takeoff.
- Center handles enroute climb/cruise.
- Approach handles arrival/descent before Tower.
- A taxi or pushback request can NEVER produce an IFR clearance.
- A pilot readback containing "cleared for takeoff" is an acknowledgement of Tower's clearance, not a new takeoff request. Respond only with a brief readback acknowledgement and do not issue the takeoff clearance again.
- Preserve the active controller until a real handoff/check-in.

ROUTE / SID PROFILE:
- SIM STATE.route is authoritative. Never invent or rename route elements.
- SIM STATE.simbriefProfile is supplemental planning guidance from the latest SimBrief OFP. Use fix sequence and explicit altitude/min/max/constraint fields when present.
- Do NOT claim a charted restriction exists unless SIM STATE.simbriefProfile explicitly provides one.
- If no explicit restriction is available, use the SimBrief planned profile plus normal simulated ATC progression.

CLIMB PROGRESSION:
- Do not repeatedly assign the same altitude after the pilot reports meaningful progress.
- On Departure, when the pilot is within about 1,500 ft of the assigned altitude, issue the next reasonable climb unless a known SimBrief constraint requires otherwise.
- Progress toward SIM STATE.cruise in stages.
- Once established in the higher climb, hand the aircraft to Center rather than keeping it on Departure to cruise.

GROUND PHRASEOLOGY:
- Taxi order: runway first, then "taxi via", then "hold short of runway ...".
- Never issue a new IFR clearance in response to ready-to-taxi, pushback, or start requests.

READBACKS:
- Accept phonetic/speech-recognition errors when meaning is clear. Correct only material runway/altitude/heading/squawk/frequency/route errors.

Output strict JSON with keys: reply, controller, frequency, runway, squawk, heading, altitude, speed, clearance, phase. This is simulation, not live ATC.`;

  const context={flight:state.flight||'',callsign:loadedCallsign,tail:state.tail||'',aircraft:state.aircraft||'',origin:state.origin||'',destination:state.destination||'',alternate:state.alternate||'',route:state.route||'',cruise:state.cruise||'',phase:state.phase||'',controller:state.controller||'',frequency:state.frequency||'',runway:state.runway||'',squawk:state.squawk||'',heading:state.heading||'',altitude:state.altitude||'',speed:state.speed||'',clearance:state.clearance||'',inferredStage,reportedAltitude:repAlt,simbriefProfile:sb};

  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:'gpt-5.6-luna',input:[{role:'system',content:[{type:'input_text',text:system}]},{role:'user',content:[{type:'input_text',text:`SIM STATE:\n${JSON.stringify(context)}\n\nPILOT TRANSMISSION:\n${pilot}`}]}],text:{format:{type:'json_object'}}})});
    const j=await r.json();
    if(!r.ok)return res.status(r.status).json({error:j?.error?.message||'ATC model error'});
    let text=j.output_text||''; if(!text&&Array.isArray(j.output))for(const item of j.output||[])for(const c of item.content||[])if(c.type==='output_text')text+=c.text||'';
    let out;try{out=JSON.parse(text)}catch{out={reply:text}};

    const previous={controller:String(state.controller||''),frequency:String(state.frequency||''),runway:String(state.runway||''),squawk:String(state.squawk||''),heading:String(state.heading||''),altitude:String(state.altitude||''),speed:String(state.speed||''),clearance:String(state.clearance||''),phase:String(state.phase||'')};
    for(const k of Object.keys(previous))if((out[k]===undefined||out[k]===null||String(out[k]).trim()==='')&&previous[k])out[k]=previous[k];

    const facilityNames={clearance:'Clearance Delivery',ground:'Ground',tower:'Tower',departure:'Departure',center:'Center',approach:'Approach'};
    const facilityFreqs={ground:'121.8',tower:'120.5',departure:'125.35',center:'127.45',approach:'124.9'};
    if(inferredStage){
      if(inferredStage==='clearance'){
        out.controller=previous.controller.toLowerCase().includes('clearance')?previous.controller:'Clearance Delivery';
        out.frequency=previous.controller.toLowerCase().includes('clearance')?previous.frequency:'';
      }else{
        out.controller=facilityNames[inferredStage];
        out.frequency=facilityFreqs[inferredStage];
      }
    }

    const assigned=altNumber(previous.altitude);
    const outAlt=altNumber(out.altitude);
    if(currentController.includes('departure')&&repAlt&&assigned&&repAlt>=assigned-1500&&outAlt<=assigned){
      const next=nextClimb(sb,assigned,state.cruise);
      if(next>assigned){
        if(assigned>=18000||next>=28000){
          out.reply=`${cs}, contact Center 127.45.`;
          out.controller='Center';out.frequency='127.45';out.phase='Center';
        }else{
          out.altitude=String(next);out.clearance=`Climb and maintain ${next.toLocaleString('en-US')}`;out.reply=`${cs}, climb and maintain ${next.toLocaleString('en-US')}.`;out.controller=previous.controller||'Departure';out.frequency=previous.frequency||'125.35';out.phase='Climb';
        }
      }
    }

    if(previous.runway&&out.runway&&!sameRunway(previous.runway,out.runway)&&!String(out.reply||'').toLowerCase().includes('runway change'))out.runway=previous.runway;

    return res.status(200).json({ok:true,...out});
  }catch(e){return res.status(500).json({error:e.message||'ATC request failed'})}
}
