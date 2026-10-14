// Tri-Rail F40PH-3C (EMD, DTG, Florida Tri-Rail: Miami – Boca Raton), 2026-10-13. Derived from mkmbtaf40.js (MBTA F40PH-3C: no dynamic
// brake lever, trailing set-up). One cab, plain node names; IS_GetActiveCab false/false. Capture agent probe: Reverser Reverse 0 / Neutral
// 0.5 / Forward 1 (snaps), dead with ReverserHandle (MasterSwitch push button) Out and locked while the throttle is off Idle (no BL36PH
// latch). Throttle Idle 0 / N1..N8 at k/8, free. AutomaticBrake 26L Release 0 / Minimum 0.125 / service 0.2..0.44 / Full Service 0.45
// (loads) / Suppression 0.5 / Handle Off 0.85 / Emergency 1 (0.55..0.72 unstable). IndependentBrake Released 0 / continuous 0.125..1,
// bail-off spring below 0. Loads cold / trailing: ReverserHandle Out, GeneratorField Off, CutOffValve Cut-Out 0 (Freight 0.5 / Passenger 1),
// MU2A_Valve Trail 1 (Lead 0), Fuse_AlerterControl Off, TractionInterlock_CutOut Cut-Out 0 (Cut-In 1), ATC_CutOut Cut-Out 0 (Cut-In 1).
// Horn lever (Pressed at ±1), Sander (Sand 1 / Lead Truck -1), Bell 0 / 1, AlerterReset; Headlights Low 0 / High 0.25 / Off 0.5 /
// High-Ditch 0.75 / Low 1 (loads Off); Wiper_R 0..1; doors are push buttons (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680810';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_MPB_TR_F40PH-3C_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=h=>[set('Headlights',h)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.5 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up) and the throttle at Idle',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 at k/8, inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (26L: Release 0 / Minimum 0.125 / service continuous 0.2..0.44 / Full Service 0.45 / Suppression 0.5 / Handle Off 0.85 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.125,null,0.45,0.5,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Independent brake IndependentBrake (Released 0 / continuous 0.125..1), inverted: Full at the far end, Released nearest. No dynamic brake on this loco',assignments:[{type:'direct_control',controls:'IndependentBrake',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Lead set-up: ReverserHandle (MasterSwitch In 1 / Out 0), GeneratorField (On 1 / Off 0), CutOffValve (Passenger 1 / Cut-Out 0), MU2A_Valve (Lead 0 / Trail 1) and TractionInterlock_CutOut (Cut-In 1 / Cut-Out 0); the loco loads as a trailing unit with all of them off. PARK BRK up = lead unit',assignments:[pair('ReverserHandle',1,0),pair('GeneratorField',1,0),pair('CutOffValve',1,0),pair('MU2A_Valve',0,1),pair('TractionInterlock_CutOut',1,0)]},
 {name:'GearLever',description:'Alerter reset (AlerterReset push button, held); also the cab signal acknowledge (ATC_Acknowledge, held): one press answers both',assignments:[mom('x','','AlerterReset',1,0).assignment,mom('x','','ATC_Acknowledge',1,0).assignment]},
 mom('LeftThrottleButton','Sand (Sander lever 1 while held, 0 released)','Sander',1,0),
 mom('RightThrottleButton','Horn (Horn lever 1 while held, 0 released)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrake -0.25 while up, 0 when down; the bail-off is a spring below 0, may need the cab)',assignments:[pair('IndependentBrake',-0.25,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','ATC / PTC (ATC_CutOut Cut-In 1 / Cut-Out 0). Lit = cut in; loads cut out','ATC_CutOut',1,0),
 tog('RightAuxButton','Alerter fuse (Fuse_AlerterControl On 1 / Off 0). Lit = on; loads off','Fuse_AlerterControl',1,0),
 {name:'RotaryCrank',description:'Wiper off (Wiper_R 0)',assignments:[set('Wiper_R',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (Wiper_R 0.5)',assignments:[set('Wiper_R',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off (Headlights 0.5)',assignments:lights(0.5)},
 {name:'AutoBrake1',description:'Lights | Low (Headlights 0)',assignments:lights(0)},
 {name:'AutoBrake2',description:'Lights | High (0.25)',assignments:lights(0.25)},
 {name:'AutoBrake3',description:'Lights | High with ditch lights (0.75)',assignments:lights(0.75)},
 {name:'AutoBrake4',description:'Lights | High with ditch lights (0.75)',assignments:lights(0.75)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-trirail-f40ph-3c-dtg-thejag',title:'F40PH-3C',eyebrow:'Tri-Rail · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Florida Tri-Rail: Miami – Boca Raton',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-trirail-slate.svg',alt:'Tri-Rail'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/trirail-f40ph-3c-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:{name:'Independent',continuous:true,notches:['Full',null,null,null,'Released'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter · cab signal ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Low'},{short:'2',desc:'High'},{short:'3',desc:'+ ditch'},{short:'HI',desc:'+ ditch'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'ATC · PTC'}, rightAux:{name:'Alerter fuse'},
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Lead set-up',flat:'trail',up:'lead'}},
setup:['PARK BRK up: lead set-up (handle, field, brake valve, MU-2A, traction interlock; loads trailing)','Reverser from Neutral to Forward with the throttle at Idle','ATC / PTC and alerter fuse on (aux squares lit; both load off)','Lights to High','Automatic brake at Full service (parked), throttle Idle'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release; independent to Released, ENG 2 up to bail off','Throttle notch by notch','Reset the alerter and the cab signal with the gear lever','Brake: throttle to Idle, automatic brake into the service zone, independent for the final stop; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-trirail-f40ph-3c-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
