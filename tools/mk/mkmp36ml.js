// Metrolink MPI MP36PH-3C (DTG, San Bernardino Line), 2026-10-13. Derived from mkf59ph.js: the same node names and combined handle with
// other values. One cab, plain node names; IS_GetActiveCab false/false. Capture agent probe (ReverserHandle in): ThrottleAndBrakeHandle
// (Throttle, -1..1, loads Idle 0): dynamic continuous -0.3..-1 (output -2 .. -9) / Setup -0.2 / Idle 0 / N1..N8 at k/8 (snaps); ONE GATE PER
// API SET at Idle and Setup (Idle to -1 stops at Setup, Idle to 1 stops at N1; free within a zone). AutomaticBrake moves freely: Release 0 /
// Initial Reduction 0.095 / service 0.15..0.60 / Full Service 0.65 / Suppression 0.745 / Handle Off 0.845 / Emergency 1 (loads 0.65).
// IndependentBrake rest 0 / Release 0.1 / continuous 0.125..1; IndependentBrakeBailOffLever a spring. Reverser -1 / 0 / 1, locked in Neutral
// with ReverserHandle Out; Neutral to Forward works in any handle position, Forward to Neutral only at Idle. Loads PART COLD: ReverserHandle
// Out, CutOffPilotValve Out 0 / Freight 0.5 / Passenger 1 ("CUT OUT"), TMSBreaker (WarningDevices) Off, ATS_CutOut 0, HeadlightsFront Off;
// engine, generator field, fuel pump, battery and fuses on. HeadlightsFront Off 0 / Dim 0.2 / Bright 0.5 / Bright + Auxiliary 1;
// HeadlightsRear Off 0 / Dim 0.5 / Bright 1; PulseCrossingLights momentary; Wiper_R continuous. Door nodes valueless (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680120';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_SBD_ML_MP36PH-3C_C'].map(c=>({class_name:c}));
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
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Locked in Neutral unless the reverser handle is in (PARK BRK up); back to Neutral only with the handle at Idle',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined throttle / dynamic handle ThrottleAndBrakeHandle -1..1 (dynamic continuous -0.3..-1 / Setup -0.2 / Idle 0 / N1..N8 at k/8; one gate per API set at Idle and Setup), inverted: N8 at the far end (raw 0), notches every 0.06 down to N1 at 0.42, Idle 0.5 ±0.04, Setup 0.58 ±0.03, dynamic zone 0.63..0.955, full dynamic 1 nearest',assignments:[{type:'direct_control',controls:'ThrottleAndBrakeHandle',input_value:{min:-1,max:1,steps:[-1,null,-0.2,0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true,step_thresholds:thMC}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Initial reduction 0.095 / service continuous 0.15..0.60 / Full Service 0.65 / Suppression 0.745 / Handle Off 0.845 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1, Suppression 0.2, Full Service 0.3, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.095,null,0.65,0.745,0.845,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Release 0.1 / continuous 0.125..1), inverted: Full at the far end, Released nearest',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0.1,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0) and CutOffPilotValve (Passenger 1 / Out 0); the loco loads with the handle out and the brake valve cut out. PARK BRK up = handle in, brakes in Passenger',assignments:[pair('ReverserHandle',1,0),pair('CutOffPilotValve',1,0)]},
 {name:'GearLever',description:'Alerter reset (AlerterReset, held); also the ATS acknowledge (ATS_Acknowledge, held): one press answers both',assignments:[mom('x','','AlerterReset',1,0).assignment,mom('x','','ATS_Acknowledge',1,0).assignment]},
 mom('LeftThrottleButton','Sand (SandMomentary)','SandMomentary',1,0),
 mom('RightThrottleButton','Horn (Horn)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (BellProxy On 1 while up, Off 0 when down)',assignments:[pair('BellProxy',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrakeBailOffLever 1 while up, 0 when down; a spring, may need the cab)',assignments:[pair('IndependentBrakeBailOffLever',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','ATS (ATS_CutOut Cut In 1 / Cut Out 0). Lit = cut in; loads cut out','ATS_CutOut',1,0),
 tog('RightAuxButton','Alerter (TMSBreaker On 1 / Off 0). Lit = on; loads off','TMSBreaker',1,0),
 mom('RoundAuxButton','Pulse crossing lights (PulseCrossingLights, held)','PulseCrossingLights',1,0),
 {name:'RotaryCrank',description:'Wiper off (Wiper_R 0)',assignments:[set('Wiper_R',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (Wiper_R 0.5)',assignments:[set('Wiper_R',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (HeadlightsFront 0.2)',assignments:lights(0.2,0)},
 {name:'AutoBrake2',description:'Lights | Front bright (0.5)',assignments:lights(0.5,0)},
 {name:'AutoBrake3',description:'Lights | Front bright with auxiliary lights (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Front bright, rear dim (HeadlightsRear 0.5)',assignments:lights(0.5,0.5)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-metrolink-mp36ph-dtg-thejag',title:'MP36PH-3C',eyebrow:'Metrolink · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'San Bernardino Line: Los Angeles – San Bernardino',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-metrolink-slate.svg',alt:'Metrolink'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/metrolink-mp36ph-3c-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle / dynamic',notches:['N8','N7','N6','N5','N4','N3','N2','N1','Idle','Setup',null,'Dyn. full'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Initial','Release'],start:3},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Released'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter · ATS ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ auxiliary'},{short:'HI',desc:'+ rear dim'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'ATS'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'Crossing lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handle · brake valve',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, brake valve to Passenger (the loco loads with the valve cut out)','Handle at Idle, then reverser from Neutral to Forward','ATS and alerter on (aux squares lit)','Lights to Bright','Independent at Full, automatic brake at Full service (parked)'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; independent to Released, ENG 2 up to bail off','Handle away from you: N1 … N8 (the game stops at N1 first)','Reset the alerter and the ATS with the gear lever','Brake: handle back through Idle and Setup into the dynamic zone; automatic brake into the service zone; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-metrolink-mp36ph-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
