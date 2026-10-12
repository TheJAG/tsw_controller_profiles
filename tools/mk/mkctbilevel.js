// Caltrain Bombardier Bi-Level cab car (DTG, MP36PH-3C pack, Peninsula Corridor), 2026-10-13. Tile "Bi-Level Cab Car" on the Baby Bullet
// Timetable. One desk, plain node names, IS_GetActiveCab fails. Capture agent probe: PowerHandle (Throttle, -1..1, 18 notches, loads Idle 0.2)
// one combined handle: B8 -1 / B7 -0.9083 / B6 -0.8167 / B5 -0.725 / B4 -0.6333 / B3 -0.5416 / B2 -0.45 / B1 -0.3583 / Setup -0.2666 /
// Idle 0.2 / P1 0.33 / P2 0.42 / P3 0.52 / P4 0.62 / P5 0.72 / P6 0.82 / P7 0.92 / P8 1; Idle->P1, Idle->Setup and Setup->B1 are gates (one
// set each). Reverser Reverse 0 / Neutral 0.5 / Forward 1. AutomaticBrake Release 0 / Initial Reduction 0.125 / service 0.2..0.6 / Full
// Service 0.65 / Suppression 0.7 / Handle Off 0.85 / Emergency 1, free. INTERLOCK: ReverserHandle (MasterSwitch push button, loads 0) frees
// the reverser and the power handle only on a PRESS (1 then 0); any reverser move locks the power handle again, so the order is press,
// reverser, press, power. The press sits on the gear lever (a momentary: up 1, release 0). Loads cold: CabSetupKey, AutomaticBrakeCutInOut,
// FuelPump, GeneratorField, EngineRun_Switch, TMS_Breaker (WarningDevices), PCS_Breaker all 0. Headlights Bright and Aux -0.58 / Off 0 / Dim
// and Aux 0.42 / Dim 0.9. No independent, separate dynamic lever or bail-off.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679010';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.name='TSW | Caltrain Bi-Level cab car | DTG | TheJAG';
p.rail_class_information=[{class_name:'RVM_SFJ_CT_BiLevelCoach_CabCar_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h)=>[set('Headlights',h)];
const ph=[-1,-0.9083,-0.8167,-0.725,-0.6333,-0.5416,-0.45,-0.3583,-0.2666,0.2,0.33,0.42,0.52,0.62,0.72,0.82,0.92,1];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.5 / Forward 1), inverted: Forward at the far end. Press the gear lever before moving it (ReverserHandle interlock)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined handle PowerHandle (B8 -1 .. B1 -0.3583 / Setup -0.2666 / Idle 0.2 / P1 0.33 .. P8 1, 18 notches on the stored positions), inverted: P8 at the far end, B8 nearest. Locked after every reverser move until the gear lever is pressed',assignments:[{type:'direct_control',controls:'PowerHandle',input_value:{min:-1,max:1,steps:ph,invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Initial reduction 0.125 / service continuous 0.2..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.85 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Initial 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.125,null,0.65,0.7,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Cab set-up: CabSetupKey, AutomaticBrakeCutInOut, FuelPump, GeneratorField, EngineRun_Switch, TMS_Breaker and PCS_Breaker (1 / 0); the car loads with all of them off. PARK BRK up = desk live',assignments:['CabSetupKey','AutomaticBrakeCutInOut','FuelPump','GeneratorField','EngineRun_Switch','TMS_Breaker','PCS_Breaker'].map(n=>pair(n,1,0))},
 mom('GearLever','Reverser handle press (ReverserHandle 1 while up, 0 on release): frees the reverser and the power handle; press before and after each reverser move','ReverserHandle',1,0,false),
 mom('LeftThrottleButton','Sand (Sander push button, held)','Sander',1,0),
 mom('RightThrottleButton','Horn (Horn push button, held)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 mom('RightEngineOn','Alerter reset (TMSReset, held while up)','TMSReset',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Electro-pneumatic brake (ElectroPneumaticBrake 1 / 0). Lit = on; loads on','ElectroPneumaticBrake',1,0),
 tog('RightAuxButton','Strobe lights (StrobeLight_Breaker 1 / 0). Lit = on; loads off','StrobeLight_Breaker',1,0),
 tog('RoundAuxButton','Parking brake (ParkingBrake push button 1 / 0). Lit = applied','ParkingBrake',1,0),
 {name:'RotaryCrank',description:'Wipers off (WiperSwitch_L / _R 0)',assignments:[set('WiperSwitch_L',0),set('WiperSwitch_R',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperSwitch_L / _R 0.5; no named values)',assignments:[set('WiperSwitch_L',0.5),set('WiperSwitch_R',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0)},
 {name:'AutoBrake1',description:'Lights | Dim (Headlights 0.9)',assignments:lights(0.9)},
 {name:'AutoBrake2',description:'Lights | Dim and auxiliary (0.42)',assignments:lights(0.42)},
 {name:'AutoBrake3',description:'Lights | Bright and auxiliary (-0.58)',assignments:lights(-0.58)},
 {name:'AutoBrake4',description:'Lights | Bright and auxiliary (-0.58)',assignments:lights(-0.58)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-caltrain-bilevel-cab-car-dtg-thejag',title:'Bi-Level cab car',eyebrow:'Caltrain · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Peninsula Corridor: San Francisco – San Jose',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-caltrain-slate.svg',alt:'Caltrain'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/caltrain-bilevel-cab-car-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Power / dynamic',notches:['P8',null,null,null,'P4',null,null,null,'Idle',null,null,null,null,'B4',null,null,null,'B8'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Initial','Release'],start:3},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Reverser handle'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Dim + aux'},{short:'3',desc:'Bright + aux'},{short:'HI',desc:'Bright + aux'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Alerter reset',start:true},
 leftAux:{name:'EP brake'}, rightAux:{name:'Strobes'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Parking brake'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Cab set-up',flat:'off',up:'on'}},
setup:['PARK BRK up: cab set-up key, brake cut-in, fuel pump, generator field, engine run, alerter and PCS breakers on (the car loads with all of them off)','Lights to Dim + aux; parking brake off (round aux)','Handle at Idle, automatic brake at Full service (parked)','Gear lever (reverser handle press), reverser to Forward, gear lever again: the power handle is now free'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release','Handle away from you through Idle into P1..P8 (one notch at a time through the gates)','Reset the alerter with ENG 2','Brake: handle back through Idle and Setup into B1..B8, automatic brake into the service zone; Emergency at the far end. After any reverser move press the gear lever before powering']};
fs.writeFileSync('tools/manual/trains/tsw-caltrain-bilevel-cab-car-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
