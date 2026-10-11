// BR Class 33 Crompton (DTG, West Somerset Railway), 2026-10-12. Own layout over the uk-dmu draft, patterned on the JT Class 20.
// Two desks `_F` / `_B` (some nodes `_(A)` / `_(B)`); IS_GetActiveCab fails, so the F desk is wired by name. API probe with MasterKey_F
// on and the engine started: `Reverser_F` Off 0 / Reverse 0.25 / Engine Only 0.57 / Forward 0.92 (zones 0..0.16 / 0.17..0.49 /
// 0.5..0.83 / 0.84..1, even thirds used); `Throttle_F` Off 0 / On 0.2 / continuous 0.205..1 (the sweep's "stuck at 0.41" was the
// engine not running); `DriversBrake_F` (Davies & Metcalfe air valve) Running 0 (sets below 0.13) / Initial 0.25 / continuous Service to
// 0.78 / Emergency 0.9 (0.85+) / Neutral-Shutdown 1 (needs a second set, cab only); `StraightBrake_F` continuous 0..1.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4678840';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/^RVM_WSR_Class33/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
// MarkerLHS/RHS_(A) levers Red 0 / Off 0.5 / White 1 (the A end); HeadlightSwitch_F is an on-off toggle button (0 / 1 sends).
const lights=(head,a,b)=>[set('HeadlightSwitch_F (ToggleButton)',head),set('MarkerLHS_(A)',a),set('MarkerRHS_(A)',a),set('MarkerLHS_(B)',b),set('MarkerRHS_(B)',b)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser_F (Off 0 / Reverse 0.25 / Engine Only 0.57 / Forward 0.92; the zones take any value, so even thirds), inverted: Forward at the far end, Off nearest',assignments:[{type:'direct_control',controls:'Reverser_F (IrregularLever)',input_value:{min:0,max:1,steps:[0,0.3333,0.6667,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power handle Throttle_F (Off 0 / On 0.2 / continuous power 0.205..1; it only moves with the engine running and the reverser in Forward), plain: Off at the far end, full power nearest. Off raw 0 ±0.08, On 0.2 ±0.08, power zone 0.32..0.96, full 1 ±0.04',assignments:[{type:'direct_control',controls:'Throttle_F (IrregularLever)',input_value:{min:0,max:1,steps:[0,0.2,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.08},{threshold:0.2,threshold_tolerance:0.08},{threshold:0.32,threshold_end:0.96},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Train brake DriversBrake_F, Davies & Metcalfe valve (Running 0 / Initial 0.25 / continuous Service to Full 0.78 / Emergency 0.9; Neutral-Shutdown at 1 stays in the cab), inverted as the Class 153 brake: Emergency at the far end, Running nearest. Emergency raw 0 ±0.06, Full 0.16 ±0.05, free zone 0.24..0.78 (full down to initial), Initial 0.84 ±0.04 (detent), Running 1 ±0.08',assignments:[{type:'direct_control',controls:'DriversBrake_F (IrregularLever)',input_value:{min:0,max:0.9,steps:[0,0.25,null,0.78,0.9],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.08},{threshold:0.84,threshold_tolerance:0.04},{threshold:0.78,threshold_end:0.24},{threshold:0.16,threshold_tolerance:0.05},{threshold:0,threshold_tolerance:0.06}]}}]},
 {name:'FlapLever',description:'Loco brake StraightBrake_F (continuous 0..1), inverted: Full at the far end, Release nearest',assignments:[{type:'direct_control',controls:'StraightBrake_F (SimpleLever)',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Master key MasterKey_F (toggle button, In 1 / Out 0): PARK BRK up = key in',assignments:[pair('MasterKey_F (ToggleButton)',1,0)]},
 mom('GearLever','AWS reset (AWSReset_F push button, held)','AWSReset_F (PushButton)',1,0),
 mom('LeftThrottleButton','Sand (Sander_(A) push button)','Sander_(A)',1,0),
 mom('RightThrottleButton','Engine start (EngineStart_F push button, held)','EngineStart_F (PushButton)',1,0),
 mom('LeftEngineOn','Horn | High (Horn_FL lever 1, rest 0.5)','Horn_FL (IrregularLever)',1,0.5),
 mom('RightEngineOn','Horn | Low (Horn_FL lever 0, rest 0.5)','Horn_FL (IrregularLever)',0,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','AWS isolation (AWS_Isolation_F toggle button: Isolated 0 / Unisolated 1). Lit = isolated','AWS_Isolation_F (ToggleButton)',0,1),
 {name:'RotaryCrank',description:'Wiper off (Wiper_FL: Off 0 / Park 0.5 / Run 1)',assignments:[set('Wiper_FL (IrregularLever)',0)]},
 {name:'RotaryIgnStart',description:'Wiper run (Wiper_FL 1)',assignments:[set('Wiper_FL (IrregularLever)',1)]},
 {name:'AutoBrake0',description:'Lights | Off (headlight 0, both ends\' markers Off)',assignments:lights(0,0.5,0.5)},
 {name:'AutoBrake1',description:'Lights | A end white markers',assignments:lights(0,1,0.5)},
 {name:'AutoBrake2',description:'Lights | A end white markers and headlight',assignments:lights(1,1,0.5)},
 {name:'AutoBrake3',description:'Lights | A end white, headlight, B end red (tail)',assignments:lights(1,1,0)},
 {name:'AutoBrake4',description:'Lights | B end white markers (running B end first)',assignments:lights(0,0.5,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-33-dtg-thejag',title:'Class 33',eyebrow:'West Somerset Railway · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'West Somerset Railway: Bishops Lydeard – Minehead',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-33-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Engine only','Reverse','Off'],start:3},
 leftThrottle:{name:'Power handle',continuous:true,notches:['Off','On',null,null,'Full'],start:0},
 rightThrottle:{name:'Train brake',continuous:true,notches:['Emergency','Full',null,'Initial','Running'],start:1},
 flap:{name:'Loco brake',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'A markers'},{short:'2',desc:'+ headlight'},{short:'3',desc:'+ B tail'},{short:'HI',desc:'B markers'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:null,
 modeSwitch:{name:'Wiper',left:'off',right:'run'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['PARK BRK up: master key in; brake selector and timing switch in the cab','Start the engine (right throttle button): the power handle only moves with it running','Reverser from Off through Engine only to Forward','Check the AWS isolation light is out','Lights to A markers + headlight','Loco brake at Full, train brake at Full (parked)'],
depart:['Check the signal; release the handbrake in the cab','Train brake to Running, loco brake to Release','Power handle to On, then into the power zone','Acknowledge AWS with the gear lever','Brake: power Off, train brake towards Full; Emergency at the far end','Shut down: the Neutral position of the brake valve is in the cab']};
fs.writeFileSync('tools/manual/trains/tsw-class-33-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
