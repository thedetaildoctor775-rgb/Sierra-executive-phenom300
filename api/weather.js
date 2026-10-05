export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=120, stale-while-revalidate=300');
  const raw=String(req.query?.ids||'').toUpperCase();
  const ids=[...new Set(raw.split(',').map(x=>x.trim()).filter(x=>/^[A-Z0-9]{3,4}$/.test(x)))].slice(0,4);
  if(!ids.length)return res.status(400).json({ok:false,error:'No airport IDs provided'});
  const joined=ids.join(',');
  try{
    const [m,t]=await Promise.all([
      fetch('https://aviationweather.gov/api/data/metar?ids='+encodeURIComponent(joined)+'&format=json'),
      fetch('https://aviationweather.gov/api/data/taf?ids='+encodeURIComponent(joined)+'&format=json')
    ]);
    if(!m.ok)throw new Error('METAR request failed '+m.status);
    const metars=await m.json();
    let tafs=[];
    if(t.ok)tafs=await t.json();
    return res.status(200).json({ok:true,ids,metars:Array.isArray(metars)?metars:[],tafs:Array.isArray(tafs)?tafs:[],fetchedAt:new Date().toISOString()});
  }catch(e){
    return res.status(502).json({ok:false,error:e?.message||String(e)});
  }
}