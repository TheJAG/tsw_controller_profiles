// Thomas the Tank Engine (DTG, "Thomas & Friends Visit the West Somerset Railway", pak Artemis), 2026-10-12. SIMPLE CONTROLS loco
// (UsesSimpleControls): 21 nodes, no regulator / cut-off / brake valve / fireman controls at all; the backhead is decoration. The only
// driving node is ThrottleControl (IrregularLever, SimpleThrottle, -1..1): a SPRING handle that reads 0 again 100 ms after the last API set
// (live value only through Function.GetCurrentInputValue): dead zone ±0.25, 0.5 -> 0.12..0.21, 0.75 -> 0.41, 1 -> 0.62..0.66, -1 -> -0.6..-0.75
// while sets keep coming at 40 ms. Holding + at a stand sets the reverser Forward and accelerates; holding - brakes and then reverses; with
// no sets the train coasts. Reverser(Proxy) -1 / 0 / 1 stores at a stand (any non-zero throttle set resets it) and follows the throttle sign
// while driving. Push buttons: Whislte (sic, Horn), Torch (CabLights), Headlights (Off 0 / On 1). Passenger doors are on the coaches
// (keys y / u). The TCA levers only produce power or brake while the app re-sends (a moving lever); the ENG switches hold a value as the
// fallback in case the app's hold re-sends.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680230';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_ART_Thomas_C','RVM_ART_BirthdayPack_Thomas_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser(Proxy) (Reverse -1 / Neutral 0 / Forward 1; any value in a zone), inverted: Forward at the far end. Only holds at a stand; the throttle sign takes over while driving',assignments:[{type:'direct_control',controls:'Reverser(Proxy)',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Simple-controls handle ThrottleControl -1..1 (brake .. 0 .. power), a spring handle that only acts while the app keeps sending: inverted, full power at the far end (raw 0 ±0.04), power zone 0.045..0.45, 0 at 0.5 ±0.05, brake zone 0.55..0.955, full brake 1 ±0.04 nearest',assignments:[{type:'direct_control',controls:'ThrottleControl',input_value:{min:-1,max:1,steps:[-1,null,0,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.55},{threshold:0.5,threshold_tolerance:0.05},{threshold:0.45,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 mom('LeftEngineOn','Power held (ThrottleControl 0.75 while the switch is up, 0 when down)','ThrottleControl',0.75,0),
 mom('RightEngineOn','Brake held (ThrottleControl -1 while the switch is up, 0 when down)','ThrottleControl',-1,0),
 mom('RightThrottleButton','Whistle (Whislte push button, Horn)','Whislte',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('RoundAuxButton','Headlights (Headlights push button On 1 / Off 0). Lit = on','Headlights',1,0),
 {name:'RotaryCrank',description:'Torch off (Torch push button 0)',assignments:[set('Torch',0)]},
 {name:'RotaryIgnStart',description:'Torch on (Torch push button 1)',assignments:[set('Torch',1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-thomas-dtg-thejag',title:'Thomas',eyebrow:'Thomas & Friends · West Somerset Railway · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'West Somerset Railway: Bishops Lydeard – Minehead',logos:[{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/thomas-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['Full power',null,'0',null,'Full brake'],start:2},
 rightThrottle:null, flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Whistle'}, gearLever:null,
 autoBrk:null,
 eng1:{name:'Power (hold)',start:true}, eng2:{name:'Brake (hold)',start:true},
 leftAux:null, rightAux:null,
 modeSwitch:{name:'Torch',left:'off',right:'on'}, roundAux:{name:'Headlights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:null},
setup:['Thomas drives on simple controls: one spring-loaded handle for power and brake, no fireman duties; the backhead is decoration','Reverser to Forward (speedbrake lever) at a stand','Headlights on (round aux)'],
depart:['Close doors (RUD TRIM), check the signal','Move the left lever into the power zone; the handle only acts while the lever moves or ENG 1 (power hold) is up','The train coasts when nothing is sent; brake with the lever past 0 or with ENG 2 (brake hold) up','Whistle on the right throttle button']};
fs.writeFileSync('tools/manual/trains/tsw-thomas-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
