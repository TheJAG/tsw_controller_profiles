const fs=require('fs');
const f=process.argv[2];
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_RIV_XC_Class220_DMF','RVM_RIV_XC_Class220_DMSL','RVM_RIV_XC_Class220_MSA','RVM_RIV_XC_Class220_MSB'].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const rel=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,relative:true,hold:false,enable_api_fallback:true}});
const HL='Head/MarkerLights';
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse / Neutral / Forward / Off; it only moves while the handle is in Emergency)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.333,0.666,1],invert:true}}]},
 {name:'LeftThrottle',description:'Power / brake handle (Emergency -1 / Max brake -0.75 / brake % continuous / Min brake -0.2 / Off 0 / Power 1 0.25 / power continuous 0.26..1). Emergency is kept on this unit because the reverser is interlocked with it: narrow band at the far end.',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:-1,max:1,steps:[-1,-0.75,null,-0.2,0,0.25,null,1],step_thresholds:[{threshold:0,threshold_tolerance:0.02},{threshold:0.08,threshold_tolerance:0.04},{threshold:0.14,threshold_end:0.42,threshold_tolerance:0},{threshold:0.45,threshold_tolerance:0.025},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.55,threshold_tolerance:0.025},{threshold:0.58,threshold_end:0.955,threshold_tolerance:0},{threshold:1,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Master key on / off',assignment:{type:'momentary',threshold:0.9,action_activate:{controls:'MasterKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'MasterKey',value:0,hold:false,enable_api_fallback:true}}},
 key('GearLever','AWS reset','Q'),
 mom('LeftThrottleButton','Sand','Sander',1,0),
 mom('RightThrottleButton','Engine start','EngineStart',1,0),
 mom('LeftEngineOn','Horn | High','Horn_L',1,0),
 mom('RightEngineOn','Horn | Low','Horn_L',-1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','Guard buzzer (cab signal)','CabSignalBuzzer',1,0),
 tog('LeftAuxButton','AWS isolation (lit = Isolated / unlit = Normal)','AWS_Isolation',1,0),
 tog('RightAuxButton','Vigilance (DVD) isolation (lit = Isolated / unlit = Normal)','VigilanceIsolation',1,0),
 {name:'RotaryCrank',description:'Wipers one notch slower (Fast > Slow > Off > Intermittent)',assignments:[rel('WindscreenWiper',-0.333)]},
 {name:'RotaryIgnStart',description:'Wipers one notch faster (Intermittent > Off > Slow > Fast)',assignments:[rel('WindscreenWiper',0.333)]},
 {name:'AutoBrake0',description:'Headlights | Off',assignments:[set(HL,0)]},
 {name:'AutoBrake1',description:'Headlights | Day',assignments:[set(HL,0.25)]},
 {name:'AutoBrake2',description:'Headlights | Markers',assignments:[set(HL,0.125)]},
 {name:'AutoBrake3',description:'Headlights | Night',assignments:[set(HL,0.375)]},
 {name:'AutoBrake4',description:'Headlights | Tail',assignments:[set(HL,0.875)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.controls.map(c=>c.name+' :: '+c.description.slice(0,70)).join('\n'));
const m={name:'tsw-class-220-rivet-thejag',title:'Class 220',eyebrow:'CrossCountry · Rivet Games · TCA Quadrant Airbus',profileName:p.name,developer:'Rivet Games',route:'Riviera Line: Exeter – Plymouth & Paignton',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-crosscountry-navy.svg',alt:'CrossCountry'},{file:'../../assets/logo-rivet-navy.png',alt:'Rivet Games'}],diagram:{file:'../../assets/class-220-side.png',source:'Drawing: FuSSionZ, Wikimedia Commons, CC BY-SA 3.0'},dlc:'store.steampowered.com/app/4680370',credit:'© TheJAG',cab:{file:'../../assets/class-220-rivet-cab.jpg',height:196,position:'50% 65%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Neutral','Reverse'],start:0},
 leftThrottle:{name:'Power / brake',continuous:true,notches:['Emergency','Max brake',null,'Min brake','Off','Power 1',null,'Full power'],start:1},
 rightThrottle:null, flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Markers'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'AWS isolation'}, rightAux:{name:'DVD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'off',up:'on'}},
setup:['Master key on (PARK BRK)','Start engines (right throttle button)','Handle to Emergency, then reverser to Neutral (the reverser only moves with the handle in Emergency)','Handle back to Max brake','Check AWS and DVD isolation lights are out','Headlights to Day, open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard buzzer','Check the signal','Handle to Emergency, reverser to Forward, handle back to Max brake','Handle through Off to Power 1','Open up through the power zone as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-220-rivet-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
