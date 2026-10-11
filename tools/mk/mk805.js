const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const cap=JSON.parse(fs.readFileSync('tools/captures/RVM_AABS_AWC_Class805_01_DPTS_C.json','utf8'));
const names=new Set(cap.controls.map(c=>c.name));
const byId=(id,re)=>{const n=cap.controls.find(c=>c.identifier===id&&(!re||re.test(c.name)));if(!n)throw new Error('no node with identifier '+id);return n.name;};
const need=n=>{if(!names.has(n))throw new Error('missing node '+n);return n;};
const K='MasterKey(SimpleLever)',R='Reverser(IrregularLever)',H='PowerHandle(IrregularLever)';[K,R,H].forEach(need);
const HORN=byId('Horn'),SAND=byId('Sand'),PAN=byId('Pantograph',/Up/),BUZ=byId('Bell'),AWSI=byId('AWS_TPWS_Isolation'),DVDI=byId('DVD_Isolation'),WIP=byId('Wipers',/Speed/),HL=byId('Headlights');
const hi=cap.levers[HORN]||{}; const hMin=hi.minInput!=null?hi.minInput:0,hMax=hi.maxInput!=null?hi.maxInput:1,hRest=hi.defaultInput!=null?hi.defaultInput:0.5;
const wi=cap.levers[WIP]||{}; console.log({HORN,hMin,hMax,hRest,SAND,PAN,BUZ,AWSI,DVDI,WIP,wipNotches:(wi.notches||[]).map(x=>(x.name||'#')+'@'+x.snapped),HL,hl:(cap.levers[HL].notches||[]).map(x=>(x.name||'#')+'@'+x.snapped)});
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Class805/.test(n)&&!/Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse / Neutral / Forward / Off)',assignments:[{type:'direct_control',controls:R,input_value:{min:0,max:1,steps:[0,0.3333,0.6666,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle (Max brake -0.9 / brake % continuous -0.89..-0.26 / Min brake -0.25 / Off 0 / P1 0.25 / P2 0.5 / P3 0.75 / P4 1 (stored k/4, bands 0.56 ±0.03, 0.68 ±0.06 on the CL detent, 0.84 ±0.06 on FLX, 1 ±0.04); Emergency at -1 is left out on purpose). Power is pulled towards the driver (scale MAX / MIN / 1 / 2 / 3 / 4 from the far end), so the lever is plain: max brake raw 0 ±0.04, brake zone 0.05..0.42, min brake 0.45 ±0.025, Off 0.5 ±0.02, power 1 0.55 ±0.025, power zone 0.58..0.955, full 1 ±0.04',assignments:[{type:'direct_control',controls:H,input_value:{min:-0.9,max:1,steps:[-0.9,null,-0.25,0,0.25,0.5,0.75,1],step_thresholds:[{threshold:0,threshold_tolerance:0.04},{threshold:0.05,threshold_end:0.42,threshold_tolerance:0},{threshold:0.45,threshold_tolerance:0.025},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.56,threshold_tolerance:0.03},{threshold:0.68,threshold_tolerance:0.06},{threshold:0.84,threshold_tolerance:0.06},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master key in / out',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:K,value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:K,value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand',SAND,1,0),
 mom('RightThrottleButton','Pantograph up',PAN,1,0),
 mom('LeftEngineOn','Horn | High',HORN,hMax,hRest),
 mom('RightEngineOn','Horn | Low',HORN,hMin,hRest),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Guard buzzer (door buzzer)',BUZ,1,0),
 tog('LeftAuxButton','TPWS / AWS isolation (lit = Isolated / unlit = Normal)',AWSI,0,1),
 tog('RightAuxButton','Vigilance (DVD) isolation (lit = Isolated / unlit = Normal)',DVDI,0,1),
 {name:'RotaryCrank',description:'Wipers one notch slower (60 > 40 > 25 > 10 > 5 > Off)',assignments:[rel(WIP,-0.2)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Off > 5 > 10 > 25 > 40 > 60)',assignments:[rel(WIP,0.2)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set(HL,0)]},
 {name:'AutoBrake1',description:'Headlights | Full',assignments:[set(HL,0.35)]},
 {name:'AutoBrake2',description:'Headlights | Marker',assignments:[set(HL,0.65)]},
 {name:'AutoBrake3',description:'Headlights | Dimmed',assignments:[set(HL,0.15)]},
 {name:'AutoBrake4',description:'Headlights | Tail',assignments:[set(HL,0.85)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-class-805-dtg-thejag',title:'Class 805',eyebrow:'Avanti West Coast · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'WCML: Crewe – Milton Keynes',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-avanti-navy.svg',alt:'Avanti West Coast'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],diagram:{file:'../../assets/class-805-side.png',source:'Drawing: WestRail642fan, Wikimedia Commons, CC BY-SA 4.0',clean:false},dlc:'store.steampowered.com/app/4680560',credit:'© TheJAG',cab:{file:'../../assets/class-805-dtg-cab.jpg',height:196,position:'50% 55%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Neutral','Reverse'],start:0},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['Max brake',null,'Min brake','Off','P1','P2','P3','P4'],start:0},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Pantograph up'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Full'},{short:'2',desc:'Marker'},{short:'3',desc:'Dimmed'},{short:'HI',desc:'Tail'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'TPWS/AWS isolation'}, rightAux:{name:'DVD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Pantograph up (right throttle button), wait for line volts','Reverser to Neutral','Check TPWS/AWS and DVD isolation lights are out','Headlights to Full','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard buzzer','Check the signal','Reverser to Forward','Handle from Max brake through Off to P1','Pull further to P2, P3 and P4 as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-805-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
