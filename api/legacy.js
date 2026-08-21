import fs from 'fs';
import path from 'path';

export default function handler(req,res){
  try{
    const file=path.join(process.cwd(),'legacy.html');
    let html=fs.readFileSync(file,'utf8');
    const scripts=[];
    if(!html.includes('market-boost.js')) scripts.push('<script src="/market-boost.js"></script><script src="/market-cap-fix.js"></script>');
    if(!html.includes('dispatch-phone.js')) scripts.push('<script src="/dispatch-phone.js"></script>');
    if(!html.includes('dispatch-standby-fix.js')) scripts.push('<script src="/dispatch-standby-fix.js"></script>');

    const detailDoctorTheme=`<style id="detail-doctor-theme">
:root{
  --bg:#0B0B0B!important;
  --panel:#121212!important;
  --panel2:#171717!important;
  --line:#24484c!important;
  --text:#ffffff!important;
  --muted:#9eb2b4!important;
  --green:#1BB6C4!important;
  --amber:#2FE3F2!important;
  --blue:#2FE3F2!important;
  --gold:#2FE3F2!important;
  --gold2:#23656d!important;
}
body{background:#0B0B0B!important;color:#fff!important}
.sidebar{background:#090909!important}
.side-logo,.market-sub,.arrow,.tab.active,.status-pill,.badge,.btn,.type-tag{color:#2FE3F2!important}
.side-logo-sub,.side-main,.topbar h1{color:#ffffff!important}
.tab.active{background:#10191a!important;border-left-color:#2FE3F2!important}
.status-pill,.badge,.btn{border-color:#23656d!important;background:#0d1718!important}
.badge.green,.cloud-dot.ok{color:#2FE3F2!important;border-color:#23656d!important;background:#0d1718!important}
.btn.secondary{background:#111!important;color:#fff!important;border-color:#24484c!important}
.btn.warn{background:#102326!important;color:#bff9ff!important;border-color:#23656d!important}
.card,.modal-card,.auth-card{background:#121212!important}
.stat{background:#171717!important}
input,select,textarea{background:#0d1112!important;color:#fff!important}
.market-table-wrap{background:#0d0d0d!important}
.type-tag,.contract-tag{border-color:#23656d!important;background:#0d1718!important;color:#2FE3F2!important}
.fleet-aircraft.selected{outline-color:#2FE3F2!important}
.green{color:#2FE3F2!important}
</style>`;
    if(!html.includes('detail-doctor-theme')) html=html.replace(/<\/head>/i,detailDoctorTheme+'</head>');
    if(scripts.length) html=html.replace(/<\/body>/i,scripts.join('')+'</body>');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(html);
  }catch(e){
    return res.status(500).send('Career OS unavailable: '+(e.message||'unknown error'));
  }
}
