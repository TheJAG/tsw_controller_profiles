// DB BR 1442 Talent 2 (DTG, Rapid Transit / S-Bahn Leipzig S2): the BR 442 layout (mk442.js) on the Rapid Transit pak's
// Talent 2, whose nodes carry a type suffix ("Reverser (Irregular Level)", sic) and differ in a few values:
// wipers 0..5 in steps of 1, sander three positions (back bogie 0 / off 0.5 / front bogie 1), SiFa / PZB isolation as
// toggle push buttons, SiFa reset as its own push button. One manual for both (tools/manual/trains/tsw-br-442-dtg-thejag.json,
// written by mk442.js); this script writes no manual data.
// Usage: node tools/mk/mk1442.js profiles/<file>.json
const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_DB_Talent2_T2_C.json','utf8'));
const names=new Set(cap.controls.map(c=>c.name));
const N={throttle:'ThrottleAndBrake (Irregular Lever)',reverser:'Reverser (Irregular Level)',master:'MasterSwitch (Irregular Lever)',sander:'Sander (Irregular Lever)',
 horn:'HornHigh (Push Button)',pzbAck:'PZBAcknowledge (Push Button)',pzbRel:'PZBRelease (Push Button)',pzbOvr:'PZBOverride (Push Button)',
 sifaIso:'SifaIsolationSwitch (Toggle Button)',pzbIso:'PZBIsolationSwitch (Toggle Button)',sifaReset:'SifaPedalReset (Push Button)',
 wipers:'Wipers (Irregular Lever)',lights:'Headlights/TailLights (Irregular Lever)',doorsL:'PassengerDoorsLeft (Push Button)',doorsR:'PassengerDoorsRight (Push Button)'};
Object.values(N).forEach(n=>{if(!names.has(n))throw new Error('missing '+n)});
p.name='TSW | BR 1442 | DTG | TheJAG';
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/^RVM_DB_Talent2_[TM]\d$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Richtungsschalter (Reverse 0 / Neutral 0.5 / Forward 1), inverted: Forward at the far end. Only moves with the master switch On (cycle PARK BRK once if it stays in Neutral)',assignments:[{type:'direct_control',controls:N.reverser,input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Combined power / brake handle, the BR 442 geometry (Max brake -1 / brake % continuous -0.95..-0.2 / Min brake -0.2 (5 %) / 0 / Min power 0.2 (5 %) / power % continuous 0.2..1; Emergency at -1.29 left out on purpose). Inverted with the BR 440 geometry: max brake raw 1 +-0.04, brake zone 0.955..0.58, min brake 0.55 +-0.03, 0 at 0.5 +-0.02, min power 0.45 +-0.03, power zone 0.42..0.045, full 0 +-0.04',assignments:[{type:'direct_control',controls:N.throttle,input_value:{min:-1,max:1,steps:[-1,null,-0.2,0,0.2,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.58,threshold_tolerance:0},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.42,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master switch On / Off (Uncouple local -1 / Off 0 / On 1 / Uncouple remote 2)',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:N.master,value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:N.master,value:0,hold:false,enable_api_fallback:true}}},
 mom('GearLever','SiFa reset (push button)',N.sifaReset,1,0),
 mom('LeftThrottleButton','Sand (three positions: back bogie 0 / off 0.5 / front bogie 1; front bogie while held, off at rest)',N.sander,1,0.5),
 mom('RightThrottleButton','Horn (high tone)',N.horn,1,0),
 mom('LeftEngineOn','PZB Frei (release)',N.pzbRel,1,0),
 mom('RightEngineOn','PZB Wachsam (acknowledge)',N.pzbAck,1,0),
 mom('RudderTrimLeft','Doors | Left',N.doorsL,1,0),
 mom('RudderTrimRight','Doors | Right',N.doorsR,1,0),
 mom('RoundAuxButton','PZB Befehl 40 (override)',N.pzbOvr,1,0),
 tog('LeftAuxButton','SiFa isolation toggle button (lit = Isolated 0 / unlit = on 1)',N.sifaIso,0,1),
 tog('RightAuxButton','PZB isolation toggle button (lit = Isolated 0 / unlit = on 1)',N.pzbIso,0,1),
 {name:'RotaryCrank',description:'Wipers one notch back (six positions 0..5, steps of 1)',assignments:[rel(N.wipers,-1)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on (six positions 0..5, steps of 1)',assignments:[rel(N.wipers,1)]},
 {name:'AutoBrake0',description:'Headlights | Off / tail',assignments:[set(N.lights,0)]},
 {name:'AutoBrake1',description:'Headlights | Marker',assignments:[set(N.lights,0.3333)]},
 {name:'AutoBrake2',description:'Headlights | Dimmed',assignments:[set(N.lights,0.6667)]},
 {name:'AutoBrake3',description:'Headlights | High',assignments:[set(N.lights,1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
console.log('manual: shared with the BR 442 (tools/manual/trains/tsw-br-442-dtg-thejag.json, written by mk442.js)');
