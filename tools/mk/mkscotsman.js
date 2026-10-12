// LNER A3 60103 Flying Scotsman (DTG steam loco add-on, ECML Peterborough – Doncaster), 2026-10-12. FIRST STEAM LAYOUT. One footplate, no
// cab suffixes (CabLightSwitch_F/_B only); IS_GetActiveCab fails. Capture agent probe: Regulator (Throttle) continuous 0..1; the screw
// Reverser (identifier Reverser) does not take the cut-off through the API, Reverser_RailDriver (SimpleLever, no identifier) does: -1..1 =
// -75 % .. +75 % cut-off, Mid-gear 0, the Reverser output follows it; TrainBrake (IrregularLever) (AutomaticBrake, vacuum valve) moves ONE
// GATE PER API SET (ramp as the 802): Overcharge 0.04 / Running 0.15 (output 0.1) / Initial application 0.35 / Service continuous
// 0.35..0.65 / Full service 0.65 (0.8) / Emergency 0.85 (0.9) / Neutral-Shutdown 1 (loads there); LocoBrake (SimpleLever) continuous 0..1;
// Blower, injectors, ejectors and HeatValve continuous 0..1; Damper_F/_B five notches at k/4 (the AI fireman moves them and the
// FireboxDoor); Sander lever Rear 0 / centre 0.5 / Front 1 (rests at 0.5); AWS_Isolation (Simple Lever) Isolated 0 / Unisolated 0.81
// (loads 1); DriversBrakePin 0 / 0.835 (loads 1, dropped to 0 during the brake probe); CylinderCocks push button Closed 0 / Open 1 (loads
// open); Whistle push button (Horn); AWSReset_F (PushButton); HeadcodeLamp_0..3 push buttons. No master switch or key nodes at all.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679820';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_PBD_FlyingScotsman_2016_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lamps=(a,b,c,d)=>[set('HeadcodeLamp_0',a),set('HeadcodeLamp_1',b),set('HeadcodeLamp_2',c),set('HeadcodeLamp_3',d)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Cut-off Reverser_RailDriver -1..1 (-75 % .. +75 %, Mid-gear 0; the screw Reverser follows it), continuous, inverted: full forward gear at the far end, full back gear nearest. Mid-gear at raw 0.5 ±0.03',assignments:[{type:'direct_control',controls:'Reverser_RailDriver',input_value:{min:-1,max:1,steps:[-1,null,0,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.535},{threshold:0.5,threshold_tolerance:0.03},{threshold:0.465,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'LeftThrottle',description:'Regulator (Throttle) continuous 0..1, plain: Closed at the far end, pulled towards you to open, Fully open nearest',assignments:[{type:'direct_control',controls:'Regulator',input_value:{min:0,max:1}}]},
 {name:'RightThrottle',description:'Vacuum brake valve TrainBrake (IrregularLever): Running 0.15 / Initial application 0.35 / Service continuous to 0.65 / Full service 0.65 / Emergency 0.85 (one gate per API set, the lever ramps through them), inverted as the Class 153 brake: Emergency at the far end, Running nearest. Emergency raw 0 ±0.05, Full 0.16 ±0.05, service zone 0.24..0.78, Initial 0.84 ±0.04, Running 1 ±0.08. Overcharge and Neutral / Shutdown stay in the cab',assignments:[{type:'direct_control',controls:'TrainBrake (IrregularLever)',input_value:{min:0.15,max:0.85,steps:[0.15,0.35,null,0.65,0.85],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.08},{threshold:0.84,threshold_tolerance:0.04},{threshold:0.78,threshold_end:0.24},{threshold:0.16,threshold_tolerance:0.05},{threshold:0,threshold_tolerance:0.05}]}}]},
 {name:'FlapLever',description:'Loco steam brake LocoBrake (SimpleLever) continuous 0..1, inverted: Full at the far end, Off nearest',assignments:[{type:'direct_control',controls:'LocoBrake (SimpleLever)',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Driver’s brake pin DriversBrakePin (in 1 / out 0; the vacuum valve is dead with it out, the loco loads with it in): PARK BRK up = pin in',assignments:[pair('DriversBrakePin',1,0)]},
 mom('GearLever','AWS acknowledge (AWSReset_F (PushButton), AWS_Reset, held)','AWSReset_F (PushButton)',1,0),
 mom('LeftThrottleButton','Sand to the front (Sander lever Front 1 while held, back to the centre 0.5)','Sander',1,0.5),
 mom('RightThrottleButton','Whistle (Whistle push button, Horn)','Whistle',1,0),
 {name:'LeftEngineOn',description:'Blower (Blower valve 1 while up, 0 when down)',assignments:[pair('Blower',1,0)]},
 {name:'RightEngineOn',description:'Live injector (SteamInjector_Live and WaterInjector_Live 1 while up, 0 when down)',assignments:[pair('SteamInjector_Live',1,0),pair('WaterInjector_Live',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','AWS (AWS_Isolation (Simple Lever): Unisolated 0.81 / Isolated 0). Lit = AWS on','AWS_Isolation (Simple Lever)',0.81,0),
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
const m={name:'tsw-flying-scotsman-dtg-thejag',title:'Flying Scotsman',eyebrow:'British Railways · LNER A3 · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'East Coast Main Line: Peterborough – Doncaster',logos:[{file:'../../assets/logo-br-totem-navy.png',alt:'British Railways'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/flying-scotsman-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Cut-off',continuous:true,notches:['75 % fwd',null,'Mid-gear',null,'75 % back'],start:2},
 leftThrottle:{name:'Regulator',continuous:true,notches:['Closed',null,null,null,'Fully open'],start:0},
 rightThrottle:{name:'Vacuum brake',continuous:true,notches:['Emergency','Full service',null,'Initial','Running'],start:1},
 flap:{name:'Steam brake',continuous:true,notches:['Full',null,null,null,'Off'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Whistle'}, gearLever:{name:'AWS ack.'},
 autoBrk:{name:'Lamps',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Lamp 1'},{short:'2',desc:'Express'},{short:'3',desc:'Headlamp'},{short:'HI',desc:'All four'}],start:1},
 eng1:{name:'Blower',start:true}, eng2:{name:'Live injector',start:true},
 leftAux:{name:'AWS'}, rightAux:null,
 modeSwitch:{name:'Front damper',left:'closed',right:'open'}, roundAux:{name:'Cylinder cocks'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Brake pin',flat:'out',up:'in'}},
setup:['Brake pin in (PARK BRK up); the AI fireman keeps the fire, dampers and firebox door','Cut-off to full forward gear (far end), AWS on (left aux)','Blower open (ENG 1) while standing; live injector (ENG 2) when the water drops','Cylinder cocks open (round aux lit) for the first turns of the wheels','Steam brake at Full, vacuum brake at Full service (parked); regulator Closed'],
depart:['Close doors (RUD TRIM), check the signal','Vacuum brake to Running, steam brake Off','Regulator open a little, then more; wind the cut-off back towards Mid-gear as speed rises','Cylinder cocks closed after the first 100 m; blower closed once the exhaust draws the fire','Acknowledge AWS with the gear lever; brake with the vacuum valve in the service zone, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-flying-scotsman-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
