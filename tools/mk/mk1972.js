// London Underground 1972 Mk2 Tube Stock (DTG, Bakerloo Line; the NewJourneys1972 silver livery uses the same classes), 2026-10-12. Own
// tube layout. One cab, no cab suffixes; IS_GetActiveCab fails. Fable probe: the combined TractionBrakeController (Throttle, -1..0.3333)
// stays in Shutdown until DirectionSelectorKey (MasterSwitch push button, In 1), ControlSwitchKey (In 1) + ControlSwitch (On 1) are set
// AND the DeadmansHandleButton push button is pressed (1); then it stores twelve notches at ninths: Shutdown -1 / Emergency -0.7777 /
// Service -0.6666 / Lap -0.5555 / Rheo 2 EP Max -0.4444 / EP Normal -0.3333 / EP Min -0.2222 / Rheo 1 Hold -0.1111 / Off and Release 0 /
// Shunt 0.1111 / Series 0.2222 / Parallel 0.3333 (Shutdown is not reached again from Emergency while the deadman is held). The
// DirectionSelectorSwitch (Reverser) moves without the key: Reverse -0.3333 / Inter 0 / Forward 0.32 / Auto 0.65 / Off 0.99 (loads Off).
// No separate Westinghouse brake node. WhistleLever Low 1 / High -1 (rest 0); Wipers Park 0 / Run 0.84; AudibleWarningValveReset
// (Alerter), TripcockResetButton, RPS_Isolate 0 / 1, SpeedControlCutoutSwitch 0 / 0.85; HeadLights_MCB, TailLight_L/R_MCB, GaugeLight_MCB
// push buttons (Off 0 / On 1); doors DoorsOpen_L/R, DoorsClose_L/R push buttons (keys y / u used).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679420';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/^RVM_BKR_LUL_72Stock_/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
// eleven bands of the tested Class 171 brake (Emergency far .. Release nearest) reused for the twelve-minus-Shutdown controller
const c171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const th11=c171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value.step_thresholds;
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,g,t)=>[set('HeadLights_MCB',h),set('GaugeLight_MCB',g),set('TailLight_L_MCB',t),set('TailLight_R_MCB',t)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Direction selector DirectionSelectorSwitch (Reverse -0.3333 / Inter 0 / Forward 0.32 / Auto 0.65 / Off 0.99; any value in a zone), plain: Reverse at the far end, Off nearest',assignments:[{type:'direct_control',controls:'DirectionSelectorSwitch',input_value:{min:-0.3333,max:0.99,steps:[-0.25,0,0.33,0.66,0.92]}}]},
 {name:'LeftThrottle',description:'Combined traction / brake controller TractionBrakeController: Emergency -0.7777 / Service -0.6666 / Lap -0.5555 / Rheo 2 EP Max -0.4444 / EP Normal -0.3333 / EP Min -0.2222 / Rheo 1 Hold -0.1111 / Off and Release 0 / Shunt 0.1111 / Series 0.2222 / Parallel 0.3333 (eleven notches, the Class 171 bands), inverted: Emergency at the far end, Parallel nearest. Shutdown stays in the cab. Only moves with the keys in and the deadman held (PARK BRK up)',assignments:[{type:'direct_control',controls:'TractionBrakeController',input_value:{min:-0.7777,max:0.3333,steps:[-0.7777,-0.6666,-0.5555,-0.4444,-0.3333,-0.2222,-0.1111,0,0.1111,0.2222,0.3333],invert:true,step_thresholds:th11}}]},
 {name:'ParkingBrake',description:'Cab in: DirectionSelectorKey 1 / 0, ControlSwitchKey 1 / 0, ControlSwitch On 1 / Off 0 and the DeadmansHandleButton pressed 1 / released 0 (the controller is dead without all four). PARK BRK up = keys in, deadman held',assignments:[pair('DirectionSelectorKey',1,0),pair('ControlSwitchKey',1,0),pair('ControlSwitch',1,0),pair('DeadmansHandleButton',1,0)]},
 mom('GearLever','Audible warning (deadman / tripcock) valve reset (AudibleWarningValveReset, Alerter, held)','AudibleWarningValveReset',1,0),
 mom('RightThrottleButton','Whistle low (WhistleLever 1, back to 0)','WhistleLever',1,0),
 mom('LeftEngineOn','Tripcock reset (TripcockResetButton 1 while up, 0 when down)','TripcockResetButton',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','RPS (rollback protection) isolate (RPS_Isolate 1 / 0). Lit = isolated','RPS_Isolate',1,0),
 tog('RightAuxButton','Speed control cut-out (SpeedControlCutoutSwitch 0.85 / 0). Lit = cut out','SpeedControlCutoutSwitch',0.85,0),
 {name:'RotaryCrank',description:'Wipers park (Wipers 0)',assignments:[set('Wipers',0)]},
 {name:'RotaryIgnStart',description:'Wipers run (Wipers 0.84)',assignments:[set('Wipers',0.84)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0,0)},
 {name:'AutoBrake1',description:'Lights | Headlights (HeadLights_MCB 1)',assignments:lights(1,0,0)},
 {name:'AutoBrake2',description:'Lights | Headlights and gauge lights',assignments:lights(1,1,0)},
 {name:'AutoBrake3',description:'Lights | Headlights, gauge and tail lights',assignments:lights(1,1,1)},
 {name:'AutoBrake4',description:'Lights | Tail lights only (this end trailing)',assignments:lights(0,0,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-lu-1972-dtg-thejag',title:'1972 Tube Stock',eyebrow:'London Underground · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Bakerloo Line: Harrow & Wealdstone – Elephant & Castle',logos:[{file:'../../assets/logo-lu-roundel-navy.svg',alt:'London Underground'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/lu-1972-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Direction selector',notches:['Reverse','Inter','Forward','Auto','Off'],start:4},
 leftThrottle:{name:'Controller',notches:['Emergency','Service','Lap','EP max','EP normal','EP min','Hold','Off / release','Shunt','Series','Parallel'],start:1},
 rightThrottle:null, flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Whistle'}, gearLever:{name:'Valve reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Headlights'},{short:'2',desc:'+ gauges'},{short:'3',desc:'+ tail'},{short:'HI',desc:'Tail only'}],start:1},
 eng1:{name:'Tripcock reset',start:true}, eng2:null,
 leftAux:{name:'RPS isolate'}, rightAux:{name:'Speed ctrl cut-out'},
 modeSwitch:{name:'Wipers',left:'park',right:'run'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Keys + deadman',flat:'out',up:'in'}},
setup:['PARK BRK up: selector key and control switch key in, control switch on, deadman held (the controller is dead without them)','Direction selector from Off to Forward','Lights to Headlights','Controller at Service (parked); Shutdown stays in the cab'],
depart:['Close doors (RUD TRIM), check the signal','Controller to Off / release, then Shunt, Series, Parallel','Brake: back through Hold into the EP notches; Lap holds, Service and Emergency at the far end','Reset the valve with the gear lever after a deadman or tripcock trip; tripcock reset on ENG 1']};
fs.writeFileSync('tools/manual/trains/tsw-lu-1972-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
