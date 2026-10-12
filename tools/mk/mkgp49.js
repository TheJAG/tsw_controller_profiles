// Tri-Rail GP49PH-3 (EMD, DTG loco add-on "Tri-Rail GP49H-3", pak Tri-Rail-GP49PH, Florida Tri-Rail), 2026-10-13. Derived from
// mkgp38ns.js: EMD stand with a separate dynamic brake lever. One cab, plain node names; IS_GetActiveCab false/false. Capture agent probe:
// Reverser Reverse 0 / Neutral 0.5 / Forward 1, held in Neutral with ReverserHandle (MasterSwitch, In 1) Out, locked off Idle, no latch;
// Throttle Idle 0 / k/8, stays at Idle in Neutral and while the dynamic brake is out of Off; DynamicBrake Off 0 / Setup 0.16 / continuous
// 0.29..1 (1..8), moves only with the reverser out of Neutral and the throttle at Idle; AutomaticBrake 26L Release 0 / Initial 0.1 /
// service 0.125..0.625 / Full Service 0.65 / Suppression 0.75 / Handle Off 0.85 (loads) / Emergency 1; IndependentBrake Release 0 /
// continuous 0..1, bail-off spring below 0; IndependentBrake_BailOff push button. Loads cold: ReverserHandle Out, GenField 0,
// BrakeCutoutValve Off 0 (Freight 0.5 / Passenger 1), ATC_CutOutSwitch 0 (Cut-In 1), Fuse_SafetyDevices (alerter) 0; MU-2A_Valve loads Lead.
// FrontHeadlights / RearHeadlights Off 0 / Dim 0.333 / Medium 0.667 / Bright 1; CrossingLight push button; Horn, Bell, Sand, AlerterReset.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4714910';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_MPB_TR_GP49PH_C','RVM_MPB_TR_GP49PH_EOTD_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('FrontHeadlights',fr),set('RearHeadlights',re)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.5 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up) and the throttle at Idle; the dynamic brake only moves out of Neutral',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 at k/8, inverted: notch 8 at the far end (pushed away), Idle nearest. Stays at Idle in Neutral and while the dynamic brake is out of Off',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (26L: Release 0 / Initial reduction 0.1 / service continuous 0.125..0.625 / Full Service 0.65 / Suppression 0.75 / Handle Off 0.85 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.1,null,0.65,0.75,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Dynamic brake DynamicBrake (Off 0 / Setup 0.16 / continuous 0.29..1 = 1..8), inverted: full dynamic at the far end (raw 0 ±0.04), zone 0.045..0.86, Setup 0.9 ±0.03, Off 1 ±0.06 nearest. Moves only out of Neutral with the throttle at Idle',assignments:[{type:'direct_control',controls:'DynamicBrake',input_value:{min:0,max:1,steps:[0,0.16,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0), GenField (On 1 / Off 0) and BrakeCutoutValve (Passenger 1 / Off 0); the loco loads with all three off. PARK BRK up = handle in, field on, brake valve cut in',assignments:[pair('ReverserHandle',1,0),pair('GenField',1,0),pair('BrakeCutoutValve',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset push button, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sand push button)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn push button)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrake_BailOff push button 1 while up, 0 when down)',assignments:[pair('IndependentBrake_BailOff',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','ATC / PTC (ATC_CutOutSwitch Cut-In 1 / Cut-Out 0). Lit = cut in; loads cut out','ATC_CutOutSwitch',1,0),
 tog('RightAuxButton','Alerter fuse (Fuse_SafetyDevices On 1 / Off 0). Lit = on; loads off','Fuse_SafetyDevices',1,0),
 tog('RoundAuxButton','Independent brake IndependentBrake: Full 1 / Release 0. Lit = applied','IndependentBrake',1,0),
 {name:'RotaryCrank',description:'Wipers off (WiperValve_FR 0)',assignments:[set('WiperValve_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperValve_FR 0.5; the lever has no named values)',assignments:[set('WiperValve_FR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (FrontHeadlights 0.333)',assignments:lights(0.333,0)},
 {name:'AutoBrake2',description:'Lights | Front medium (0.667)',assignments:lights(0.667,0)},
 {name:'AutoBrake3',description:'Lights | Front bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Front bright, rear dim (RearHeadlights 0.333)',assignments:lights(1,0.333)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-trirail-gp49ph-dtg-thejag',title:'GP49PH-3',eyebrow:'Tri-Rail · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Florida Tri-Rail: Miami – Boca Raton',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-trirail-slate.svg',alt:'Tri-Rail'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/trirail-gp49ph-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Initial','Release'],start:3},
 flap:{name:'Dynamic brake',continuous:true,notches:['8',null,'Setup','Off'],start:3},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Medium'},{short:'3',desc:'Bright'},{short:'HI',desc:'+ rear dim'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'ATC · PTC'}, rightAux:{name:'Alerter fuse'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · field · valve',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, generator field on, brake valve to Passenger (all load off)','Reverser from Neutral to Forward at Idle','ATC / PTC and alerter fuse on (aux squares lit)','Lights to Bright','Independent applied (round aux lit), automatic brake at Full service (parked)'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; round aux out to release the independent, ENG 2 up to bail off','Throttle notch by notch; keep the dynamic brake Off while powering','Reset the alerter with the gear lever','Brake: throttle to Idle, dynamic brake past Set up into the zone; automatic brake into the service zone for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-trirail-gp49ph-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
