// LIRR M7 (Bombardier, DTG, Long Island Rail Road; the LIRR Commuter route reuses it as RVM_LIRREX_M7), 2026-10-12. Derived from mklirrm3.js.
// One desk per car, plain node names; IS_GetActiveCab false/false. Agent probe: MasterController (Throttle, 0..1) Emergency 0 (0..0.04) /
// Max Brake 0.1 (sets 0.05..0.10) / brake zone continuous 0.11..0.40 / Min brake 0.4 (0.41..0.45) / Coast 0.5 / Min Power 0.6 (0.55..0.60) /
// power zone continuous 0.61..1; from Emergency a first set stops at Min brake (gate), after that sets jump freely; loads at Emergency. The
// desk reads EMER / MAX BK at the far end and MAX PWR nearest the driver, so the lever is PLAIN (power pulled towards you). Reverser Reverse
// 0 / Neutral 0.333 / Forward 0.666 / Key Out 1 (loads Key Out), LOCKED while the controller is in Emergency. MasterKey (SimpleLever,
// MasterSwitch, Off 0 / On 1). Acknowledge IrregularLever (AWS_Reset, rests 0.5); Horn SimpleLever; ContactSignaller push button (the
// console buzzer; no Bell node); DeadmanFootSwitch push button (loads released); cut-out SimpleLevers ACSES_Cut-out, ATC_Cut-out,
// Alerter_Cut-out, Deadman_Cut-out (all load 0, which their names call Cut-Out; Cut-In stores about 0.87; the in-game state is to be checked);
// Headlights/AuxLights Off 0 / Dim 0.5 / Bright 1; MarkerLights 0 / 0.9228; CabCeilingLights 0 / 0.9161; Wiper Int3 0 / Int2 0.18 / Int1
// 0.38 / Off 0.5871 / Low 0.7873 / High 0.9878; doors per side behind DoorPanelKeySwitch_L/R (keys y / u used).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4678860';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_LIRR_M7_C','RVM_LIRR_M7-A_C','RVM_LIRR_M7-B_C','RVM_LIRREX_M7_C','RVM_LIRREX_M7-A_C','RVM_LIRREX_M7-B_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,m)=>[set('Headlights/AuxLights',h),set('MarkerLights',m)];
// raw axis, far end (raw 0) = P4 .. Emergency nearest (raw 1)
// raw axis, plain: Emergency at the far end (raw 0) .. Max power nearest (raw 1)
const thMC=[{threshold:0,threshold_tolerance:0.03},{threshold:0.07,threshold_tolerance:0.03},{threshold:0.11,threshold_end:0.42},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.58,threshold_end:0.955},{threshold:1,threshold_tolerance:0.04}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.333 / Forward 0.666; Key Out 1 stays in the cab), inverted: Forward at the far end. Needs the master key (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:0.666,steps:[0,0.333,0.666],invert:true}}]},
 {name:'LeftThrottle',description:'Master controller MasterController 0..1 (Emergency 0 / Max Brake 0.1 / brake zone 0.11..0.40 / Min brake 0.4 / Coast 0.5 / Min Power 0.6 / power zone 0.61..1), plain as the desk reads: Emergency at the far end (raw 0 ±0.03), Max Brake 0.07 ±0.03, brake zone 0.11..0.42, Min brake 0.45 ±0.03, Coast 0.5 ±0.02, Min Power 0.55 ±0.03, power zone 0.58..0.955, Max power 1 ±0.04 nearest. The reverser is locked while the controller sits in Emergency',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0,0.1,null,0.4,0.5,0.6,null,1],step_thresholds:thMC}}]},
 {name:'ParkingBrake',description:'Master key MasterKey (MasterSwitch lever, On 1 / Off 0) and the deadman foot switch DeadmanFootSwitch (pressed 1 / released 0): PARK BRK up = key in, deadman held',assignments:[pair('MasterKey',1,0),pair('DeadmanFootSwitch',1,0)]},
 mom('GearLever','ATC / ACSES acknowledge (Acknowledge lever 1 while held, 0.5 released)','Acknowledge',1,0.5),
 mom('RightThrottleButton','Horn (Horn lever 1, back to 0)','Horn',1,0),
 {name:'LeftEngineOn',description:'Console buzzer (ContactSignaller push button: 1 while up, 0 when down)',assignments:[pair('ContactSignaller',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling: ATC_Cut-out and ACSES_Cut-out levers (Cut-In 0.87 / Cut-Out 0). Lit = cut in; both load 0, check the cab',assignments:[togA('ATC_Cut-out',0.87,0),togA('ACSES_Cut-out',0.87,0)]},
 tog('RightAuxButton','Alerter (Alerter_Cut-out lever Cut-In 0.87 / Cut-Out 0). Lit = cut in; loads 0','Alerter_Cut-out',0.87,0),
 tog('RoundAuxButton','Cab ceiling lights (CabCeilingLights 0.9161 / 0). Lit = on','CabCeilingLights',0.9161,0),
 {name:'RotaryCrank',description:'Wiper off (Wiper 0.5871)',assignments:[set('Wiper',0.5871)]},
 {name:'RotaryIgnStart',description:'Wiper low (Wiper 0.7873)',assignments:[set('Wiper',0.7873)]},
 {name:'AutoBrake0',description:'Lights | Off (Headlights/AuxLights 0, markers off)',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Dim (0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Bright and marker lights (MarkerLights 0.9228)',assignments:lights(1,0.9228)},
 {name:'AutoBrake4',description:'Lights | Marker lights only (this end trailing)',assignments:lights(0,0.9228)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-lirr-m7-dtg-thejag',title:'M7',eyebrow:'Long Island Rail Road · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Long Island Rail Road: New York – Hicksville',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-lirr-slate.svg',alt:'Long Island Rail Road'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/lirr-m7-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Master controller',continuous:true,notches:['Emergency','Max brake',null,'Min brake','Coast','Min power',null,'Max power'],start:1},
 rightThrottle:null, flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ markers'},{short:'HI',desc:'Markers only'}],start:1},
 eng1:{name:'Buzzer',start:true}, eng2:null,
 leftAux:{name:'ATC · ACSES'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wiper',left:'off',right:'low'}, roundAux:{name:'Cab lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Key + deadman',flat:'out',up:'in'}},
setup:['PARK BRK up: master key in, deadman held; the reverser loads at Key Out','Reverser from Neutral to Forward','ATC / ACSES and alerter cut in (aux squares lit); check their state in the cab, the levers load at 0','Lights to Bright','Controller at Max brake (parked); move it off Emergency before the reverser'],
depart:['Close doors (RUD TRIM), check the signal; buzzer (ENG 1)','Controller towards you through Min brake and Coast into the power zone','Acknowledge ATC / ACSES with the gear lever','Brake: controller away from you through Coast and Min brake into the brake zone; Max brake for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-lirr-m7-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
