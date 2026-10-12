// LMS Jubilee Class 5XP / 6P (DTG, Peak Forest Railway and Spirit of Steam; the Rivet West Cornwall Steam Railtour reuses the LPC classes
// with _Crimson / _Xmas liveries), 2026-10-12. Derived from mk4f.js: identical steam simulation (continuous Regulator, Reverser_RailDriver
// cut-off with the screw winding after it in 3 s, continuous ungated VacuumBrake loading at 1, SteamBrake not driver-settable, Blower and
// dampers fought by the AI fireman, Sander -1 / 0 / 1, CylinderCocks push button loading open). No AWS, no key, no pin.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679670';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_PFT_LMS_Jubilee_Engine_C','RVM_LPC_LMS_Jubilee_Engine_C','RVM_LPC_LMS_Jubilee_Engine_Crimson_C','RVM_LPC_LMS_Jubilee_Engine_Xmas_C','RVM_LPC_LMS_Jubilee_Engine_Crimson_Xmas_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lamps=(a,b,c,d)=>[set('HeadcodeLamp_0',a),set('HeadcodeLamp_1',b),set('HeadcodeLamp_2',c),set('HeadcodeLamp_3',d)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Cut-off Reverser_RailDriver -1..1 (-75 % .. +75 %, Mid-gear 0; the screw Reverser follows it), continuous, inverted: full forward gear at the far end, full back gear nearest. Mid-gear at raw 0.5 ±0.03',assignments:[{type:'direct_control',controls:'Reverser_RailDriver',input_value:{min:-1,max:1,steps:[-1,null,0,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.535},{threshold:0.5,threshold_tolerance:0.03},{threshold:0.465,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'LeftThrottle',description:'Regulator (Throttle) continuous 0..1, plain: Closed at the far end, pulled towards you to open, Fully open nearest',assignments:[{type:'direct_control',controls:'Regulator',input_value:{min:0,max:1}}]},
 {name:'RightThrottle',description:'Vacuum brake valve VacuumBrake (continuous 0..1, Release 0 / Full application 1), inverted as the Class 153 brake: Full application at the far end, Release nearest',assignments:[{type:'direct_control',controls:'VacuumBrake',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Large ejector SteamEjector_Large (open 1 / closed 0) to create the vacuum before departure: PARK BRK up = open. The steam brake is not driver-settable on this loco (it follows the vacuum valve)',assignments:[pair('SteamEjector_Large',1,0)]},
 mom('LeftThrottleButton','Sand to the front (Sander lever Front 1 while held, back to the centre 0)','Sander',1,0),
 mom('RightThrottleButton','Whistle (Whistle push button, Horn)','Whistle',1,0),
 {name:'LeftEngineOn',description:'Blower (Blower valve 1 while up, 0 when down)',assignments:[pair('Blower',1,0)]},
 {name:'RightEngineOn',description:'Live injector (SteamInjector_Live and WaterInjector_Live 1 while up, 0 when down)',assignments:[pair('SteamInjector_Live',1,0),pair('WaterInjector_Live',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('RoundAuxButton','Cylinder cocks (CylinderCocks push button Open 1 / Closed 0). Lit = open; the loco loads with them open','CylinderCocks',1,0),
 {name:'RotaryCrank',description:'Front damper closed (Damper_F 0)',assignments:[set('Damper_F',0)]},
 {name:'RotaryIgnStart',description:'Front damper open (Damper_F 1)',assignments:[set('Damper_F',1)]},
 {name:'AutoBrake0',description:'Lamps | Off',assignments:lamps(0,0,0,0)},
 {name:'AutoBrake1',description:'Lamps | Lamp 1 (HeadcodeLamp_0)',assignments:lamps(1,0,0,0)},
 {name:'AutoBrake2',description:'Lamps | Lamps 1 and 2 (express headcode)',assignments:lamps(1,1,0,0)},
 {name:'AutoBrake3',description:'Lamps | High-intensity headlamp (HeadcodeLamp_2)',assignments:lamps(0,0,1,0)},
 {name:'AutoBrake4',description:'Lamps | All four',assignments:lamps(1,1,1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-lms-jubilee-dtg-thejag',title:'LMS Jubilee',eyebrow:'British Railways · LMS Jubilee 6P · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Peak Forest Railway · Spirit of Steam · West Cornwall Steam Railtour',logos:[{file:'../../assets/logo-br-totem-navy.png',alt:'British Railways'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/lms-jubilee-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Cut-off',continuous:true,notches:['75 % fwd',null,'Mid-gear',null,'75 % back'],start:2},
 leftThrottle:{name:'Regulator',continuous:true,notches:['Closed',null,null,null,'Fully open'],start:0},
 rightThrottle:{name:'Vacuum brake',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Whistle'}, gearLever:null,
 autoBrk:{name:'Lamps',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Lamp 1'},{short:'2',desc:'Express'},{short:'3',desc:'Headlamp'},{short:'HI',desc:'All four'}],start:1},
 eng1:{name:'Blower',start:true}, eng2:{name:'Live injector',start:true},
 leftAux:null, rightAux:null,
 modeSwitch:{name:'Front damper',left:'closed',right:'open'}, roundAux:{name:'Cylinder cocks'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Large ejector',flat:'closed',up:'open'}},
setup:['The AI fireman keeps the fire, dampers, blower and firebox door; no AWS on this loco','Cut-off to full forward gear (far end)','Live injector (ENG 2) when the water drops; blower (ENG 1) is mostly the fireman\u2019s','Cylinder cocks open (round aux lit) for the first turns of the wheels','Vacuum brake at Full application (parked); the steam brake follows it. Regulator Closed'],
depart:['Close doors (RUD TRIM), check the signal','Large ejector open (PARK BRK up) until the vacuum is up, then closed; vacuum brake to Release','Regulator open a little, then more; wind the cut-off back towards Mid-gear as speed rises','Cylinder cocks closed after the first 100 m','Brake with the vacuum valve, Full application at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-lms-jubilee-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
