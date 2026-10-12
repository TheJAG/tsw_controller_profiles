// MBTA EMD F40PH-3C (DTG, Boston – Providence; the same loco is RVM_BOW_MBTA_F40PH-3C on Boston – Worcester), 2026-10-12. Derived from
// mkmp15dc.js: NO dynamic brake node, the independent takes the flap. One cab, plain node names; IS_GetActiveCab fails. Capture agent
// probe: Throttle Idle 0 / N1..N8 at k/8 (snaps, moves without any key); AutomaticBrake (26L) Release 0 / Minimum Reduction 0.125 / service
// continuous 0.2..0.64 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.85 / Emergency 1 (loads 0.85, moves with the cut-off valve Out);
// IndependentBrake Release 0.1 / continuous 0.1..1 (loads 0), bail-off below 0 a spring (-0.25 reads -0.21 for 50 ms); Reverser -1 / 0 / 1
// (snaps, 0.5+ stores 0.95), locked with ReverserHandle Out. Loads PART COLD with a TRAILING set-up: ReverserHandle (MasterSwitch) Out,
// CutOffValve Out 0 / In 0.88, MU2A_Valve Lead 0 / Trail 0.87 (loads Trail), EngineRun / GeneratorField / ControlAndFuelPump Off, fuses
// AlerterControl_Fuse (WarningDevices), SafetyDevice_Fuse (SignallingSystems), WarningDevice_Fuse (WarningDevices) Off; MainBattery,
// EPBrake_Switch, DitchLights, Lights, Headlights on. Buttons AlerterReset / ACSAcknowledge_ACSPanel (Alerter), Sand, SandingLeadTruck,
// Bell, GaugeLights, CabLight_L/R, FrontMarkerLights, FrontNumberLights, EngineStart / EngineStop, HEPEngine_Start / _Stop,
// ParkingBrakeSet / Release; Horn IrregularLever (Pressed at both ends); HeadlightsFront / HeadlightsRear Off 0 / Dim 0.5 / Bright 1;
// IsolationSwitch Run 0 / Isolate 0.89; Wiper_R % lever. No door values (keys y / u). Loads at Boston South Station under the shed.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679270';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_BPE_MBTA_F40PH-3C_C','RVM_BOW_MBTA_F40PH-3C_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('HeadlightsFront',fr),set('HeadlightsRear',re)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 (step values on the stored positions), inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (26L: Release 0 / Minimum reduction 0.125 / service continuous 0.2..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.85 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.125,null,0.65,0.7,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Release 0.1 / continuous to 1), inverted: Full at the far end, Release nearest. No dynamic brake on this loco',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0.1,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0), CutOffValve (In 1 / Out 0), MU2A_Valve (Lead 0 / Trail 0.87), EngineRun, GeneratorField and ControlAndFuelPump (On 1 / Off 0); the loco loads as a trailing unit with all of them off. PARK BRK up = handle in, valve cut in, lead, switches on',assignments:[pair('ReverserHandle',1,0),pair('CutOffValve',1,0),pair('MU2A_Valve',0,0.87),pair('EngineRun',1,0),pair('GeneratorField',1,0),pair('ControlAndFuelPump',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset push button, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sand push button)','Sand',1,0),
 mom('RightThrottleButton','Horn (Horn lever 1, back to 0)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrake -0.25 while up, 0.1 when down; the bail-off is a spring below 0, may need the cab)',assignments:[pair('IndependentBrake',-0.25,0.1)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Safety fuses: SafetyDevice_Fuse, AlerterControl_Fuse and WarningDevice_Fuse push buttons (On 1 / Off 0). Lit = on; all load off',assignments:[togA('SafetyDevice_Fuse',1,0),togA('AlerterControl_Fuse',1,0),togA('WarningDevice_Fuse',1,0)]},
 tog('RoundAuxButton','Ditch lights (DitchLights 1 / 0). Lit = on; loads on','DitchLights',1,0),
 {name:'RotaryCrank',description:'Wipers off (Wiper_R 0)',assignments:[set('Wiper_R',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (Wiper_R 0.5)',assignments:[set('Wiper_R',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (HeadlightsFront 0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake2',description:'Lights | Front bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Front bright, rear dim (HeadlightsRear 0.5)',assignments:lights(1,0.5)},
 {name:'AutoBrake4',description:'Lights | Rear bright only (this end trailing)',assignments:lights(0,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-mbta-f40ph-dtg-thejag',title:'F40PH-3C',eyebrow:'MBTA · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Northeast Corridor: Boston – Providence · Boston – Worcester',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-mbta-slate.svg',alt:'MBTA'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/mbta-f40ph-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ rear dim'},{short:'HI',desc:'Rear only'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Safety fuses'}, rightAux:null,
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Ditch lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · valves · switches',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, brake valve cut in, MU-2A to Lead, engine run / generator field / control switches on (the loco loads as a trailing unit with them off)','Reverser from Neutral to Forward; safety fuses on (left aux lit); HEP in the cab','Lights to Bright, ditch lights on (round aux)','Independent at Full, automatic brake at Full service (parked); throttle Idle'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; independent to Release, ENG 2 up to bail off','Throttle notch by notch','Reset the alerter with the gear lever','Brake: throttle to Idle, automatic brake into the service zone, independent for the final stop; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-mbta-f40ph-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
