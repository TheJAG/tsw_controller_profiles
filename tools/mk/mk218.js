// DB BR 218 (Train Sim Germany, DB BR 218 Diesel Loco Add-On on Hauptstrecke Hamburg – Lübeck), 2026-10-12. Derived from mk612.js / mk155.js.
// Two cabs with _F / _B nodes (some _FL / _FR); IS_GetActiveCab false/false and GetActiveCab fails, so the F cab is wired by name.
// Capture: Reverser_F Reverse 0 / Off 0.33 / Neutral 0.66 / Forward 1 (zones take any value); Throttle_F snaps to k/15 (16 steps);
// TrainBrake_F 9 notches Running 0.1 / Off 0.3 / Minimum 0.3833 / 40..70 % 0.4666..0.7165 / Full service 0.8 / Emergency 1;
// LocoBrake_F -1..1 Release -1 / Hold 0, Apply never stores (spring); DynamicBrake_F 0 / k/7 (stays in the cab, the hydrodynamic
// brake lever); ShuntingControl_FL stays in the cab too. Keys ReverserKey_F (MasterSwitch push button) and BrakeKey_F (lever).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680090';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_TSG_DB_BR218_C.json','utf8'));
const lever=n=>Array.isArray(cap.levers)?cap.levers.find(l=>l.name===n):cap.levers[n];
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/TSG_DB_BR218$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const brakeSteps=lever('TrainBrake_F').notches.map(n=>n.snapped); // 0.1 / 0.3 / 0.3833 / 0.4666 / 0.5499 / 0.6332 / 0.7165 / 0.8 / 1
if(brakeSteps.length!==9) throw new Error('expected 9 brake notches, got '+brakeSteps.length);
const brakeTh=[{threshold:0,threshold_tolerance:0.06},{threshold:0.14,threshold_tolerance:0.06},{threshold:0.31,threshold_tolerance:0.06},{threshold:0.44,threshold_tolerance:0.05},{threshold:0.55,threshold_tolerance:0.05},{threshold:0.645,threshold_tolerance:0.035},{threshold:0.724,threshold_tolerance:0.04},{threshold:0.84,threshold_tolerance:0.05},{threshold:1,threshold_tolerance:0.06}];
const thrSteps=[...Array(16).keys()].map(k=>+(k/15).toFixed(4));
// SignalLightsProxy_F: Taillights 0 / Off 0.5 / Signal lights 1; HeadlightBrightness_F: Normal 0.5 / Reduced 1; TrainLights_F (coach lighting) Off 0.5 / On 1.
const lights=(proxy,bright,coach)=>[set('SignalLightsProxy_F',proxy),set('HeadlightBrightness_F',bright),set('TrainLights_F',coach)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter Reverser_F (Reverse 0 / Off 0.33 / Neutral 0.66 / Forward 1, any value in a zone stores), even thirds, inverted: Forward at the far end. Needs the reverser key (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:0,max:1,steps:[0,0.3333,0.6667,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrstufen handwheel Throttle_F, 16 steps 0..15 at k/15 (the game snaps to them), inverted: 15 at the far end, 0 nearest',assignments:[{type:'direct_control',controls:'Throttle_F',input_value:{min:0,max:1,steps:thrSteps,invert:true}}]},
 {name:'RightThrottle',description:'Führerbremsventil TrainBrake_F (Running 0.1 / Off 0.3 / Minimum 0.3833 / 40 % 0.4666 / 50 % 0.5499 / 60 % 0.6332 / 70 % 0.7165 / Full service 0.8 / Emergency 1; Release below Running never stores), plain: Running at the far end, Emergency nearest. Bands on the TCA detents: Running 0 ±0.06, Off 0.14 ±0.06, Minimum 0.31 ±0.06, 40 % 0.44 ±0.05, 50 % 0.55 ±0.05, 60 % 0.645 ±0.035, 70 % 0.724 ±0.04, Full service 0.84 ±0.05, Emergency 1 ±0.06. Needs the brake key (PARK BRK up)',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:brakeSteps[0],max:1,steps:brakeSteps,step_thresholds:brakeTh}}]},
 {name:'FlapLever',description:'Zusatzbremse LocoBrake_F (Release -1 / Hold 0 / Apply 1, the Apply end is a spring position that never stored in the probe), plain: Release at the far end, Apply nearest: Release 0 ±0.15, Hold 0.5 ±0.15, Apply 1 ±0.15',assignments:[{type:'direct_control',controls:'LocoBrake_F',input_value:{min:-1,max:1,steps:[-1,0,1],step_thresholds:[{threshold:0,threshold_tolerance:0.15},{threshold:0.5,threshold_tolerance:0.15},{threshold:1,threshold_tolerance:0.15}]}}]},
 {name:'ParkingBrake',description:'Reverser key ReverserKey_F (MasterSwitch push button, In 1 / Out 0) and brake key BrakeKey_F (lever, On 1 / Off 0): PARK BRK up = both keys in, reverser key first',assignments:[pair('ReverserKey_F',1,0),pair('BrakeKey_F',1,0)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (Sand_F spring lever, rest 0.5)','Sand_F',1,0.5),
 mom('RightThrottleButton','Horn (Horn_FL spring lever, rest 0.5)','Horn_FL',1,0.5),
 mom('LeftEngineOn','PZB Frei (PZB_Release_FL spring lever)','PZB_Release_FL',1,0.5),
 mom('RightEngineOn','PZB Wachsam (PZB_Acknowledge_FL spring lever)','PZB_Acknowledge_FL',1,0.5),
 {name:'RudderTrimLeft',description:'Doors | Left: DoorsSideSelectionSwitch_F to Unlock Left Side Doors (0.75) while held, Lock All (0) on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'DoorsSideSelectionSwitch_F',value:0.75,hold:false,enable_api_fallback:true},action_deactivate:{controls:'DoorsSideSelectionSwitch_F',value:0,hold:false,enable_api_fallback:true}}},
 {name:'RudderTrimRight',description:'Doors | Right: DoorsSideSelectionSwitch_F to Unlock Right Side Doors (0.25) while held, Lock All (0) on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'DoorsSideSelectionSwitch_F',value:0.25,hold:false,enable_api_fallback:true},action_deactivate:{controls:'DoorsSideSelectionSwitch_F',value:0,hold:false,enable_api_fallback:true}}},
 mom('RoundAuxButton','PZB Befehl 40 (PZB_Override_FL spring lever)','PZB_Override_FL',1,0.5),
 tog('LeftAuxButton','SiFa fuse (Sifa_FuseControl push button, On 1 / Off 0). Lit = on','Sifa_FuseControl',1,0),
 tog('RightAuxButton','PZB fuse (PZB_FuseControl push button, On 1 / Off 0; PZB mode U / M / O stays in the cab). Lit = on','PZB_FuseControl',1,0),
 {name:'RotaryCrank',description:'Wiper off (WiperValve_FL push button, Off 0)',assignments:[set('WiperValve_FL',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (WiperValve_FL push button, On 1; speed valve stays in the cab)',assignments:[set('WiperValve_FL',1)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0.5,0.5,0.5)},
 {name:'AutoBrake1',description:'Lights | Tail lights (red) at this end',assignments:lights(0,0.5,0.5)},
 {name:'AutoBrake2',description:'Lights | Signal lights, reduced brightness',assignments:lights(1,1,0.5)},
 {name:'AutoBrake3',description:'Lights | Signal lights, normal',assignments:lights(1,0.5,0.5)},
 {name:'AutoBrake4',description:'Lights | Signal lights normal and coach lighting on',assignments:lights(1,0.5,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '),'brake',brakeSteps.join('/'));
const m={name:'tsw-br-218-tsg-thejag',title:'BR 218',eyebrow:'DB Regio · Train Sim Germany · TCA Quadrant Airbus',profileName:p.name,developer:'Train Sim Germany',route:'Hauptstrecke Hamburg – Lübeck',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-tsg-dbgrey.png',alt:'Train Sim Germany'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-218-tsg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Off','Reverse'],start:2},
 leftThrottle:{name:'Fahrstufen',continuous:true,notches:['15',null,'10',null,'5',null,'0'],start:6},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','Off','Minimum','40 %','50 %','60 %','70 %','Full service','Emergency'],start:7},
 flap:{name:'Zusatzbremse',notches:['Release','Hold','Apply'],start:1},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Tail lights'},{short:'2',desc:'Signal, reduced'},{short:'3',desc:'Signal, normal'},{short:'HI',desc:'Signal + coaches'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser + brake key',flat:'out',up:'in'}},
setup:['Battery, engine groups 1 and 2, compressor and the gear (Fast / Slow) in the cab','PARK BRK up: reverser key and brake key in','SiFa and PZB fuses on (aux squares), PZB mode in the cab','Richtungsschalter from Off to Forward','Lights to Signal, normal (coach lighting with HI)','Zusatzbremse at Hold, Führerbremsventil at Full service'],
depart:['Doors: RUD TRIM left / right unlocks a side while held, release locks','Führerbremsventil to Running (far end), then Off once released','Zusatzbremse to Release','Fahrstufen: push the handwheel up a few steps at a time, 0 to 15','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Fahrstufen to 0, Führerbremsventil to 40..70 %; the hydrodynamic brake stays in the cab']};
fs.writeFileSync('tools/manual/trains/tsw-br-218-tsg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
