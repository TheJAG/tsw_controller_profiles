// ÖBB 1020 (DTG, Mittenwaldbahn: the Austrian E 94, Mk2 pak), 2026-10-12. Derived from mk194.js: the same E94 handwheel
// (PowerController_F, Fahrstufe in TertiaryValue 0..18, pulses of 0.27 Stufe per set, winds only with the reverser engaged), the same
// reverser lock (MasterSwitch_F moves only at Fahrstufe 0, Reverse needs ReverserLockButton_F held) and loco brake (LocoBrakeValve_F
// Release 0 / Hold 0.5, Apply a spring). Differences (API probe): the brake valve TrainBrake_F is the ÖBB one, Shutdown 0 (loads there,
// cab only) / Running 0.3 (sets 0.15..0.35) / 1st application 0.45 / Service continuous 0.45..0.85 (output 0.25..0.8) / Emergency 1
// (0.95+), one gate per set, and it needs BrakeKey_F at 0 (Unlocked; loads 1) AND MasterKeySwitch_F at 1 (MasterSwitch lever, loads 0);
// SiFa reset is the SifaReset_F push button; PZB switches through the Indusi_MCB push button (Set 1 / Tripped 0); sanders are push
// buttons (FowardsSander_F); signal lights are SignalLight_Left/Top/Right_F and RedLight_Left/Right_F levers 0 / 1.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680170';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/OBB_1020_Mk2$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const PC='PowerController_F (E94Controller)';
const SF=['SignalLight_Left_F (Lever)','SignalLight_Top_F (Lever)','SignalLight_Right_F (Lever)'], RF=['RedLight_Left_F (Lever)','RedLight_Right_F (Lever)'];
// LightingSwitch_F: Off 0 / Half 0.5 / Full 1; the three SignalLight levers per end 0 / 1; TailLampRear 0 / 1.
const lights=(sw,front,red,tail)=>[set('LightingSwitch_F (IrregularLever)',sw),...SF.map(n=>set(n,front)),...RF.map(n=>set(n,red)),set('TailLampRear',tail)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter MasterSwitch_F (Reverse 0 / Off 0.5 / Forward 1), inverted: Forward at the far end. Moves only at Fahrstufe 0; Reverse needs the reverser lock button, held through PARK BRK',assignments:[{type:'direct_control',controls:'MasterSwitch_F (IrregularLever)',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter handwheel PowerController_F: a spring wheel (rest 0.5) that winds the tap changer up (1) or down (0), Fahrstufe 0..18 in TertiaryValue. Inverted: push to the far end to wind up, centre to hold, pull to wind down. Through the API one set pulses about a quarter Stufe; the mode switch holds the wheel instead. Wind up raw 0 ±0.25, Hold 0.5 ±0.2, Wind down 1 ±0.25',assignments:[{type:'direct_control',controls:PC,input_value:{min:0,max:1,steps:[0,0.5,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.25},{threshold:0.5,threshold_tolerance:0.2},{threshold:0,threshold_tolerance:0.25}]}}]},
 {name:'RightThrottle',description:'Führerbremsventil TrainBrake_F (ÖBB valve: Shutdown 0 stays in the cab / Running 0.3 / 1st application 0.45 / Service continuous to Full 0.85 / Emergency 1; one gate per set), inverted as the 153 brake: Emergency at the far end, Running nearest. Emergency raw 0 ±0.06, Full 0.16 ±0.05, free zone 0.24..0.78 (full down to 1st application), 1st application 0.84 ±0.04 (detent), Running 1 ±0.08. Needs the brake key and master key (PARK BRK up)',assignments:[{type:'direct_control',controls:'TrainBrake_F (IrregularLever)',input_value:{min:0.3,max:1,steps:[0.3,0.45,null,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.08},{threshold:0.84,threshold_tolerance:0.04},{threshold:0.78,threshold_end:0.24},{threshold:0.16,threshold_tolerance:0.05},{threshold:0,threshold_tolerance:0.06}]}}]},
 {name:'FlapLever',description:'Zusatzbremse LocoBrakeValve_F (Release 0 / Hold 0.5 / Apply 1, the Apply end is a spring position that never stored in the probe), plain: Release at the far end, Apply nearest: Release 0 ±0.15, Hold 0.5 ±0.15, Apply 1 ±0.15',assignments:[{type:'direct_control',controls:'LocoBrakeValve_F',input_value:{min:0,max:1,steps:[0,0.5,1],step_thresholds:[{threshold:0,threshold_tolerance:0.15},{threshold:0.5,threshold_tolerance:0.15},{threshold:1,threshold_tolerance:0.15}]}}]},
 {name:'ParkingBrake',description:'Master key MasterKeySwitch_F (lever, Unlocked 1 / Locked 0; loads Locked), brake key BrakeKey_F (Unlocked 0 / Locked 1; loads Locked) and the reverser lock ReverserLockButton_F (held 1 so the Richtungsschalter can go to Reverse): PARK BRK up = keys in, lock held',assignments:[pair('MasterKeySwitch_F (Lever)',1,0),pair('BrakeKey_F (Lever)',0,1),pair('ReverserLockButton_F (PushButton)',1,0)]},
 mom('GearLever','SiFa reset (SifaReset_F push button, held)','SifaReset_F (PushButton)',1,0),
 mom('LeftThrottleButton','Sand to the front (FowardsSander_F push button)','FowardsSander_F',1,0),
 mom('RightThrottleButton','Whistle (Whistle_F spring lever 0..1)','Whistle_F (Lever)',1,0),
 mom('LeftEngineOn','PZB Frei (Indusi_Release_F spring lever)','Indusi_Release_F',1,0.5),
 mom('RightEngineOn','PZB Wachsam (Indusi_Acknowledge_F spring lever)','Indusi_Acknowledge_F',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (Indusi_Override_F spring lever)','Indusi_Override_F',1,0.5),
 tog('LeftAuxButton','SiFa on / off (Sifa_StateSetter push button, Normal 1 / Isolated 0; it drives the isolating valve, MCB and Störschalter). Lit = on. The loco loads with the SiFa isolated','Sifa_StateSetter',1,0),
 tog('RightAuxButton','PZB (Indusi) on / off (Indusi_MCB push button, Set 1 / Tripped 0). Lit = on. The loco loads with it tripped; the mode selector D / P / U stays in the cab','Indusi_MCB',1,0),
 {name:'RotaryCrank',description:'Fahrschalter wind down: PowerController_F held at 0 while the mode switch is held left, back to the rest 0.5 on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:PC,value:0,hold:true},action_deactivate:{controls:PC,value:0.5,hold:false}}},
 {name:'RotaryIgnStart',description:'Fahrschalter wind up: PowerController_F held at 1 while the mode switch is held right, back to the rest 0.5 on release',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:PC,value:1,hold:true},action_deactivate:{controls:PC,value:0.5,hold:false}}},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0,0,0)},
 {name:'AutoBrake1',description:'Lights | Front: three lamps, half brightness',assignments:lights(0.5,1,0,0)},
 {name:'AutoBrake2',description:'Lights | Front: three lamps, full',assignments:lights(1,1,0,0)},
 {name:'AutoBrake3',description:'Lights | Front three lamps, rear tail lamp',assignments:lights(1,1,0,1)},
 {name:'AutoBrake4',description:'Lights | Front red lamps (tail at this end)',assignments:lights(1,0,1,0)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-oebb-1020-dtg-thejag',title:'1020 Krokodil',eyebrow:'ÖBB · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Mittenwaldbahn: Garmisch-Partenkirchen – Innsbruck',colors:{navy:'#3a3735',blue:'#6e6a67',red:'#E2002A',paper:'#f6f4f3'},logos:[{file:'../../assets/logo-oebb-grey.svg',alt:'ÖBB'},{file:'../../assets/logo-dtg-oebbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/oebb-1020-dtg-cab.jpg',height:196,position:'50% 50%'},schematicHeight:540,
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Off','Reverse'],start:1},
 leftThrottle:{name:'Fahrschalter',notches:['Wind up','Hold','Wind down'],start:1},
 rightThrottle:{name:'Führerbremsventil',continuous:true,notches:['Emergency','Full',null,'1st app.','Running'],start:1},
 flap:{name:'Zusatzbremse',notches:['Release','Hold','Apply'],start:1},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Whistle'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Front 3 half'},{short:'2',desc:'Front 3 full'},{short:'3',desc:'Front 3 + tail'},{short:'HI',desc:'Red (tail)'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Fahrstufe',left:'down',right:'up'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Keys + reverser lock',flat:'out',up:'in'}},
setup:['Pantograph, Hauptschalter, compressor and battery in the cab','PARK BRK up: master key and brake key in (the valve is locked without them), reverser lock held','SiFa and PZB on (aux squares; both load switched off), PZB mode in the cab','Richtungsschalter Off to Forward: it only moves at Fahrstufe 0','Lights to Front 3 full, or Front + rear for shunting','Zusatzbremse at Hold, Führerbremsventil at Full'],
depart:['Check the signal and PZB, release the handbrake in the cab','Führerbremsventil to Running once ready; Zusatzbremse to Release','Mode switch right winds the tap changer up (Fahrstufe 0..18), left down; the left lever does the same in pulses','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: wind down to Fahrstufe 0, Führerbremsventil into the service zone; Emergency at the far end','Stop: Zusatzbremse to Apply; the reverser only moves at Fahrstufe 0']};
fs.writeFileSync('tools/manual/trains/tsw-oebb-1020-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
