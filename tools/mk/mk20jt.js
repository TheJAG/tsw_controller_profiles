// BR Class 20 (Just Trains, WCML Crewe – Preston), 2026-10-12. Own layout over the uk-dmu draft, brakes as the JT Class 08.
// Single cab with F / B desks (`_F` / `_B` nodes); IS_GetActiveCab fails, so the F desk (the one in the photo) is wired by name.
// API probe (MasterKeySwitch_F on): `Reverser_F` Off 0 / Reverse 0.3333 / Engine Only 0.6667 / Forward 1 (the B desk reverser has
// Reverse and Forward swapped), moves only with the throttle at Off; `Throttle_F` Off 0 / On 0.2 (sets 0.1..0.2) / Slow speed 0.215 /
// continuous 0.23..1 (output 0.1..1), moves only in Forward, one gate down (a set to 0 from power stops at 0.215, then 0.2, then 0);
// `TrainBrake_F` (vacuum) Running 0.1 (sets below 0.18) / Initial 0.25 / continuous to 0.8 / Emergency 0.9 (0.85+); `LocoBrake_F`
// continuous 0..1; `EmergencyBrakeValve` continuous 0..1 (cab only). CabChangeLever_F (0/1) was not needed for anything.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680540';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/JT_BR_Class20/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
// Marker lamps are on-off push buttons (toggle on a value change through the mod): Off positions send 0, On positions 1. TailLampRear lever Off 0 / Automatic 0.42 / On 1.
const lights=(fl,ft,rl,tail)=>[set('FrontLeftMarker (PushButton)',fl),set('FrontRightMarker (PushButton)',fl),set('FrontTopMarker (PushButton)',ft),set('RearLeftMarker (PushButton)',rl),set('RearRightMarker (PushButton)',rl),set('TailLampRear',tail)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser_F (Off 0 / Reverse 0.3333 / Engine Only 0.6667 / Forward 1), inverted: Forward at the far end, Off nearest. Moves only with the throttle at Off',assignments:[{type:'direct_control',controls:'Reverser_F (IrregularLever)',input_value:{min:0,max:1,steps:[0,0.3333,0.6667,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power handle Throttle_F (Off 0 / On 0.2 / Slow speed 0.215 / continuous power 0.23..1), plain: Off at the far end, full power nearest. Off raw 0 ±0.08, On 0.2 ±0.06, Slow speed 0.31 ±0.05 (detent), power zone 0.4..0.96, full 1 ±0.04. Moves only with the reverser in Forward',assignments:[{type:'direct_control',controls:'Throttle_F (IrregularLever)',input_value:{min:0,max:1,steps:[0,0.2,0.215,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.08},{threshold:0.2,threshold_tolerance:0.06},{threshold:0.31,threshold_tolerance:0.05},{threshold:0.4,threshold_end:0.96},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Vacuum brake TrainBrake_F (Running 0.1 / Initial 0.25 / continuous to Full 0.8 / Emergency 0.9), inverted as the Class 153 brake: Emergency at the far end, Running nearest. Emergency raw 0 ±0.06, Full 0.16 ±0.05, free zone 0.24..0.78 (full down to initial), Initial 0.84 ±0.04 (detent), Running 1 ±0.08',assignments:[{type:'direct_control',controls:'TrainBrake_F (IrregularLever)',input_value:{min:0.1,max:0.9,steps:[0.1,0.25,null,0.8,0.9],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.08},{threshold:0.84,threshold_tolerance:0.04},{threshold:0.78,threshold_end:0.24},{threshold:0.16,threshold_tolerance:0.05},{threshold:0,threshold_tolerance:0.06}]}}]},
 {name:'FlapLever',description:'Loco brake LocoBrake_F (continuous 0..1), inverted: Full at the far end, Release nearest',assignments:[{type:'direct_control',controls:'LocoBrake_F (SimpleLever)',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Master key MasterKeySwitch_F (lever, On 1 / Off 0): PARK BRK up = key in',assignments:[pair('MasterKeySwitch_F (Lever)',1,0)]},
 mom('GearLever','AWS reset (AWSReset_F push button, held)','AWSReset_F (PushButton)',1,0),
 mom('LeftThrottleButton','Sand (Sander_(F) push button)','Sander_(F)',1,0),
 mom('RightThrottleButton','Engine start (EngineStart_F push button, held)','EngineStart_F (PushButton)',1,0),
 mom('LeftEngineOn','Horn | High (Horn_F lever 0, rest 0.5)','Horn_F (IrregularLever)',0,0.5),
 mom('RightEngineOn','Horn | Low (Horn_F lever 1, rest 0.5)','Horn_F (IrregularLever)',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','AWS isolation (AWS_Isolation_F lever: Isolated 0 / Unisolated 1). Lit = isolated','AWS_Isolation_F (Simple Lever)',0,1),
 tog('RightAuxButton','DSD circuit breaker (DSDCircuitBreaker push button, WarningDevices: 1 / 0). Lit = pressed','DSDCircuitBreaker',1,0),
 {name:'RotaryCrank',description:'Wiper stop (Wiper_FL: Stop 0 / Run 0.1..1)',assignments:[set('Wiper_FL (IrregularLever)',0)]},
 {name:'RotaryIgnStart',description:'Wiper run (Wiper_FL 0.5)',assignments:[set('Wiper_FL (IrregularLever)',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off (front markers 0, rear tail lamp Automatic)',assignments:lights(0,0,0,0.42)},
 {name:'AutoBrake1',description:'Lights | Front markers (left and right)',assignments:lights(1,0,0,0.42)},
 {name:'AutoBrake2',description:'Lights | Front markers and top marker',assignments:lights(1,1,0,0.42)},
 {name:'AutoBrake3',description:'Lights | Front markers, rear tail lamp On',assignments:lights(1,1,0,1)},
 {name:'AutoBrake4',description:'Lights | Front and rear markers (shunting)',assignments:lights(1,1,1,0.42)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-20-jt-thejag',title:'Class 20',eyebrow:'British Rail · Just Trains · TCA Quadrant Airbus',profileName:p.name,developer:'Just Trains',route:'West Coast Main Line: Crewe – Preston',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-britishrail-navy.svg',alt:'British Rail'},{file:'../../assets/logo-justtrains-navy.png',alt:'Just Trains'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-20-jt-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Engine only','Reverse','Off'],start:3},
 leftThrottle:{name:'Power handle',continuous:true,notches:['Off','On','Slow speed',null,'Full'],start:0},
 rightThrottle:{name:'Vacuum brake',continuous:true,notches:['Emergency','Full',null,'Initial','Running'],start:1},
 flap:{name:'Loco brake',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Front markers'},{short:'2',desc:'+ top marker'},{short:'3',desc:'+ rear tail'},{short:'HI',desc:'Both ends'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DSD breaker'},
 modeSwitch:{name:'Wiper',left:'stop',right:'run'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['PARK BRK up: master key in; brake selector (vacuum / air, goods / passenger) in the cab','Start the engine (right throttle button)','Reverser from Off through Engine only to Forward: the power handle only moves then','Check the AWS isolation light is out','Lights to Front markers','Loco brake at Full, vacuum brake at Full (parked)'],
depart:['Check the signal; release the handbrake in the cab','Vacuum brake to Running, loco brake to Release','Power handle to On, then into the power zone','Acknowledge AWS with the gear lever','Brake: power Off, vacuum brake towards Full; Emergency at the far end','Change direction: power Off first, then the reverser']};
fs.writeFileSync('tools/manual/trains/tsw-class-20-jt-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
