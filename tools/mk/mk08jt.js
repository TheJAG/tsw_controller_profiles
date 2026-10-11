// BR Class 08 shunter (Just Trains, WCML Preston – Carlisle / Preston – Crewe), 2026-10-12. Own layout over the uk-dmu draft.
// One node set (both desks drive the same levers); IS_GetActiveCab fails. API probe: `Reverser` Reverse 0 / Off (0.25..0.74, rest
// 0.5) / Forward (0.75..1), it only moves with the throttle at Off (needs two sets from a power notch: one gate down to 0.11 first);
// `Throttle` Off 0 / 1 at 0.11 / 2 at 0.34 / 3 at 0.89 / 4 at 1, with continuous "display" zones 0.15..0.33 and 0.38..0.88 between
// the notches, and it only moves with the reverser in Forward; `DriversBrake` (vacuum) Release 0 (sets below 0.18), initial
// application 0.25, continuous to 0.8 (sets 0.81..0.9 cap at 0.8), Emergency 1 (0.91+); `DirectBrake` Release 0 (one gate from
// above: a set to 0 from 1 stops at 0.1), continuous 0.1..0.8, Full 0.98 (0.9+). MasterKeySwitch lever Off 0 / On 0.2338 / Engine
// Only 0.6337 (reads 0.29 = On at load). No AWS / TPWS; the DSD pedals are push buttons.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680540';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/^RVM_JT_Class08/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
// MarkerLights / InstrumentLights / CabLight are on-off push buttons that toggle on a value change through the mod: Off positions send 0, On positions 1.
const lights=(m,i,c)=>[set('MarkerLights',m),set('InstrumentLights',i),set('CabLight',c)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Off 0.5 / Forward 1; Off takes any value 0.25..0.74), inverted: Forward at the far end. Moves only with the throttle at Off',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power handle Throttle (Off 0 / 1 at 0.11 / 2 at 0.34 / 3 at 0.89 / 4 at 1; the continuous zones between the notches are skipped), plain: Off at the far end, 4 nearest. Bands on the TCA detents: Off 0 ±0.1, 1 at 0.31 ±0.1, 2 at 0.5 ±0.08, 3 at 0.724 ±0.08, 4 at 1 ±0.1. Moves only with the reverser in Forward',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.11,0.34,0.89,1],step_thresholds:[{threshold:0,threshold_tolerance:0.1},{threshold:0.31,threshold_tolerance:0.1},{threshold:0.5,threshold_tolerance:0.08},{threshold:0.724,threshold_tolerance:0.08},{threshold:1,threshold_tolerance:0.1}]}}]},
 {name:'RightThrottle',description:'Vacuum brake DriversBrake (Release 0 / initial application 0.25 / continuous to full 0.8 / Emergency 1), inverted as the Class 153 brake: Emergency at the far end, Release nearest. Emergency raw 0 ±0.06, Full 0.16 ±0.05, free zone 0.24..0.78 (full down to initial), Initial 0.84 ±0.04 (detent), Release 1 ±0.08',assignments:[{type:'direct_control',controls:'DriversBrake',input_value:{min:0,max:1,steps:[0,0.25,null,0.8,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.08},{threshold:0.84,threshold_tolerance:0.04},{threshold:0.78,threshold_end:0.24},{threshold:0.16,threshold_tolerance:0.05},{threshold:0,threshold_tolerance:0.06}]}}]},
 {name:'FlapLever',description:'Loco brake DirectBrake (Release 0 / continuous 0.1..0.8 / Full 0.98), inverted: Full at the far end, Release nearest (a set to 0 from Full stops at 0.1 first, the re-send finishes it)',assignments:[{type:'direct_control',controls:'DirectBrake',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Master key switch MasterKeySwitch (lever: Off 0 / On 0.2338 / Engine Only 0.6337): PARK BRK up = On',assignments:[pair('MasterKeySwitch',0.2338,0)]},
 key('GearLever','Deadman / safety acknowledge (game key Q; the 08 has no AWS, DSDPedalLeft / Right are push buttons)','Q'),
 mom('LeftThrottleButton','Sand, front sander (SandingLever: Off 0 / Front 0.336 / Rear 0.8363)','SandingLever',0.336,0),
 mom('RightThrottleButton','Engine start (EngineStart push button, held)','EngineStart',1,0),
 mom('LeftEngineOn','Horn (Horn_L push button)','Horn_L',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','DSD isolation (DSDIsolationValve lever: Isolated 0 / Normal 1). Lit = isolated','DSDIsolationValve',0,1),
 {name:'RotaryCrank',description:'Wiper off (WiperValve_FL: Off 0 / Min 0.05 / Max 1)',assignments:[set('WiperValve_FL',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (WiperValve_FL 0.5)',assignments:[set('WiperValve_FL',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off (marker, instrument and cab lights 0)',assignments:lights(0,0,0)},
 {name:'AutoBrake1',description:'Lights | Marker lights',assignments:lights(1,0,0)},
 {name:'AutoBrake2',description:'Lights | Marker and instrument lights',assignments:lights(1,1,0)},
 {name:'AutoBrake3',description:'Lights | Marker, instrument and cab lights',assignments:lights(1,1,1)},
 {name:'AutoBrake4',description:'Lights | Cab light only',assignments:lights(0,0,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-08-jt-thejag',title:'Class 08',eyebrow:'British Rail · Just Trains · TCA Quadrant Airbus',profileName:p.name,developer:'Just Trains',route:'West Coast Main Line: Preston – Carlisle',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-britishrail-navy.svg',alt:'British Rail'},{file:'../../assets/logo-justtrains-navy.png',alt:'Just Trains'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-08-jt-cab.jpg',height:196,position:'50% 50%'},schematicHeight:560,
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Off','Reverse'],start:1},
 leftThrottle:{name:'Power handle',notches:['Off','1','2','3','4'],start:0},
 rightThrottle:{name:'Vacuum brake',continuous:true,notches:['Emergency','Full',null,'Initial','Release'],start:1},
 flap:{name:'Loco brake',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'Deadman ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Markers'},{short:'2',desc:'+ instruments'},{short:'3',desc:'+ cab light'},{short:'HI',desc:'Cab light only'}],start:2},
 eng1:{name:'Horn',start:true}, eng2:null,
 leftAux:{name:'DSD isolation'}, rightAux:null,
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key switch',flat:'off',up:'on'}},
setup:['PARK BRK up: master key switch On; brake selector and battery in the cab','Start the engine (right throttle button)','Reverser from Off to Forward: the power handle only moves then','Check the DSD isolation light is out','Lights to Markers','Loco brake at Full, vacuum brake at Full (parked)'],
depart:['Check the signal and the shunter','Vacuum brake to Release, loco brake to Release','Power handle 1 to 4 (only with the reverser in Forward)','Deadman: acknowledge with the gear lever if the game asks','Brake: power Off, vacuum brake towards Full, or the loco brake light engine','Change direction: power Off first, then the reverser']};
fs.writeFileSync('tools/manual/trains/tsw-class-08-jt-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
