// MBTA single-deck cab car CTC-3 (DTG, Boston – Providence / Boston – Worcester), 2026-10-13. Tile "CTC-3 MBTA" on the Boston - Providence
// Timetable; the Providence service loads the Worcester class RVM_BOW_MBTA_SingleDeck_CabCar_C. One desk, plain node names, IS_GetActiveCab
// false/false. The Amfleet cab car layout (no independent, dynamic, bail-off or MasterSwitch). Capture agent probe: Throttle Idle 0 / N1..N8
// at k/8 (snaps); Reverser Reverse 0 / Neutral 0.333 / Forward 0.667 / Key Out 1 (loads Key Out; Key Out only at throttle Idle);
// AutomaticBrake_26C Release 0 / Minimum Reduction 0.125 / service 0.2..0.64 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.85 /
// Emergency 1 (loads Full Service). ONE-EVENT-LAGGED interlocks as the F7 / SD70ACe: the throttle stays locked after Key Out -> Forward
// until a second, different reverser set; Key Out stays refused after the throttle returns to Idle until a second throttle set. So both
// the reverser and the throttle are sent twice (value, then value nudged inside its zone). Loads cold: GeneratorFieldFuse, Fuse_Alertor
// (WarningDevices), Fuse_CabSignalAndSpeed (SignallingSystems) Off, AutomaticBrakeCutoutValve Cut-Out 0 / Cut-In 1. HeadlightSwitch
// Bright 0 / Off 0.5 / Dim 1; Horn IrregularLever Pressed 0.5..1.5, rest 0.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679270';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.name='TSW | MBTA single-deck cab car | DTG | TheJAG';
p.rail_class_information=['RVM_BOW_MBTA_SingleDeck_CabCar_C','RVM_BPE_MBTA_SingleDeck_CabCar_C','RVM_BPE_MBTA_SingleDeck_V2_CabCar_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,m)=>[set('HeadlightSwitch',h),set('MarkerLightsPB',m)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.333 / Forward 0.667; Key Out 1 is on PARK BRK), inverted: Forward at the far end. Each change is sent twice (value, then nudged inside its zone) to free the lagging throttle interlock',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:0.667,steps:[0,0.333,0.667],invert:true}},{type:'direct_control',controls:'Reverser',input_value:{min:0,max:0.667,steps:[0.01,0.343,0.657],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 at k/8, inverted: notch 8 at the far end, Idle nearest. Each change is sent twice (notch, then notch ±0.01, which snaps back) to free the lagging reverser interlock',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}},{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0.02,0.135,0.26,0.385,0.51,0.635,0.76,0.885,0.99],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake_26C (Release 0 / Minimum 0.125 / service continuous 0.2..0.64 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.85 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake_26C',input_value:{min:0,max:1,steps:[0,0.125,null,0.65,0.7,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Reverser key and set-up: PARK BRK up = Reverser Neutral 0.333 (key in), AutomaticBrakeCutoutValve Cut-In 1, GeneratorFieldFuse On 1; flat = Key Out 1 (throttle at Idle), valve and field off',assignments:[pair('Reverser',0.333,1),pair('AutomaticBrakeCutoutValve',1,0),pair('GeneratorFieldFuse',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sander push button, held)','Sander',1,0),
 mom('RightThrottleButton','Horn (Horn lever: 1 while held, rest 0)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 mom('RightEngineOn','Cab signal acknowledge (CabSignalAcknowledge_R, held while up)','CabSignalAcknowledge_R',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Alerter fuse (Fuse_Alertor On 1 / Off 0). Lit = on; loads off','Fuse_Alertor',1,0),
 tog('RightAuxButton','Cab signal and speed control fuse (Fuse_CabSignalAndSpeed On 1 / Off 0). Lit = on; loads off','Fuse_CabSignalAndSpeed',1,0),
 tog('RoundAuxButton','Hand brake (Handbrake Applied 1 / 0). Lit = applied','Handbrake',1,0),
 {name:'RotaryCrank',description:'Wipers off (WiperControlValve_L / _R 0)',assignments:[set('WiperControlValve_L',0),set('WiperControlValve_R',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperControlValve_L / _R 0.5; values not swept)',assignments:[set('WiperControlValve_L',0.5),set('WiperControlValve_R',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0.5,0)},
 {name:'AutoBrake1',description:'Lights | Headlight dim (HeadlightSwitch 1)',assignments:lights(1,0)},
 {name:'AutoBrake2',description:'Lights | Headlight bright (HeadlightSwitch 0)',assignments:lights(0,0)},
 {name:'AutoBrake3',description:'Lights | Bright and marker lights (MarkerLightsPB 1)',assignments:lights(0,1)},
 {name:'AutoBrake4',description:'Lights | Dim and marker lights',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-mbta-cab-car-dtg-thejag',title:'CTC-3 cab car',eyebrow:'MBTA · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Northeast Corridor: Boston – Providence · Boston – Worcester',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-mbta-slate.svg',alt:'MBTA'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/mbta-cab-car-cab.jpg',height:196,position:'50% 85%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ markers'},{short:'HI',desc:'Dim + markers'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Cab signal ack.',start:true},
 leftAux:{name:'Alerter fuse'}, rightAux:{name:'Cab signal fuse'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Hand brake'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser key',flat:'out',up:'in'}},
setup:['Throttle at Idle, then PARK BRK up: reverser key in (Neutral), automatic brake cut in, generator field on','Alerter and cab signal fuses on (aux squares lit); lights to Bright; hand brake off (round aux)','Automatic brake at Full service (parked); reverser to Forward'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release','Throttle notch by notch (the F40PH / HSP46 at the back follows)','Reset the alerter with the gear lever, acknowledge cab signals with ENG 2','Brake: throttle to Idle, automatic brake into the service zone; Emergency at the far end. No independent or dynamic brake on the cab car']};
fs.writeFileSync('tools/manual/trains/tsw-mbta-cab-car-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
