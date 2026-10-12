// MBTA MPI HSP46 (DTG, Boston – Providence gameplay pack and Boston – Worcester; the Providence services load the BOW class), 2026-10-12.
// Derived from mkmbtaf40.js: NO dynamic-brake lever (only the DynamicBrake_CutOut push button), the independent takes the flap. One cab,
// plain node names; IS_GetActiveCab false/false. Capture agent probe: MasterController (Throttle) Idle 0 / N1..N8 at k/8 (snaps, moves
// without a key); AutomaticBrake Release 0 / Minimum Application 0.125-0.15 / service continuous 0.15..0.65 / Full Service 0.7 /
// Suppression 0.8 / Handle Off 0.9 / Emergency 1 (loads 0.9); IndependentBrake (-0.25..1) Released 0 / 0.125 .. Full 1 continuous, Bail Off
// below 0 a spring (loads 0); ReverserLever Reverse 0 / Neutral 0.5 / Forward 1 (snaps), LOCKED whenever it lands in Neutral until the
// ReverserHandle (MasterSwitch push button, Inserted 1) goes 1 THEN 0 (a plain set to 1 does not unlock it; its readback does not follow
// the lock). GeneratorField (GenField) loads Off; Control, EngineRun, EP_Brake, BrakeModeSwitch Cut-In load on. Spring levers at 0.5:
// Horn_FR (up 1 = horn), Sand, LeadTruckSand, AlerterResetNew (Alerter). Buttons ResetAlerter / Acknowledge_R (Alerter), BellOn_FR /
// BellOff_FR, ParkingBrake_On / _Off, Alerter_CutOut (Cut-In 1 / Cut-Out 0, loads 0), ACSES_Cut-Out and ATC_Cut-Out (On 1 / Off 0, load
// 0), DynamicBrake_CutOut, EngineStart / EngineStop, GaugeLights, CabLight, StepLights, FrontMarkerLights, HEP_On / HEP_Off;
// FrontHeadlights Off 0 / Dim 0.5 / Bright with ditch lights 1; RearHeadlights Off / Dim / Bright; WiperSwitch Off 0 / Low 0.5 / High 1;
// EngineIsolation Start-Stop-Isolate 0 / Run 0.91. Doors valueless (keys y / u). Loads under the South Station shed.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679270';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_BOW_MBTA_HSP46_C','RVM_BPE_MBTA_HSP46_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('FrontHeadlights',fr),set('RearHeadlights',re)];
p.controls=[
 {name:'SpeedbrakeLever',description:'ReverserLever (Reverse 0 / Neutral 0.5 / Forward 1; any value in a zone), inverted: Forward at the far end. It LOCKS whenever it lands in Neutral: flick ENG 2 up and down (reverser handle in, then out) to free it',assignments:[{type:'direct_control',controls:'ReverserLever',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 (step values on the stored positions), inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Minimum application 0.15 / service continuous 0.15..0.65 / Full Service 0.7 / Suppression 0.8 / Handle Off 0.9 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.15,null,0.7,0.8,0.9,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Released 0 / 0.125 .. Full 1 continuous), inverted: Full at the far end, Released nearest. No dynamic-brake lever on this loco',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Generator field GeneratorField (On 1 / Off 0; loads Off): PARK BRK up = field on',assignments:[pair('GeneratorField',1,0)]},
 mom('GearLever','Alerter reset (AlerterResetNew spring lever: 1 while held, 0.5 released)','AlerterResetNew',1,0.5),
 mom('LeftThrottleButton','Sand (Sand spring lever: 1 while held, 0.5 released)','Sand',1,0.5),
 mom('RightThrottleButton','Horn (Horn_FR spring lever: 1 while held, 0.5 released)','Horn_FR',1,0.5),
 {name:'LeftEngineOn',description:'Bell: up presses BellOn_FR, down presses BellOff_FR',assignments:[pair('BellOn_FR',1,0),pair('BellOff_FR',0,1)]},
 {name:'RightEngineOn',description:'Reverser handle ReverserHandle (MasterSwitch push button: 1 while up, 0 when down). The reverser only unlocks on the 1-then-0 cycle, so flick ENG 2 up and back down whenever the reverser sits locked in Neutral',assignments:[pair('ReverserHandle',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling: ACSES_Cut-Out and ATC_Cut-Out push buttons (On 1 / Off 0). Lit = on; both load off',assignments:[togA('ACSES_Cut-Out',1,0),togA('ATC_Cut-Out',1,0)]},
 tog('RightAuxButton','Alerter (Alerter_CutOut Cut-In 1 / Cut-Out 0). Lit = cut in; loads cut out','Alerter_CutOut',1,0),
 tog('RoundAuxButton','Independent bail-off (IndependentBrake -0.25 / 0; a spring, may need the cab). Lit = bailing off','IndependentBrake',-0.25,0),
 {name:'RotaryCrank',description:'Wipers off (WiperSwitch 0)',assignments:[set('WiperSwitch',0)]},
 {name:'RotaryIgnStart',description:'Wipers low (WiperSwitch 0.5)',assignments:[set('WiperSwitch',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (FrontHeadlights 0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Front bright with ditch lights (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Front bright, rear dim (RearHeadlights 0.5)',assignments:lights(1,0.5)},
 {name:'AutoBrake4',description:'Lights | Rear bright only (this end trailing)',assignments:lights(0,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-mbta-hsp46-dtg-thejag',title:'HSP46',eyebrow:'MBTA · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Northeast Corridor: Boston – Providence · Boston – Worcester',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-mbta-slate.svg',alt:'MBTA'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/mbta-hsp46-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Released'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright + ditch'},{short:'3',desc:'+ rear dim'},{short:'HI',desc:'Rear only'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Reverser handle',start:true},
 leftAux:{name:'ACSES · ATC'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Bail-off'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Generator field',flat:'off',up:'on'}},
setup:['PARK BRK up: generator field on (loads off). Flick ENG 2 up and down (reverser handle in, then out) to unlock the reverser; it locks again every time it passes Neutral','Reverser from Neutral to Forward; ACSES / ATC and alerter on (aux squares lit); HEP in the cab','Lights to Bright with ditch lights','Independent at Full, automatic brake at Full service (parked); throttle Idle'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; independent to Released, round aux to bail off','Throttle notch by notch','Reset the alerter with the gear lever','Brake: throttle to Idle, automatic brake into the service zone, independent for the final stop; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-mbta-hsp46-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
