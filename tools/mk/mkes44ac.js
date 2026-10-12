// Norfolk Southern GE ES44AC (Skyhook Games for DTG, Horseshoe Curve), 2026-10-13. Derived from mkes44c4.js (GE desk, separate dynamic
// brake lever) with the AC4400CW lead set-up. Class ES44AC_RVM_C (not RVM_-prefixed, so tools/pak_classes.txt has no match). One cab, plain
// node names, IS_GetActiveCab fails. Capture agent probe: Throttle Idle 0 / N1..N8 at k/8 (snaps); DynamicBrake Off 0 / Setup 0.14 / step 1
// 0.26 / continuous 0.26..1 (output 1..8), LOCKED with the reverser in Neutral; AutomaticBrake Release 0 / Minimum 0.2 / service 0.21..0.6 /
// Full Service 0.65 / Suppression 0.7 / Handle Off 0.8 / Emergency 1 (loads 0.8); IndependentBrake Release 0.2 / continuous 0.25..1 (loads
// 0.2); AutoBrakeBailOff 0 / 1 HOLDS (not a spring); Reverser -1 / 0 / 1, free (ReverserHandle reads 0 and does not lock it). Loads as a
// TRAILING unit: BrakeCutoutValve 0 = Trail (Lead 1), MU-2A_Valve 1 = Trail (Lead 0), GeneratorField 0. Bell, Horn_R, Sand, AlerterReset,
// WarningDevices (PushButton) (loads 0), DynamicBrakeSwitch (loads 1), DitchLights push buttons; HeadlightsFront Off 0 / Dim 0.3 / Bright
// 0.6 / Bright Aux 1, HeadlightsBack Off 0 / Dim 0.4965 / Bright 1; WiperSwitch_FR without named values.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679280';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'ES44AC_RVM_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('HeadlightsFront',fr),set('HeadlightsBack',re)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end; the dynamic brake only moves out of Neutral',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 at k/8, inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Minimum 0.2 / service continuous 0.21..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.8 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.2,null,0.65,0.7,0.8,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Dynamic brake DynamicBrake (Off 0 / Setup 0.14 / continuous 0.26..1 = 1..8), inverted: full dynamic at the far end (raw 0 ±0.04), zone 0.045..0.86, Set Up 0.9 ±0.03, Off 1 ±0.06 nearest. Locked while the reverser is in Neutral',assignments:[{type:'direct_control',controls:'DynamicBrake',input_value:{min:0,max:1,steps:[0,0.14,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Lead set-up: BrakeCutoutValve (Lead 1 / Trail 0), MU-2A_Valve (Lead 0 / Trail 1) and GeneratorField (On 1 / Off 0); the loco loads as a trailing unit with the field off. PARK BRK up = lead unit, field on',assignments:[pair('BrakeCutoutValve',1,0),pair('MU-2A_Valve',0,1),pair('GeneratorField',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sand push button, held)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn_R push button, held)','Horn_R',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (AutoBrakeBailOff 1 while up, 0 when down; it holds)',assignments:[pair('AutoBrakeBailOff',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Warning devices (WarningDevices (PushButton) 1 / 0). Lit = on; loads off','WarningDevices (PushButton)',1,0),
 tog('RightAuxButton','Dynamic brake switch (DynamicBrakeSwitch 1 / 0). Lit = on; loads on','DynamicBrakeSwitch',1,0),
 tog('RoundAuxButton','Independent brake IndependentBrake: Full 1 / Release 0.2. Lit = applied; loads released','IndependentBrake',1,0.2),
 {name:'RotaryCrank',description:'Wipers off (WiperSwitch_FR 0)',assignments:[set('WiperSwitch_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperSwitch_FR 0.5; the lever has no named values)',assignments:[set('WiperSwitch_FR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (HeadlightsFront 0.3)',assignments:lights(0.3,0)},
 {name:'AutoBrake2',description:'Lights | Front bright (0.6)',assignments:lights(0.6,0)},
 {name:'AutoBrake3',description:'Lights | Front bright aux (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Front bright, rear dim (HeadlightsBack 0.4965)',assignments:lights(0.6,0.4965)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-ns-es44ac-skyhook-thejag',title:'ES44AC',eyebrow:'Norfolk Southern · Skyhook Games · TCA Quadrant Airbus',profileName:p.name,developer:'Skyhook Games',route:'Horseshoe Curve: Altoona – Johnstown & South Fork',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-skyhook-slate.png',alt:'Skyhook Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/ns-es44ac-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:{name:'Dynamic brake',continuous:true,notches:['8',null,'Set up','Off'],start:3},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'Bright aux'},{short:'HI',desc:'+ rear dim'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Warning devices'}, rightAux:{name:'Dyn. brake switch'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Lead set-up',flat:'trail',up:'lead'}},
setup:['PARK BRK up: brake cut-out and MU-2A valves to Lead, generator field on (the loco loads as a trailing unit with the field off)','Reverser from Neutral to Forward; warning devices and dynamic brake switch on (aux squares lit)','Lights to Bright','Independent applied (round aux lit; it loads released), automatic brake at Full service (parked); throttle Idle, dynamic Off'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; round aux out to release the independent, ENG 2 up to bail off','Throttle notch by notch; keep the dynamic brake Off while powering','Reset the alerter with the gear lever','Brake: throttle to Idle, dynamic brake past Set up into the zone; automatic brake into the service zone for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-ns-es44ac-skyhook-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
