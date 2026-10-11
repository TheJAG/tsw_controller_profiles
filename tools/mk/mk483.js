// Island Line Class 483 (ex-LU 1938 tube stock; DTG, Isle of Wight: Ryde – Shanklin), 2026-10-12. Own layout over the uk-unit draft.
// One node set, no cab suffixes; GetActiveCab fails. Reverser Reverse 0 / Off 0.33 / Forward 1 0.67 / Forward 2 1 (zones take any
// value, even thirds). MasterController (traction, dead man's handle) Off 0 / Shunting 0.25 / Full series 0.58 / Full parallel 0.93
// (zones 0..0.16 / 0.17..0.49 / 0.5..0.83 / 0.84..1, even thirds used). DriversBrake 0..2 (agent probe with probe_lever.js): EP zone
// continuous 0..1 (Released 0 / EP hold 0.25 / EP min 0.5 / EP normal 0.75 / EP max 1, output 4 x input), then detents Westinghouse
// hold 1.3333 / Westinghouse charge 1.6667 / Emergency 2. Keys ReverserKey (MasterSwitch push button), MasterKey (push button) and
// MasterKeyLever (lever 0 / 0.826); no AWS node, the deadman is the traction handle itself.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679090';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR_Class483/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const press=node=>pair(node,1,0); // push button: 0 -> 1 presses it, the release back to 0 is harmless on an ON / OFF command button
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Off 0.33 / Forward 1 0.67 / Forward 2 1, any value in a zone stores, even thirds), inverted: Forward 2 at the far end, Reverse nearest',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.3333,0.6667,1],invert:true}}]},
 {name:'LeftThrottle',description:'Traction controller MasterController (Off 0 / Shunting 0.25 / Full series 0.58 / Full parallel 0.93; the zones take any value, so even thirds 0 / 0.333 / 0.667 / 1), plain as the Class 153: Off at the far end, Full parallel nearest',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0,0.3333,0.6667,1]}}]},
 {name:'RightThrottle',description:'Brake handle DriversBrake 0..2: EP zone continuous 0..1 (Released 0 / EP hold 0.25 / EP min 0.5 / EP normal 0.75 / EP max 1), then Westinghouse hold 1.3333 / Westinghouse charge 1.6667 / Emergency 2. Inverted as the 153 brake: Emergency at the far end, Released nearest. Bands on the raw axis: Emergency 0 ±0.06, Charge 0.16 ±0.06, Westinghouse hold 0.31 ±0.06 (detent), EP max 0.44 ±0.05 (detent), EP zone 0.5..0.92 (EP max down to Released), Released 1 ±0.06',assignments:[{type:'direct_control',controls:'DriversBrake',input_value:{min:0,max:2,steps:[0,null,1,1.3333,1.6667,2],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.92,threshold_end:0.5},{threshold:0.44,threshold_tolerance:0.05},{threshold:0.31,threshold_tolerance:0.06},{threshold:0.16,threshold_tolerance:0.06},{threshold:0,threshold_tolerance:0.06}]}}]},
 {name:'ParkingBrake',description:'Reverser key ReverserKey (MasterSwitch push button, In 1 / Out 0) and master key lever MasterKeyLever (0 / 1): PARK BRK up = both in',assignments:[pair('ReverserKey',1,0),pair('MasterKeyLever',1,0)]},
 key('GearLever','Safety acknowledge (game key Q; the 483 has no AWS, its deadman is the traction handle)','Q'),
 mom('LeftEngineOn','Horn (Horn push button)','Horn',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'RotaryCrank',description:'Wiper park (WindowWiperControl Park 0)',assignments:[set('WindowWiperControl',0)]},
 {name:'RotaryIgnStart',description:'Wiper run (WindowWiperControl Run 0.8247, set 1)',assignments:[set('WindowWiperControl',1)]},
 {name:'AutoBrake0',description:'Lights | Headlights off (Headlight_OFF push button)',assignments:[press('Headlight_OFF')]},
 {name:'AutoBrake1',description:'Lights | Headlights on (Headlight_ON push button)',assignments:[press('Headlight_ON')]},
 {name:'AutoBrake2',description:'Lights | Headlights and instrument lights on',assignments:[press('Headlight_ON'),press('InstrumentLights_ON')]},
 {name:'AutoBrake3',description:'Lights | Headlights, instrument and saloon lights on',assignments:[press('Headlight_ON'),press('InstrumentLights_ON'),press('PassLights_ON')]},
 {name:'AutoBrake4',description:'Lights | Saloon lights off (PassLights_OFF)',assignments:[press('PassLights_OFF')]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-483-dtg-thejag',title:'Class 483',eyebrow:'Island Line · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Isle of Wight: Ryde Pier Head – Shanklin',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-483-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward 2','Forward 1','Off','Reverse'],start:2},
 leftThrottle:{name:'Traction controller',notches:['Off','Shunting','Series','Parallel'],start:0},
 rightThrottle:{name:'Brake handle',continuous:true,notches:['Emergency','W. charge','W. hold','EP max',null,'Release'],start:3},
 flap:null,
 leftThrottleButton:null, rightThrottleButton:null, gearLever:{name:'Safety ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Head off'},{short:'LO',desc:'Head on'},{short:'2',desc:'+ instruments'},{short:'3',desc:'+ saloon'},{short:'HI',desc:'Saloon off'}],start:1},
 eng1:{name:'Horn',start:true}, eng2:null,
 leftAux:null, rightAux:null,
 modeSwitch:{name:'Wiper',left:'park',right:'run'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser + master key',flat:'out',up:'in'}},
setup:['PARK BRK up: reverser key and master key in; Start (circuit breaker) in the cab','Reverser from Off to Forward 1','Lights to Head on','Brake handle at EP max (parked)','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard signal, check the signal','Brake handle through the EP zone to Released','Traction controller to Shunting, then Full series and Full parallel','Keep the deadman (traction handle) pressed; acknowledge with the gear lever if the game asks','Brake: traction Off, handle into the EP zone towards EP max; Westinghouse hold and charge beyond it, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-class-483-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
