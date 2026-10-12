// LIRR M9 (Kawasaki, DTG, LIRR Commuter route, pak LongIslandRailRoadExtended), 2026-10-12. Derived from mklirrm7.js: the same controller
// positions (Emergency 0 / Max Brake 0.1 / brake zone 0.11..0.39 / Min Brake 0.4 / Coast 0.5 / Min Power 0.6 / power zone 0.61..1, power
// pulled towards the driver) but ONE GATE PER API SET at 0.1, 0.4, 0.5 and 0.6 (the lever ramps through them as the BR 440); the reverser
// moves in Emergency here; the controller once locked in Emergency for minutes until the parking brake was cycled and BrakeCharging pressed.
// MasterKey can only be switched off with the reverser out of Key Out. Safety systems are fuse push buttons ATC_Fuse, ACSES_Fuse,
// Alerter_Fuse, Deadman_Fuse (Closed 1 / Open 0, all load closed), ConsoleBuzzer (Bell), MarkerLights (HeadlightsBack) 0 / 1,
// CabCeilingLights 0 / 0.8674, Wiper Int3 0 / Int2 0.163 / Int1 0.333 / Off 0.5489 / Low 0.7859 / High 0.9906, ParkingBrakeLever 0 / 1.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679990';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_LIRREX_M9_C','RVM_LIRREX_M9-A_C','RVM_LIRREX_M9-B_C'].map(c=>({class_name:c}));
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
 {name:'ParkingBrake',description:'Master key MasterKey (MasterSwitch lever, On 1 / Off 0; it only switches off with the reverser out of Key Out): PARK BRK up = key in',assignments:[pair('MasterKey',1,0)]},
 mom('GearLever','ATC / ACSES acknowledge (Acknowledge lever 1 while held, 0.5 released)','Acknowledge',1,0.5),
 mom('RightThrottleButton','Horn (Horn lever 1, back to 0)','Horn',1,0),
 {name:'LeftEngineOn',description:'Console buzzer (ConsoleBuzzer push button, Bell: 1 while up, 0 when down)',assignments:[pair('ConsoleBuzzer',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling fuses: ATC_Fuse and ACSES_Fuse push buttons (Closed 1 / Open 0). Lit = closed; both load closed',assignments:[togA('ATC_Fuse',1,0),togA('ACSES_Fuse',1,0)]},
 tog('RightAuxButton','Alerter fuse (Alerter_Fuse Closed 1 / Open 0). Lit = closed; loads closed','Alerter_Fuse',1,0),
 tog('RoundAuxButton','Cab ceiling lights (CabCeilingLights 0.8674 / 0). Lit = on','CabCeilingLights',0.8674,0),
 {name:'RotaryCrank',description:'Wiper off (Wiper 0.5489)',assignments:[set('Wiper',0.5489)]},
 {name:'RotaryIgnStart',description:'Wiper low (Wiper 0.7859)',assignments:[set('Wiper',0.7859)]},
 {name:'AutoBrake0',description:'Lights | Off (Headlights/AuxLights 0, markers off)',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Dim (0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Bright and marker lights (MarkerLights 1)',assignments:lights(1,1)},
 {name:'AutoBrake4',description:'Lights | Marker lights only (this end trailing)',assignments:lights(0,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-lirr-m9-dtg-thejag',title:'M9',eyebrow:'Long Island Rail Road · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'LIRR Commuter: New York – Long Beach, Hempstead & Hicksville',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-lirr-slate.svg',alt:'Long Island Rail Road'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/lirr-m9-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Master controller',continuous:true,notches:['Emergency','Max brake',null,'Min brake','Coast','Min power',null,'Max power'],start:1},
 rightThrottle:null, flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ markers'},{short:'HI',desc:'Markers only'}],start:1},
 eng1:{name:'Buzzer',start:true}, eng2:null,
 leftAux:{name:'ATC · ACSES fuses'}, rightAux:{name:'Alerter fuse'},
 modeSwitch:{name:'Wiper',left:'off',right:'low'}, roundAux:{name:'Cab lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK up); the reverser loads at Key Out','Reverser from Neutral to Forward','ATC / ACSES and alerter fuses closed (aux squares lit)','Lights to Bright','Controller at Max brake (parked); the lever ramps through the gates one per step'],
depart:['Close doors (RUD TRIM), check the signal; buzzer (ENG 1)','Controller towards you through Min brake and Coast into the power zone','Acknowledge ATC / ACSES with the gear lever','Brake: controller away from you through Coast and Min brake into the brake zone; Max brake for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-lirr-m9-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
