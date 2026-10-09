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
module.exports={api,sleep};
