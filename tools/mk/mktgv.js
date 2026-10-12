// SNCF TGV Duplex (DTG, LGV Méditerranée), 2026-10-12. Own layout. One desk, no cab suffixes; IS_GetActiveCab false/false. The desk loads
// cold: MasterSwitch (SimpleLever, Active, a set of 0.85 stores 1), DrivingMode (SimpleLever: Off 0 / Couple 0.3333 / Manual 0.6667 /
// Selected speed 1). API probe (master switch Active, reverser Forward, driving mode Manual): PowerHandle (Throttle) -1..1 is continuous on
// both sides (Off 0 ±0.005, min power 0.15 = 5 % (sets 0.06..0.15 give 0.15), power to 1, brake -0.06..-1, max brake -1); TrainBrake
// (AutomaticBrake, -1..2.5) is a SPRING handle: any Apply or Release set springs back to Running within 100 ms (as the Class 90 straight
// air brake), only Emergency 2 latches, so it stays off the TCA; DirectBrake Release -1 / Neutral 0 / Apply 1; SpeedSelector
// (CruiseControlAdjust) 0..1 = 0..320 km/h in 10 km/h steps (k/32, snaps); Reverser Reverse -1 / Neutral 0 / Forward 1. Isolation
// switches are 4-notch SimpleLevers (0 / 0.25 / 0.5 / 0.75): KVB_Cutout, CrocodileCutout, VACMA_Cutout load at 0.25 = Isolated, Normal
// 0.5; TVM_Cutout Isolated 0 / Test 0.25 / Normal 0.5. Acknowledge (Alerter) push button; VigilancePedal is the VACMA (reversible push
// button, 1 = pressed). Horn lever Low 1 / High -1. Headlights (HeadlightsBack) and HeadlightBrightness (Reduced 0 / Normal 1) push
// buttons; TailLight_L (GaugeLights). WiperInterval 0 / 0.3333 / 0.6666 / 1.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679140';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_LGV_SNCF_TGVDuplex200_A_C','RVM_LGV_SNCF_TGVDuplex200_B_C','RVM_LGV_SNCF_TGVDuplex200_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,b,t)=>[set('Headlights',h),set('HeadlightBrightness',b),set('TailLight_L',t)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; the zones take any value), inverted: Forward at the far end. Needs the master switch (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Manipulateur traction / freinage PowerHandle -1..1 (max brake -1 / brake continuous / 0 / min power 0.15 / power continuous to 1). SNG geometry, inverted: max power at the far end (raw 0 ±0.04), power zone 0.045..0.42, min power 0.45 ±0.03, 0 at 0.5 ±0.03, brake zone 0.56..0.955, max brake 1 ±0.04 nearest. The handle only moves with the master switch Active and the driving mode Manual (PARK BRK up)',assignments:[{type:'direct_control',controls:'PowerHandle',input_value:{min:-1,max:1,steps:[-1,null,0,0.15,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.56},{threshold:0.5,threshold_tolerance:0.03},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.42,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Frein direct DirectBrake (Release -1 / Neutral 0 / Apply 1; the zones take any value), inverted: Apply at the far end, Release nearest. The robinet de frein automatique (TrainBrake) springs back to Running within 100 ms of any API set, so it stays in the cab',assignments:[{type:'direct_control',controls:'DirectBrake',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'FlapLever',description:'Vitesse de consigne SpeedSelector (0..320 km/h in 10 km/h steps, the game snaps to k/32), inverted: 320 at the far end. Takes effect in driving mode Selected speed (round aux lit)',assignments:[{type:'direct_control',controls:'SpeedSelector',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Desk on: MasterSwitch Active (0.85 stores 1) and DrivingMode Manual (0.6667); flat = both off (0). PARK BRK up = desk active',assignments:[pair('MasterSwitch',0.85,0),pair('DrivingMode',0.6667,0)]},
 mom('GearLever','VACMA / KVB acknowledge (Acknowledge push button, Alerter, held)','Acknowledge',1,0),
 mom('LeftThrottleButton','Sand (Sanding push button)','Sanding',1,0),
 mom('RightThrottleButton','Horn low tone (Horn lever 1, back to 0)','Horn',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Train protection: KVB_Cutout, CrocodileCutout (Normal 0.5 / Isolated 0.25) and TVM_Cutout (Normal 0.5 / Isolated 0). Lit = Normal. The train loads with all three isolated',assignments:[togA('KVB_Cutout',0.5,0.25),togA('CrocodileCutout',0.5,0.25),togA('TVM_Cutout',0.5,0)]},
 tog('RightAuxButton','VACMA vigilance (VACMA_Cutout Normal 0.5 / Isolated 0.25). Lit = Normal; loads isolated','VACMA_Cutout',0.5,0.25),
 tog('RoundAuxButton','Driving mode Selected speed (DrivingMode 1) / Manual (0.6667). Lit = the speed selector on the flap lever drives','DrivingMode',1,0.6667),
 {name:'RotaryCrank',description:'Wipers off (WiperInterval 0)',assignments:[set('WiperInterval',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperInterval 0.6666)',assignments:[set('WiperInterval',0.6666)]},
 {name:'AutoBrake0',description:'Lights | Off (Headlights 0, tail lamp off)',assignments:lights(0,0,0)},
 {name:'AutoBrake1',description:'Lights | Headlights reduced (HeadlightBrightness 0)',assignments:lights(1,0,0)},
 {name:'AutoBrake2',description:'Lights | Headlights normal (HeadlightBrightness 1)',assignments:lights(1,1,0)},
 {name:'AutoBrake3',description:'Lights | Headlights normal and tail lamp',assignments:lights(1,1,1)},
 {name:'AutoBrake4',description:'Lights | Tail lamp only (this end trailing)',assignments:lights(0,0,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-tgv-duplex-dtg-thejag',title:'TGV Duplex',eyebrow:'SNCF · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'LGV Méditerranée: Marseille – Avignon',colors:{navy:'#46284a',blue:'#7a5a80',red:'#d23732',paper:'#f6f3f7'},logos:[{file:'../../assets/logo-sncf-aubergine.svg',alt:'SNCF'},{file:'../../assets/logo-dtg-aubergine.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/tgv-duplex-dtg-cab.jpg',height:196,position:'50% 50%'},
diagram:{file:'../../assets/tgv-duplex-side.png',caption:'Tekening: Arthur’s Treinenpagina, arthurstreinenpagina.nl',clean:false,fit:'clip'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Traction / freinage',continuous:true,notches:['Max power',null,'Min power','0',null,'Max brake'],start:5},
 rightThrottle:{name:'Frein direct',notches:['Apply','Neutral','Release'],start:0},
 flap:{name:'Vitesse consigne',continuous:true,notches:['320 km/h',null,null,null,'0'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'VACMA ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Reduced'},{short:'2',desc:'Normal'},{short:'3',desc:'Normal + tail'},{short:'HI',desc:'Tail only'}],start:1},
 eng1:null, eng2:null,
 leftAux:{name:'KVB · TVM'}, rightAux:{name:'VACMA'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Selected speed'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Desk · Manual mode',flat:'off',up:'on'}},
setup:['Battery, pantograph (Normal) and circuit breaker in the cab','PARK BRK up: master switch Active, driving mode Manual','Reverser from Neutral to Forward','KVB / TVM and VACMA to Normal (aux squares lit); the train loads with them isolated','Lights to Normal','Frein direct at Apply, handle at Max brake (parked); the robinet de frein automatique stays in the cab'],
depart:['Close doors (RUD TRIM), check the signal','Frein direct to Release, handle to 0','Handle past Min power into the power zone','Selected speed: round aux lit, set the speed on the flap lever','Acknowledge VACMA / KVB with the gear lever','Brake: handle back through 0 into the brake zone; frein direct to Apply at a stand']};
fs.writeFileSync('tools/manual/trains/tsw-tgv-duplex-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
