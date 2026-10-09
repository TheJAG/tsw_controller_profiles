const {api}=require('./tswapi.js');
const fs=require('fs');
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const levers=data.controls.filter(c=>/Lever/.test(c.objectClass||'')||/ReversiblePushButton|DimmerSwitch/.test(c.objectClass||''));
const fns=['GetNotchCount','GetCurrentNotchIndex','GetMinimumInputValue','GetMaximumInputValue','GetDefaultInputValue','GetInputRange','GetOutputRange','GetCurrentOutputValue'];
(async()=>{
  console.log(['name','class','identifier','value','notches','notchIdx','minIn','maxIn','defIn','inRange','outRange','outVal','rotational'].join('\t'));
  for(const c of levers){
    const r={};
    for(const f of fns){const g=await api('/get/CurrentDrivableActor/'+c.name+'.Function.'+f);r[f]=g&&g.Values?JSON.stringify(g.Values).replace(/"ReturnValue":/,'').replace(/[{}]/g,''):'-';}
    const rot=await api('/get/CurrentDrivableActor/'+c.name+'.Property.bIsRotationalLever');
    console.log([c.name,c.objectClass,c.identifier,c.inputValue,r.GetNotchCount,r.GetCurrentNotchIndex,r.GetMinimumInputValue,r.GetMaximumInputValue,r.GetDefaultInputValue,r.GetInputRange,r.GetOutputRange,r.GetCurrentOutputValue,rot&&rot.Values?JSON.stringify(rot.Values):'-'].join('\t'));
  }
  console.log('--- CalcTargetInputValue param probes on MasterController ---');
  for(const q of ['','?Notch=1','?NotchIndex=1','?Index=1','?Value=1','?InValue=1']){const g=await api('/get/CurrentDrivableActor/MasterController.Function.CalcTargetInputValue'+q);console.log(q||'(none)',JSON.stringify(g).slice(0,200));}
})();
