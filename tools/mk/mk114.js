const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680140';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_FTF_DB_BR114_C.json','utf8')); const names=new Set(cap.controls.map(c=>c.name));
['Reverser_F','ForceSelector_F','SpeedSelector_F','DriversBrake_F','ReverserHandle_F','BrakeKey_F','Sander_F','Horn_F','PZB_Release_F','PZB_Acknowledge_F','PZB_Override_F','Sifa_Switch','PZB_Switch','Wiper_FL','Wiper_FR','SignalLightLeft_F','SignalLightRight_F','SignalLightMiddle_F'].forEach(n=>{if(!names.has(n))throw new Error('missing '+n)});
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/_BR114$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const momA=(node,on,off)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const th10=[{threshold:0,threshold_tolerance:0.045},{threshold:0.1,threshold_tolerance:0.035},{threshold:0.2,threshold_tolerance:0.035},{threshold:0.31,threshold_tolerance:0.035},{threshold:0.44,threshold_tolerance:0.035},{threshold:0.535,threshold_tolerance:0.035},{threshold:0.63,threshold_tolerance:0.035},{threshold:0.724,threshold_tolerance:0.035},{threshold:0.84,threshold_tolerance:0.04},{threshold:1,threshold_tolerance:0.04}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse / Neutral / Forward)',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:-0.99,max:0.95,steps:[-0.99,-0.05,0.95],invert:true}}]},
 {name:'LeftThrottle',description:'Zugkraftsteller (force setter), continuous 0..1 (output 0..120 %); more force = push away (inverted)',assignments:[{type:'direct_control',controls:'ForceSelector_F',input_value:{min:0,max:1,invert:true}}]},
 {name:'RightThrottle',description:'Führerbremsventil DriversBrake_F (Running 0.1 / 1 0.275 / 2 0.3375 / 3 0.4 / 4 0.4625 / 5 0.525 / 6 0.5875 / 7 0.65 / Full service 0.75 / Emergency 1), plain: release at the far end; bands centred on the TCA detents',assignments:[{type:'direct_control',controls:'DriversBrake_F',input_value:{min:0.1,max:1,steps:[0.1,0.275,0.3375,0.4,0.4625,0.525,0.5875,0.65,0.75,1],step_thresholds:th10}}]},
 {name:'FlapLever',description:'AFB speed setter SpeedSelector_F (Off 0 / On 0.05 / 10..160 km/h continuous 0.125..1); 160 at the far end (inverted): full raw 0 ±0.03, speed zone 0.04..0.88, On 0.93 ±0.03, Off 1 ±0.03',assignments:[{type:'direct_control',controls:'SpeedSelector_F',input_value:{min:0,max:1,steps:[0,0.05,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.03},{threshold:0.93,threshold_tolerance:0.03},{threshold:0.88,threshold_end:0.04,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.03}]}}]},
 {name:'ParkingBrake',description:'Reverser handle (master switch) and brake key in / out',assignments:[momA('ReverserHandle_F',1,0),momA('BrakeKey_F',1,0)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (front)','Sander_F',1,0.5),
 mom('RightThrottleButton','Horn (high)','Horn_F',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release_F',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge_F',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override_F',1,0.5),
 tog('LeftAuxButton','SiFa switch (lit = on)','Sifa_Switch',1,0),
 tog('RightAuxButton','PZB switch (lit = on)','PZB_Switch',1,0),
 {name:'RotaryCrank',description:'Wipers off (both screens)',assignments:[set('Wiper_FL',0),set('Wiper_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (both screens)',assignments:[set('Wiper_FL',1),set('Wiper_FR',1)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set('SignalLightLeft_F',0.5),set('SignalLightRight_F',0.5),set('SignalLightMiddle_F',0)]},
 {name:'AutoBrake1',description:'Lights | White (Spitzensignal)',assignments:[set('SignalLightLeft_F',1),set('SignalLightRight_F',1),set('SignalLightMiddle_F',1)]},
 {name:'AutoBrake2',description:'Lights | White low (Rangierfahrt)',assignments:[set('SignalLightLeft_F',1),set('SignalLightRight_F',1),set('SignalLightMiddle_F',0)]},
 {name:'AutoBrake4',description:'Lights | Red (Schlusslicht)',assignments:[set('SignalLightLeft_F',0),set('SignalLightRight_F',0),set('SignalLightMiddle_F',0)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-114-dtg-thejag',title:'BR 114',eyebrow:'DB Regio · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Frankfurt – Fulda: Kinzigtalbahn',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-114-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Zugkraft (force)',continuous:true,notches:['100 %',null,null,null,null,'0'],start:5},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1','2','3','4','5','6','7','Full service','Emergency'],start:8},
 flap:{name:'AFB speed',continuous:true,notches:['160 km/h',null,null,'10','On','Off'],start:5},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'White'},{short:'2',desc:'White low'},{short:'3',desc:'–'},{short:'HI',desc:'Red'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser handle + brake key',flat:'out',up:'in'}},
setup:['Reverser handle and brake key in (PARK BRK), battery on','Richtungsschalter to Neutral','Raise the pantograph and close the Hauptschalter in the cab','SiFa and PZB on (aux squares), PZB mode set','Lights to White','AFB on (flap lever past Off), open doors (RUD TRIM)'],
depart:['Close doors, check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running','Set the AFB speed on the flap lever, push the force lever up: the loco holds the speed','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil in steps, force lever back to 0']};
fs.writeFileSync('tools/manual/trains/tsw-br-114-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
