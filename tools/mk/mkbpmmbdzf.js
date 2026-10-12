// DB Bpmmbdzf (DTG, IC Steuerwagen of the München-Nürnberg-Express, SFS Nürnberg–Ingolstadt), derived from mk101.js (2026-10-11).
// One cab, bare node names, no AFB. Fahrschalter runs -1..1 (0 / Down / Hold / Up / Min / power / Max); the TCA uses 0, Min, the power zone and Max.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679210';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_SFS_MuNu_Bpmmbdzf_C.json','utf8'));
const lever=n=>Array.isArray(cap.levers)?cap.levers.find(l=>l.name===n):cap.levers[n];
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
p.rail_class_information=[{class_name:'RVM_SFS_MuNu_Bpmmbdzf_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const brakeSteps=lever('TrainBrake').notches.map(n=>n.snapped); // 0.1 / 0.32 / 0.38 / 0.44 / 0.5 / 0.56 / 0.62 / 0.68 / 0.74 / 0.8 / 1
if(th11.length!==brakeSteps.length) throw new Error('171 bands do not fit');
const minNotch=lever('Throttle').notches.find(n=>n.name==='Min').snapped; // -0.0394: what the game stores for any set -0.2..0.1
const revSteps=lever('Reverser').notches.map(n=>n.snapped); // 0 / 0.33 / 0.66 / 1
const SL='SignalLights',HB='HeadlightBrightness';
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse / Off / Neutral / Forward), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:revSteps,invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter (0 at -1 / Min '+minNotch+' / power continuous 0.11..0.99 / Max 1; the Down / Hold / Up spring zones between 0 and Min are skipped). Z is at the far end of the quadrant, 0 nearest, so the lever is inverted: Max raw 0 ±0.035, power zone 0.045..0.81, Min 0.88 ±0.05, 0 at raw 1 ±0.04',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:-1,max:1,steps:[-1,minNotch,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.88,threshold_tolerance:0.05},{threshold:0.81,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.035}]}}]},
 {name:'RightThrottle',description:'Führerbremsventil (Running / 1A / 1B / 2 / 3 / 4 / 5 / 6 / 7 / Full service / Emergency) at the stored values of this cab car (0.1 / 0.32 / 0.38 … 0.74 / 0.8 / 1), plain: FÜ at the far end, SB nearest; the eleven Class 171 bands (centred on the TCA detents). Quick release below Running is left out',assignments:[{type:'direct_control',controls:'TrainBrake',input_value:{min:0.1,max:1,steps:brakeSteps,step_thresholds:JSON.parse(JSON.stringify(th11))}}]},
 {name:'ParkingBrake',description:'Reverser key (ReverserKey, MasterSwitch push button, In 1 / Out 0) and brake key (BrakeKey lever, Unlocked 1 / Locked 0), in / out. The reverser key goes in first (BR 101 user test, 2026-10-11)',assignments:[{type:'momentary',threshold:0.9,action_activate:{controls:'ReverserKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'ReverserKey',value:0,hold:false,enable_api_fallback:true}},{type:'momentary',threshold:0.9,action_activate:{controls:'BrakeKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'BrakeKey',value:0,hold:false,enable_api_fallback:true}}]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (spring lever, rest 0.5)','Sand',1,0.5),
 mom('RightThrottleButton','Horn (spring lever, rest 0.5)','Horn_L',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override',1,0),
 tog('LeftAuxButton','SiFa on / off (Sifa_ProxySwitch, identifier SifaIsolation: Enabled 1 drives SifaSwitch and opens the SiFa cut-out valve; API probe 2026-10-11). Lit = on','Sifa_ProxySwitch',1,0),
 tog('RightAuxButton','PZB on / off (PZB_ProxySwitch, identifier SignallingSystems: Enabled 1 / Disabled 0). Lit = on','PZB_ProxySwitch',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Intermittent > Off > Park)',assignments:[rel('WiperSwitch',-0.25)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Park > Off > Intermittent > Slow > Fast)',assignments:[rel('WiperSwitch',0.25)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set(SL,0.5)]},
 {name:'AutoBrake1',description:'Lights | Signal lights (Spitzensignal)',assignments:[set(SL,1),set(HB,0.33)]},
 {name:'AutoBrake2',description:'Lights | Headlights reduced',assignments:[set(SL,1),set(HB,0.66)]},
 {name:'AutoBrake3',description:'Lights | Headlights bright',assignments:[set(SL,1),set(HB,1)]},
 {name:'AutoBrake4',description:'Lights | Tail lights (Schlusslicht)',assignments:[set(SL,0)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '), 'brake',brakeSteps.join('/'),'min',minNotch,'rev',revSteps.join('/'));
const m={name:'tsw-bpmmbdzf-dtg-thejag',title:'Bpmmbdzf',eyebrow:'DB Regio · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Schnellfahrstrecke Nürnberg – Ingolstadt',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/bpmmbdzf-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Off','Reverse'],start:2},
 leftThrottle:{name:'Fahrschalter',continuous:true,notches:['Max (Z)',null,null,null,'Min','0'],start:5},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1A','1B','2','3','4','5','6','7','Full service','Emergency'],start:9},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Signal lights'},{short:'2',desc:'Headlights reduced'},{short:'3',desc:'Headlights bright'},{short:'HI',desc:'Tail lights'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key + brake key',flat:'out',up:'in'}},
setup:['Reverser key and brake key in (PARK BRK), battery on in the cab','Richtungsschalter from Off to Neutral','Raise the pantograph and close the Hauptschalter of the pushing BR 101 from the cab','SiFa and PZB on (aux squares), PZB mode set','Lights to Signal lights or Headlights','Open the doors (RUD TRIM); the cab car has no AFB, so the flap lever is free'],
depart:['Close doors, check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running, wait for the brakes to release','Fahrschalter towards Z: the loco pushes','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil towards SB in steps']};
fs.writeFileSync('tools/manual/trains/tsw-bpmmbdzf-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
