// ÖBB 4024 Talent (DTG, Semmeringbahn / Salzburg – Rosenheim), 2026-10-12. Own layout; the BR 440 handle geometry (CLAUDE.md gotchas).
// One desk, no cab suffixes; IS_GetActiveCab false/false on the first run, true/false on the rerun (the cab activates on use), the
// profile uses plain node names. Capture: MasterController 0..1 = Emergency 0 / Max brake 0.099 / brake continuous 0.11..0.40 / Min
// brake 0.41 / 0 at 0.5 / Min power 0.59 / power continuous 0.6..1 (one gate per set); TrainBrake Drive 0 / Release 0.25 / Hold 0.5 /
// Apply 0.75 (Emergency never stored); Reverser Reverse 0 / Off 0.5 / Forward 1; CruiseControlSpeedSetProxy (AFB) is an increment
// proxy that stores nothing (one notch), so the Tempomat stays in the cab and the flap lever is free. Keys: CabActivationSwitch
// (MasterSwitch lever Off 0.5 / Active 1) and TrainBrakeHandle (BrakeKey push button Inserted 1); SifaFuseControl / PZBFuseControl
// push buttons (On 1).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680070';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/OBB_4024_(M1|M2|T1|T2)$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Off 0.5 / Forward 1; the zones take any value), inverted: Forward at the far end, Reverse nearest. Needs the cab active (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined power / brake handle MasterController (Emergency 0 left out / Max brake 0.099 / brake continuous 0.11..0.40 / Min brake 0.41 / 0 at 0.5 / Min power 0.59 / power continuous 0.6..1; one gate per set, the app re-sends). The BR 440 geometry, inverted: full power at the far end (raw 0 ±0.04), power zone 0.045..0.42, Min power 0.45 ±0.03, 0 at 0.5 ±0.02, Min brake 0.55 ±0.03, brake zone 0.58..0.955, Max brake 1 ±0.04 nearest',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0.099,max:1,steps:[0.099,null,0.41,0.5,0.59,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.58},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.42,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Brake valve TrainBrake (Drive 0 / Release 0.25 / Hold 0.5 / Apply 0.75; Emergency never stores), plain: Drive at the far end, Apply nearest. Drive 0 ±0.12, Release 0.31 ±0.1 (detent), Hold 0.5 ±0.08, Apply 0.84 ±0.16',assignments:[{type:'direct_control',controls:'TrainBrake',input_value:{min:0,max:0.75,steps:[0,0.25,0.5,0.75],step_thresholds:[{threshold:0,threshold_tolerance:0.12},{threshold:0.31,threshold_tolerance:0.1},{threshold:0.5,threshold_tolerance:0.08},{threshold:0.84,threshold_tolerance:0.16}]}}]},
 {name:'ParkingBrake',description:'Cab activation CabActivationSwitch (MasterSwitch lever: Active 1 / Off 0.5) and brake key TrainBrakeHandle (BrakeKey push button, Inserted 1 / Removed 0): PARK BRK up = both in',assignments:[pair('CabActivationSwitch',1,0.5),pair('TrainBrakeHandle',1,0)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (SanderButton push button)','SanderButton',1,0),
 mom('RightThrottleButton','Horn high (HornButtonH push button)','HornButtonH',1,0),
 mom('LeftEngineOn','PZB Frei (PZBRelease spring lever, rest 0.5)','PZBRelease',1,0.5),
 mom('RightEngineOn','PZB Wachsam (PZBAcknowledge spring lever, rest 0.5)','PZBAcknowledge',1,0.5),
 {name:'RudderTrimLeft',description:'Doors | Left: DoorsSideSelectionSwitch to Unlock Left (0.25) while held, Lock All (0) on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'DoorsSideSelectionSwitch',value:0.25,hold:false,enable_api_fallback:true},action_deactivate:{controls:'DoorsSideSelectionSwitch',value:0,hold:false,enable_api_fallback:true}}},
 {name:'RudderTrimRight',description:'Doors | Right: DoorsSideSelectionSwitch to Unlock Right (0.75) while held, Lock All (0) on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'DoorsSideSelectionSwitch',value:0.75,hold:false,enable_api_fallback:true},action_deactivate:{controls:'DoorsSideSelectionSwitch',value:0,hold:false,enable_api_fallback:true}}},
 mom('RoundAuxButton','PZB Befehl 40 (PZBOverride spring lever, rest 0.5)','PZBOverride',1,0.5),
 tog('LeftAuxButton','SiFa fuse (SifaFuseControl push button: On 1 / Off 0). Lit = on','SifaFuseControl',1,0),
 tog('RightAuxButton','PZB fuse (PZBFuseControl push button: On 1 / Off 0). Lit = on','PZBFuseControl',1,0),
 {name:'RotaryCrank',description:'Wipers off (WiperSwitch: Interval 0 / Off 0.333 / Slow 0.667 / Fast 1)',assignments:[set('WiperSwitch',0.3333)]},
 {name:'RotaryIgnStart',description:'Wipers slow (WiperSwitch 0.667)',assignments:[set('WiperSwitch',0.6667)]},
 {name:'AutoBrake0',description:'Lights | Off (SignalLights 0.667)',assignments:[set('SignalLights',0.6667)]},
 {name:'AutoBrake1',description:'Lights | Headlights (SignalLights 1)',assignments:[set('SignalLights',1)]},
 {name:'AutoBrake2',description:'Lights | Tail lights (SignalLights 0.333)',assignments:[set('SignalLights',0.3333)]},
 {name:'AutoBrake3',description:'Lights | Headlights both ends (SignalLights 0)',assignments:[set('SignalLights',0)]},
 {name:'AutoBrake4',description:'Lights | Headlights and instrument lights (InstrumentLightSwitch 1)',assignments:[set('SignalLights',1),set('InstrumentLightSwitch',1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-oebb-4024-dtg-thejag',title:'4024 Talent',eyebrow:'ÖBB · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Semmeringbahn: Wiener Neustadt – Mürzzuschlag',colors:{navy:'#3a3735',blue:'#6e6a67',red:'#E2002A',paper:'#f6f4f3'},logos:[{file:'../../assets/logo-oebb-grey.svg',alt:'ÖBB'},{file:'../../assets/logo-dtg-oebbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/oebb-4024-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Off','Reverse'],start:1},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['Max power',null,'Min power','0','Min brake',null,'Max brake'],start:6},
 rightThrottle:{name:'Brake valve',notches:['Drive','Release','Hold','Apply'],start:3},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Headlights'},{short:'2',desc:'Tail lights'},{short:'3',desc:'Both ends'},{short:'HI',desc:'Head + gauges'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'off',right:'slow'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Cab active + brake key',flat:'off',up:'on'}},
setup:['Battery and pantograph in the cab','PARK BRK up: cab active and brake key in','Reverser from Off to Forward','SiFa and PZB fuses on (aux squares), PZB mode in the cab','Lights to Headlights','Brake valve at Apply, handle at Max brake (parked); the Tempomat stays in the cab'],
depart:['Close doors (RUD TRIM), check the signal and PZB','Brake valve to Drive, handle to 0, wait for the release','Handle past Min power into the power zone','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: handle back through 0 into the brake zone, or the brake valve to Apply','Stop: brake valve to Apply, handle to Max brake']};
fs.writeFileSync('tools/manual/trains/tsw-oebb-4024-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
