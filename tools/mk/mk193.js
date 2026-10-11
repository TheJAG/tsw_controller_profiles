// DB BR 193 Vectron (DTG, Frankfurt – Fulda). The DTG 147 pattern: MasterController_F -1..1 continuous, Reverser_F
// 0 / 0.5 / 1, AFB_Speed_F 0..1 = 0..200 km/h with no Off notch (AFB on/off and confirm are push buttons), the key is
// MasterKey_F plus the DriversBrakeCutOut_F push button (a service starts with the valve cut out and PZB / SiFa isolated).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680140';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/_DB_Vectron$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));p.name='TSW | BR 193 Vectron | DTG | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const pair=(onNode,onV,offNode,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:onNode,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:offNode,value:offV,hold:false,enable_api_fallback:true}});
const brakeSteps=[0.1,0.19,0.28,0.37,0.46,0.54,0.63,0.72,0.81,0.9,1];
if(th11.length!==brakeSteps.length) throw new Error('171 bands do not fit');
const HL='ExteriorLightBrightness_F';
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse / Neutral / Forward), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahr-/Bremsschalter, the combined handle: E-brake -1..-0.1 / Off -0.1..0.1 / power 0.1..1, continuous (the game only snaps -0.05..0.04 to 0 and 0.05 to 0.1). Power is pushed away, E-brake pulled towards you, so the lever is inverted: full power raw 0 +-0.04, power zone 0.045..0.46, Off 0.5 +-0.03, E-brake zone 0.54..0.955, full E-brake 1 +-0.04',assignments:[{type:'direct_control',controls:'MasterController_F',input_value:{min:-1,max:1,steps:[-1,null,0,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.54,threshold_tolerance:0},{threshold:0.5,threshold_tolerance:0.03},{threshold:0.46,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Fuehrerbremsventil (Running 0.1 / 1A 0.19 / 1B 0.28 / 2 0.37 / 3 0.46 / 4 0.54 / 5 0.63 / 6 0.72 / 7 0.81 / Full service 0.9 / Emergency 1; Quick release below 0.05 is left out), plain: Running at the far end, Emergency nearest; the eleven Class 171 bands (centred on the TCA detents)',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:0.1,max:1,steps:brakeSteps,step_thresholds:JSON.parse(JSON.stringify(th11))}}]},
 {name:'FlapLever',description:'AFB speed setter, continuous 0..200 km/h (raw 0.5 = 90, 5 km/h steps), no Off on the lever: switch the AFB on with RUD TRIM left and confirm the speed with RUD TRIM right. 200 at the far end, so inverted: 0 at raw 1 +-0.04, speed zone 0.955..0.045, 200 at 0 +-0.04',assignments:[{type:'direct_control',controls:'AFB_Speed_F',input_value:{min:0,max:1,steps:[0,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master key (MasterKey_F) in / out and Fuehrerbremsventil cut in (DriversBrakeCutOut_F 0) / cut out (1). A service starts with the valve cut out, which locks the reverser and the power side of the handle',assignments:[pair('MasterKey_F',1,'MasterKey_F',0),pair('DriversBrakeCutOut_F',0,'DriversBrakeCutOut_F',1)]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (spring lever)','Sand_F',1,0.5),
 mom('RightThrottleButton','Horn high (spring lever)','Horn_F',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','PZB_Release_F',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZB_Acknowledge_F',1,0.5),
 mom('RudderTrimLeft','AFB on / off (push button)','AFB_ProxySwitchControl',1,0),
 mom('RudderTrimRight','AFB confirm speed (push button)','AFB_Confirm_Speed_F',1,0),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override_F',1,0),
 tog('LeftAuxButton','SiFa isolation switch (lit = Normal, off = Isolated)','Sifa_Isolation',1,0),
 tog('RightAuxButton','PZB isolation switch (lit = Normal, off = Isolated)','PZB_Isolation',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Intermittent > Off)',assignments:[rel('Wiper_F',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Intermittent > Slow > Fast)',assignments:[rel('Wiper_F',0.333)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set(HL,0)]},
 {name:'AutoBrake1',description:'Lights | Signal lights dimmed',assignments:[set(HL,0.25)]},
 {name:'AutoBrake2',description:'Lights | Signal lights',assignments:[set(HL,0.5)]},
 {name:'AutoBrake3',description:'Lights | High beams dimmed',assignments:[set(HL,0.75)]},
 {name:'AutoBrake4',description:'Lights | High beams',assignments:[set(HL,1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-193-dtg-thejag',title:'BR 193 Vectron',eyebrow:'DB Cargo · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Kinzigtalbahn: Frankfurt – Fulda',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-193-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Fahr-/Bremsschalter',continuous:true,notches:['Max power',null,null,'0',null,null,'Max E-brake'],start:3},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1A','1B','2','3','4','5','6','7','Full service','Emergency'],start:9},
 flap:{name:'AFB speed',continuous:true,notches:['200 km/h',null,null,null,null,'0'],start:5},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'Off'},{short:'BTV',desc:'Signal dim'},{short:'LO',desc:'Signal'},{short:'2',desc:'High dim'},{short:'3',desc:'High'},{short:'HI',desc:'–'}],start:0},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'AFB on · confirm'},
 parkBrk:{name:'Key + brake valve',flat:'out',up:'in'}},
setup:['Battery to Ready in the cab, parking brake released','PARK BRK up: master key in, Führerbremsventil cut in','Raise the pantograph, close the Hauptschalter in the cab','SiFa and PZB on (aux squares): a service starts with both isolated','Lights (AUTO BRK), brake selector G / P / R in the cab','AFB: RUD TRIM left on, speed on the flap lever, RUD TRIM right confirms'],
depart:['Check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running, wait for the brakes to release','Fahr-/Bremsschalter towards power, or set and confirm the AFB speed','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: handle towards E-brake, Führerbremsventil in steps']};
fs.writeFileSync('tools/manual/trains/tsw-br-193-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
