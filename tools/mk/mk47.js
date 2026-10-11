// BR Class 47/4 (Athena Simulations, ECML Diesel Railtour Pack, 47484 in GWR green). The Class 37 pattern with bracketed
// node names: Throttle_F (IrregularLever) Off 0 / On 0.1 / continuous 0.15..0.95 / Full 1; DriversBrake_F (IrregularLever)
// Running 0.1 / Initial application 0.25 / Service continuous 0.26..0.75 / Full service 0.8 / Emergency 0.9 / Neutral-
// Shutdown 1 (Release / Overcharge below 0.05 does not store); StraightBrake_F (SimpleLever) continuous 0..1; Reverser_F
// (IrregularLever) Off 0 / Reverse 0.2505 / Engine only 0.5797 / Forward 0.9428. The handles only store with MasterKey_F
// (bare name, IrregularLever Off / On) and CabChangeLever_F (the brake key) at 1, and the reverser will not leave Forward
// while the throttle is at On. No sander. Layout as the Class 37 / 66: brake left, power right, loco brake on the flap.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680060';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_LE_BR_Class47-4_C'}];p.name='TSW | Class 47 | Athena | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const momA=(node,on,off)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const R='Reverser_F (IrregularLever)',TH='Throttle_F (IrregularLever)',DB='DriversBrake_F (IrregularLever)',SB='StraightBrake_F (SimpleLever)',MK='MasterKey_F',CC='CabChangeLever_F',HORN='Horn_FL (IrregularLever)',WIP='Wiper_FL (IrregularLever)';
const HL='HeadlightSwitch_F (ToggleButton)',ML='MarkerLights_F',TL='TailLightSwitch_F';
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Off 0 / Reverse 0.2505 / Engine only 0.5797 / Forward 0.9428), inverted: Forward at the far end, Off nearest. It only leaves Forward with the power controller at Off',assignments:[{type:'direct_control',controls:R,input_value:{min:0,max:0.9428,steps:[0,0.2505,0.5797,0.9428],invert:true}}]},
 {name:'LeftThrottle',description:'Driver\'s brake valve (Running 0.1 / Initial application 0.25 / Service continuous 0.26..0.75 / Full service 0.8 / Emergency 0.9; Release and Neutral-Shutdown are left out). Plain: Running at the far end, Emergency nearest; Initial application on the 0.31 detent, Full service on the 0.84 FLX detent',assignments:[{type:'direct_control',controls:DB,input_value:{min:0.1,max:0.9,steps:[0.1,0.25,null,0.8,0.9],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.36,threshold_end:0.78,threshold_tolerance:0},{threshold:0.84,threshold_tolerance:0.045},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Power controller (Off 0 / On 0.1 / continuous 0.15..0.95 / Full 1). Plain: Off at the far end, full power nearest; On on the 0.31 idle detent',assignments:[{type:'direct_control',controls:TH,input_value:{min:0,max:1,steps:[0,0.1,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.36,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Straight air (loco) brake, continuous 0..1, plain: released at the far end, full nearest',assignments:[{type:'direct_control',controls:SB,input_value:{min:0,max:1}}]},
 {name:'ParkingBrake',description:'Master key (MasterKey_F) and cab change lever (CabChangeLever_F, the brake key) in / out: the handles only store with both in',assignments:[momA(MK,1,0),momA(CC,1,0)]},
 key('GearLever','AWS reset','Q'),
 mom('RightThrottleButton','Engine start','EngineStart_F (PushButton)',1,0),
 mom('LeftEngineOn','Horn | High',HORN,-1,0.5),
 mom('RightEngineOn','Horn | Low',HORN,1,0.5),
 {name:'RudderTrimLeft',description:'Handbrake | Apply',assignments:[momA('ParkingBrake_F (ToggleButton)',1,1)]},
 {name:'RudderTrimRight',description:'Handbrake | Release',assignments:[momA('ParkingBrake_F (ToggleButton)',0,0)]},
 mom('RoundAuxButton','Engine stop','EngineStop_F (PushButton)',1,0),
 tog('LeftAuxButton','AWS isolation (lit = Isolated 0 / unlit = Unisolated)','AWS_Isolation_F',0,1),
 tog('RightAuxButton','DSD isolation (lit = Isolated 0 / unlit = Unisolated)','DSD_Isolation_F',0,1),
 {name:'RotaryCrank',description:'Wipers one notch back (Run > Park > Off)',assignments:[rel(WIP,-0.5)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on (Off > Park > Run)',assignments:[rel(WIP,0.5)]},
 {name:'AutoBrake0',description:'Lights | All off',assignments:[set(HL,0),set(ML,0),set(TL,0.5)]},
 {name:'AutoBrake1',description:'Lights | Headlight',assignments:[set(HL,1),set(ML,0),set(TL,0.5)]},
 {name:'AutoBrake2',description:'Lights | Headlight + marker lights',assignments:[set(HL,1),set(ML,1),set(TL,0.5)]},
 {name:'AutoBrake3',description:'Lights | Marker lights only',assignments:[set(HL,0),set(ML,1),set(TL,0.5)]},
 {name:'AutoBrake4',description:'Lights | Tail light (left-hand side)',assignments:[set(HL,0),set(ML,0),set(TL,1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const hlPos=[{short:'0',desc:'All off'},{short:'BTV',desc:'Headlight'},{short:'LO',desc:'Head + marker'},{short:'2',desc:'Marker only'},{short:'3',desc:'Tail light'},{short:'HI',desc:'–'}];
const m={name:'tsw-class-47-athena-thejag',title:'Class 47',eyebrow:'British Rail · Athena Simulations · TCA Quadrant Airbus',profileName:p.name,developer:'Athena Simulations',route:'ECML Diesel Railtour: Doncaster – Peterborough',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-britishrail-navy.svg',alt:'British Rail'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-47-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Engine only','Reverse','Off'],start:1},
 leftThrottle:{name:'Train brake',continuous:true,notches:['Running','Initial',null,null,'Full service','Emergency'],start:4},
 rightThrottle:{name:'Power controller',continuous:true,notches:['Off','On',null,null,null,'Full'],start:0},
 flap:{name:'Loco brake',continuous:true,notches:['Release',null,null,null,'Full'],start:4},
 leftThrottleButton:null, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:hlPos,start:0},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DSD isolation'},
 modeSwitch:{name:'Wipers',left:'back',right:'on'}, roundAux:{name:'Engine stop'}, rudTrim:{name:'Handbrake on / off'},
 parkBrk:{name:'Master key + brake key',flat:'out',up:'in'}},
setup:['Battery switch closed in the cab (a scenario starts cold)','Master key and brake key in (PARK BRK up)','Reverser to Engine only, start the engine (right throttle button)','AWS and DSD isolation lights out','Headlights on (AUTO BRK)','Release the handbrake (RUD TRIM right)'],
depart:['Check the signal','Train brake to Running, wait for the pipe to charge','Reverser to Forward','Loco brake to Release (flap lever away)','Power controller to On, then open up slowly','Acknowledge AWS with the gear lever','Power controller to Off before moving the reverser back']};
fs.writeFileSync('tools/manual/trains/tsw-class-47-athena-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
