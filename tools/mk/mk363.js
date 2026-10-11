// DB BR 363 V 60 shunter (DTG, Maintalbahn), 2026-10-12. Derived from mk642.js / mk101.js.
// One cab with two desks: nodes carry _L / _R (the capture and desk photo are the left desk, wired here); GetActiveCab fails on
// this loco, so no {SIDE} placeholder. The reverser handles Reverser_L/_R are visual: ReverserProxy (-1 / 0 / 1) drives them.
// Throttle_L/_R are PowerHandle_C (capture_train.js matches "Handle" since 2026-10-12): Idle 0 / 0.33 / 0.67, one notch per
// API set; the fourth named output (3) never stored in the probe (master key on, gear Shunting, reverser Forward).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679870';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_MAIN_DBB_BR363_C.json','utf8'));
const lever=n=>Array.isArray(cap.levers)?cap.levers.find(l=>l.name===n):cap.levers[n];
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR363$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const brake=lever('DriversBrakeValve_L').notches; // Driving 0.25 / Handle Off 0.41 / Lap 0.57 / Service Apply 0.73 / Emergency 0.952 (Release never stored)
const brakeSteps=brake.map(n=>n.snapped);
if(brakeSteps.length!==5) throw new Error('expected 5 brake notches, got '+brakeSteps.length);
const thrSteps=lever('Throttle_L').notches.map(n=>n.snapped); // 0 / 0.33 / 0.67
const F=['Headlight_FC','Headlight_FL','Headlight_FR'], B=['Headlight_BC','Headlight_BL','Headlight_BR'];
const lights=(front,rear)=>[...F.map(n=>set(n,front)),...B.map(n=>set(n,rear))];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser through ReverserProxy (Reverse -1 / Neutral 0 / Forward 1; Reverser_L/_R are the visual handles it drives), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'ReverserProxy',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter Throttle_L (Idle 0 / Stufe 1 0.33 / Stufe 2 0.67; the game moves it one notch per set, a fourth notch never stored). Inverted: Stufe 2 at the far end, Idle nearest: Idle raw 1 ±0.15, Stufe 1 0.5 ±0.15, Stufe 2 0 ±0.15',assignments:[{type:'direct_control',controls:'Throttle_L',input_value:{min:0,max:0.67,steps:thrSteps,invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.15},{threshold:0.5,threshold_tolerance:0.15},{threshold:0,threshold_tolerance:0.15}]}}]},
 {name:'RightThrottle',description:'Führerbremsventil DriversBrakeValve_L (Driving 0.25 / Handle Off 0.41 / Lap 0.57 / Service Apply 0.73 / Emergency 0.952; Release below Driving never stores), plain: Driving at the far end, Emergency nearest. Bands centred on the TCA detents: Driving 0 ±0.12, Handle Off 0.31 ±0.1, Lap 0.5 ±0.08, Service 0.724 ±0.1, Emergency 1 ±0.1',assignments:[{type:'direct_control',controls:'DriversBrakeValve_L',input_value:{min:brakeSteps[0],max:brakeSteps[4],steps:brakeSteps,step_thresholds:[{threshold:0,threshold_tolerance:0.12},{threshold:0.31,threshold_tolerance:0.1},{threshold:0.5,threshold_tolerance:0.08},{threshold:0.724,threshold_tolerance:0.1},{threshold:1,threshold_tolerance:0.1}]}}]},
 {name:'FlapLever',description:'Zusatzbremse IndependentBrakeValve_L (Release -1 / Hold 0 / Apply 1, the Apply end is a spring position that pulses), plain: Release at the far end, Apply nearest: Release 0 ±0.15, Hold 0.5 ±0.15, Apply 1 ±0.15',assignments:[{type:'direct_control',controls:'IndependentBrakeValve_L',input_value:{min:-1,max:1,steps:[-1,0,1],step_thresholds:[{threshold:0,threshold_tolerance:0.15},{threshold:0.5,threshold_tolerance:0.15},{threshold:1,threshold_tolerance:0.15}]}}]},
 {name:'ParkingBrake',description:'Master key (MasterKey lever: Off 0 / On 1)',assignments:[{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0,hold:false,enable_api_fallback:true}}]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand to the front (Sand_L spring lever, rest 0.5; -1 would sand the rear)','Sand_L',1,0.5),
 mom('RightThrottleButton','Horn (Horn_L spring lever, rest 0.5)','Horn_L',1,0.5),
 mom('LeftEngineOn','PZB Frei (PZB_Release_L spring lever)','PZB_Release_L',1,0.5),
 mom('RightEngineOn','PZB Wachsam (PZB_Acknowledge_L spring lever)','PZB_Acknowledge_L',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (PZB_Override_L spring lever)','PZB_Override_L',1,0.5),
 tog('LeftAuxButton','SiFa fuse (Fuse_Sifa push button, On 1 / Off 0). Lit = on','Fuse_Sifa',1,0),
 tog('RightAuxButton','PZB breaker (PZB_Breaker push button, On 1 / Off 0; the PZB cut valve PZBCutValve_L stays in the cab). Lit = on','PZB_Breaker',1,0),
 {name:'RotaryCrank',description:'Wiper off (WiperValve_FL, front-left window of the left desk)',assignments:[set('WiperValve_FL',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (WiperValve_FL)',assignments:[set('WiperValve_FL',1)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front: two lamps (FL + FR)',assignments:[set('Headlight_FC',0),set('Headlight_FL',1),set('Headlight_FR',1),...B.map(n=>set(n,0))]},
 {name:'AutoBrake2',description:'Lights | Front: three lamps',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Rear: three lamps',assignments:lights(0,1)},
 {name:'AutoBrake4',description:'Lights | Front and rear: three lamps each (shunting)',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '),'brake',brakeSteps.join('/'),'thr',thrSteps.join('/'));
const m={name:'tsw-br-363-dtg-thejag',title:'BR 363',eyebrow:'DB Cargo · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Maintalbahn: Aschaffenburg – Miltenberg',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-363-dtg-cab.jpg',height:196,position:'50% 55%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Fahrschalter',notches:['Stufe 2','Stufe 1','Idle'],start:2},
 rightThrottle:{name:'Führerbremsventil',notches:['Driving','Handle off','Lap','Service','Emergency'],start:3},
 flap:{name:'Zusatzbremse',notches:['Release','Hold','Apply'],start:1},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Front 2 lamps'},{short:'2',desc:'Front 3 lamps'},{short:'3',desc:'Rear 3 lamps'},{short:'HI',desc:'Front + rear'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'off',up:'on'}},
setup:['Master key on (PARK BRK); engine start, fuel pump and the Stufe selector (Long distance / Shunting) in the cab','Reverser from Neutral to Forward','SiFa and PZB on (aux squares)','Lights to Front 3 lamps, or Front + rear for shunting','Zusatzbremse at Hold, Führerbremsventil at Lap','The profile drives the left desk (Throttle_L, DriversBrakeValve_L): sit at that desk'],
depart:['Check the signal and PZB, release the handbrake in the cab','Führerbremsventil to Driving (far end), wait for the brakes to release','Zusatzbremse to Release','Fahrschalter to Stufe 1, then Stufe 2 (one notch per step)','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil to Service, or the Zusatzbremse towards Apply (spring, pulse it)']};
fs.writeFileSync('tools/manual/trains/tsw-br-363-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
