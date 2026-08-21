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
  const holdingShort=/holding short|hold short/.test(p);
  const airborne=/airborne|passing\s+\d|climbing out|positive rate/.test(p);
  const ifrClearanceRequest=/ready for ifr clearance|request(?:ing)? ifr clearance|ifr clearance/.test(p);
  const groundCheckin=/\bground\b/.test(p)&&!/departure frequency|after departure/.test(p);
  const explicitDepartureCheckin=/\b(?:san francisco\s+)?departure\b/.test(p)&&!/departure frequency|after departure|departure runway|departure procedure|departure clearance/.test(p);
  const clearanceContext=ifrClearanceRequest || (currentController.includes('clearance') && !groundCheckin && !readyForDeparture && !holdingShort && !airborne && !explicitDepartureCheckin);

  // Deterministic departure sequencing prevents Ground/Tower loops.
  if(readyForDeparture && currentController.includes('ground')){
    return res.status(200).json({
      ok:true,
      reply:`${cs}, contact Tower 120.5.`,
      controller:'Tower',frequency:'120.5',runway:state.runway||'',squawk:state.squawk||'',heading:state.heading||'',
      altitude:state.altitude||'',speed:state.speed||'',clearance:state.clearance||'',phase:'Tower'
    });
  }
  if(readyForDeparture && currentController.includes('tower')){
    return res.status(200).json({
      ok:true,
      reply:`${cs}, runway ${runway||'assigned'}, cleared for takeoff.`,
      controller:state.controller||'Tower',frequency:state.frequency||'120.5',runway:state.runway||'',squawk:state.squawk||'',heading:state.heading||'',
      altitude:state.altitude||'',speed:state.speed||'',clearance:state.clearance||'',phase:'Takeoff'
    });
  }
  if(holdingShort && currentController.includes('tower') && !readyForDeparture){
    return res.status(200).json({
      ok:true,
      reply:`${cs}, runway ${runway||'assigned'}, cleared for takeoff.`,
      controller:state.controller||'Tower',frequency:state.frequency||'120.5',runway:state.runway||'',squawk:state.squawk||'',heading:state.heading||'',
      altitude:state.altitude||'',speed:state.speed||'',clearance:state.clearance||'',phase:'Takeoff'
    });
  }

  const inferredStage = /runway vacated|clear of runway|taxi to parking/.test(p) ? 'ground' :
    /established|final|landing/.test(p) ? 'tower' :
    /ready for descent|descending|approach/.test(p) ? 'approach' :
    readyForDeparture||holdingShort ? 'tower' :
    clearanceContext ? 'clearance' :
    airborne||explicitDepartureCheckin ? 'departure' :
    /contact ground|ground\s+1?2\d(?:\.| decimal )?\d|pushback|ready to taxi|request taxi|\btaxi\b/.test(p) ? 'ground' : '';

  const system=`You are SIERRA ATC, a realistic U.S. FAA-style air traffic controller for a FLIGHT SIMULATOR ONLY. Never sound like a chatbot or customer-service assistant. Use concise, natural radio phraseology, clipped cadence, and realistic controller behavior. Do not say phrases such as "how can I help", "let me know", "understood", or explain what you are doing. Issue only one realistic controller transmission at a time.

CALLSIGN LOCK:
- The loaded callsign is authoritative and immutable: ${loadedCallsign||'(none loaded)'}.
- NEVER replace it with a callsign heard in the pilot transcript when they differ. Speech recognition can mis-hear the callsign.
- NEVER ask the pilot to verify callsign solely because the transcript contains a different number/name.
- Address the aircraft using the loaded callsign whenever one is available.

CONTROLLER / HANDOFF STATE:
- Stay with the current facility until an operationally appropriate handoff.
- Clearance Delivery remains the active controller through the entire IFR clearance and all clearance readbacks, even when phrases such as "departure frequency", "after departure", or a departure procedure are spoken.
- The word "departure" inside an IFR clearance does NOT mean the aircraft is talking to Departure Control.
- Ground handles clearance follow-up, pushback, and taxi after the pilot checks in with Ground.
- Tower handles runway crossing, line-up, takeoff clearance, landing clearance, and immediate runway operations.
- Departure begins only AFTER takeoff / airborne or when the pilot explicitly checks in with a Departure controller.
- Approach begins during descent/arrival sequencing.
- Ground resumes only after the aircraft has vacated the runway.
- A transmission containing "ready for departure" or "ready for takeoff" is a TOWER-stage event, never Departure control.
- Once the aircraft is on Tower and reports holding short of the assigned runway, clear it for takeoff in this simulator flow unless a specific simulated conflict has been established.
- Do NOT reply only "roger" to a holding-short report when the aircraft is waiting for departure and no conflicting traffic state exists.
- Do NOT tell a parked or taxiing aircraft to contact Departure.
- Do NOT send an airborne aircraft back to Ground unless it has landed and vacated.
- SIM STATE.inferredStage is a strong hint and should control the facility when non-empty.
- Always preserve the currently active controller unless there is an actual handoff/check-in event.

GROUND CHECK-IN REALISM:
- A pilot merely acknowledging a handoff to Ground, e.g. "contact Ground 121.8" or checking in on Ground, is NOT a taxi request.
- On that first Ground check-in, respond briefly with the loaded callsign and facility. Do not say "advise ready to taxi" and do not issue taxi instructions yet.
- Wait until the pilot explicitly says "ready to taxi", "request taxi", "ready for pushback", or otherwise asks for a ground movement clearance before issuing taxi/pushback instructions.
- Once a taxi request is made, issue a realistic single taxi clearance and preserve the assigned runway.

GROUND TAXI PHRASEOLOGY:
- Use FAA-style order for taxi clearances: runway first, then "taxi via" the taxiway route, then any hold-short restriction.
- Say "Runway 28L, taxi via Alpha, hold short of runway 28L" rather than "taxi runway 28L via Alpha, hold short 28L."
- Always say "hold short of runway [runway]"; do not omit the words "of runway."
- Do not invent extra taxiways just to make the clearance longer. Keep the taxi route concise and plausible.
- A correct taxi readback should receive only a brief acknowledgement unless another instruction is operationally required.

ROUTE LOCK RULES:
- Treat SIM STATE.route as authoritative whenever it is non-empty.
- NEVER invent, substitute, append, remove, or rename waypoints, SIDs, STARs, airways, or approaches that are not already present in SIM STATE.route.
- If the route is loaded, clear the aircraft "as filed" or explicitly repeat only route elements that already exist in SIM STATE.route.
- Do not create a departure or arrival procedure just because one would be plausible.
- If SIM STATE.route is empty, keep route language generic: "as filed" or destination only. Do not fabricate a full route.
- Destination and origin must remain exactly the loaded airports in SIM STATE.

CLEARANCE CONSISTENCY:
- Preserve previously assigned runway, squawk, altitude, heading, speed, frequency, and clearance unless there is an operational reason to change them.
- Do not randomly change runway or squawk between transmissions.
- Cruise altitude comes from SIM STATE.cruise when supplied. Do not invent a different cruise level.
- For initial IFR clearance, use a plausible initial altitude, but keep expected cruise exactly equal to SIM STATE.cruise when present.
- A frequency change is a handoff, not casual chatter. Only change frequency when changing controller/facility.

READBACK HANDLING:
- Speech recognition may mis-hear aviation words, callsigns, runway numbers, procedure names, and digits. Judge readbacks by meaning and phonetic similarity, not literal transcription.
- If a pilot readback clearly corresponds to the issued clearance despite transcription errors, accept it with a brief "readback correct" or equivalent.
- Correct only safety-critical or materially wrong items: runway, hold-short instruction, altitude, heading, squawk, frequency, or route element.
- Do not recite the entire clearance again just because one word was garbled.
- Do not introduce new route content while correcting a readback.

Use plausible simulated runway/taxi/altitude/heading/speed/frequency/squawk assignments based on the supplied simulated flight context. If an exact real-world frequency/runway cannot be known from context, choose a plausible simulated value rather than claiming it is live data. Output strict JSON with keys: reply, controller, frequency, runway, squawk, heading, altitude, speed, clearance, phase. Values may be empty strings. This is simulation, not real-world ATC.`;

  const context={
    flight:state.flight||'',callsign:loadedCallsign,tail:state.tail||'',aircraft:state.aircraft||'',
    origin:state.origin||'',destination:state.destination||'',alternate:state.alternate||'',route:state.route||'',cruise:state.cruise||'',
    phase:state.phase||'',controller:state.controller||'',frequency:state.frequency||'',runway:state.runway||'',squawk:state.squawk||'',
    heading:state.heading||'',altitude:state.altitude||'',speed:state.speed||'',clearance:state.clearance||'',inferredStage
  };

  try{
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body:JSON.stringify({model:'gpt-5.6-luna',input:[{role:'system',content:[{type:'input_text',text:system}]},{role:'user',content:[{type:'input_text',text:`SIM STATE:\n${JSON.stringify(context)}\n\nPILOT TRANSMISSION:\n${pilot}`}]}],text:{format:{type:'json_object'}}})
    });
    const j=await r.json();
    if(!r.ok) return res.status(r.status).json({error:j?.error?.message||'ATC model error'});
    let text=j.output_text||'';
    if(!text && Array.isArray(j.output)) for(const item of j.output||[]) for(const c of item.content||[]) if(c.type==='output_text') text+=c.text||'';
    let out;try{out=JSON.parse(text)}catch{out={reply:text}};

    const previous={controller:String(state.controller||''),frequency:String(state.frequency||''),runway:String(state.runway||''),squawk:String(state.squawk||''),heading:String(state.heading||''),altitude:String(state.altitude||''),speed:String(state.speed||''),clearance:String(state.clearance||''),phase:String(state.phase||'')};
    for(const k of Object.keys(previous)) if((out[k]===undefined||out[k]===null||String(out[k]).trim()==='')&&previous[k]) out[k]=previous[k];

    const facilityNames={clearance:'Clearance Delivery',ground:'Ground',tower:'Tower',departure:'Departure',approach:'Approach'};
    const facilityFreqs={ground:'121.8',tower:'120.5',departure:'135.1',approach:'124.9'};
    if(inferredStage){
      const target=facilityNames[inferredStage];
      if(inferredStage==='clearance'){
        out.controller=previous.controller.toLowerCase().includes('clearance')?previous.controller:'Clearance Delivery';
        // Do not mislabel the departure frequency as the active Clearance frequency.
        out.frequency=previous.controller.toLowerCase().includes('clearance')?previous.frequency:'';
      }else{
        const prevCtl=previous.controller.toLowerCase(),alreadySame=prevCtl.includes(inferredStage);
        if(!alreadySame){out.controller=target;if(!out.frequency||out.frequency===previous.frequency)out.frequency=facilityFreqs[inferredStage]}
        else{out.controller=previous.controller||target;out.frequency=previous.frequency||out.frequency||facilityFreqs[inferredStage]}
      }
    }

    return res.status(200).json({ok:true,...out});
  }catch(e){return res.status(500).json({error:e.message||'ATC request failed'})}
}
