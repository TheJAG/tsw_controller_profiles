const fs=require('fs');
// TSW HTTP API client. Needs the game started with the -HTTPAPI launch option; the key file is written by the game.
const keyPath=process.env.TSW_COMMAPIKEY||"C:/Users/m_jag/OneDrive/Documenten/My Games/TrainSimWorld7/Saved/Config/CommAPIKey.txt";
const key=fs.readFileSync(keyPath,'utf8').trim();
const base=process.env.TSW_API_BASE||'http://127.0.0.1:31270';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function api(path,method='GET'){
  for(let i=0;i<5;i++){
    try{const r=await fetch(base+path,{method,headers:{DTGCommKey:key,Connection:'close'}});const t=await r.text();try{return JSON.parse(t);}catch{return {raw:t,status:r.status};}}
    catch(e){await sleep(200*(i+1));}
  }
  return {Result:'Error',Message:'network'};
}
// First value of a /get on the current drivable actor, e.g. get('/Reverser.InputValue') or get('.Function.IsVehicleMoving'); null when missing.
const get=async p=>{const g=await api('/get/CurrentDrivableActor'+p);return g&&g.Values?Object.values(g.Values)[0]:null;};
// Set a control's InputValue (what the app's direct_control does).
const setv=async(node,v)=>api('/set/CurrentDrivableActor/'+encodeURIComponent(node)+'.InputValue?Value='+v,'PATCH');
// Every node of the vehicle you sit in with class, identifier, current value and the DisplayInfo notch names.
async function dumpControls(){
  const cls=await api('/get/CurrentDrivableActor.ObjectClass');
  if(!cls||!cls.Values) return null;
  const list=await api('/list/CurrentDrivableActor');
  const out={objectClass:cls.Values.ObjectClass,controls:[]};
  for(const n of list.Nodes){
    const name=n.Name, enc=encodeURIComponent(name);
    const oc=await api('/get/CurrentDrivableActor/'+enc+'.ObjectClass');
    const iv=await api('/get/CurrentDrivableActor/'+enc+'.InputValue');
    const rec={name,objectClass:oc&&oc.Values?oc.Values.ObjectClass:null};
    if(iv&&iv.Result==='Success'&&iv.Values&&iv.Values.InputValue!==undefined){
      rec.inputValue=iv.Values.InputValue;
      const id=await api('/get/CurrentDrivableActor/'+enc+'.Property.InputIdentifier');
      rec.identifier=id&&id.Values?id.Values.identifier:null;
      const di=await api('/get/CurrentDrivableActor/'+enc+'.Property.DisplayInfo');
      rec.namedValues=di&&di.Values&&di.Values.namedValues?di.Values.namedValues.map(v=>({name:v.displayName,source:v.valueSource,min:v.valueRange.min,max:v.valueRange.max})):[];
    }
    out.controls.push(rec);
  }
  return out;
}
module.exports={api,sleep,get,setv,dumpControls};
