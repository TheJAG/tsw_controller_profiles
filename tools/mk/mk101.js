const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679210';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR101_New$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const brakeSteps=[0.1,0.2,0.275,0.35,0.425,0.5,0.575,0.65,0.725,0.8,1];
if(th11.length!==brakeSteps.length) throw new Error('171 bands do not fit');
const SL='SignalLights_F',HB='HeadlightBrightness_F';
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse / Off / Neutral / Forward)',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:0,max:0.99,steps:[0,0.32,0.65,0.99],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter (Off 0 / Min 0.1 / continuous 0.11..0.99 / Max 1). Z (power) is at the far end of the quadrant, so the lever is inverted: Max raw 0 ±0.035, power zone 0.045..0.81, Min 0.88 ±0.05, Off 1 ±0.04',assignments:[{type:'direct_control',controls:'Throttle_F',input_value:{min:0,max:1,steps:[0,0.1,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.88,threshold_tolerance:0.05},{threshold:0.81,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.035}]}}]},
 {name:'RightThrottle',description:'Führerbremsventil (Running / 1A / 1B / 2 / 3 / 4 / 5 / 6 / 7 / Full service / Emergency), plain: FÜ at the far end, SB nearest; the eleven Class 171 bands (centred on the TCA detents)',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:0.1,max:1,steps:brakeSteps,step_thresholds:JSON.parse(JSON.stringify(th11))}}]},
 {name:'FlapLever',description:'AFB speed setter, continuous 0..200 km/h (V at the far end, inverted); switch the AFB on in the cab first',assignments:[{type:'direct_control',controls:'AFB_Speed_F',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Brake key (Führerbremsventil unlock) in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'BrakeKeyF',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'BrakeKeyF',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand','Sand_F',1,0.5),
 mom('RightThrottleButton','Horn','Horn_FL',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release_F',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge_F',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override_F',1,0),
 tog('LeftAuxButton','SiFa fuse (lit = on)','Sifa_FuseControl',1,0),
 tog('RightAuxButton','PZB fuse (lit = on)','PZB_FuseControl',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (On > Intermittent > Off)',assignments:[rel('WiperSwitch_F',-0.5)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Intermittent > On)',assignments:[rel('WiperSwitch_F',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set(SL,0.5)]},
 {name:'AutoBrake1',description:'Lights | Signal lights (Spitzensignal)',assignments:[set(SL,1),set(HB,0.33)]},
 {name:'AutoBrake2',description:'Lights | Headlights reduced',assignments:[set(SL,1),set(HB,0.66)]},
 {name:'AutoBrake3',description:'Lights | Headlights bright',assignments:[set(SL,1),set(HB,1)]},
 {name:'AutoBrake4',description:'Lights | Tail lights (Schlusslicht)',assignments:[set(SL,0)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-101-dtg-thejag',title:'BR 101',eyebrow:'DB Fernverkehr · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Schnellfahrstrecke Nürnberg – Ingolstadt',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-101-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Off','Reverse'],start:2},
 leftThrottle:{name:'Fahrschalter',continuous:true,notches:['Max (Z)',null,null,null,'Min','Off'],start:5},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1A','1B','2','3','4','5','6','7','Full service','Emergency'],start:9},
 flap:{name:'AFB speed',continuous:true,notches:['200 km/h',null,null,null,'0'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Signal lights'},{short:'2',desc:'Headlights reduced'},{short:'3',desc:'Headlights bright'},{short:'HI',desc:'Tail lights'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Brake key',flat:'out',up:'in'}},
setup:['Brake key in (PARK BRK), battery on','Richtungsschalter from Off to Neutral','Raise the pantograph and close the Hauptschalter in the cab','SiFa and PZB on (aux squares), PZB mode set','Lights to Signal lights or Headlights','AFB on in the cab if you drive with the speed setter; open doors (RUD TRIM)'],
depart:['Close doors, check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running, wait for the brakes to release','Fahrschalter towards Z, or set the AFB speed on the flap lever','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil towards SB in steps']};
fs.writeFileSync('tools/manual/trains/tsw-br-101-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
