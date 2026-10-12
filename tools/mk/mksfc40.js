// Santa Fe GE C40-8W (DTG, "Santa Fe on Cajon Pass" pack on the Cajon Pass route), 2026-10-13. Derived from mkc40.js: the CSX C40-8W
// desk with the same node names and values (capture agent probe): ThrottleAndBrake -1..1 Idle 0.12 / N1..N8 at 0.23..1.0, dynamic side
// locked in Neutral, Set-up -0.2 / continuous -0.3..-1 in Forward; AutomaticBrake Release 0 / Minimum 0.2 / service 0.21..0.6 / Full Service
// 0.65 / Suppression 0.7 / Handle Off 0.8 / Emergency 1; IndependentBrake Release 0.2 / 0.25..1; AutoBrakeBailOff 0 / 1 holds; Reverser
// -1 / 0 / 1. Loads as a trailing unit (BrakeCutoutValve Cut Out 1, MU-2A_Valve Trail 1) but with GeneratorField already ON (CSX: off).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680600';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_CJP_ATSF_C40-8W_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('Headlight_F',fr),set('Headlight_B',re)];
// raw-axis bands, far end (raw 0) = N8 .. Idle at 0.5 .. B8 nearest (raw 1)
const thCombined=[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.68},{threshold:0.64,threshold_tolerance:0.03},{threshold:0.58,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.04},{threshold:0.42,threshold_tolerance:0.025},{threshold:0.36,threshold_tolerance:0.025},{threshold:0.3,threshold_tolerance:0.025},{threshold:0.24,threshold_tolerance:0.025},{threshold:0.18,threshold_tolerance:0.025},{threshold:0.12,threshold_tolerance:0.025},{threshold:0.06,threshold_tolerance:0.025},{threshold:0,threshold_tolerance:0.03}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. The dynamic side of the handle only moves out of Neutral',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined throttle / dynamic handle ThrottleAndBrake -1..1 (B8 -1 / dynamic continuous to B1 -0.3 / Set-up -0.2 / Idle 0.12 / N1..N8 at 0.23..1.0), inverted: N8 at the far end (raw 0), notches every 0.06 down to N1 at 0.42, Idle 0.5 ±0.04, Set-up 0.58, B1 0.64, dynamic zone 0.68..0.955, B8 1 nearest',assignments:[{type:'direct_control',controls:'ThrottleAndBrake',input_value:{min:-1,max:1,steps:[-1,null,-0.3,-0.2,0.12,0.23,0.34,0.45,0.56,0.67,0.78,0.89,1],invert:true,step_thresholds:thCombined}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Minimum 0.2 / service continuous 0.21..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.8 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1, Suppression 0.2, Full Service 0.3, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.2,null,0.65,0.7,0.8,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Release 0.25 / continuous to 1), inverted: Full at the far end, Release nearest',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0.25,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Lead set-up: BrakeCutoutValve (Freight 0.5 / Cut Out 1), MU-2A_Valve (Lead 0 / Trail 1) and GeneratorField (On 1 / Off 0); the loco loads with the valve cut out (the field loads on here). PARK BRK up = lead unit, field on. There is no key node',assignments:[pair('BrakeCutoutValve',0.5,1),pair('MU-2A_Valve',0,1),pair('GeneratorField',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset push button, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sand push button)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn_R push button)','Horn_R',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (AutoBrakeBailOff 1 while up, 0 when down)',assignments:[pair('AutoBrakeBailOff',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Warning devices (WarningDevices (PushButton) 1 / 0). Lit = on; loads off','WarningDevices (PushButton)',1,0),
 tog('RightAuxButton','Dynamic brake switch (DynamicBrakeSwitch 1 / 0). Lit = on; loads on','DynamicBrakeSwitch',1,0),
 tog('RoundAuxButton','Ditch lights (DitchLights 1 / 0). Lit = on','DitchLights',1,0),
 {name:'RotaryCrank',description:'Wipers off (WiperSwitch_FR 0)',assignments:[set('WiperSwitch_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperSwitch_FR 0.5; unnamed lever)',assignments:[set('WiperSwitch_FR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (Headlight_F 0.25)',assignments:lights(0.25,0)},
 {name:'AutoBrake2',description:'Lights | Front medium (0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake3',description:'Lights | Front bright (0.75)',assignments:lights(0.75,0)},
 {name:'AutoBrake4',description:'Lights | Front bright, rear dim (Headlight_B 0.33)',assignments:lights(0.75,0.33)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-santafe-c40-8w-dtg-thejag',title:'C40-8W',eyebrow:'Santa Fe · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Cajon Pass: Barstow – San Bernardino · Santa Fe in the 1990s',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-santafe-slate.svg',alt:'Santa Fe'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/santafe-c40-8w-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle / dynamic',notches:['N8','N7','N6','N5','N4','N3','N2','N1','Idle','Set-up','B1',null,'B8'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Medium'},{short:'3',desc:'Bright'},{short:'HI',desc:'+ rear dim'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Warning devices'}, rightAux:{name:'Dynamic brake'},
 modeSwitch:{name:'Wipers',left:'off',right:'slow'}, roundAux:{name:'Ditch lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Lead set-up · field',flat:'trail',up:'lead'}},
setup:['PARK BRK up: brake valve to Freight, MU-2A valve to Lead, generator field on (the loco loads cut out; no key)','Reverser from Neutral to Forward; warning devices and dynamic brake switch on (aux squares lit)','Lights to Bright, ditch lights on (round aux)','Independent at Full, automatic brake at Full service (parked); handle at Idle'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release, independent to Release (ENG 2 up to bail off)','Handle away from you: N1 … N8','Reset the alerter with the gear lever','Brake: handle back through Idle and Set-up into the dynamic zone; automatic brake into the service zone for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-santafe-c40-8w-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
