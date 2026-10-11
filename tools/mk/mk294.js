// DB BR 294 V 90 shunter (DTG, Leipzig – Dresden), 2026-10-12. Derived from mk363.js.
// One cab with two desks, per-desk nodes `_L` / `_R` (left desk wired, the one in the photo); no GetActiveCab. The combined
// controller PBC_L is incremental: Apply brake -1 (spring) / Hold brake -0.5 / Release brake-decrease power 0 / Hold power 0.5 /
// Increase power 1 (spring); a set to an end pulses and the handle falls back to the hold notch (API probe). ReverserProxy is the
// reverser (0 / 0.5 / 1). TrainBrake is a self-lapping valve Release 0 / Hold 0.5 / Apply 1 (one gate per set). BrakeSelection_L
// (loco / train brake for the PBC) and FineControlValve do not take API sets and stay in the cab.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4680330';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/BR294$/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const set=(node,v)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:v,hold:false}});
const F=['Headlight_FC','Headlight_FL','Headlight_FR'], B=['Headlight_BC','Headlight_BL','Headlight_BR'];
// Headlight_FC/BC: On 0 / Off 0.5 / On 1; Headlight_FL/FR/BL/BR: Tail light 0 / Off 0.5 / Headlight 1.
const lights=(fc,fl,bc,bl)=>[set('Headlight_FC',fc),set('Headlight_FL',fl),set('Headlight_FR',fl),set('Headlight_BC',bc),set('Headlight_BL',bl),set('Headlight_BR',bl)];
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser through ReverserProxy (Reverse 0 / Neutral 0.5 / Forward 1), inverted: Forward at the far end',assignments:[{type:'direct_control',controls:'ReverserProxy',input_value:{min:0,max:1,steps:[0,0.5,1],invert:true}}]},
 {name:'LeftThrottle',description:'Fahr-/Bremsschalter PBC_L, incremental: Apply brake -1 (spring) / Hold brake -0.5 / Release brake, decrease power 0 / Hold power 0.5 / Increase power 1 (spring). Push the TCA to the far end to raise power, back one band to hold it; pull past the centre to brake the same way (which brake the brake side works on is set with BrakeSelection in the cab). Inverted: Increase raw 0 ±0.06, Hold power 0.25 ±0.12, Release / decrease 0.5 ±0.1, Hold brake 0.75 ±0.12, Apply brake 1 ±0.06',assignments:[{type:'direct_control',controls:'PBC_L',input_value:{min:-1,max:1,steps:[-1,-0.5,0,0.5,1],invert:true,step_thresholds:[{threshold:1,threshold_tolerance:0.06},{threshold:0.75,threshold_tolerance:0.12},{threshold:0.5,threshold_tolerance:0.1},{threshold:0.25,threshold_tolerance:0.12},{threshold:0,threshold_tolerance:0.06}]}}]},
 {name:'RightThrottle',description:'Führerbremsventil TrainBrake, self-lapping (Release 0 / Hold 0.5 / Apply 1; one gate per set), plain: Release at the far end, Apply nearest: Release 0 ±0.2, Hold 0.5 ±0.2, Apply 1 ±0.2',assignments:[{type:'direct_control',controls:'TrainBrake',input_value:{min:0,max:1,steps:[0,0.5,1],step_thresholds:[{threshold:0,threshold_tolerance:0.2},{threshold:0.5,threshold_tolerance:0.2},{threshold:1,threshold_tolerance:0.2}]}}]},
 {name:'ParkingBrake',description:'Desk take-over (PanelTakeOver_L, MasterSwitch push button): pressed when PARK BRK goes up',assignments:[{type:'momentary',threshold:0.9,action_activate:{controls:'PanelTakeOver_L',value:1,hold:false,enable_api_fallback:true},action_deactivate:{controls:'PanelTakeOver_L',value:0,hold:false,enable_api_fallback:true}}]},
 key('GearLever','SiFa reset','Q'),
 mom('LeftThrottleButton','Sand (Sand_L push button)','Sand_L',1,0),
 mom('RightThrottleButton','Horn (OverchargeBrakeHorn_L spring lever: Horn 1, rest 0.5, Overcharge 0)','OverchargeBrakeHorn_L',1,0.5),
 mom('LeftEngineOn','PZB Frei (PZB_Release_L spring lever)','PZB_Release_L',1,0.5),
 mom('RightEngineOn','PZB Wachsam (PZB_Acknowledge_L spring lever)','PZB_Acknowledge_L',1,0.5),
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 mom('RoundAuxButton','PZB Befehl 40 (PZB_Override_L spring lever)','PZB_Override_L',1,0.5),
 tog('LeftAuxButton','SiFa fuse (Fuse_Sifa push button, On 1 / Off 0). Lit = on','Fuse_Sifa',1,0),
 tog('RightAuxButton','PZB breaker (PZB_Breaker push button, On 1 / Off 0). Lit = on','PZB_Breaker',1,0),
 {name:'RotaryCrank',description:'Wiper off (WiperValve_FL)',assignments:[set('WiperValve_FL',0)]},
 {name:'RotaryIgnStart',description:'Wiper on (WiperValve_FL)',assignments:[set('WiperValve_FL',1)]},
 {name:'AutoBrake0',description:'Lights | Off',assignments:lights(0.5,0.5,0.5,0.5)},
 {name:'AutoBrake1',description:'Lights | Front: two headlights',assignments:lights(0.5,1,0.5,0.5)},
 {name:'AutoBrake2',description:'Lights | Front: three headlights',assignments:lights(1,1,0.5,0.5)},
 {name:'AutoBrake3',description:'Lights | Front three headlights, rear tail lights',assignments:lights(1,1,0.5,0)},
 {name:'AutoBrake4',description:'Lights | Front and rear: three headlights each (shunting)',assignments:lights(1,1,1,1)},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-br-294-dtg-thejag',title:'BR 294',eyebrow:'DB Cargo · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Bahnstrecke Leipzig – Dresden',colors:{navy:'#3a3d4d',blue:'#ec0016',red:'#ec0016',paper:'#f6f4f4'},logos:[{file:'../../assets/logo-db-grey.png',alt:'Deutsche Bahn'},{file:'../../assets/logo-dtg-dbgrey.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/br-294-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward','Neutral','Reverse'],start:1},
 leftThrottle:{name:'Fahr-/Bremsschalter',notches:['Increase','Hold power','Release','Hold brake','Apply'],start:3},
 rightThrottle:{name:'Führerbremsventil',notches:['Release','Hold','Apply'],start:1},
 flap:null,
 leftThrottleButton:{name:'Sand'}, rightThrottleButton:{name:'Horn'}, gearLever:{name:'SiFa reset'},
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Front 2'},{short:'2',desc:'Front 3'},{short:'3',desc:'Front 3 + tail'},{short:'HI',desc:'Front + rear 3'}],start:1},
 eng1:{name:'PZB Frei',start:true}, eng2:{name:'PZB Wachsam',start:true},
 leftAux:{name:'SiFa on / off'}, rightAux:{name:'PZB on / off'},
 modeSwitch:{name:'Wiper',left:'off',right:'on'}, roundAux:{name:'PZB Befehl 40'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Desk take-over',flat:'–',up:'press'}},
setup:['Battery, engine start and the gear selector (Long distance / Towing / Shunting) in the cab','Take the left desk over: PARK BRK up (PanelTakeOver), then sit at that desk','Reverser from Neutral to Forward','SiFa and PZB on (aux squares), PZB mode in the cab','Lights to Front 3 or Front + rear for shunting','Brake selection (loco / train brake) in the cab; no AFB, the flap lever is free'],
depart:['Check the signal and PZB, release the handbrake in the cab','Führerbremsventil to Release (far end), wait for the brakes to release','Fahr-/Bremsschalter: push to Increase to raise power, back to Hold power to keep it','Acknowledge SiFa with the gear lever, PZB with the ENG switches','Brake: pull the handle past the centre to Apply (pulse) and Hold brake, or the Führerbremsventil to Apply','Stop: Führerbremsventil to Apply, handle to Release / decrease']};
fs.writeFileSync('tools/manual/trains/tsw-br-294-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
