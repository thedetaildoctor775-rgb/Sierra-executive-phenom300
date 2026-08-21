import fs from 'fs';
import path from 'path';

export default function handler(req,res){
  try{
    const file=path.join(process.cwd(),'legacy.html');
    let html=fs.readFileSync(file,'utf8');
    if(!html.includes('market-boost.js')){
      html=html.replace(/<\/body>/i,'<script src="/market-boost.js"></script><script src="/market-cap-fix.js"></script></body>');
    }
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(html);
  }catch(e){
    return res.status(500).send('Career OS unavailable: '+(e.message||'unknown error'));
  }
}
