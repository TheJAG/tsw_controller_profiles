const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679210';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/_BR103$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const momA=(node,on,off)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const SIG=['SignalLight_L_F','SignalLight_M_F','SignalLight_R_F'],TAIL=['TailLight_L_F','TailLight_R_F'];
const lights=(sig,tail)=>[...SIG.map(n=>set(n,sig)),...TAIL.map(n=>set(n,tail))];
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse / Off / Neutral / Forward)',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:0,max:1,steps:[0,0.33,0.66,1],invert:true}}]},
 {name:'LeftThrottle',description:'Nockenfahrschalter handwheel, 40 taps (0..39), more taps = push away (inverted). Taps 0..3 have their own wide bands so a departure in tap 1 or 2 is easy to select (user, 2026-10-16): 0 at raw 1 ±0.045, 1 at 0.905 ±0.03, 2 at 0.84 ±0.03 (FLX detent), 3 at 0.775 ±0.03; taps 3..39 continuous from raw 0.72 to 0.02 (the game snaps to k/39 itself), 39 at 0 ±0.02',assignments:[{type:'direct_control',controls:'Throttle_F',input_value:{min:0,max:1,steps:[0,0.0257,0.0513,0.077,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.045},{threshold:0.905,threshold_tolerance:0.03},{threshold:0.84,threshold_tolerance:0.03},{threshold:0.775,threshold_tolerance:0.03},{threshold:0.72,threshold_end:0.02,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.02}]}}]},
 {name:'RightThrottle',description:'Führerbremsventil (Release 0 / Running 0.1 / Off 0.2 / Minimum 0.3 / 0.4 / 0.5 / 0.6 / 0.7 / Full service 0.8 / Emergency 1), plain: Release (Füllstoß) at the far end, Emergency nearest; bands centred on the TCA detents. Release is a spring position the game only keeps while the value is held (API probe 2026-10-17: Interacting + value), so the assignment holds its value; the valve moves one gate per set and the held re-sends walk it through',assignments:[{type:'direct_control',controls:'TrainBrake_F',hold:true,input_value:{min:0,max:1,steps:[0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,1],step_thresholds:[{threshold:0,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.035},{threshold:0.2,threshold_tolerance:0.035},{threshold:0.31,threshold_tolerance:0.035},{threshold:0.44,threshold_tolerance:0.035},{threshold:0.535,threshold_tolerance:0.035},{threshold:0.63,threshold_tolerance:0.035},{threshold:0.724,threshold_tolerance:0.035},{threshold:0.84,threshold_tolerance:0.04},{threshold:1,threshold_tolerance:0.05}]}}]},
 {name:'FlapLever',description:'Zusatzbremse (Release -1 / Hold 0 / Apply continuous 0..1), plain: Release at the far end, full Apply nearest. Apply is a spring position the game drops back to Hold within a frame unless the value is held (API probe 2026-10-17: Interacting + value keeps 0.5 or 1 applied), so the assignment holds its value',assignments:[{type:'direct_control',controls:'LocoBrake_F',hold:true,input_value:{min:-1,max:1,steps:[-1,0,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.12},{threshold:0.3,threshold_tolerance:0.12},{threshold:0.5,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Reverser key (master switch) and brake key in / out',assignments:[momA('ReverserKey_F',1,0),momA('BrakeKey_F',1,0)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand','Sand_F',1,0.5),
 mom('RightThrottleButton','Horn','Horn_F',1,0),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release_F',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge_F',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override_F',1,0.5),
 tog('LeftAuxButton','SiFa fuse (lit = on)','Sifa_FuseControl',1,0),
 tog('RightAuxButton','PZB fuse (lit = on)','PZB_FuseControl',1,0),
 {name:'RotaryCrank',description:'Wipers off (both screens)',assignments:[set('WiperValve_FL',0),set('WiperValve_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (both screens)',assignments:[set('WiperValve_FL',1),set('WiperValve_FR',1)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Signal lights (Spitzensignal)',assignments:lights(1,0)},
 {name:'AutoBrake2',description:'Lights | Signal + tail (shunting)',assignments:lights(1,1)},
 {name:'AutoBrake3',description:'Lights | (unused)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Tail lights (Schlusslicht)',assignments:lights(0,1)},
];
p.controls=p.controls.filter(c=>c.name!=='AutoBrake3');
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-103-dtg-thejag',title:'BR 103',eyebrow:'Deutsche Bundesbahn · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Linke Rheinstrecke: Mainz – Koblenz',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bundesbahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-103-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Off','Reverse'],start:2},
 leftThrottle:{name:'Fahrschalter (taps)',continuous:true,notches:['39',null,null,null,null,null,'3','2','1','0'],start:9},
 rightThrottle:{name:'Führerbremsventil',notches:['Release','Running','Off','Minimum','4','5','6','7','Full service','Emergency'],start:8},
 flap:{name:'Zusatzbremse',continuous:true,notches:['Release','Hold',null,'Apply'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Signal lights'},{short:'2',desc:'Signal + tail'},{short:'3',desc:'–'},{short:'HI',desc:'Tail lights'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key + brake key',flat:'out',up:'in'}},
setup:['Reverser key and brake key in (PARK BRK), battery on','Richtungsschalter from Off to Neutral','Raise the pantograph and close the Hauptschalter in the cab','SiFa and PZB on (aux squares), PZB mode set','Lights to Signal lights','Open doors (RUD TRIM)'],
depart:['Close doors, check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running (hold it in Release for a Füllstoß), Zusatzbremse to Release','Handwheel to tap 1 or 2 to pull away, then up a few taps at a time, watch the traction current','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil towards 7 in steps']};
fs.writeFileSync('tools/manual/trains/tsw-br-103-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
require('../apply_side.js').apply(f); // cab-side nodes to {SIDE:F:B} (2026-10-11)
