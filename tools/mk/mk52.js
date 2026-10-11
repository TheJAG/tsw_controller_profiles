// BR Class 52 Western (DTG, West Somerset Railway), 2026-10-12. Derived from mk47.js: plain node names, the same handles. Agent probe with
// MasterKey_F (lever) and CabChange_F (lever, the brake key) at 1 and both engines started (EngineAStart_F / EngineBStart_F): Throttle_F
// Off 0 / On 0.1 / continuous 0.13..1 (0.12 snaps to 0.1), one gate down; DriversBrake_F Release (never stores) / Running 0.1 / Initial
// 0.25 / Service continuous 0.26..0.75 / Full 0.8 / Emergency 0.9 / Shutdown 1 (loads there); StraightBrake_F continuous; Reverser_F
// Engine Only 0 / Reverse 0.25 / Off 0.5 / Forward 0.75 / Engine Only 1 (five notches, the last Engine Only left out). IS_GetActiveCab
// fails, the F cab is wired by name. Lights are push buttons (Headlight_F, MarkerLights_F, InstrumentLights_F, CabLight_F).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4678840';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_WSR_Class52_C'},{class_name:'RVM_GWB_BR_Class52_C'}];p.name='TSW | Class 52 | DTG | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const momA=(node,on,off)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const R='Reverser_F',TH='Throttle_F',DB='DriversBrake_F',SB='StraightBrake_F',MK='MasterKey_F',CC='CabChange_F',HORN='Horn_F (DriverDesk)',WIP='Wiper_FL';
const HL='Headlight_F',ML='MarkerLights_F',IL='InstrumentLights_F';
// Headlight_F / MarkerLights_F / InstrumentLights_F are on-off push buttons that toggle on a value change through the mod: off positions send 0, on positions 1
const lights=(h,m,i)=>[set(HL,h),set(ML,m),set(IL,i)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Engine only 0 / Reverse 0.25 / Off 0.5 / Forward 0.75; the second Engine only at 1 is left out), inverted: Forward at the far end, Engine only nearest. It only leaves Forward with the power controller at Off',assignments:[{type:'direct_control',controls:R,input_value:{min:0,max:0.75,steps:[0,0.25,0.5,0.75],invert:true}}]},
 {name:'LeftThrottle',description:'Driver\'s brake valve (Running 0.1 / Initial application 0.25 / Service continuous 0.26..0.75 / Full service 0.8 / Emergency 0.9; Release and Shutdown are left out, the loco loads at Shutdown). Plain: Running at the far end, Emergency nearest; Initial application on the 0.31 detent, Full service on the 0.84 FLX detent',assignments:[{type:'direct_control',controls:DB,input_value:{min:0.1,max:0.9,steps:[0.1,0.25,null,0.8,0.9],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.36,threshold_end:0.78,threshold_tolerance:0},{threshold:0.84,threshold_tolerance:0.045},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Power controller (Off 0 / On 0.1 / continuous 0.13..1; it only moves with the engines running and the reverser in Forward). Plain: Off at the far end, full power nearest; On on the 0.31 idle detent',assignments:[{type:'direct_control',controls:TH,input_value:{min:0,max:1,steps:[0,0.1,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.36,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Straight air (loco) brake, continuous 0..1, plain: released at the far end, full nearest',assignments:[{type:'direct_control',controls:SB,input_value:{min:0,max:1}}]},
 {name:'ParkingBrake',description:'Master key (MasterKey_F lever) and cab change lever (CabChange_F, the brake key) in / out: the handles only store with both in',assignments:[momA(MK,1,0),momA(CC,1,0)]},
 mom('GearLever','AWS reset (AWS_Reset_F push button, held)','AWS_Reset_F',1,0),
 mom('LeftThrottleButton','Sand (Sander_F push button)','Sander_F',1,0),
 mom('RightThrottleButton','Engine A start (EngineAStart_F, held)','EngineAStart_F',1,0),
 mom('LeftEngineOn','Horn | High (Horn_F lever 1, rest 0.5)',HORN,1,0.5),
 mom('RightEngineOn','Horn | Low (Horn_F lever 0, rest 0.5)',HORN,0,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Engine B start (EngineBStart_F, held); the stop buttons stay in the cab','EngineBStart_F',1,0),
 tog('LeftAuxButton','AWS isolation (AWS_Isolate_F lever: Isolated 0 / Unisolated 1). Lit = isolated','AWS_Isolate_F',0,1),
 tog('RightAuxButton','DSD fuse (DSD_Fuse lever: Out 0 / In 1). Lit = in','DSD_Fuse',1,0),
 {name:'RotaryCrank',description:'Wiper off (Wiper_FL: Off 0 / Park 0.5 / Run 1)',assignments:[set(WIP,0)]},
 {name:'RotaryIgnStart',description:'Wiper run (Wiper_FL 1)',assignments:[set(WIP,1)]},
 {name:'AutoBrake0',description:'Lights | All off',assignments:lights(0,0,0)},
 {name:'AutoBrake1',description:'Lights | Headlight',assignments:lights(1,0,0)},
 {name:'AutoBrake2',description:'Lights | Headlight and marker lights',assignments:lights(1,1,0)},
 {name:'AutoBrake3',description:'Lights | Headlight, markers and instrument lights',assignments:lights(1,1,1)},
 {name:'AutoBrake4',description:'Lights | Marker lights only',assignments:lights(0,1,0)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const hlPos=[{short:'0',desc:'All off'},{short:'BTV',desc:'Headlight'},{short:'LO',desc:'Head + marker'},{short:'2',desc:'+ instruments'},{short:'3',desc:'Marker only'},{short:'HI',desc:'–'}];
const m={name:'tsw-class-52-dtg-thejag',title:'Class 52',eyebrow:'West Somerset Railway · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'West Somerset Railway: Bishops Lydeard – Minehead',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-52-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Off','Reverse','Engine only'],start:1},
 leftThrottle:{name:'Train brake',continuous:true,notches:['Running','Initial',null,null,'Full service','Emergency'],start:4},
 rightThrottle:{name:'Power controller',continuous:true,notches:['Off','On',null,null,null,'Full'],start:0},
 flap:{name:'Loco brake',continuous:true,notches:['Release',null,null,null,'Full'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Engine A start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:hlPos,start:0},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DSD fuse'},
 modeSwitch:{name:'Wiper',left:'off',right:'run'}, roundAux:{name:'Engine B start'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key + brake key',flat:'out',up:'in'}},
setup:['Battery switch closed in the cab','Master key and brake key in (PARK BRK up)','Start engine A (right throttle button) and engine B (round aux)','AWS isolation light out, DSD fuse in','Headlights on (AUTO BRK)','Release the handbrake in the cab'],
depart:['Check the signal','Train brake to Running, wait for the pipe to charge','Reverser to Forward','Loco brake to Release (flap lever away)','Power controller to On, then open up slowly','Acknowledge AWS with the gear lever','Power controller to Off before moving the reverser back']};
fs.writeFileSync('tools/manual/trains/tsw-class-52-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
// no apply_side: IS_GetActiveCab fails on this loco (agent 2026-10-12)
