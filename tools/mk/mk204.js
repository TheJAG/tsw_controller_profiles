// DB BR 204 V 100 (Rivet Games for DTG, DB BR 204 loco add-on for Main-Spessart-Bahn), 2026-10-12. Derived from mk155.js / mk194.js.
// Two cabs with _F / _B nodes; IS_GetActiveCab answers false/false, so the F cab is wired by name. API probe: the Zb3 brake valve
// TrainBrake_F only moves with the push button BrakeKey_F at 0 (named "Active"; the loco loads with it at 1 = Inactive, which is
// why the sweep saw one notch), one gate per set: Running 0.1 / Off 0.2 / Minimum 0.26 / continuous to 0.9 Full service /
// Emergency 1; Release below Running never stores. The throttle (handwheel, LL and 1..6 at k/6) only moves with the reverser in
// Forward. The reverser stores 0 / 0.33 / 0.6 / 0.8 (max 0.8) and takes any value in a notch zone, so the profile uses even steps.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679060';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR204$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const thrSteps=[0,1,2,3,4,5,6].map(k=>+(k/6).toFixed(4));
// Taillight_FL/FR/BL/BR levers: Red 0 / Off 0.5 / White 1. HeadLight_F is an on/off push button that toggles on every value change
// through the mod: Off and the marker-only position send 0, the headlight positions send 1, so moving between headlight positions
// does not toggle it again.
const lights=(head,front,rear)=>[set('HeadLight_F',head),set('Taillight_FL',front),set('Taillight_FR',front),set('Taillight_BL',rear),set('Taillight_BR',rear)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser_F (Reverse 0 / Neutral 0.33 / Engine only 0.6 / Forward 0.8, any value in a zone stores), even steps 0 / 0.2667 / 0.5333 / 0.8, inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:0,max:0.8,steps:[0,0.2667,0.5333,0.8],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter handwheel Throttle_F: LL 0 and Fahrstufe 1..6 at k/6 (moves only with the reverser in Forward), inverted: 6 at the far end, LL nearest',assignments:[{type:'direct_control',controls:'Throttle_F',input_value:{min:0,max:1,steps:thrSteps,invert:true}}]},
 {name:'RightThrottle',description:'Führerbremsventil (Zb3) TrainBrake_F: Running 0.1 / Off (Abschluss) 0.2 / Minimum 0.26 / continuous service zone to 0.9 Full service / Emergency 1 (one gate per set; Release below Running never stores; needs the brake key, PARK BRK up), plain: Running at the far end, Emergency nearest. Running 0 ±0.08, Off 0.2 ±0.06, Minimum 0.31 ±0.05 (detent), free zone 0.38..0.80, Full service 0.88 ±0.05, Emergency 1 ±0.06',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:0.1,max:1,steps:[0.1,0.2,0.26,null,0.9,1],step_thresholds:[{threshold:0,threshold_tolerance:0.08},{threshold:0.2,threshold_tolerance:0.06},{threshold:0.31,threshold_tolerance:0.05},{threshold:0.38,threshold_end:0.8},{threshold:0.88,threshold_tolerance:0.05},{threshold:1,threshold_tolerance:0.06}]}}]},
 {name:'FlapLever',description:'Zusatzbremse EngineBrake_F: Released 0 / continuous / Full 0.98, plain: Release at the far end, Full nearest',assignments:[{type:'direct_control',controls:'EngineBrake_F',input_value:{min:0,max:0.98}}]},
 {name:'ParkingBrake',description:'Brake key BrakeKey_F (push button: Active 0 / Inactive 1; the Zb3 valve only moves at 0) and master key MasterKey_F (MasterSwitch push button On 1 / Off 0): PARK BRK up = both keys in',assignments:[pair('BrakeKey_F',0,1),pair('MasterKey_F',1,0)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (Sander_F push button)','Sander_F',1,0),
 mom('RightThrottleButton','Horn (ThrottleHorn_F push button)','ThrottleHorn_F',1,0),
 mom('LeftEngineOn','PZB Frei (PZB_Release_F push button)','PZB_Release_F',1,0),
 mom('RightEngineOn','PZB Wachsam (PZB_Acknowledge_F push button)','PZB_Acknowledge_F',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (PZB_Override_F push button)','PZB_Override_F',1,0),
 tog('LeftAuxButton','SiFa on / off (Sifa_Switch lever, On 0.88 / Off 0; the loco loads with it off). Lit = on','Sifa_Switch',1,0),
 tog('RightAuxButton','PZB on / off (PZB_Switch lever, On 0.83 / Off 0; the loco loads with it off; PZB_Mode O / M / U stays in the cab). Lit = on','PZB_Switch',1,0),
 {name:'RotaryCrank',description:'Wiper off (WiperSwitch_F push button, toggles on a value change: 0 sent)',assignments:[set('WiperSwitch_F',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (WiperSwitch_F push button: 1 sent; WiperSpeed_F stays in the cab)',assignments:[set('WiperSwitch_F',1)]},
 {name:'AutoBrake0',description:'Lights | Off (headlight 0, marker lamps Off)',assignments:lights(0,0.5,0.5)},
 {name:'AutoBrake1',description:'Lights | Front white marker lamps only',assignments:lights(0,1,0.5)},
 {name:'AutoBrake2',description:'Lights | Front: headlight and white marker lamps',assignments:lights(1,1,0.5)},
 {name:'AutoBrake3',description:'Lights | Front headlight and white lamps, rear red lamps',assignments:lights(1,1,0)},
 {name:'AutoBrake4',description:'Lights | Front headlight, white lamps at both ends (shunting)',assignments:lights(1,1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-204-rivet-thejag',title:'BR 204',eyebrow:'Railion · Rivet Games · TCA Quadrant Airbus',profileName:p.name,developer:'Rivet Games',route:'Main-Spessart-Bahn: Aschaffenburg – Gemünden',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-rivet-dbgrey.png',alt:'Rivet Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-204-rivet-cab.jpg',height:196,position:'50% 50%'},schematicHeight:560,
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Engine only','Neutral','Reverse'],start:2},
 leftThrottle:{name:'Fahrschalter',notches:['6','5','4','3','2','1','LL'],start:6},
 rightThrottle:{name:'Führerbremsventil',continuous:true,notches:['Running','Off','Minimum',null,'Full service','Emergency'],start:4},
 flap:{name:'Zusatzbremse',continuous:true,notches:['Release',null,null,null,'Full'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Markers'},{short:'2',desc:'Headlight'},{short:'3',desc:'Head + rear red'},{short:'HI',desc:'Shunting'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Brake key + master key',flat:'out',up:'in'}},
setup:['Battery, engine start and the gear selector (Shunting / Fast) in the cab','PARK BRK up: brake key and master key in (the Zb3 valve is locked without it)','SiFa and PZB on (aux squares; both load off), PZB mode in the cab','Reverser to Forward: the Fahrschalter only moves in Forward','Lights to Headlight, or Shunting (white both ends)','Zusatzbremse at Full, Führerbremsventil at Full service'],
depart:['Check the signal and PZB, release the handbrake in the cab','Führerbremsventil to Running (far end), then Off once released','Zusatzbremse to Release','Fahrschalter: push one Fahrstufe at a time, LL to 6','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Fahrschalter to LL, Führerbremsventil into the service zone; Emergency nearest you']};
fs.writeFileSync('tools/manual/trains/tsw-br-204-rivet-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
