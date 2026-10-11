// DB BR 155 (ex-DR 250), Press livery (DTG, Bahnstrecke Bremen – Oldenburg). Handwheel Fahrstufenschalter TapChanger_F
// (identifier Throttle): Fahrstufe k stores at 0.10 + 0.03 k for k = 0..30 (a Hold / Down zone below 0.1 is left out; a
// first API set from rest moves one step, later sets jump). DriversBrake_F: Running 0.1 / Off (lap) 0.2 / 45..85 % in
// 5 % steps (0.45..0.85) / Emergency 1 (Release below 0.05 is not storable). Reverser_F Reverse 0 / Neutral 0.5 / Forward 1
// (hand-probed; the sweep pressed the ReverserHandle_F MasterSwitch push button, and at 1 that LOCKS the reverser).
// Both the reverser and the brake valve only move with DriversBrakeKey_F (MoveToLap lever) at On 0.89. DirectBrake_F
// Release 0 / continuous / Full service 0.98. TractionForceSelector_F and BrakingForceSelector_F (continuous) stay in the cab.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679550';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_BRO_Press_BR155_C'}];p.name='TSW | BR 155 | DTG | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(onNode,onV,offNode,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:onNode,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:offNode,value:offV,hold:false,enable_api_fallback:true}});
const tapSteps=Array.from({length:31},(_,k)=>Math.round((0.1+0.03*k)*1e4)/1e4);
const brakeSteps=[0.1,0.2,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,1];
// band centres on the raw TCA axis (plain lever: Running at raw 0 = pushed away), the 0.31 and 0.724 detents carry 50 % and 75 %,
// the 0.44 and 0.84 detents fall in gaps (nothing is sent there)
const brakeCentres=[0,0.10,0.20,0.31,0.40,0.48,0.56,0.64,0.724,0.79,0.90,1];
const brakeTh=brakeCentres.map((c,i)=>({threshold:c,threshold_tolerance:(i===0||i===brakeCentres.length-1)?0.04:0.03}));
const HL='Headlight_F',LL='HeadlightLeft_F',RL='HeadlightRight_F',HB='HeadlightBrightness_F';
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse 0 / Neutral 0.5 / Forward 1), inverted: Forward at the far end. Moves only with the brake key in (PARK BRK up) and the ReverserHandle_F push button at 0',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrstufenschalter (handwheel), Fahrstufe 0..30 at 0.10 + 0.03 k, 31 equal bands; inverted: Fahrstufe 30 at the far end, 0 nearest. The game moves one step on the first set and jumps afterwards',assignments:[{type:'direct_control',controls:'TapChanger_F',input_value:{min:0.1,max:1,steps:tapSteps,invert:true}}]},
 {name:'RightThrottle',description:'Führerbremsventil (Running 0.1 / Abschluss 0.2 / 45 % 0.45 / 50 / 55 / 60 / 65 / 70 / 75 / 80 / 85 % 0.85 / Emergency 1; Release below 0.05 does not store), plain: Running at the far end, Emergency nearest; bands of +-0.03 with 50 % on the 0.31 detent and 75 % on the 0.724 detent',assignments:[{type:'direct_control',controls:'DriversBrake_F',input_value:{min:0.1,max:1,steps:brakeSteps,step_thresholds:brakeTh}}]},
 {name:'FlapLever',description:'Zusatzbremse (direct brake), Release 0 / continuous / Full service 0.98; plain: Release at the far end, full nearest',assignments:[{type:'direct_control',controls:'DirectBrake_F',input_value:{min:0,max:0.98}}]},
 {name:'ParkingBrake',description:'Brake key (DriversBrakeKey_F, MoveToLap lever) On 1 / Off 0: the reverser and the brake valve only move with it in',assignments:[pair('DriversBrakeKey_F',1,'DriversBrakeKey_F',0)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (push button)','Sand_F',1,0),
 mom('RightThrottleButton','Horn (push button)','Horn_FL',1,0),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release_F',1,0),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge_F',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override_F',1,0),
 tog('LeftAuxButton','SiFa rotary switch (lit = On at 0, off = Off at 0.25)','Sifa_Switch',0,0.25),
 tog('RightAuxButton','PZB switch (lit = Cut-In 0.94, off = Cut-Out 0)','PZB_Switch',1,0),
 {name:'RotaryCrank',description:'Wipers off',assignments:[set('WiperSwitch_FL',0)]},
 {name:'RotaryIgnStart',description:'Wipers on',assignments:[set('WiperSwitch_FL',1)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set(HL,0.5),set(LL,0.5),set(RL,0.5)]},
 {name:'AutoBrake1',description:'Lights | Marker lights (lower lamps white)',assignments:[set(HL,0.5),set(LL,1),set(RL,1)]},
 {name:'AutoBrake2',description:'Lights | Headlights dim',assignments:[set(HL,1),set(LL,1),set(RL,1),set(HB,0)]},
 {name:'AutoBrake3',description:'Lights | Headlights bright',assignments:[set(HL,1),set(LL,1),set(RL,1),set(HB,1)]},
 {name:'AutoBrake4',description:'Lights | Tail lights (lower lamps red)',assignments:[set(HL,0.5),set(LL,0),set(RL,0)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-155-dtg-thejag',title:'BR 155',eyebrow:'Press · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Bahnstrecke Bremen – Oldenburg',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-press-dbgrey.svg',alt:'Press'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-155-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Fahrstufenschalter',continuous:true,notches:['30',null,'20',null,'10',null,'0'],start:6},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','Abschluss','45 %','50 %','55 %','60 %','65 %','70 %','75 %','80 %','85 %','Emergency'],start:10},
 flap:{name:'Zusatzbremse',continuous:true,notches:['Release',null,null,null,'Full'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'Off'},{short:'BTV',desc:'Markers'},{short:'LO',desc:'Head dim'},{short:'2',desc:'Head bright'},{short:'3',desc:'Tail lights'},{short:'HI',desc:'–'}],start:0},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Brake key',flat:'out',up:'in'}},
setup:['Battery on, compressors to Automatic in the cab','PARK BRK up: brake key in, frees reverser + brake valve','Pantograph up and Hauptschalter on in the cab','SiFa and PZB on (aux squares), PZB mode set in the cab','Lights (AUTO BRK)','Fahrstufenschalter at 0 before moving the reverser'],
depart:['Check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running, wait for the brakes to release','Zusatzbremse to Release (flap lever away)','Fahrstufenschalter up step by step, watch the ammeter','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil in steps, Abschluss holds']};
fs.writeFileSync('tools/manual/trains/tsw-br-155-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
require('../apply_side.js').apply(f); // cab-side nodes to {SIDE:F:B} (2026-10-11)
