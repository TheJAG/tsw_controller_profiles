// BR Class 37/5 (DTG, Tees Valley Line). BR diesel loco with bracketed node names per cab: Throttle_F (Off 0 / On 0.2 /
// continuous 0.21..1), DriversBrake_F (Running 0.1 / 1st application 0.25 / Service continuous 0.3..0.75 / Full service
// 0.8 / Emergency 0.9; Release and Shutdown are spring or locked), StraightBrake_F continuous 0..1, Reverser_F Off 0 /
// Reverse 0.245 / Engine only 0.567 / Forward 0.9225. The handles only store with MasterKey_F (toggle button) on and
// CabChangeLever_F (the brake key) at 1. Layout as the Class 66: brake left, power right, loco brake on the flap lever.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4678940';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_DSN_RF_Class37-5aX_C.json','utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/DSN_RF_Class37/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));p.name='TSW | Class 37 | DTG | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const momA=(node,on,off)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const R='Reverser_F (IrregularLever)',TH='Throttle_F (IrregularLever)',DB='DriversBrake_F (IrregularLever)',SB='StraightBrake_F (SimpleLever)',MK='MasterKey_F (ToggleButton)',CC='CabChangeLever_F (Simple Lever)',HORN='Horn_FL (IrregularLever)',WIP='Wiper_FL (IrregularLever)';
// headlight switch: take the swept notches of the (A) switch, whatever they are called
const HLname=Object.keys(cap.levers).find(n=>/^HeadLightSwitch \(A\)/.test(n))||Object.keys(cap.levers).find(n=>/RouteIndicatorLights/.test(n));
const HLn=HLname?(cap.levers[HLname].notches||[]):[]; console.log('headlights',HLname,HLn.map(x=>x.name+'@'+x.snapped).join(' '));
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Off 0 / Reverse 0.245 / Engine only 0.567 / Forward 0.9225), inverted: Forward at the far end, Off nearest',assignments:[{type:'direct_control',controls:R,input_value:{min:0,max:0.9225,steps:[0,0.245,0.567,0.9225],invert:true}}]},
 {name:'LeftThrottle',description:'Driver\'s brake valve (Running 0.1 / 1st application 0.25 / Service continuous 0.3..0.75 / Full service 0.8 / Emergency 0.9; Release and Shutdown are not storable). Plain: Running at the far end, Emergency nearest; 1st application on the 0.31 detent, Full service on the 0.84 FLX detent',assignments:[{type:'direct_control',controls:DB,input_value:{min:0.1,max:0.9,steps:[0.1,0.25,null,0.8,0.9],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.36,threshold_end:0.78,threshold_tolerance:0},{threshold:0.84,threshold_tolerance:0.045},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Power controller (Off 0 / On 0.2 / continuous 0.21..1 / Full 1). Plain: Off at the far end, full power nearest; On on the 0.31 idle detent',assignments:[{type:'direct_control',controls:TH,input_value:{min:0,max:1,steps:[0,0.2,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.36,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Straight air (loco) brake, continuous 0..1, plain: released at the far end, full nearest',assignments:[{type:'direct_control',controls:SB,input_value:{min:0,max:1}}]},
 {name:'ParkingBrake',description:'Master key (toggle button) and cab change lever (brake key) in / out: the handles only store with both in',assignments:[momA(MK,1,0),momA(CC,1,0)]},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','Sander_(A)',1,0),
 mom('RightThrottleButton','Engine start','EngineStart_F (PushButton)',1,0),
 mom('LeftEngineOn','Horn | High',HORN,-1,0.5),
 mom('RightEngineOn','Horn | Low',HORN,1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Engine stop','EngineStop_F (PushButton)',1,0),
 tog('LeftAuxButton','AWS isolation (lit = Isolated / unlit = Unisolated)','AWS_Isolation_F (ToggleButton)',0,1),
 tog('RightAuxButton','DSD circuit breaker (lit = on)','DSDCircuitBreaker',1,0),
 {name:'RotaryCrank',description:'Wipers one notch back (Run > Stop > Park)',assignments:[rel(WIP,-0.34)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on (Park > Stop > Run)',assignments:[rel(WIP,0.34)]},
 {name:'AutoBrake0',description:'Lights | All off',assignments:[set('HeadLightSwitch (A)',0),set('RouteIndicatorLights (A)',0),set('TailLightLeft_A',0),set('TailLightRight_A',0)]},
 {name:'AutoBrake1',description:'Lights | Headlight',assignments:[set('HeadLightSwitch (A)',1),set('RouteIndicatorLights (A)',0),set('TailLightLeft_A',0),set('TailLightRight_A',0)]},
 {name:'AutoBrake2',description:'Lights | Headlight + route indicator (marker) lights',assignments:[set('HeadLightSwitch (A)',1),set('RouteIndicatorLights (A)',1),set('TailLightLeft_A',0),set('TailLightRight_A',0)]},
 {name:'AutoBrake3',description:'Lights | Tail lights only',assignments:[set('HeadLightSwitch (A)',0),set('RouteIndicatorLights (A)',0),set('TailLightLeft_A',1),set('TailLightRight_A',1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const hlPos=[{short:'0',desc:'–'},{short:'BTV',desc:'All off'},{short:'LO',desc:'Headlight'},{short:'2',desc:'Head + marker'},{short:'3',desc:'Tail only'},{short:'HI',desc:'–'}];
const m={name:'tsw-class-37-dtg-thejag',title:'Class 37',eyebrow:'BR Railfreight · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Tees Valley Line: Darlington – Saltburn',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-britishrail-navy.svg',alt:'British Rail'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-37-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Engine only','Reverse','Off'],start:1},
 leftThrottle:{name:'Train brake',continuous:true,notches:['Running','1st application',null,null,'Full service','Emergency'],start:4},
 rightThrottle:{name:'Power controller',continuous:true,notches:['Off','On',null,null,null,'Full'],start:0},
 flap:{name:'Loco brake',continuous:true,notches:['Release',null,null,null,'Full'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:hlPos,start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DSD breaker'},
 modeSwitch:{name:'Wipers',left:'back',right:'on'}, roundAux:{name:'Engine stop'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key + brake key',flat:'out',up:'in'}},
setup:['Master key and brake key in (PARK BRK), battery on','Reverser to Engine only, start the engine (right throttle button)','Check the AWS isolation light is out, DSD breaker on','Headlights on (AUTO BRK)','Release the handbrake in the cab','Train brake to Full service until the pipe is charged'],
depart:['Check the signal','Reverser to Forward','Loco brake to Release (flap lever away)','Train brake to Running, wait for the pipe to charge','Power controller to On, then open up slowly with the heavy train','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-37-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
