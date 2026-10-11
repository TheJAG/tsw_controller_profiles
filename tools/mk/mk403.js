const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679780';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_NJP_DB_ICE3_EndCar-0_C.json','utf8')); const names=new Set(cap.controls.map(c=>c.name));
['Reverser','Throttle','TrainBrake','AFB_Controller','Battery','Sand','Horn','PZB_Release','PZB_Acknowledge','PZB_Override','SifaIsolationSwitch','PZBIsolationSwitch','WiperControl','Headlights'].forEach(n=>{if(!names.has(n))throw new Error('missing '+n)});
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/_DB_ICE3_(EndCar|MiddleCar|TransformerCar|ConverterCar)/.test(n));
p.rail_class_information=[...new Set([...pak,'RVM_NJP_DB_ICE3_EndCar-0','RVM_NJP_DB_ICE3_EndCar-5'])].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const th10=[{threshold:0,threshold_tolerance:0.045},{threshold:0.1,threshold_tolerance:0.035},{threshold:0.2,threshold_tolerance:0.035},{threshold:0.31,threshold_tolerance:0.035},{threshold:0.44,threshold_tolerance:0.035},{threshold:0.535,threshold_tolerance:0.035},{threshold:0.63,threshold_tolerance:0.035},{threshold:0.724,threshold_tolerance:0.035},{threshold:0.84,threshold_tolerance:0.04},{threshold:1,threshold_tolerance:0.04}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse / Off / Forward)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter (Off 0 / Min 0.1 / power continuous 0.13..1), inverted (power pushed away from the driver): Max raw 0 ±0.035, zone 0.045..0.81, Min 0.88 ±0.05, Off 1 ±0.04',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.1,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.88,threshold_tolerance:0.05},{threshold:0.81,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.035}]}}]},
 {name:'RightThrottle',description:'Bremsen (Release 0 / 1A 0.09 / 2 0.27 / 3 0.36 / 4 0.45 / 5 0.54 / 6 0.63 / 7 0.72 / Full application 0.81 / Rapid braking 1; Bypass at -0.083 left out), plain: Release pushed away, Rapid nearest; bands centred on the TCA detents',assignments:[{type:'direct_control',controls:'TrainBrake',input_value:{min:0,max:1,steps:[0,0.09,0.27,0.36,0.45,0.54,0.63,0.72,0.81,1],step_thresholds:th10}}]},
 {name:'FlapLever',description:'AFB V-Soll, continuous 0..1 (0 / 10 km/h at 0.1 / target speed continuous), max at the far end (inverted)',assignments:[{type:'direct_control',controls:'AFB_Controller',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Battery on / off (spring switch pulsed: +1 on, -1 off)',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'Battery',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'Battery',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (lead)','Sand',1,0.5),
 mom('RightThrottleButton','Horn (high)','Horn',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override',1,0),
 tog('LeftAuxButton','SiFa isolation switch (lit = Isolated / unlit = On)','SifaIsolationSwitch',0,1),
 tog('RightAuxButton','PZB isolation switch (lit = Isolated / unlit = Normal)','PZBIsolationSwitch',0,1),
 {name:'RotaryCrank',description:'Wipers one notch back (Lasting > Intermittent > P > Off)',assignments:[rel('WiperControl',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on (Off > P > Intermittent > Lasting)',assignments:[rel('WiperControl',0.333)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set('Headlights',0)]},
 {name:'AutoBrake1',description:'Headlights | Normal',assignments:[set('Headlights',0.5)]},
 {name:'AutoBrake2',description:'Headlights | Dimmed',assignments:[set('Headlights',0.25)]},
 {name:'AutoBrake3',description:'Headlights | Normal high beams',assignments:[set('Headlights',1)]},
 {name:'AutoBrake4',description:'Headlights | Dimmed high beams',assignments:[set('Headlights',0.75)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-403-dtg-thejag',title:'BR 403 ICE 3',eyebrow:'DB Fernverkehr · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Schnellfahrstrecke Kassel – Würzburg',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-403-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Off','Reverse'],start:1},
 leftThrottle:{name:'Fahrschalter',continuous:true,notches:['Max',null,null,null,'Min','Off'],start:5},
 rightThrottle:{name:'Bremsen',notches:['Release','1A','2','3','4','5','6','7','Full application','Rapid braking'],start:8},
 flap:{name:'AFB V-Soll',continuous:true,notches:['Max',null,null,null,'0'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Normal'},{short:'2',desc:'Dimmed'},{short:'3',desc:'Normal high'},{short:'HI',desc:'Dimmed high'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa isolation'}, rightAux:{name:'PZB isolation'},
 modeSwitch:{name:'Wipers',left:'back',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Battery',flat:'off',up:'on'}},
setup:['Battery on (PARK BRK)','Richtungsschalter to Off, raise the pantograph and close the Hauptschalter in the cab','SiFa, PZB and LZB isolation switches off (aux squares unlit)','Headlights to Normal','AFB V-Soll on the flap lever to the wanted speed','Open doors (RUD TRIM)'],
depart:['Close doors, check the signal, PZB and LZB','Richtungsschalter to Forward','Bremsen to Release','Fahrschalter towards Max; the AFB holds the set speed','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Bremsen in steps towards Full application']};
fs.writeFileSync('tools/manual/trains/tsw-br-403-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
