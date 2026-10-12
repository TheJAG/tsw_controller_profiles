// Clinchfield EMD SD40 (DTG, Clinchfield Railroad; the NewJourneysSD40 pack reuses the class), 2026-10-12. US freight layout, AAR stand with a
// RATCHET selector. One cab, plain node names; IS_GetActiveCab fails. Capture agent probe: ThrottleLever (Throttle) Idle 0.11 / N1..N7 at
// 0.22..0.88 / N8 1.0 (snaps; "Stop" below Idle never sent), only moves with ReverserHandle In and the SelectorLever on 1..4; SelectorLever
// (identifier DynamicBrake) B -1 / OFF 0 / 1 / 2 / 3 / 4 is a spring ratchet: a value of +1 or -1 held about 0.5 s moves one step, a plain set
// does nothing (game keys . and ,); OFF -> B needs the reverser out of Neutral and in B the reverser is locked; "ThrottleLever (DynamicBrake)"
// is a separate node (identifier Throttle) for the dynamic strength in B: Off 0.11 / continuous to 0.95 = 100 %; AutomaticBrake (26L) Release
// 0 / Initial Reduction 0.125 / service continuous 0.2..0.6 / Full Service 0.65 / Suppression 0.7 (and 0.75) / Handle Off 0.9 / Emergency 1
// (loads 0.9); IndependentBrake Release 0.25 / continuous to 1, bail-off below 0.25 a spring; Reverser -1 / 0 / 1 (snaps). Loads PART COLD:
// ReverserHandle (MasterSwitch) Out, EngineRun / GeneratorField / ControlFuelPump Off, CutOffPilotValve Cut-Out 0 / Freight 1 / Passenger 2
// (the automatic brake does nothing until Freight), MU-2A_Valve Trail 1 (Lead 0). Buttons Horn, Bell, Sand, SandLead, AlerterReset,
// Fuse_WarningDevices (WarningDevices) 0 / 1 (loads 0), EmergencyBrakeValve, EngineStartup / EngineShutdown, StepLights, GaugeLights,
// CabLight_L/R, NumberLights_F/B, DynamicBrakeCircuitBraker (sic) Closed 0 / Open 1; HeadlightDimmingSwitch (Headlights) Bright Back 0 /
// Medium Back 0.25 / Dim 0.5 / Medium Front 0.75 / Bright Front 1; IsolationSwitch Run 0 / Isolate 1; wipers unnamed; no door nodes (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679200';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_CRR_SD40_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,n)=>[set('HeadlightDimmingSwitch',h),set('NumberLights_F',n)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up); locked while the selector is in B',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle ThrottleLever (Throttle) Idle 0.11 / N1..N7 at 0.22..0.88 / N8 1.0 (stored positions, nothing below Idle), inverted: N8 at the far end, Idle nearest. Only moves with the selector on 1..4',assignments:[{type:'direct_control',controls:'ThrottleLever (Throttle)',input_value:{min:0.11,max:1,steps:[0.11,0.22,0.33,0.44,0.55,0.66,0.77,0.88,1],invert:true}}]},
 {name:'RightThrottle',description:'26L automatic brake AutomaticBrake (Release 0 / Initial reduction 0.125 / service continuous 0.2..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.9 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1, Suppression 0.2, Full Service 0.3, service zone 0.36..0.86, Initial 0.9 ±0.03, Release 1 ±0.06 nearest. Dead until the cut-off pilot valve is at Freight (PARK BRK up)',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.125,null,0.65,0.7,0.9,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Dynamic brake handle "ThrottleLever (DynamicBrake)" (Off 0.11 / continuous to 0.95 = 100 %; acts with the selector in B), inverted: full at the far end, Off nearest',assignments:[{type:'direct_control',controls:'ThrottleLever (DynamicBrake)',input_value:{min:0.11,max:0.95,invert:true}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0), EngineRun, GeneratorField and ControlFuelPump (On 1 / Off 0) and CutOffPilotValve (Freight 1 / Cut-Out 0); the loco loads with all of them off. PARK BRK up = handle in, switches on, valve at Freight',assignments:[pair('ReverserHandle',1,0),pair('EngineRun',1,0),pair('GeneratorField',1,0),pair('ControlFuelPump',1,0),pair('CutOffPilotValve',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset push button, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sand push button)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn push button)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrake 0 while up, 0.25 when down; a spring, may need the cab)',assignments:[pair('IndependentBrake',0,0.25)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Alerter fuse (Fuse_WarningDevices Closed 1 / Open 0). Lit = closed; loads open','Fuse_WarningDevices',1,0),
 tog('RightAuxButton','Dynamic brake circuit breaker (DynamicBrakeCircuitBraker Closed 0 / Open 1). Lit = closed','DynamicBrakeCircuitBraker',0,1),
 tog('RoundAuxButton','Independent brake IndependentBrake: Full 1 / Release 0.25. Lit = applied','IndependentBrake',1,0.25),
 mom('RotaryCrank','Selector lever one step DOWN (SelectorLever -1 held about half a second, 0 on release): 4 .. 1, OFF, B','SelectorLever',-1,0),
 mom('RotaryIgnStart','Selector lever one step UP (SelectorLever 1 held about half a second, 0 on release): B, OFF, 1 .. 4','SelectorLever',1,0),
 {name:'AutoBrake0',description:'Lights | Dim (HeadlightDimmingSwitch 0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake1',description:'Lights | Medium front (0.75)',assignments:lights(0.75,0)},
 {name:'AutoBrake2',description:'Lights | Bright front (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Bright front and number lights',assignments:lights(1,1)},
 {name:'AutoBrake4',description:'Lights | Bright back (0, this end trailing)',assignments:lights(0,0)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-clinchfield-sd40-dtg-thejag',title:'SD40',eyebrow:'Clinchfield Railroad · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Clinchfield Railroad: Elkhorn City – Dante',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',schematicHeight:540,cab:{file:'../../assets/clinchfield-sd40-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'26L brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Initial','Release'],start:3},
 flap:{name:'Dynamic brake',continuous:true,notches:['100 %',null,null,null,'Off'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Dim'},{short:'LO',desc:'Medium'},{short:'2',desc:'Bright'},{short:'3',desc:'+ number'},{short:'HI',desc:'Bright back'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Alerter fuse'}, rightAux:{name:'Dyn. brake breaker'},
 modeSwitch:{name:'Selector (hold ½ s)',left:'down',right:'up'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · switches · valve',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, engine run / generator field / control switches on, cut-off pilot valve at Freight (the loco loads with all of them off); MU-2A valve to Lead in the cab','Reverser from Neutral to Forward; alerter fuse closed and dynamic brake breaker closed (aux squares lit)','Selector: hold the mode switch right about half a second per step, OFF to 1 (the throttle is dead in OFF)','Lights to Bright front','Independent applied (round aux lit), 26L brake at Full service (parked); throttle Idle'],
depart:['Check the signal; bell on (ENG 1)','26L brake to Release; round aux out to release the independent, ENG 2 up to bail off','Throttle notch by notch; selector up to 2, 3, 4 as the speed rises','Reset the alerter with the gear lever','Dynamic braking: throttle to Idle, selector down past OFF to B (reverser locked in B), flap lever for the strength; 26L into the service zone for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-clinchfield-sd40-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
