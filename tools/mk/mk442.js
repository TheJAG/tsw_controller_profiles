const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_DLG_DB_BR442_T2_C.json','utf8'));
const names=new Set(cap.controls.map(c=>c.name));
['ThrottleAndBrake','Reverser','MasterSwitch','Sander','HornHigh','PZBAcknowledge','PZBRelease','PZBOverride','SifaIsolationSwitch','PZBIsolationSwitch','Wipers','Headlights/TailLights','PassengerDoorsLeft','PassengerDoorsRight'].forEach(n=>{if(!names.has(n))throw new Error('missing '+n)});
p.name='TSW | BR 442 | DTG | TheJAG';
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/_DB_BR442_/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse 0 / Neutral 0.5 / Forward 1), inverted: Forward at the far end. It only moves after the master switch has been set to On (cycle PARK BRK once if it stays in Neutral)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined power / brake handle (Max brake -1 / brake % continuous -0.95..-0.2 / Min brake -0.2 (5 %) / 0 / Min power 0.2 (5 %) / power % continuous 0.2..1; Emergency at -1.29 is left out on purpose). Assumed Fahren at the far end and Bremsen nearest as on the BR 440, so the lever is inverted with the BR 440 geometry: max brake raw 1 +-0.04, brake zone 0.955..0.58, min brake 0.55 +-0.03, 0 at 0.5 +-0.02, min power 0.45 +-0.03, power zone 0.42..0.045, full 0 +-0.04',assignments:[{type:'direct_control',controls:'ThrottleAndBrake',input_value:{min:-1,max:1,steps:[-1,null,-0.2,0,0.2,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.58,threshold_tolerance:0},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.42,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master switch On / Off (Uncouple local -1 / Off 0 / On 1 / Couple 2)',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterSwitch',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterSwitch',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (spring switch: Sanding 0 while held, rest 0.5)','Sander',0,0.5),
 mom('RightThrottleButton','Horn (high tone)','HornHigh',1,0),
 mom('LeftEngineOn','PZB Frei (release)','PZBRelease',1,0),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZBAcknowledge',1,0),
 mom('RudderTrimLeft','Doors | Left','PassengerDoorsLeft',1,0),
 mom('RudderTrimRight','Doors | Right','PassengerDoorsRight',1,0),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZBOverride',1,0),
 tog('LeftAuxButton','SiFa isolation (lit = Isolated / unlit = on)','SifaIsolationSwitch',0,1),
 tog('RightAuxButton','PZB isolation (lit = Isolated / unlit = on)','PZBIsolationSwitch',0,1),
 {name:'RotaryCrank',description:'Wipers one notch back (six positions, 0.2 steps)',assignments:[rel('Wipers',-0.2)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on (six positions, 0.2 steps)',assignments:[rel('Wipers',0.2)]},
 {name:'AutoBrake0',description:'Headlights | Off / tail',assignments:[set('Headlights/TailLights',0)]},
 {name:'AutoBrake1',description:'Headlights | Marker',assignments:[set('Headlights/TailLights',0.3333)]},
 {name:'AutoBrake2',description:'Headlights | Dimmed',assignments:[set('Headlights/TailLights',0.6666)]},
 {name:'AutoBrake3',description:'Headlights | High',assignments:[set('Headlights/TailLights',1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-442-dtg-thejag',title:'BR 442 Talent 2',eyebrow:'DB Regio · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Bahnstrecke Leipzig – Dresden',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-442-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Power / brake handle',continuous:true,notches:['Full power',null,'Power %','Min power','0','Min brake','Brake %',null,'Max brake'],start:8},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Headlights/TailLights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off / tail'},{short:'LO',desc:'Marker'},{short:'2',desc:'Dimmed'},{short:'3',desc:'High'},{short:'HI',desc:'–'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'back',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master switch',flat:'off',up:'on'}},
setup:['Master switch On (PARK BRK), battery on in the cab','Handle fully back at Max brake, train brake valve at Hold in the cab','Raise the pantograph and close the Hauptschalter in the cab','PZB and SiFa on (aux squares unlit)','Headlights to Marker','Open doors (RUD TRIM)'],
depart:['Close doors, check the signal and PZB','Richtungsschalter to Forward (cycle the master switch once if it stays in Neutral)','Handle forward through Min brake to 0, then Min power and continuous power','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: back past 0 into Min brake, continuous to Max brake','Doors: RUD TRIM left / right at the platform']};
fs.writeFileSync('tools/manual/trains/tsw-br-442-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
