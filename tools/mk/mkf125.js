// Metrolink EMD F125 (DTG, San Bernardino Line; also Antelope Valley Line and the Xmas livery), 2026-10-12. US layout. One cab, plain node
// names; IS_GetActiveCab false/false. Capture agent probe (handle button in, reverser Forward): MasterController (Throttle, 0..1) is one
// combined handle: dynamic continuous 0..0.30 (output -2 .. -1) / Setup 0.375 (0.34..0.45) / Idle 0.5 / N1..N8 at 0.55 + (k-1) x 0.45/7
// (0.55 / 0.614 / 0.679 / 0.743 / 0.807 / 0.871 / 0.936 / 1.0, snaps); AutomaticBrakeLever ONE GATE PER API SET (ramp): Release 0 / Minimum
// 0.1 / service continuous 0.125..0.375 with a Suppression gate at 0.275 / Full Service 0.4 / Handle Off 0.8 / Emergency 1 (loads 0.8);
// IndependentBrakeLever Released 0.1 / continuous 0.125..1; IndependentBrakeBailOffLever (BrakeRelease) a spring (1 bails off for 100 ms);
// ReverserLever Reverse 0 / Neutral 0.5 / Forward 1 (snaps), moves only with the handle at Idle and locks in Neutral unless
// ReverserHandleButton (MasterSwitch push button, Inserted 1) is set (a plain set to 1 works here). Loads PART COLD / TRAIL: BrakeModeSwitch
// (BrakeMode) Trail 0 / Test 0.33 / Freight 0.66 / Passenger 1 loads Test with "AIR BRAKE SETUP TRAIL - CUT OUT"; GeneratorFieldSwitch
// (GenField) loads Off; EngineRun, FuelPump, AirBrakeFuse, DynamicBrake_CutOutSwitch (Cut-In 1) on. Buttons ResetAlerterButton /
// AcknowledgeATSButton (Alerter), Alerter_CutOutSwitch (AlerterIsolation, Cut-In 1, loads 0), PTCFuse (loads 0), ATSFuse (WarningDevices,
// loads 0), HornSwitch, HornSequencerSwitch, BellSwitch (On 1 / Off 0), SandSwitch, AuxiliaryPulseLightsSwitch (DitchLights),
// EngineStartButton / EngineStopButton, EngineIsolationSwitch Isolate 0 / Run 0.92, HEP buttons; FrontHeadlightsSwitch Off 0 / Dim 0.33 /
// Bright 0.66 / Bright with Auxiliary 1 (loads 1); RearHeadlightsSwitch Off 0 / Dim 0.5 / Bright 1; EngineerWiperSwitch Off 0 / Low 0.5 /
// High 1; EngineersLightSwitch Red 0 / Off 0.5 / White 1. Doors valueless (keys y / u). The route leaves under 1 GB of commit charge.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680120';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_SBD_ML_F125_C','RVM_ALV_ML_F125_C','RVM_SBD_ML_Xmas_F125_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('FrontHeadlightsSwitch',fr),set('RearHeadlightsSwitch',re)];
// raw axis, inverted: N8 at the far end (raw 0) .. Idle 0.5 .. full dynamic nearest (raw 1)
const thMC=[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.63},{threshold:0.58,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.04},{threshold:0.42,threshold_tolerance:0.025},{threshold:0.36,threshold_tolerance:0.025},{threshold:0.3,threshold_tolerance:0.025},{threshold:0.24,threshold_tolerance:0.025},{threshold:0.18,threshold_tolerance:0.025},{threshold:0.12,threshold_tolerance:0.025},{threshold:0.06,threshold_tolerance:0.025},{threshold:0,threshold_tolerance:0.03}];
p.controls=[
 {name:'SpeedbrakeLever',description:'ReverserLever (Reverse 0 / Neutral 0.5 / Forward 1; any value in a zone), inverted: Forward at the far end. Moves only with the handle at Idle and the reverser handle button in (PARK BRK up)',assignments:[{type:'direct_control',controls:'ReverserLever',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined throttle / dynamic handle MasterController 0..1 (dynamic continuous 0..0.30 / Setup 0.375 / Idle 0.5 / N1..N8 at 0.55..1.0), inverted: N8 at the far end (raw 0), notches every 0.06 down to N1 at 0.42, Idle 0.5 ±0.04, Setup 0.58 ±0.03, dynamic zone 0.63..0.955, full dynamic 1 nearest',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0,null,0.375,0.5,0.55,0.614286,0.678572,0.742858,0.807144,0.87143,0.935716,1],invert:true,step_thresholds:thMC}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrakeLever (Release 0 / Minimum 0.1 / service continuous 0.125..0.375 with Suppression at 0.275 / Full Service 0.4 / Handle Off 0.8 / Emergency 1; one gate per API set, the lever ramps through them), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1, Full Service 0.2, service zone 0.26..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrakeLever',input_value:{min:0,max:1,steps:[0,0.1,null,0.4,0.8,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.26},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrakeLever (Released 0.1 / continuous 0.125..1), inverted: Full at the far end, Released nearest',assignments:[{type:'direct_control',controls:'IndependentBrakeLever',input_value:{min:0.1,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandleButton (MasterSwitch Inserted 1 / 0), GeneratorFieldSwitch (On 1 / Off 0) and BrakeModeSwitch (Passenger 1 / Test 0.33); the loco loads in Test with the field off. PARK BRK up = handle in, field on, brakes in Passenger',assignments:[pair('ReverserHandleButton',1,0),pair('GeneratorFieldSwitch',1,0),pair('BrakeModeSwitch',1,0.33)]},
 mom('GearLever','Alerter reset (ResetAlerterButton, held)','ResetAlerterButton',1,0),
 mom('LeftThrottleButton','Sand (SandSwitch)','SandSwitch',1,0),
 mom('RightThrottleButton','Horn (HornSwitch)','HornSwitch',1,0),
 {name:'LeftEngineOn',description:'Bell (BellSwitch On 1 while up, Off 0 when down)',assignments:[pair('BellSwitch',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrakeBailOffLever 1 while up, 0 when down; a spring, may need the cab)',assignments:[pair('IndependentBrakeBailOffLever',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'PTC and ATS fuses (PTCFuse, ATSFuse: 1 / 0). Lit = closed; both load 0',assignments:[togA('PTCFuse',1,0),togA('ATSFuse',1,0)]},
 tog('RightAuxButton','Alerter (Alerter_CutOutSwitch Cut-In 1 / Cut-Out 0). Lit = cut in; loads cut out','Alerter_CutOutSwitch',1,0),
 tog('RoundAuxButton','Ditch lights pulse (AuxiliaryPulseLightsSwitch 1 / 0). Lit = on','AuxiliaryPulseLightsSwitch',1,0),
 {name:'RotaryCrank',description:'Wipers off (EngineerWiperSwitch 0)',assignments:[set('EngineerWiperSwitch',0)]},
 {name:'RotaryIgnStart',description:'Wipers low (EngineerWiperSwitch 0.5)',assignments:[set('EngineerWiperSwitch',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (FrontHeadlightsSwitch 0.33)',assignments:lights(0.33,0)},
 {name:'AutoBrake2',description:'Lights | Front bright (0.66)',assignments:lights(0.66,0)},
 {name:'AutoBrake3',description:'Lights | Front bright with auxiliary lights (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Front bright, rear dim (RearHeadlightsSwitch 0.5)',assignments:lights(0.66,0.5)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-metrolink-f125-dtg-thejag',title:'F125',eyebrow:'Metrolink · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'San Bernardino Line: Los Angeles – San Bernardino · Antelope Valley Line',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-metrolink-slate.svg',alt:'Metrolink'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/metrolink-f125-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle / dynamic',notches:['N8','N7','N6','N5','N4','N3','N2','N1','Idle','Setup',null,'Dyn. full'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Full service',null,'Minimum','Release'],start:2},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Released'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ auxiliary'},{short:'HI',desc:'+ rear dim'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'PTC · ATS fuses'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wipers',left:'off',right:'low'}, roundAux:{name:'Ditch lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · field · brake mode',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, generator field on, brake mode to Passenger (the loco loads in Test with the field off); HEP in the cab','Handle at Idle, then reverser from Neutral to Forward (it only moves at Idle)','PTC / ATS fuses and alerter on (aux squares lit)','Lights to Bright, ditch lights on (round aux)','Independent at Full, automatic brake at Full service (parked)'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release (the lever ramps through the gates); independent to Released, ENG 2 up to bail off','Handle away from you: N1 … N8','Reset the alerter with the gear lever','Brake: handle back through Idle and Setup into the dynamic zone; automatic brake into the service zone (Suppression sits mid-zone); Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-metrolink-f125-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
