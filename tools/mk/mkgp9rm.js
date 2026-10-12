// CN EMD GP9RM (DTG, Oakville Subdivision, pak TSW2TorontoIndustrial), 2026-10-12. Derived from mkmp15dc.js: NO dynamic brake, the
// independent takes the flap. One cab, plain node names; IS_GetActiveCab fails. Capture agent probe: Throttle Idle 0 / N1..N8 at k/8 (snaps);
// AutomaticBrake_26L Release 0 / Initial Reduction 0.125 / service continuous 0.2..0.6 / Full Service 0.65 / Suppression 0.7 (and 0.75) /
// Handle Off 0.9 / Emergency 1 (loads 0.9); IndependentBrake Release 0.25 / continuous 0.26..1, bail-off below 0.25 a spring (back at 0.25
// within 0.8 s); Reverser Reverse 0 / Neutral 0.5 / Forward 1 (snaps). Loads PART COLD: ReverserHandle (MasterSwitch) Out, GeneratorField Off,
// BrakeCutOut Cut-Out 0 / Freight 0.5 / Passenger 1, FuseAlerter and FuseSafetyDevices (WarningDevices) Off; EngineRun, ControlFuelPump, MCB
// already on; MU-2A loads Lead. Buttons Horn, Bell, Sander, LeadAxleSander, AlerterAcknowledge (Alerter), EmergencyBrake, EngineStartup
// Prime -1 / Start 1, DitchLights 0 / 1, GaugeLights, PlatformLights / StepLights, CabLight, NumberLights_F / _B; Headlights_F / _B Off 0 /
// Dim 0.33 / Medium 0.66 / Bright 1; HeadlightControl; ClassLights_* Off / White / Green / Red at quarters; wipers unnamed (WiperValve_FL).
// No door nodes (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679020';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_TOR_CN_GP9RM_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,n)=>[set('Headlights_F',fr),set('NumberLights_F',n)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.5 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 (step values on the stored positions), inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake_26L (Release 0 / Initial reduction 0.125 / service continuous 0.2..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.9 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake_26L',input_value:{min:0,max:1,steps:[0,0.125,null,0.65,0.7,0.9,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Release 0.25 / continuous 0.26..1), inverted: Full at the far end, Release nearest. No dynamic brake on this loco',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0.25,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0), GeneratorField (On 1 / Off 0) and BrakeCutOut (Freight 0.5 / Cut-Out 0); the loco loads with all three off. PARK BRK up = handle in, generator field on, brake valve cut in',assignments:[pair('ReverserHandle',1,0),pair('GeneratorField',1,0),pair('BrakeCutOut',0.5,0)]},
 mom('GearLever','Alerter acknowledge (AlerterAcknowledge push button, held)','AlerterAcknowledge',1,0),
 mom('LeftThrottleButton','Sand (Sander push button)','Sander',1,0),
 mom('RightThrottleButton','Horn (Horn push button)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrake -0.5 while up, 0.25 when down; the bail-off is a spring, may need the cab)',assignments:[pair('IndependentBrake',-0.5,0.25)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Alerter and safety devices fuses (FuseAlerter, FuseSafetyDevices On 1 / Off 0). Lit = on; both load off',assignments:[togA('FuseAlerter',1,0),togA('FuseSafetyDevices',1,0)]},
 tog('RoundAuxButton','Ditch lights (DitchLights 1 / 0). Lit = on','DitchLights',1,0),
 {name:'RotaryCrank',description:'Wipers off (WiperValve_FL 0)',assignments:[set('WiperValve_FL',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperValve_FL 0.5)',assignments:[set('WiperValve_FL',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (Headlights_F 0.33)',assignments:lights(0.33,0)},
 {name:'AutoBrake2',description:'Lights | Front medium (0.66)',assignments:lights(0.66,0)},
 {name:'AutoBrake3',description:'Lights | Front bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Front bright and number lights (NumberLights_F 1)',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-cn-gp9rm-dtg-thejag',title:'GP9RM',eyebrow:'CN · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Oakville Subdivision: Toronto – Hamilton',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-cn-slate.svg',alt:'CN'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/cn-gp9rm-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Initial','Release'],start:3},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Medium'},{short:'3',desc:'Bright'},{short:'HI',desc:'+ number'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Alerter fuses'}, rightAux:null,
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Ditch lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · field · valve',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, generator field on, brake valve cut in to Freight (the loco loads with them off)','Reverser from Neutral to Forward; alerter fuses on (left aux lit)','Lights to Bright, ditch lights on (round aux)','Independent at Full, automatic brake at Full service (parked); throttle Idle'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; independent to Release, ENG 2 up to bail off','Throttle notch by notch','Reset the alerter with the gear lever','Brake: throttle to Idle, automatic brake into the service zone, independent for the final stop; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-cn-gp9rm-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
