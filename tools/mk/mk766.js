// DB 766.2 DBpbzfa Doppelstock-Steuerwagen (DTG European content pack core class, drives a BR 146 from Hauptstrecke Hamburg – Lübeck,
// Dresden – Riesa, Leipzig – Dresden and more), 2026-10-12. Layout of the BR 101 (mk101.js) without the AFB; the cab car has one desk
// with no cab suffixes (IS_GetActiveCab false/false, GetActiveCab fails). Capture: Throttle Off 0 / Min 0.1 / continuous 0.11..0.99 /
// Max 1; TrainBrake the eleven 101 notches (Running 0.1 ... Full service 0.8 / Emergency 1); Reverser Reverse / Off / Neutral / Forward
// in zones 0..0.16 / 0.17..0.49 / 0.5..0.83 / 0.84..1 (stores 0.28 / 0.62 / 0.95, even thirds used); DirectBrake Release 0 / Hold 0.5 /
// Apply 1; DynamicBrake mirrors the train brake (cab only); ShuntingLever_L/_R stay locked. Keys ReverserHandle (MasterSwitch push
// button, In 1) and MasterKey (BrakeKey lever, On 0.95), both out at service start; Sifa_FuseControl lever and PZB_Fuse push button off.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679220';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/_766pbzfa$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const brakeSteps=[0.1,0.2,0.275,0.35,0.425,0.5,0.575,0.65,0.725,0.8,1];
if(th11.length!==brakeSteps.length) throw new Error('171 bands do not fit');
const SL='SignalLights',HB='HeadlightBrightness';
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter Reverser (Reverse 0 / Off 0.33 / Neutral 0.67 / Forward 1, any value in a zone stores), inverted: Forward at the far end. Needs the reverser key (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.3333,0.6667,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter Throttle (Off 0 / Min 0.1 / continuous 0.11..0.99 / Max 1). Z (power) at the far end, so inverted: Max raw 0 ±0.035, power zone 0.045..0.81, Min 0.88 ±0.05, Off 1 ±0.04 (the BR 101 bands)',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.1,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.88,threshold_tolerance:0.05},{threshold:0.81,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.035}]}}]},
 {name:'RightThrottle',description:'Führerbremsventil TrainBrake (Running 0.1 / 1A / 1B / 2 / 3 / 4 / 5 / 6 / 7 / Full service 0.8 / Emergency 1), plain: Running at the far end, Emergency nearest; the eleven Class 171 bands (centred on the TCA detents). Needs the brake key (PARK BRK up)',assignments:[{type:'direct_control',controls:'TrainBrake',input_value:{min:0.1,max:1,steps:brakeSteps,step_thresholds:JSON.parse(JSON.stringify(th11))}}]},
 {name:'FlapLever',description:'Zusatzbremse DirectBrake (Release 0 / Hold 0.5 / Apply 1), plain: Release at the far end, Apply nearest: Release 0 ±0.15, Hold 0.5 ±0.15, Apply 1 ±0.15',assignments:[{type:'direct_control',controls:'DirectBrake',input_value:{min:0,max:1,steps:[0,0.5,1],step_thresholds:[{threshold:0,threshold_tolerance:0.15},{threshold:0.5,threshold_tolerance:0.15},{threshold:1,threshold_tolerance:0.15}]}}]},
 {name:'ParkingBrake',description:'Reverser key ReverserHandle (MasterSwitch push button, In 1 / Out 0) and brake key MasterKey (BrakeKey lever, On 1 / Off 0): PARK BRK up = both in, reverser key first',assignments:[pair('ReverserHandle',1,0),pair('MasterKey',1,0)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand to the front (Sander spring lever: Back -1 / rest 0.5 / Front 1)','Sander',1,0.5),
 mom('RightThrottleButton','Horn high (Horn_FL spring lever: Low 0 / rest 0.5 / High 1)','Horn_FL',1,0.5),
 mom('LeftEngineOn','PZB Frei (PZB_Release push button)','PZB_Release',1,0),
 mom('RightEngineOn','PZB Wachsam (PZB_Acknowledge spring lever, Pressed -1 / Released 0)','PZB_Acknowledge',-1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (PZB_Override push button)','PZB_Override',1,0),
 tog('LeftAuxButton','SiFa fuse (Sifa_FuseControl lever: On 1 / Off 0; the car loads with it off). Lit = on','Sifa_FuseControl',1,0),
 tog('RightAuxButton','PZB fuse (PZB_Fuse push button: On 1 / Off 0; the car loads with it off; PZBModeSwitch stays in the cab). Lit = on','PZB_Fuse',1,0),
 {name:'RotaryCrank',description:'Wipers one notch back (Wipers lever: P 0 / Off 0.33 / Interval 0.66 / Lasting 1)',assignments:[rel('Wipers',-0.33)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on',assignments:[rel('Wipers',0.33)]},
 {name:'AutoBrake0',description:'Lights | Off (SignalLights 0.5)',assignments:[set(SL,0.5)]},
 {name:'AutoBrake1',description:'Lights | Headlights, normal (SignalLights 1, HeadlightBrightness 0.33)',assignments:[set(SL,1),set(HB,0.33)]},
 {name:'AutoBrake2',description:'Lights | Headlights, high beams (HeadlightBrightness 1)',assignments:[set(SL,1),set(HB,1)]},
 {name:'AutoBrake3',description:'Lights | Tail lights (SignalLights 0)',assignments:[set(SL,0)]},
 {name:'AutoBrake4',description:'Lights | Headlights normal and coach lights on (CoachLights 1)',assignments:[set(SL,1),set(HB,0.33),set('CoachLights',1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-766-dtg-thejag',title:'DBpbzfa 766.2',eyebrow:'DB Regio · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Hauptstrecke Hamburg – Lübeck and the other Dosto routes',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-766-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Off','Reverse'],start:2},
 leftThrottle:{name:'Fahrschalter',continuous:true,notches:['Max (Z)',null,null,null,'Min','Off'],start:5},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1A','1B','2','3','4','5','6','7','Full service','Emergency'],start:9},
 flap:{name:'Zusatzbremse',notches:['Release','Hold','Apply'],start:1},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Headlights'},{short:'2',desc:'High beams'},{short:'3',desc:'Tail lights'},{short:'HI',desc:'Head + coaches'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'back',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key + brake key',flat:'out',up:'in'}},
setup:['Battery on in the cab (the car loads cold, keys out)','Reverser key and brake key in (PARK BRK up)','Richtungsschalter from Off to Neutral','Pantograph and Hauptschalter of the loco from the cab (PantographControl, CircuitBreaker)','SiFa and PZB fuses on (aux squares), PZB mode set','Lights to Headlights; open doors (RUD TRIM)'],
depart:['Close doors, check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running, wait for the brakes to release','Fahrschalter towards Z','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil towards Full service in steps; the dynamic brake stays in the cab']};
fs.writeFileSync('tools/manual/trains/tsw-br-766-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
