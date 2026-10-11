const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class170/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const by=n=>p.controls.find(c=>c.name===n);
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
// combined handle: brake notches 0.1 steps, power notches 0.4 + k*0.6/7 as the game stores them (+0.0002), Emergency left out
const lt=by('LeftThrottle'); const iv=lt.assignments[0].input_value;
iv.min=0.1; iv.max=1; iv.steps=[0.1,0.2,0.3,0.4,0.4859,0.5744,0.6573,0.7431,0.8288,0.9145,1];
const th=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds; if(th&&th.length===iv.steps.length) iv.step_thresholds=JSON.parse(JSON.stringify(th)); else console.log('171 thresholds not reused:',th&&th.length);
lt.description='Power / brake handle (B3 / B2 / B1 / Idle / P1 .. P7; Emergency at 0 is left out on purpose). Brake notches 0.1 apart, power notches 0.6/7 apart from 0.4 as the game stores them; the bands are the Class 171 ones (centred on the TCA detents).';
by('SpeedbrakeLever').description='Reverser (Reverse / Neutral / Forward / Off)';
by('GearLever').assignment={type:'momentary',threshold:0.9,action_activate:{keys:'Q'}};
// horn lever runs -1..1 with rest 0
by('LeftEngineOn').assignment={type:'momentary',threshold:0.9,action_activate:{controls:'IrregularLever_Horn_Normal',value:1,hold:true},action_deactivate:{controls:'IrregularLever_Horn_Normal',value:0,hold:false}};
by('RightEngineOn').assignment={type:'momentary',threshold:0.9,action_activate:{controls:'IrregularLever_Horn_Normal',value:-1,hold:true},action_deactivate:{controls:'IrregularLever_Horn_Normal',value:0,hold:false}};
by('LeftAuxButton').description='AWS isolation (lit = Isolated / unlit = Normal)'; by('LeftAuxButton').assignment.action_activate.value=1; by('LeftAuxButton').assignment.action_deactivate.value=0;
by('RightAuxButton').description='DVD (vigilance) isolation (lit = Isolated / unlit = Normal)'; by('RightAuxButton').assignment.action_activate.value=1; by('RightAuxButton').assignment.action_deactivate.value=0;
// wipers on the lever instead of the game keys: Off 0 / Intermittent 0.22 / Slow 0.5 / Fast 0.72
by('RotaryCrank').description='Wipers one notch slower (Fast > Slow > Intermittent > Off)'; delete by('RotaryCrank').assignment; by('RotaryCrank').assignments=[rel('IrregularLever_WipersSpeed',-0.24)];
by('RotaryIgnStart').description='Wipers one notch faster (Off > Intermittent > Slow > Fast)'; delete by('RotaryIgnStart').assignment; by('RotaryIgnStart').assignments=[rel('IrregularLever_WipersSpeed',0.24)];
const HL='IrregularLever_Headlights',TL='IrregularLever_TailLights';
const dial=[['Off',0,0],['Day running',0.25,0],['Marker lights only',0.5,0],['Night running',0.75,0],['Tail lights only',0,0.25]];
dial.forEach(([n,h,t],i)=>{const c=by('AutoBrake'+i);c.description='Headlights | '+n;c.assignments=[set(HL,h),set(TL,t)];delete c.assignment;});
const ins=(after,item)=>{const i=p.controls.findIndex(c=>c.name===after);p.controls.splice(i+1,0,item);};
ins('LeftThrottle',{name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'PushButton_MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'PushButton_MasterKey',value:0,hold:false,enable_api_fallback:true}}});
ins('LeftThrottleButton',mom('RightThrottleButton','Engine start','PushButton_EngineStart',1,0));
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
console.log(p.controls.map(c=>c.name+' :: '+c.description.slice(0,70)).join('\n'));
