// Tri-Rail BL36PH (Brookville, DTG, Florida Tri-Rail: Miami – Boca Raton), 2026-10-13. Derived from mkf59ph.js: the same node names for
// the combined handle, brakes, bail-off and reverser key. One cab, plain node names; IS_GetActiveCab false/false. Capture agent probe:
// ThrottleAndBrakeHandle (-1..1) dynamic continuous -0.2..-1 / Setup -0.15 / Idle 0.125 / N1..N8 at 0.325 / 0.421 / 0.517 / 0.613 / 0.709 /
// 0.805 / 0.901 / 1.0, one gate per API set at Idle and Setup. AutomaticBrake free: Release 0 / Minimum 0.095 / service 0.15..0.525 / Full
// Service 0.55 (loads) / Handle Off 0.845 / Emergency 1 (0.56..0.72 unstable). IndependentBrake rest 0 / Release 0.1 / 0.125..1;
// IndependentBrakeBailOffLever a spring. Reverser -1 / 0 / 1, dead with ReverserHandle (MasterSwitch push button) Out, and it LATCHES LOCKED
// after the throttle has left Idle and come back; cycling ReverserHandle Out -> In with the throttle at Idle clears it (PARK BRK down / up).
// Loads cold: GeneratorField 0, TMSFuse (alerter) 0, ATC_CutOut (Cut In 1) 0, ReverserHandle Out, headlights off; CutOffPilotValve loads
// Passenger. ManualSand, BellProxy, Horn_R (High 1), DitchLightFlash, AlerterReset push buttons; HeadlightsFront Off 0 / Dim 0.33 / Bright
// 0.66 / Bright + Ditch 1, HeadlightsRear 0 / 1; WiperSwitch Off 0.5.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680810';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_MPB_TR_BL36PH_C','RVM_MPB_TR_BL36PH_OnTrack_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('HeadlightsFront',fr),set('HeadlightsRear',re)];
// raw axis, inverted: N8 at the far end (raw 0) .. Idle 0.5 .. full dynamic nearest (raw 1); the F125 bands
const thMC=[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.63},{threshold:0.58,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.04},{threshold:0.42,threshold_tolerance:0.025},{threshold:0.36,threshold_tolerance:0.025},{threshold:0.3,threshold_tolerance:0.025},{threshold:0.24,threshold_tolerance:0.025},{threshold:0.18,threshold_tolerance:0.025},{threshold:0.12,threshold_tolerance:0.025},{threshold:0.06,threshold_tolerance:0.025},{threshold:0,threshold_tolerance:0.03}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Locked unless the reverser handle is in (PARK BRK up); it latches locked after the throttle has left Idle: PARK BRK down and up again at Idle frees it',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined throttle / dynamic handle ThrottleAndBrakeHandle -1..1 (dynamic continuous -0.2..-1 / Setup -0.15 / Idle 0.125 / N1..N8 at 0.325..1.0; one gate per API set at Idle and Setup), inverted: N8 at the far end (raw 0), notches every 0.06 down to N1 at 0.42, Idle 0.5 ±0.04, Setup 0.58 ±0.03, dynamic zone 0.63..0.955, full dynamic 1 nearest',assignments:[{type:'direct_control',controls:'ThrottleAndBrakeHandle',input_value:{min:-1,max:1,steps:[-1,null,-0.15,0.125,0.325,0.421,0.517,0.613,0.709,0.805,0.901,1],invert:true,step_thresholds:thMC}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Minimum 0.095 / service continuous 0.15..0.525 / Full Service 0.55 / Handle Off 0.845 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1, Full Service 0.2, service zone 0.26..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.095,null,0.55,0.845,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.26},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Release 0.1 / continuous 0.125..1), inverted: Full at the far end, Released nearest',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0.1,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0) and GeneratorField (On 1 / Off 0); the loco loads with both off. PARK BRK down and up again at Idle also frees the latched reverser',assignments:[pair('ReverserHandle',1,0),pair('GeneratorField',1,0)]},
 {name:'GearLever',description:'Alerter reset (AlerterReset, held); also the cab signal acknowledge (EATC_Acknowledge, held): one press answers both',assignments:[mom('x','','AlerterReset',1,0).assignment,mom('x','','EATC_Acknowledge',1,0).assignment]},
 mom('LeftThrottleButton','Sand (ManualSand, held)','ManualSand',1,0),
 mom('RightThrottleButton','Horn (Horn_R High 1, held)','Horn_R',1,0),
 {name:'LeftEngineOn',description:'Bell (BellProxy On 1 while up, Off 0 when down)',assignments:[pair('BellProxy',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrakeBailOffLever 1 while up, 0 when down; a spring, may need the cab)',assignments:[pair('IndependentBrakeBailOffLever',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','ATC / PTC (ATC_CutOut Cut In 1 / Cut Out 0). Lit = cut in; loads cut out','ATC_CutOut',1,0),
 tog('RightAuxButton','Alerter (TMSFuse On 1 / Off 0). Lit = on; loads off','TMSFuse',1,0),
 mom('RoundAuxButton','Ditch light flash (DitchLightFlash, held)','DitchLightFlash',1,0),
 {name:'RotaryCrank',description:'Wiper off (WiperSwitch 0.5)',assignments:[set('WiperSwitch',0.5)]},
 {name:'RotaryIgnStart',description:'Wiper intermittent (WiperSwitch 0.75)',assignments:[set('WiperSwitch',0.75)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (HeadlightsFront 0.33)',assignments:lights(0.33,0)},
 {name:'AutoBrake2',description:'Lights | Front bright (0.66)',assignments:lights(0.66,0)},
 {name:'AutoBrake3',description:'Lights | Front bright with ditch lights (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Front bright, rear on (HeadlightsRear 1)',assignments:lights(0.66,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-trirail-bl36ph-dtg-thejag',title:'BL36PH',eyebrow:'Tri-Rail · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Florida Tri-Rail: Miami – Boca Raton',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-trirail-slate.svg',alt:'Tri-Rail'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/trirail-bl36ph-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle / dynamic',notches:['N8','N7','N6','N5','N4','N3','N2','N1','Idle','Setup',null,'Dyn. full'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Full service',null,'Minimum','Release'],start:2},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Released'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter · cab signal ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ ditch'},{short:'HI',desc:'+ rear'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'ATC · PTC'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'Ditch flash'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · field',flat:'out',up:'in'}},
setup:['PARK BRK up: reverser handle in, generator field on (both load off)','Reverser from Neutral to Forward at Idle (if it is locked: PARK BRK down and up again at Idle)','ATC / PTC and alerter on (aux squares lit; both load off)','Lights to Bright','Independent at Full, automatic brake at Full service (parked)'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; independent to Released, ENG 2 up to bail off','Handle away from you: N1 … N8 (the game stops at N1 first)','Reset the alerter and the cab signal with the gear lever','Brake: handle back through Idle and Setup into the dynamic zone; automatic brake into the service zone; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-trirail-bl36ph-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
