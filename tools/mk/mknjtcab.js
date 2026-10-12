// NJ Transit Multi-Level (Bi-Level) cab car (DTG, Northeast Corridor New York – Trenton; also the US content pack class), 2026-10-13.
// Pushed by an ALP-46; tile "Multi-Level Commuter Cab Car NJT". One desk, plain node names, IS_GetActiveCab false/false. Clean sweep, probed
// values: MasterController (Throttle, -1..1) one combined handle in 0.1 steps, Full Brake -1 / B9 -0.9 .. B1 -0.1 / Idle 0 / P1 0.1 .. P9 0.9 /
// Full Power 1 (21 notches, output -10..10, not locked in Neutral). Reverser Isolated 0 / Reverse 0.33 / Neutral 0.66 / Forward 1 (loads
// Neutral). AutomaticBrake six detents as the ALP-46: Release 0 / Hold 0.2 / Lap 0.4 / Service 0.6 / Handle Off 0.8 / Emergency 1 (loads Lap).
// No independent, dynamic or bail-off node. ReverserHandle (MasterSwitch) loads In 1. AlerterCutOut Cut-Out 0 / Normal 0.895 and Fuse_ASES
// (PTC_ACSES_ASES_Isolation) load cut out. Acknowledge(SDU) (Alerter), UndercarBell (Bell), Horn IrregularLever rests 0.5, Sanding Local 0 /
// Off 0.5 / Loco 1, PantographRaise push button, Headlights Off 0 / Dim 0.5 / Bright 1, AuxiliaryLights Off 0 / Auto 0.5 / Manual 1,
// WiperRight Off 0 / Low 0.5 / High 1.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679660';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.name='TSW | NJ Transit Bi-Level cab car | DTG | TheJAG';
p.rail_class_information=[{class_name:'RVM_NYT_NJT_BiLevels_CabCar_C'},{class_name:'RVM_TTC_NJT_BiLevels_CabCar_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,d)=>[set('Headlights',h),set('AuxiliaryLights',d)];
const steps=[];for(let i=-10;i<=10;i++)steps.push(i/10);
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0.33 / Neutral 0.66 / Forward 1; Isolated 0 stays in the cab), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up) and the handle at Idle',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0.33,max:1,steps:[0.33,0.66,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined handle MasterController -1..1 in 0.1 steps (Full brake -1 / B9..B1 / Idle 0 / P1..P9 / Full power 1, 21 notches), inverted: Full power at the far end, Full brake nearest, Idle in the middle',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:-1,max:1,steps,invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Hold 0.2 / Lap 0.4 / Service 0.6 / Handle Off 0.8 / Emergency 1, all notches), inverted: Emergency at the far end, Release nearest, six even bands',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.2,0.4,0.6,0.8,1],invert:true}}]},
 {name:'ParkingBrake',description:'Reverser handle ReverserHandle (MasterSwitch push button: In 1 / 0): PARK BRK up = handle in (the car loads with it in)',assignments:[pair('ReverserHandle',1,0)]},
 mom('GearLever','Alerter acknowledge (Acknowledge(SDU) push button, held)','Acknowledge(SDU)',1,0),
 mom('LeftThrottleButton','Sand (Sanding lever: Loco 1 while held, Off 0.5)','Sanding',1,0.5),
 mom('RightThrottleButton','Horn (Horn lever: 1 while held, rest 0.5)','Horn',1,0.5),
 {name:'LeftEngineOn',description:'Bell (UndercarBell On 1 while up, 0 when down)',assignments:[pair('UndercarBell',1,0)]},
 mom('RightEngineOn','Pantograph raise on the loco (PantographRaise push button, held while up)','PantographRaise',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Cab signalling (Fuse_ASES On 1 / Off 0). Lit = on; loads off','Fuse_ASES',1,0),
 tog('RightAuxButton','Alerter (AlerterCutOut Normal 0.895 / Cut-Out 0). Lit = normal; loads cut out','AlerterCutOut',0.895,0),
 {name:'RotaryCrank',description:'Wipers off (WiperRight / WiperLeft 0)',assignments:[set('WiperRight',0),set('WiperLeft',0)]},
 {name:'RotaryIgnStart',description:'Wipers low (WiperRight / WiperLeft 0.5)',assignments:[set('WiperRight',0.5),set('WiperLeft',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Headlights dim (Headlights 0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Headlights bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Bright and auxiliary lights auto (AuxiliaryLights 0.5)',assignments:lights(1,0.5)},
 {name:'AutoBrake4',description:'Lights | Bright and auxiliary lights manual (1)',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-njt-bilevel-cab-car-dtg-thejag',title:'Multi-Level cab car',eyebrow:'NJ Transit · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Northeast Corridor: New York – Trenton',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-njtransit-slate.svg',alt:'NJ Transit'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/njt-bilevel-cab-car-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Power / brake',notches:['P max',null,'P8',null,'P6',null,'P4',null,'P2',null,'Idle',null,'B2',null,'B4',null,'B6',null,'B8',null,'B max'],start:10},
 rightThrottle:{name:'Automatic brake',notches:['Emergency','Handle off','Service','Lap','Hold','Release'],start:3},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ aux auto'},{short:'HI',desc:'Aux manual'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Pantograph up',start:true},
 leftAux:{name:'ACSES / ASES'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wipers',left:'off',right:'low'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser handle',flat:'out',up:'in'}},
setup:['Reverser handle in (PARK BRK up; the car loads with it in); pantograph up on the loco (ENG 2)','ACSES / ASES and alerter in (aux squares lit; both load cut out)','Lights to Bright','Handle at Idle, automatic brake at Lap or Service (parked); reverser from Neutral to Forward'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release','Handle away from you through Idle into P1..P max','Acknowledge the alerter with the gear lever','Brake: handle back through Idle into B1..B max (the loco\'s dynamic / blended brake), automatic brake to Service and Lap; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-njt-bilevel-cab-car-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
