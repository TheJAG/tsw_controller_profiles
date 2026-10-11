const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class142/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const by=n=>p.controls.find(c=>c.name===n);
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
// reverser: drop the wrapped Off at raw 1
const rv=by('SpeedbrakeLever'); rv.description='Reverser (Off / Reverse / Neutral / Forward)'; rv.assignments[0].input_value.max=0.75; rv.assignments[0].input_value.steps=[0,0.25,0.5,0.75];
by('RightThrottle').description='Throttle (Off / 1 / 2 / 3 / 4 / 5 / 6 / 7)';
by('ParkingBrake').description='Master key on / off';
// AWS reset stays the game key as on the other UK units
by('GearLever').assignment={type:'momentary',threshold:0.9,action_activate:{keys:'Q'}};
// horn: raw 0 = high, raw 1 = low, rest 0.5
by('LeftEngineOn').assignment.action_activate.value=0;
by('RightEngineOn').assignment.action_activate.value=1;
// wipers: Slow 0 / Off 0.5 / Fast 1, both screens
by('RotaryCrank').description='Wipers one notch towards Slow (Fast > Off > Slow)'; by('RotaryCrank').assignments=[rel('Wiper_L',-0.5),rel('Wiper_R',-0.5)]; delete by('RotaryCrank').assignment;
by('RotaryIgnStart').description='Wipers one notch towards Fast (Slow > Off > Fast)'; by('RotaryIgnStart').assignments=[rel('Wiper_L',0.5),rel('Wiper_R',0.5)]; delete by('RotaryIgnStart').assignment;
// lights dial: off / head / marker / tail (no night position on this unit)
const hl=[['Off',0],['Headlight',1],['Marker',0.66],['Tail',0.33]];
p.controls=p.controls.filter(c=>c.name!=='AutoBrake4');
hl.forEach(([n,v],i)=>{const c=by('AutoBrake'+i);c.description='Lights | '+n;c.assignment.action_activate.value=v;});
const ins=(after,item)=>{const i=p.controls.findIndex(c=>c.name===after);p.controls.splice(i+1,0,item);};
ins('GearLever',mom('LeftThrottleButton','Engine stop','EngineStop_Int',1,0));
ins('RoundAuxButton',tog('LeftAuxButton','AWS isolation lever (lit = Isolated / unlit = Normal)','AWS_IsolationLever',0,1));
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.length+' classes');
console.log(p.controls.map(c=>c.name+' :: '+c.description).join('\n'));
