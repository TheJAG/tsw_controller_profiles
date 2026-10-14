// RhB Ge 4/4 II (Rivet Games for DTG, Arosalinie / RhB Anniversary Collection liveries), 2026-10-12. Own layout. Two cabs `_F` / `_B`; both GetActiveCab
// functions fail, so the F cab is wired by name. API probe (MasterKey_F on, reverser Forward): DrivingControlWheel_F is one handwheel for
// brake and power, rest Off 0.51 (0.48..0.53), electric brake continuous 0..0.47 (output -4..-0.5), power in 22 notches 0.55..1 (0.5 /
// 1 / 1.5 ... 10, the game snaps and moves one notch per set at times); Train_Vacuum_Brake_F Release 0.02 (sets 0.01..0.03; a set to 0
// gives Minimum) / Minimum 0.07 / continuous to 0.75 / Full service 0.8 (0.76..0.9) / Emergency 1 (0.91+); LocoBrake_F continuous 0..1;
// Reverser_F Reverse 0 / Neutral 0.5 / Forward 1. Key: MasterKey_F push button (On 1). No PZB: ZSI train protection with the
// ZSIAcknowledge_F push button and a deadman cut-out button.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679150';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/^RVM_GE44_ii/.test(n)&&!/_Base$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,t)=>[set('HeadlightSelector_F',h),set('TrainLightSwitch_F',t)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser_F (Reverse 0 / Neutral 0.5 / Forward 1; the zones take any value), inverted: Forward at the far end, Reverse nearest. Needs the master key (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser_F',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Handwheel DrivingControlWheel_F: electric brake continuous 0..0.47 / Off 0.51 / power 0.55..1 in 22 game notches (0.5 to 10). Inverted: full power at the far end (raw 0 ±0.04), power zone 0.05..0.44, Off 0.5 ±0.04, brake zone 0.56..0.93 (light to full), full brake 1 ±0.05 nearest',assignments:[{type:'direct_control',controls:'DrivingControlWheel_F',input_value:{min:0,max:1,steps:[0,null,0.51,null,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.05},{threshold:0.93,threshold_end:0.56},{threshold:0.5,threshold_tolerance:0.04},{threshold:0.44,threshold_end:0.05},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'RightThrottle',description:'Vacuum brake Train_Vacuum_Brake_F (Release 0.02 / Minimum 0.07 / continuous service to 0.75 / Full service 0.8 / Emergency 1), inverted as the Class 153 brake: Emergency at the far end, Release nearest. Emergency raw 0 ±0.05, Full 0.16 ±0.05, free zone 0.24..0.84 (full down to minimum), Minimum 0.9 ±0.03, Release 1 ±0.05',assignments:[{type:'direct_control',controls:'Train_Vacuum_Brake_F',input_value:{min:0.02,max:1,steps:[0.02,0.07,null,0.8,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.05},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.84,threshold_end:0.24},{threshold:0.16,threshold_tolerance:0.05},{threshold:0,threshold_tolerance:0.05}]}}]},
 {name:'FlapLever',description:'Loco brake LocoBrake_F (continuous 0..1), inverted: Full at the far end, Release nearest',assignments:[{type:'direct_control',controls:'LocoBrake_F',input_value:{min:0,max:1,invert:true}}]},
 {name:'ParkingBrake',description:'Master key MasterKey_F (MasterSwitch push button, On 1 / Off 0): PARK BRK up = key in',assignments:[pair('MasterKey_F',1,0)]},
 mom('GearLever','ZSI acknowledge (ZSIAcknowledge_F push button, held)','ZSIAcknowledge_F',1,0),
 mom('LeftThrottleButton','Sand (Sand_F push button)','Sand_F',1,0),
 mom('RightThrottleButton','Horn (Horn_F push button)','Horn_F',1,0),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 tog('LeftAuxButton','Deadman cut-out (Deadman_Cut-out_Button_F: Cut-Out 0 / Cut-In 1). Lit = cut out','Deadman_Cut-out_Button_F',0,1),
 {name:'RotaryCrank',description:'Wiper off (WiperLeft_F push button 0)',assignments:[set('WiperLeft_F',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (WiperLeft_F push button 1)',assignments:[set('WiperLeft_F',1)]},
 {name:'AutoBrake0',description:'Lights | Off (HeadlightSelector_F 0, train lights off 0.85)',assignments:lights(0,0.85)},
 {name:'AutoBrake1',description:'Lights | Headlights 1 (0.33)',assignments:lights(0.33,0.85)},
 {name:'AutoBrake2',description:'Lights | Headlights 2 (0.66)',assignments:lights(0.66,0.85)},
 {name:'AutoBrake3',description:'Lights | Headlights 3 (1)',assignments:lights(1,0.85)},
 {name:'AutoBrake4',description:'Lights | Headlights 3 and train lights on (TrainLightSwitch_F 0)',assignments:lights(1,0)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-rhb-ge44ii-rivet-thejag',title:'Ge 4/4 II',eyebrow:'Rhätische Bahn · Rivet Games · TCA Quadrant Airbus',profileName:p.name,developer:'Rivet Games',route:'Arosalinie: Chur – Arosa',colors:{navy:'#5a2a2e',blue:'#8a5a5e',red:'#eb0000',paper:'#f7f3f3'},logos:[{file:'../../assets/logo-rhb-maroon.svg',alt:'Rhätische Bahn'},{file:'../../assets/logo-rivet-maroon.png',alt:'Rivet Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/rhb-ge44ii-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Handwheel',continuous:true,notches:['Max power',null,'Off',null,'Max brake'],start:2},
 rightThrottle:{name:'Vacuum brake',continuous:true,notches:['Emergency','Full service',null,'Minimum','Release'],start:1},
 flap:{name:'Loco brake',continuous:true,notches:['Full',null,null,null,'Release'],start:0},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'ZSI ack.'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Headlights 1'},{short:'2',desc:'Headlights 2'},{short:'3',desc:'Headlights 3'},{short:'HI',desc:'+ train lights'}],start:1},
 eng1:null, eng2:null,
 leftAux:{name:'Deadman cut-out'}, rightAux:null,
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK up); pantograph, main switch and compressor in the cab','Reverser from Neutral to Forward','Deadman cut-out light out (left aux)','Lights to Headlights 3','Loco brake at Full, vacuum brake at Full service (parked); handwheel at Off'],
depart:['Close doors (RUD TRIM), check the signal','Vacuum brake to Release, then Minimum; loco brake to Release','Handwheel from Off into the power zone, notch by notch','Acknowledge the ZSI with the gear lever','Brake: handwheel back through Off into the electric brake zone, vacuum brake into the service zone; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-rhb-ge44ii-rivet-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
