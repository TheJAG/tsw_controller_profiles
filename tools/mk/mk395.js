const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_SEH_SE_Class395_DPT2_C.json','utf8'));
const names=new Set(cap.controls.map(c=>c.name));
const byId=(id,re)=>{const n=cap.controls.find(c=>c.identifier===id&&(!re||re.test(c.name)));if(!n)throw new Error('no node with identifier '+id);return n.name;};
const need=n=>{if(!names.has(n))throw new Error('missing node '+n);return n;};
const HORN=byId('Horn'),WIP=byId('Wipers',/Speed/),HL=byId('Headlights'),AWSI=byId('SignallingSystems',/Isolat/),DSDI=byId('WarningDevices'),SAND=byId('Sand'),PAN=byId('Pantograph'),KEY=byId('MasterSwitch',/^MasterKey$/),REV=byId('Reverser'),HAN=byId('Throttle');
const BUZ=(cap.controls.find(c=>/^Signal$/.test(c.name))||cap.controls.find(c=>/Signal/.test(c.name)&&c.identifier==='None')||{name:byId('Bell')}).name;
const hornInfo=cap.levers[HORN]; const hornRest=hornInfo&&hornInfo.defaultInput!=null?hornInfo.defaultInput:0.5; const hornMin=hornInfo?hornInfo.minInput:0, hornMax=hornInfo?hornInfo.maxInput:1;
console.log({HORN,hornRest,hornMin,hornMax,WIP,HL,AWSI,DSDI,SAND,PAN,KEY,REV,HAN,BUZ});
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class395/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse / Neutral / Forward / Off)',assignments:[{type:'direct_control',controls:REV,input_value:{min:0,max:1,steps:[0,0.3333,0.6666,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle (Max brake -0.9 / brake % continuous -0.89..-0.26 / Min brake -0.25 / Off 0 / P1 0.231 / P2 0.484 / P3 0.729 / P4 0.993; Emergency at -1 is left out on purpose). Brake is nearest the driver on the desk, so the lever is inverted: max brake raw 1 ±0.04, brake zone 0.955..0.62, min brake 0.58 ±0.03, Off 0.5 ±0.025, P1 0.44 ±0.03, P2 0.31 ±0.035, P3 0.15 ±0.05, P4 0 ±0.05',assignments:[{type:'direct_control',controls:HAN,input_value:{min:-0.9,max:0.9928,steps:[-0.9,null,-0.25,0,0.2312,0.484,0.7288,0.9928],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.04},{threshold:0.955,threshold_end:0.62,threshold_tolerance:0},{threshold:0.58,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.025},{threshold:0.44,threshold_tolerance:0.03},{threshold:0.31,threshold_tolerance:0.035},{threshold:0.15,threshold_tolerance:0.05},{threshold:0,threshold_tolerance:0.05}]}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:KEY,value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:KEY,value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand',SAND,1,0),
 mom('RightThrottleButton','Pantograph up / shoes down',PAN,1,0),
 mom('LeftEngineOn','Horn | High',HORN,hornMax,hornRest),
 mom('RightEngineOn','Horn | Low',HORN,hornMin,hornRest),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Guard buzzer (signal)',BUZ,1,0),
 tog('LeftAuxButton','AWS / TPWS isolation (lit = Isolated / unlit = Normal)',AWSI,0,1),
 tog('RightAuxButton','DSD isolation (lit = Isolated / unlit = Normal)',DSDI,0,1),
 {name:'RotaryCrank',description:'Wipers one notch slower (60 > 40 > 10 > Off)',assignments:[rel(WIP,-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > 10 > 40 > 60)',assignments:[rel(WIP,0.333)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set(HL,0)]},
 {name:'AutoBrake1',description:'Headlights | Day running',assignments:[set(HL,0.25)]},
 {name:'AutoBrake2',description:'Headlights | Marker',assignments:[set(HL,0.125)]},
 {name:'AutoBrake3',description:'Headlights | Night running',assignments:[set(HL,0.375)]},
 {name:'AutoBrake4',description:'Headlights | Tail',assignments:[set(HL,0.875)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-395-dtg-thejag',title:'Class 395',eyebrow:'Southeastern · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Southeastern Highspeed: London St Pancras – Ashford Intl & Faversham',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-southeastern-navy.png',alt:'Southeastern'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],diagram:{file:'../../assets/class-395-side.png',source:'Drawing: WestRail642fan, Wikimedia Commons, CC BY-SA 4.0',clean:false},dlc:'store.steampowered.com/app/4679380',credit:'© TheJAG',cab:{file:'../../assets/class-395-dtg-cab.jpg',height:196,position:'50% 55%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Neutral','Reverse'],start:0},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['P4','P3','P2','P1','Off','Min brake',null,'Max brake'],start:7},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Pan up / shoes down'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Marker'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS/TPWS isolation'}, rightAux:{name:'DSD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Pantograph up / shoes down (right throttle button), AC or DC as the line needs','Reverser to Neutral','Check AWS/TPWS and DSD isolation lights are out','Headlights to Day','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard buzzer','Check the signal','Reverser to Forward','Handle from Max brake through Off to P1','Push on to P4 as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-395-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
