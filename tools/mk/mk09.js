// BR Class 09 shunter (DTG, West Somerset Railway), 2026-10-12. Derived from mk08jt.js: the same cab layout and node names.
// One node set; IS_GetActiveCab fails. API probe: `Reverser` Reverse 0 / Off (0.25..0.74, rest 0.5) / Forward (0.75..1); `Throttle`
// Off 0 / 1 at 0.11 / 2 at 0.34 / 3 at 0.89 / 4 at 1 with continuous display zones between, moves only in Forward; `DriversBrake`
// (vacuum) Running 0.09 (sets below 0.18) / First application 0.24 / continuous Service 0.28..0.67 (output 0.16..0.99) / Full 0.69
// (0.68..0.84) / Emergency 0.98 (0.85+), one gate per set; `DirectBrake` Release 0 / continuous 0.06..0.78 / Full 0.79 (0.79..0.89) /
// Emergency 0.98 (0.9+), one gate down. `MasterKey` lever Off 0 / On 0.2329 / Engine Only 0.6228 (loads On at 0.29). No AWS.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4678840';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/^RVM_WSR_Class09/.test(n));
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
 {name:'RightThrottle',description:'Vacuum brake DriversBrake (Running 0.09 / First application 0.24 / continuous Service 0.28..0.67 / Full 0.69 / Emergency 0.98; one gate per set), inverted as the Class 153 brake: Emergency at the far end, Running nearest. Emergency raw 0 ±0.06, Full 0.16 ±0.06, free zone 0.26..0.74 (full down to first), First 0.84 ±0.05 (detent), Running 1 ±0.08',assignments:[{type:'direct_control',controls:'DriversBrake',input_value:{min:0.09,max:0.98,steps:[0.09,0.24,null,0.69,0.98],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.08},{threshold:0.84,threshold_tolerance:0.05},{threshold:0.74,threshold_end:0.26},{threshold:0.16,threshold_tolerance:0.06},{threshold:0,threshold_tolerance:0.06}]}}]},
 {name:'FlapLever',description:'Loco brake DirectBrake (Release 0 / continuous 0.06..0.78 / Full 0.79 / Emergency 0.98; one gate down), inverted: Emergency at the far end, Release nearest. Emergency raw 0 ±0.06, Full 0.16 ±0.06, free zone 0.26..0.9, Release 1 ±0.06',assignments:[{type:'direct_control',controls:'DirectBrake',input_value:{min:0,max:0.98,steps:[0,null,0.79,0.98],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_end:0.26},{threshold:0.16,threshold_tolerance:0.06},{threshold:0,threshold_tolerance:0.06}]}}]},
 {name:'ParkingBrake',description:'Master key MasterKey (lever: Off 0 / On 0.2329 / Engine Only 0.6228): PARK BRK up = On',assignments:[pair('MasterKey',0.2329,0)]},
 key('GearLever','Deadman / safety acknowledge (game key Q; the 09 has no AWS node)','Q'),
 mom('LeftThrottleButton','Sand, front sander (SandingLever: Off 0 / Front 0.5 / Rear 1)','SandingLever',0.5,0),
 mom('RightThrottleButton','Engine start (EngineStart push button, held)','EngineStart',1,0),
 mom('LeftEngineOn','Horn (Horn_L push button)','Horn_L',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
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
const m={name:'tsw-class-09-dtg-thejag',title:'Class 09',eyebrow:'West Somerset Railway · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'West Somerset Railway: Bishops Lydeard – Minehead',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-09-dtg-cab.jpg',height:196,position:'50% 50%'},schematicHeight:560,
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Off','Reverse'],start:1},
 leftThrottle:{name:'Power handle',notches:['Off','1','2','3','4'],start:0},
 rightThrottle:{name:'Vacuum brake',continuous:true,notches:['Emergency','Full',null,'First app.','Running'],start:1},
 flap:{name:'Loco brake',continuous:true,notches:['Emergency','Full',null,'Release'],start:1},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'Deadman ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Markers'},{short:'2',desc:'+ instruments'},{short:'3',desc:'+ cab light'},{short:'HI',desc:'Cab light only'}],start:2},
 eng1:{name:'Horn',start:true}, eng2:null,
 leftAux:null, rightAux:null,
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key switch',flat:'off',up:'on'}},
setup:['PARK BRK up: master key On; battery and parking brake in the cab','Start the engine (right throttle button)','Reverser from Off to Forward: the power handle only moves then','Lights to Markers','Loco brake at Full, vacuum brake at Full (parked)'],
depart:['Check the signal and the shunter','Vacuum brake to Running, loco brake to Release','Power handle 1 to 4 (only with the reverser in Forward)','Deadman: acknowledge with the gear lever if the game asks','Brake: power Off, vacuum brake towards Full, or the loco brake light engine','Change direction: power Off first, then the reverser']};
fs.writeFileSync('tools/manual/trains/tsw-class-09-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
