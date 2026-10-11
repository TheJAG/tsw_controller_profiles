const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/DLCID';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR187/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));p.name='TSW | BR 187 | DTG | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const pair=(onNode,onV,offNode,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:onNode,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:offNode,value:offV,hold:false,enable_api_fallback:true}});
const brakeSteps=[0.1,0.2,0.275,0.35,0.425,0.5,0.575,0.65,0.725,0.8,1];
if(th11.length!==brakeSteps.length) throw new Error('171 bands do not fit');
const SL='SignalLights_F';
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse / Neutral / Forward), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'ReverserProxy_F',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahr-/Bremsschalter, the combined handle: E-brake -1..-0.1 / Off -0.1..0.1 / power 0.1..1, continuous (the game only snaps -0.05..0.04 to 0 and 0.05 to 0.1). Power (T) is pushed away, E-brake (B) pulled towards you, so the lever is inverted: full power raw 0 +-0.04, power zone 0.045..0.46, Off 0.5 +-0.03, E-brake zone 0.54..0.955, full E-brake 1 +-0.04',assignments:[{type:'direct_control',controls:'MasterController_F',input_value:{min:-1,max:1,steps:[-1,null,0,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.54,threshold_tolerance:0},{threshold:0.5,threshold_tolerance:0.03},{threshold:0.46,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Fuehrerbremsventil (Running / 1A / 1B / 2 / 3 / 4 / 5 / 6 / 7 / Full service / Emergency), plain: Running at the far end, Emergency nearest; the eleven Class 171 bands (centred on the TCA detents)',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:0.1,max:1,steps:brakeSteps,step_thresholds:JSON.parse(JSON.stringify(th11))}}]},
 {name:'FlapLever',description:'AFB speed setter with the on/off on the lever itself: Off raw 0, 0 km/h 0.05, then continuous to 160 km/h at 1 (5 km/h steps). 160 at the far end, so inverted: Off 1 +-0.04, 0 km/h 0.93 +-0.03, speed zone 0.88..0.04, 160 at 0 +-0.04',assignments:[{type:'direct_control',controls:'AFB_Speed_F',input_value:{min:0,max:1,steps:[0,0.05,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.93,threshold_tolerance:0.03},{threshold:0.88,threshold_end:0.04,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Desk key: up = Fuehrerstand aktivieren (push button) and Fuehrerbremsventil cut in; flat = cut out and desk off. A spawned or cold loco has the valve cut out and the power side of the handle locked until both are done',assignments:[pair('ActivateDriversCompartment_F',1,'ActivateDriversCompartment_F',0),pair('DeactivateDriversCompartment_F',0,'DeactivateDriversCompartment_F',1),pair('DriversBrakeCutoff_F',0,'DriversBrakeCutoff_F',1)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (spring lever)','Sand_F',1,0.5),
 mom('RightThrottleButton','Horn high (spring lever)','Horn_FL',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','LZB/PZB_Release_Desk_F',1,0),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','LZB/PZB_Acknowledge_Desk_F',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','LZB/PZB_Override_F',1,0),
 tog('LeftAuxButton','SiFa back-wall switch (lit = Normal, off = Isolated)','SIFA_Switch_F (BackWall)',1,0),
 tog('RightAuxButton','PZB back-wall switch (lit = Normal, off = Isolated)','PZB_Switch_F (BackWall)',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Intermittent > Off)',assignments:[rel('Wiper_F',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Intermittent > Slow > Fast)',assignments:[rel('Wiper_F',0.333)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set(SL,0)]},
 {name:'AutoBrake1',description:'Lights | Signal dim',assignments:[set(SL,0.25)]},
 {name:'AutoBrake2',description:'Lights | Signal lights',assignments:[set(SL,0.5)]},
 {name:'AutoBrake3',description:'Lights | High dim',assignments:[set(SL,0.75)]},
 {name:'AutoBrake4',description:'Lights | High beams',assignments:[set(SL,1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-187-dtg-thejag',title:'BR 187',eyebrow:'DB Cargo · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'ROUTE',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-187-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Fahr-/Bremsschalter',continuous:true,notches:['Max power (T)',null,null,'0',null,null,'Max brake (B)'],start:3},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1A','1B','2','3','4','5','6','7','Full service','Emergency'],start:9},
 flap:{name:'AFB speed',continuous:true,notches:['160 km/h',null,null,null,'0','Off'],start:5},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'Off'},{short:'BTV',desc:'Signal dim'},{short:'LO',desc:'Signal'},{short:'2',desc:'High dim'},{short:'3',desc:'High'},{short:'HI',desc:'–'}],start:0},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Desk key',flat:'off',up:'active'}},
setup:['Battery on in the cab, parking brake released','PARK BRK up: desk active and Führerbremsventil cut in','Raise the pantograph, close the Hauptschalter in the cab','SiFa and PZB on (aux squares), PZB mode set','Lights (AUTO BRK)','AFB: flap lever off Off and set the speed, or leave it Off'],
depart:['Check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running, wait for the brakes to release','Fahr-/Bremsschalter towards T, or set the AFB speed on the flap lever','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: handle towards B (E-brake), Führerbremsventil in steps']};
fs.writeFileSync('tools/manual/trains/tsw-br-187-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
