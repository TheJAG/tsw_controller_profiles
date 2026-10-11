// DB Cargo Vossloh G6 (Train Sim Germany, "DB G6 Shunter" layer on Hauptstrecke Hamburg – Lübeck), 2026-10-12. Derived from mk365.js / mk294.js.
// Centre cab with a Front and a Rear desk (nodes ...Front / ...Rear, ...F / ...B); IS_GetActiveCab and GetActiveCab both fail, so the
// Front desk (the one in the photo) is wired by name. The main levers are TSG blueprint classes (BP_TSG_Vossloh_G6_*) that
// capture_train.js skips, probed by hand: ThrottleHandleFront is a self-lapping joystick, rest 0.5 = Off, notches 0 Brake + (spring) /
// 0.15 Brake hold / 0.3 Locked / 0.5 Off / 0.7 Throttle - / 0.85 Throttle hold / 1 Throttle + (spring), one gate per set, the spring
// ends never stored through the API; TrainBrakeFront and LocoBrakeFront store 0.25 Release / 0.5 Hold / 0.75 Apply, one gate per
// set, their Quick release / Emergency and Release fast / Apply fast ends never stored. ReverserF is a display only (bInputEnabled
// false): the direction (Property.CurrentDirectionSelected -1 / 0 / 1) toggles with one press of the push buttons ReverserFF
// (Forward on / off) and ReverserFR (Reverse on / off), so the reverser goes on the mode switch and the speedbrake lever is free.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679310';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/Vossloh_G6$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const press=(name,desc,node)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:0,hold:false,enable_api_fallback:true}}});
const three=[{threshold:0,threshold_tolerance:0.2},{threshold:0.5,threshold_tolerance:0.2},{threshold:1,threshold_tolerance:0.2}];
p.controls=[
 {name:'LeftThrottle',description:'Fahr-/Bremsjoystick ThrottleHandleFront (Brake + 0 spring / Brake hold 0.15 / Locked 0.3 / Off 0.5 / Throttle - 0.7 / Throttle hold 0.85 / Throttle + 1 spring; one gate per set), inverted: Throttle + at the far end, Brake + nearest. Bands on the raw axis: Throttle + 0 ±0.08, Throttle hold 0.167 ±0.06, Throttle - 0.333 ±0.06, Off 0.5 ±0.09, Locked 0.68 ±0.07, Brake hold 0.833 ±0.06, Brake + 1 ±0.08',assignments:[{type:'direct_control',controls:'ThrottleHandleFront',input_value:{min:0,max:1,steps:[0,0.15,0.3,0.5,0.7,0.85,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.08},{threshold:0.833,threshold_tolerance:0.06},{threshold:0.68,threshold_tolerance:0.07},{threshold:0.5,threshold_tolerance:0.09},{threshold:0.333,threshold_tolerance:0.06},{threshold:0.167,threshold_tolerance:0.06},{threshold:0,threshold_tolerance:0.08}]}}]},
 {name:'RightThrottle',description:'Führerbremsventil TrainBrakeFront (Release 0.25 / Hold 0.5 / Apply 0.75, one gate per set; Quick release 0 and Emergency 1 are spring ends that never stored), plain: Release at the far end, Apply nearest: Release 0 ±0.2, Hold 0.5 ±0.2, Apply 1 ±0.2',assignments:[{type:'direct_control',controls:'TrainBrakeFront',input_value:{min:0.25,max:0.75,steps:[0.25,0.5,0.75],step_thresholds:three}}]},
 {name:'FlapLever',description:'Zusatzbremse LocoBrakeFront (Release 0.25 / Hold 0.5 / Apply 0.75, one gate per set; Release fast 0 and Apply fast 1 never stored), plain: Release at the far end, Apply nearest: Release 0 ±0.2, Hold 0.5 ±0.2, Apply 1 ±0.2',assignments:[{type:'direct_control',controls:'LocoBrakeFront',input_value:{min:0.25,max:0.75,steps:[0.25,0.5,0.75],step_thresholds:three}}]},
 {name:'ParkingBrake',description:'Battery key BatteryKey (MasterSwitch push button, Inserted 1 / Removed 0): PARK BRK up = key in',assignments:[{type:'momentary',threshold:0.9,action_activate:{controls:'BatteryKey',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'BatteryKey',value:0,hold:false,enable_api_fallback:true}}]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (SanderSwitchF spring lever, On 1 / 0)','SanderSwitchF',1,0),
 mom('RightThrottleButton','Horn high (HornSwitchF spring lever: Low -1 / rest 0.5 / High 1)','HornSwitchF',1,0.5),
 mom('LeftEngineOn','PZB Frei (PZBReleaseFront spring lever)','PZBReleaseFront',1,0.5),
 mom('RightEngineOn','PZB Wachsam (PZBAcknowledgeFront spring lever)','PZBAcknowledgeFront',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (PZBOverrideFront spring lever)','PZBOverrideFront',1,0.5),
 tog('LeftAuxButton','SiFa on / off (SifaOnOffKey push button, Activated 1 / Deactivated 0; it drives the SIFAOnOffSwitch under its cap). Lit = on. The loco loads with the SiFa off','SifaOnOffKey',1,0),
 tog('RightAuxButton','PZB on / off (PZBOnOffKey push button, Activated 1 / Deactivated 0; it drives the PZBOnOffSwitch; PZBModeSwitch U / M / O stays in the cab). Lit = on. The loco loads with the PZB off','PZBOnOffKey',1,0),
 press('RotaryCrank','Direction Reverse on / off: one press of ReverserFR (1 then 0) toggles CurrentDirectionSelected between -1 and 0','ReverserFR'),
 press('RotaryIgnStart','Direction Forward on / off: one press of ReverserFF (1 then 0) toggles CurrentDirectionSelected between 1 and 0','ReverserFF'),
 {name:'AutoBrake0',description:'Lights | Off (HeadlightSwitch 0)',assignments:[set('HeadlightSwitch',0)]},
 {name:'AutoBrake1',description:'Lights | Front (HeadlightSwitch 0.25)',assignments:[set('HeadlightSwitch',0.25)]},
 {name:'AutoBrake2',description:'Lights | Rear (HeadlightSwitch 0.125)',assignments:[set('HeadlightSwitch',0.125)]},
 {name:'AutoBrake3',description:'Lights | Shunting, both ends (HeadlightSwitch 0.875)',assignments:[set('HeadlightSwitch',0.875)]},
 {name:'AutoBrake4',description:'Lights | Automatic (HeadlightSwitch 1, follows the direction)',assignments:[set('HeadlightSwitch',1)]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-g6-tsg-thejag',title:'Vossloh G6',eyebrow:'DB Cargo · Train Sim Germany · TCA Quadrant Airbus',profileName:p.name,developer:'Train Sim Germany',route:'Hauptstrecke Hamburg – Lübeck',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-tsg-dbgrey.png',alt:'Train Sim Germany'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/g6-tsg-cab.jpg',height:196,position:'50% 50%'},schematicHeight:540,
controls:{
 speedbrake:null,
 leftThrottle:{name:'Fahr-/Bremsjoystick',notches:['Throttle +','Throttle hold','Throttle −','Off','Locked','Brake hold','Brake +'],start:3},
 rightThrottle:{name:'Führerbremsventil',notches:['Release','Hold','Apply'],start:2},
 flap:{name:'Zusatzbremse',notches:['Release','Hold','Apply'],start:1},
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Front'},{short:'2',desc:'Rear'},{short:'3',desc:'Shunting'},{short:'HI',desc:'Automatic'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Direction',left:'reverse',right:'forward'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Battery key',flat:'out',up:'in'}},
setup:['Battery key in (PARK BRK); engine start, gear and HLL cut-off valve in the cab','SiFa and PZB on (aux squares; both load off), PZB mode in the cab','Direction: mode switch right once = Forward (again = off), left = Reverse; the speedbrake lever is free','Lights to Front, Shunting or Automatic','Zusatzbremse at Hold, Führerbremsventil at Apply'],
depart:['Check the signal and PZB, release the parking brake in the cab','Führerbremsventil to Release (far end), Zusatzbremse to Release','Joystick: push to Throttle hold, pulse Throttle + (spring) at the far end to raise power','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: joystick back through Off to Brake hold, pulse Brake + (spring) nearest you; or the valve to Apply','Emergency and quick release: only in the cab (spring ends of the valve)']};
fs.writeFileSync('tools/manual/trains/tsw-g6-tsg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
