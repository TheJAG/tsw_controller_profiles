// ČD Class 750 "Brejlovec" (Vector Simulations for DTG, Liberec – Stará Paka), 2026-10-13. First Czech train, first Vector Simulations
// train. Two cabs with ..Cab_1 / ..Cab_2 nodes; IS_GetActiveCab false/false, cab 1 is the one the services give you, wired by name.
// Capture agent probe: ReverserCab_1 Backward -2 / Engine Only -1 / Off 0 / Engine Only 1 / Forward 2 (snaps at ±0.5), moves only with the
// reverser handle in (lever ReverserVisibilityDummy_1 = 1; the MasterSwitch button ReverserVisiblityCab_1 does nothing). ThrottleCab_1
// (kontrolér handwheel) Neutral 0 / notch k at k+1 (2..9), moves only with the reverser out of Off. BS2Cab_1 (DAKO BS2 valve) Quick Release 0 /
// Release 0.14 / Neutral 0.22 / Apply zone 0.26..0.82 in 0.04 steps / Cutout 0.86 / Emergency 1, loads at Cutout, with BS2KeyCab_1 (Locked 0 /
// Unlocked 1) either way through the API. BPCab_1 (BP1 independent) continuous 0..1. Bail-off lever ignores the API; OL2Cab_1 (BrakeRelease)
// push button. Loads cold: engine off, BS2 cut out, key locked, handle out. Engine start: reverser in Engine Only (1) and
// EngineStartButtonCab_1 held about 8 s. VZ_SwitchMode (train protection) Off 0 / Banking 1 / Classification Yard 2 / Start 3 / Active 4 /
// Test 5 (loads Banking). HeadlightSwitchCab_1 Reduced -1 / Off 0 / Full 1; lamp switches LightFR/FL/BR/BLSwitchCab_1 Red -1 / Off 0 / White 1.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680500';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/^RVM_LBSP_CD750_(?!Base$)/.test(n));
p.rail_class_information=['RVM_LBSP_CD750_Base',...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,front,rear)=>[set('HeadlightSwitchCab_1',h),set('LightFRSwitchCab_1',front),set('LightFLSwitchCab_1',front),set('LightBRSwitchCab_1',rear),set('LightBLSwitchCab_1',rear)];
// BS2 raw bands, plain: Quick Release at the far end (raw 0) .. Emergency nearest (raw 1)
const thBS2=[{threshold:0,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.26,threshold_end:0.86},{threshold:0.92,threshold_tolerance:0.03},{threshold:1,threshold_tolerance:0.04}];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser ReverserCab_1 (Backward -2 / Engine Only -1 / Off 0 / Engine Only 1 / Forward 2, snaps at ±0.5), inverted: Forward at the far end. Needs the reverser handle in (PARK BRK up)',assignments:[{type:'direct_control',controls:'ReverserCab_1',input_value:{min:-2,max:2,steps:[-2,-1,0,1,2],invert:true}}]},
 {name:'LeftThrottle',description:'Controller handwheel ThrottleCab_1 (Neutral 0 / notches 1..8 stored at 2..9; moves only with the reverser out of Off), inverted: 8 at the far end, 0 nearest',assignments:[{type:'direct_control',controls:'ThrottleCab_1',input_value:{min:0,max:9,steps:[0,2,3,4,5,6,7,8,9],invert:true}}]},
 {name:'RightThrottle',description:'Train brake valve BS2Cab_1 (Quick Release 0 / Release 0.14 / Neutral 0.22 / Apply zone 0.26..0.82 in 0.04 steps / Cutout 0.86 / Emergency 1), plain: Quick Release at the far end (raw 0 ±0.04), Release 0.1, Neutral 0.2, apply zone 0.26..0.86, Cutout 0.92 ±0.03, Emergency 1 nearest',assignments:[{type:'direct_control',controls:'BS2Cab_1',input_value:{min:0,max:1,steps:[0,0.14,0.22,null,0.86,1],step_thresholds:thBS2}}]},
 {name:'FlapLever',description:'Independent brake BPCab_1 (BP1, Release 0 / continuous / Full 1), plain: Release at the far end, Full nearest',assignments:[{type:'direct_control',controls:'BPCab_1',input_value:{min:0,max:1}}]},
 {name:'ParkingBrake',description:'Reverser handle ReverserVisibilityDummy_1 (In 1 / Out 0) and brake valve key BS2KeyCab_1 (Unlocked 1 / Locked 0): PARK BRK up = handle in, key unlocked. The reverser and the controller only move with the handle in',assignments:[pair('ReverserVisibilityDummy_1',1,0),pair('BS2KeyCab_1',1,0)]},
 mom('GearLever','Vigilance acknowledge (VigilanceButtonRCab_1, held)','VigilanceButtonRCab_1',1,0),
 mom('LeftThrottleButton','Sand (SanderPedalCab_1, held)','SanderPedalCab_1',1,0),
 mom('RightThrottleButton','Horn (HornPedalACab_1, held)','HornPedalACab_1',1,0),
 {name:'LeftEngineOn',description:'Engine start (EngineStartButtonCab_1 1 while up, 0 when down): reverser to Engine Only first, hold up about 8 s',assignments:[pair('EngineStartButtonCab_1',1,0)]},
 {name:'RightEngineOn',description:'Loco brake release OL2Cab_1 (1 while up, 0 when down)',assignments:[pair('OL2Cab_1',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Train protection VZ_SwitchMode (Active 4 / Off 0). Lit = active; loads in Banking 1','VZ_SwitchMode',4,0),
 mom('RoundAuxButton','Whistle (WhistleButtonCab_1, held)','WhistleButtonCab_1',1,0),
 {name:'RotaryCrank',description:'Wiper off (WiperSwitchMainCab_1 0)',assignments:[set('WiperSwitchMainCab_1',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (WiperSwitchMainCab_1 1)',assignments:[set('WiperSwitchMainCab_1',1)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0,0)},
 {name:'AutoBrake1',description:'Lights | Front white lamps (LightFR/FL 1)',assignments:lights(0,1,0)},
 {name:'AutoBrake2',description:'Lights | Headlight reduced (HeadlightSwitchCab_1 -1) and front white lamps',assignments:lights(-1,1,0)},
 {name:'AutoBrake3',description:'Lights | Headlight full (1) and front white lamps',assignments:lights(1,1,0)},
 {name:'AutoBrake4',description:'Lights | Headlight full, front white, rear red lamps (LightBR/BL -1)',assignments:lights(1,1,-1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-cd-750-vector-thejag',title:'Class 750',eyebrow:'České dráhy · Vector Simulations · TCA Quadrant Airbus',profileName:p.name,developer:'Vector Simulations',route:'Liberec – Stará Paka',colors:{navy:'#1f3d63',blue:'#4f78a6',red:'#009ee0',paper:'#f1f5f9'},logos:[{file:'../../assets/logo-cd-cdblue.svg',alt:'České dráhy'},{file:'../../assets/logo-dtg-cdblue.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/cd-750-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Engine only','Off','Engine (rev.)','Backward'],start:2},
 leftThrottle:{name:'Controller',notches:['8','7','6','5','4','3','2','1','0'],start:8},
 rightThrottle:{name:'Brake valve BS2',continuous:true,notches:['Quick release','Release','Neutral',null,'Cutout','Emergency'],start:4},
 flap:{name:'Independent BP1',continuous:true,notches:['Release',null,null,null,'Full'],start:4},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Vigilance'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'White lamps'},{short:'2',desc:'Head reduced'},{short:'3',desc:'Head full'},{short:'HI',desc:'+ rear red'}],start:1},
 eng1:{name:'Engine start',start:true}, eng2:{name:'Brake release',start:true},
 leftAux:{name:'Train protection'}, rightAux:null,
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'Whistle'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Reverser handle + BS2 key',flat:'out',up:'in'}},
setup:['PARK BRK up: reverser handle in, BS2 key unlocked (the loco loads with both out and the valve in Cutout)','Reverser to Engine only, ENG 1 up for about 8 s until the engine runs, then ENG 1 down','Train protection on (left aux lit); it loads in Banking','Lights to Head full','Independent at Full; brake valve from Cutout to Neutral'],
depart:['Check the signal; reverser to Forward','Brake valve to Release (Quick release at the far end), independent to Release','Controller away from you: 1 … 8 (it only moves with the reverser out of Off)','Acknowledge vigilance with the gear lever','Brake: controller back to 0, brake valve into the apply zone; Emergency nearest you']};
fs.writeFileSync('tools/manual/trains/tsw-cd-750-vector-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
