// Island Line Class 484 Vivarail D-Train (DTG, Island Line 2022: BR Class 484 EMU Add-On), 2026-10-12. Own layout, derived from mk165.js.
// One node set, no cab suffixes; GetActiveCab fails. Combined handle `Throttle (Irregular Lever)` -1..1: Emergency -1 / Full service
// -0.75 / B2 -0.5 / B1 -0.25 / Off 0 / P1..P7 at 0.14 k (the Class 165 values). Reverser -1..2: Reverse / Neutral / Forward / Off at
// 1.5..2, any value in a zone stores. A separate `TrainBrake (Irregular Lever)` (identifier None, 5 notches) exists but is not on the
// desk: left out. HeadlightSwitch Off 0 / Night 0.2041 / Tail 0.4556 / Markers 0.7039 / Day 0.9631; Wipers Off 0 / Int 0.2438 /
// Slow 0.5835 / Fast 0.9238; AWSIS / DSDID isolation levers Cut-In 0 / Cut-Out 0.87; Horn/Whistle lever Whistle -1 / rest 0 / Horn 1.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679460';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const t171lt=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value;
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class484/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const steps=[-0.75,-0.5,-0.25,0,0.14,0.28,0.42,0.56,0.7,0.84,1];
if(t171lt.step_thresholds.length!==steps.length) throw new Error('171 bands do not fit');
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral 0 / Forward 1 / Off 2, even steps inside the zones), inverted as the 165 / 171: Off at the far end',assignments:[{type:'direct_control',controls:'Reverser (Irregular Lever)',input_value:{min:-1,max:2,steps:[-1,0,1,2],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle Throttle (Full service -0.75 / B2 -0.5 / B1 -0.25 / Off 0 / P1..P7 at 0.14 k; Emergency -1 is left out on purpose). Plain, as the tested Class 171: Full service at the far end, P7 nearest; the eleven 171 bands (centred on the TCA detents)',assignments:[{type:'direct_control',controls:'Throttle (Irregular Lever)',input_value:{min:-0.75,max:1,steps,invert:t171lt.invert===true,step_thresholds:JSON.parse(JSON.stringify(t171lt.step_thresholds))}}]},
 {name:'ParkingBrake',description:'Master key (MasterKey toggle button, Unlocked 1 / Locked 0): PARK BRK up = key in',assignments:[{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey (Toggle Button)',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey (Toggle Button)',value:0,hold:false,enable_api_fallback:true}}]},
 mom('GearLever','AWS reset (AWS_Reset push button, held)','AWS_Reset (Push Button)',1,0),
 mom('LeftThrottleButton','Sand (Sanding push button)','Sanding (PushButton)',1,0),
 mom('LeftEngineOn','Horn (Horn/Whistle lever 1, rest 0)','Horn/Whistle (Lever)',1,0),
 mom('RightEngineOn','Whistle (Horn/Whistle lever -1, rest 0)','Horn/Whistle (Lever)',-1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','AWS isolation (AWSIS lever: Cut-Out 1 / Cut-In 0). Lit = isolated','AWSIS',1,0),
 tog('RightAuxButton','DSD isolation (DSDID lever: Cut-Out 1 / Cut-In 0). Lit = isolated','DSDID',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Wipers lever Off 0 / Int 0.24 / Slow 0.58 / Fast 0.92, relative -0.3)',assignments:[rel('Wipers',-0.3)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (relative 0.3)',assignments:[rel('Wipers',0.3)]},
 {name:'AutoBrake0',description:'Headlights | Off (HeadlightSwitch 0)',assignments:[set('HeadlightSwitch',0)]},
 {name:'AutoBrake1',description:'Headlights | Day (0.9631)',assignments:[set('HeadlightSwitch',0.9631)]},
 {name:'AutoBrake2',description:'Headlights | Markers (0.7039)',assignments:[set('HeadlightSwitch',0.7039)]},
 {name:'AutoBrake3',description:'Headlights | Night (0.2041)',assignments:[set('HeadlightSwitch',0.2041)]},
 {name:'AutoBrake4',description:'Headlights | Tail (0.4556)',assignments:[set('HeadlightSwitch',0.4556)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-484-dtg-thejag',title:'Class 484',eyebrow:'Island Line · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Island Line 2022: Ryde Pier Head – Shanklin',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-484-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Neutral','Reverse'],start:0},
 leftThrottle:{name:'Power / brake',notches:['Full service','B2','B1','Off','P1','P2','P3','P4','P5','P6','P7'],start:0},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:null, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Markers'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail'}],start:1},
 eng1:{name:'Horn',start:true}, eng2:{name:'Whistle',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DSD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK); the EP key and the circuit breaker (MLCB) in the cab','Reverser from Off to Neutral','Check the AWS and DSD isolation lights are out; DRA in the cab','Headlights to Day','Open doors (RUD TRIM)'],
depart:['Close doors and check the signal','Reverser to Forward','Handle from Full service through Off to P1','Notch up to P7 as speed rises','Acknowledge AWS with the gear lever','Brake: back through Off to B1..Full service']};
fs.writeFileSync('tools/manual/trains/tsw-class-484-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
