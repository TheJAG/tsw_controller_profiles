// Diesel (DTG, "Thomas & Friends Visit the West Somerset Railway", pak Artemis), 2026-10-12. Derived from mkthomas.js: the same
// SIMPLE-CONTROLS pattern (UsesSimpleControls true, 23 nodes): spring ThrottleControl (SimpleThrottle, -1..1; dead zone about +-0.2, live
// value about the set value minus 0.1 while sets keep coming, 0 again 100 ms after the last set), Reverser(Proxy) -1 / 0 / 1 holding at a
// stand, push buttons Horn, CabLight (CabLights), Headlights. No whistle misspelling here. Doors on the wagons / coaches (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680230';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_ART_Diesel_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser(Proxy) (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Only holds at a stand; the throttle sign takes over while driving',assignments:[{type:'direct_control',controls:'Reverser(Proxy)',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Simple-controls handle ThrottleControl -1..1 (brake .. 0 .. power), a spring handle that only acts while the app keeps sending: inverted, full power at the far end (raw 0 ±0.04), power zone 0.045..0.45, 0 at 0.5 ±0.05, brake zone 0.55..0.955, full brake 1 ±0.04 nearest',assignments:[{type:'direct_control',controls:'ThrottleControl',input_value:{min:-1,max:1,steps:[-1,null,0,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.55},{threshold:0.5,threshold_tolerance:0.05},{threshold:0.45,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 mom('LeftEngineOn','Power held (ThrottleControl 0.75 while the switch is up, 0 when down)','ThrottleControl',0.75,0),
 mom('RightEngineOn','Brake held (ThrottleControl -1 while the switch is up, 0 when down)','ThrottleControl',-1,0),
 mom('RightThrottleButton','Horn (Horn push button)','Horn',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('RoundAuxButton','Headlights (Headlights push button On 1 / Off 0). Lit = on','Headlights',1,0),
 {name:'RotaryCrank',description:'Cab light off (CabLight push button 0)',assignments:[set('CabLight',0)]},
 {name:'RotaryIgnStart',description:'Cab light on (CabLight push button 1)',assignments:[set('CabLight',1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-diesel-dtg-thejag',title:'Diesel',eyebrow:'Thomas & Friends · West Somerset Railway · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'West Somerset Railway: Bishops Lydeard – Minehead',logos:[{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/diesel-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['Full power',null,'0',null,'Full brake'],start:2},
 rightThrottle:null, flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Horn'}, gearLever:null,
 autoBrk:null,
 eng1:{name:'Power (hold)',start:true}, eng2:{name:'Brake (hold)',start:true},
 leftAux:null, rightAux:null,
 modeSwitch:{name:'Cab light',left:'off',right:'on'}, roundAux:{name:'Headlights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:null},
setup:['Diesel drives on simple controls: one spring-loaded handle for power and brake; the pedestal handles are decoration','Reverser to Forward (speedbrake lever) at a stand','Headlights on (round aux)'],
depart:['Close doors (RUD TRIM), check the signal','Move the left lever into the power zone; the handle only acts while the lever moves or ENG 1 (power hold) is up','The train coasts when nothing is sent; brake with the lever past 0 or with ENG 2 (brake hold) up','Horn on the right throttle button']};
fs.writeFileSync('tools/manual/trains/tsw-diesel-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
