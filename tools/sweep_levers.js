const {api,sleep}=require('./tswapi.js');
const get=async p=>{const g=await api('/get/CurrentDrivableActor'+p);return g&&g.Values?Object.values(g.Values)[0]:null;};
const setv=async(l,v)=>{await api('/set/CurrentDrivableActor/'+l+'.InputValue?Value='+v,'PATCH');};
(async()=>{
  const moving=await get('.Function.IsVehicleMoving'); const rev=await get('/Reverser.Function.GetCurrentOutputValue');
  console.log('moving',moving,'reverser output',rev);
  if(moving){console.log('ABORT moving');return;}
  for(const lever of process.argv.slice(2)){
    if(lever==='CombinedPowerBrakeHandle'&&!(rev===0||rev===2)){console.log('skip throttle: reverser engaged');continue;}
    const orig=await get('/'+lever+'.InputValue'); let last=null; const rows=[];
    for(let i=0;i<=100;i++){const v=i/100; await setv(lever,v); await sleep(60);
      const idx=await get('/'+lever+'.Function.GetCurrentNotchIndex'); const act=await get('/'+lever+'.InputValue'); const out=await get('/'+lever+'.Function.GetCurrentOutputValue');
      if(idx!==last){rows.push(`notch ${idx} from ${v.toFixed(2)} snapped=${Number(act).toFixed(3)} out=${out}`);last=idx;}}
    await setv(lever,orig); await sleep(1200); const back=await get('/'+lever+'.InputValue');
    console.log('=== '+lever+' orig '+orig+' restored '+back+' ==='); rows.forEach(r=>console.log('  '+r));
  }
})();
