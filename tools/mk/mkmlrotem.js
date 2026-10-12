// Metrolink Hyundai Rotem cab car (DTG, San Bernardino Line; also Antelope Valley Line), 2026-10-13. Derived from mkf59ph.js. Tile "Rotem
// Bi-Level Cab Car Metrolink" (westbound services only). One desk, plain node names, IS_GetActiveCab false/false. Capture agent probe:
// MasterController (Throttle, -1..1) one combined handle without gates: dynamic continuous -0.4..-1 (LOCKED in Neutral) / Setup -0.15 (sets
// -0.1..-0.25 snap there) / Off 0 / P1..P8 at k/8 (snaps). AutomaticBrake ONE GATE PER API SET at Handle Off and Suppression: Release 0 /
// Minimum 0.075 / service continuous 0.08..0.44 / Full Service 0.45 / Suppression 0.55 / Handle Off 0.9 / Emergency 1 (loads Handle Off).
// Reverser -1 / 0 / 1, moves only with the handle at Off, not locked by ReverserHandle. No independent, bail-off or separate dynamic lever.
// Loads cold: ReverserHandle (MasterSwitch) 0, CabSetup (BrakeKey) 0, AutomaticBrakeCutOut (Cut-In 1) 0, GeneratorField 0. ATS_CutOut
// Cut-In 0 / Cut-Out 1 (loads cut in). HeadAuxLight Off 0 / Dim 0.33 / Bright 0.667 / Bright & Aux 1; MarkerLights 0 / 1; HandBrake_B
// Released 0 / Applied 0.9..1.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680120';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.name='TSW | Metrolink Rotem cab car | DTG | TheJAG';
p.rail_class_information=['RVM_SBD_ML_RotemCars_CabCar_C','RVM_ALV_ML_RotemCars_CabCar_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h)=>[set('HeadAuxLight',h)];
// raw axis, inverted: P8 at the far end (raw 0) .. Off 0.5 .. full dynamic nearest (raw 1); the F59PHR bands
const thMC=[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.63},{threshold:0.58,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.04},{threshold:0.42,threshold_tolerance:0.025},{threshold:0.36,threshold_tolerance:0.025},{threshold:0.3,threshold_tolerance:0.025},{threshold:0.24,threshold_tolerance:0.025},{threshold:0.18,threshold_tolerance:0.025},{threshold:0.12,threshold_tolerance:0.025},{threshold:0.06,threshold_tolerance:0.025},{threshold:0,threshold_tolerance:0.03}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Moves only with the handle at Off',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined handle MasterController -1..1 (dynamic continuous -0.4..-1 / Setup -0.15 / Off 0 / P1..P8 at k/8), inverted: P8 at the far end (raw 0), notches every 0.06 down to P1 at 0.42, Off 0.5 ±0.04, Setup 0.58 ±0.03, dynamic zone 0.63..0.955, full dynamic 1 nearest. The dynamic side is locked in Neutral',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:-1,max:1,steps:[-1,null,-0.15,0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true,step_thresholds:thMC}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Minimum 0.075 / service continuous 0.08..0.44 / Full Service 0.45 / Suppression 0.55 / Handle Off 0.9 / Emergency 1; one gate per API set, the lever ramps through them), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1, Suppression 0.2, Full Service 0.3, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.075,null,0.45,0.55,0.9,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Cab set-up: ReverserHandle (MasterSwitch 1 / 0), CabSetup (BrakeKey Setup 1 / Off 0), AutomaticBrakeCutOut (Cut-In 1 / Cut-Out 0) and GeneratorField (1 / 0); the car loads with all of them off. PARK BRK up = desk live',assignments:[pair('ReverserHandle',1,0),pair('CabSetup',1,0),pair('AutomaticBrakeCutOut',1,0),pair('GeneratorField',1,0)]},
 mom('GearLever','Alerter reset (TMSReset, held)','TMSReset',1,0),
 mom('LeftThrottleButton','Sand (Sander push button, held)','Sander',1,0),
 mom('RightThrottleButton','Horn (Horn push button, held)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 mom('RightEngineOn','ATS acknowledge (ATS_Acknowledge, held while up)','ATS_Acknowledge',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','ATS (ATS_CutOut Cut-In 0 / Cut-Out 1). Lit = cut in; loads cut in','ATS_CutOut',0,1),
 tog('RightAuxButton','Marker lights (MarkerLights 1 / 0). Lit = on','MarkerLights',1,0),
 tog('RoundAuxButton','Hand brake (HandBrake_B Applied 1 / Released 0). Lit = applied','HandBrake_B',1,0),
 {name:'RotaryCrank',description:'Wipers off (Wiper_R / Wiper_L 0)',assignments:[set('Wiper_R',0),set('Wiper_L',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (Wiper_R / Wiper_L 0.5; values not explored)',assignments:[set('Wiper_R',0.5),set('Wiper_L',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0)},
 {name:'AutoBrake1',description:'Lights | Dim (HeadAuxLight 0.33)',assignments:lights(0.33)},
 {name:'AutoBrake2',description:'Lights | Bright (0.667)',assignments:lights(0.667)},
 {name:'AutoBrake3',description:'Lights | Bright and aux (1)',assignments:lights(1)},
 {name:'AutoBrake4',description:'Lights | Bright and aux, flashing (AuxLightManualFlash pressed)',assignments:[set('HeadAuxLight',1),set('AuxLightManualFlash',1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-metrolink-rotem-cab-car-dtg-thejag',title:'Rotem cab car',eyebrow:'Metrolink · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'San Bernardino Line: Los Angeles – San Bernardino',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-metrolink-slate.svg',alt:'Metrolink'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/metrolink-rotem-cab-car-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle / dynamic',continuous:true,notches:['8','7','6','5','4','3','2','1','Off','Setup',null,'Full'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ aux'},{short:'HI',desc:'Aux flash'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'ATS ack.',start:true},
 leftAux:{name:'ATS'}, rightAux:{name:'Marker lights'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Hand brake'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Cab set-up',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, cab set-up key on, automatic brake cut in, generator field on (the car loads with them off)','ATS cut in (left aux lit); lights to Bright; hand brake off (round aux)','Handle at Off, automatic brake at Full service (parked); reverser to Forward (it only moves with the handle at Off)'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release (the lever ramps through its gates)','Handle away from you: 1 … 8','Reset the alerter with the gear lever, acknowledge ATS with ENG 2','Brake: handle back through Off and Setup into the dynamic zone (not in Neutral); automatic brake into the service zone; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-metrolink-rotem-cab-car-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
