const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_ATS_Class90_DB_Blue','RVM_ATS_Class90_DB_Red','RVM_ATS_Class90F','RVM_ATS_Class90F_Green_New','RVM_ATS_Class90F_Green_Old','RVM_ATS_Class90F_Grey','RVM_C90F_FKA'].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const HL='HeadLightSwitch_F',MK='MarkerLights_F',TL='TailLights_F';
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Off / Reverse / Neutral / Forward)',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:0,max:1,steps:[0,0.33,0.66,1],invert:true}}]},
 {name:'LeftThrottle',description:'Train brake (Running / 1 / 2 / 3 / 4 / 5 / Full service / Emergency)',assignments:[{type:'direct_control',controls:'TrainBrake_F',input_value:{min:0.1,max:1,steps:[0.1,0.22,0.35,0.5,0.65,0.8,0.9,1]}}]},
 {name:'RightThrottle',description:'Power handle (Off 0 / Min 0.1 / continuous 0.11..0.99 / Max 1)',assignments:[{type:'direct_control',controls:'Throttle_F',input_value:{min:0,max:1,steps:[0,0.1,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.04},{threshold:0.12,threshold_tolerance:0.05},{threshold:0.19,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.035}]}}]},
 {name:'FlapLever',description:'Rheostatic (dynamic) brake (Release / 1 / 2 / 3 / 4 / 5 / Full service)',assignments:[{type:'direct_control',controls:'DynamicBrake_F',input_value:{min:0.1,max:0.9,steps:[0.1,0.22,0.35,0.5,0.65,0.8,0.9]}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey_F',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey_F',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','Sand_F',1,0),
 {name:'RightThrottleButton',description:'Pantograph up + main circuit breaker close (press again once the pan is up)',assignments:[{type:'momentary',threshold:0.9,action_activate:{controls:'PanUp_F',value:1,hold:true},action_deactivate:{controls:'PanUp_F',value:0,hold:false}},{type:'momentary',threshold:0.9,action_activate:{controls:'MainCircuitBreaker_F',value:1,hold:true},action_deactivate:{controls:'MainCircuitBreaker_F',value:0.5,hold:false}}]},
 mom('LeftEngineOn','Horn | High','Horn_F',1,0.5),
 mom('RightEngineOn','Horn | Low','Horn_F',0,0.5),
 mom('RudderTrimLeft','Parking brake | On','ParkingBrakeOn_F',1,0),
 mom('RudderTrimRight','Parking brake | Off','ParkingBrakeOff_F',1,0),
 tog('RoundAuxButton','DRA (lit = Set / unlit = Reset)','DRA_F',1,0),
 tog('LeftAuxButton','AWS isolation (lit = Isolated / unlit = Normal)','ISO_AWS_F',1,0),
 tog('RightAuxButton','DSD isolation (lit = Isolated / unlit = Normal)','ISO_DSD_F',0,1),
 {name:'RotaryCrank',description:'Wipers one notch towards Park (Run > Off > Park)',assignments:[rel('Wiper_FL',-0.34),rel('Wiper_FR',-0.34)]},
 {name:'RotaryIgnStart',description:'Wipers one notch towards Run (Park > Off > Run)',assignments:[rel('Wiper_FL',0.34),rel('Wiper_FR',0.34)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:[set(HL,0.5),set(MK,0),set(TL,0)]},
 {name:'AutoBrake1',description:'Lights | Day + markers',assignments:[set(HL,0),set(MK,1),set(TL,0)]},
 {name:'AutoBrake2',description:'Lights | Markers only',assignments:[set(HL,0.5),set(MK,1),set(TL,0)]},
 {name:'AutoBrake3',description:'Lights | Night + markers',assignments:[set(HL,1),set(MK,1),set(TL,0)]},
 {name:'AutoBrake4',description:'Lights | Tail lights only',assignments:[set(HL,0.5),set(MK,0),set(TL,1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');console.log('profile ok');
const m={name:'tsw-class-90-ats-thejag',title:'Class 90',eyebrow:'DB Cargo UK · Alan Thomson Simulation · TCA Quadrant Airbus',profileName:p.name,developer:'Alan Thomson Simulation',route:'West Coast Main Line South: London Euston – Milton Keynes',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-db-cargo-navy.svg',alt:'DB Cargo UK'}],dlc:'store.steampowered.com/app/4680710',credit:'© TheJAG',cab:{file:'../../assets/class-90-ats-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse','Off'],start:3},
 leftThrottle:{name:'Train brake',notches:['Running','1','2','3','4','5','Full service','Emergency'],start:6},
 rightThrottle:{name:'Power handle',continuous:true,notches:['Off','Min',null,null,null,null,null,'Max'],start:0},
 flap:{name:'Rheostatic brake',notches:['Release','1','2','3','4','5','Full service'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Pan up + MCB close'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Markers only'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail only'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DSD isolation'},
 modeSwitch:{name:'Wipers',left:'park',right:'run'}, roundAux:{name:'DRA set / reset'}, rudTrim:{name:'Park brake on / off'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Pantograph up, then press again to close the circuit breaker (right throttle button)','Check AWS and DSD isolation lights are out','Lights to Day','Release the parking brake (RUD TRIM right)','Train brake to Full service, DRA reset'],
depart:['Check the signal','Reverser to Forward','Train brake to Running','Power handle to Min, then open up gradually with the heavy train','Rheostatic brake on the flap lever for braking on the move','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-90-ats-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
