const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680680';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_MKN_DB_BR111_C.json','utf8')); const names=new Set(cap.controls.map(c=>c.name));
['Reverser_F','Throttle_F','TrainBrake_F','LocoBrake_F','ReverserKey_F','BrakeKey_F','Sand_F','Horn_FR','PZB_Release_F','PZB_Acknowledge_F','PZB_Override_F','Sifa_FuseControl','PZB_FuseControl','WiperSwitch_FL','WiperSwitch_FR','SignalLights_F'].forEach(n=>{if(!names.has(n))throw new Error('missing '+n)});
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/_BR111$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const momA=(node,on,off)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter R / 0 / M / V (Reverse / Off / Neutral / Forward)',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:0,max:1,steps:[0,0.33,0.66,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter Auf / Ab (Off 0 / Ab = run down 0.17 / Halt = hold 0.3 / Auf = run up 0.4 / Power 0.5); Off nearest the driver, Auf away (inverted)',assignments:[{type:'direct_control',controls:'Throttle_F',input_value:{min:0,max:0.5,steps:[0,0.17,0.3,0.4,0.5],invert:true}}]},
 {name:'RightThrottle',description:'Führerbremsventil (Running 0.1 / 1 0.3 / 2 0.3833 / 3 0.4666 / 4 0.5499 / 5 0.6332 / 6 0.7165 / Full service 0.8 / Emergency 1), plain: release at the far end; bands centred on the TCA detents',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:0.1,max:1,steps:[0.1,0.3,0.3833,0.4666,0.5499,0.6332,0.7165,0.8,1],step_thresholds:[{threshold:0,threshold_tolerance:0.05},{threshold:0.12,threshold_tolerance:0.04},{threshold:0.22,threshold_tolerance:0.04},{threshold:0.31,threshold_tolerance:0.035},{threshold:0.44,threshold_tolerance:0.035},{threshold:0.56,threshold_tolerance:0.04},{threshold:0.724,threshold_tolerance:0.04},{threshold:0.84,threshold_tolerance:0.04},{threshold:1,threshold_tolerance:0.05}]}}]},
 {name:'FlapLever',description:'Zusatzbremse (Release -1 / Hold 0 / Apply continuous 0..1), plain: Release at the far end',assignments:[{type:'direct_control',controls:'LocoBrake_F',input_value:{min:-1,max:1,steps:[-1,0,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.1},{threshold:0.3,threshold_tolerance:0.1},{threshold:0.45,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Reverser key (master switch) and brake key in / out',assignments:[momA('ReverserKey_F',1,0),momA('BrakeKey_F',1,0)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand','Sand_F',1,0.5),
 mom('RightThrottleButton','Horn','Horn_FR',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release_F',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge_F',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override_F',1,0.5),
 tog('LeftAuxButton','SiFa fuse (lit = on)','Sifa_FuseControl',1,0),
 tog('RightAuxButton','PZB fuse (lit = on)','PZB_FuseControl',1,0),
 {name:'RotaryCrank',description:'Wipers one notch back (Interval slow > Interval fast > On > Off > Parked), both screens',assignments:[rel('WiperSwitch_FL',-0.25),rel('WiperSwitch_FR',-0.25)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on (Parked > Off > On > Interval fast > Interval slow), both screens',assignments:[rel('WiperSwitch_FL',0.25),rel('WiperSwitch_FR',0.25)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set('SignalLights_F',0.5)]},
 {name:'AutoBrake1',description:'Lights | Headlights (Spitzensignal)',assignments:[set('SignalLights_F',0.1667)]},
 {name:'AutoBrake4',description:'Lights | Tail lights (Schlusslicht)',assignments:[set('SignalLights_F',0.8333)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-111-dtg-thejag',title:'BR 111',eyebrow:'DB Regio · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Frankenbahn: Stuttgart – Heilbronn',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-111-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['V Forward','M Neutral','0 Off','R Reverse'],start:2},
 leftThrottle:{name:'Fahrschalter',notches:['Power','Auf (up)','Halt (hold)','Ab (down)','Off'],start:4},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1','2','3','4','5','6','Full service','Emergency'],start:7},
 flap:{name:'Zusatzbremse',continuous:true,notches:['Release','Hold',null,'Full'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Headlights'},{short:'2',desc:'–'},{short:'3',desc:'–'},{short:'HI',desc:'Tail lights'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'back',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key + brake key',flat:'out',up:'in'}},
setup:['Reverser key and brake key in (PARK BRK), battery on','Richtungsschalter from 0 to M','Raise the pantograph and close the Hauptschalter in the cab','SiFa and PZB on (aux squares), PZB mode set','Lights to Headlights','Open doors (RUD TRIM)'],
depart:['Close doors, check the signal and PZB','Richtungsschalter to V','Führerbremsventil to Running, release the Zusatzbremse','Fahrschalter to Auf to notch up, Halt to hold, Ab to notch down','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil towards Full service in steps']};
fs.writeFileSync('tools/manual/trains/tsw-br-111-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
