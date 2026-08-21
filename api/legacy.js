import fs from 'fs';
import path from 'path';

export default function handler(req,res){
  try{
    const file=path.join(process.cwd(),'legacy.html');
    let html=fs.readFileSync(file,'utf8');
    const scripts=[];
    if(!html.includes('market-boost.js')) scripts.push('<script src="/market-boost.js"></script><script src="/market-cap-fix.js"></script>');
    if(!html.includes('dispatch-phone.js')) scripts.push('<script src="/dispatch-phone.js"></script>');
    if(scripts.length) html=html.replace(/<\/body>/i,scripts.join('')+'</body>');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(html);
  }catch(e){
    return res.status(500).send('Career OS unavailable: '+(e.message||'unknown error'));
  }
}
