// BR Class 101 Metro-Cammell DMU (Just Trains, WCML Preston – Carlisle), 2026-10-12. Own layout over the uk-dmu draft (mk165 style).
// One node set, no cab suffixes; IS_GetActiveCab fails. API probe (keys MainSwitch + AWS_ChangeEnd on, engines started, reverser
// Forward): GearSelector stores 0 = 1st / 0.25 = 2nd / 0.5 = 3rd / 0.75 = 4th / 1 = Neutral (locked at Neutral before that);
// DriversBrakeValve (vacuum) Released 0, continuous release zone to 0.47, Lap 0.5, continuous apply zone 0.55..1 (output 1.06..2);
// Throttle Idling 0 / 0.25 / 0.5 / 0.75 / Full 1; Reverser Off 0 / Forward 0.5 / Reverse 1 (no Neutral).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680080';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/JT_BR_Class101/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(l,r)=>[set('MarkerLight_L',l),set('MarkerLight_R',r)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Off 0 / Forward 0.5 / Reverse 1; no Neutral, Off is the middle state), plain: Off at the far end, Forward in the middle, Reverse nearest',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1]}}]},
 {name:'LeftThrottle',description:'Throttle (Idling 0 / 1 0.25 / 2 0.5 / 3 0.75 / Full 1), plain as the Class 153: Idling at the far end, Full nearest',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:0,max:1,steps:[0,0.25,0.5,0.75,1]}}]},
 {name:'RightThrottle',description:'Vacuum brake DriversBrakeValve (Released 0 / release zone to 0.47 / Lap 0.5 / apply zone 0.55..1 / full application 1), inverted as the Class 153 brake: full application at the far end, Released nearest. Released raw 1 ±0.08, release zone 0.9..0.58, Lap 0.5 ±0.06, apply zone 0.42..0.08, full 0 ±0.06',assignments:[{type:'direct_control',controls:'DriversBrakeValve',input_value:{min:0,max:1,steps:[0,null,0.5,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.08},{threshold:0.9,threshold_end:0.58},{threshold:0.5,threshold_tolerance:0.06},{threshold:0.42,threshold_end:0.08},{threshold:0,threshold_tolerance:0.06}]}}]},
 {name:'FlapLever',description:'Gear selector GearSelector (1st 0 / 2nd 0.25 / 3rd 0.5 / 4th 0.75 / Neutral 1; it only moves with both keys in, the engines running and the reverser in Forward), inverted: Neutral at the far end, then 4th, 3rd, 2nd, 1st nearest',assignments:[{type:'direct_control',controls:'GearSelector',input_value:{min:0,max:1,steps:[0,0.25,0.5,0.75,1],invert:true}}]},
 {name:'ParkingBrake',description:'Main switch MainSwitch (MasterSwitch push button, On 1 / Off 0) and AWS change-end key AWS_ChangeEnd (lever, On 1 / Off 0): PARK BRK up = both in',assignments:[pair('MainSwitch',1,0),pair('AWS_ChangeEnd',1,0)]},
 mom('GearLever','AWS reset (AWS_ResetButton push button, held)','AWS_ResetButton',1,0),
 mom('RightThrottleButton','Engine start, front engine (EngineStart_Front_Int push button, held)','EngineStart_Front_Int',1,0),
 mom('LeftEngineOn','Horn | High (Horn spring lever 1, rest 0.5)','Horn',1,0.5),
 mom('RightEngineOn','Horn | Low (Horn spring lever 0, rest 0.5)','Horn',0,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','AWS isolation (AWS_IsolationLever: Isolated 0 / Unisolated 1). Lit = isolated','AWS_IsolationLever',0,1),
 tog('RightAuxButton','Deadman (DSD) isolation (DeadmansIsolation lever: Isolated 0 / Unisolated 1). Lit = isolated','DeadmansIsolation',0,1),
 mom('RoundAuxButton','Guard buzzer (GuardBuzzer push button)','GuardBuzzer',1,0),
 {name:'RotaryCrank',description:'Wipers stop (Wiper_L lever: Stop 0 / Run 0.5 / Park 1)',assignments:[set('Wiper_L',0)]},
 {name:'RotaryIgnStart',description:'Wipers run (Wiper_L 0.5)',assignments:[set('Wiper_L',0.5)]},
 {name:'AutoBrake0',description:'Marker lights | Off (MarkerLight_L / _R: Red 0 / Off 0.5 / White 1)',assignments:lights(0.5,0.5)},
 {name:'AutoBrake1',description:'Marker lights | White both',assignments:lights(1,1)},
 {name:'AutoBrake2',description:'Marker lights | Red both (tail)',assignments:lights(0,0)},
 {name:'AutoBrake3',description:'Marker lights | White left, red right',assignments:lights(1,0)},
 {name:'AutoBrake4',description:'Marker lights | Red left, white right',assignments:lights(0,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-101-jt-thejag',title:'Class 101',eyebrow:'British Rail · Just Trains · TCA Quadrant Airbus',profileName:p.name,developer:'Just Trains',route:'West Coast Main Line: Preston – Carlisle',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-britishrail-navy.svg',alt:'British Rail'},{file:'../../assets/logo-justtrains-navy.png',alt:'Just Trains'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-101-jt-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Reverse'],start:0},
 leftThrottle:{name:'Throttle',notches:['Idle','1','2','3','Full'],start:0},
 rightThrottle:{name:'Vacuum brake',continuous:true,notches:['Apply',null,'Lap',null,'Release'],start:2},
 flap:{name:'Gear selector',notches:['Neutral','4th','3rd','2nd','1st'],start:0},
 leftThrottleButton:null, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Marker lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'White'},{short:'2',desc:'Red (tail)'},{short:'3',desc:'White L, red R'},{short:'HI',desc:'Red L, white R'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'Deadman isolation'},
 modeSwitch:{name:'Wipers',left:'stop',right:'run'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Main switch + AWS key',flat:'out',up:'in'}},
setup:['PARK BRK up: main switch on and AWS change-end key in','Start the engines (right throttle button for the front engine; the rear engine button is in the cab)','Reverser to Forward; the gear selector only moves then','Check the AWS and deadman isolation lights are out','Marker lights to White','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard buzzer (round aux)','Check the signal','Gear selector to 1st (nearest), vacuum brake to Released','Throttle up to Full; change up through 2nd, 3rd and 4th with the throttle closed','Acknowledge AWS with the gear lever','Brake: throttle to Idling, gear to Neutral, vacuum brake into the apply zone; Lap holds the application']};
fs.writeFileSync('tools/manual/trains/tsw-class-101-jt-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
