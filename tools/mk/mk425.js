const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679550';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_BRO_DB_BR425_Cab_Base_C.json','utf8')); const names=new Set(cap.controls.map(c=>c.name));
['Reverser','MasterController','ReverserKey','Sander','Horn','PZB_Release','PZB_Acknowledge','PZB_Override','Isolate_Sifa','Isolate_PZB','WiperSetting','Headlights','OperateLeftDoors','OperateRightDoors'].forEach(n=>{if(!names.has(n))throw new Error('missing '+n)});
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR425/.test(n)&&!(/_Base$/.test(n)&&!/Cab_Base$/.test(n)));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse / Out / Neutral / Forward)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.33,0.66,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined power / brake handle (Max brake 0.1 / brake % continuous 0.1..0.40 / Min brake 0.41 / 0 at 0.5 / Min power 0.59 / power % continuous 0.6..1; Emergency at 0 is left out on purpose). Fahren at the far end, Bremsen nearest, so the lever is inverted with the BR 440 geometry: max brake raw 1 ±0.04, brake zone 0.955..0.58, min brake 0.55 ±0.03, 0 at 0.5 ±0.02, min power 0.45 ±0.03, power zone 0.42..0.045, full 0 ±0.04',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0.1,max:1,steps:[0.1,null,0.41,0.5,0.59,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.58,threshold_tolerance:0},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.42,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Reverser key (master switch) in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'ReverserKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'ReverserKey',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand','Sander',1,0.5),
 mom('RightThrottleButton','Horn','Horn',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge',1,0.5),
 mom('RudderTrimLeft','Doors | Left','OperateLeftDoors',1,0),
 mom('RudderTrimRight','Doors | Right','OperateRightDoors',1,0),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override',1,0),
 tog('LeftAuxButton','SiFa isolation (lit = Isolated / unlit = on)','Isolate_Sifa',0,1),
 tog('RightAuxButton','PZB isolation (lit = Isolated / unlit = on)','Isolate_PZB',0,1),
 {name:'RotaryCrank',description:'Wipers one notch back (Intermittent > Lasting > P > Off)',assignments:[rel('WiperSetting',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on (Off > P > Lasting > Intermittent)',assignments:[rel('WiperSetting',0.333)]},
 {name:'AutoBrake0',description:'Headlights | Off / tail',assignments:[set('Headlights',0)]},
 {name:'AutoBrake1',description:'Headlights | Marker',assignments:[set('Headlights',0.5)]},
 {name:'AutoBrake3',description:'Headlights | High beam',assignments:[set('Headlights',1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-425-dtg-thejag',title:'BR 425',eyebrow:'DB Regio · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Bahnstrecke Bremen – Oldenburg',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-425-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Out','Reverse'],start:2},
 leftThrottle:{name:'Power / brake handle',continuous:true,notches:['Full power',null,'Power %','Min power','0','Min brake','Brake %',null,'Max brake'],start:8},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off / tail'},{short:'LO',desc:'Marker'},{short:'2',desc:'–'},{short:'3',desc:'High beam'},{short:'HI',desc:'–'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'back',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key',flat:'out',up:'in'}},
setup:['Reverser key in (PARK BRK), battery started in the cab','Handle fully back at Max brake','Raise the pantograph and close the Hauptschalter in the cab','PZB and SiFa on (aux squares unlit)','Headlights to Marker','Open doors (RUD TRIM)'],
depart:['Close doors, check the signal and PZB','Richtungsschalter to Forward','Handle forward through Min brake to 0, then Min power and continuous power','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: back past 0 into Min brake, continuous to Max brake','Doors: RUD TRIM left / right at the platform']};
fs.writeFileSync('tools/manual/trains/tsw-br-425-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
