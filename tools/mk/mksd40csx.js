// CSX EMD SD40-2 (DTG, Sand Patch Grade, class RVM_SD40-2_YN2), 2026-10-12. Derived from mkgp38csx.js: identical levers (Throttle k/8,
// DynamicBrake Off 0 / Setup 0.14 / 0.26 = 1 / continuous to 1, locked in Neutral; 26L with Handle Off 0.9; IndependentBrake Release 0.25
// with the spring bail-off zone below; Reverser -1 / 0 / 1; ReverserHandle push-button key). Differences: the brake cut-off is
// CutOffPilotValve Cut-Out 0 / Freight 1 / Passenger 2, the field switch is GeneratorField, headlights Headlight_F / _B Off 0 / Dim 0.2 /
// Medium 0.6 / Bright 1, a Banking push button (helper mode) exists. Reached through the SD40-2 ATSF tile with the YN2 layer button.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679430';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_SD40-2_YN2_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('Headlight_F',fr),set('Headlight_B',re)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up); the dynamic brake only moves out of Neutral',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 (step values on the stored positions), inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Initial reduction 0.125 / service continuous 0.2..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.9 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.125,null,0.65,0.7,0.9,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Dynamic brake DynamicBrake (Off 0 / Setup 0.14 / continuous 0.26..1 = 1..8), inverted: full dynamic at the far end (raw 0 ±0.04), zone 0.045..0.86, Set Up 0.9 ±0.03, Off 1 ±0.06 nearest. Locked while the reverser is in Neutral',assignments:[{type:'direct_control',controls:'DynamicBrake',input_value:{min:0,max:1,steps:[0,0.14,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0), GeneratorField (On 1 / Off 0) and CutOffPilotValve (Freight 1 / Cut-Out 0); the loco loads with all three off. PARK BRK up = handle in, field on, brake valve cut in',assignments:[pair('ReverserHandle',1,0),pair('GeneratorField',1,0),pair('CutOffPilotValve',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset push button, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sand push button)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn push button)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrake 0 while up, 0.25 when down; the zone below 0.25 is a spring, may need the cab)',assignments:[pair('IndependentBrake',0,0.25)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Alerter fuse (Fuse_WarningDevices On 1 / Off 0). Lit = on; loads off','Fuse_WarningDevices',1,0),
 tog('RightAuxButton','Ditch lights (DitchLights 1 / 0). Lit = on','DitchLights',1,0),
 tog('RoundAuxButton','Independent brake IndependentBrake: Full 1 / Release 0.25. Lit = applied; loads applied','IndependentBrake',1,0.25),
 {name:'RotaryCrank',description:'Wipers off (WiperSpeed_FR 0)',assignments:[set('WiperSpeed_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperSpeed_FR 0.5; the lever has no named values)',assignments:[set('WiperSpeed_FR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (Headlight_F 0.2)',assignments:lights(0.2,0)},
 {name:'AutoBrake2',description:'Lights | Front medium (0.6)',assignments:lights(0.6,0)},
 {name:'AutoBrake3',description:'Lights | Front bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Front bright, rear dim (Headlight_B 0.2)',assignments:lights(1,0.2)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-csx-sd40-2-dtg-thejag',title:'SD40-2',eyebrow:'CSX · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Sand Patch Grade: Cumberland – Rockwood',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-csx-slate.svg',alt:'CSX'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/csx-sd40-2-dtg-cab.jpg',height:196,position:'50% 50%'},
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
 parkBrk:{name:'Handle · field · valve',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, generator field on, brake valve cut in to Freight (the loco loads with them off); MU-2A valve to Lead in the cab','Reverser from Neutral to Forward; alerter fuse on and ditch lights on (aux squares lit)','Lights to Bright','Independent applied (round aux lit), automatic brake at Full service (parked); throttle Idle, dynamic Off'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; round aux out to release the independent, ENG 2 up to bail off','Throttle notch by notch; keep the dynamic brake Off while powering','Reset the alerter with the gear lever','Brake: throttle to Idle, dynamic brake past Set up into the zone; automatic brake into the service zone for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-csx-sd40-2-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
