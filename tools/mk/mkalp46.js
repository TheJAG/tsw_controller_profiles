// NJ Transit ALP-46 (ADtranz / Bombardier, DTG, Morristown Line; also on NEC New York – Trenton), 2026-10-13. Derived from mkalp45.js.
// Two cabs with _F / _B nodes; IS_GetActiveCab answered front true / back false, so the controls use {SIDE:F:B}. Capture agent probe:
// PowerHandle_F (Throttle, 0..1) dynamic continuous 0..0.49 (output -10..-1) / Off 0.51 / P1 0.555 / power continuous 0.585..1 (output
// 2..10), loads Off. AutomaticBrake_F notched Release 0 / Hold 0.2 / Lap 0.4 / Service 0.6 / Handle Off 0.8 / Emergency 1 (loads Lap).
// IndependentBrake_F Release 0.1 / continuous 0.2..0.9 / Full 1. Reverser_F Isolated 0 / Reverse 0.333 / Neutral 0.666 / Forward 1, moves
// only with ReverserHandle_F (MasterSwitch push button, loads 1) set and the power handle at Off. No bail-off node. AlerterCut-OutSwitch_F,
// ATC_Cut-OutSwitch_F, ACSES_Cut-OutSwitch_F (Cut-Out 0 / Cut-In 1) load cut out. Pantograph_F a spring with only Down 0 (rest 0.5).
// HeadlightsFront_F Off 0 / Dim 0.5 / Bright 1, Ditch/CrossingLights_F Off 0 / Auto 0.5 / Manual 1, MarkerLights_F 0 / 1, wipers
// WindshieldWiperLeft_F / Right_F Off 0 / Int 0.333 / Slow 0.666 / Fast 1, Sand_F rests 0.5. No door nodes (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680320';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_MRT_NJT_ALP-46_C'},{class_name:'RVM_NYT_NJT_ALP-46_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,d)=>[set('HeadlightsFront_{SIDE:F:B}',h),set('Ditch/CrossingLights_{SIDE:F:B}',d)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser_F/_B (Reverse 0.333 / Neutral 0.666 / Forward 1; Isolated 0 stays in the cab; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up) and the handle at Off',assignments:[{type:'direct_control',controls:'Reverser_{SIDE:F:B}',input_value:{min:0.333,max:1,steps:[0.333,0.666,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined throttle / dynamic brake PowerHandle_F/_B 0..1 (full dynamic 0 / dynamic continuous to 0.49 / Off 0.51 / P1 0.555 / power continuous 0.585..1), inverted as on the ACS-64: full power at the far end (raw 0 ±0.04), power zone 0.045..0.45, Off 0.5 ±0.05, dynamic zone 0.55..0.955, full dynamic 1 ±0.04 nearest',assignments:[{type:'direct_control',controls:'PowerHandle_{SIDE:F:B}',input_value:{min:0,max:1,steps:[0,null,0.51,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.55},{threshold:0.5,threshold_tolerance:0.05},{threshold:0.45,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake_F/_B (Release 0 / Hold 0.2 / Lap 0.4 / Service 0.6 / Handle Off 0.8 / Emergency 1, all notches), inverted: Emergency at the far end, Release nearest, six even bands',assignments:[{type:'direct_control',controls:'AutomaticBrake_{SIDE:F:B}',input_value:{min:0,max:1,steps:[0,0.2,0.4,0.6,0.8,1],invert:true}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake_F/_B (Release 0.1 / continuous 0.2..0.9 / Full 1), inverted: Full at the far end, Release nearest',assignments:[{type:'direct_control',controls:'IndependentBrake_{SIDE:F:B}',input_value:{min:0.1,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Reverser handle ReverserHandle_F/_B (MasterSwitch push button: In 1 / 0): PARK BRK up = handle in (the leading cab loads with it in)',assignments:[pair('ReverserHandle_{SIDE:F:B}',1,0)]},
 {name:'GearLever',description:'Alerter acknowledge (AlerterAcknowledge_F/_B push button, held); also the cab signal acknowledge (SDU_Acknowledge_{SIDE:F:B}, held): one press answers both',assignments:[mom('x','','AlerterAcknowledge_{SIDE:F:B}',1,0).assignment,mom('x','','SDU_Acknowledge_{SIDE:F:B}',1,0).assignment]},
 mom('LeftThrottleButton','Sand (Sand_F/_B spring lever: 1 while held, rest 0.5)','Sand_{SIDE:F:B}',1,0.5),
 mom('RightThrottleButton','Horn (Horn_F/_B 1 while held, 0 released)','Horn_{SIDE:F:B}',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell_F/_B On 1 while up, Off 0 when down)',assignments:[pair('Bell_{SIDE:F:B}',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling: ATC_Cut-OutSwitch and ACSES_Cut-OutSwitch (Cut-In 1 / Cut-Out 0). Lit = cut in; both load cut out',assignments:[togA('ATC_Cut-OutSwitch_{SIDE:F:B}',1,0),togA('ACSES_Cut-OutSwitch_{SIDE:F:B}',1,0)]},
 tog('RightAuxButton','Alerter (AlerterCut-OutSwitch Cut-In 1 / Cut-Out 0). Lit = cut in; loads cut out','AlerterCut-OutSwitch_{SIDE:F:B}',1,0),
 tog('RoundAuxButton','Marker lights (MarkerLights_F/_B 1 / 0). Lit = on','MarkerLights_{SIDE:F:B}',1,0),
 {name:'RotaryCrank',description:'Wipers off (WindshieldWiperLeft / Right 0)',assignments:[set('WindshieldWiperLeft_{SIDE:F:B}',0),set('WindshieldWiperRight_{SIDE:F:B}',0)]},
 {name:'RotaryIgnStart',description:'Wipers slow (WindshieldWiperLeft / Right 0.666)',assignments:[set('WindshieldWiperLeft_{SIDE:F:B}',0.666),set('WindshieldWiperRight_{SIDE:F:B}',0.666)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Headlights dim (HeadlightsFront_F/_B 0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Headlights bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Bright and ditch lights auto (Ditch/CrossingLights 0.5)',assignments:lights(1,0.5)},
 {name:'AutoBrake4',description:'Lights | Bright and ditch lights manual (1)',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-njt-alp46-dtg-thejag',title:'ALP-46',eyebrow:'NJ Transit · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Morristown Line: New York & Hoboken – Dover · NEC New York – Trenton',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-njtransit-slate.svg',alt:'NJ Transit'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/njt-alp46-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle / dynamic',continuous:true,notches:['Power max',null,'Off',null,'Dyn. max'],start:2},
 rightThrottle:{name:'Automatic brake',notches:['Emergency','Handle off','Service','Lap','Hold','Release'],start:2},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter · cab signal ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ ditch auto'},{short:'HI',desc:'+ ditch manual'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:null,
 leftAux:{name:'ATC · ACSES'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wiper',left:'off',right:'low'}, roundAux:{name:'Marker lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser handle',flat:'out',up:'in'}},
setup:['PARK BRK up: reverser handle in','Handle at Off, then reverser from Neutral to Forward (it only moves at Off)','ATC / ACSES and alerter on (aux squares lit; all load cut out)','Lights to Bright, ditch lights auto; the pantograph loads up','Independent at Full, automatic brake at Service (parked)'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release, independent to Release','Handle away from you into the power zone','Acknowledge the alerter and the cab signal with the gear lever','Brake: handle back through Off into the dynamic zone; automatic brake to Service, Lap holds; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-njt-alp46-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
