const fs=require('fs');
const f=process.argv[2]; const dlc='store.steampowered.com/app/4679400';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.name='TSW | BR 628 | TSG | TheJAG';
p.rail_class_information=[{class_name:'RVM_TSG_DB_BR628_2_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
// Fuehrerbremsventil: the valve stores 0.05 steps in the service zone and moves one detent gate per set (Running | Lap | Minimum | zone | Full service | Emergency),
// so every TCA band sends one exact valve position; nine equal bands over raw 0.30..0.74 carry the zone steps 0.35..0.75. The first zone step is 0.3501, not 0.35:
// the mod stops when the read-back is within 0.05 of the target, and 0.35 - 0.30 rounds below 0.05 in float, so a plain 0.35 asked from Running stuck at Minimum.
const zone=[0.3501,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75], zw=0.44/zone.length;
const brakeSteps=[0.1,0.2,0.3,...zone,0.8,1];
const brakeBands=[{threshold:0,threshold_tolerance:0.05},{threshold:0.13,threshold_tolerance:0.04},{threshold:0.24,threshold_tolerance:0.04},
 ...zone.map((_,k)=>({threshold:+(0.30+(k+0.5)*zw).toFixed(4),threshold_tolerance:0.02})),
 {threshold:0.84,threshold_tolerance:0.06},{threshold:1,threshold_tolerance:0.04}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (R / 0 / V), inverted: V at the far end',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahrschalter 0..7 (notches k/7, values a hair above the stored ones), inverted: 0 nearest the driver, 7 pushed away',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.142858,0.285715,0.428572,0.571429,0.714286,0.857143,1],invert:true}}]},
 {name:'RightThrottle',description:'Fuehrerbremsventil (Running 0.1 / Lap 0.2 / Minimum 0.3 / service steps 0.35..0.75 in 0.05 / Full service 0.8 / Emergency 1; Release 0 is spring-loaded and left out). Needs the brake cut-off at Cut In. Plain: Running at the far end, Emergency nearest. Bands on the raw axis: Running 0 +-0.05, Lap 0.13 +-0.04, Minimum 0.24 +-0.04, nine service bands of 0.049 over 0.30..0.74 (+-0.02 each, the gaps between them hold the last step against axis jitter), Full service 0.84 +-0.06 (FLX detent), Emergency 1 +-0.04. Every band sends one exact valve position because the valve snaps to 0.05 steps and the app re-sends until the read-back matches',assignments:[{type:'direct_control',controls:'TrainBrake',input_value:{min:0.1,max:1,steps:brakeSteps,step_thresholds:brakeBands}}]},
 {name:'ParkingBrake',description:'Reverser key and brake key in / out, and the brake cut-off (TrainBrakeCutoff, MoveToLap) to Cut In / Cut Off with them: at Cut Off the valve freezes once it reaches Running (2026-10-24), so the cut-in travels with the keys',assignments:[{type:'momentary',threshold:0.9,action_activate:{controls:'ReverserKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'ReverserKey',value:0,hold:false,enable_api_fallback:true}},{type:'momentary',threshold:0.9,action_activate:{controls:'TrainBrakeKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'TrainBrakeKey',value:0,hold:false,enable_api_fallback:true}},{type:'momentary',threshold:0.9,action_activate:{controls:'TrainBrakeCutoff',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'TrainBrakeCutoff',value:0,hold:false,enable_api_fallback:true}}]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand','SanderSwitch',1,0),
 mom('RightThrottleButton','Horn','HornSwitch',1,0.5),
 mom('LeftEngineOn','PZB Frei (release)','PZBRelease',1,0.5),
 mom('RightEngineOn','PZB Wachsam (acknowledge)','PZBAcknowledge',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (override)','PZBOverride',1,0.5),
 tog('LeftAuxButton','SiFa fuse (lit = on)','Sifa_FuseControl',1,0),
 tog('RightAuxButton','PZB fuse (lit = on)','PZB_FuseControl',1,0),
 {name:'RotaryCrank',description:'Both wipers one notch back (On > Off > Parking); WiperSwitchL and WiperSwitchR are separate 3-notch switches at 0 / 0.5 / 1',assignments:[rel('WiperSwitchL',-0.5),rel('WiperSwitchR',-0.5)]},
 {name:'RotaryIgnStart',description:'Both wipers one notch on (Parking > Off > On)',assignments:[rel('WiperSwitchL',0.5),rel('WiperSwitchR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set('SignalLights',0.5)]},
 {name:'AutoBrake1',description:'Lights | Headlights',assignments:[set('SignalLights',1)]},
 {name:'AutoBrake3',description:'Lights | Tail lights',assignments:[set('SignalLights',0)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
const m={name:'tsw-br-628-tsg-thejag',title:'BR 628',eyebrow:'DB Regio · Train Sim Germany · TCA Quadrant Airbus',profileName:p.name,developer:'Train Sim Germany',route:'Niddertalbahn: Bad Vilbel – Stockheim',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-tsg-dbgrey.png',alt:'Train Sim Germany'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-628-tsg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Richtungsschalter',notches:['V (forward)','0','R (reverse)'],start:1},
 leftThrottle:{name:'Fahrschalter',notches:['7','6','5','4','3','2','1','0'],start:7},
 rightThrottle:{name:'Führerbremsventil',notches:['Running','Lap','Min','1','2','3','4','5','6','7','8','9','Full service','Emergency'],start:12},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Headlights'},{short:'2',desc:'–'},{short:'3',desc:'Tail lights'},{short:'HI',desc:'–'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa fuse'}, rightAux:{name:'PZB fuse'},
 modeSwitch:{name:'Wipers L + R',left:'back',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Keys + brake cut-in',flat:'out',up:'in'}},
setup:['Keys in and brake cut-off to Ein (PARK BRK up), battery on in the cab','Handbrake released; if the valve will not leave Running, flip PARK BRK down and up (cut-off Aus locks it there)','Engines Gruppe 1 and 2 started, transmission on, in the cab','SiFa and PZB fuses on (aux squares lit)','Führerbremsventil at Full service','Lights to Headlights'],
depart:['Close doors, check the signal and PZB','Richtungsschalter to V','Brake to Running and wait for the pipe to charge','Fahrschalter up in notches 1 to 7','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: Min, then service steps 1 to 9 towards Full service; Lap holds the pressure']};
fs.writeFileSync('tools/manual/trains/tsw-br-628-tsg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
