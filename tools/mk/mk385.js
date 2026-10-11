// BR Class 385 (Rivet Games, Hitachi AT200, ScotRail Express: Edinburgh – Glasgow). Older DTG-style UK unit nodes with
// bracketed type suffixes: Throttle (Irregular Lever) is the combined handle -1..1 (Emergency -1 / MAX -0.75 / brake
// zone -0.74..-0.13 / Off 0 / T-1..T-4 at k/4), Reverser (Irregular Lever) -1..2 (R / N / F / Off), MasterKey a push
// button, AWS_Reset / DSD_Pedal / Sanding push buttons, isolation levers DRAIS / AWSIS / TPFIS / DSDID (Cut-In 0 /
// Cut-Out ~0.91), HeadlightSwitch -1..1 (Full / Off / Marker / Tail / Off). A hidden TrainBrake node is not assigned.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679610';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class385/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));p.name='TSW | Class 385 | Rivet | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const R='Reverser (Irregular Lever)',H='Throttle (Irregular Lever)',K='MasterKey (Toggle Button)',HORN='WarningHorn (IrregularLever)',WIP='Wipers (Irregular Lever)',HL='HeadlightSwitch (Irregular Lever)';
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse -1 / Neutral -0.27 / Forward 0.75 / Off 1.76), inverted: Off at the far end',assignments:[{type:'direct_control',controls:R,input_value:{min:-1,max:1.7553,steps:[-1,-0.2738,0.7545,1.7553],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle (MAX brake -0.75 / brake continuous -0.74..-0.13 / Off 0 / T-1 0.25 / T-2 0.5 / T-3 0.75 / T-4 1; Emergency at -1 is left out on purpose). Power is pulled towards the driver (scale Brake / MAX / MIN / Power from the far end), so the lever is plain: MAX raw 0 +-0.04, brake zone 0.05..0.42, Off 0.5 +-0.03, T-1 0.56 +-0.03, T-2 0.68 +-0.06 on the CL detent, T-3 0.84 +-0.06 on FLX, T-4 1 +-0.04 (the Class 805 bands)',assignments:[{type:'direct_control',controls:H,input_value:{min:-0.75,max:1,steps:[-0.75,null,0,0.25,0.5,0.75,1],step_thresholds:[{threshold:0,threshold_tolerance:0.04},{threshold:0.05,threshold_end:0.42,threshold_tolerance:0},{threshold:0.5,threshold_tolerance:0.03},{threshold:0.56,threshold_tolerance:0.03},{threshold:0.68,threshold_tolerance:0.06},{threshold:0.84,threshold_tolerance:0.06},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master key in / out (push button)',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:K,value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:K,value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','Sanding (PushButton)',1,0),
 mom('RightThrottleButton','Pantograph up','PantographUp (PushButton)',1,0),
 mom('LeftEngineOn','Horn | High',HORN,1,0),
 mom('RightEngineOn','Horn | Low',HORN,-1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('RoundAuxButton','DRA set (lit) / reset','DRA (Toggle Button)',1,0),
 tog('LeftAuxButton','AWS isolation lever (lit = Cut-Out / unlit = Cut-In)','AWSIS (Lever)',1,0),
 tog('RightAuxButton','DSD (vigilance) isolation lever (lit = Cut-Out / unlit = Cut-In)','DSDID (Lever)',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Int > Off)',assignments:[rel(WIP,-0.31)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Int > Slow > Fast)',assignments:[rel(WIP,0.31)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set(HL,-0.6776)]},
 {name:'AutoBrake1',description:'Headlights | Full',assignments:[set(HL,-1)]},
 {name:'AutoBrake2',description:'Headlights | Marker',assignments:[set(HL,-0.3437)]},
 {name:'AutoBrake3',description:'Headlights | Tail',assignments:[set(HL,0.1639)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-385-rivet-thejag',title:'Class 385',eyebrow:'ScotRail · Rivet Games · TCA Quadrant Airbus',profileName:p.name,developer:'Rivet Games',route:'ScotRail Express: Edinburgh – Glasgow',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-scotrail-navy.svg',alt:'ScotRail'},{file:'../../assets/logo-rivet-navy.png',alt:'Rivet Games'}],dlc,credit:'© TheJAG',
diagram:{file:'../../assets/class-385-side.png',source:'Drawing: WestRail642fan, Wikimedia Commons, CC BY-SA 4.0',clean:false},
cab:{file:'../../assets/class-385-rivet-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Neutral','Reverse'],start:0},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['MAX brake',null,'Off','T-1','T-2','T-3','T-4'],start:0},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Pantograph up'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Full'},{short:'2',desc:'Marker'},{short:'3',desc:'Tail'},{short:'HI',desc:'–'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DSD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'DRA'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Pantograph up (right throttle button), wait for line volts','Reverser to Neutral','Check the AWS and DSD isolation lights are out','Headlights to Full','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the interlock light','Check the signal, DRA off (round aux)','Reverser to Forward','Handle from MAX brake through Off to T-1','Pull further to T-2, T-3 and T-4 as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-385-rivet-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
