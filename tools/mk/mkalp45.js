// NJ Transit ALP-45DP (Bombardier dual-mode, DTG loco add-on for the Morristown Line), 2026-10-13. Derived from mkacs64.js: the same
// combined handle and brake stand idea. One cab, plain node names; IS_GetActiveCab false/false. Capture agent probe (ReverserHandle in):
// MasterController (Throttle, -1..1, loads 0) dynamic continuous -0.06..-1 (output -1..-10 in 0.1 steps) / Off 0 / power continuous
// 0.1..1 (output 1..10), free in Neutral and Forward. AutomaticBrake fully notched Release 0 / Hold 0.2 / Lap 0.4 / Service 0.6 / Handle Off
// 0.8 / Emergency 1 (loads Handle Off). IndependentBrake Release 0.1 / continuous 0.15..0.9 / Full 1; bail-off is the IndependentBailOff push
// button. Reverser Isolate 0 / Reverse 0.33 / Neutral 0.66 / Forward 1 (loads Isolate), moves only with ReverserHandle (MasterSwitch push
// button, Inserted 1) set AND MasterController at 0. Loads in electric (pantograph up, Dual Mode); PantographSwitch is a spring Down 0 /
// rest 0.5 / Up 1; the diesel engine start was not found (display soft keys). Loads cold: AlerterCutOut (Cut-In 1) and ATC_Isolation /
// ACSES_Isolation (On 1) at 0. Horn lever (On 1), HornPedal, Bell 0 / 1, Sand spring lever (rest 0.5, sanding at 1), HeadlightsFront /
// HeadlightsRear Off 0 / Dim 0.5 / Bright 1, Ditch/CrossingLights Off 0 / Auto 0.5 / Manual 1, WiperControlOperatorSide Off 0 / Int 0.333 /
// Low 0.666 / High 1. Doors valueless (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680350';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_MRT_NJT_ALP45DP_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,d)=>[set('HeadlightsFront',h),set('Ditch/CrossingLights',d)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0.33 / Neutral 0.66 / Forward 1; Isolate 0 stays in the cab; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up) and the handle at Off',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0.33,max:1,steps:[0.33,0.66,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined throttle / dynamic brake MasterController -1..1 (full dynamic -1 / dynamic continuous / Off 0 / power continuous / full power 1), inverted as on the ACS-64: full power at the far end (raw 0 ±0.04), power zone 0.045..0.45, Off 0.5 ±0.05, dynamic zone 0.55..0.955, full dynamic 1 ±0.04 nearest',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:-1,max:1,steps:[-1,null,0,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.55},{threshold:0.5,threshold_tolerance:0.05},{threshold:0.45,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Hold 0.2 / Lap 0.4 / Service 0.6 / Handle Off 0.8 / Emergency 1, all notches), inverted: Emergency at the far end, Release nearest, six even bands',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.2,0.4,0.6,0.8,1],invert:true}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Release 0.1 / continuous to Full 1), inverted: Full at the far end, Release nearest',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0.1,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Reverser handle ReverserHandle (MasterSwitch push button: Inserted 1 / 0): PARK BRK up = handle in; the loco loads with it out and the reverser in Isolate',assignments:[pair('ReverserHandle',1,0)]},
 {name:'GearLever',description:'Alerter acknowledge / penalty reset (AlerterAcknowledge/PenaltyReset push button, held); also the cab signal acknowledge (SDU_Acknowledge, held): one press answers both',assignments:[mom('x','','AlerterAcknowledge/PenaltyReset',1,0).assignment,mom('x','','SDU_Acknowledge',1,0).assignment]},
 mom('LeftThrottleButton','Sand (Sand spring lever: 1 while held, rest 0.5)','Sand',1,0.5),
 mom('RightThrottleButton','Horn (Horn lever 1 while held, 0 released)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell On 1 while up, Off 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBailOff push button 1 while up, 0 when down)',assignments:[pair('IndependentBailOff',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling: ATC_Isolation and ACSES_Isolation (On 1 / Isolated 0). Lit = on; both load isolated',assignments:[togA('ATC_Isolation',1,0),togA('ACSES_Isolation',1,0)]},
 tog('RightAuxButton','Alerter (AlerterCutOut Cut-In 1 / Cut-Out 0). Lit = cut in; loads cut out','AlerterCutOut',1,0),
 tog('RoundAuxButton','Pantograph (PantographSwitch spring: Up 1 / Down 0, rests at 0.5). Lit = raised; the loco loads with it up','PantographSwitch',1,0),
 {name:'RotaryCrank',description:'Wiper off (WiperControlOperatorSide 0)',assignments:[set('WiperControlOperatorSide',0)]},
 {name:'RotaryIgnStart',description:'Wiper low (WiperControlOperatorSide 0.666)',assignments:[set('WiperControlOperatorSide',0.666)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Headlights dim (HeadlightsFront 0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Headlights bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Bright and ditch lights auto (Ditch/CrossingLights 0.5)',assignments:lights(1,0.5)},
 {name:'AutoBrake4',description:'Lights | Bright and ditch lights manual (1)',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-njt-alp45dp-dtg-thejag',title:'ALP-45DP',eyebrow:'NJ Transit · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Morristown Line: New York & Hoboken – Dover',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-njtransit-slate.svg',alt:'NJ Transit'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/njt-alp45dp-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle / dynamic',continuous:true,notches:['Power max',null,'Off',null,'Dyn. max'],start:2},
 rightThrottle:{name:'Automatic brake',notches:['Emergency','Handle off','Service','Lap','Hold','Release'],start:2},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter · cab signal ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ ditch auto'},{short:'HI',desc:'+ ditch manual'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'ATC · ACSES'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wiper',left:'off',right:'low'}, roundAux:{name:'Pantograph'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser handle',flat:'out',up:'in'}},
setup:['PARK BRK up: reverser handle in (the reverser loads in Isolate)','Handle at Off, then reverser from Neutral to Forward (it only moves at Off)','ATC / ACSES and alerter on (aux squares lit; all load isolated)','Lights to Bright, ditch lights auto; the loco loads in electric with the pantograph up (diesel start is on the display)','Independent at Full, automatic brake at Service (parked)'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release, independent to Release (ENG 2 up to bail off)','Handle away from you into the power zone','Acknowledge the alerter and the cab signal with the gear lever','Brake: handle back through Off into the dynamic zone; automatic brake to Service, Lap holds; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-njt-alp45dp-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
