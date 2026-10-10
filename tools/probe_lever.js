// Probe how the game treats input values on one lever: set each value through the API, read back InputValue, the output
// value and the notch index, then restore the lever by ramping. Use it before tuning a profile's steps (CLAUDE.md gotcha
// "notch beeps"): the step values must sit on (or 0.0002 above) the positions the game stores, and the output zones tell
// where the notch boundaries are. Sit in the cab, train stationary, reverser where the lever is free to move.
// Usage: node tools/probe_lever.js IrregularLever_ThrottleBrake [--from 0.46 --to 1 --step 0.01] [--values 0.5,0.5714,0.7857]
const {get,setv,sleep}=require('./tswapi.js');
const argv=process.argv.slice(2); const name=argv.find(a=>!a.startsWith('--')); const opt={from:0,to:1,step:0.02,values:null};
for(let i=0;i<argv.length;i++){const a=argv[i]; if(a==='--from')opt.from=Number(argv[++i]); else if(a==='--to')opt.to=Number(argv[++i]); else if(a==='--step')opt.step=Number(argv[++i]); else if(a==='--values')opt.values=argv[++i].split(',').map(Number);}
if(!name){console.error('usage: node tools/probe_lever.js <LeverName> [--from a --to b --step s] [--values v1,v2,...]');process.exit(1);}
const r4=v=>Math.round(v*1e4)/1e4;
(async()=>{
  const orig=Number(await get('/'+name+'.InputValue')); console.log('current InputValue', orig, '(what the game stores after the last set, e.g. by the TCA through the mod)');
  const values=opt.values||Array.from({length:Math.floor((opt.to-opt.from)/opt.step+1e-6)+1},(_,i)=>r4(opt.from+i*opt.step));
  let last=null;
  for(const v of values){ await setv(name,v); await sleep(200);
    const back=Number(await get('/'+name+'.InputValue')), out=await get('/'+name+'.Function.GetCurrentOutputValue'), idx=await get('/'+name+'.Function.GetCurrentNotchIndex');
    const key=out+'|'+idx; if(opt.values||key!==last) console.log('set',v.toFixed(4),'-> stored',back.toFixed(6),'output',out,'notch',idx, Math.abs(back-v)>1e-5?'  <-- game changed the value':''); last=key; }
  const dir=orig<Number(values[values.length-1])?-1:1; for(let v=Number(values[values.length-1]); dir*(orig-v)>0; v=r4(v+dir*0.02)){ await setv(name,v); await sleep(60); }
  await setv(name,orig); await sleep(400); console.log('restored', await get('/'+name+'.InputValue'));
})().catch(e=>{console.error(e);process.exit(1);});
