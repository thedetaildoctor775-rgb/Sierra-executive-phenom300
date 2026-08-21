export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(500).json({error:'OPENAI_API_KEY is not configured'});
  const text=String(req.body?.text||'').trim();
  if(!text) return res.status(400).json({error:'No text'});

  const requested=String(req.body?.controller||'').toLowerCase();
  const t=text.toLowerCase();
  const facility = requested.includes('clearance') ? 'clearance' :
    requested.includes('ground') ? 'ground' :
    requested.includes('tower') ? 'tower' :
    requested.includes('departure') ? 'departure' :
    requested.includes('approach') ? 'approach' :
    requested.includes('center') ? 'center' :
    /cleared .* via|ifr clearance|clearance delivery|squawk/.test(t) && !/taxi|takeoff|airborne|climb|descent|approach/.test(t) ? 'clearance' :
    /pushback|taxi|ground|ramp|hold short/.test(t) && !/cleared for takeoff/.test(t) ? 'ground' :
    /tower|cleared for takeoff|cleared to land|line up|runway/.test(t) ? 'tower' :
    /departure|climb and maintain|radar contact/.test(t) ? 'departure' :
    /approach|descend and maintain|established|localizer|glideslope/.test(t) ? 'approach' : 'center';

  const profiles={
    clearance:{voice:'sage',speed:1.00,instructions:'Speak like a real U.S. FAA Clearance Delivery controller on VHF radio. Neutral American accent. Calm, measured, methodical, slightly lower energy. Read route, altitude, departure frequency and squawk clearly and deliberately. Professional, concise, natural controller cadence. Do not sound like a narrator, chatbot, customer service agent, or dramatic actor.'},
    ground:{voice:'onyx',speed:1.03,instructions:'Speak like a real U.S. FAA Ground controller on VHF radio. Neutral American accent. Mature, deeper voice, calm and clipped, slightly dry and efficient. Taxiways, runway hold-short instructions and pushback directions must be crisp. Natural busy-ground cadence, never theatrical or conversational.'},
    tower:{voice:'cedar',speed:1.06,instructions:'Speak like a real U.S. FAA Tower controller on VHF radio. Neutral American accent. Clear, authoritative, alert, confident, slightly brisk. Takeoff, landing, runway and traffic instructions should sound decisive and operational. Natural tower cadence, no announcer or chatbot tone.'},
    departure:{voice:'ash',speed:1.09,instructions:'Speak like a real U.S. FAA Departure controller on VHF radio. Neutral American accent. Fast, energetic, precise and professional. Headings, climb instructions, altitudes and frequency handoffs should be delivered quickly but clearly with realistic radar-controller cadence.'},
    approach:{voice:'coral',speed:1.05,instructions:'Speak like a real U.S. FAA Approach controller on VHF radio. Neutral American accent. Controlled, focused, efficient and slightly brisk. Descents, vectors, speeds, approach clearances and runway assignments must be crisp and easy to understand. Natural TRACON cadence.'},
    center:{voice:'marin',speed:1.02,instructions:'Speak like a real U.S. FAA Center controller on VHF radio. Neutral American accent. Mature, composed, relaxed but professional. Cruise altitude changes, direct clearances and handoffs should sound smooth, concise and realistic. No narration or customer-service tone.'}
  };
  const profile=profiles[facility]||profiles.center;

  try{
    const r=await fetch('https://api.openai.com/v1/audio/speech',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body:JSON.stringify({
        model:'gpt-4o-mini-tts',
        voice:profile.voice,
        input:text,
        response_format:'mp3',
        speed:profile.speed,
        instructions:profile.instructions
      })
    });
    if(!r.ok){
      let msg='ATC voice generation failed';
      try{const j=await r.json();msg=j?.error?.message||msg}catch{}
      return res.status(r.status).json({error:msg});
    }
    const buf=Buffer.from(await r.arrayBuffer());
    return res.status(200).json({ok:true,audio:buf.toString('base64'),mime:'audio/mpeg',facility,voice:profile.voice});
  }catch(e){return res.status(500).json({error:e.message||'ATC voice request failed'})}
}
