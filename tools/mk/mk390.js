const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class390/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const steps=[-0.7615,-0.625,-0.5,-0.375,-0.25,-0.125,0,0.2311,0.5,0.75,0.9866];
if(th.length!==steps.length) throw new Error('171 thresholds do not fit');
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse / Neutral / Forward / Off)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.3333,0.6666,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle (B6 max brake / B5 / B4 / B3 / B2 / B1 / Off / P1 / P2 / P3 / P4 as the game stores them; Emergency at -1 is left out on purpose). Brake is pushed away on the desk, so the lever is plain; the eleven bands are the Class 171 ones (centred on the TCA detents).',assignments:[{type:'direct_control',controls:'PowerHandle',input_value:{min:-0.7615,max:0.9866,steps,step_thresholds:JSON.parse(JSON.stringify(th))}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','Sander',1,0),
 mom('RightThrottleButton','Pantograph up / traction reset','PanUpTractionReset',1,0),
 mom('LeftEngineOn','Horn | High','Horn',1,0.5),
 mom('RightEngineOn','Horn | Low','Horn',0,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Guard buzzer (signal bell)','SignalBellCab',1,0),
 tog('LeftAuxButton','AWS isolation (lit = Isolated / unlit = Normal)','AWS_Isolation',0,1),
 tog('RightAuxButton','Vigilance (DVD) isolation (lit = Isolated / unlit = Normal)','Vigilance_Isolation',0,1),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Int > Off)',assignments:[rel('WindscreenWiper',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Int > Slow > Fast)',assignments:[rel('WindscreenWiper',0.333)]},
 {name:'AutoBrake0',description:'Exterior lights | Off',assignments:[set('Exterior Lights',0)]},
 {name:'AutoBrake1',description:'Exterior lights | Day running',assignments:[set('Exterior Lights',0.25)]},
 {name:'AutoBrake2',description:'Exterior lights | Markers',assignments:[set('Exterior Lights',0.125)]},
 {name:'AutoBrake3',description:'Exterior lights | Night running',assignments:[set('Exterior Lights',0.375)]},
 {name:'AutoBrake4',description:'Exterior lights | Tail',assignments:[set('Exterior Lights',0.875)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.length+' classes');
const m={name:'tsw-class-390-dtg-thejag',title:'Class 390',eyebrow:'Avanti West Coast · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'West Coast Main Line: Birmingham – Crewe',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-avanti-navy.svg',alt:'Avanti West Coast'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],diagram:{file:'../../assets/class-390-side.png',source:'Drawing: WestRail642fan, Wikimedia Commons, CC BY-SA 4.0',clean:false},dlc:'store.steampowered.com/app/4680150',credit:'© TheJAG',cab:{file:'../../assets/class-390-dtg-cab.jpg',height:196,position:'50% 60%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Neutral','Reverse'],start:0},
 leftThrottle:{name:'Power / brake',notches:['B6','B5','B4','B3','B2','B1','Off','P1','P2','P3','P4'],start:0},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Pantograph up'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Exterior lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Markers'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DVD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Pantograph up (right throttle button), wait for line volts','Reverser to Neutral','Check AWS and DVD isolation lights are out','Exterior lights to Day','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard buzzer','Check the signal','Reverser to Forward','Handle from B6 through Off to P1','Notch up to P4 as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-390-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
