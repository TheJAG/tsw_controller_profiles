// Amtrak Acela (DTG "Amtrak's Acela" pack, Boston – Providence), 2026-10-12. US layout from the ACS-64. One cab per power car, plain node
// names; IS_GetActiveCab false/false. Capture: ThrottleLever (Throttle) Off 0 / Ready 0.095 / effort continuous 0.11..1 (Max Effort at
// 0.995+); CruiseControlLever (CruiseControlAdjust) Off 0 / Slow 0.095 / mph continuous 0.11..1 (the SLOW handle beside READY on the left
// quadrant); AutomaticBrakeLever Release 0 / Minimum 0.1 / Service continuous 0.125..0.36 / Suppression 0.4 (0.3625..0.4375) / Full Service
// 0.7 / Handle Off 0.8 / Emergency 1 (loads 0.7; EM far, REL nearest in the cab); ReverserLever Reverse 0 / Neutral 0.5 / Forward 1; no
// independent brake and no dynamic lever. Key ReverserHandleLever (MasterSwitch lever, Off 0 / Neutral 0.851) and CabActivateButton.
// AcknowledgeLever (Alerter, ±1), BellButton, SandButton, HornLever (spring, High 1), PantographUp/DownButton, ACSES_CutOutSwitch 0 / 0.851,
// ATC_CutOutSwitch 0 / 0.878, AlerterCutOutSwitch 0 / 0.852 (all load cut out), ParkingBrakeSwitch Release 0 / Apply 0.844, WiperSwitch
// Intermittent 0 / Off 0.333 / Low 0.667 / High 1, FrontHeadlightSwitch Off 0 / Dim 0.5 / Full 1, DitchLightSwitch Off / Automatic / Flash /
// On at thirds. Door nodes carry no values (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679630';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/^RVM_BPE_AMTK_Acela_/.test(n)&&!/_Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,d)=>[set('FrontHeadlightSwitch',h),set('DitchLightSwitch',d)];
const th4=[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}];
p.controls=[
 {name:'SpeedbrakeLever',description:'ReverserLever (Reverse 0 / Neutral 0.5 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up)',assignments:[{type:'direct_control',controls:'ReverserLever',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle ThrottleLever (Off 0 / Ready 0.095 / effort continuous 0.11..1), inverted: Max effort at the far end (raw 0 ±0.04), effort zone 0.045..0.86, Ready 0.9 ±0.03, Off 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'ThrottleLever',input_value:{min:0,max:1,steps:[0,0.095,null,1],invert:true,step_thresholds:th4}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrakeLever (Release 0 / Minimum 0.1 / Service continuous 0.125..0.36 / Suppression 0.4 / Full Service 0.7 / Handle Off 0.8 / Emergency 1), inverted as in the cab: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Full Service 0.2 ±0.04, Suppression 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrakeLever',input_value:{min:0,max:1,steps:[0,0.1,null,0.4,0.7,0.8,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Cruise control CruiseControlLever (Off 0 / Slow 0.095 / set speed continuous 0.11..1), inverted: full speed at the far end, Slow 0.9 ±0.03, Off nearest',assignments:[{type:'direct_control',controls:'CruiseControlLever',input_value:{min:0,max:1,steps:[0,0.095,null,1],invert:true,step_thresholds:th4}}]},
 {name:'ParkingBrake',description:'Desk on: ReverserHandleLever (MasterSwitch, Neutral 0.851 / Off 0) and CabActivateButton pressed 1 / 0. PARK BRK up = handle in, cab active',assignments:[pair('ReverserHandleLever',0.851,0),pair('CabActivateButton',1,0)]},
 mom('GearLever','Alerter / ACSES acknowledge (AcknowledgeLever 1, held)','AcknowledgeLever',1,0),
 mom('LeftThrottleButton','Sand (SandButton)','SandButton',1,0),
 mom('RightThrottleButton','Horn high (HornLever 1, back to 0)','HornLever',1,0),
 {name:'LeftEngineOn',description:'Bell (BellButton On 1 while up, 0 when down)',assignments:[pair('BellButton',1,0)]},
 {name:'RightEngineOn',description:'Pantograph: up presses PantographUpButton, down presses PantographDownButton',assignments:[pair('PantographUpButton',1,0),pair('PantographDownButton',0,1)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling: ACSES_CutOutSwitch (Cut-In 0.851 / Cut-Out 0) and ATC_CutOutSwitch (0.878 / 0). Lit = both cut in; the train loads with them cut out',assignments:[togA('ACSES_CutOutSwitch',0.851,0),togA('ATC_CutOutSwitch',0.878,0)]},
 tog('RightAuxButton','Alerter (AlerterCutOutSwitch Cut-In 0.852 / Cut-Out 0). Lit = cut in; loads cut out','AlerterCutOutSwitch',0.852,0),
 tog('RoundAuxButton','Parking brake (ParkingBrakeSwitch Apply 0.844 / Release 0). Lit = applied','ParkingBrakeSwitch',0.844,0),
 {name:'RotaryCrank',description:'Wipers off (WiperSwitch 0.333)',assignments:[set('WiperSwitch',0.333)]},
 {name:'RotaryIgnStart',description:'Wipers low (WiperSwitch 0.667)',assignments:[set('WiperSwitch',0.667)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Headlight dim (FrontHeadlightSwitch 0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Headlight full (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Full and ditch lights on (DitchLightSwitch 1)',assignments:lights(1,1)},
 {name:'AutoBrake4',description:'Lights | Full and ditch lights flashing (DitchLightSwitch 0.667)',assignments:lights(1,0.667)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-amtrak-acela-dtg-thejag',title:'Acela',eyebrow:'Amtrak · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Northeast Corridor: Boston – Providence',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-acela-slate.svg',alt:'Amtrak Acela'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/amtrak-acela-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',continuous:true,notches:['Max',null,'Ready','Off'],start:3},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Full service','Suppression',null,'Minimum','Release'],start:2},
 flap:{name:'Cruise control',continuous:true,notches:['Max',null,'Slow','Off'],start:3},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Full'},{short:'3',desc:'+ ditch'},{short:'HI',desc:'Ditch flash'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Pantograph',start:true},
 leftAux:{name:'ACSES · ATC'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wipers',left:'off',right:'low'}, roundAux:{name:'Parking brake'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle + cab',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, cab activated; pantograph up (ENG 2)','Reverser from Neutral to Forward','ACSES / ATC and alerter cut in (aux squares lit); the train loads with them cut out','Lights to Full, ditch lights on','Automatic brake at Full service (parked), throttle Off, cruise Off'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release','Throttle to Ready, then into the effort zone; cruise control on the flap lever if wanted','Acknowledge the alerter and cab signals with the gear lever','Brake: throttle to Ready, automatic brake into the service zone, Suppression for a penalty; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-amtrak-acela-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
