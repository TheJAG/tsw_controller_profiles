// DB BR 612 (DTG, Tharandter Rampe Dresden – Chemnitz), 2026-10-11. Derived from mk101.js / mk628.js.
// One node set per unit (no cab suffixes). The combined handle `ThrottleAndBrakeHandle` is a custom class the capture
// script skips; probed by hand (HANDOFF.md): seven notches at inputs 0 / 0.15 / 0.3 / 0.5 / 0.7 / 0.85 / 1 =
// Brake + / Brake hold / Brake - / Off / Throttle - / Throttle hold / Throttle +, one notch per API set, the two ends are
// spring positions that pulse the internal ApplyAmount (+-0.067 per second held) and fall back to the hold notch.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679330';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_DCZ_DB_BR612_A_C.json','utf8'));
const lever=n=>Array.isArray(cap.levers)?cap.levers.find(l=>l.name===n):cap.levers[n];
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR612_[AB]$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const brakeSteps=lever('TrainBrakeHandle').notches.map(n=>n.snapped); // 0 / 0.2 / 0.275 / 0.35 / 0.425 / 0.5 / 0.575 / 0.65 / 0.725 / 0.8 / 1
if(th11.length!==brakeSteps.length) throw new Error('171 bands do not fit');
const revSteps=lever('Reverser').notches.map(n=>n.snapped); // 0 / 0.5 / 1
const SL='SignalLightsSwitch',HL='HeadlightsSwitch';
// Seven bands on the raw TCA axis (inverted: Throttle + at the far end = raw 0). Hold notches get the widest bands, the
// spring ends the last 0.06, Off is centred on raw 0.5 with the usual +-0.03.
const handleTh=[{threshold:1,threshold_tolerance:0.06},{threshold:0.86,threshold_tolerance:0.07},{threshold:0.68,threshold_tolerance:0.08},{threshold:0.5,threshold_tolerance:0.03},{threshold:0.32,threshold_tolerance:0.08},{threshold:0.14,threshold_tolerance:0.07},{threshold:0,threshold_tolerance:0.06}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Backwards 0 / OFF 0.5 / Forwards 1), inverted: Forwards at the far end',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:revSteps,invert:true}}]},
 {name:'LeftThrottle',description:'Fahr-/Bremshebel ThrottleAndBrakeHandle, an incremental handle: Brake + 0 / Brake hold 0.15 / Brake - 0.3 / Off 0.5 / Throttle - 0.7 / Throttle hold 0.85 / Throttle + 1. The game moves it one notch per set and the two ends are spring positions (a set pulses the traction or brake demand and the handle falls back to the hold notch), so push the TCA lever to the far end to raise power, bring it back to the hold band to keep it, and the mirror for the brake. Fahren is pushed away, so inverted: Throttle + raw 0..0.06, hold 0.07..0.21, Throttle - 0.24..0.40, Off 0.47..0.53, Brake - 0.60..0.76, hold 0.79..0.93, Brake + 0.94..1',assignments:[{type:'direct_control',controls:'ThrottleAndBrakeHandle',input_value:{min:0,max:1,steps:[0,0.15,0.3,0.5,0.7,0.85,1],invert:true,step_thresholds:handleTh}}]},
 {name:'RightThrottle',description:'Führerbremsventil TrainBrakeHandle (Running 0 / 1A 0.2 / 1B 0.275 / 2 0.35 … 7 0.725 / Full service 0.8 / Emergency 1), plain: Running at the far end, Emergency nearest; the eleven Class 171 bands (centred on the TCA detents)',assignments:[{type:'direct_control',controls:'TrainBrakeHandle',input_value:{min:0,max:1,steps:brakeSteps,step_thresholds:JSON.parse(JSON.stringify(th11))}}]},
 {name:'ParkingBrake',description:'Reverser key (ReverserKey, MasterSwitch push button, Inserted 1 / Removed 0) and brake key (BrakeKey push button, Inserted 1 / Removed 0), in / out. The reverser key goes in first',assignments:[{type:'momentary',threshold:0.9,action_activate:{controls:'ReverserKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'ReverserKey',value:0,hold:false,enable_api_fallback:true}},{type:'momentary',threshold:0.9,action_activate:{controls:'BrakeKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'BrakeKey',value:0,hold:false,enable_api_fallback:true}}]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (SanderSwitch spring lever, rest 0.5)','SanderSwitch',1,0.5),
 mom('RightThrottleButton','Horn high (HornSwitch spring lever, rest 0.5; Low is 0)','HornSwitch',1,0.5),
 mom('LeftEngineOn','PZB Frei (PzbReleaseSwitch spring lever)','PzbReleaseSwitch',1,0.5),
 mom('RightEngineOn','PZB Wachsam (PzbAcknowledgeSwitch spring lever)','PzbAcknowledgeSwitch',1,0.5),
 {name:'RudderTrimLeft',description:'Doors | Left: DoorsSideSelectionSwitch to Unlock Left Side Doors (0.75) while held, Lock All (0) on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'DoorsSideSelectionSwitch',value:0.75,hold:false,enable_api_fallback:true},action_deactivate:{controls:'DoorsSideSelectionSwitch',value:0,hold:false,enable_api_fallback:true}}},
 {name:'RudderTrimRight',description:'Doors | Right: DoorsSideSelectionSwitch to Unlock Right Side Doors (0.25) while held, Lock All (0) on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'DoorsSideSelectionSwitch',value:0.25,hold:false,enable_api_fallback:true},action_deactivate:{controls:'DoorsSideSelectionSwitch',value:0,hold:false,enable_api_fallback:true}}},
 mom('RoundAuxButton','PZB Befehl 40 (PzbOverrideSwitch spring lever)','PzbOverrideSwitch',1,0.5),
 tog('LeftAuxButton','SiFa fuse (SifaFuseControl push button, On 1 / Off 0). Lit = on','SifaFuseControl',1,0),
 tog('RightAuxButton','PZB fuse (PZBFuseControl push button, On 1 / Off 0; GNT has its own fuse in the cab). Lit = on','PZBFuseControl',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Intermittent > Off)',assignments:[rel('WiperSwitch',-0.25)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Intermittent > Slow > Fast)',assignments:[rel('WiperSwitch',0.25)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set(SL,0.5)]},
 {name:'AutoBrake1',description:'Lights | Headlights reduced (Spitzensignal)',assignments:[set(SL,0.125),set(HL,0)]},
 {name:'AutoBrake2',description:'Lights | Headlights normal',assignments:[set(SL,0.125),set(HL,0.5)]},
 {name:'AutoBrake3',description:'Lights | Headlights bright',assignments:[set(SL,0.125),set(HL,1)]},
 {name:'AutoBrake4',description:'Lights | Tail lights (Schlusslicht)',assignments:[set(SL,0.875)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '),'brake',brakeSteps.join('/'),'rev',revSteps.join('/'));
const m={name:'tsw-br-612-dtg-thejag',title:'BR 612',eyebrow:'DB Regio · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Tharandter Rampe: Dresden – Chemnitz',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-612-dtg-cab.jpg',height:196,position:'50% 60%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forwards','Off','Backwards'],start:1},
 leftThrottle:{name:'Fahr-/Bremshebel',notches:['Throttle +','Throttle hold','Throttle −','Off','Brake −','Brake hold','Brake +'],start:3},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1A','1B','2','3','4','5','6','7','Full service','Emergency'],start:9},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Headlights reduced'},{short:'2',desc:'Headlights normal'},{short:'3',desc:'Headlights bright'},{short:'HI',desc:'Tail lights'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key + brake key',flat:'out',up:'in'}},
setup:['Reverser key and brake key in (PARK BRK); battery, engine groups 1 and 2 and the transmission on in the cab','Richtungsschalter from Off to Forwards','SiFa and PZB on (aux squares), GNT fuse and PZB mode in the cab','Lights to Headlights','Fahr-/Bremshebel in Off (centre band); no AFB, the flap lever is free','Open the doors (RUD TRIM, hold the side you need)'],
depart:['Close doors (release RUD TRIM), check the signal and PZB','Führerbremsventil to Running, wait for the brakes to release','Push the handle to Throttle + to raise power, back one band to Throttle hold to keep it','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Slow down: handle back past Off to Brake + (pulse) and Brake hold, or the Führerbremsventil in steps','Stop: Führerbremsventil to Full service, handle to Off']};
fs.writeFileSync('tools/manual/trains/tsw-br-612-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
