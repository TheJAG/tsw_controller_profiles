// BR Class 380 (DTG, Siemens Desiro UK, ScotRail, Cathcart Circle). Its own GCC node set: PowerHandle 0..1 (Emergency
// 0.02..0.04, Maximum braking 0.1, brake continuous 0.11..0.49, Off 0.5, power continuous 0.51..1, no snap gates),
// DirectionSwitch -1 / 0 / 1, MasterKey lever, isolation levers 0 = Isolated / 1 = Normal, ExteriorLights rotary.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680110';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class380/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));p.name='TSW | Class 380 | DTG | TheJAG';
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const HL='ExteriorLights';
p.controls=[
 {name:'SpeedbrakeLever',description:'Direction switch (Reverse -1 / Neutral 0 / Forward 1), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'DirectionSwitch',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle (Maximum braking 0.1 / brake continuous 0.11..0.49 / Off 0.5 / power continuous 0.51..1; Emergency at 0.02..0.04 is left out on purpose). Power is pulled towards the driver, so the lever is plain: Max brake raw 0 +-0.04, brake zone 0.05..0.46, Off 0.5 +-0.03, power zone 0.54..0.955, full power 1 +-0.04',assignments:[{type:'direct_control',controls:'PowerHandle',input_value:{min:0.1,max:1,steps:[0.1,null,0.5,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.04},{threshold:0.05,threshold_end:0.46,threshold_tolerance:0},{threshold:0.5,threshold_tolerance:0.03},{threshold:0.54,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','Sanding',1,0),
 mom('RightThrottleButton','Pantograph / VCB (push button)','PantographVCB',1,0),
 mom('LeftEngineOn','Horn | High','Horn_L',1,0),
 mom('RightEngineOn','Horn | Low','Horn_L',-1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Guard signal bell','SignalBell_L',1,0),
 tog('LeftAuxButton','TPWS / AWS isolation lever (lit = Isolated / unlit = Normal; a service starts Isolated)','TPWS_AWS_Isolation',0,1),
 tog('RightAuxButton','Vigilance (DVD) isolation lever (lit = Isolated / unlit = Normal; a service starts Isolated)','Vigilance_Isolation',0,1),
 {name:'RotaryCrank',description:'Wipers one notch slower (Quick > Slow > Off > Interval)',assignments:[rel('Wipers',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Interval > Off > Slow > Quick)',assignments:[rel('Wipers',0.333)]},
 {name:'AutoBrake0',description:'Exterior lights | Off',assignments:[set(HL,0.25)]},
 {name:'AutoBrake1',description:'Exterior lights | Day',assignments:[set(HL,0.75)]},
 {name:'AutoBrake2',description:'Exterior lights | Marker only',assignments:[set(HL,0.5)]},
 {name:'AutoBrake3',description:'Exterior lights | Night',assignments:[set(HL,1)]},
 {name:'AutoBrake4',description:'Exterior lights | Tail lights',assignments:[set(HL,0)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-380-dtg-thejag',title:'Class 380',eyebrow:'ScotRail · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Cathcart Circle Line: Glasgow – Neilston & Newton',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-scotrail-navy.svg',alt:'ScotRail'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',
diagram:{file:'../../assets/class-380-side.png',source:'Drawing: WestRail642fan, Wikimedia Commons, CC BY-SA 4.0',clean:false},
cab:{file:'../../assets/class-380-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Direction switch',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['Max brake',null,null,'Off',null,null,'Full power'],start:0},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Pantograph / VCB'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Exterior lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Marker only'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail only'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'TPWS/AWS isolation'}, rightAux:{name:'DVD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Guard bell'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Pantograph up (right throttle button), wait for line volts','Direction switch to Neutral','TPWS/AWS and DVD isolation off (aux squares): a service starts with both isolated','Exterior lights to Day','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard bell','Check the signal, DRA off','Direction switch to Forward','Handle from Max brake through Off into power','Pull further as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-380-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
