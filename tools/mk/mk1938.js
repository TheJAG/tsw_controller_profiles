// London Underground 1938 Tube Stock (RIVET GAMES, Bakerloo Line "1938 Heritage Tube Stock Timetable"), 2026-10-12. Own tube layout.
// One cab, no suffixes; IS_GetActiveCab fails. Capture agent probe: MasterController (Throttle) power only, Off 0 / Shunting 0.3333 /
// Full Series 0.6667 / Full Parallel 1 (moves without any key); DriversBrake (AutomaticBrake, 0..2): continuous 0..1 (Released 0 / EP Hold
// 0.25 / EP Min 0.5 / EP Normal 0.75 / EP Max 1, output = 4 x input) then notches Westinghouse Hold 1.3333 / Westinghouse Charge 1.6667 /
// Emergency 2 (loads EP Max); Reverser (SimpleLever) Reverse 0 / Off 0.3333 / Forward 1 0.6667 / Forward 2 1, moves with ReverserKey
// (MasterSwitch push button, IN 1), MasterKey (IN 1) and MasterKeyLever (1) set, but LOCKED after the sweep (an Emergency application or the
// controller moved with the reverser Off may latch it; a reload clears it, untested). DeadmansHandleButton push button; Horn push button (the
// whistle); Headlight_ON / _OFF, InstrumentLights_ON / _OFF, PassLights_ON / _OFF, Wiper_ON / _OFF command push buttons (as the Class 483);
// ColdStart / ColdStop (CircuitBreaker); Handbrake lever Releasing -1 / Released 0 / Applying 1; doors DoorsOpen/Close_L/R (keys y / u).
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4679240';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
p.rail_class_information=['RVM_BKR_LUL_38Stock_C','RVM_BKR_LUL_38Stock_BR_C','RVM_BKR_LUL_38Stock_D_BR_C','RVM_BKR_LUL_38Stock-D_C','RVM_BKR_LUL_38Stock-D_BR_C'].map(c=>({class_name:c}));
const mom=(name,desc,node,on,off,hold=true)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{controls:node,value:on,hold},action_deactivate:{controls:node,value:off,hold:false}}});
const key=(name,desc,k)=>({name,description:desc,assignment:{type:'momentary',threshold:0.9,action_activate:{keys:k}}});
const pair=(node,onV,offV)=>({type:'momentary',threshold:0.9,action_activate:{controls:node,value:onV,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:offV,hold:false,enable_api_fallback:true}});
const press=node=>pair(node,1,0); // command push button: 0 -> 1 presses it, the release back to 0 is harmless
p.controls=[
 {name:'SpeedbrakeLever',description:'Reverser (Reverse 0 / Off 0.3333 / Forward 1 0.6667 / Forward 2 1; any value in a zone), inverted: Forward 2 at the far end, Reverse nearest. Needs the reverser key, master key and key lever (PARK BRK up)',assignments:[{type:'direct_control',controls:'Reverser',input_value:{min:0,max:1,steps:[0,0.3333,0.6667,1],invert:true}}]},
 {name:'LeftThrottle',description:'Master controller MasterController (Off 0 / Shunting 0.3333 / Full Series 0.6667 / Full Parallel 1), plain: Off at the far end, Full Parallel nearest',assignments:[{type:'direct_control',controls:'MasterController',input_value:{min:0,max:1,steps:[0,0.3333,0.6667,1]}}]},
 {name:'RightThrottle',description:'Driver’s brake DriversBrake 0..2 (Released 0 / EP Hold 0.25 / EP Min 0.5 / EP Normal 0.75 / EP Max 1 / Westinghouse Hold 1.3333 / Westinghouse Charge 1.6667 / Emergency 2), eight even bands, inverted: Emergency at the far end, Released nearest',assignments:[{type:'direct_control',controls:'DriversBrake',input_value:{min:0,max:2,steps:[0,0.25,0.5,0.75,1,1.3333,1.6667,2],invert:true}}]},
 {name:'ParkingBrake',description:'Cab in: ReverserKey IN 1 / 0, MasterKey IN 1 / 0, MasterKeyLever 1 / 0 and the DeadmansHandleButton pressed 1 / released 0. PARK BRK up = keys in, deadman held',assignments:[pair('ReverserKey',1,0),pair('MasterKey',1,0),pair('MasterKeyLever',1,0),pair('DeadmansHandleButton',1,0)]},
 mom('RightThrottleButton','Whistle (Horn push button)','Horn',1,0),
 {name:'LeftEngineOn',description:'Cold start (ColdStart push button, CircuitBreaker: pressed while up)',assignments:[press('ColdStart')]},
 key('RudderTrimLeft','Doors | Left','y'),
 key('RudderTrimRight','Doors | Right','u'),
 {name:'RotaryCrank',description:'Wipers off (Wiper_OFF push button)',assignments:[press('Wiper_OFF')]},
 {name:'RotaryIgnStart',description:'Wipers on (Wiper_ON push button)',assignments:[press('Wiper_ON')]},
 {name:'AutoBrake0',description:'Lights | Headlights off (Headlight_OFF), instrument lights off',assignments:[press('Headlight_OFF'),press('InstrumentLights_OFF')]},
 {name:'AutoBrake1',description:'Lights | Headlights on (Headlight_ON)',assignments:[press('Headlight_ON')]},
 {name:'AutoBrake2',description:'Lights | Headlights and instrument lights on',assignments:[press('Headlight_ON'),press('InstrumentLights_ON')]},
 {name:'AutoBrake3',description:'Lights | Headlights, instrument and saloon lights on',assignments:[press('Headlight_ON'),press('InstrumentLights_ON'),press('PassLights_ON')]},
 {name:'AutoBrake4',description:'Lights | Saloon lights only (headlights off)',assignments:[press('Headlight_OFF'),press('PassLights_ON')]},
];
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
const m={name:'tsw-lu-1938-rivet-thejag',title:'1938 Tube Stock',eyebrow:'London Underground · Rivet Games · TCA Quadrant Airbus',profileName:p.name,developer:'Rivet Games',route:'Bakerloo Line: Harrow & Wealdstone – Elephant & Castle',logos:[{file:'../../assets/logo-lu-roundel-navy.svg',alt:'London Underground'},{file:'../../assets/logo-rivet-navy.png',alt:'Rivet Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/lu-1938-rivet-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Forward 2','Forward 1','Off','Reverse'],start:2},
 leftThrottle:{name:'Master controller',notches:['Off','Shunting','Series','Parallel'],start:0},
 rightThrottle:{name:'Driver’s brake',notches:['Emergency','W. charge','W. hold','EP max','EP normal','EP min','EP hold','Released'],start:3},
 flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Whistle'}, gearLever:null,
 autoBrk:{name:'Lights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Headlights'},{short:'2',desc:'+ instruments'},{short:'3',desc:'+ saloon'},{short:'HI',desc:'Saloon only'}],start:1},
 eng1:{name:'Cold start',start:true}, eng2:null,
 leftAux:null, rightAux:null,
 modeSwitch:{name:'Wipers',left:'off',right:'on'}, roundAux:null, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Keys + deadman',flat:'out',up:'in'}},
setup:['PARK BRK up: reverser key, master key and key lever in, deadman held','Reverser from Off to Forward 1 (Forward 2 for full speed)','Lights to Headlights','Driver’s brake at EP max (parked), controller Off'],
depart:['Close doors (RUD TRIM), check the signal','Brake to Released; controller to Shunting, then Full series, Full parallel','Brake: EP hold to EP max for the stop; Westinghouse hold and charge beyond; Emergency at the far end','Cold start on ENG 1 if the train is dead']};
fs.writeFileSync('tools/manual/trains/tsw-lu-1938-rivet-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
