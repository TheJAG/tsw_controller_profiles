// Amtrak Amfleet cab car (DTG, Northeast Corridor New York – Trenton; also New York – Stamford), 2026-10-13. FIRST US CAB CAR. Pushed by an
// ACS-64; its desk is not the ACS-64's: no combined handle, no independent, no dynamic brake, no MasterSwitch. One desk, plain node names,
// IS_GetActiveCab fails. Capture agent probe: Throttle (output 0..8, GetNotchCount 0, stores as set) moves only with the reverser in
// Forward; output steps Off 0..0.095 / N1 0.10..0.255 / N2 ..0.37 / N3 ..0.485 / N4 ..0.595 / N5 ..0.71 / N6 ..0.825 / N7 ..0.94 / N8 0.945..1.
// Reverser Reverse 0 / Neutral 0.33 / Forward 0.66 / Key Out 1 (zones 0..0.16 / ..0.49 / ..0.83 / 0.84..1; Key Out only at throttle Off,
// loads Key Out): the key is the reverser's own Key Out position. AutomaticBrake Release 0 / Minimum 0.15 / service continuous 0.2..0.45
// (Suppression inside it) / Full Service 0.5 / Handle Off 0.9 / Emergency 1 (loads 0.5). BrakeMode Lead (loads Lead), PantographControl
// Lower 0 / Normal 1, MCB (CircuitBreaker, loads closed), ATC_Cut-Out / ACSES_Cut-Out / Alerter_Cut-Out load 0, Headlights Bright 0 / Off 0.5
// / Dim 1 (loads Off), StrobeLights Red 0 / Auto 0.5 / White 1. Bell, Sand, Horn, Acknowledge push buttons.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679660';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.name='TSW | Amtrak Amfleet cab car | DTG | TheJAG';
p.rail_class_information=[{class_name:'RVM_NYT_AMTK_CabCar_C'},{class_name:'RVM_NYS_AMTK_CabCar_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,s)=>[set('Headlights',h),set('StrobeLights',s)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.33 / Forward 0.66; Key Out 1 is on PARK BRK), inverted: Forward at the far end. The throttle only moves in Forward',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:0.66,steps:[0,0.33,0.66],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Off / notches 1..8 (no detents in the game; step values in the middle of each output band: 0 / 0.18 / 0.315 / 0.43 / 0.54 / 0.655 / 0.77 / 0.885 / 0.97), inverted: notch 8 at the far end, Off nearest. Moves only with the reverser in Forward',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.18,0.315,0.43,0.54,0.655,0.77,0.885,0.97],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Minimum 0.15 / service continuous 0.2..0.45 / Full Service 0.5 / Handle Off 0.9 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Full Service 0.2 ±0.04, service zone 0.26..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.15,null,0.5,0.9,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.26},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Reverser key: PARK BRK up = Neutral 0.33 (key in), flat = Key Out 1 (only with the throttle at Off); BrakeMode to Lead 1 on the way up',assignments:[pair('Reverser',0.33,1),set('BrakeMode',1)]},
 mom('GearLever','Alerter / ACSES acknowledge (Acknowledge push button, held)','Acknowledge',1,0),
 mom('LeftThrottleButton','Sand (Sand push button, held)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn push button, held)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Pantograph on the loco (PantographControl Normal 1 while up, Lower 0 when down)',assignments:[pair('PantographControl',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling: ACSES_Cut-Out and ATC_Cut-Out (In 1 / Out 0). Lit = both in; load out',assignments:[togA('ACSES_Cut-Out',1,0),togA('ATC_Cut-Out',1,0)]},
 tog('RightAuxButton','Alerter (Alerter_Cut-Out 1 / 0). Lit = in; loads out','Alerter_Cut-Out',1,0),
 tog('RoundAuxButton','Main circuit breaker (MCB 1 / 0). Lit = closed; loads closed','MCB',1,0),
 {name:'RotaryCrank',description:'Wipers off (Wiper 0)',assignments:[set('Wiper',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (Wiper 0.66; no named values)',assignments:[set('Wiper',0.66)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0.5,0.5)},
 {name:'AutoBrake1',description:'Lights | Headlights dim (Headlights 1)',assignments:lights(1,0.5)},
 {name:'AutoBrake2',description:'Lights | Headlights bright (Headlights 0)',assignments:lights(0,0.5)},
 {name:'AutoBrake3',description:'Lights | Bright, strobes white (StrobeLights 1)',assignments:lights(0,1)},
 {name:'AutoBrake4',description:'Lights | Bright, strobes red (StrobeLights 0)',assignments:lights(0,0)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-amtrak-amfleet-cab-car-dtg-thejag',title:'Amfleet cab car',eyebrow:'Amtrak · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Northeast Corridor: New York – Trenton',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-amtrak-slate.svg',alt:'Amtrak'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/amtrak-cab-car-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Off'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Full service',null,'Minimum','Release'],start:2},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ strobes'},{short:'HI',desc:'Strobes red'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Pantograph',start:true},
 leftAux:{name:'ACSES · ATC'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'MCB'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key',flat:'out',up:'in'}},
setup:['Throttle at Off, then PARK BRK up: reverser key in (Neutral), brake mode Lead','Pantograph up (ENG 2), MCB closed (round aux lit)','ACSES / ATC and alerter in (aux squares lit); lights to Bright','Reverser to Forward (the throttle is dead in Neutral); automatic brake at Full service (parked)'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release','Throttle notch by notch (the ACS-64 at the back follows)','Acknowledge the alerter and cab signals with the gear lever','Brake: throttle to Off, automatic brake into the service zone; Emergency at the far end. No independent or dynamic brake on the cab car']};
fs.writeFileSync('tools/manual/trains/tsw-amtrak-amfleet-cab-car-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
