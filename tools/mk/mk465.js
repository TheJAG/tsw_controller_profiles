const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class465/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const HL='Headlights',TL='TailLights';
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse / Neutral / Forward / Off)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:-0.5,max:1,steps:[-0.5,0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle (Emergency / B3 / B2 / B1 / Off / P1 / P2 / P3 / P4), plain: Emergency at the far end, P4 nearest the driver as on the 333',assignments:[{type:'direct_control',controls:'PowerHandle',input_value:{min:-1,max:1,steps:[-1,-0.6,-0.4,-0.2,0,0.25,0.5,0.75,1]}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','Sand',1,0),
 mom('LeftEngineOn','Horn | High','Horn',1,0),
 mom('RightEngineOn','Horn | Low','Horn',-1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Guard buzzer (signal bell)','SignalBell',1,0),
 tog('LeftAuxButton','AWS / TPWS isolation (lit = Isolated / unlit = Normal)','AWS/TPWS_Isolation',1,0),
 tog('RightAuxButton','Vigilance isolation (lit = Isolated / unlit = Normal)','VigilanceIsolation',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Intermittent > Off)',assignments:[rel('WiperModeSelection',-0.3)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > Intermittent > Slow > Fast)',assignments:[rel('WiperModeSelection',0.3)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set(HL,0),set(TL,0)]},
 {name:'AutoBrake1',description:'Headlights | Day running',assignments:[set(HL,0.5),set(TL,0)]},
 {name:'AutoBrake2',description:'Headlights | Marker lights only',assignments:[set(HL,-1),set(TL,0)]},
 {name:'AutoBrake3',description:'Headlights | Night running',assignments:[set(HL,-0.5),set(TL,0)]},
 {name:'AutoBrake4',description:'Headlights | Tail lights',assignments:[set(HL,0),set(TL,1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-465-dtg-thejag',title:'Class 465',eyebrow:'Southeastern · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Southeastern Highspeed: London St Pancras – Ashford Intl & Faversham',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-southeastern-navy.png',alt:'Southeastern'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],diagram:{file:'../../assets/class-465-side.png',source:'Drawing: WestRail642fan, Wikimedia Commons, CC BY-SA 4.0',clean:false},dlc:'store.steampowered.com/app/4679380',credit:'© TheJAG',cab:{file:'../../assets/class-465-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Neutral','Reverse'],start:0},
 leftThrottle:{name:'Power / brake',notches:['Emergency','B3','B2','B1','Off','P1','P2','P3','P4'],start:1},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:null, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Marker only'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS/TPWS isolation'}, rightAux:{name:'Vigilance isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Reverser to Neutral','Check AWS/TPWS and vigilance isolation lights are out','Headlights to Day','Open doors (RUD TRIM)','Handle at B3'],
depart:['Close doors, wait for the guard buzzer','Check the signal','Reverser to Forward','Handle from B3 through Off to P1','Notch up to P4 as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-465-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
