// Amtrak ACS-64 (DTG, Northeast Corridor New York – Trenton; also layered on Boston – Providence), 2026-10-12. FIRST US LAYOUT. Two cabs
// `_F` / `_B`, both GetActiveCab functions fail, F cab wired by name. Capture: MasterController_F (Throttle) is one combined throttle /
// dynamic-brake handle, continuous both sides: B Max -0.99 / dynamic zone -0.96..-0.07 / Idle 0 (±0.06) / throttle zone 0.07..0.96 / T Max
// 0.99; in the cab throttle is pushed away, dynamic brake pulled towards you. AutomaticBrake_F: Release 0 / Minimum 0.1 (0.05..0.125) /
// service continuous 0.125..0.395 (Suppression 0.275..0.30 inside it) / Full Service 0.395..0.6 / Handle Off 0.6..0.85 (snaps 0.8) /
// Emergency 1 (0.85+), loads 0.4. IndependentBrake_F Release 0.1 / continuous to 1 (Bail Off is a negative output, not measured).
// Reverser_F Reverse -1 / Neutral 0 / Forward 1 / Out 2 (loads Out). Key ReverserHandle_F (MasterSwitch, Out 0 / In 1). Acknowledge_F
// (Alerter), Bell_F (Bell), Horn_F push button (Horn), Sand_F spring lever (On at ±1), PantographUp_F / PantographDown_F, ACSES_Cutout_F /
// ATC_Cutout_F (SignallingSystems 0 / 1), Alerter_Cutout_F (WarningDevices), MCB_F (CircuitBreaker), Wiper_F thirds, FrontHeadlight_F
// Off 0 / Dim 0.5 / Bright 1, DitchLight_F Off 0 / On 0.5 / Flash 1. No passenger door nodes (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679660';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/ACS-?64/i.test(n)&&!/_Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,d)=>[set('FrontHeadlight_F',h),set('DitchLight_F',d)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser_F (Reverse -1 / Neutral 0 / Forward 1; Out 2 stays in the cab; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined throttle / dynamic brake MasterController_F -0.99..0.99 (B Max / dynamic continuous / Idle / throttle continuous / T Max), inverted as in the cab: T Max at the far end (raw 0 ±0.04), throttle zone 0.045..0.45, Idle 0.5 ±0.05, dynamic zone 0.55..0.955, B Max 1 ±0.04 nearest',assignments:[{type:'direct_control',controls:'MasterController_F',input_value:{min:-0.99,max:0.99,steps:[-0.99,null,0,null,0.99],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.55},{threshold:0.5,threshold_tolerance:0.05},{threshold:0.45,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake_F (Release 0 / Minimum 0.1 / service continuous 0.125..0.395 with Suppression at 0.29 / Full Service 0.5 / Handle Off 0.8 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Full Service 0.2 ±0.04, service zone 0.26..0.86 (full down to minimum), Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake_F',input_value:{min:0,max:1,steps:[0,0.1,null,0.5,0.8,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.26},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake_F (Release 0.1 / continuous to Full 1), inverted: Full at the far end, Release nearest',assignments:[{type:'direct_control',controls:'IndependentBrake_F',input_value:{min:0.1,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Reverser handle ReverserHandle_F (MasterSwitch: In 1 / Out 0): PARK BRK up = handle in, desk live',assignments:[pair('ReverserHandle_F',1,0)]},
 mom('GearLever','Alerter / ACSES acknowledge (Acknowledge_F push button, held)','Acknowledge_F',1,0),
 mom('LeftThrottleButton','Sand (Sand_F spring lever: 1 while held, 0 released)','Sand_F',1,0),
 mom('RightThrottleButton','Horn (Horn_F push button)','Horn_F',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell_F On 1 while up, Off 0 when down)',assignments:[pair('Bell_F',1,0)]},
 {name:'RightEngineOn',description:'Pantograph: up presses PantographUp_F, down presses PantographDown_F',assignments:[pair('PantographUp_F',1,0),pair('PantographDown_F',0,1)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling: ACSES_Cutout_F and ATC_Cutout_F (On 1 / Off 0). Lit = both on',assignments:[togA('ACSES_Cutout_F',1,0),togA('ATC_Cutout_F',1,0)]},
 tog('RightAuxButton','Alerter (Alerter_Cutout_F On 1 / Off 0). Lit = on','Alerter_Cutout_F',1,0),
 tog('RoundAuxButton','Main circuit breaker (MCB_F 1 / 0). Lit = closed','MCB_F',1,0),
 {name:'RotaryCrank',description:'Wipers off (Wiper_F 0)',assignments:[set('Wiper_F',0)]},
 {name:'RotaryIgnStart',description:'Wipers slow (Wiper_F 0.6667)',assignments:[set('Wiper_F',0.6667)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Headlight dim (FrontHeadlight_F 0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Headlight bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Bright and ditch lights on (DitchLight_F 0.5)',assignments:lights(1,0.5)},
 {name:'AutoBrake4',description:'Lights | Bright and ditch lights flashing (DitchLight_F 1)',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-amtrak-acs64-dtg-thejag',title:'ACS-64',eyebrow:'Amtrak · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Northeast Corridor: New York – Trenton',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-amtrak-slate.svg',alt:'Amtrak'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/amtrak-acs64-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle / dynamic',continuous:true,notches:['T max',null,'Idle',null,'B max'],start:2},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Full service',null,'Minimum','Release'],start:2},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ ditch'},{short:'HI',desc:'Ditch flash'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Pantograph',start:true},
 leftAux:{name:'ACSES · ATC'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wipers',left:'off',right:'slow'}, roundAux:{name:'MCB'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser handle',flat:'out',up:'in'}},
setup:['Reverser handle in (PARK BRK up); pantograph up (ENG 2), MCB closed (round aux)','Reverser from Neutral to Forward','ACSES / ATC and alerter on (aux squares lit)','Lights to Bright, ditch lights on','Independent at Full, automatic brake at Full service (parked); handle at Idle'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release, independent to Release','Handle away from you into the throttle zone','Acknowledge the alerter and cab signals with the gear lever','Brake: handle back through Idle into the dynamic zone, automatic brake into the service zone (Suppression sits mid-zone); Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-amtrak-acs64-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
