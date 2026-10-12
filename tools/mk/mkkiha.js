// JR East KiHa 40 (DTG, Tadami Line), 2026-10-12. Own layout. Two cabs `_F` / `_B`, both GetActiveCab functions fail, F cab wired by name.
// The desk loads with every removable handle REMOVED: the plug push buttons Handle_Master_Active_F(Toggle), Handle_Brake_Active_F(Toggle),
// Handle_Engine_Active_F(Toggle), Handle_Gear_Active_F(Toggle) (Removed 0 / Plugged 1) must be set to 1 first (they set the Enabler_*
// SimpleLevers to 1), then Handle_MasterKey_F(Lever) Activated 1. API probe with the handles plugged: Handle_Brake_F(Lever) (ME23 valve,
// AutomaticBrake) Release 0 / Holding 0.25 / Handle Off 0.5 / Lap 0.75 / Apply 1 / Emergency 1.5 (sets 1.25+ give 1.5); Handle_Regulator_F
// (Throttle) Idle 0 .. P5 5 in integer notches; Handle_GearLever_F (Gear) Hydraulic -1 / Neutral 0 / Direct 1; Handle_EngineStart_F
// Handle Off 0 / Preheat 1 / Start 2 (rests at 1 once running); Handle_Reverser_F Backward -1 / Neutral 0 / Forward 1. ATS acknowledge
// CB_ATSAcknowledge_F(Push) (AWS_Reset), ATS power CB_ATSPower_F(Toggle) (AWS_Isolation), EB reset CB_EBReset_F(Push) (Alerter),
// CB_Horn_F(Push), CB_HeadLight_F(Toggle) + CB_HeadLightDim_F(Toggle) (Bright 0 / Dimmed 1), CB_GaugeLight_F, CB_CabLight_F, wiper
// CL_WiperD_F(Lever) 0 / 0.05. Doors are push buttons per side (keys y / u used).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680530';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=['RVM_UWS_Kiha40-500_Base']; // the only KiHa class in the Tadami pak (whole-file grep 2026-10-12); the pak list's bare RVM_UWS_Kiha40 is a truncated hit
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,dim,g,c)=>[set('CB_HeadLight_F(Toggle)',h),set('CB_HeadLightDim_F(Toggle)',dim),set('CB_GaugeLight_F(Toggle)',g),set('CB_CabLight_F(Toggle)',c)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser Handle_Reverser_F(Lever) (Backward -1 / Neutral 0 / Forward 1; the zones take any value), inverted: Forward at the far end. Needs the handles plugged and the master key on (PARK BRK up)',assignments:[{type:'direct_control',controls:'Handle_Reverser_F(Lever)',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'LeftThrottle',description:'Throttle Handle_Regulator_F(Lever) Idle 0 .. P5 5 (integer notches, ±0.5 bands), plain as the Class 153: pulled towards you to notch up, Idle at the far end',assignments:[{type:'direct_control',controls:'Handle_Regulator_F(Lever)',input_value:{min:0,max:5,steps:[0,1,2,3,4,5]}}]},
 {name:'RightThrottle',description:'ME23 brake valve Handle_Brake_F(Lever) Release 0 / Holding 0.25 / Handle Off 0.5 / Lap 0.75 / Apply 1 / Emergency 1.5, inverted as the Class 153 brake: Emergency at the far end, Release nearest',assignments:[{type:'direct_control',controls:'Handle_Brake_F(Lever)',input_value:{min:0,max:1.5,steps:[0,0.25,0.5,0.75,1,1.5],invert:true}}]},
 {name:'FlapLever',description:'Gear lever Handle_GearLever_F(Lever) Hydraulic -1 / Neutral 0 / Direct 1, inverted: Direct drive at the far end, Hydraulic nearest',assignments:[{type:'direct_control',controls:'Handle_GearLever_F(Lever)',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'ParkingBrake',description:'Handles in: plug the master, brake, engine and gear handles (Handle_*_Active_F(Toggle) Plugged 1 / Removed 0), then the master key Handle_MasterKey_F(Lever) Activated 1. PARK BRK up = handles in, key on',assignments:[pair('Handle_Master_Active_F(Toggle)',1,0),pair('Handle_Brake_Active_F(Toggle)',1,0),pair('Handle_Engine_Active_F(Toggle)',1,0),pair('Handle_Gear_Active_F(Toggle)',1,0),pair('Handle_MasterKey_F(Lever)',1,0)]},
 mom('GearLever','ATS acknowledge (CB_ATSAcknowledge_F(Push), AWS_Reset, held)','CB_ATSAcknowledge_F(Push)',1,0),
 mom('LeftThrottleButton','EB alerter reset (CB_EBReset_F(Push), Alerter)','CB_EBReset_F(Push)',1,0),
 mom('RightThrottleButton','Horn (CB_Horn_F(Push))','CB_Horn_F(Push)',1,0),
 mom('LeftEngineOn','Engine start handle Handle_EngineStart_F(Lever): Start 2 while up, back to Preheat / run 1 when down','Handle_EngineStart_F(Lever)',2,1),
 mom('RightEngineOn','Engine stop (Handle_EngineStop_F(Push) 1, back to 0) while up','Handle_EngineStop_F(Push)',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','ATS power (CB_ATSPower_F(Toggle), AWS_Isolation: 1 / 0). Lit = on','CB_ATSPower_F(Toggle)',1,0),
 {name:'RotaryCrank',description:'Wiper off (CL_WiperD_F(Lever) 0)',assignments:[set('CL_WiperD_F(Lever)',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (CL_WiperD_F(Lever) 0.05)',assignments:[set('CL_WiperD_F(Lever)',0.05)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0,0,0)},
 {name:'AutoBrake1',description:'Lights | Headlight dimmed (CB_HeadLightDim_F 1)',assignments:lights(1,1,0,0)},
 {name:'AutoBrake2',description:'Lights | Headlight bright',assignments:lights(1,0,0,0)},
 {name:'AutoBrake3',description:'Lights | Headlight bright, gauge lights',assignments:lights(1,0,1,0)},
 {name:'AutoBrake4',description:'Lights | Headlight bright, gauge and cab lights',assignments:lights(1,0,1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-kiha40-dtg-thejag',title:'KiHa 40',eyebrow:'JR East · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Tadami Line: Aizu-Wakamatsu – Tadami',colors:{navy:'#2e4a3d',blue:'#5e8a73',red:'#2cb431',paper:'#f3f6f4'},logos:[{file:'../../assets/logo-jreast-greengrey.svg',alt:'JR East'},{file:'../../assets/logo-dtg-greengrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/kiha40-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Backward'],start:1},
 leftThrottle:{name:'Throttle',notches:['Idle','P1','P2','P3','P4','P5'],start:0},
 rightThrottle:{name:'Brake valve',notches:['Emergency','Apply','Lap','Handle Off','Holding','Release'],start:1},
 flap:{name:'Gear',notches:['Direct','Neutral','Hydraulic'],start:1},
 leftThrottleButton:{name:'EB reset'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'ATS ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dimmed'},{short:'2',desc:'Bright'},{short:'3',desc:'+ gauges'},{short:'HI',desc:'+ cab light'}],start:1},
 eng1:{name:'Engine start',start:true}, eng2:{name:'Engine stop',start:true},
 leftAux:{name:'ATS power'}, rightAux:null,
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Handles + key',flat:'out',up:'in'}},
setup:['PARK BRK up: the four handles are plugged in and the master key turned (the train loads with every handle removed)','Engine: ENG 1 up for Start, back down once running','Reverser from Neutral to Forward, ATS power on (left aux)','Lights to Bright','Brake valve at Apply, gear at Neutral, throttle at Idle (parked)'],
depart:['Close doors (RUD TRIM), check the signal','Brake valve to Release, then Handle Off once charged','Gear to Hydraulic, throttle P1 … P5','Acknowledge ATS with the gear lever, the EB with the left throttle button','Brake: throttle to Idle, valve to Apply, Lap to hold; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-kiha40-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
