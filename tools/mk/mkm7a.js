// Metro-North M7a (Bombardier, DTG, Harlem Line: Grand Central – North White Plains), 2026-10-13. Derived from mklirrm7.js: the same
// MasterController. One desk per car, plain node names. Capture agent probe: MasterController (Throttle, 0..1) Emergency 0 / Max Brake 0.1 /
// brake zone 0.11..0.40 / Min Brake 0.4 / Coast 0.5 / Min Power 0.6 / power zone 0.61..1, a set from Emergency stops at Min Brake (gate),
// loads at Emergency; a one-time startup lock (the controller would not leave Emergency in Neutral) cleared after the safety fuses were
// closed and the reverser went to Forward. Reverser Reverse 0 / Neutral 0.333 / Forward 0.666 / Key Out 1 (Key Out unreliable through the
// API), NOT locked in Emergency here. MasterKey (MasterSwitch) Off 0 / On 1, loads Off, a set of 0 is ignored. Safety fuses Deadman_Fuse /
// Alerter_Fuse (WarningDevices) and ATC_Fuse / ACSES_Fuse (SignallingSystems) Open 0 / Closed 1, all load OPEN. DeadmanFootSwitch loads
// Pressed. ConsoleBuzzer (Bell), Horn, Acknowledge (rests 0.5); MarkerLights 0 / 0.8238, CabCeilingLights 0 / 0.8292, Wiper Off 0.5823 /
// Low 0.7892; Headlights/AuxLights Off 0 / Dim 0.5 / Bright 1. Brake pipe reads 0 psi in the capture.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/search/?term=Harlem+Line';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_NYH_MNR_M7a_C','RVM_NYH_MNR_M7a-A_C','RVM_NYH_MNR_M7a-B_C'].map(c=>({class_name:c}));
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
 {name:'LeftThrottle',description:'Master controller MasterController 0..1 (Emergency 0 / Max Brake 0.1 / brake zone 0.11..0.40 / Min brake 0.4 / Coast 0.5 / Min Power 0.6 / power zone 0.61..1), plain as the desk reads: Emergency at the far end (raw 0 ±0.03), Max Brake 0.07 ±0.03, brake zone 0.11..0.42, Min brake 0.45 ±0.03, Coast 0.5 ±0.02, Min Power 0.55 ±0.03, power zone 0.58..0.955, Max power 1 ±0.04 nearest.',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0,0.1,null,0.4,0.5,0.6,null,1],step_thresholds:thMC}}]},
 {name:'ParkingBrake',description:'Master key MasterKey (MasterSwitch lever, On 1 / Off 0) and the deadman foot switch DeadmanFootSwitch (pressed 1 / released 0): PARK BRK up = key in, deadman held',assignments:[pair('MasterKey',1,0),pair('DeadmanFootSwitch',1,0)]},
 mom('GearLever','ATC / ACSES acknowledge (Acknowledge lever 1 while held, 0.5 released)','Acknowledge',1,0.5),
 mom('RightThrottleButton','Horn (Horn lever 1, back to 0)','Horn',1,0),
 {name:'LeftEngineOn',description:'Console buzzer (ConsoleBuzzer push button: 1 while up, 0 when down)',assignments:[pair('ConsoleBuzzer',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling fuses ATC_Fuse and ACSES_Fuse (Closed 1 / Open 0). Lit = closed; both load open',assignments:[togA('ATC_Fuse',1,0),togA('ACSES_Fuse',1,0)]},
 {name:'RightAuxButton',description:'Alerter and deadman fuses Alerter_Fuse and Deadman_Fuse (Closed 1 / Open 0). Lit = closed; both load open',assignments:[togA('Alerter_Fuse',1,0),togA('Deadman_Fuse',1,0)]},
 tog('RoundAuxButton','Cab ceiling lights (CabCeilingLights 0.8292 / 0). Lit = on','CabCeilingLights',0.8292,0),
 {name:'RotaryCrank',description:'Wiper off (Wiper 0.5823)',assignments:[set('Wiper',0.5823)]},
 {name:'RotaryIgnStart',description:'Wiper low (Wiper 0.7892)',assignments:[set('Wiper',0.7892)]},
 {name:'AutoBrake0',description:'Lights | Off (Headlights/AuxLights 0, markers off)',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Dim (0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Bright and marker lights (MarkerLights 0.8238)',assignments:lights(1,0.8238)},
 {name:'AutoBrake4',description:'Lights | Marker lights only (this end trailing)',assignments:lights(0,0.8238)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-metro-north-m7a-dtg-thejag',title:'M7a',eyebrow:'Metro-North Railroad · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Harlem Line: Grand Central Terminal – North White Plains',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-metro-north-slate.svg',alt:'Metro-North Railroad'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/metro-north-m7a-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Master controller',continuous:true,notches:['Emergency','Max brake',null,'Min brake','Coast','Min power',null,'Max power'],start:1},
 rightThrottle:null, flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ markers'},{short:'HI',desc:'Markers only'}],start:1},
 eng1:{name:'Buzzer',start:true}, eng2:null,
 leftAux:{name:'ATC · ACSES fuses'}, rightAux:{name:'Alerter · deadman'},
 modeSwitch:{name:'Wiper',left:'off',right:'low'}, roundAux:{name:'Cab lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Key + deadman',flat:'out',up:'in'}},
setup:['PARK BRK up: master key in, deadman held; the reverser loads at Key Out','Reverser from Neutral to Forward','ATC / ACSES and alerter / deadman fuses closed (aux squares lit); all four load open','Lights to Bright','Controller at Max brake (parked)'],
depart:['Close doors (RUD TRIM), check the signal; buzzer (ENG 1)','Controller towards you through Min brake and Coast into the power zone','Acknowledge ATC / ACSES with the gear lever','Brake: controller away from you through Coast and Min brake into the brake zone; Max brake for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-metro-north-m7a-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
