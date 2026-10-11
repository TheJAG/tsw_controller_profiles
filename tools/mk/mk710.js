const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_GOB_Class710_DMS_B_C.json','utf8'));
const names=new Set(cap.controls.map(c=>c.name));
const need=n=>{if(!names.has(n))throw new Error('missing node '+n);return n;};
['MasterControlSwitch','TractionBrakeControl','MasterKey','TractionSand','PantographUp','WarningHorn','SignalBuzzer','TPWS_AWS_Isolation','VigilanceDSD_Isolation','WiperControls','HeadMarkerLights','TailLight','CabLight'].forEach(need);
const horn=cap.levers['WarningHorn']||{}; const hMin=horn.minInput!=null?horn.minInput:0, hMax=horn.maxInput!=null?horn.maxInput:1, hRest=horn.defaultInput!=null?horn.defaultInput:0.5;
console.log('horn',hMin,hMax,hRest, JSON.stringify((cap.controls.find(c=>c.name==='WarningHorn')||{}).namedValues));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class710/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const HL='HeadMarkerLights',TL='TailLight';
p.controls=[
 {name:'SpeedbrakeLever',description:'Master control switch (Reverse / Recovery / Secure / Forward / Shutdown)',assignments:[{type:'direct_control',controls:'MasterControlSwitch',input_value:{min:0,max:0.99,steps:[0,0.24,0.49,0.74,0.99],invert:true}}]},
 {name:'LeftThrottle',description:'Traction / brake handle (Max brake -0.75 / brake % continuous / Min brake -0.05 / Coast 0 / traction % continuous 0.05..1; Emergency at -1 is left out on purpose). Plain as in the tested 2025 profile (brake pushed away): max brake raw 0 ±0.04, brake zone 0.05..0.42, min brake 0.45 ±0.03, Coast 0.5 ±0.02, traction zone 0.54..0.955, full 1 ±0.04',assignments:[{type:'direct_control',controls:'TractionBrakeControl',input_value:{min:-0.75,max:1,steps:[-0.75,null,-0.05,0,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.04},{threshold:0.05,threshold_end:0.42,threshold_tolerance:0},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.54,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Cab light (Off / Half / Full)',assignments:[{type:'direct_control',controls:'CabLight',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','TractionSand',1,0),
 mom('RightThrottleButton','Pantograph up','PantographUp',1,0),
 mom('LeftEngineOn','Horn | High','WarningHorn',hMax,hRest),
 mom('RightEngineOn','Horn | Low','WarningHorn',hMin,hRest),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Signal buzzer','SignalBuzzer',1,0),
 tog('LeftAuxButton','TPWS / AWS isolation (lit = Isolated / unlit = Normal)','TPWS_AWS_Isolation',0,1),
 tog('RightAuxButton','Vigilance / DSD isolation (lit = Isolated / unlit = Normal)','VigilanceDSD_Isolation',0,1),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Intermittent > Off)',assignments:[rel('WiperControls',-0.25)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Intermittent > Slow > Fast)',assignments:[rel('WiperControls',0.25)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set(HL,0),set(TL,0)]},
 {name:'AutoBrake1',description:'Headlights | Day running',assignments:[set(HL,0.25),set(TL,0)]},
 {name:'AutoBrake2',description:'Headlights | Marker lights only',assignments:[set(HL,0.5),set(TL,0)]},
 {name:'AutoBrake3',description:'Headlights | Night running',assignments:[set(HL,0.75),set(TL,0)]},
 {name:'AutoBrake4',description:'Headlights | Tail lights',assignments:[set(HL,0),set(TL,0.25)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-710-dtg-thejag',title:'Class 710',eyebrow:'London Overground · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'London Overground Suffragette line: Gospel Oak – Barking Riverside',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-overground-navy.svg',alt:'London Overground'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],diagram:{file:'../../assets/class-710-side.png',source:'Drawing: WestRail642fan, Wikimedia Commons, CC BY-SA 4.0',clean:false},dlc:'store.steampowered.com/app/4680010',credit:'© TheJAG',cab:{file:'../../assets/class-710-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Master control switch',notches:['Shutdown','Forward','Secure','Recovery','Reverse'],start:0},
 leftThrottle:{name:'Traction / brake',continuous:true,notches:['Max brake',null,'Min brake','Coast',null,null,'Full traction'],start:0},
 rightThrottle:null,
 flap:{name:'Cab light',notches:['Full','Half','Off'],start:2},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Pantograph up'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Marker only'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'TPWS/AWS isolation'}, rightAux:{name:'DSD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Signal buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Master control switch from Shutdown to Secure, then Forward when ready','Pantograph up (right throttle button) under the wires','Check TPWS/AWS and DSD isolation lights are out','Headlights to Day','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the signal buzzer','Check the signal','Master control switch to Forward','Handle from Max brake up to Coast','Push into the traction zone, more as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-710-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
