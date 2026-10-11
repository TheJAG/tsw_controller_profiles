const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class331/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse / Neutral / Forward)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle, continuous (Max brake -0.95 / brake % / Coast 0 / power % / Full 1; Emergency at -1 is left out on purpose). Max brake nearest the driver as on the desk, so the lever is inverted; SNG geometry: max brake raw 1 ±0.04, brake zone 0.955..0.54, coast 0.5 ±0.02, power zone 0.46..0.045, full 0 ±0.04',assignments:[{type:'direct_control',controls:'PowerBrakeController',input_value:{min:-0.95,max:1,steps:[-0.95,null,0,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.54,threshold_tolerance:0},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.46,threshold_end:0.045,threshold_tolerance:0},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','Sanding',1,0),
 mom('RightThrottleButton','Pantograph up','PantographUp',1,0),
 mom('LeftEngineOn','Horn | High','Horn',1,0.5),
 mom('RightEngineOn','Horn | Low','Horn',0,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Guard buzzer (driver signal buzzer)','DriverSignalBuzzer',1,0),
 tog('LeftAuxButton','TPWS / AWS isolation (lit = Isolated / unlit = Normal)','TPWSAWS_Isolation',1,0),
 tog('RightAuxButton','Vigilance (DVD) isolation (lit = Isolated / unlit = Normal)','VigilanceIsolation',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Intermittent > Off)',assignments:[rel('WindscreenWiper',-0.33)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Intermittent > Slow > Fast)',assignments:[rel('WindscreenWiper',0.33)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set('Headlights',0.25)]},
 {name:'AutoBrake1',description:'Headlights | Day head & marker',assignments:[set('Headlights',0.75)]},
 {name:'AutoBrake2',description:'Headlights | Marker only',assignments:[set('Headlights',0.5)]},
 {name:'AutoBrake3',description:'Headlights | Night head & marker',assignments:[set('Headlights',1)]},
 {name:'AutoBrake4',description:'Headlights | Tail lights',assignments:[set('Headlights',0)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-331-dtg-thejag',title:'Class 331',eyebrow:'Northern · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Airedale & Wharfedale Lines',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-northern-navy.png',alt:'Northern'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],diagram:{file:'../../assets/class-331-side.png',source:'Drawing: WestRail642fan, Wikimedia Commons, CC BY-SA 4.0',clean:false},dlc:'store.steampowered.com/app/4714890',credit:'© TheJAG',cab:{file:'../../assets/class-331-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['Full power',null,null,'Coast',null,null,'Max brake'],start:6},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Pantograph up'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Marker only'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail only'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'TPWS/AWS isolation'}, rightAux:{name:'DVD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Pantograph up (right throttle button), wait for line volts','Reverser to Neutral','Check TPWS/AWS and DVD isolation lights are out','Headlights to Day','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard buzzer','Check the signal','Reverser to Forward','Handle from Max brake up to Coast','Push into the power zone, more as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-331-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
