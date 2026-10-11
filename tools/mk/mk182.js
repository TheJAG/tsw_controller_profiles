// DB BR 182 Taurus, MRCE livery (DTG, Hauptstrecke Hamburg – Lübeck). The BR 185 control family exactly: Reverser_F
// Reverse 0 / Off 0.33 / Neutral 0.66 / Forward 1, Throttle_F Off 0 / Min 0.1 / continuous / Max 1, TrainBrake_F the
// eleven 185 notches (0.1 / 0.2 / 0.275 … 0.8 / 1), AFB_Speed_F 0..1 = 0..230 km/h (0 below 0.07, 10 km/h at 0.15) with
// AFB_Switch_F Off 0 / On 0.92. A separate DynamicBrake_F (E-brake, eleven notches) and the spring DirectBrake_F are not
// on the TCA. No key: BatteryMainSwitch_F Off / Auto / On and the Richtungsschalter Off position. Lights are three
// switches: ExteriorLightMasterSwitch_F, ExteriorLightBrightness_F (marker 0.333 / high 0.667 / bright 1) and
// SignalLights_F (six positions). Usage: node tools/mk/mk182.js profiles/<file>.json [--dispolok] [store app]
const fs=require('fs');
const argv=process.argv.slice(2); const dispolok=argv.includes('--dispolok'); const pos=argv.filter(a=>!a.startsWith('--'));
const f=pos[0]; const dlc=pos[1]||(dispolok?'store.steampowered.com/app/4679530':'store.steampowered.com/app/4679220');
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const cls=dispolok?['RVM_KWG_Dispolok_BR182']:['RVM_MRCE_BR182'];
p.rail_class_information=cls.map(c=>({class_name:c+'_C'}));p.name=dispolok?'TSW | ES 64 U2 | DTG | TheJAG':'TSW | BR 182 | DTG | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const brakeSteps=[0.1,0.2,0.275,0.35,0.425,0.5,0.575,0.65,0.725,0.8,1];
if(th11.length!==brakeSteps.length) throw new Error('171 bands do not fit');
const MS='ExteriorLightMasterSwitch_F',HB='ExteriorLightBrightness_F',SL='SignalLights_F';
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse 0 / Off 0.33 / Neutral 0.66 / Forward 1; the Dispolok loco stores 0 / 0.32 / 0.65 / 0.99), inverted: Forward at the far end, Reverse nearest',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:dispolok?{min:0,max:0.99,steps:[0,0.32,0.65,0.99],invert:true}:{min:0,max:1,steps:[0,0.33,0.66,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter (Off 0 / Min 0.1 / continuous 0.11..0.99 / Max 1). Power is pushed away from you, so the lever is inverted: Max raw 0 +-0.035, power zone 0.045..0.81, Min 0.88 +-0.05, Off 1 +-0.04 (the BR 185 bands)',assignments:[{type:'direct_control',controls:'Throttle_F',input_value:{min:0,max:1,steps:[0,0.1,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.88,threshold_tolerance:0.05},{threshold:0.81,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.035}]}}]},
 {name:'RightThrottle',description:'Fuehrerbremsventil (Running 0.1 / 1A 0.2 / 1B 0.275 / 2 0.35 / 3 0.425 / 4 0.5 / 5 0.575 / 6 0.65 / 7 0.725 / Full service 0.8 / Emergency 1), plain: Running at the far end, Emergency nearest; the eleven Class 171 bands centred on the TCA detents. The separate E-brake lever (DynamicBrake_F) stays in the cab',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:0.1,max:1,steps:brakeSteps,step_thresholds:JSON.parse(JSON.stringify(th11))}}]},
 {name:'FlapLever',description:'AFB speed setter, continuous 0..230 km/h (0 below raw 0.07, 10 km/h at 0.15), 230 at the far end so inverted; switch the AFB on with PARK BRK first',assignments:[{type:'direct_control',controls:'AFB_Speed_F',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'AFB on (0.92) / off (0): no master key on this loco, the Richtungsschalter Off position is the key',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'AFB_Switch_F',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'AFB_Switch_F',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (spring switch, rests at 0.5)','Sand_F',1,0.5),
 mom('RightThrottleButton','Horn high (spring switch: Low 0 / Off 0.5 / High 1)','Horn_FL',1,0.5),
 mom('LeftEngineOn','PZB Frei (release, spring)','PZB_Release_F',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge, spring)','PZB_Acknowledge_F',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZB_Override_F',1,0),
 tog('LeftAuxButton','SiFa switch (lit = On 0.83, off = Off)','SifaSwitch',1,0),
 tog('RightAuxButton','PZB switch (lit = On 0.83, off = Off)','PZB_Switch_F',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (2 > 1 > Intermittent > Off)',assignments:[rel('Wiper_F',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Intermittent > 1 > 2)',assignments:[rel('Wiper_F',0.333)]},
 {name:'AutoBrake0',description:'Lights | Off (master switch Off)',assignments:[set(MS,0.5)]},
 {name:'AutoBrake1',description:'Lights | Marker lights',assignments:[set(MS,1),set(SL,0.2),set(HB,0.333)]},
 {name:'AutoBrake2',description:'Lights | High beams',assignments:[set(MS,1),set(SL,0.2),set(HB,0.667)]},
 {name:'AutoBrake3',description:'Lights | High beams bright',assignments:[set(MS,1),set(SL,0.2),set(HB,1)]},
 {name:'AutoBrake4',description:'Lights | Tail lights',assignments:[set(MS,1),set(SL,0.6)]},
 {name:'AutoBrake5',description:'Lights | Headlights + tail lights',assignments:[set(MS,1),set(SL,0.8)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const slug=dispolok?'tsw-es64u2-dtg-thejag':'tsw-br-182-dtg-thejag';
const m={name:slug,title:dispolok?'ES 64 U2':'BR 182',eyebrow:(dispolok?'Dispolok':'MRCE')+' · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:dispolok?'Schnellfahrstrecke Kassel – Würzburg':'Hauptstrecke Hamburg – Lübeck',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:dispolok?[{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}]:[{file:'../../assets/logo-mrce-dbgrey.svg',alt:'MRCE'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:dispolok?'../../assets/es64u2-cab.jpg':'../../assets/br-182-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['Forward','Neutral','Off','Reverse'],start:2},
 leftThrottle:{name:'Fahrschalter',continuous:true,notches:['Max',null,null,null,'Min','Off'],start:5},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','1A','1B','2','3','4','5','6','7','Full service','Emergency'],start:9},
 flap:{name:'AFB speed',continuous:true,notches:['230 km/h',null,null,null,'0'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'Off'},{short:'BTV',desc:'Markers'},{short:'LO',desc:'High beams'},{short:'2',desc:'High bright'},{short:'3',desc:'Tail lights'},{short:'HI',desc:'Head + tail'}],start:0},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'AFB',flat:'off',up:'on'}},
setup:['Battery on in the cab, parking brake released','Richtungsschalter from Off (the key position) to Neutral','Raise the pantograph and close the Hauptschalter in the cab','SiFa and PZB on (aux squares), PZB mode and brake selector set in the cab','Lights (AUTO BRK)','AFB on (PARK BRK up) if you drive with the speed setter'],
depart:['Check the signal and PZB','Richtungsschalter to Forward','Führerbremsventil to Running, wait for the brakes to release','Fahrschalter towards Max, or set the AFB speed on the flap lever','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Führerbremsventil in steps; the E-brake lever stays in the cab']};
fs.writeFileSync('tools/manual/trains/'+slug+'.json',JSON.stringify(m,null,2)+'\n');console.log('manual data',slug);
