(()=>{
const STATE_KEY='sierra_phenom300_state';
const HAWKER={tail:'N800SX',type:'Hawker Beechcraft 800XP',model:'H25B',home:'KRNO',location:'KRNO',status:'Available',callsign:'SIERRA EXECUTIVE',flightNumber:'SXR135'};
function load(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return {}}}
function save(s){localStorage.setItem(STATE_KEY,JSON.stringify(s))}
function installHawker(){
  const s=load();
  s.fleet=s.fleet||{};
  if(!s.fleet[HAWKER.tail]) s.fleet[HAWKER.tail]={...HAWKER};
  else s.fleet[HAWKER.tail]={...HAWKER,...s.fleet[HAWKER.tail]};
  save(s);
  window.dispatchEvent(new StorageEvent('storage',{key:STATE_KEY,newValue:JSON.stringify(s)}));
}
installHawker();
setInterval(installHawker,1500);
})();
