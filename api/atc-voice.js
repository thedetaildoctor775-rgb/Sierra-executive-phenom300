export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(500).json({error:'OPENAI_API_KEY is not configured'});
  const text=String(req.body?.text||'').trim();
  if(!text) return res.status(400).json({error:'No text'});
  try{
    const r=await fetch('https://api.openai.com/v1/audio/speech',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body:JSON.stringify({
        model:'gpt-4o-mini-tts',
        voice:'cedar',
        input:text,
        response_format:'mp3',
        speed:1.06,
        instructions:'Speak like a real U.S. FAA air traffic controller on VHF radio. Neutral American accent. Mature, calm, confident, concise, clipped cadence, professional and slightly brisk. Read callsigns, runway numbers, headings, altitudes, frequencies and squawk codes clearly. Do not sound like a narrator, announcer, chatbot, customer service agent, or dramatic actor. No exaggerated emotion. Natural controller rhythm with short operational pauses.'
      })
    });
    if(!r.ok){
      let msg='ATC voice generation failed';
      try{const j=await r.json();msg=j?.error?.message||msg}catch{}
      return res.status(r.status).json({error:msg});
    }
    const buf=Buffer.from(await r.arrayBuffer());
    return res.status(200).json({ok:true,audio:buf.toString('base64'),mime:'audio/mpeg'});
  }catch(e){return res.status(500).json({error:e.message||'ATC voice request failed'})}
}
