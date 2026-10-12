// Caltrain EMD F40PH-2CAT (DTG, Peninsula Corridor), 2026-10-12. Derived from mksd40bnsf.js (US freight layout, AAR control stand). One cab,
// plain node names; IS_GetActiveCab fails. Capture agent probe: Throttle Idle 0 / N1..N8 at k/8; DynamicBrake Off 0 / Setup 0.15 / B1 0.275 /
// continuous 0.28..1 = 8 (LOCKED in Neutral); AutomaticBrake SIX DETENTS with no service zone: Release 0 / Holding 0.2 / Lap 0.4 / Service
// 0.6 / Handle Off 0.8 / Emergency 1 (loads Handle Off; the output is the notch index); IndependentBrake Release 0.1 / continuous to 1, bail-off
// below 0 is a spring (-0.25 reads -0.18 for 100 ms); Reverser -1 / 0 / 1, locked with ReverserHandle Out. The loco loads PART COLD:
// ReverserHandle (MasterSwitch) Out, CutOffValve (brake valve) Out 0 / In 0.94, EngineRun / GeneratorField / ControlAndFuelPump Off. Buttons:
// AlerterReset, Sand, SandingLeadTruck, Horn (no named values), Bell Off 0 / On 1, AlerterControl (WarningDevices) 0 / 1, DitchLights Off / On,
// DitchlightsPulse, HeadlightsFront Off 0 / Dim 0.215 / Bright 0.64 / Bright-Cruising 1, HeadlightsRear same values, Wiper_R % lever,
// IsolationSwitch Run 0 / Isolate 0.89, MU2A_Valve Lead 0 / Trail 0.89, HeadEndPowerMode Normal -1 / Off 0 / Stand By 1. No door values
// (keys y / u). The northbound Caltrain services are led by the Nippon gallery cab car (RVM_SFJ_CT_Nippon_CabCar_C, not captured).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4678960';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_SFJ_CT_F40PH-2CAT_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,d)=>[set('HeadlightsFront',fr),set('DitchLights',d)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up); the dynamic brake only moves out of Neutral',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 (step values on the stored positions), inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (six detents, no service zone: Release 0 / Holding 0.2 / Lap 0.4 / Service 0.6 / Handle Off 0.8 / Emergency 1), inverted: Emergency at the far end, Release nearest, even bands',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.2,0.4,0.6,0.8,1],invert:true}}]},
 {name:'FlapLever',description:'Dynamic brake DynamicBrake (Off 0 / Setup 0.15 / B1 0.275 / continuous to 1 = 8), inverted: full dynamic at the far end (raw 0 ±0.04), zone 0.045..0.86, Set Up 0.9 ±0.03, Off 1 ±0.06 nearest. Locked while the reverser is in Neutral',assignments:[{type:'direct_control',controls:'DynamicBrake',input_value:{min:0,max:1,steps:[0,0.15,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0), CutOffValve (brake valve In 0.94 / Out 0), EngineRun, GeneratorField and ControlAndFuelPump (On 1 / Off 0); the loco loads with all of them off. PARK BRK up = handle in, valve cut in, switches on',assignments:[pair('ReverserHandle',1,0),pair('CutOffValve',0.94,0),pair('EngineRun',1,0),pair('GeneratorField',1,0),pair('ControlAndFuelPump',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset push button, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sand push button)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn push button)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrake -0.25 while up, 0.1 when down; the bail-off is a spring below 0, may need the cab)',assignments:[pair('IndependentBrake',-0.25,0.1)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Alerter (AlerterControl On 1 / Off 0). Lit = on; loads off','AlerterControl',1,0),
 tog('RightAuxButton','Electro-pneumatic brake (ElectroPneumaticBrake On 1 / Off 0). Lit = on','ElectroPneumaticBrake',1,0),
 tog('RoundAuxButton','Independent brake IndependentBrake: Full 1 / Release 0.1. Lit = applied; loads released','IndependentBrake',1,0.1),
 {name:'RotaryCrank',description:'Wipers off (Wiper_R 0)',assignments:[set('Wiper_R',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (Wiper_R 0.5)',assignments:[set('Wiper_R',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Headlights dim (HeadlightsFront 0.215)',assignments:lights(0.215,0)},
 {name:'AutoBrake2',description:'Lights | Headlights bright (0.64)',assignments:lights(0.64,0)},
 {name:'AutoBrake3',description:'Lights | Headlights bright-cruising (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Bright and ditch lights (DitchLights 1)',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-caltrain-f40ph-dtg-thejag',title:'F40PH-2CAT',eyebrow:'Caltrain · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Peninsula Corridor: San Francisco – San Jose',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-caltrain-slate.svg',alt:'Caltrain'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/caltrain-f40ph-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',notches:['Emergency','Handle off','Service','Lap','Holding','Release'],start:2},
 flap:{name:'Dynamic brake',continuous:true,notches:['8',null,'Setup','Off'],start:3},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'Cruising'},{short:'HI',desc:'+ ditch'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Alerter'}, rightAux:{name:'EP brake'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · valve · switches',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, brake valve cut in, engine run / generator field / control switches on (the loco loads with them off); isolation switch at Run and HEP in the cab','Reverser from Neutral to Forward; alerter on (left aux lit)','Lights to Bright, ditch lights on','Independent applied (round aux lit), automatic brake at Service (parked); throttle Idle, dynamic Off'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; round aux out to release the independent, ENG 2 up to bail off','Throttle notch by notch; keep the dynamic brake Off while powering','Reset the alerter with the gear lever','Brake: throttle to Idle, dynamic brake past Setup into the zone; automatic brake to Service, Lap to hold, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-caltrain-f40ph-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
