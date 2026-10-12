// Metro-North M8 (Kawasaki, DTG, Northeast Corridor New York – Stamford), 2026-10-13. Derived from mkm7a.js: the same MasterController
// values. One desk per car, plain node names. Capture agent probe: MasterController (Throttle, 0..1) Emergency 0 / Max Brake 0.1 / brake zone
// 0.11..0.39 / Min Brake 0.4 / Coast 0.5 / Min Power 0.6 / power zone 0.61..1; EVERY notch boundary is a gate (one per API set), free inside
// a zone; a one-time start lock (stays at Emergency in Neutral) cleared once the reverser went to Forward. Reverser Reverse 0 / Neutral 0.33
// / Forward 0.66 / Key Out 1 (snaps; Key Out slightly unreliable), free with the controller in Emergency. MasterKey (MasterSwitch) Off 0 /
// On 1, loads Off, a set of 0 is ignored. No fuses, cut-outs or deadman nodes. ModeOfOperation (PantographSelection) DC 0 / AC Pan Up 0.33
// / AC Pan Down 0.66 / Emer Pan Down 1 (loads AC Pan Up). Headlights Marker 0 / Off 0.33 / Dim 0.66 / Bright 1 (loads Marker); WiperSpeed
// Off 0.6 / Low 0.8; DriverBuzzer (Bell), Horn, Acknowledge (Alerter), CabCeilingLight 0 / 1 (loads On). The brake pipe charges (147 psi).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680690';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_NYS_MNR_M8_A_C','RVM_NYS_MNR_M8_B_C','RVM_NYS_MNR_M8_DM_C','RVM_NYS_MNR_M8_S_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=h=>[set('Headlights',h)];
// raw axis, far end (raw 0) = P4 .. Emergency nearest (raw 1)
// raw axis, plain: Emergency at the far end (raw 0) .. Max power nearest (raw 1)
const thMC=[{threshold:0,threshold_tolerance:0.03},{threshold:0.07,threshold_tolerance:0.03},{threshold:0.11,threshold_end:0.42},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.58,threshold_end:0.955},{threshold:1,threshold_tolerance:0.04}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Neutral 0.33 / Forward 0.66; Key Out 1 stays in the cab), inverted: Forward at the far end. Needs the master key (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:0.66,steps:[0,0.33,0.66],invert:true}}]},
 {name:'LeftThrottle',description:'Master controller MasterController 0..1 (Emergency 0 / Max Brake 0.1 / brake zone 0.11..0.39 / Min brake 0.4 / Coast 0.5 / Min Power 0.6 / power zone 0.61..1; every notch boundary is a gate the game crosses one per set), plain as the desk reads: Emergency at the far end (raw 0 ±0.03), Max Brake 0.07 ±0.03, brake zone 0.11..0.42, Min brake 0.45 ±0.03, Coast 0.5 ±0.02, Min Power 0.55 ±0.03, power zone 0.58..0.955, Max power 1 ±0.04 nearest.',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0,0.1,null,0.4,0.5,0.6,null,1],step_thresholds:thMC}}]},
 {name:'ParkingBrake',description:'Master key MasterKey (MasterSwitch lever, On 1 / Off 0; the game ignores Off): PARK BRK up = key in',assignments:[pair('MasterKey',1,0)]},
 mom('GearLever','ATC / ACSES acknowledge (Acknowledge lever 1 while held, 0.5 released)','Acknowledge',1,0.5),
 mom('RightThrottleButton','Horn (Horn lever 1, back to 0)','Horn',1,0),
 {name:'LeftEngineOn',description:'Driver buzzer (DriverBuzzer push button: 1 while up, 0 when down)',assignments:[pair('DriverBuzzer',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('RoundAuxButton','Cab ceiling light (CabCeilingLight 1 / 0). Lit = on; loads on','CabCeilingLight',1,0),
 {name:'RotaryCrank',description:'Wiper off (WiperSpeed 0.6)',assignments:[set('WiperSpeed',0.6)]},
 {name:'RotaryIgnStart',description:'Wiper low (WiperSpeed 0.8)',assignments:[set('WiperSpeed',0.8)]},
 {name:'AutoBrake0',description:'Lights | Off (Headlights 0.33)',assignments:lights(0.33)},
 {name:'AutoBrake1',description:'Lights | Marker lights (Headlights 0; this end trailing)',assignments:lights(0)},
 {name:'AutoBrake2',description:'Lights | Dim (0.66)',assignments:lights(0.66)},
 {name:'AutoBrake3',description:'Lights | Bright (1)',assignments:lights(1)},
 {name:'AutoBrake4',description:'Lights | Bright (1)',assignments:lights(1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-metro-north-m8-dtg-thejag',title:'M8',eyebrow:'Metro-North Railroad · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Northeast Corridor: New York – Stamford',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-metro-north-slate.svg',alt:'Metro-North Railroad'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/metro-north-m8-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Master controller',continuous:true,notches:['Emergency','Max brake',null,'Min brake','Coast','Min power',null,'Max power'],start:1},
 rightThrottle:null, flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Acknowledge'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Markers'},{short:'2',desc:'Dim'},{short:'3',desc:'Bright'},{short:'HI',desc:'Bright'}],start:1},
 eng1:{name:'Buzzer',start:true}, eng2:null,
 leftAux:null, rightAux:null,
 modeSwitch:{name:'Wiper',left:'off',right:'low'}, roundAux:{name:'Cab lights'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['PARK BRK up: master key in; the reverser loads at Key Out','Reverser from Neutral to Forward (the controller stays in Emergency until the reverser has been in Forward once)','Pantograph mode stays at AC Pan Up on this route (desk rotary)','Lights to Bright','Controller at Max brake (parked)'],
depart:['Close doors (RUD TRIM), check the signal; buzzer (ENG 1)','Controller towards you through Min brake and Coast into the power zone','Acknowledge ATC / ACSES with the gear lever','Brake: controller away from you through Coast and Min brake into the brake zone; Max brake for the stop, Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-metro-north-m8-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
