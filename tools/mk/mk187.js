// DB BR 187 (Skyhook Games, TRAXX F140 AC3, Köln – Aachen). Older build than the DTG BR 147: combined handle
// ThrottleAndBrake_F runs 0..1 with the BR 440 geometry, the reverser is display-only through the API and is driven
// with the game keys W / S, the desk key is the ActivateCab_F / DeactivateCab_F push-button pair.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679170';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR187/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));p.name='TSW | BR 187 | Skyhook | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const pair=(onNode,onV,offNode,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:onNode,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:offNode,value:offV,hold:false,enable_api_fallback:true}});
const keyPair=(threshold,up,down)=>({type:'momentary',threshold,action_activate:{keys:up},action_deactivate:{keys:down}});
const brakeSteps=[0.1,0.2,0.275,0.35,0.425,0.5,0.575,0.65,0.725,0.8,1];
if(th11.length!==brakeSteps.length) throw new Error('171 bands do not fit');
const HL='HeadlightBrightness_F';
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter through the game keys (W = one step towards Forward, S = one step towards Backward): the reverser of this loco ignores the API. Forward at the far end (raw 0), Off in the middle, Backward nearest; each crossing of a third of the travel sends one key',assignments:[keyPair(0.66,'s','w'),keyPair(0.33,'s','w')]},
 {name:'LeftThrottle',description:'Fahr-/Bremsschalter, the combined handle 0..1: brake continuous 0..0.45, 0 at 0.46..0.52 (stored 0.5), min power 0.55 (10 %), power continuous 0.56..1. Power (T) is pushed away, brake (B) pulled towards you, so the lever is inverted: full power raw 0 +-0.04, power zone 0.045..0.46, 0 at 0.5 +-0.03, brake zone 0.54..0.955, full brake 1 +-0.04',assignments:[{type:'direct_control',controls:'ThrottleAndBrake_F',input_value:{min:0,max:1,steps:[0,null,0.5,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.54,threshold_tolerance:0},{threshold:0.5,threshold_tolerance:0.03},{threshold:0.46,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Fuehrerbremsventil (Running / 1A / 1B / 2 / 3 / 4 / 5 / 6 / 7 / Full service / Emergency), plain: Running at the far end, Emergency nearest; the eleven Class 171 bands (centred on the TCA detents)',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:0.1,max:1,steps:brakeSteps,step_thresholds:JSON.parse(JSON.stringify(th11))}}]},
 {name:'FlapLever',description:'AFB speed setter with the on/off on the lever itself: Off raw 0, 0 km/h 0.1, 10 km/h 0.25, then continuous to 140 km/h at 1 (5 km/h steps). 140 at the far end, so inverted: Off 1 +-0.04, 0 km/h 0.93 +-0.03, speed zone 0.88..0.04, 140 at 0 +-0.04',assignments:[{type:'direct_control',controls:'AFB_Speed_F',input_value:{min:0,max:1,steps:[0,0.1,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.93,threshold_tolerance:0.03},{threshold:0.88,threshold_end:0.04,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Desk key: up = Fuehrerstand aktivieren (ActivateCab_F push button), flat = DeactivateCab_F',assignments:[pair('ActivateCab_F',1,'ActivateCab_F',0),pair('DeactivateCab_F',0,'DeactivateCab_F',1)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (spring lever)','Sand_F',1,0.5),
 mom('RightThrottleButton','Horn high (spring lever)','Horn_FL',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release_F',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge_F',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override_F',1,0),
 tog('LeftAuxButton','SiFa fuse (lit = on)','Sifa_FuseControl',1,0),
 tog('RightAuxButton','PZB fuse (lit = on)','PZB_FuseControl',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Intermittent > Off)',assignments:[rel('WiperSwitch_F',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Intermittent > Slow > Fast)',assignments:[rel('WiperSwitch_F',0.333)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set(HL,0)]},
 {name:'AutoBrake1',description:'Lights | Signal lights reduced',assignments:[set(HL,0.25)]},
 {name:'AutoBrake2',description:'Lights | Signal lights normal',assignments:[set(HL,0.5)]},
 {name:'AutoBrake3',description:'Lights | Headlights reduced',assignments:[set(HL,0.75)]},
 {name:'AutoBrake4',description:'Lights | Headlights bright',assignments:[set(HL,1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-187-skyhook-thejag',title:'BR 187',eyebrow:'DB Cargo · Skyhook Games · TCA Quadrant Airbus',profileName:p.name,developer:'Skyhook Games',route:'Schnellfahrstrecke Köln – Aachen',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-skyhook-dbgrey.png',alt:'Skyhook Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-187-skyhook-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Off','Backward'],start:1},
 leftThrottle:{name:'Fahr-/Bremsschalter',continuous:true,notches:['Max power (T)',null,null,'0',null,null,'Max brake (B)'],start:3},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1A','1B','2','3','4','5','6','7','Full service','Emergency'],start:9},
 flap:{name:'AFB speed',continuous:true,notches:['140 km/h',null,null,null,'0','Off'],start:5},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'Off'},{short:'BTV',desc:'Signal dim'},{short:'LO',desc:'Signal'},{short:'2',desc:'Head dim'},{short:'3',desc:'Head bright'},{short:'HI',desc:'–'}],start:0},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Desk key',flat:'off',up:'active'}},
setup:['Battery on in the cab, parking brake released','PARK BRK up: Führerstand aktivieren','Raise the pantograph, close the Hauptschalter in the cab','SiFa and PZB on (aux squares), PZB mode set','Lights (AUTO BRK)','AFB: flap lever off Off and set the speed, or leave it Off'],
depart:['Check the signal and PZB','Richtungsschalter to Forward (the lever sends the game keys W / S)','Führerbremsventil to Running, wait for the brakes to release','Fahr-/Bremsschalter towards T, or set the AFB speed on the flap lever','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: handle towards B (E-brake), Führerbremsventil in steps']};
fs.writeFileSync('tools/manual/trains/tsw-br-187-skyhook-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
