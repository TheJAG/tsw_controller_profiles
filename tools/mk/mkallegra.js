// RhB ABe 8/12 Allegra (DTG, Berninalinie), 2026-10-12. Own layout on the SNG combined-handle pattern; as in the cab the Zugbremse
// sits on the driver's left and the Zugkraft / Bremskraft handle on the right. One desk, no cab suffixes;
// IS_GetActiveCab false/false. API probe (MasterKey on, reverser Forward): IrregularLever_Throttle_Brake -1.29..1 is continuous on both
// sides and takes jumps: power 0.2..1 (sets 0.1..0.2 give 0.2 = min power), 0 dead band -0.1..0.1, brake -0.2..-1 (sets -1..-1.14 give
// -1 = max brake), Emergency -1.29 (sets -1.2 and below). IrregularLever_TrainBrake Release 0 (a set to 0 from Full stops at 0.07 first) /
// Minimum 0.07 / continuous to 0.79 / Full service 0.8 (0.8..0.9) / Emergency 1. IrregularLever_CruiseControl (Vmax setter) 0..1 =
// 0..120 km/h in 0.04 steps. Reverser Reverse 0 / 0 at 0.5 / Forward 1. Key PushButton_MasterKey (Unlocked 1). No PZB: SISTE (Sifa)
// reset and ZS buttons; SafetyDevices / VigilanceDevices push buttons switch the train protection and the vigilance.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679980';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/RhB_ABe_8_12/.test(n)&&!/_Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,t)=>[set('IrregularLever_Headlights',h),set('IrregularLever_TailLights',t)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser IrregularLever_Reverser (Reverse 0 / 0 at 0.5 / Forward 1; the zones take any value), inverted: Forward at the far end. Needs the master key (PARK BRK up)',assignments:[{type:'direct_control',controls:'IrregularLever_Reverser',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'RightThrottle',description:'Combined Zugkraft / Bremskraft handle IrregularLever_Throttle_Brake -1.29..1 (Emergency -1.29 / Max brake -1 / brake continuous to -0.2 / 0 / min power 0.2 / power continuous to 1). SNG geometry, inverted: max power at the far end (raw 0 ±0.04), power zone 0.045..0.42, min power 0.45 ±0.03, 0 at 0.5 ±0.02, min brake 0.55 ±0.03, brake zone 0.58..0.92, Max brake 0.95 ±0.02, Emergency 1 ±0.02 nearest',assignments:[{type:'direct_control',controls:'IrregularLever_Throttle_Brake',input_value:{min:-1.29,max:1,steps:[-1.29,-1,null,-0.2,0,0.2,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.02},{threshold:0.95,threshold_tolerance:0.02},{threshold:0.92,threshold_end:0.58},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.42,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'LeftThrottle',description:'Zugbremse IrregularLever_TrainBrake (Release 0 / Minimum 0.07 / continuous service to 0.79 / Full service 0.8 / Emergency 1), inverted as the Class 153 brake: Emergency at the far end, Release nearest. Emergency raw 0 ±0.05, Full 0.16 ±0.05, free zone 0.24..0.84 (full down to minimum), Minimum 0.9 ±0.03, Release 1 ±0.05 (a second re-send finishes the release)',assignments:[{type:'direct_control',controls:'IrregularLever_TrainBrake',input_value:{min:0,max:1,steps:[0,0.07,null,0.8,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.05},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.84,threshold_end:0.24},{threshold:0.16,threshold_tolerance:0.05},{threshold:0,threshold_tolerance:0.05}]}}]},
 {name:'FlapLever',description:'Vmax setter IrregularLever_CruiseControl (0..120 km/h in 0.04 steps, the game snaps), 120 at the far end so inverted; the V-Sol rocker and the cruise switch stay in the cab',assignments:[{type:'direct_control',controls:'IrregularLever_CruiseControl',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Master key PushButton_MasterKey (MasterSwitch push button, Unlocked 1 / Locked 0): PARK BRK up = key in',assignments:[pair('PushButton_MasterKey',1,0)]},
 mom('GearLever','SISTE (vigilance) reset (PushButton_SISTE_Reset, Alerter, held)','PushButton_SISTE_Reset',1,0),
 mom('RightThrottleButton','Horn (PushButton_Horn)','PushButton_Horn',1,0),
 mom('LeftEngineOn','ZS acknowledge (PushButton_ZS_R, Alerter)','PushButton_ZS_R',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Train protection on / off (PushButton_SafetyDevices, SignallingSystems: 1 / 0). Lit = pressed','PushButton_SafetyDevices',1,0),
 tog('RightAuxButton','Vigilance on / off (PushButton_VigilanceDevices, WarningDevices: 1 / 0). Lit = pressed','PushButton_VigilanceDevices',1,0),
 {name:'RotaryCrank',description:'Wipers off (IrregularLever_Wipers 0)',assignments:[set('IrregularLever_Wipers',0)]},
 {name:'RotaryIgnStart',description:'Wipers intermittent slow (IrregularLever_Wipers 0.66)',assignments:[set('IrregularLever_Wipers',0.66)]},
 {name:'AutoBrake0',description:'Lights | Off (Headlights 0 at 0.5, tail lights Off)',assignments:lights(0.5,0)},
 {name:'AutoBrake1',description:'Lights | Dimmed (0.75)',assignments:lights(0.75,0)},
 {name:'AutoBrake2',description:'Lights | Full (1)',assignments:lights(1,0)},
 {name:'AutoBrake3',description:'Lights | Full headlights, white tail lamps (0.5)',assignments:lights(1,0.5)},
 {name:'AutoBrake4',description:'Lights | Red tail lamps at this end (headlights off)',assignments:lights(0.5,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-rhb-allegra-dtg-thejag',title:'ABe 8/12 Allegra',eyebrow:'Rhätische Bahn · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Berninalinie: Tirano – Ospizio Bernina',colors:{navy:'#5a2a2e',blue:'#8a5a5e',red:'#eb0000',paper:'#f7f3f3'},logos:[{file:'../../assets/logo-rhb-maroon.svg',alt:'Rhätische Bahn'},{file:'../../assets/logo-dtg-maroon.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/rhb-allegra-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','0','Reverse'],start:1},
 rightThrottle:{name:'Zugkraft / Bremskraft',continuous:true,notches:['Max power',null,'Min power','0','Min brake',null,'Max brake','Emergency'],start:6},
 leftThrottle:{name:'Zugbremse',continuous:true,notches:['Emergency','Full service',null,'Minimum','Release'],start:1},
 flap:{name:'Vmax setter',continuous:true,notches:['120 km/h',null,null,null,'0'],start:4},
 leftThrottleButton:null, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SISTE reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dimmed'},{short:'2',desc:'Full'},{short:'3',desc:'Full + white'},{short:'HI',desc:'Red tail'}],start:1},
 eng1:{name:'ZS ack.',start:true}, eng2:null,
 leftAux:{name:'Train protection'}, rightAux:{name:'Vigilance'},
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK up); battery and pantograph in the cab','Reverser from 0 to Forward','Train protection and vigilance on (aux squares)','Lights to Full','Zugbremse at Full service, handle at Max brake (parked)'],
depart:['Close doors (RUD TRIM), check the signal','Zugbremse to Release, handle to 0','Handle past Min power into the power zone; set a Vmax on the flap lever if you use the cruise control','Acknowledge the SISTE with the gear lever, the ZS with ENG 1','Brake: handle back through 0 into the brake zone; Zugbremse into the service zone; Emergency at the far ends']};
fs.writeFileSync('tools/manual/trains/tsw-rhb-allegra-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
