// SBB RABe 523 (Rivet Games, S-Bahn Zentralschweiz: Luzern – Sursee), 2026-10-12. Derived from mkallegra.js: the same Stadler
// simulation. One desk, no cab suffixes; IS_GetActiveCab fails. API probe (MasterKey on, reverser Forward): Throttle (Irregular Lever)
// -1.29..1 is continuous on both sides and takes jumps (power 0.2..1, sets 0.1..0.2 give min power 0.2; 0 dead band -0.1..0.1; brake
// -0.2..-1, sets -1..-1.14 give max brake -1; Emergency -1.29 from -1.2 down); with the key off it ignores every set. TrainBrake
// (Irregular Lever) Release 0 (a set to 0 from Full stops at Minimum 0.07 first) / Minimum 0.07 / continuous to 0.79 / Full service 0.8
// (0.8..0.9) / Emergency 1. Reverser (Irregular Lever) -1..1: Reverse -1 / Neutral 0 (zone -0.5..0.49) / Forward 1 (0.5+). No speed
// setter lever (Tempomat rocker in the cab). Key MasterKey (Toggle Button), MasterSwitch, Unlocked 1. Integra-Signum reset (AWS_Reset)
// and the ETCS acknowledge (Alerter) are push buttons; ETCSButton (WarningDevices) switches the ETCS; horn is the WarningHorn lever.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679340';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=['LZN_523_RVM_Drivable_A','LZN_523_RVM_Drivable_B','LZN_523_RVM_ND_C','LZN_523_RVM_ND_D']; // plugin pak: the scan listed these without the LZN_523_ prefix
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=h=>[set('HeadlightSwitch (Irregular Lever)',h)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser Reverser (Irregular Lever) (Reverse -1 / Neutral 0 / Forward 1; the zones take any value), inverted: Forward at the far end. Needs the master key (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser (Irregular Lever)',input_value:{min:-1,max:1,steps:[-1,0,1],invert:true}}]},
 {name:'RightThrottle',description:'Combined Zugkraft / Bremskraft handle Throttle (Irregular Lever) -1.29..1 (Emergency -1.29 / Max brake -1 / brake continuous to -0.2 / 0 / min power 0.2 / power continuous to 1). SNG geometry, inverted: max power at the far end (raw 0 ±0.04), power zone 0.045..0.42, min power 0.45 ±0.03, 0 at 0.5 ±0.02, min brake 0.55 ±0.03, brake zone 0.58..0.92, Max brake 0.95 ±0.02, Emergency 1 ±0.02 nearest',assignments:[{type:'direct_control',controls:'Throttle (Irregular Lever)',input_value:{min:-1.29,max:1,steps:[-1.29,-1,null,-0.2,0,0.2,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.02},{threshold:0.95,threshold_tolerance:0.02},{threshold:0.92,threshold_end:0.58},{threshold:0.55,threshold_tolerance:0.03},{threshold:0.5,threshold_tolerance:0.02},{threshold:0.45,threshold_tolerance:0.03},{threshold:0.42,threshold_end:0.045},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'LeftThrottle',description:'Zugbremse TrainBrake (Irregular Lever) (Release 0 / Minimum 0.07 / continuous service to 0.79 / Full service 0.8 / Emergency 1), inverted as the Class 153 brake: Emergency at the far end, Release nearest. Emergency raw 0 ±0.05, Full 0.16 ±0.05, free zone 0.24..0.84 (full down to minimum), Minimum 0.9 ±0.03, Release 1 ±0.05 (a second re-send finishes the release)',assignments:[{type:'direct_control',controls:'TrainBrake (Irregular Lever)',input_value:{min:0,max:1,steps:[0,0.07,null,0.8,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.05},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.84,threshold_end:0.24},{threshold:0.16,threshold_tolerance:0.05},{threshold:0,threshold_tolerance:0.05}]}}]},
 {name:'ParkingBrake',description:'Master key MasterKey (Toggle Button) (MasterSwitch, Unlocked 1 / Locked 0; the handle ignores every set without it): PARK BRK up = key in',assignments:[pair('MasterKey (Toggle Button)',1,0)]},
 mom('GearLever','Integra-Signum reset (IntegraSignum_Reset(PushButton), AWS_Reset, held)','IntegraSignum_Reset(PushButton)',1,0),
 mom('LeftThrottleButton','Sand (Sanding (PushButton))','Sanding (PushButton)',1,0),
 mom('RightThrottleButton','Horn high tone (WarningHorn (IrregularLever) 1, back to 0)','WarningHorn (IrregularLever)',1,0),
 mom('LeftEngineOn','ETCS acknowledge (ETCS_Button_Acknowledge(Push Button), Alerter)','ETCS_Button_Acknowledge(Push Button)',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','ETCS on / off (ETCSButton(PushButton), WarningDevices: 1 / 0). Lit = pressed','ETCSButton(PushButton)',1,0),
 tog('RoundAuxButton','Tempomat isolation (TempomatIsolationSwitch (Toggle Button) 1 / 0). Lit = isolated','TempomatIsolationSwitch (Toggle Button)',1,0),
 {name:'RotaryCrank',description:'Wipers off (Wipers (Irregular Lever) 0)',assignments:[set('Wipers (Irregular Lever)',0)]},
 {name:'RotaryIgnStart',description:'Wipers 1 (Wipers (Irregular Lever) 0.2668)',assignments:[set('Wipers (Irregular Lever)',0.2668)]},
 {name:'AutoBrake0',description:'Lights | Off (HeadlightSwitch (Irregular Lever) 0)',assignments:lights(0)},
 {name:'AutoBrake1',description:'Lights | Markers (0.25)',assignments:lights(0.25)},
 {name:'AutoBrake2',description:'Lights | Day (-0.25)',assignments:lights(-0.25)},
 {name:'AutoBrake3',description:'Lights | Night (0.75)',assignments:lights(0.75)},
 {name:'AutoBrake4',description:'Lights | Tail lamps at this end (0.5)',assignments:lights(0.5)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-sbb-rabe523-rivet-thejag',title:'RABe 523 FLIRT',eyebrow:'SBB CFF FFS · Rivet Games · TCA Quadrant Airbus',profileName:p.name,developer:'Rivet Games',route:'S-Bahn Zentralschweiz: Luzern – Sursee',colors:{navy:'#5a2a2e',blue:'#8a5a5e',red:'#eb0000',paper:'#f7f3f3'},logos:[{file:'../../assets/logo-sbb-maroon.svg',alt:'SBB CFF FFS'},{file:'../../assets/logo-rivet-maroon.png',alt:'Rivet Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/sbb-rabe523-rivet-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 rightThrottle:{name:'Zugkraft / Bremskraft',continuous:true,notches:['Max power',null,'Min power','0','Min brake',null,'Max brake','Emergency'],start:6},
 leftThrottle:{name:'Zugbremse',continuous:true,notches:['Emergency','Full service',null,'Minimum','Release'],start:1},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Signum reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Markers'},{short:'2',desc:'Day'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail lamps'}],start:1},
 eng1:{name:'ETCS ack.',start:true}, eng2:null,
 leftAux:{name:'ETCS'}, rightAux:null,
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:{name:'Tempomat isol.'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK up); the handle ignores the lever without it; pantograph in the cab','Reverser from Neutral to Forward','ETCS on (left aux), level in the cab','Lights to Day','Zugbremse at Full service, handle at Max brake (parked)'],
depart:['Close doors (RUD TRIM), check the signal','Zugbremse to Release, handle to 0','Handle past Min power into the power zone; the Tempomat rocker stays in the cab','Acknowledge Integra-Signum with the gear lever, the ETCS with ENG 1','Brake: handle back through 0 into the brake zone; Zugbremse into the service zone; Emergency at the far ends']};
fs.writeFileSync('tools/manual/trains/tsw-sbb-rabe523-rivet-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
