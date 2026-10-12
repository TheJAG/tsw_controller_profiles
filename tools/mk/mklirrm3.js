// LIRR M3 (Budd Metropolitan, DTG loco pack, pak LIRRM3, Long Island Rail Road), 2026-10-12. FIRST US EMU LAYOUT. One desk per car, plain
// node names; IS_GetActiveCab false/false. Capture + agent probe (MasterKey on): MasterController (Throttle, 0..1) is one combined handle:
// Emergency 0 (0..0.13) / Max Brake 0.27 (sets 0.14..0.27) / brake zone continuous 0.28..0.63 (output -0.97 .. -0.10) / Min Brake 0.64 /
// Coast 0.72 / P1 0.85 / P2 0.90 / P3 0.95 / P4 1 (snaps above Min Brake); loads at Emergency. Reverser (0..1) Reverse 0 / Neutral 0.333 /
// Forward 0.666 / Key Out 1 (loads Key Out). Key MasterKey (SimpleLever, MasterSwitch, Off 0 / On 0.9128). DeadmanFootSwitch reversible
// push button (Alerter, loads pressed). Acknowledge IrregularLever (Alerter, rests 0.5, Pressed at the ends); Horn and Buzzer (Bell) push
// buttons; ATC_Cut-out / ACSES_Cut-out push buttons (SignallingSystems, load 0); Headlights/AuxLights lever Dim 0 / Off 0.2901 / Bright
// 0.7893 (loads Dim); MarkerLights, CabCeilingLights, BrakeCharging push buttons; Wiper lever unnamed; doors are per-side push buttons
// (ForwardDoorOpen_L/R, RearwardDoorOpen_L/R, *Close*) behind DoorPanelKeySwitch_L/R (keys y / u used).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679070';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_LIRR_M3_C','RVM_LIRR_M3-A_C','RVM_LIRR_M3-B_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,m)=>[set('Headlights/AuxLights',h),set('MarkerLights',m)];
// raw axis, far end (raw 0) = P4 .. Emergency nearest (raw 1)
const thMC=[{threshold:1,threshold_tolerance:0.04},{threshold:0.92,threshold_tolerance:0.03},{threshold:0.88,threshold_end:0.38},{threshold:0.34,threshold_tolerance:0.03},{threshold:0.26,threshold_tolerance:0.04},{threshold:0.18,threshold_tolerance:0.025},{threshold:0.12,threshold_tolerance:0.025},{threshold:0.06,threshold_tolerance:0.025},{threshold:0,threshold_tolerance:0.03}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.333 / Forward 0.666; Key Out 1 stays in the cab), inverted: Forward at the far end. Needs the master key (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:0.666,steps:[0,0.333,0.666],invert:true}}]},
 {name:'LeftThrottle',description:'Master controller MasterController 0..1 (Emergency 0 / Max Brake 0.27 / brake zone 0.28..0.63 / Min Brake 0.64 / Coast 0.72 / P1 0.85 / P2 0.90 / P3 0.95 / P4 1), inverted: P4 at the far end (raw 0), P3 0.06, P2 0.12, P1 0.18, Coast 0.26 ±0.04, Min Brake 0.34 ±0.03, brake zone 0.38..0.88, Max Brake 0.92 ±0.03, Emergency 1 ±0.04 nearest',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0,0.27,null,0.64,0.72,0.85,0.9,0.95,1],invert:true,step_thresholds:thMC}}]},
 {name:'ParkingBrake',description:'Master key MasterKey (MasterSwitch lever, On 0.9128 / Off 0): PARK BRK up = key in',assignments:[pair('MasterKey',0.9128,0)]},
 mom('GearLever','ATC / ACSES acknowledge (Acknowledge lever 1 while held, 0.5 released)','Acknowledge',1,0.5),
 mom('RightThrottleButton','Horn (Horn push button)','Horn',1,0),
 {name:'LeftEngineOn',description:'Buzzer (Buzzer push button, Bell: 1 while up, 0 when down)',assignments:[pair('Buzzer',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling cut-out: ATC_Cut-out and ACSES_Cut-out push buttons (1 / 0). Lit = cut out; both load 0 (cut in)',assignments:[togA('ATC_Cut-out',1,0),togA('ACSES_Cut-out',1,0)]},
 tog('RoundAuxButton','Cab ceiling lights (CabCeilingLights 1 / 0). Lit = on','CabCeilingLights',1,0),
 {name:'RotaryCrank',description:'Wiper off (Wiper 0)',assignments:[set('Wiper',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (Wiper 0.5; unnamed lever)',assignments:[set('Wiper',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off (Headlights/AuxLights 0.2901)',assignments:lights(0.2901,0)},
 {name:'AutoBrake1',description:'Lights | Dim (0)',assignments:lights(0,0)},
 {name:'AutoBrake2',description:'Lights | Bright (0.7893)',assignments:lights(0.7893,0)},
 {name:'AutoBrake3',description:'Lights | Bright and marker lights (MarkerLights 1)',assignments:lights(0.7893,1)},
 {name:'AutoBrake4',description:'Lights | Marker lights only (this end trailing)',assignments:lights(0.2901,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-lirr-m3-dtg-thejag',title:'M3',eyebrow:'Long Island Rail Road · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Long Island Rail Road: New York – Hicksville',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-lirr-slate.svg',alt:'Long Island Rail Road'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/lirr-m3-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Master controller',notches:['P4','P3','P2','P1','Coast','Min brake',null,'Max brake','Emergency'],start:7},
 rightThrottle:null, flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ markers'},{short:'HI',desc:'Markers only'}],start:1},
 eng1:{name:'Buzzer',start:true}, eng2:null,
 leftAux:{name:'ATC · ACSES cut-out'}, rightAux:null,
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'Cab lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK up); the reverser loads at Key Out','Reverser from Neutral to Forward','Cab signalling cut in (left aux unlit); hold the deadman pedal in the cab if it calls','Lights to Bright','Controller at Max brake (parked)'],
depart:['Close doors (RUD TRIM), check the signal; buzzer (ENG 1)','Controller through Min brake to Coast, then P1 … P4','Acknowledge ATC / ACSES with the gear lever','Brake: controller back through Coast and Min brake into the brake zone; Max brake for the stop, Emergency nearest you']};
fs.writeFileSync('tools/manual/trains/tsw-lirr-m3-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
