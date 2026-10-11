// BR Class 31/1 (DTG loco add-on, Tees Valley Line). The Class 37 pattern with bracketed node names: Throttle_F
// (IrregularLever) Off 0 / notches 1..4 at 0.1 / 0.2 / 0.3 / 0.4 (one gate per API set) / continuous 0.41..0.99 / Full 1;
// DriversBrake_F (IrregularLever) Running 0.1 / 1st application 0.25 / Service continuous 0.3..0.75 / Full service 0.8 /
// Emergency 0.9 (Release and Shutdown do not store); StraightBrake_F (SimpleLever) continuous 0..1; Reverser_F
// (IrregularLever) Off 0 / Reverse 0.2468 / Engine only 0.569 / Forward 0.9243 (it will not leave Forward with the throttle
// above Off). The handles only store with MasterKeySwitch_F (Lever) at 0.84 AND CabChangeLever_F (Simple Lever) at 0.71.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4678980';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_DSN_BR_Class31-1fX_C'}];p.name='TSW | Class 31 | DTG | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const momA=(node,on,off)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_DSN_BR_Class31-1fX_C.json','utf8'));
const all=[...Object.keys(cap.levers),...(Array.isArray(cap.controls)?cap.controls:Object.values(cap.controls||{})).map(x=>x.name)];
const nm=re=>{const n=all.find(x=>re.test(x)); if(!n) throw new Error('node not found '+re); return n;};
const R=nm(/^Reverser_F/),TH=nm(/^Throttle_F/),DB=nm(/^DriversBrake_F/),SB=nm(/^StraightBrake_F/),MK=nm(/^MasterKeySwitch_F/),CC=nm(/^CabChangeLever_F/),HORN=nm(/^Horn_FL/),WIP=nm(/^Wiper_FL/);
const SAND=nm(/^Sander_?\(A\)|^Sander_A/),EST=nm(/^EngineStart_F/),ESP=nm(/^EngineStop_F/),AWSI=nm(/^AWS_Isolation_F/),DSD=nm(/^DSDCircuitBreaker/),HBF=nm(/^HandbrakeFront/),RIL=nm(/^RouteIndicatorLights ?\(A\)/),TLL=nm(/^TailLightLeft_A/),TLR=nm(/^TailLightRight_A/);
console.log('nodes',[R,TH,DB,SB,MK,CC,HORN,WIP,SAND,EST,ESP,AWSI,DSD,HBF,RIL,TLL,TLR].join(' | '));
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Off 0 / Reverse 0.2468 / Engine only 0.569 / Forward 0.9243), inverted: Forward at the far end, Off nearest. It only leaves Forward with the power controller at Off',assignments:[{type:'direct_control',controls:R,input_value:{min:0,max:0.9243,steps:[0,0.2468,0.569,0.9243],invert:true}}]},
 {name:'LeftThrottle',description:'Driver\'s brake valve (Running 0.1 / 1st application 0.25 / Service continuous 0.3..0.75 / Full service 0.8 / Emergency 0.9; Release and Shutdown do not store). Plain: Running at the far end, Emergency nearest; 1st application on the 0.31 detent, Full service on the 0.84 FLX detent',assignments:[{type:'direct_control',controls:DB,input_value:{min:0.1,max:0.9,steps:[0.1,0.25,null,0.8,0.9],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.36,threshold_end:0.78,threshold_tolerance:0},{threshold:0.84,threshold_tolerance:0.045},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Power controller (Off 0 / 1 0.1 / 2 0.2 / 3 0.3 / 4 0.4, one gate per set / continuous 0.41..0.99 / Full 1). Plain: Off at the far end, full power nearest; Off raw 0, notches 1-4 at 0.12 / 0.22 / 0.31 (detent) / 0.40, continuous zone 0.46..0.955 (the 0.44 soft stop sits in the gap), Full 1',assignments:[{type:'direct_control',controls:TH,input_value:{min:0,max:1,steps:[0,0.1,0.2,0.3,0.4,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.045},{threshold:0.12,threshold_tolerance:0.035},{threshold:0.22,threshold_tolerance:0.035},{threshold:0.31,threshold_tolerance:0.04},{threshold:0.40,threshold_tolerance:0.03},{threshold:0.46,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'FlapLever',description:'Straight air (loco) brake, continuous 0..1, plain: released at the far end, full nearest',assignments:[{type:'direct_control',controls:SB,input_value:{min:0,max:1}}]},
 {name:'ParkingBrake',description:'Master key switch (lever, On 0.84) and cab change lever (the brake key, 0.71) in / out: the handles only store with both in',assignments:[momA(MK,1,0),momA(CC,1,0)]},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand',SAND,1,0),
 mom('RightThrottleButton','Engine start',EST,1,0),
 mom('LeftEngineOn','Horn | High',HORN,-1,0.5),
 mom('RightEngineOn','Horn | Low',HORN,1,0.5),
 {name:'RudderTrimLeft',description:'Handbrake | Apply (front)',assignments:[momA(HBF,1,1)]},
 {name:'RudderTrimRight',description:'Handbrake | Release (front)',assignments:[momA(HBF,0,0)]},
 mom('RoundAuxButton','Engine stop',ESP,1,0),
 tog('LeftAuxButton','AWS isolation (lit = Isolated 0 / unlit = Unisolated)',AWSI,0,1),
 tog('RightAuxButton','DSD circuit breaker (lit = on)',DSD,1,0),
 {name:'RotaryCrank',description:'Wipers one notch back (Run > Stop > Park)',assignments:[rel(WIP,-0.34)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on (Park > Stop > Run)',assignments:[rel(WIP,0.34)]},
 {name:'AutoBrake0',description:'Lights | All off',assignments:[set(RIL,0),set(TLL,0),set(TLR,0)]},
 {name:'AutoBrake1',description:'Lights | Route indicator (marker) lights',assignments:[set(RIL,1),set(TLL,0),set(TLR,0)]},
 {name:'AutoBrake2',description:'Lights | Tail lights only',assignments:[set(RIL,0),set(TLL,1),set(TLR,1)]},
 {name:'AutoBrake3',description:'Lights | Marker + tail lights',assignments:[set(RIL,1),set(TLL,1),set(TLR,1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const hlPos=[{short:'0',desc:'All off'},{short:'BTV',desc:'Markers'},{short:'LO',desc:'Tail only'},{short:'2',desc:'Marker + tail'},{short:'3',desc:'–'},{short:'HI',desc:'–'}];
const m={name:'tsw-class-31-dtg-thejag',title:'Class 31',eyebrow:'British Rail · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Tees Valley Line: Darlington – Saltburn',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-britishrail-navy.svg',alt:'British Rail'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-31-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Engine only','Reverse','Off'],start:1},
 leftThrottle:{name:'Train brake',continuous:true,notches:['Running','1st application',null,null,'Full service','Emergency'],start:4},
 rightThrottle:{name:'Power controller',continuous:true,notches:['Off','1','2','3','4',null,null,null,'Full'],start:0},
 flap:{name:'Loco brake',continuous:true,notches:['Release',null,null,null,'Full'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Lights',positions:hlPos,start:0},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DSD breaker'},
 modeSwitch:{name:'Wipers',left:'back',right:'on'}, roundAux:{name:'Engine stop'}, rudTrim:{name:'Handbrake on / off'},
 parkBrk:{name:'Master key + brake key',flat:'out',up:'in'}},
setup:['Master key and brake key in (PARK BRK up), battery on','Reverser to Engine only, start the engine (right throttle button)','AWS isolation light out, DSD breaker on','Marker lights on (AUTO BRK)','Release the handbrake (RUD TRIM right)','Train brake to Full service until the pipe is charged'],
depart:['Check the signal','Reverser to Forward','Loco brake to Release (flap lever away)','Train brake to Running, wait for the pipe to charge','Power controller notch by notch; the TCA walks one gate per send','Acknowledge AWS with the gear lever','Power controller to Off before moving the reverser back']};
fs.writeFileSync('tools/manual/trains/tsw-class-31-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
