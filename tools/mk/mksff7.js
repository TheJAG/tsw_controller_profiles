// Santa Fe EMD F7 A unit (DTG loco pack, pak CJP_SF_F7, Cajon Pass), 2026-10-13. Derived from mkf7.js: the Clinchfield F7 driving nodes
// and values (Reverser 0 / 0.5 / 1; Throttle Idle 0.11 / N1..N7 0.22..0.88 / N8 1; TransitionLever Braking 0 / Off 0.2 / SP 0.4 / SPS 0.6;
// 24RL AutomaticBrake Running 0.2 / First Service 0.4 / Lap 0.6 / Service 0.8 / Emergency 1; IndependentBrake 0 / 0.1..1), captured from a
// daylight spawn (no timetable service; only three night scenarios). Different class: ReverserHandle key (MasterSwitch push button, Out 0 /
// In 1), DeadmansPedal (Alerter, reversible, loads pressed), Horn (SimpleLever), HeadlightSwitchProxy Off 0 / Dim 0.33 / Bright 0.66,
// SignalLightSwitch Off 0 / Red 0.25 / Full 0.5 / Dim 0.75, SafetyControlCock (WarningDevices, Cut-In 1); no SafetyPedal / Horn_F.
// INTERLOCK LAG: the game checks throttle, transition and reverser against the other lever's state before its LAST change, so a single
// set can leave a lever locked; a second set to a slightly different value of the lever just moved refreshes the check. The profile
// therefore sends every throttle and transition change twice (the notch value, then the same notch +0.01, which snaps back).
// Spawned cold: ReverserHandle Out, BrakeValveCutoutCock Cut-Out 1, SafetyControlCock Cut-Out 0, GeneratorField 0.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679520';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_CJP_F7_A_Unit_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,n,c)=>[set('HeadlightSwitchProxy',h),set('NumberLights',n),set('ClassLights',c)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.5 / Forward 1; any value in a zone), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle 0.11 / N1..N7 at 0.22..0.88 / N8 1.0 (the stored positions; nothing below Idle, 0 would stop the engine), inverted: N8 at the far end, Idle nearest. Locked while the transition lever is in Off; each change is sent twice (notch, then notch +0.01) to refresh the lagging interlock',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0.11,max:1,steps:[0.11,0.22,0.33,0.44,0.55,0.66,0.77,0.88,1],invert:true}},{type:'direct_control',controls:'Throttle',input_value:{min:0.11,max:1,steps:[0.12,0.23,0.34,0.45,0.56,0.67,0.78,0.89,0.99],invert:true}}]},
 {name:'RightThrottle',description:'24RL automatic brake AutomaticBrake (Running 0.2 / First Service 0.4 / Lap 0.6 / Service 0.8 / Emergency 1; Release is unreachable), inverted: Emergency at the far end, Running nearest, even bands',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0.2,max:1,steps:[0.2,0.4,0.6,0.8,1],invert:true}}]},
 {name:'FlapLever',description:'Transition lever TransitionLever (Braking 0 / Off 0.2 / Series Parallel 0.4 / Series Parallel Shunt 0.6), inverted: Series Parallel Shunt at the far end, Braking nearest. Move it with the throttle at Idle; the throttle then sets the dynamic brake strength in Braking; each change is sent twice (notch, then notch +0.01) to refresh the lagging interlock',assignments:[{type:'direct_control',controls:'TransitionLever',input_value:{min:0,max:0.6,steps:[0,0.2,0.4,0.6],invert:true}},{type:'direct_control',controls:'TransitionLever',input_value:{min:0,max:0.6,steps:[0.01,0.21,0.41,0.59],invert:true}}]},
 {name:'ParkingBrake',description:'Reverser handle ReverserHandle (MasterSwitch In 1 / Out 0), GeneratorField (On 1 / Off 0) and brake valve cut-out cock BrakeValveCutoutCock (Cut-in 0 / Cut-out 1): PARK BRK up = handle in, field on, brake valve cut in; a spawned loco loads with all three off',assignments:[pair('ReverserHandle',1,0),pair('GeneratorField',1,0),pair('BrakeValveCutoutCock',0,1)]},
 mom('GearLever','Deadman pedal (DeadmansPedal pressed 1 while held, 0 released; it loads pressed)','DeadmansPedal',1,0),
 mom('LeftThrottleButton','Sand (SandingLever spring: 0 while held, 0.5 released)','SandingLever',0,0.5),
 mom('RightThrottleButton','Horn (Horn lever 1 while held, 0 released)','Horn',1,0),
 {name:'LeftEngineOn',description:'Signal bell (SIgnalBell 1 while up, 0 when down)',assignments:[pair('SIgnalBell',1,0)]},
 {name:'RightEngineOn',description:'Transition cut-out MAN (TransitionCutoutSwitch 1 while up, AUTO 0 when down)',assignments:[pair('TransitionCutoutSwitch',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Safety control cock (SafetyControlCock Cut-In 1 / Cut-Out 0). Lit = cut in; loads cut out','SafetyControlCock',1,0),
 tog('RoundAuxButton','Independent brake IndependentBrake: Full 1 / Release 0. Lit = applied; loads half applied','IndependentBrake',1,0),
 {name:'RotaryCrank',description:'Wipers off (WiperValve_FR 0)',assignments:[set('WiperValve_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperValve_FR 0.5)',assignments:[set('WiperValve_FR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0,0)},
 {name:'AutoBrake1',description:'Lights | Headlight dim (HeadlightSwitchProxy 0.33)',assignments:lights(0.33,0,0)},
 {name:'AutoBrake2',description:'Lights | Headlight bright (0.66)',assignments:lights(0.66,0,0)},
 {name:'AutoBrake3',description:'Lights | Bright and number lights',assignments:lights(0.66,1,0)},
 {name:'AutoBrake4',description:'Lights | Bright, number and class lights',assignments:lights(0.66,1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-santafe-f7-dtg-thejag',title:'F7',eyebrow:'Santa Fe · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Cajon Pass: Barstow – San Bernardino',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-santafe-slate.svg',alt:'Santa Fe'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/santafe-f7-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'24RL brake',notches:['Emergency','Service','Lap','First service','Running'],start:1},
 flap:{name:'Transition',notches:['SP shunt','Series par.','Off','Braking'],start:2},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Deadman'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ number'},{short:'HI',desc:'+ class'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Transition MAN',start:true},
 leftAux:{name:'Safety control'}, rightAux:null,
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · field · valve',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, generator field on, brake valve cut in (a spawned loco loads with them off)','Reverser from Neutral to Forward; safety control cock cut in (left aux lit)','Lights to Bright','Independent applied (round aux lit), 24RL brake at Service (parked); throttle Idle, transition Off'],
depart:['Check the signal; bell on (ENG 1)','24RL brake to Running; round aux out to release the independent','Transition lever to Series parallel (throttle at Idle), then throttle notch by notch; SP shunt at speed','Deadman pedal on the gear lever when it calls','Brake: throttle to Idle, transition to Braking and throttle up for dynamic braking; 24RL to First service or Service, Lap to hold; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-santafe-f7-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
