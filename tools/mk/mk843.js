// ČD Class 843 diesel railcar (Vector Simulations for DTG, Liberec – Stará Paka), 2026-10-13. Unlike the 750: no BS2 valve, no handle
// dummy. Two cabs with ..Cab_1 / ..Cab_2 nodes (the capture's F/B prefix pair is a misdetection); IS_GetActiveCab false/false, cab 1 wired.
// Capture agent probe: ThrottleAndBrakeCab_1 (Throttle, -3..2) is a combined handle R (rychlobrzda, emergency) -3 stores / BP (air brake)
// -2 SPRINGS back to V / BE (dynamic brake) -1 SPRINGS back to V / V (off, coast; laps a brake) 0 stores / J (drive, holds power; releases a
// brake) 1 stores / S (power up) 2 SPRINGS back to J within 0.2 s; zones ±0.5 around each. ReverserCab_1 Backward -1 / Off 0 / Engine Only 1
// / Forward 2, free through the API. EngineBrakeLeverCab_1 (independent) O2 Released -2 / X Hold 0 / B2 Applied 2 stable (|v|<1 -> 0,
// |v|>=1 -> ±2). MasterKeyCab_1 (MasterSwitch lever) Off 0 / Slave 1 / Master 2, loads Off. BrakeCutoutSwitchCab_1 Cut-in 0 / Cut-out 1, loads
// Cut-out. LS90SwitchCab_1 (train protection) Isolated 0 / Start 1 / On 2, loads Isolated. ARRSwitchCab_1 (speed regulator) Manual 0 /
// Automatic 1 / Winter 2. DoorsControlSwitchCab_1 Lock All 0 / Unlock Right 1 / Unlock All 2 / Unlock Left 3 / Lock All 4.
// HeadlightsSwitchCab_1 Off 0 / Reduced 1 / Full 2; LightsSelectionSwitchCab_1 / BacklightsSwitchCab_1 Red right -3 / Red left -2 / Red both
// -1 / Off 0 / white both 1 / white one 2. WipersSwitchCab_1 Washer -1 / Off 0 / 1 / 2.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680500';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/^RVM_LBSP_CD843_(?!Base$)/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,front,rear)=>[set('HeadlightsSwitchCab_1',h),set('LightsSelectionSwitchCab_1',front),set('BacklightsSwitchCab_1',rear)];
// raw axis, inverted: S (power up) at the far end (raw 0) .. R (emergency) nearest (raw 1), as the BR 612 incremental handle
const thH=[{threshold:1,threshold_tolerance:0.06},{threshold:0.8,threshold_tolerance:0.08},{threshold:0.6,threshold_tolerance:0.08},{threshold:0.4,threshold_tolerance:0.08},{threshold:0.2,threshold_tolerance:0.08},{threshold:0,threshold_tolerance:0.06}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser ReverserCab_1 (Backward -1 / Off 0 / Engine Only 1 / Forward 2), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'ReverserCab_1',input_value:{min:-1,max:2,steps:[-1,0,1,2],invert:true}}]},
 {name:'RightThrottle',description:'Combined handle (right of the desk, as in the cab) ThrottleAndBrakeCab_1: R emergency -3 / BP air brake -2 (spring) / BE dynamic brake -1 (spring) / V off 0 / J drive 1 / S power up 2 (spring). The spring positions act for the moment the lever enters their band and then fall back to V or J, so push into S and back to J to add power step by step, and into BE / BP and back to V for the brake. Inverted: S at the far end (raw 0 ±0.06), J 0.2, V 0.4, BE 0.6, BP 0.8 (±0.08), R 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'ThrottleAndBrakeCab_1',input_value:{min:-3,max:2,steps:[-3,-2,-1,0,1,2],invert:true,step_thresholds:thH}}]},
 {name:'FlapLever',description:'Independent brake EngineBrakeLeverCab_1 (O2 Released -2 / X Hold 0 / B2 Applied 2), plain: Released at the far end, Applied nearest',assignments:[{type:'direct_control',controls:'EngineBrakeLeverCab_1',input_value:{min:-2,max:2,steps:[-2,0,2]}}]},
 {name:'ParkingBrake',description:'Master key MasterKeyCab_1 (Master 2 / Off 0) and brake cut-out BrakeCutoutSwitchCab_1 (Cut-in 0 / Cut-out 1): PARK BRK up = key at Master, brakes cut in; the railcar loads with the key Off and the brakes cut out',assignments:[pair('MasterKeyCab_1',2,0),pair('BrakeCutoutSwitchCab_1',0,1)]},
 mom('GearLever','Vigilance acknowledge (VigilanceButtonRCab_1, held)','VigilanceButtonRCab_1',1,0),
 mom('LeftThrottleButton','Sand (SandButtonCab_1, held)','SandButtonCab_1',1,0),
 mom('RightThrottleButton','Horn (HornButtonCab_1, held)','HornButtonCab_1',1,0),
 {name:'LeftEngineOn',description:'Engine start (EngineStartButtonCab_1 1 while up, 0 when down): reverser to Engine Only first',assignments:[pair('EngineStartButtonCab_1',1,0)]},
 {name:'RightEngineOn',description:'Whistle (WhistleButtonCab_1 1 while up, 0 when down)',assignments:[pair('WhistleButtonCab_1',1,0)]},
 tog('RudderTrimLeft','Doors | Left: DoorsControlSwitchCab_1 Unlock Left 3, press again for Lock All 0','DoorsControlSwitchCab_1',3,0),
 tog('RudderTrimRight','Doors | Right: DoorsControlSwitchCab_1 Unlock Right 1, press again for Lock All 0','DoorsControlSwitchCab_1',1,0),
 tog('LeftAuxButton','Train protection LS90SwitchCab_1 (On 2 / Isolated 0). Lit = on; loads isolated','LS90SwitchCab_1',2,0),
 tog('RoundAuxButton','Speed regulator ARRSwitchCab_1 (Automatic 1 / Manual 0). Lit = automatic; the set speed stays on the desk keypad','ARRSwitchCab_1',1,0),
 {name:'RotaryCrank',description:'Wiper off (WipersSwitchCab_1 0)',assignments:[set('WipersSwitchCab_1',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (WipersSwitchCab_1 1)',assignments:[set('WipersSwitchCab_1',1)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0,0)},
 {name:'AutoBrake1',description:'Lights | Front white lamps (LightsSelectionSwitchCab_1 1)',assignments:lights(0,1,0)},
 {name:'AutoBrake2',description:'Lights | Headlights reduced (HeadlightsSwitchCab_1 1) and front white lamps',assignments:lights(1,1,0)},
 {name:'AutoBrake3',description:'Lights | Headlights full (2) and front white lamps',assignments:lights(2,1,0)},
 {name:'AutoBrake4',description:'Lights | Headlights full, front white, rear red lamps (BacklightsSwitchCab_1 -1)',assignments:lights(2,1,-1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-cd-843-vector-thejag',title:'Class 843',eyebrow:'České dráhy · Vector Simulations · TCA Quadrant Airbus',profileName:p.name,developer:'Vector Simulations',route:'Liberec – Stará Paka',colors:{navy:'#1f3d63',blue:'#4f78a6',red:'#009ee0',paper:'#f1f5f9'},logos:[{file:'../../assets/logo-cd-cdblue.svg',alt:'České dráhy'},{file:'../../assets/logo-dtg-cdblue.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/cd-843-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Engine only','Off','Backward'],start:2},
 rightThrottle:{name:'Power / brake handle',notches:['S  power up','J  drive','V  off','BE  dyn. brake','BP  air brake','R  emergency'],start:2},
 leftThrottle:null,
 flap:{name:'Independent',notches:['Released','Hold','Applied'],start:2},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Vigilance'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'White lamps'},{short:'2',desc:'Head reduced'},{short:'3',desc:'Head full'},{short:'HI',desc:'+ rear red'}],start:1},
 eng1:{name:'Engine start',start:true}, eng2:{name:'Whistle',start:true},
 leftAux:{name:'LS90'}, rightAux:null,
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'ARR auto'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key + brake cut-in',flat:'off',up:'on'}},
setup:['PARK BRK up: master key to Master, brakes cut in (the railcar loads with the key Off and the brakes cut out)','Engines: reverser to Engine only, ENG 1 up until they run (most services start with them running)','LS90 on (left aux lit); it loads isolated','Lights to Head full','Independent at Applied, handle at V'],
depart:['Close the doors (RUD TRIM again), check the signal; reverser to Forward','Independent to Released','Handle: tap into S and back to J to build power step by step; J holds it, V coasts','Acknowledge vigilance with the gear lever','Brake: tap into BE (dynamic) or BP (air) and back to V, which holds the brake; J releases it; R emergency nearest you']};
fs.writeFileSync('tools/manual/trains/tsw-cd-843-vector-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
