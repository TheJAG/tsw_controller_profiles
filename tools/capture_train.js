// Capture the train you are sitting in: control dump, active cab, cab-prefix pairs and a notch sweep of every lever.
// Usage (from repo root, train stationary, master key/switch of your cab ON):
//   node tools/capture_train.js [out.json] [--no-sweep] [--levers Name,Name] [--cab L] [--step 0.01] [--range lo,hi]
// Default output: tools/captures/<ObjectClass>.json. A sweep sets the lever from its minimum to its maximum input (a
// combined power/brake handle runs -1..1; --range lo,hi clips that, e.g. -1,0.12 to keep a combined handle out of full
// power) in steps, reads the notch index and
// restores the lever. Per cab the master switch is turned on and the reverser put in Neutral while the throttle is
// swept, then both are restored. The brake lever is released for a few seconds during its sweep: stay on level track.
const {api,sleep,get,setv,dumpControls}=require('./tswapi.js');
const fs=require('fs'),path=require('path');
const argv=process.argv.slice(2), opt={sweep:true,levers:null,cab:null,step:0.01,out:null,range:null};
for(let i=0;i<argv.length;i++){const a=argv[i];
  if(a==='--no-sweep')opt.sweep=false; else if(a==='--levers')opt.levers=argv[++i].split(',');
  else if(a==='--cab')opt.cab=argv[++i]; else if(a==='--step')opt.step=Number(argv[++i]); else if(a==='--range')opt.range=argv[++i].split(',').map(Number); else opt.out=a;}
const LEVER_RE=/Lever|DimmerSwitch|ReversiblePushButton|RotarySwitch/;
const r4=v=>Math.round(v*1e4)/1e4;

// Cab prefix pairs: names like L_Reverser / S_Reverser or F_x / B_x. Returns {style:'prefix', pair:[a,b], shared:n} or null.
function detectCabs(controls){
  const names=controls.filter(c=>c.inputValue!==undefined).map(c=>c.name);
  const bySuffix={};
  for(const n of names){const m=/^([A-Z][A-Za-z]?)_(.+)$/.exec(n); if(m){(bySuffix[m[2]]=bySuffix[m[2]]||[]).push(m[1]);}}
  const pairs={}, order=[];
  for(const ps of Object.values(bySuffix)){const u=[...new Set(ps)]; if(u.length<2) continue;
    for(let i=0;i<u.length;i++)for(let j=i+1;j<u.length;j++){const k=u[i]+'|'+u[j]; if(!pairs[k]){pairs[k]=0;order.push(k);} pairs[k]++;}}
  const best=order.sort((a,b)=>pairs[b]-pairs[a])[0];
  if(!best||pairs[best]<3) return null;
  const [a,b]=best.split('|');
  const ia=names.findIndex(n=>n.startsWith(a+'_')), ib=names.findIndex(n=>n.startsWith(b+'_'));
  return {style:'prefix',pair:ia<=ib?[a,b]:[b,a],shared:pairs[best]};
}
const cabOf=(name,cab)=>{if(!cab)return null;const m=/^([A-Z][A-Za-z]?)_/.exec(name);return m&&cab.pair.includes(m[1])?m[1]:null;};
const bareName=name=>name.replace(/^[A-Z][A-Za-z]?_(?=[A-Z])/,'');
// notch display name from the DisplayInfo ranges (Output ranges are matched on the output value, Input ranges on the snapped input)
const np=n=>'/'+encodeURIComponent(n);
const nameOf=(lever,input,output)=>{
  for(const v of lever.namedValues||[]){const x=v.source==='Input'?input:output; if(x!==null&&x>=v.min-1e-6&&x<=v.max+1e-6) return v.name;}
  return null;};

async function leverInfo(c){
  const f=async n=>{const g=await api('/get/CurrentDrivableActor/'+encodeURIComponent(c.name)+'.Function.'+n);return g&&g.Values?g.Values.ReturnValue:null;};
  const rot=await api('/get/CurrentDrivableActor/'+encodeURIComponent(c.name)+'.Property.bIsRotationalLever');
  return {identifier:c.identifier,objectClass:c.objectClass,notchCount:await f('GetNotchCount'),minInput:await f('GetMinimumInputValue'),maxInput:await f('GetMaximumInputValue'),
    defaultInput:await f('GetDefaultInputValue'),inputRange:await f('GetInputRange'),outputRange:await f('GetOutputRange'),
    rotational:rot&&rot.Values?Object.values(rot.Values)[0]:null,inputValue:c.inputValue,namedValues:c.namedValues,swept:false,notches:[]};
}
async function sweep(c,info){
  const orig=await get(np(c.name)+'.InputValue'); let last=null; const rows=[];
  // sweep over the lever's own input range (a combined handle runs -1..1; Deadman-style levers report min 1 / max 0)
  const mi=info&&info.minInput!=null?Number(info.minInput):0, ma=info&&info.maxInput!=null?Number(info.maxInput):1;
  let lo=Math.min(mi,ma), hi=Math.max(mi,ma); if(opt.range){lo=Math.max(lo,opt.range[0]);hi=Math.min(hi,opt.range[1]);}
  let n=0, aborted=false;
  for(let v=lo;v<=hi+0.00001;v=r4(v+opt.step)){ await setv(c.name,v); await sleep(50);
    if(++n%5===0&&await get('.Function.IsVehicleMoving')){console.log('  '+c.name+': vehicle started moving at '+v+', sweep stopped');aborted=true;break;}
    const idx=await get(np(c.name)+'.Function.GetCurrentNotchIndex');
    if(idx!==last){const snapped=await get(np(c.name)+'.InputValue'); const out=await get(np(c.name)+'.Function.GetCurrentOutputValue');
      if(rows.length) rows[rows.length-1].to=r4(v-opt.step);
      rows.push({index:idx,from:v,to:hi,snapped:r4(snapped),output:out,name:nameOf(c,snapped,out)}); last=idx;}}
  await setv(c.name,orig); await sleep(800); let back=await get(np(c.name)+'.InputValue');
  if(Number(back)!==Number(orig)){ await setv(c.name,orig); await sleep(800); back=await get(np(c.name)+'.InputValue'); }
  if(Number(back)!==Number(orig)){ // a combined handle can refuse a jump across its zero zone: ramp towards the original value
    const dir=Number(orig)>Number(back)?1:-1; for(let v=Number(back);dir*(Number(orig)-v)>0;v=r4(v+dir*0.02)){await setv(c.name,v);await sleep(60);} await setv(c.name,orig); await sleep(800); back=await get(np(c.name)+'.InputValue'); }
  if(aborted) info.aborted=true; info.sweptRange=[lo,hi]; delete info.fromPrevious;
  info.swept=true; info.notches=rows; info.restored=back; info.inputValue=orig;
  const bad=Number(back)!==Number(orig)?'  <-- NOT RESTORED':'';
  console.log('  '+c.name+' ('+c.identifier+') '+rows.length+' notches, orig '+orig+' restored '+back+bad);
  for(const r of rows) console.log('     #'+r.index+' '+String(r.name||'?').padEnd(16)+' raw '+r.from.toFixed(2)+'..'+r.to.toFixed(2)+' snapped '+r.snapped+' out '+r.output);
  return rows;
}
(async()=>{
  const dump=await dumpControls();
  if(!dump){console.log('No drivable actor: sit in the cab first (API answered but CurrentDrivableActor is missing).');process.exit(1);}
  console.log('class',dump.objectClass,'nodes',dump.controls.length);
  const acRaw=await api('/get/CurrentDrivableActor.Function.IS_GetActiveCab');
  const cab=detectCabs(dump.controls);
  console.log('IS_GetActiveCab',JSON.stringify(acRaw&&acRaw.Values||acRaw),'cab pair',JSON.stringify(cab));
  const out={objectClass:dump.objectClass,capturedAt:new Date().toISOString(),activeCab:acRaw&&acRaw.Values||null,cab,controls:dump.controls,levers:{}};
  const file=opt.out||path.join(__dirname,'captures',dump.objectClass+'.json');
  const prev=opt.levers&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
  const leverCtrls=dump.controls.filter(c=>c.inputValue!==undefined&&LEVER_RE.test(c.objectClass||''));
  for(const c of leverCtrls){ out.levers[c.name]=await leverInfo(c); const p=prev&&prev.levers&&prev.levers[c.name]; if(p&&p.swept){ out.levers[c.name].notches=p.notches; out.levers[c.name].swept=true; out.levers[c.name].fromPrevious=true; } }
  const moving=await get('.Function.IsVehicleMoving');
  if(opt.sweep&&moving){console.log('ABORT sweep: vehicle is moving. Dump written without sweeps.');opt.sweep=false;}
  if(opt.sweep){
    const groups={}; for(const c of leverCtrls){const g=cabOf(c.name,cab)||'';(groups[g]=groups[g]||[]).push(c);}
    for(const [g,ctrls] of Object.entries(groups)){
      if(opt.cab&&g&&g!==opt.cab) continue;
      console.log("--- sweeping cab group '"+(g||'(common)')+"' ---");
      const want=c=>{const i=out.levers[c.name]; return opt.levers?opt.levers.includes(c.name):(i.notchCount>1);};
      // the master key/switch can be a lever or a push button; look through every input control of this cab group
      const inGroup=c=>c.inputValue!==undefined&&(cabOf(c.name,cab)||'')===g;
      // enablers: master key/switch and brake key (ICMm) must be on before the levers accept input
      const DRIVING_RE=/^(Reverser|Throttle|CombinedThrottleBrake|AutomaticBrake|TrainBrake|IndependentBrake|DynamicBrake)$/;
      // a driving lever never counts as a key, whatever its node name (the Just Trains 86/87 call the reverser MasterSwitch_F)
      const enablers=dump.controls.filter(c=>inGroup(c)&&!DRIVING_RE.test(c.identifier||'')&&(/^(MasterSwitch|MasterKey|BrakeKey)$/.test(c.identifier||'')||/^(Master(Key|Switch)|BrakeKey)/.test(bareName(c.name))));
      const master=enablers[0];
      const reverser=ctrls.find(c=>c.identifier==='Reverser');
      const isThrottle=c=>/^(Throttle|CombinedThrottleBrake|AutomaticBrake|TrainBrake|DynamicBrake|IndependentBrake)$/.test(c.identifier||'')||/MasterController|CombinedPowerBrake/.test(c.name);
      // push-button keys toggle on every value change: read the output (0 = removed, 1 = inserted) and flip the input only when needed
      const enState=async e=>{const o=await get(np(e.name)+".Function.GetCurrentOutputValue"); const v=await get(np(e.name)+".InputValue"); return {on:Number(o)>=0.5,v:Number(v)};};
      const toggled=[]; for(const e of enablers){ const st=await enState(e); if(!st.on){console.log("  "+e.name+" on for the sweep (output "+(st.on?1:0)+", input "+st.v+")"); await setv(e.name,st.v>=0.5?0:1); await sleep(500); toggled.push(e); const chk=await enState(e); if(!chk.on) console.log("  warning: "+e.name+" still off after toggling"); } else console.log("  "+e.name+" already on"); }
      // order: everything else first (so a mode selector gets swept), then mode selector to Driving, reverser, throttle
      const isRev=c=>c===reverser, isMode=c=>/ModeSelector|MainSwitch|Hoofdschakelaar|DriveMode|OperatingMode/i.test(c.name);
      const modeSel=ctrls.find(isMode);
      const others=ctrls.filter(c=>!isRev(c)&&!isThrottle(c)&&!enablers.includes(c));
      const moving=async()=>{ if(await get(".Function.IsVehicleMoving")){console.log("  vehicle moving, sweep stopped");return true;} return false; };
      for(const c of others){ if(!want(c)) continue; if(await moving()) break; await sweep(c,out.levers[c.name]); }
      let modeOrig=null, drive=null;
      if(modeSel){ modeOrig=await get(np(modeSel.name)+".InputValue"); const l=out.levers[modeSel.name];
        drive=(l.notches||[]).find(n=>/driv|rijden|run|^on$|normal/i.test(n.name||""))||null;
        if(drive){console.log("  "+modeSel.name+" to "+drive.name+" ("+drive.snapped+") for the reverser/throttle sweep");await setv(modeSel.name,drive.snapped);await sleep(500);} }
      let revOrig=null, neutral=null;
      if(reverser){revOrig=await get(np(reverser.name)+".InputValue"); if(want(reverser)) await sweep(reverser,out.levers[reverser.name]);
        neutral=(out.levers[reverser.name].notches||[]).find(n=>/neutral|^0$|^N$/i.test(n.name||""));
        if(neutral){console.log("  "+reverser.name+" to Neutral ("+neutral.snapped+") for the throttle sweep");await setv(reverser.name,neutral.snapped);await sleep(500);}}
      for(const c of ctrls.filter(c=>isThrottle(c)&&!isRev(c)&&!enablers.includes(c))){ if(!want(c)) continue; if(await moving()) break;
        if(reverser&&!neutral) console.log("  warning: no Neutral notch found on "+reverser.name+"; "+c.name+" may not accept input");
        const rows=await sweep(c,out.levers[c.name]);
        // a combined handle locked in Neutral shows its whole power side as one wide top notch (170: Idle 0.36..1): retry in Forward then too
        const top=rows[rows.length-1], wide=!!top&&rows.length>1&&(top.to-top.from)>0.3*(top.to-rows[0].from);
        if((rows.length<=1||wide)&&reverser&&c.identifier==="Throttle"){ const fwd=(out.levers[reverser.name].notches||[]).find(n=>/forward|^F$|vooruit/i.test(n.name||""));
          if(fwd){ console.log("  "+c.name+" locked in Neutral; retrying with "+reverser.name+" in "+fwd.name+" (brakes stay applied)"); await setv(reverser.name,fwd.snapped); await sleep(500); await sweep(c,out.levers[c.name]); await setv(reverser.name,neutral?neutral.snapped:revOrig); await sleep(400); } } }
      if(reverser&&neutral){await setv(reverser.name,revOrig);await sleep(500);}
      if(modeSel&&drive){await setv(modeSel.name,modeOrig);await sleep(300);}
      for(const e of toggled.slice().reverse()){ const st=await enState(e); await setv(e.name,st.v>=0.5?0:1); await sleep(300); }
      for(const e of enablers) if(out.levers[e.name]&&want(e)) await sweep(e,out.levers[e.name]);
    }
  }
  fs.mkdirSync(path.dirname(file),{recursive:true});
  if(prev){ let kept=0; for(const [n,l] of Object.entries(prev.levers||{})) if(l.swept&&out.levers[n]&&out.levers[n].fromPrevious){out.levers[n]=l;kept++;} console.log('merged '+kept+' previously swept levers from '+path.basename(file)); }
  fs.writeFileSync(file,JSON.stringify(out,null,2));
  console.log('wrote',file);
  console.log('levers:',Object.entries(out.levers).map(([n,l])=>n+'['+l.identifier+':'+l.notchCount+(l.swept?'*':'')+']').join(' '));
})();
