// Clinchfield EMD F7 A unit (DTG, Clinchfield Railroad), 2026-10-12. US freight layout, 1950s F-unit stand. One cab, plain node names;
// IS_GetActiveCab fails. Capture agent probe: Throttle Idle 0.11 / N1..N7 at 0.22 .. 0.88 (0.11 per notch) / N8 1.0 (sets snap to the nearest;
// "Emergency Stop" below Idle at 0 stops the engine, never send it); the throttle is LOCKED while TransitionLever is in Off; TransitionLever
// (DynamicBrake) Braking 0 / Off 0.2 / Series Parallel 0.4 / Series Parallel Shunt 0.6 (Parallel positions unreachable; a change out of
// Braking is refused with the throttle open), loads Off; AutomaticBrake (24RL) Running 0.2 / First Service 0.4 / Lap 0.6 / Service 0.8 /
// Emergency 1 (Release unreachable, loads 0.4); IndependentBrake Release 0 / continuous 0.1..1 (loads 0.5, no bail-off); Reverser Reverse 0 /
// Neutral 0.5 / Forward 1. NO key nodes; EngineRun / GeneratorField / FuelPumpAndControlSwitch load Off. SandingLever spring at 0.5 (0 = Sand,
// 1 = Sand Lead); Horn_F / Horn_B, SIgnalBell (sic, Bell), SafetyPedal (WarningDevices), HeadlightBright (Headlights) / HeadlightDim /
// ClassLights / NumberLights push buttons; BrakeValveCutoutCock Cut-in 0 / Cut-out 1; RotairValve Freight 0 / Freight Lap 0.33 / Passenger
// Lap 0.67 / Passenger 1; IsolationValve Start 0 / Run 0.83; UnitSelectorSwitch quarters; TransitionCutoutSwitch AUTO 0 / MAN 1; wipers
// unnamed (WiperValve_FR). No door nodes (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679200';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_CRR_F7_A_Unit_C','RVM_CRR_F7_B_Unit_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(b,d,n,c)=>[set('HeadlightBright',b),set('HeadlightDim',d),set('NumberLights',n),set('ClassLights',c)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.5 / Forward 1; any value in a zone), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle 0.11 / N1..N7 at 0.22..0.88 / N8 1.0 (the stored positions; nothing below Idle, 0 would stop the engine), inverted: N8 at the far end, Idle nearest. Locked while the transition lever is in Off',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0.11,max:1,steps:[0.11,0.22,0.33,0.44,0.55,0.66,0.77,0.88,1],invert:true}}]},
 {name:'RightThrottle',description:'24RL automatic brake AutomaticBrake (Running 0.2 / First Service 0.4 / Lap 0.6 / Service 0.8 / Emergency 1; Release is unreachable), inverted: Emergency at the far end, Running nearest, even bands',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0.2,max:1,steps:[0.2,0.4,0.6,0.8,1],invert:true}}]},
 {name:'FlapLever',description:'Transition lever TransitionLever (Braking 0 / Off 0.2 / Series Parallel 0.4 / Series Parallel Shunt 0.6), inverted: Series Parallel Shunt at the far end, Braking nearest. Move it with the throttle at Idle; the throttle then sets the dynamic brake strength in Braking',assignments:[{type:'direct_control',controls:'TransitionLever',input_value:{min:0,max:0.6,steps:[0,0.2,0.4,0.6],invert:true}}]},
 {name:'ParkingBrake',description:'Engine switches EngineRun, GeneratorField and FuelPumpAndControlSwitch (On 1 / Off 0; the loco loads with them off, there is no key): PARK BRK up = switches on',assignments:[pair('EngineRun',1,0),pair('GeneratorField',1,0),pair('FuelPumpAndControlSwitch',1,0)]},
 mom('GearLever','Safety pedal (SafetyPedal push button, WarningDevices, held)','SafetyPedal',1,0),
 mom('LeftThrottleButton','Sand (SandingLever spring: 0 while held, 0.5 released)','SandingLever',0,0.5),
 mom('RightThrottleButton','Horn (Horn_F push button)','Horn_F',1,0),
 {name:'LeftEngineOn',description:'Signal bell (SIgnalBell 1 while up, 0 when down)',assignments:[pair('SIgnalBell',1,0)]},
 {name:'RightEngineOn',description:'Transition cut-out MAN (TransitionCutoutSwitch 1 while up, AUTO 0 when down)',assignments:[pair('TransitionCutoutSwitch',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Brake valve cut-out cock (BrakeValveCutoutCock Cut-in 0 / Cut-out 1). Lit = cut in; loads cut in','BrakeValveCutoutCock',0,1),
 tog('RoundAuxButton','Independent brake IndependentBrake: Full 1 / Release 0. Lit = applied; loads half applied','IndependentBrake',1,0),
 {name:'RotaryCrank',description:'Wipers off (WiperValve_FR 0)',assignments:[set('WiperValve_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperValve_FR 0.5)',assignments:[set('WiperValve_FR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0,0,0)},
 {name:'AutoBrake1',description:'Lights | Headlight dim (HeadlightDim 1)',assignments:lights(0,1,0,0)},
 {name:'AutoBrake2',description:'Lights | Headlight bright (HeadlightBright 1)',assignments:lights(1,0,0,0)},
 {name:'AutoBrake3',description:'Lights | Bright and number lights',assignments:lights(1,0,1,0)},
 {name:'AutoBrake4',description:'Lights | Bright, number and class lights',assignments:lights(1,0,1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-clinchfield-f7-dtg-thejag',title:'F7',eyebrow:'Clinchfield Railroad · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Clinchfield Railroad: Elkhorn City – Dante',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/clinchfield-f7-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'24RL brake',notches:['Emergency','Service','Lap','First service','Running'],start:1},
 flap:{name:'Transition',notches:['SP shunt','Series par.','Off','Braking'],start:2},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Safety pedal'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ number'},{short:'HI',desc:'+ class'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Transition MAN',start:true},
 leftAux:{name:'Brake valve cock'}, rightAux:null,
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Engine switches',flat:'off',up:'on'}},
setup:['PARK BRK up: engine run, generator field and fuel pump / control switches on (the loco loads with them off; no key)','Reverser from Neutral to Forward; brake valve cock cut in (left aux lit)','Lights to Bright','Independent applied (round aux lit), 24RL brake at Service (parked); throttle Idle, transition Off'],
depart:['Check the signal; bell on (ENG 1)','24RL brake to Running; round aux out to release the independent','Transition lever to Series parallel (throttle at Idle), then throttle notch by notch; SP shunt at speed','Hold the safety pedal with the gear lever when it calls','Brake: throttle to Idle, transition to Braking and throttle up for dynamic braking; 24RL to First service or Service, Lap to hold; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-clinchfield-f7-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
