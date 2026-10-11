// DB BR 642 Desiro Classic (DTG, Maintalbahn Aschaffenburg – Miltenberg), 2026-10-11. Derived from mk612.js and the BR 440 handle geometry.
// One node set per unit (no cab suffixes). Combined handle `ThrottleAndBrakeHandle` 0..1: Emergency 0..0.1, brake continuous
// 0.1..0.45 (output -1..0), 0 band 0.45..0.55 (stored 0.5), traction continuous 0.55..1 (output 0..1); the game passes one gate
// per API set (a set from the brake zone straight into traction stops at 0.55 = 0 traction; probe in HANDOFF.md).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679870';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_MAIN_DB_BR642_B_C.json','utf8'));
const lever=n=>Array.isArray(cap.levers)?cap.levers.find(l=>l.name===n):cap.levers[n];
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR642_[AB]$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const brake=lever('TrainBrakeHandle').notches; // Driving 0 / 0 (centre) 0.3907 / Rapid Brake 0.9087; Release and Braking are spring positions
const centre=brake.find(n=>n.name==='0').snapped, rapid=brake.find(n=>/Rapid/.test(n.name)).snapped;
const revSteps=lever('Reverser').notches.map(n=>n.snapped); // 0 / 0.5 / 1
const SL='SignalLightsSwitch',HL='HeadlightsSwitch';
// BR 440 geometry on the raw TCA axis (inverted: traction pushed away = raw 0): full brake raw 1 +-0.04, brake zone 0.955..0.58,
// min brake 0.55 +-0.03, 0 at 0.5 +-0.02, min power 0.45 +-0.03, power zone 0.42..0.045, full power 0 +-0.04.
const handleTh=[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.58,threshold_tolerance:0},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.42,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.5 / Forward 1), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:revSteps,invert:true}}]},
 {name:'LeftThrottle',description:'Fahr-/Bremshebel ThrottleAndBrakeHandle (full brake 0.1 / brake continuous to 0.45 / 0 at 0.5 / traction from 0.55 continuous to 1; Emergency below 0.1 is left out on purpose). Traction is pushed away, so inverted with the BR 440 geometry: full brake raw 1 +-0.04, brake zone 0.955..0.58, min brake (0.45) 0.55 +-0.03, 0 at 0.5 +-0.02, min power (0.55) 0.45 +-0.03, power zone 0.42..0.045, full power 0 +-0.04. The game passes one gate per set, so the TCA must come through 0 and the min-power band on its way up',assignments:[{type:'direct_control',controls:'ThrottleAndBrakeHandle',input_value:{min:0.1,max:1,steps:[0.1,null,0.45,0.5,0.55,null,1],invert:true,step_thresholds:handleTh}}]},
 {name:'RightThrottle',description:'Führerbremsventil TrainBrakeHandle, a self-lapping valve: Driving (Fahrt) 0 / Release (spring, 0.2) / centre '+centre+' / Braking (spring, 0.65) / Rapid brake '+rapid+'. Plain: Driving at the far end, Rapid brake nearest. The game snaps any set 0.25..0.74 back to the centre, so Release and Braking act as pulses while the TCA passes through them',assignments:[{type:'direct_control',controls:'TrainBrakeHandle',input_value:{min:0,max:1,steps:[0,0.2,centre,0.65,rapid],step_thresholds:[{threshold:0,threshold_tolerance:0.1},{threshold:0.25,threshold_tolerance:0.08},{threshold:0.5,threshold_tolerance:0.12},{threshold:0.75,threshold_tolerance:0.08},{threshold:1,threshold_tolerance:0.1}]}}]},
 {name:'ParkingBrake',description:'Master key (MasterKey lever: Uncouple 0 / Off 0.5 / On 1), On / Off',assignments:[{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0.5,hold:false,enable_api_fallback:true}}]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (SanderSwitch spring lever, rest 0.5)','SanderSwitch',1,0.5),
 mom('RightThrottleButton','Horn (HornPedal push button)','HornPedal',1,0),
 mom('LeftEngineOn','PZB Frei (PzbReleaseSwitch spring lever)','PzbReleaseSwitch',1,0.5),
 mom('RightEngineOn','PZB Wachsam (PzbAcknowledgeSwitch spring lever)','PzbAcknowledgeSwitch',1,0.5),
 {name:'RudderTrimLeft',description:'Doors | Left: DoorsSideSelectionSwitch to Unlock Left Side Doors (0.75) while held, Lock All (0) on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'DoorsSideSelectionSwitch',value:0.75,hold:false,enable_api_fallback:true},action_deactivate:{controls:'DoorsSideSelectionSwitch',value:0,hold:false,enable_api_fallback:true}}},
 {name:'RudderTrimRight',description:'Doors | Right: DoorsSideSelectionSwitch to Unlock Right Side Doors (0.25) while held, Lock All (0) on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'DoorsSideSelectionSwitch',value:0.25,hold:false,enable_api_fallback:true},action_deactivate:{controls:'DoorsSideSelectionSwitch',value:0,hold:false,enable_api_fallback:true}}},
 mom('RoundAuxButton','PZB Befehl 40 (PzbOverrideSwitch spring lever)','PzbOverrideSwitch',1,0.5),
 tog('LeftAuxButton','SiFa on / off (SIFA_IsolationSwitch lever: Normal 0 / Isolated 1). Lit = SiFa on (Normal). The service starts with it Isolated','SIFA_IsolationSwitch',0,1),
 tog('RightAuxButton','PZB fuse (PZBFuseControl push button, On 1 / Off 0). Lit = on','PZBFuseControl',1,0),
 {name:'RotaryCrank',description:'Wipers one notch down (Fast > Slow > Off > Intermittent; the switch order as swept)',assignments:[rel('WiperSwitch',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch up (Intermittent > Off > Slow > Fast)',assignments:[rel('WiperSwitch',0.333)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set(SL,0)]},
 {name:'AutoBrake1',description:'Lights | Headlights',assignments:[set(SL,1),set(HL,0.5)]},
 {name:'AutoBrake2',description:'Lights | Headlights bright (HeadlightsSwitch On)',assignments:[set(SL,1),set(HL,1)]},
 {name:'AutoBrake3',description:'Lights | Tail lights',assignments:[set(SL,0.5)]},
 {name:'AutoBrake4',description:'Lights | Off (second Off position of the switch)',assignments:[set(SL,0.75)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '),'centre',centre,'rapid',rapid,'rev',revSteps.join('/'));
const m={name:'tsw-br-642-dtg-thejag',title:'BR 642',eyebrow:'DB Regio · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Maintalbahn: Aschaffenburg – Miltenberg',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-642-dtg-cab.jpg',height:196,position:'50% 60%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Fahr-/Bremshebel',continuous:true,notches:['Max traction',null,'Min traction','0','Min brake',null,'Full brake'],start:6},
 rightThrottle:{name:'Führerbremsventil',notches:['Driving','Release','Hold','Braking','Rapid brake'],start:2},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Headlights'},{short:'2',desc:'Headlights bright'},{short:'3',desc:'Tail lights'},{short:'HI',desc:'Off'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'down',right:'up'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'off',up:'on'}},
setup:['Master key on (PARK BRK); battery on in the cab','Reverser from Neutral to Forward','SiFa on and PZB fuse on (aux squares), PZB mode in the cab','Lights to Headlights','Fahr-/Bremshebel in the brake zone (nearest you), Führerbremsventil at Hold; no AFB, the flap lever is free','Open the doors (RUD TRIM, hold the side you need)'],
depart:['Close doors (release RUD TRIM), check the signal and PZB','Führerbremsventil to Driving (far end)','Fahr-/Bremshebel through 0 into the traction zone, further for more power','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Fahr-/Bremshebel back through 0 into the brake zone, pull further for more','Stop: Fahr-/Bremshebel to full brake (nearest you)']};
fs.writeFileSync('tools/manual/trains/tsw-br-642-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
