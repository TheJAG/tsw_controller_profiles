// DB BR 194 / E 94 088 (DTG, BR 194 & E94 Railtour Pack: Linke Rheinstrecke 1984 and Pfälzische Ludwigsbahn), 2026-10-12.
// Derived from mk363.js / mk155.js. Two cabs with _F / _B nodes; GetActiveCab answers false/false, so the F cab is wired by name.
// Interlocks found by API probe: the Führerbremsventil TrainBrake_F only moves with the brake key BrakeKey_F at 0 (Unlocked; the
// loco loads with it at 1 = Locked), one gate per set; the Richtungsschalter MasterSwitch_F only moves at Fahrstufe 0 and needs
// ReverserLockButton_F held (1) for Reverse; the Fahrschalter PowerController_F (OBB_1020_PowerController_C) is a spring
// handwheel (rest 0.5) whose Fahrstufe is Property.TertiaryValue 0..18: it winds only with the reverser engaged, one API set to
// 1 / 0 pulses about 0.26 Stufe, a held set (mod hold, or Interacting + value) winds about 3 Stufen per second.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680420';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/(BR194|E94_088)$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const PC='PowerController_F (E94Controller)';
const SF=['SignalLight_Linke_F (Lever)','SignalLight_Ober_F (Lever)','SignalLight_Rechte_F (Lever)'], SB=['SignalLight_Linke_B (Lever)','SignalLight_Ober_B (Lever)','SignalLight_Rechte_B (Lever)'];
// LightingSwitch_F: Off 0 / Half 0.5 / Full 1; the three SignalLight levers per end 0 / 1; TailLampRear 0 / 1.
const lights=(sw,front,rear,tail)=>[set('LightingSwitch_F (IrregularLever)',sw),...SF.map(n=>set(n,front)),...SB.map(n=>set(n,rear)),set('TailLampRear',tail)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter MasterSwitch_F (Reverse 0 / Off 0.5 / Forward 1), inverted: Forward at the far end. Moves only at Fahrstufe 0; Reverse needs the reverser lock button, held through PARK BRK',assignments:[{type:'direct_control',controls:'MasterSwitch_F (IrregularLever)',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter handwheel PowerController_F: a spring wheel (rest 0.5) that winds the tap changer up (1) or down (0), Fahrstufe 0..18 in TertiaryValue. Inverted: push to the far end to wind up, centre to hold, pull to wind down. Through the API one set pulses about a quarter Stufe; the mode switch holds the wheel instead. Wind up raw 0 ±0.25, Hold 0.5 ±0.2, Wind down 1 ±0.25',assignments:[{type:'direct_control',controls:PC,input_value:{min:0,max:1,steps:[0,0.5,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.25},{threshold:0.5,threshold_tolerance:0.2},{threshold:0,threshold_tolerance:0.25}]}}]},
 {name:'RightThrottle',description:'Führerbremsventil TrainBrake_F (Release 0.2 / Neutral 0.32 / Lap 0.435 / Service 0.6 / Emergency 1; Overcharge below Release is a spring position and never stores; one gate per set), plain: Release at the far end, Emergency nearest. Bands on the TCA detents: Release 0 ±0.12, Neutral 0.31 ±0.1, Lap 0.5 ±0.08, Service 0.724 ±0.1, Emergency 1 ±0.1. Needs the brake key in (PARK BRK up)',assignments:[{type:'direct_control',controls:'TrainBrake_F (IrregularLever)',input_value:{min:0.2,max:1,steps:[0.2,0.32,0.435,0.6,1],step_thresholds:[{threshold:0,threshold_tolerance:0.12},{threshold:0.31,threshold_tolerance:0.1},{threshold:0.5,threshold_tolerance:0.08},{threshold:0.724,threshold_tolerance:0.1},{threshold:1,threshold_tolerance:0.1}]}}]},
 {name:'FlapLever',description:'Zusatzbremse LocoBrakeValve_F (Release 0 / Hold 0.5 / Apply 1, the Apply end is a spring position that never stored in the probe), plain: Release at the far end, Apply nearest: Release 0 ±0.15, Hold 0.5 ±0.15, Apply 1 ±0.15',assignments:[{type:'direct_control',controls:'LocoBrakeValve_F',input_value:{min:0,max:1,steps:[0,0.5,1],step_thresholds:[{threshold:0,threshold_tolerance:0.15},{threshold:0.5,threshold_tolerance:0.15},{threshold:1,threshold_tolerance:0.15}]}}]},
 {name:'ParkingBrake',description:'Brake key BrakeKey_F (Unlocked 0 / Locked 1: the Führerbremsventil only moves with it at 0) and the reverser lock ReverserLockButton_F (held 1 so the Richtungsschalter can go to Reverse): PARK BRK up = key in, lock held',assignments:[pair('BrakeKey_F (Lever)',0,1),pair('ReverserLockButton_F (PushButton)',1,0)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand to the front (Sanders_F lever: Off 0 / Front 0.5 / Rear 1)','Sanders_F',0.5,0),
 mom('RightThrottleButton','Whistle (Whistle_F spring lever 0..1)','Whistle_F (Lever)',1,0),
 mom('LeftEngineOn','PZB Frei (Indusi_Release_F spring lever)','Indusi_Release_F',1,0.5),
 mom('RightEngineOn','PZB Wachsam (Indusi_Acknowledge_F spring lever)','Indusi_Acknowledge_F',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (Indusi_Override_F spring lever)','Indusi_Override_F',1,0.5),
 tog('LeftAuxButton','SiFa on / off (Sifa_StateSetter push button, Normal 1 / Isolated 0; it drives the isolating valve, MCB and Störschalter). Lit = on. The loco loads with the SiFa isolated','Sifa_StateSetter',1,0),
 tog('RightAuxButton','PZB (Indusi) on / off (Indusi_Schalter push button, On 1 / Off 0). Lit = on. The loco loads with it off; the mode selector O / M stays in the cab','Indusi_Schalter',1,0),
 {name:'RotaryCrank',description:'Fahrschalter wind down: PowerController_F held at 0 while the mode switch is held left, back to the rest 0.5 on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:PC,value:0,hold:true},action_deactivate:{controls:PC,value:0.5,hold:false}}},
 {name:'RotaryIgnStart',description:'Fahrschalter wind up: PowerController_F held at 1 while the mode switch is held right, back to the rest 0.5 on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:PC,value:1,hold:true},action_deactivate:{controls:PC,value:0.5,hold:false}}},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0,0,0)},
 {name:'AutoBrake1',description:'Lights | Front: three lamps, half brightness',assignments:lights(0.5,1,0,0)},
 {name:'AutoBrake2',description:'Lights | Front: three lamps, full',assignments:lights(1,1,0,0)},
 {name:'AutoBrake3',description:'Lights | Front three lamps, rear tail lamp',assignments:lights(1,1,0,1)},
 {name:'AutoBrake4',description:'Lights | Front and rear: three lamps each (shunting)',assignments:lights(1,1,1,0)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-194-dtg-thejag',title:'BR 194 · E 94',eyebrow:'Deutsche Bundesbahn · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Linke Rheinstrecke: Mainz – Koblenz (1984) · Pfälzische Ludwigsbahn',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-194-dtg-cab.jpg',height:196,position:'50% 50%'},schematicHeight:540,
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Off','Reverse'],start:1},
 leftThrottle:{name:'Fahrschalter',notches:['Wind up','Hold','Wind down'],start:1},
 rightThrottle:{name:'Führerbremsventil',notches:['Release','Neutral','Lap','Service','Emergency'],start:3},
 flap:{name:'Zusatzbremse',notches:['Release','Hold','Apply'],start:1},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Whistle'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Front 3 half'},{short:'2',desc:'Front 3 full'},{short:'3',desc:'Front 3 + tail'},{short:'HI',desc:'Front + rear 3'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Fahrstufe',left:'down',right:'up'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Brake key + reverser lock',flat:'out',up:'in'}},
setup:['Pantograph, Hauptschalter, compressor and battery in the cab','PARK BRK up: brake key in (the Führerbremsventil is locked without it), reverser lock held','SiFa and PZB on (aux squares; both load switched off), PZB mode in the cab','Richtungsschalter Off to Forward: it only moves at Fahrstufe 0','Lights to Front 3 full, or Front + rear for shunting','Zusatzbremse at Hold, Führerbremsventil at Service'],
depart:['Check the signal and PZB, release the handbrake in the cab','Führerbremsventil to Release, then Neutral once the brakes are off; Zusatzbremse to Release','Mode switch right winds the tap changer up (Fahrstufe 0..18), left down; the left lever does the same in pulses','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: wind down to Fahrstufe 0, Führerbremsventil to Service; Emergency nearest you','Stop: Zusatzbremse to Apply; the reverser only moves at Fahrstufe 0']};
fs.writeFileSync('tools/manual/trains/tsw-br-194-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
