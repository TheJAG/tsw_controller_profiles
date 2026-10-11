const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_SEH_TL_Class700_01_DMOCB_C.json','utf8'));
const names=new Set(cap.controls.map(c=>c.name));
['PowerHandle','Reverser','MasterKey','Sanding','PowerSupply','WarningHorn','SignalBell_F','AWS/TPWSIsolation','DSDIsolation','WindscreenWiper','ExteriorLights'].forEach(n=>{if(!names.has(n))throw new Error('missing '+n)});
p.name='TSW | Class 700 | DTG | TheJAG';
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class700_\d\d_/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Direction switch (Reverse 0 / Neutral 0.49 / Forward 0.98), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:0.98,steps:[0,0.49,0.98],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle (Full service -0.81 / brake % continuous -0.78..-0.16 / Brake low -0.15 / Off 0 / Power min 0.15 / power % continuous 0.16..0.98 / Power max 0.99; Emergency at -1 is left out on purpose). BRAKE / E at the far end, POWER nearest the driver, so the lever is plain: full service raw 0 +-0.04, brake zone 0.05..0.42, brake low 0.45 +-0.025, Off 0.5 +-0.02, power min 0.55 +-0.025, power zone 0.58..0.955, power max 1 +-0.04',assignments:[{type:'direct_control',controls:'PowerHandle',input_value:{min:-0.81,max:0.99,steps:[-0.81,null,-0.15,0,0.15,null,0.99],step_thresholds:[{threshold:0,threshold_tolerance:0.04},{threshold:0.05,threshold_end:0.42,threshold_tolerance:0},{threshold:0.45,threshold_tolerance:0.025},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.55,threshold_tolerance:0.025},{threshold:0.58,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','Sanding',1,0),
 mom('RightThrottleButton','Power supply on (spring switch: 1 while held, rest 0.5)','PowerSupply',1,0.5),
 mom('LeftEngineOn','Horn | High','WarningHorn',1,0.5),
 mom('RightEngineOn','Horn | Low','WarningHorn',0,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Guard buzzer (signal bell)','SignalBell_F',1,0),
 tog('LeftAuxButton','AWS / TPWS isolation (lit = Isolated / unlit = Normal)','AWS/TPWSIsolation',0,1),
 tog('RightAuxButton','DSD isolation (lit = Isolated / unlit = Normal)','DSDIsolation',0,1),
 {name:'RotaryCrank',description:'Wipers one notch back (Fast > Slow > Interval > Off > Backup)',assignments:[rel('WindscreenWiper',-0.25)]},
 {name:'RotaryIgnStart',description:'Wipers one notch on (Backup > Off > Interval > Slow > Fast)',assignments:[rel('WindscreenWiper',0.25)]},
 {name:'AutoBrake0',description:'Exterior lights | Off',assignments:[set('ExteriorLights',0.25)]},
 {name:'AutoBrake1',description:'Exterior lights | Main',assignments:[set('ExteriorLights',1)]},
 {name:'AutoBrake2',description:'Exterior lights | Marker',assignments:[set('ExteriorLights',0.5)]},
 {name:'AutoBrake3',description:'Exterior lights | Dipped',assignments:[set('ExteriorLights',0.75)]},
 {name:'AutoBrake4',description:'Exterior lights | Tail',assignments:[set('ExteriorLights',0)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-700-dtg-thejag',title:'Class 700',eyebrow:'Thameslink · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Southeastern Highspeed',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-thameslink-navy.svg',alt:'Thameslink'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],diagram:{file:'../../assets/class-700-side.png',source:'Drawing: WestRail642fan, Wikimedia Commons, CC BY-SA 4.0',clean:false,fit:'clip'},dlc:'store.steampowered.com/app/4679380',credit:'© TheJAG',cab:{file:'../../assets/class-700-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Direction switch',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['Full service',null,'Brake low','Off','Power min',null,'Power max'],start:0},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Power supply on'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Exterior lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Main'},{short:'2',desc:'Marker'},{short:'3',desc:'Dipped'},{short:'HI',desc:'Tail'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS/TPWS isolation'}, rightAux:{name:'DSD isolation'},
 modeSwitch:{name:'Wipers',left:'back',right:'on'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK), battery on in the cab','Power supply on (right throttle button), wait for line volts','Direction switch to Neutral','Check AWS/TPWS and DSD isolation lights are out','Exterior lights to Main','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard buzzer','Check the signal','Direction switch to Forward','Handle from Full service through Off to Power min','Pull further into the power zone as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-700-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
