const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679210';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/_BR140_8$/.test(n));
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
 {name:'LeftThrottle',description:'Nockenfahrschalter handwheel, 29 taps (0..28): sent continuously, the game snaps to k/28 itself; more taps = push away (inverted)',assignments:[{type:'direct_control',controls:'Throttle_F',input_value:{min:0,max:1,invert:true}}]},
 {name:'RightThrottle',description:'Führerbremsventil (Running 0.1 / Off 0.2 / Minimum 0.3 / 0.4 / 0.5 / 0.6 / 0.7 / Full service 0.8 / Emergency 1), plain: F (release) at the far end, 7 nearest; bands centred on the TCA detents',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:0.1,max:1,steps:[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,1],step_thresholds:[{threshold:0,threshold_tolerance:0.05},{threshold:0.12,threshold_tolerance:0.04},{threshold:0.22,threshold_tolerance:0.04},{threshold:0.31,threshold_tolerance:0.035},{threshold:0.44,threshold_tolerance:0.035},{threshold:0.56,threshold_tolerance:0.04},{threshold:0.724,threshold_tolerance:0.04},{threshold:0.84,threshold_tolerance:0.04},{threshold:1,threshold_tolerance:0.05}]}}]},
 {name:'FlapLever',description:'Zusatzbremse (Release -1 / Hold 0 / Apply continuous 0..1), plain: Release at the far end',assignments:[{type:'direct_control',controls:'LocoBrake_F',input_value:{min:-1,max:1,steps:[-1,0,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.1},{threshold:0.3,threshold_tolerance:0.1},{threshold:0.45,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
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
const m={name:'tsw-br-140-dtg-thejag',title:'BR 140',eyebrow:'DB Cargo · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Frankenbahn: Stuttgart – Heilbronn',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'DB Cargo'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-140-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Off','Reverse'],start:2},
 leftThrottle:{name:'Fahrschalter (taps)',continuous:true,notches:['28',null,null,null,null,'0'],start:5},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','Off','Minimum','4','5','6','7','Full service','Emergency'],start:7},
 flap:{name:'Zusatzbremse',continuous:true,notches:['Release','Hold',null,'Full'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Signal lights'},{short:'2',desc:'Signal + tail'},{short:'3',desc:'–'},{short:'HI',desc:'Tail lights'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key + brake key',flat:'out',up:'in'}},
setup:['Reverser key and brake key in (PARK BRK), battery on','Richtungsschalter from Off to Neutral','Raise the pantograph and close the Hauptschalter in the cab','SiFa and PZB on (aux squares), PZB mode set','Lights to Signal lights','Check the wagons, release the handbrakes'],
depart:['Check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running, release the Zusatzbremse','Turn the handwheel up a few taps at a time, watch the traction current','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil towards 7 in steps']};
fs.writeFileSync('tools/manual/trains/tsw-br-140-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
