// MBTA Rotem CTC-5 bi-level cab car (DTG, Boston – Providence / Boston – Worcester), 2026-10-13. Derived from mkmbtacab.js. Tile "Rotem CTC-5
// MBTA" (Boston - Providence Timetable, row 3 col 1); the Providence service loads the Worcester class. One desk, plain node names,
// IS_GetActiveCab false/false. Capture agent probe: Reverser Reverse 0 / Neutral 0.33 / Forward 0.66 / Key Out 1 (loads Key Out);
// MasterController (Throttle) Idle 0 / N1..N8 at k/8; AutomaticBrake (26C) the CTC-3 bands, ONE GATE PER SET from Handle Off (ramps through);
// IndependentBrake Released 0..0.10 / continuous 0.11..1 (no bail-off). ONE-WAY LAG: after the throttle returns to Idle the reverser refuses
// every set until a second, different throttle set at Idle (0.01); no lock the other way. So only the throttle is doubled. No dynamic lever,
// no MasterSwitch. Fuse_ACSES / Fuse_ATC (PTC isolation) and Fuse_Alerter push buttons load 0; BrakeCut-InButton / BrakeCut-OutButton
// (AirBrakeCutIn); Headlights Off 0 / Dim 0.33 / Bright and Aux 0.66 / Marker Light 1 (loads 0.66); WindshieldWiperControl / _L Off 0 / Long
// 0.25 / Short 0.5 / Low 0.75 / High 1. TrapDoor_FR refuses sets after the sweep (cosmetic).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679270';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.name='TSW | MBTA bi-level cab car | DTG | TheJAG';
p.rail_class_information=['RVM_BOW_MBTA_DoubleDeckCars_CabCar_C','RVM_BPE_MBTA_DoubleDeckCars_CabCar_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h)=>[set('Headlights',h)];
const press=(node)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:1,hold:false},action_deactivate:{controls:node,value:0,hold:false}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.33 / Forward 0.66; Key Out 1 is on PARK BRK), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:0.66,steps:[0,0.33,0.66],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle MasterController Idle / notches 1..8 at k/8, inverted: notch 8 at the far end, Idle nearest. Each change is sent twice (notch, then notch ±0.01, which snaps back) to free the lagging reverser interlock',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}},{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0.01,0.135,0.26,0.385,0.51,0.635,0.76,0.885,0.99],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Minimum 0.125 / service continuous 0.2..0.64 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.85 / Emergency 1; one gate per API set from Handle Off), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.125,null,0.65,0.7,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Released 0 / continuous 0.11..1), inverted: Full at the far end, Released nearest',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Reverser key: PARK BRK up = Reverser Neutral 0.33 (key in) and a press of BrakeCut-InButton; flat = Key Out 1 (throttle at Idle)',assignments:[pair('Reverser',0.33,1),press('BrakeCut-InButton')]},
 mom('GearLever','Alerter acknowledge (Acknowledge(SDU), held)','Acknowledge(SDU)',1,0),
 mom('LeftThrottleButton','Sand (CarSand push button, held)','CarSand',1,0),
 mom('RightThrottleButton','Horn (Horn push button, held)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 mom('RightEngineOn','Cab signal / ACSES acknowledge (CabSignalACSESAcknowledge, held while up)','CabSignalACSESAcknowledge',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling: Fuse_ACSES and Fuse_ATC (On 1 / Off 0). Lit = on; both load off',assignments:[togA('Fuse_ACSES',1,0),togA('Fuse_ATC',1,0)]},
 tog('RightAuxButton','Alerter fuse (Fuse_Alerter On 1 / Off 0). Lit = on; loads off','Fuse_Alerter',1,0),
 {name:'RotaryCrank',description:'Wipers off (WindshieldWiperControl / _L 0)',assignments:[set('WindshieldWiperControl',0),set('WindshieldWiperControl_L',0)]},
 {name:'RotaryIgnStart',description:'Wipers low (WindshieldWiperControl / _L 0.75)',assignments:[set('WindshieldWiperControl',0.75),set('WindshieldWiperControl_L',0.75)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0)},
 {name:'AutoBrake1',description:'Lights | Dim (Headlights 0.33)',assignments:lights(0.33)},
 {name:'AutoBrake2',description:'Lights | Bright and aux (0.66)',assignments:lights(0.66)},
 {name:'AutoBrake3',description:'Lights | Marker light (1)',assignments:lights(1)},
 {name:'AutoBrake4',description:'Lights | Bright and aux (0.66)',assignments:lights(0.66)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-mbta-bilevel-cab-car-dtg-thejag',title:'CTC-5 bi-level cab car',eyebrow:'MBTA · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Northeast Corridor: Boston – Providence · Boston – Worcester',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-mbta-slate.svg',alt:'MBTA'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/mbta-bilevel-cab-car-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright + aux'},{short:'3',desc:'Marker'},{short:'HI',desc:'Bright + aux'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Cab signal ack.',start:true},
 leftAux:{name:'ACSES · ATC'}, rightAux:{name:'Alerter fuse'},
 modeSwitch:{name:'Wipers',left:'off',right:'low'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key',flat:'out',up:'in'}},
setup:['Throttle at Idle, then PARK BRK up: reverser key in (Neutral), brake cut in','ACSES / ATC and alerter fuses on (aux squares lit); lights to Bright + aux','Independent at Full, automatic brake at Full service (parked); reverser to Forward'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release (it ramps through its gates), independent to Release','Throttle notch by notch (the loco at the back follows)','Acknowledge the alerter with the gear lever, cab signals with ENG 2','Brake: throttle to Idle, automatic brake into the service zone; Emergency at the far end. No dynamic brake on the cab car']};
fs.writeFileSync('tools/manual/trains/tsw-mbta-bilevel-cab-car-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
