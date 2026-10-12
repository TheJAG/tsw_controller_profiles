// Union Pacific EMD SD70ACe (DTG, Sherman Hill: Cheyenne – Laramie; also New Journeys Cajon Pass and the UP Heritage Collection), 2026-10-13.
// Derived from mkupsd40.js with the doubled assignments of mksff7.js. One cab, plain node names, IS_GetActiveCab fails. AAR stand. Capture
// agent probe: Throttle Idle 0 / N1..N8 at 0.125 / 0.25 / 0.375 / 0.5 / 0.625 / 0.75 / 0.825 (N7 really is 0.825) / 1; DynamicBrake Off 0 /
// Set Up 0.111 / continuous 0.2..1 (output 1..8); AutomaticBrake Release 0 / Minimum 0.1 / service 0.15..0.65 / Full Service 0.7 /
// Suppression 0.8 / Handle Off 0.9 / Emergency 1 (loads 0.9); IndependentBrake Release 0.2 / continuous 0.21..1, the Bail Off zone below
// 0.2 never stores through the API and there is no bail-off node; Reverser -1 / 0 / 1. ONE-EVENT-LAGGED interlocks as the Santa Fe F7:
// the reverser stays locked after the throttle returns to Idle until a second set inside Idle (0.01); the dynamic brake stays locked after
// the reverser leaves Neutral until a throttle set inside Idle; the throttle is locked while the dynamic brake is out of Off. So every
// throttle change is sent twice (notch, then notch +0.01, which snaps back). ReverserHandle (MasterSwitch) loads 0 and locks nothing.
// Loads part cold: EngineRun, GeneratorField, FuelPump 0, Fuse_EAD (WarningDevices) and Fuse_CabSignal (SignallingSystems) 0; no brake
// cut-out or MU-2A valve node. Horn is an IrregularLever (High / Low by output), so the profile uses the SecondmanHorn push button.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679300';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.name='TSW | Union Pacific SD70ACe | DTG | TheJAG';
p.rail_class_information=['RVM_SMH_UP_SD70ACe_C','RVM_NJP_UP_SD70ACe_C','RVM_SMH_UPHC_SD70ACe_1982_C','RVM_SMH_UPHC_SD70ACe_1983_C','RVM_SMH_UPHC_SD70ACe_1988_C','RVM_SMH_UPHC_SD70ACe_1989_C','RVM_SMH_UPHC_SD70ACe_1995_C','RVM_SMH_UPHC_SD70ACe_1996_C'].map(class_name=>({class_name}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('HeadlightsFront',fr),set('HeadlightsBack',re)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Locked off Idle; the dynamic brake only moves out of Neutral',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 (the stored positions, N7 0.825), inverted: notch 8 at the far end (pushed away), Idle nearest. Each change is sent twice (notch, then notch +0.01, which snaps back) to free the lagging reverser and dynamic-brake interlocks; locked while the dynamic brake is out of Off',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.825,1],invert:true}},{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0.01,0.135,0.26,0.385,0.51,0.635,0.76,0.835,0.99],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (Release 0 / Minimum 0.1 / service continuous 0.15..0.65 / Full Service 0.7 / Suppression 0.8 / Handle Off 0.9 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.1,null,0.7,0.8,0.9,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Dynamic brake DynamicBrake (Off 0 / Set Up 0.111 / continuous 0.2..1 = 1..8), inverted: full dynamic at the far end (raw 0 ±0.04), zone 0.045..0.86, Set Up 0.9 ±0.03, Off 1 ±0.06 nearest. Locked in Neutral and, after a reverser move, until the throttle has been touched at Idle',assignments:[{type:'direct_control',controls:'DynamicBrake',input_value:{min:0,max:1,steps:[0,0.111,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Set-up: ReverserHandle (MasterSwitch push button 1 / 0), EngineRun, GeneratorField and FuelPump (On 1 / Off 0); the loco loads with the three switches off. PARK BRK up = on',assignments:[pair('ReverserHandle',1,0),pair('EngineRun',1,0),pair('GeneratorField',1,0),pair('FuelPump',1,0)]},
 mom('GearLever','Alerter reset (AlertorReset, held)','AlertorReset',1,0),
 mom('LeftThrottleButton','Sand (Sander push button, held)','Sander',1,0),
 mom('RightThrottleButton','Horn (SecondmanHorn push button, held)','SecondmanHorn',1,0),
 {name:'LeftEngineOn',description:'Bell (NewBell lever On 1 while up, Off 0 when down; loads 0.5)',assignments:[pair('NewBell',1,0)]},
 mom('RightEngineOn','Cab signal acknowledge (CSSAcknowledge, held while up)','CSSAcknowledge',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Alerter fuse (Fuse_EAD On 1 / Off 0). Lit = on; loads off','Fuse_EAD',1,0),
 tog('RightAuxButton','Cab signal fuse (Fuse_CabSignal On 1 / Off 0). Lit = on; loads off','Fuse_CabSignal',1,0),
 tog('RoundAuxButton','Independent brake IndependentBrake: Full 1 / Release 0.2. Lit = applied; loads released (Bail Off cannot be reached through the API)','IndependentBrake',1,0.2),
 {name:'RotaryCrank',description:'Wipers off (WiperControl_FR 0)',assignments:[set('WiperControl_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperControl_FR 0.5; the lever names Off only)',assignments:[set('WiperControl_FR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (HeadlightsFront 0.35)',assignments:lights(0.35,0)},
 {name:'AutoBrake2',description:'Lights | Front bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Front bright, rear dim (HeadlightsBack 0.35)',assignments:lights(1,0.35)},
 {name:'AutoBrake4',description:'Lights | Front dim, rear dim',assignments:lights(0.35,0.35)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-up-sd70ace-dtg-thejag',title:'SD70ACe',eyebrow:'Union Pacific · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Sherman Hill: Cheyenne – Laramie',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-up-slate.svg',alt:'Union Pacific'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/up-sd70ace-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:{name:'Dynamic brake',continuous:true,notches:['8',null,'Set up','Off'],start:3},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ rear dim'},{short:'HI',desc:'Dim both'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Cab signal ack.',start:true},
 leftAux:{name:'Alerter fuse'}, rightAux:{name:'Cab signal fuse'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Set-up',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, engine run / generator field / fuel pump on (the loco loads with them off)','Alerter and cab signal fuses on (aux squares lit); lights to Bright','Independent applied (round aux lit; it loads released), automatic brake at Full service (parked); throttle Idle, dynamic Off','Reverser from Neutral to Forward, then nudge the throttle at Idle: it frees the dynamic brake (a lagging interlock)'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; round aux out to release the independent (no bail-off through the API)','Throttle notch by notch; the throttle is locked while the dynamic brake is out of Off','Reset the alerter with the gear lever; ENG 2 acknowledges the cab signal','Brake: throttle to Idle, dynamic brake past Set up into the zone; automatic brake into the service zone for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-up-sd70ace-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
