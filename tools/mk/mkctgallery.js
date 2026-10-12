// Caltrain Gallery (Nippon Sharyo) cab car (DTG, Peninsula Corridor), 2026-10-13. Derived from mkf40ph.js: the cab car carries an AAR stand
// for the F40PH-2CAT that pushes it. Tile "Gallery Cab Car"; leads the northbound services. One desk, plain node names, IS_GetActiveCab fails.
// Capture agent probe: Reverser Reverse 0 / Neutral 0.5 / Forward 1 (no lock seen); Throttle Idle 0 / N1..N8 at k/8 (snaps, free in Neutral);
// DynamicBrake Off 0 / Setup 0.14 / B1 0.26 / continuous 0.27..1 (free in Neutral, unlike the F40PH); AutomaticBrake six detents Release 0 /
// Holding 0.2 / Lap 0.4 / Service 0.6 / Handle Off 0.8 / Emergency 1 (loads Handle Off). No independent: ParkingBrake (identifier
// IndependentBrake) Release 0 / Apply 1, BailSwitch 0..1 (probably a spring). Loads cold: ReverserHandle (MasterSwitch) Out,
// AutomaticBrakeCutInOut Out 0 / In 1, PedalCutOffValve (WarningDevices) Cut Out 0 / Cut In 1, ControlFuelPump / GeneratorField / EngineRun
// push buttons 0. No alerter reset button (SafetyPedal is a reversible pedal). Sander (SandLead) 0 / Off 0.5 / 1; Headlights Off 0 / Low
// 0.33 / Medium 0.66 / Bright 1; CrossingLight (DitchLights); ElectroPneumaticBrake loads 1; WiperSwitch_L / _R continuous.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4678960';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.name='TSW | Caltrain Gallery cab car | DTG | TheJAG';
p.rail_class_information=[{class_name:'RVM_SFJ_CT_Nippon_CabCar_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,d)=>[set('Headlights',h),set('CrossingLight',d)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.5 / Forward 1), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Idle / notches 1..8 at k/8, inverted: notch 8 at the far end (pushed away), Idle nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake (six detents, no service zone: Release 0 / Holding 0.2 / Lap 0.4 / Service 0.6 / Handle Off 0.8 / Emergency 1), inverted: Emergency at the far end, Release nearest, even bands',assignments:[{type:'direct_control',controls:'AutomaticBrake',input_value:{min:0,max:1,steps:[0,0.2,0.4,0.6,0.8,1],invert:true}}]},
 {name:'FlapLever',description:'Dynamic brake DynamicBrake (Off 0 / Setup 0.14 / B1 0.26 / continuous to 1 = 8), inverted: full dynamic at the far end (raw 0 ±0.04), zone 0.045..0.86, Set Up 0.9 ±0.03, Off 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'DynamicBrake',input_value:{min:0,max:1,steps:[0,0.14,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Desk up: ReverserHandle (MasterSwitch In 1 / Out 0), AutomaticBrakeCutInOut (In 1 / Out 0), EngineRun, GeneratorField and ControlFuelPump (1 / 0); the car loads with all of them off. PARK BRK up = desk live',assignments:[pair('ReverserHandle',1,0),pair('AutomaticBrakeCutInOut',1,0),pair('EngineRun',1,0),pair('GeneratorField',1,0),pair('ControlFuelPump',1,0)]},
 mom('LeftThrottleButton','Sand (Sander lever: 1 while held, Off 0.5)','Sander',1,0.5),
 mom('RightThrottleButton','Horn (Horn push button)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Bail-off (BailSwitch 1 while up, 0 when down; may be a spring in the cab)',assignments:[pair('BailSwitch',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Alerter pedal cut-off valve (PedalCutOffValve Cut In 1 / Cut Out 0). Lit = cut in; loads cut out','PedalCutOffValve',1,0),
 tog('RightAuxButton','Electro-pneumatic brake (ElectroPneumaticBrake On 1 / Off 0). Lit = on; loads on','ElectroPneumaticBrake',1,0),
 tog('RoundAuxButton','Independent / parking brake (ParkingBrake Apply 1 / Release 0). Lit = applied','ParkingBrake',1,0),
 {name:'RotaryCrank',description:'Wipers off (WiperSwitch_L / _R 0)',assignments:[set('WiperSwitch_L',0),set('WiperSwitch_R',0)]},
 {name:'RotaryIgnStart',description:'Wipers on (WiperSwitch_L / _R 0.5; continuous, no named values)',assignments:[set('WiperSwitch_L',0.5),set('WiperSwitch_R',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0)},
 {name:'AutoBrake1',description:'Lights | Headlights low (Headlights 0.33)',assignments:lights(0.33,0)},
 {name:'AutoBrake2',description:'Lights | Headlights medium (0.66)',assignments:lights(0.66,0)},
 {name:'AutoBrake3',description:'Lights | Headlights bright (1)',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Lights | Bright and crossing lights (CrossingLight 1)',assignments:lights(1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-caltrain-gallery-cab-car-dtg-thejag',title:'Gallery cab car',eyebrow:'Caltrain · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Peninsula Corridor: San Francisco – San Jose',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-caltrain-slate.svg',alt:'Caltrain'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/caltrain-gallery-cab-car-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Throttle',notches:['8','7','6','5','4','3','2','1','Idle'],start:8},
 rightThrottle:{name:'Automatic brake',notches:['Emergency','Handle off','Service','Lap','Holding','Release'],start:2},
 flap:{name:'Dynamic brake',continuous:true,notches:['8',null,'Setup','Off'],start:3},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:null,
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Low'},{short:'2',desc:'Medium'},{short:'3',desc:'Bright'},{short:'HI',desc:'+ crossing'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Bail-off',start:true},
 leftAux:{name:'Alerter valve'}, rightAux:{name:'EP brake'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Independent'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Desk set-up',flat:'off',up:'on'}},
setup:['PARK BRK up: reverser handle in, automatic brake cut in, engine run / generator field / control and fuel pump on (the car loads with them off)','Alerter valve cut in (left aux lit), EP brake on (right aux lit)','Lights to Bright, crossing lights on','Independent applied (round aux lit), automatic brake at Service (parked); throttle Idle, dynamic Off; reverser to Forward'],
depart:['Close doors (RUD TRIM), check the signal; bell on (ENG 1)','Automatic brake to Release; round aux out to release the independent, ENG 2 up to bail off','Throttle notch by notch; keep the dynamic brake Off while powering','Brake: throttle to Idle, dynamic brake past Setup into the zone; automatic brake to Service, Lap to hold, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-caltrain-gallery-cab-car-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
