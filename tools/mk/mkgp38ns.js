// Norfolk Southern EMD GP38-2 (DTG, Horseshoe Curve), 2026-10-13. Derived from mkgp38csx.js: the same AAR stand and node names. One cab,
// plain node names, IS_GetActiveCab fails. Capture agent probe: Throttle Idle 0 / N1..N8 at k/8; Reverser -1 / 0 / 1, free (ReverserHandle
// reads 0 and does not lock it); AutomaticBrake 26L Release 0 / Initial 0.125 / service 0.2..0.6 / Full Service 0.65 / Suppression 0.7 /
// Handle Off 0.85 / Emergency 1 (loads 0.85); IndependentBrake Release 0.25 / continuous 0.26..1, below 0.25 a bail-off spring;
// DynamicBrake Off 0 / Setup 0.14 / continuous 0.26..1, LOCKED in Neutral; throttle and dynamic lock each other out. Loads as a TRAILING
// unit: EngineRun, GenField, ControlFuelP Off 0, BrakeCutoutValve Cut-Out 0 (Freight 0.5 / Passenger 1), MU-2A_Valve Trail 1 (Lead 0),
// Fuse_WarningDevices 0. FrontHeadlight / RearHeadlight Off 0 / Dim 0.333 / Medium 0.667 / Bright 1; DitchLightEnabledControl Off 0 / On 0.5 /
// Flash 1; WiperValve_FL without named values.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679280';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_HSC_NS_GP38-2_C','RVM_HSC_NS_GP38-2_EOTD_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('FrontHeadlight',fr),set('RearHeadlight',re)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up); the dynamic brake only moves out of Neutral',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 (step values on the stored positions), inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Initial reduction 0.125 / service continuous 0.2..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.85 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.125,null,0.65,0.7,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Dynamic brake DynamicBrake (Off 0 / Setup 0.14 / continuous 0.26..1 = 1..8), inverted: full dynamic at the far end (raw 0 ±0.04), zone 0.045..0.86, Set Up 0.9 ±0.03, Off 1 ±0.06 nearest. Locked while the reverser is in Neutral',assignments:[{type:'direct_control',controls:'DynamicBrake',input_value:{min:0,max:1,steps:[0,0.14,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Lead set-up: ReverserHandle (MasterSwitch In 1 / Out 0), EngineRun, GenField and ControlFuelP (On 1 / Off 0), BrakeCutoutValve (Freight 0.5 / Cut-Out 0) and MU-2A_Valve (Lead 0 / Trail 1); the loco loads as a trailing unit with all of them off. PARK BRK up = lead unit, switches on, brake valve cut in',assignments:[pair('ReverserHandle',1,0),pair('EngineRun',1,0),pair('GenField',1,0),pair('ControlFuelP',1,0),pair('BrakeCutoutValve',0.5,0),pair('MU-2A_Valve',0,1)]},
 mom('GearLever','Alerter reset (AlerterReset push button, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sand push button)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn push button)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrake 0 while up, 0.25 when down; the zone below 0.25 is a spring, may need the cab)',assignments:[pair('IndependentBrake',0,0.25)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Alerter fuse (Fuse_WarningDevices On 1 / Off 0). Lit = on; loads off','Fuse_WarningDevices',1,0),
 tog('RightAuxButton','Ditch lights (DitchLightEnabledControl On 0.5 / Off 0). Lit = on','DitchLightEnabledControl',0.5,0),
 tog('RoundAuxButton','Independent brake IndependentBrake: Full 1 / Release 0.25. Lit = applied; loads applied','IndependentBrake',1,0.25),
 {name:'RotaryCrank',description:'Wipers off (WiperValve_FR 0)',assignments:[set('WiperValve_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperValve_FR 0.5; the lever has no named values)',assignments:[set('WiperValve_FR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (FrontHeadlight 0.333)',assignments:lights(0.333,0)},
 {name:'AutoBrake2',description:'Lights | Front medium (0.667)',assignments:lights(0.667,0)},
 {name:'AutoBrake3',description:'Lights | Front bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Front bright, rear dim (RearHeadlight 0.333)',assignments:lights(1,0.333)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-ns-gp38-2-dtg-thejag',title:'GP38-2',eyebrow:'Norfolk Southern · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Horseshoe Curve: Altoona – Johnstown & South Fork',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/ns-gp38-2-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Initial','Release'],start:3},
 flap:{name:'Dynamic brake',continuous:true,notches:['8',null,'Setup','Off'],start:3},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Medium'},{short:'3',desc:'Bright'},{short:'HI',desc:'+ rear dim'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Alerter fuse'}, rightAux:{name:'Ditch lights'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Lead set-up',flat:'trail',up:'lead'}},
setup:['PARK BRK up: lead set-up (reverser handle in, engine run / generator field / control switches on, brake valve to Freight, MU-2A valve to Lead; the loco loads as a trailing unit)','Reverser from Neutral to Forward; alerter fuse on and ditch lights on (aux squares lit)','Lights to Bright','Independent applied (round aux lit), automatic brake at Full service (parked); throttle Idle, dynamic Off'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; round aux out to release the independent, ENG 2 up to bail off','Throttle notch by notch; keep the dynamic brake Off while powering','Reset the alerter with the gear lever','Brake: throttle to Idle, dynamic brake past Set up into the zone; automatic brake into the service zone for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-ns-gp38-2-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
