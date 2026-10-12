// BNSF GE ES44C4 (DTG, Cajon Pass), 2026-10-12. FIRST US FREIGHT LAYOUT (GE desktop console on the driver's left: automatic brake, independent,
// dynamic brake, throttle, reverser). One cab, plain node names; IS_GetActiveCab fails. Capture + agent probe: Throttle(Lever) Idle 0 /
// notches 1..8 stored at 0.124 / 0.249 / 0.374 / 0.499 / 0.624 / 0.749 / 0.874 / 0.998 (bands 0.125 wide); DynamicBrake(Lever) Off 0 / Set Up
// 0.1111 / continuous 0.2..1 (output 1 + 9 x (in - 0.2)), LOCKED while the reverser is in Neutral; AutomaticBrake(Lever) Release 0 / Minimum
// 0.15 / service continuous 0.16..0.49 / Full Service 0.5 / Suppression 0.6 / Handle Off 0.85 / Emergency 1 (loads 0.15); IndependentBrake
// (Lever) Release 0.25 / applied continuous to 1 (loads 1); IndependentBrakeBailOff(Lever) (MoveToLap) Bail Off 0.1048, rests 0.25;
// Reverser(Lever) Reverse -1 / Neutral 0 / Forward 1. Key ReverserHandle(Button) (MasterSwitch Out 0 / In 1, loads In). AlerterReset_Desk
// (Button) (Alerter), Bell_Desk(Button) (Bell), Horn_R(Lever) and Sand(Lever) spring levers at 0.5 (Pressed at ±1), DynamicBrake(Switch)
// (DynBrakeCutIn, loads 1), FrontHeadLights(Dial) / RearHeadLights(Dial) Off 0 / Dim 0.35 / Bright 0.65 / Bright Aux 1, MUHeadlightsControl
// (Dial), EngineControl(Dial) Jog / Start / Isolate / Run 1, WiperSpeed_FR (no named values). No ditch-light node, no alerter / ATC cut-out,
// doors without values (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679370';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_CJP_BNSF_ES44C4_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(fr,re)=>[set('FrontHeadLights(Dial)',fr),set('RearHeadLights(Dial)',re)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser(Lever) (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up); the dynamic brake only moves out of Neutral',assignments:[{type:'direct_control',controls:'Reverser(Lever)',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle(Lever) Idle / notches 1..8 (step values on the stored k/8 positions), inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'Throttle(Lever)',input_value:{min:0,max:0.9982,steps:[0,0.1242,0.2492,0.3742,0.4992,0.6242,0.7492,0.8742,0.9982],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake(Lever) (Release 0 / Minimum 0.15 / service continuous 0.16..0.49 / Full Service 0.5 / Suppression 0.6 / Handle Off 0.85 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1 ±0.04, Suppression 0.2 ±0.04, Full Service 0.3 ±0.04, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake(Lever)',input_value:{min:0,max:1,steps:[0,0.15,null,0.5,0.6,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Dynamic brake DynamicBrake(Lever) (Off 0 / Set Up 0.1111 / continuous 0.2..1 = 1..8), inverted: full dynamic at the far end (raw 0 ±0.04), zone 0.045..0.86, Set Up 0.9 ±0.03, Off 1 ±0.06 nearest. Locked while the reverser is in Neutral',assignments:[{type:'direct_control',controls:'DynamicBrake(Lever)',input_value:{min:0,max:1,steps:[0,0.1111,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Reverser handle ReverserHandle(Button) (MasterSwitch In 1 / Out 0): PARK BRK up = handle in',assignments:[pair('ReverserHandle(Button)',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset_Desk(Button), held)','AlerterReset_Desk(Button)',1,0),
 mom('LeftThrottleButton','Sand (Sand(Lever) spring lever: 1 while held, 0.5 released)','Sand(Lever)',1,0.5),
 mom('RightThrottleButton','Horn (Horn_R(Lever) spring lever: 1 while held, 0.5 released)','Horn_R(Lever)',1,0.5),
 {name:'LeftEngineOn',description:'Bell (Bell_Desk(Button) 1 while up, 0 when down)',assignments:[pair('Bell_Desk(Button)',1,0)]},
 {name:'RightEngineOn',description:'Independent bail-off (IndependentBrakeBailOff(Lever) 0.1048 while up, 0.25 when down)',assignments:[pair('IndependentBrakeBailOff(Lever)',0.1048,0.25)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Dynamic brake cut-in (DynamicBrake(Switch) On 1 / Off 0). Lit = cut in; loads cut in','DynamicBrake(Switch)',1,0),
 tog('RoundAuxButton','Independent brake IndependentBrake(Lever): Full 1 / Release 0.25. Lit = applied; loads applied','IndependentBrake(Lever)',1,0.25),
 {name:'RotaryCrank',description:'Wipers off (WiperSpeed_FR 0)',assignments:[set('WiperSpeed_FR',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperSpeed_FR 0.5; the lever has no named values)',assignments:[set('WiperSpeed_FR',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Front dim (FrontHeadLights(Dial) 0.35)',assignments:lights(0.35,0)},
 {name:'AutoBrake2',description:'Lights | Front bright (0.65)',assignments:lights(0.65,0)},
 {name:'AutoBrake3',description:'Lights | Front bright aux (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Front bright, rear dim (RearHeadLights(Dial) 0.35)',assignments:lights(0.65,0.35)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-bnsf-es44c4-dtg-thejag',title:'ES44C4',eyebrow:'BNSF · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Cajon Pass: Barstow – San Bernardino',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-bnsf-slate.svg',alt:'BNSF'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/bnsf-es44c4-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:{name:'Dynamic brake',continuous:true,notches:['8',null,'Set up','Off'],start:3},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'Bright aux'},{short:'HI',desc:'+ rear dim'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Dyn. brake cut-in'}, rightAux:null,
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser handle',flat:'out',up:'in'}},
setup:['Reverser handle in (PARK BRK up); engine control at Run in the cab','Reverser from Neutral to Forward; dynamic brake cut in (left aux lit)','Lights to Bright','Independent applied (round aux lit), automatic brake at Full service (parked); throttle Idle, dynamic Off'],
depart:['Check the signal; bell on (ENG 1)','Automatic brake to Release; round aux out to release the independent, ENG 2 up to bail off','Throttle notch by notch; keep the dynamic brake Off while powering','Reset the alerter with the gear lever','Brake: throttle to Idle, dynamic brake past Set up into the zone; automatic brake into the service zone for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-bnsf-es44c4-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
