const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_LNWR_Class350-1_DMS2_C.json','utf8'));
const byId=(id,re)=>{const n=cap.controls.find(c=>c.identifier===id&&(!re||re.test(c.name)));if(!n)throw new Error('no node with identifier '+id);return n.name;};
const WIP=byId('Wipers',/Lever/);
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class350/.test(n)&&!/Base$/.test(n)&&!/_DM$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const HL='IrregularLever_Headlights',TL='PushButton_TailLights';
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse / Neutral / Forward / Off)',assignments:[{type:'direct_control',controls:'IrregularLever_Reverser',input_value:{min:0,max:1,steps:[0,0.33,0.66,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle (Max brake 0.03 / brake % 0.06..0.45 / Min brake 0.46 / Off 0.5 / first power 0.53 / power % / full 1; Emergency at -0.1 is left out on purpose). Power is nearest the driver on the desk, so the lever is plain; BR 440 geometry mirrored: max brake raw 0 ±0.04, brake zone 0.05..0.42, min brake 0.45 ±0.03, Off 0.5 ±0.02, first power 0.55 ±0.03, power zone 0.58..0.955, full 1 ±0.04',assignments:[{type:'direct_control',controls:'IrregularLever_ThrottleBrake',input_value:{min:0.03,max:1,steps:[0.03,null,0.46,0.5,0.53,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.04},{threshold:0.05,threshold_end:0.42,threshold_tolerance:0},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.58,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','PushButton_Sand',1,0),
 tog('RightThrottleButton','Pantograph (lit = up / unlit = down)','PushButton_Pantograph',1,0),
 mom('LeftEngineOn','Horn | High','IrregularLever_Horn',1,0),
 mom('RightEngineOn','Horn | Low','IrregularLever_Horn',-1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Guard buzzer (cab signal)','PushButton_Cab_Signal_L',1,0),
 tog('LeftAuxButton','TPWS / AWS isolation (lit = Isolated / unlit = Normal)','IrregularLever_TPWS_AWS_Isolation',1,0),
 tog('RightAuxButton','DVD (vigilance) isolation (lit = Isolated / unlit = Normal)','IrregularLever_DVDIsolation',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Quick > Slow > Off > Interval)',assignments:[rel(WIP,-0.33)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Interval > Off > Slow > Quick)',assignments:[rel(WIP,0.33)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set(HL,0.4),set(TL,0)]},
 {name:'AutoBrake1',description:'Headlights | Day',assignments:[set(HL,0.8),set(TL,0)]},
 {name:'AutoBrake2',description:'Headlights | Marker only',assignments:[set(HL,0.6),set(TL,0)]},
 {name:'AutoBrake3',description:'Headlights | Night',assignments:[set(HL,1),set(TL,0)]},
 {name:'AutoBrake4',description:'Headlights | Tail lights',assignments:[set(HL,0.4),set(TL,1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log('wipers node',WIP); console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-350-dtg-thejag',title:'Class 350',eyebrow:'London Northwestern Railway · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'West Coast Main Line: Birmingham – Crewe',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-lnwr-navy.png',alt:'London Northwestern Railway'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],diagram:{file:'../../assets/class-350-side.png',source:'Drawing: Adam Bryant, Wikimedia Commons, CC BY-SA 4.0'},dlc:'store.steampowered.com/app/4680550',credit:'© TheJAG',cab:{file:'../../assets/class-350-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Neutral','Reverse'],start:0},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['Max brake',null,'Min brake','Off','Power',null,'Full power'],start:0},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Pantograph up / down'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Marker only'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail only'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'TPWS/AWS isolation'}, rightAux:{name:'DVD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Pantograph up (right throttle button), wait for line volts','Reverser to Neutral','Check TPWS/AWS and DVD isolation lights are out','Headlights to Day','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard buzzer','Check the signal','Reverser to Forward','Handle from Max brake through Off to the first power step','Pull further into the power zone as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-350-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
