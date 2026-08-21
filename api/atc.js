export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(500).json({error:'OPENAI_API_KEY is not configured'});
  const b=req.body||{};
  const state=b.state||{};
  const pilot=String(b.transmission||'').trim();
  if(!pilot) return res.status(400).json({error:'No transmission'});
  const system=`You are SIERRA ATC, a realistic U.S. FAA-style air traffic controller for a FLIGHT SIMULATOR ONLY. Never sound like a chatbot or customer-service assistant. Use concise, natural radio phraseology, clipped cadence, and realistic controller behavior. Do not say phrases such as "how can I help", "let me know", "understood", or explain what you are doing. Address the aircraft by the loaded callsign when known. Preserve and update prior clearances. Issue only one realistic controller transmission at a time. Use plausible runway/taxi/altitude/heading/speed/frequency/squawk assignments based on the supplied simulated flight context. If an exact real-world frequency/runway cannot be known from context, choose a plausible simulated value rather than claiming it is live data. When a pilot readback is correct, acknowledge briefly. If materially wrong, correct only the incorrect item. Output strict JSON with keys: reply, controller, frequency, runway, squawk, heading, altitude, speed, clearance, phase. Values may be empty strings. This is simulation, not real-world ATC.`;
  const context={
    flight:state.flight||'',callsign:state.callsign||'',tail:state.tail||'',aircraft:state.aircraft||'',
    origin:state.origin||'',destination:state.destination||'',alternate:state.alternate||'',route:state.route||'',cruise:state.cruise||'',
    phase:state.phase||'',controller:state.controller||'',frequency:state.frequency||'',runway:state.runway||'',squawk:state.squawk||'',
    heading:state.heading||'',altitude:state.altitude||'',speed:state.speed||'',clearance:state.clearance||''
  };
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body:JSON.stringify({model:'gpt-5.6-luna',input:[{role:'system',content:[{type:'input_text',text:system}]},{role:'user',content:[{type:'input_text',text:`SIM STATE:\n${JSON.stringify(context)}\n\nPILOT TRANSMISSION:\n${pilot}`}]}],text:{format:{type:'json_object'}}})
    });
    const j=await r.json();
    if(!r.ok) return res.status(r.status).json({error:j?.error?.message||'ATC model error'});
    let text=j.output_text||'';
    if(!text && Array.isArray(j.output)){
      for(const item of j.output||[]) for(const c of item.content||[]) if(c.type==='output_text') text+=c.text||'';
    }
    let out;
    try{out=JSON.parse(text)}catch{out={reply:text}};
    return res.status(200).json({ok:true,...out});
  }catch(e){return res.status(500).json({error:e.message||'ATC request failed'})}
}
