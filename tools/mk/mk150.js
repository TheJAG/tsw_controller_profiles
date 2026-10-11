const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class150/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const by=n=>p.controls.find(c=>c.name===n);
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const rv=by('SpeedbrakeLever'); rv.description='Reverser (Off / Reverse / Neutral / Forward)'; rv.assignments[0].input_value.max=0.75; rv.assignments[0].input_value.steps=[0,0.25,0.5,0.75];
by('LeftThrottle').description='Train brake (Release / 1 / 2 / Full service / Emergency)';
by('RightThrottle').description='Throttle (Off / 1 / 2 / 3 / 4 / 5 / 6 / 7)';
by('ParkingBrake').description='Master key on / off';
by('GearLever').assignment={type:'momentary',threshold:0.9,action_activate:{keys:'Q'}};
// wipers: Fast 0 / Off 0.336 / Slow 0.837 on both levers
by('RotaryCrank').description='Wipers one notch towards Slow (Fast > Off > Slow)'; delete by('RotaryCrank').assignment; by('RotaryCrank').assignments=[rel('Wipers_IrregularLever',0.5),rel('Wipers_Second_IrregularLever',0.5)];
by('RotaryIgnStart').description='Wipers one notch towards Fast (Slow > Off > Fast)'; delete by('RotaryIgnStart').assignment; by('RotaryIgnStart').assignments=[rel('Wipers_IrregularLever',-0.5),rel('Wipers_Second_IrregularLever',-0.5)];
// lights dial values on the 9-position rotary
const hl=[['Off',0],['Day headlight',0.125],['Marker only',0.625],['Night headlight',0.875],['Tail only',0.375]];
hl.forEach(([n,v],i)=>{const c=by('AutoBrake'+i);c.description='Headlights | '+n;c.assignment.action_activate.value=v;});
const ins=(after,item)=>{const i=p.controls.findIndex(c=>c.name===after);p.controls.splice(i+1,0,item);};
ins('RoundAuxButton',tog('LeftAuxButton','AWS / TPWS isolation (lit = Isolated / unlit = Normal)','TPWS_Isolation_IrregularLever',1,0));
ins('LeftAuxButton',tog('RightAuxButton','DSD isolation (lit = Isolated / unlit = Normal)','DSD_Iso',0,1));
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
console.log(p.controls.map(c=>c.name+' :: '+c.description).join('\n'));
