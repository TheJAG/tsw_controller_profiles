// BR Class 40 Whistler (Athena Simulations, ECML Diesel Railtour Pack, 40 in BR blue), 2026-10-12. Derived from mk47.js: the same
// bracketed node names and brake valve. API probe with MasterKey_F and CabChangeLever_F at 1 and the engine started (it does not
// move otherwise): Throttle_F Off 0 / On 0.2 (sets 0.1..0.21) / continuous 0.3..1, one gate down; DriversBrake_F Running 0.1 /
// Initial 0.25 / Service continuous 0.26..0.78 / Full 0.8 / Emergency 0.9 (0.85+) / Neutral-Shutdown 1; StraightBrake_F continuous;
// Reverser_F Off / Reverse / Engine only / Forward in zones 0..0.16 / 0.17..0.49 / 0.5..0.83 / 0.84..1 (stores k/3). GetActiveCab
// answers false/false, so the F cab is wired by name (no apply_side). Marker and tail lamps are push buttons, Sander_(A) exists.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680060';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_LE_BR_Class40-aX1_C'},{class_name:'RVM_LE_BR_Class40-dX_CHC_C'}];p.name='TSW | Class 40 | Athena | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const momA=(node,on,off)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const R='Reverser_F (IrregularLever)',TH='Throttle_F (IrregularLever)',DB='DriversBrake_F (IrregularLever)',SB='StraightBrake_F (SimpleLever)',MK='MasterKey_F (ToggleButton)',CC='CabChangeLever_F (Simple Lever)',HORN='Horn_FL (IrregularLever)',WIP='Wiper_FL (IrregularLever)';
const FM=['FrontLeftMarker','FrontRightMarker'],RM=['RearLeftMarker','RearRightMarker'],TA=['TailLightLeft_A','TailLightRight_A'];
// marker and tail lamps are on-off push buttons that toggle on a value change through the mod: off positions send 0, on positions 1
const lights=(fm,rm,ta)=>[...FM.map(n=>set(n,fm)),...RM.map(n=>set(n,rm)),...TA.map(n=>set(n,ta))];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Off 0 / Reverse 0.25 / Engine only 0.58 / Forward 0.92; the zones take any value, even thirds), inverted: Forward at the far end, Off nearest. It only leaves Forward with the power controller at Off',assignments:[{type:'direct_control',controls:R,input_value:{min:0,max:1,steps:[0,0.3333,0.6667,1],invert:true}}]},
 {name:'LeftThrottle',description:'Driver\'s brake valve (Running 0.1 / Initial application 0.25 / Service continuous 0.26..0.78 / Full service 0.8 / Emergency 0.9; Release and Neutral-Shutdown are left out). Plain: Running at the far end, Emergency nearest; Initial application on the 0.31 detent, Full service on the 0.84 FLX detent',assignments:[{type:'direct_control',controls:DB,input_value:{min:0.1,max:0.9,steps:[0.1,0.25,null,0.8,0.9],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.36,threshold_end:0.78,threshold_tolerance:0},{threshold:0.84,threshold_tolerance:0.045},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Power controller (Off 0 / On 0.2 / continuous 0.3..1; it only moves with the engine running and the reverser in Forward). Plain: Off at the far end, full power nearest; On on the 0.31 idle detent',assignments:[{type:'direct_control',controls:TH,input_value:{min:0,max:1,steps:[0,0.2,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.36,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Straight air (loco) brake, continuous 0..1, plain: released at the far end, full nearest',assignments:[{type:'direct_control',controls:SB,input_value:{min:0,max:1}}]},
 {name:'ParkingBrake',description:'Master key (MasterKey_F) and cab change lever (CabChangeLever_F, the brake key) in / out: the handles only store with both in',assignments:[momA(MK,1,0),momA(CC,1,0)]},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand (Sander_(A) push button)','Sander_(A)',1,0),
 mom('RightThrottleButton','Engine start','EngineStart_F (PushButton)',1,0),
 mom('LeftEngineOn','Horn | High',HORN,-1,0.5),
 mom('RightEngineOn','Horn | Low',HORN,1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Engine stop','EngineStop_F (PushButton)',1,0),
 tog('LeftAuxButton','AWS isolation (AWS_Isolation_F lever: Isolated 0 / Unisolated 1). Lit = isolated','AWS_Isolation_F (Simple Lever)',0,1),
 {name:'RotaryCrank',description:'Wiper stop (Wiper_FL: Stop 0.33 / Run 0.67)',assignments:[set(WIP,0.33)]},
 {name:'RotaryIgnStart',description:'Wiper run (Wiper_FL 0.67)',assignments:[set(WIP,0.67)]},
 {name:'AutoBrake0',description:'Lights | All off',assignments:lights(0,0,0)},
 {name:'AutoBrake1',description:'Lights | Front marker lamps',assignments:lights(1,0,0)},
 {name:'AutoBrake2',description:'Lights | Front markers and A-end tail lamps',assignments:lights(1,0,1)},
 {name:'AutoBrake3',description:'Lights | Rear marker lamps',assignments:lights(0,1,0)},
 {name:'AutoBrake4',description:'Lights | Front and rear markers (shunting)',assignments:lights(1,1,0)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const hlPos=[{short:'0',desc:'All off'},{short:'BTV',desc:'Front markers'},{short:'LO',desc:'+ A tail'},{short:'2',desc:'Rear markers'},{short:'3',desc:'Both ends'},{short:'HI',desc:'–'}];
const m={name:'tsw-class-40-athena-thejag',title:'Class 40',eyebrow:'British Rail · Athena Simulations · TCA Quadrant Airbus',profileName:p.name,developer:'Athena Simulations',route:'ECML Diesel Railtour: Doncaster – Peterborough',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-britishrail-navy.svg',alt:'British Rail'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-40-athena-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Engine only','Reverse','Off'],start:1},
 leftThrottle:{name:'Train brake',continuous:true,notches:['Running','Initial',null,null,'Full service','Emergency'],start:4},
 rightThrottle:{name:'Power controller',continuous:true,notches:['Off','On',null,null,null,'Full'],start:0},
 flap:{name:'Loco brake',continuous:true,notches:['Release',null,null,null,'Full'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:hlPos,start:0},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:null,
 modeSwitch:{name:'Wiper',left:'stop',right:'run'}, roundAux:{name:'Engine stop'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key + brake key',flat:'out',up:'in'}},
setup:['Battery switch closed in the cab (a scenario starts cold)','Master key and brake key in (PARK BRK up)','Reverser to Engine only, start the engine (right throttle button)','AWS isolation light out','Front marker lamps on (AUTO BRK)','Release the handbrake in the cab'],
depart:['Check the signal','Train brake to Running, wait for the pipe to charge','Reverser to Forward','Loco brake to Release (flap lever away)','Power controller to On, then open up slowly','Acknowledge AWS with the gear lever','Power controller to Off before moving the reverser back']};
fs.writeFileSync('tools/manual/trains/tsw-class-40-athena-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
// no apply_side: GetActiveCab answers false/false on this loco (agent probe 2026-10-12)
