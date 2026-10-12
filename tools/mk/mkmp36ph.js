// Caltrain MPI MP36PH-3C (DTG loco pack, pak SFJMP36PH, Peninsula Corridor), 2026-10-12. Derived from mkgp60m.js: the same combined throttle /
// dynamic handle. One cab, plain node names; IS_GetActiveCab fails. Capture agent probe: Throttle (Throttle, -1..1) Idle 0 / P1..P8 at k/8,
// dynamic side Setup -0.2 / B1 -0.3 .. B8 -1 in 0.1 steps (quantised, NOT locked in Neutral); AutomaticBrake Release 0 / Initial Reduction 0.1 /
// service continuous 0.15..0.6 / Full Service 0.65 / Suppression 0.75 / Handle Off 0.85 / Emergency 1 (loads 0.85); IndependentBrake Release 0 /
// continuous 0.1..1, bail-off below 0 is a spring; Reverser -1 / 0 / 1 (locked with the handle Out). Loads PART COLD as the F40PH:
// ReverserHandle (MasterSwitch) Out, CutOffValve Out 0 / Freight 0.5 / Passenger 1, EngineRun / GeneratorField / ControlAndFuelPump Off,
// TMSBreaker (WarningDevices, alerter breaker) Off, MU2A_Valve at Trail 1 (Lead 0), HEPMode Isolate 0 / Run 1. Buttons TMSReset (Alerter),
// Sand, SandingLeadTruck, Bell 0 / 1, DitchlightsPulse, DitchLights 0 / 1 (loads on), ElectroPneumaticBrake 0 / 1, DynamicBrakeCutout;
// Horn IrregularLever; HeadlightsFront Off 0 / Dim 0.2 / Bright 0.5 / Bright-Cruising 1; HeadlightsRear Off 0 / Dim 0.5 / Bright 1;
// Wiper_R SimpleLever 0..1. No door nodes (keys y / u). The pack's Bombardier bi-level cab car is its own README line.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679010';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_SFJ_CT_MP36PH-3C_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,d)=>[set('HeadlightsFront',fr),set('DitchLights',d)];
// raw-axis bands, far end (raw 0) = N8 .. Idle at 0.5 .. B8 nearest (raw 1)
const thCombined=[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.68},{threshold:0.64,threshold_tolerance:0.03},{threshold:0.58,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.04},{threshold:0.42,threshold_tolerance:0.025},{threshold:0.36,threshold_tolerance:0.025},{threshold:0.3,threshold_tolerance:0.025},{threshold:0.24,threshold_tolerance:0.025},{threshold:0.18,threshold_tolerance:0.025},{threshold:0.12,threshold_tolerance:0.025},{threshold:0.06,threshold_tolerance:0.025},{threshold:0,threshold_tolerance:0.03}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined throttle / dynamic handle Throttle -1..1 (B8 -1 / dynamic B7..B1 in 0.1 steps to -0.3 / Setup -0.2 / Idle 0 / P1..P8 at k/8), inverted: N8 at the far end (raw 0), notches every 0.06 down to N1 at 0.42, Idle 0.5 ±0.04, Set-up 0.58, B1 0.64, dynamic zone 0.68..0.955, B8 1 nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:-1,max:1,steps:[-1,null,-0.3,-0.2,0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true,step_thresholds:thCombined}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Initial reduction 0.1 / service continuous 0.15..0.6 / Full Service 0.65 / Suppression 0.75 / Handle Off 0.85 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1, Suppression 0.2, Full Service 0.3, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.1,null,0.65,0.75,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Release 0 / continuous 0.1..1), inverted: Full at the far end, Release nearest',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0), CutOffValve (Passenger 1 / Out 0), EngineRun, GeneratorField and ControlAndFuelPump (On 1 / Off 0); the loco loads with all of them off. PARK BRK up = handle in, valve cut in, switches on',assignments:[pair('ReverserHandle',1,0),pair('CutOffValve',1,0),pair('EngineRun',1,0),pair('GeneratorField',1,0),pair('ControlAndFuelPump',1,0)]},
 mom('GearLever','Alerter reset (TMSReset push button, held)','TMSReset',1,0),
 mom('LeftThrottleButton','Sand (Sand push button)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn lever 1, back to 0)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrake -1 while up, 0 when down; a spring, may need the cab)',assignments:[pair('IndependentBrake',-1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Alerter breaker (TMSBreaker On 1 / Off 0). Lit = on; loads off','TMSBreaker',1,0),
 tog('RightAuxButton','Electro-pneumatic brake (ElectroPneumaticBrake On 1 / Off 0). Lit = on; loads on','ElectroPneumaticBrake',1,0),
 tog('RoundAuxButton','Ditch lights (DitchLights 1 / 0). Lit = on','DitchLights',1,0),
 {name:'RotaryCrank',description:'Wipers off (Wiper_R 0)',assignments:[set('Wiper_R',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (Wiper_R 0.5)',assignments:[set('Wiper_R',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Headlights dim (HeadlightsFront 0.2)',assignments:lights(0.2,0)},
 {name:'AutoBrake2',description:'Lights | Headlights bright (0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake3',description:'Lights | Headlights bright-cruising (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Bright-cruising and ditch lights (DitchLights 1)',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-caltrain-mp36ph-dtg-thejag',title:'MP36PH-3C',eyebrow:'Caltrain · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Peninsula Corridor: San Francisco – San Jose',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-caltrain-slate.svg',alt:'Caltrain'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/caltrain-mp36ph-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle / dynamic',notches:['P8','P7','P6','P5','P4','P3','P2','P1','Idle','Setup','B1',null,'B8'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Initial','Release'],start:3},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'Cruising'},{short:'HI',desc:'+ ditch'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Alerter breaker'}, rightAux:{name:'EP brake'},
 modeSwitch:{name:'Wipers',left:'off',right:'slow'}, roundAux:{name:'Ditch lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · valve · switches',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, brake valve cut in, engine run / generator field / control switches on (the loco loads with them off); MU-2A valve to Lead and HEP to Run in the cab','Reverser from Neutral to Forward; alerter breaker on (left aux lit)','Lights to Bright, ditch lights on','Independent at Full, automatic brake at Full service (parked); handle at Idle'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release, independent to Release (ENG 2 up to bail off)','Handle away from you: P1 … P8','Reset the alerter with the gear lever','Brake: handle back through Idle and Setup into the dynamic notches; automatic brake into the service zone for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-caltrain-mp36ph-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
