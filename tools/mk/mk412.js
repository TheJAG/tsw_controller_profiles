const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4714930';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_NWB_DB_BR412_EW2-H_C.json','utf8')); const names=new Set(cap.controls.map(c=>c.name));
['Reverser','Throttle','TrainBrake','AFB_SetPoint','BatterySwitch','SandingControl','HornControl','PZB_Release','PZB_Acknowledge','PZB_Override','Sifa_Cutout','PZB_CutOut','WiperSpeedControl','HeadlightControl'].forEach(n=>{if(!names.has(n))throw new Error('missing '+n)});
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/_DB_BR412_(EW|MW|RW|TrW)/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse / Off / Neutral / Forward)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.333,0.666,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahren (Idle 0 / Ready 0.1 / power continuous 0.11..1), inverted (0 nearest the driver, power pushed away): full raw 0 ±0.035, zone 0.045..0.81, Ready 0.88 ±0.05, Idle 1 ±0.04',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.1,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.88,threshold_tolerance:0.05},{threshold:0.81,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.035}]}}]},
 {name:'RightThrottle',description:'Bremsen (Driving 0.1 / 1A 0.2 / 1B 0.275 / 2 0.35 / 3 0.425 / 4 0.5 / 5 0.575 / 6 0.65 / 7 0.725 / Full service 0.8 / Emergency 1; the passenger-emergency override below Driving is left out), plain: Driving at the far end, SB nearest; the eleven Class 171 bands',assignments:[{type:'direct_control',controls:'TrainBrake',input_value:{min:0.1,max:1,steps:[0.1,0.2,0.275,0.35,0.425,0.5,0.575,0.65,0.725,0.8,1],step_thresholds:JSON.parse(JSON.stringify(th11))}}]},
 {name:'FlapLever',description:'AFB V-Soll, continuous 0..1 (0 nearest the driver, inverted)',assignments:[{type:'direct_control',controls:'AFB_SetPoint',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Battery on / off (spring switch pulsed: 1 on, 0 off, rest 0.5)',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'BatterySwitch',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'BatterySwitch',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (lead)','SandingControl',1,0),
 mom('RightThrottleButton','Horn (high tone)','HornControl',1,0),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release',1,0),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override',1,0),
 tog('LeftAuxButton','SiFa cut-out (lit = cut out)','Sifa_Cutout',1,0),
 tog('RightAuxButton','PZB cut-out (lit = cut out)','PZB_CutOut',1,0),
 {name:'RotaryCrank',description:'Wipers one speed down (5 > 4 > 3 > 2 > 1 > Off)',assignments:[rel('WiperSpeedControl',-0.2)]},
 {name:'RotaryIgnStart',description:'Wipers one speed up (Off > 1 > 2 > 3 > 4 > 5)',assignments:[rel('WiperSpeedControl',0.2)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set('HeadlightControl',0)]},
 {name:'AutoBrake1',description:'Headlights | Bright',assignments:[set('HeadlightControl',0.5)]},
 {name:'AutoBrake2',description:'Headlights | Dim',assignments:[set('HeadlightControl',0.25)]},
 {name:'AutoBrake3',description:'Headlights | Full high beams',assignments:[set('HeadlightControl',1)]},
 {name:'AutoBrake4',description:'Headlights | Dipped high beams',assignments:[set('HeadlightControl',0.75)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.length+' classes');
const m={name:'tsw-br-412-dtg-thejag',title:'BR 412 ICE 4',eyebrow:'DB Fernverkehr · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Bahnstrecke Nürnberg – Würzburg',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-412-dtg-cab.jpg',height:196,position:'50% 55%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Off','Reverse'],start:2},
 leftThrottle:{name:'Fahren',continuous:true,notches:['Full',null,null,null,'Ready','Idle'],start:5},
 rightThrottle:{name:'Bremsen',notches:['Driving','1A','1B','2','3','4','5','6','7','Full service','Emergency'],start:9},
 flap:{name:'AFB V-Soll',continuous:true,notches:['Max',null,null,null,'0'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Bright'},{short:'2',desc:'Dim'},{short:'3',desc:'Full high'},{short:'HI',desc:'Dipped high'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa cut-out'}, rightAux:{name:'PZB cut-out'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Battery',flat:'off',up:'on'}},
setup:['Battery on (PARK BRK)','Richtungsschalter to Off, raise the pantograph and close the Hauptschalter in the cab','SiFa and PZB cut-outs off (aux squares unlit)','Headlights to Bright','AFB V-Soll on the flap lever to the wanted speed','Open doors (RUD TRIM)'],
depart:['Close doors, check the signal, PZB and LZB','Richtungsschalter to Forward','Bremsen to Driving','Fahren towards Full; the AFB holds the set speed','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Bremsen in steps towards Full service']};
fs.writeFileSync('tools/manual/trains/tsw-br-412-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
