// NJ Transit Arrow III (GE, DTG, Morristown Line), 2026-10-13. One cab per cab car, plain node names; IS_GetActiveCab false/false.
// Capture agent probe: NO separate reverser. Throttle (IrregularLever, -1..1) carries the direction: P-3 / P-2 / P-1 / Switch / Off
// (Reverse) at -1 / -0.8 / -0.6 / -0.4 / -0.2, Safety 0 (loads here), Off / Switch / P-1 / P-2 / P-3 (Forwards) at 0.2 / 0.4 / 0.6 / 0.8 / 1,
// no gates; held at Safety while ControlPlug (MasterSwitch push button, In 1) is Out (loads Out). AutomaticBrake_26C Release 0 / Minimum
// 0.125 / service continuous 0.2..0.64 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.85 / Emergency 1 (loads 0.65), free; the brake
// pipe only follows with AutomaticBrakeCutoutValve (Cut-In 1) set (loads Cut-Out). No independent brake. Loads cut out: AlerterCutOut
// (Normal 1), Fuse_PTC and Fuse_CabSignalAndSpeed (Cut-In 1), Horn_CutOutCock (Cut-In 1; the horn is dead without it). Horn spring lever
// (1), AlerterReset, DeadmanSwitch (reversible, loads released), Sander, Bell, PantographRaise push buttons; HeadlightSwitch Off 0 / Dim 0.5 /
// Bright 1, DitchLights Off 0 / Manual 0.5 / Auto 1, MarkerAndBullseyeLights 0 / 1, WiperControlValve_R continuous. Doors on guard panels
// (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680320';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=[{class_name:'RVM_MRT_NJT_ArrowIII_CabCarBase_C'}];
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const togA=(node,on,off)=>({type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:togA(node,on,off)});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const lights=(h,d,m)=>[set('HeadlightSwitch',h),set('DitchLights',d),set('MarkerAndBullseyeLights',m)];
p.controls=[
 {name:'LeftThrottle',description:'Master controller Throttle -1..1 with the direction built in: P-3 Rev -1 / P-2 Rev -0.8 / P-1 Rev -0.6 / Switch Rev -0.4 / Off Rev -0.2 / Safety 0 / Off Fwd 0.2 / Switch Fwd 0.4 / P-1 Fwd 0.6 / P-2 Fwd 0.8 / P-3 Fwd 1; inverted: P-3 Forwards at the far end, Safety in the middle, P-3 Reverse nearest; eleven even bands. Needs the control plug in (PARK BRK up)',assignments:[{type:'direct_control',controls:'Throttle',input_value:{min:-1,max:1,steps:[-1,-0.8,-0.6,-0.4,-0.2,0,0.2,0.4,0.6,0.8,1],invert:true}}]},
 {name:'RightThrottle',description:'Automatic brake AutomaticBrake_26C (Release 0 / Minimum 0.125 / service continuous 0.2..0.64 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.85 / Emergency 1), inverted: Emergency at the far end (raw 0 ±0.04), Handle Off 0.1, Suppression 0.2, Full Service 0.3, service zone 0.36..0.86, Minimum 0.9 ±0.03, Release 1 ±0.06 nearest',assignments:[{type:'direct_control',controls:'AutomaticBrake_26C',input_value:{min:0,max:1,steps:[0,0.125,null,0.65,0.7,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.9,threshold_tolerance:0.03},{threshold:0.86,threshold_end:0.36},{threshold:0.3,threshold_tolerance:0.04},{threshold:0.2,threshold_tolerance:0.04},{threshold:0.1,threshold_tolerance:0.04},{threshold:0,threshold_tolerance:0.04}]}}]},
 {name:'ParkingBrake',description:'Control plug ControlPlug (MasterSwitch In 1 / Out 0), brake cut-out valve AutomaticBrakeCutoutValve (Cut-In 1 / Cut-Out 0) and horn cut-out cock Horn_CutOutCock (Cut-In 1 / Cut-Out 0): PARK BRK up = plug in, brake and horn cut in; all three load out',assignments:[pair('ControlPlug',1,0),pair('AutomaticBrakeCutoutValve',1,0),pair('Horn_CutOutCock',1,0)]},
 mom('GearLever','Alerter reset (AlerterReset push button, held)','AlerterReset',1,0),
 mom('LeftThrottleButton','Sand (Sander push button, held)','Sander',1,0),
 mom('RightThrottleButton','Horn (Horn spring lever 1 while held, 0 released; needs the horn cock cut in)','Horn',1,0),
 {name:'LeftEngineOn',description:'Bell (Bell push button 1 while up, 0 when down)',assignments:[pair('Bell',1,0)]},
 {name:'RightEngineOn',description:'Deadman (DeadmanSwitch pressed 1 while up, released 0 when down)',assignments:[pair('DeadmanSwitch',1,0)]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'LeftAuxButton',description:'Cab signalling / PTC: Fuse_PTC and Fuse_CabSignalAndSpeed (Cut-In 1 / Cut-Out 0). Lit = cut in; both load cut out',assignments:[togA('Fuse_PTC',1,0),togA('Fuse_CabSignalAndSpeed',1,0)]},
 tog('RightAuxButton','Alerter (AlerterCutOut Normal 1 / Cut-Out 0). Lit = normal; loads cut out','AlerterCutOut',1,0),
 mom('RoundAuxButton','Pantograph raise (PantographRaise push button, held)','PantographRaise',1,0),
 {name:'RotaryCrank',description:'Wiper off (WiperControlValve_R 0)',assignments:[set('WiperControlValve_R',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (WiperControlValve_R 0.5)',assignments:[set('WiperControlValve_R',0.5)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0,0,0)},
 {name:'AutoBrake1',description:'Lights | Headlight dim (HeadlightSwitch 0.5)',assignments:lights(0.5,0,0)},
 {name:'AutoBrake2',description:'Lights | Headlight bright (1)',assignments:lights(1,0,0)},
 {name:'AutoBrake3',description:'Lights | Bright and ditch lights auto (DitchLights 1)',assignments:lights(1,1,0)},
 {name:'AutoBrake4',description:'Lights | Marker and bullseye lights only (this end trailing)',assignments:lights(0,0,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-njt-arrow3-dtg-thejag',title:'Arrow III',eyebrow:'NJ Transit · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Morristown Line: New York & Hoboken – Dover · Gladstone Branch',colors:{navy:'#1f3b52',blue:'#4d7593',red:'#c8102e',paper:'#f3f6f8'},logos:[{file:'../../assets/logo-njtransit-slate.svg',alt:'NJ Transit'},{file:'../../assets/logo-dtg-slate.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/njt-arrow3-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:null,
 leftThrottle:{name:'Master controller',notches:['P3 F','P2 F','P1 F','Sw F','Off F','Safety','Off R','Sw R','P1 R','P2 R','P3 R'],start:5},
 rightThrottle:{name:'Automatic brake',continuous:true,notches:['Emergency','Handle off','Suppression','Full service',null,'Minimum','Release'],start:3},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'Alerter'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Dim'},{short:'2',desc:'Bright'},{short:'3',desc:'+ ditch'},{short:'HI',desc:'Markers only'}],start:1},
 eng1:{name:'Bell',start:true}, eng2:{name:'Deadman',start:true},
 leftAux:{name:'PTC · cab signal'}, rightAux:{name:'Alerter'},
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'Pan raise'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Plug · brake · horn',flat:'out',up:'in'}},
setup:['PARK BRK up: control plug in, brake valve and horn cock cut in (all three load out)','PTC / cab signal and alerter on (aux squares lit; they load cut out)','Deadman: ENG 2 up','Lights to Bright','Automatic brake at Full service (parked), controller at Safety'],
depart:['Close doors (RUD TRIM), check the signal; bell (ENG 1)','Automatic brake to Release','Controller away from you from Safety: Off, Switch, P-1 … P-3 forwards (the near half is the same in reverse)','Reset the alerter with the gear lever','Brake: controller back to Off, automatic brake into the service zone; Emergency at the far end']};
fs.writeFileSync('tools/manual/trains/tsw-njt-arrow3-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
