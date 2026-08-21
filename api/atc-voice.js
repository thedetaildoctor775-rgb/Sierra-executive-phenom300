const DIGIT_WORDS={0:'zero',1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'niner'};
function digits(s){return String(s).split('').map(c=>DIGIT_WORDS[c]||c).join(' ')}
function normalizeAtcText(input){
  let s=String(input||'').replace(/\s+/g,' ').trim();
  s=s.replace(/\b(1\d{2})\.(\d{1,3})\b/g,(_,a,b)=>`${digits(a)} point ${digits(b)}`);
  s=s.replace(/\bFL\s*(\d{2,3})\b/gi,(_,n)=>`flight level ${digits(n)}`);
  s=s.replace(/\bflight level\s+(\d{2,3})\b/gi,(_,n)=>`flight level ${digits(n)}`);
  s=s.replace(/\bsquawk\s+(\d{4})\b/gi,(_,n)=>`squawk ${digits(n)}`);
  s=s.replace(/\bheading\s+(\d{2,3})\b/gi,(_,n)=>`heading ${digits(n.padStart(3,'0'))}`);
  s=s.replace(/\brunway\s+(\d{1,2})([LRC])?\b/gi,(_,n,sfx)=>`runway ${digits(n.padStart(2,'0'))}${sfx?` ${({L:'left',R:'right',C:'center'})[sfx.toUpperCase()]}`:''}`);
  s=s.replace(/\bmaintain\s+(\d{4,5})\b/gi,(_,n)=>{const v=Number(n);if(v%1000===0){const k=String(v/1000);return `maintain ${k.length===1?DIGIT_WORDS[k]:digits(k)} thousand`;}return `maintain ${digits(n)}`;});
  s=s.replace(/\bclimb and maintain\s+(\d{4,5})\b/gi,(_,n)=>{const v=Number(n);if(v%1000===0){const k=String(v/1000);return `climb and maintain ${k.length===1?DIGIT_WORDS[k]:digits(k)} thousand`;}return `climb and maintain ${digits(n)}`;});
  s=s.replace(/\bdescend and maintain\s+(\d{4,5})\b/gi,(_,n)=>{const v=Number(n);if(v%1000===0){const k=String(v/1000);return `descend and maintain ${k.length===1?DIGIT_WORDS[k]:digits(k)} thousand`;}return `descend and maintain ${digits(n)}`;});
  return s;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(500).json({error:'OPENAI_API_KEY is not configured'});
  const raw=String(req.body?.text||'').trim();
  if(!raw) return res.status(400).json({error:'No text'});

  const requested=String(req.body?.controller||'').toLowerCase().trim();
  const t=raw.toLowerCase();
  let facility='';
  if(requested.includes('clearance')) facility='clearance';
  else if(requested.includes('ground')) facility='ground';
  else if(requested.includes('tower')) facility='tower';
  else if(requested.includes('departure')) facility='departure';
  else if(requested.includes('approach')) facility='approach';
  else if(requested.includes('center')) facility='center';
  else if(/cleared .* via|ifr clearance|clearance delivery|squawk/.test(t)&&!/taxi|takeoff|airborne|climb|descent|approach/.test(t)) facility='clearance';
  else if(/pushback|taxi|ground|ramp|hold short/.test(t)&&!/cleared for takeoff/.test(t)) facility='ground';
  else if(/tower|cleared for takeoff|cleared to land|line up|runway/.test(t)) facility='tower';
  else if(/departure|climb and maintain|radar contact/.test(t)) facility='departure';
  else if(/approach|descend and maintain|established|localizer|glideslope/.test(t)) facility='approach';
  else facility='center';

  const identity='IMPORTANT: keep the exact same speaker identity for every transmission from this facility. Do not change apparent age, gender, accent, vocal weight, pitch range, timbre, or personality because the sentence content changes. Treat this as one human controller staying at the same position for the entire session. Only cadence may vary slightly with workload.';
  const common=`Sound like an actual U.S. air traffic controller heard over a VHF aviation radio, not a studio voice. Neutral American accent. Use natural controller rhythm: compact phrasing, slightly uneven human pacing, light breath between clauses, and no dramatic emphasis. Do not sound like an announcer, narrator, chatbot, virtual assistant, or customer-service agent. Never over-enunciate. Aviation numbers must sound like real ATC: niner for 9, individual digits for headings, squawks and frequencies, normal FAA-style altitude phrasing. Pronounce five-letter fixes naturally as waypoint names unless the text clearly spells them out. ${identity}`;
  const profiles={
    clearance:{voice:'cedar',speed:0.99,instructions:`${common} Clearance Delivery: calm, lower-energy, methodical, dry, experienced. Read long IFR clearances smoothly without sounding rehearsed.`},
    ground:{voice:'onyx',speed:1.00,instructions:`${common} Ground: mature, slightly deeper and rougher, busy but unhurried. Pushback, start, taxi, ramp, hold-short and runway-crossing instructions must all remain the SAME Ground controller voice.`},
    tower:{voice:'marin',speed:1.02,instructions:`${common} Tower: alert and confident, concise, authoritative without sounding dramatic. Line-up, takeoff, traffic and landing transmissions must all remain the SAME Tower controller voice.`},
    departure:{voice:'ash',speed:1.03,instructions:`${common} Departure: faster radar-controller cadence, energetic but controlled. Headings, climbs and handoffs must all remain the SAME Departure controller voice.`},
    approach:{voice:'coral',speed:1.01,instructions:`${common} Approach: focused TRACON cadence, efficient and slightly brisk. Vectors, speeds, descents and approach clearances must all remain the SAME Approach controller voice.`},
    center:{voice:'sage',speed:0.99,instructions:`${common} Center: composed, mature, relaxed professional cadence. Cruise instructions and handoffs must all remain the SAME Center controller voice.`}
  };
  const profile=profiles[facility];
  const text=normalizeAtcText(raw);

  try{
    const r=await fetch('https://api.openai.com/v1/audio/speech',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body:JSON.stringify({model:'gpt-4o-mini-tts',voice:profile.voice,input:text,response_format:'mp3',speed:profile.speed,instructions:profile.instructions})
    });
    if(!r.ok){let msg='ATC voice generation failed';try{const j=await r.json();msg=j?.error?.message||msg}catch{}return res.status(r.status).json({error:msg});}
    const buf=Buffer.from(await r.arrayBuffer());
    return res.status(200).json({ok:true,audio:buf.toString('base64'),mime:'audio/mpeg',facility,voice:profile.voice});
  }catch(e){return res.status(500).json({error:e.message||'ATC voice request failed'})}
}
