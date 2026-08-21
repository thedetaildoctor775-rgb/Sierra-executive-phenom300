const DIGIT_WORDS={0:'zero',1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'niner'};
function digits(s){return String(s).split('').map(c=>DIGIT_WORDS[c]||c).join(' ')}
function normalizeAtcText(input){
  let s=String(input||'').replace(/\s+/g,' ').trim();
  // Frequencies: 125.35 -> one two five point three five
  s=s.replace(/\b(1\d{2})\.(\d{1,3})\b/g,(_,a,b)=>`${digits(a)} point ${digits(b)}`);
  // Flight levels: FL450 / flight level 450 -> flight level four five zero
  s=s.replace(/\bFL\s*(\d{2,3})\b/gi,(_,n)=>`flight level ${digits(n)}`);
  s=s.replace(/\bflight level\s+(\d{2,3})\b/gi,(_,n)=>`flight level ${digits(n)}`);
  // Squawks are always individual digits.
  s=s.replace(/\bsquawk\s+(\d{4})\b/gi,(_,n)=>`squawk ${digits(n)}`);
  // Headings are individual digits.
  s=s.replace(/\bheading\s+(\d{2,3})\b/gi,(_,n)=>`heading ${digits(n.padStart(3,'0'))}`);
  // Runway digits are spoken individually; preserve L/R/C as words.
  s=s.replace(/\brunway\s+(\d{1,2})([LRC])?\b/gi,(_,n,sfx)=>`runway ${digits(n.padStart(2,'0'))}${sfx?` ${({L:'left',R:'right',C:'center'})[sfx.toUpperCase()]}`:''}`);
  // Common altitude formatting: 5000 -> five thousand, 15000 -> one five thousand.
  s=s.replace(/\bmaintain\s+(\d{4,5})\b/gi,(_,n)=>{
    const v=Number(n); if(v%1000===0){const k=String(v/1000);return `maintain ${k.length===1?DIGIT_WORDS[k]:digits(k)} thousand`;} return `maintain ${digits(n)}`;
  });
  s=s.replace(/\bclimb and maintain\s+(\d{4,5})\b/gi,(_,n)=>{
    const v=Number(n); if(v%1000===0){const k=String(v/1000);return `climb and maintain ${k.length===1?DIGIT_WORDS[k]:digits(k)} thousand`;} return `climb and maintain ${digits(n)}`;
  });
  s=s.replace(/\bdescend and maintain\s+(\d{4,5})\b/gi,(_,n)=>{
    const v=Number(n); if(v%1000===0){const k=String(v/1000);return `descend and maintain ${k.length===1?DIGIT_WORDS[k]:digits(k)} thousand`;} return `descend and maintain ${digits(n)}`;
  });
  return s;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(500).json({error:'OPENAI_API_KEY is not configured'});
  const raw=String(req.body?.text||'').trim();
  if(!raw) return res.status(400).json({error:'No text'});

  const requested=String(req.body?.controller||'').toLowerCase();
  const t=raw.toLowerCase();
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

  const common='Sound like an actual U.S. air traffic controller heard over a VHF aviation radio, not a studio voice. Neutral American accent. Use natural controller rhythm: compact phrasing, slightly uneven human pacing, light breath between clauses, and no dramatic emphasis. Do not sound like an announcer, narrator, chatbot, virtual assistant, or customer-service agent. Never over-enunciate. Aviation numbers must sound like real ATC: niner for 9, individual digits for headings, squawks and frequencies, normal FAA-style altitude phrasing. Pronounce five-letter fixes naturally as waypoint names unless the text clearly spells them out.';
  const profiles={
    clearance:{voice:'cedar',speed:0.99,instructions:`${common} Clearance Delivery specifically: calm, lower-energy, methodical, dry, experienced. Read long IFR clearances smoothly without sounding rehearsed. Keep route strings flowing and avoid exaggerated pauses.`},
    ground:{voice:'onyx',speed:1.00,instructions:`${common} Ground specifically: mature, slightly deeper and rougher, busy but unhurried. Taxi clearances should be clipped and practical, with crisp hold-short wording. Slightly less polished than a studio recording.`},
    tower:{voice:'marin',speed:1.02,instructions:`${common} Tower specifically: alert and confident, concise, authoritative without sounding dramatic. Takeoff and landing clearances should be decisive, quick, and operational.`},
    departure:{voice:'ash',speed:1.03,instructions:`${common} Departure specifically: faster radar-controller cadence, energetic but controlled. Headings and climb instructions should come quickly with minimal dead air.`},
    approach:{voice:'coral',speed:1.01,instructions:`${common} Approach specifically: focused TRACON cadence, efficient and slightly brisk. Vectors, speeds and approach clearances should sound routine and practiced, not theatrical.`},
    center:{voice:'sage',speed:0.99,instructions:`${common} Center specifically: composed, mature, relaxed professional cadence. Cruise instructions and handoffs should sound effortless and matter-of-fact.`}
  };
  const profile=profiles[facility]||profiles.center;
  const text=normalizeAtcText(raw);

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
