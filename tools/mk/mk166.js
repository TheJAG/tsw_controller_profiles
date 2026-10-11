// GWR Class 166 Networker Turbo Express (DTG, Great Western Express), 2026-10-12. Derived from mk165.js: the capture is the same
// node set and the same notch values as the 165 (service 2R31 Paddington–Reading). One cab per driving car, no cab suffixes; GetActiveCab fails. Combined handle ThrottleAndBrake -1..1:
// Emergency -1 / Full service -0.75 / B2 -0.5 / B1 -0.25 / Off 0 / P1..P7 at 0.14 k (capture). Reverser -1 Reverse / Neutral
// (-0.5..0.49) / Forward (0.5..1.49) / Off (1.5..2): any value in a zone stores, so even steps -1 / 0 / 1 / 2.
const fs=require('fs');
const f=process.argv[2]; const dlc=process.argv[3]||'store.steampowered.com/app/4678820';
const p=JSON.parse(fs.readFileSync(f,'utf8'));
const t171=JSON.parse(fs.readFileSync('profiles/tsw-class-171-rivet-thejag-1791610728.json','utf8'));
const pak=fs.readFileSync('tools/pak_classes.txt','utf8').split(/\r?\n/).map(l=>l.trim().split(/\s+/)[1]).filter(n=>n&&/GWR_Class166/.test(n));
p.rail_class_information=[...new Set(pak)].map(c=>({class_name:c+'_C'}));
const by=n=>p.controls.find(c=>c.name===n);
const rm=n=>{const i=p.controls.findIndex(c=>c.name===n);if(i>=0)p.controls.splice(i,1);};
const tog=(name,desc,node,on,off)=>({name,description:desc,assignment:{type:'toggle',threshold:0.9,action_activate:{controls:node,value:on,hold:false,enable_api_fallback:true},action_deactivate:{controls:node,value:off,hold:false,enable_api_fallback:true}}});
// Combined handle on the LEFT throttle (Class 171 / 170 layout); Emergency left out on purpose, the eleven 171 bands on the TCA detents.
const t171lt=t171.controls.find(c=>c.name==='LeftThrottle').assignments[0].input_value;
rm('LeftThrottle'); rm('RightThrottle');
const steps=[-0.75,-0.5,-0.25,0,0.14,0.28,0.42,0.56,0.7,0.84,1];
if(t171lt.step_thresholds.length!==steps.length) throw new Error('171 bands do not fit');
p.controls.splice(1,0,{name:'LeftThrottle',description:'Power / brake handle ThrottleAndBrake (Full service -0.75 / B2 -0.5 / B1 -0.25 / Off 0 / P1..P7 at 0.14 k; Emergency -1 is left out on purpose). Plain, as the tested Class 171: Full service at the far end, P7 nearest; the eleven 171 bands (centred on the TCA detents)',assignments:[{type:'direct_control',controls:'ThrottleAndBrake (Irregular Lever)',input_value:{min:-0.75,max:1,steps,invert:t171lt.invert===true,step_thresholds:JSON.parse(JSON.stringify(t171lt.step_thresholds))}}]});
by('SpeedbrakeLever').description='Reverser (Reverse -1 / Neutral 0 / Forward 1 / Off 2, even steps inside the zones), inverted as the 171: Off at the far end';
by('SpeedbrakeLever').assignments[0].input_value={min:-1,max:2,steps:[-1,0,1,2],invert:true};
by('GearLever').description='AWS reset (AWS_Reset push button, held)';
// Horn lever runs -1 Low / 0 rest / 1 High
by('LeftEngineOn').description='Horn | High (WarningHorn lever 1, rest 0)'; by('LeftEngineOn').assignment.action_deactivate.value=0;
by('RightEngineOn').description='Horn | Low (WarningHorn lever -1, rest 0)'; by('RightEngineOn').assignment.action_activate.value=-1; by('RightEngineOn').assignment.action_deactivate.value=0;
by('RotaryCrank').description='Wipers one notch slower (WiperControl Off 0 / Min 0.2 / 0.4 / 0.6 / 0.8 / Max 1)';
by('RotaryIgnStart').description='Wipers one notch faster';
by('ParkingBrake').description='Master key (MasterKey toggle button, Unlocked 1 / Locked 0): PARK BRK up = key in';
const ins=(after,item)=>{const i=p.controls.findIndex(c=>c.name===after);p.controls.splice(i+1,0,item);};
ins('RudderTrimRight',tog('LeftAuxButton','TPWS / AWS isolation (TPWS_Isolate toggle button: Isolated 0 / Normal 1). Lit = isolated','TPWS_Isolate (Toggle Button)',0,1));
ins('LeftAuxButton',tog('RightAuxButton','DSD (vigilance) isolation (DSD_Isolate toggle button: Isolated 0 / Normal 1). Lit = isolated','DSD_Isolate (Toggle Button)',0,1));
p.controls.forEach(c=>{if(/^AutoBrake/.test(c.name)) c.description=c.description.replace('Headlights |','Headlights | '+'').replace('  ',' ');});
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
console.log(p.rail_class_information.map(c=>c.class_name).join(' '));
console.log(p.controls.map(c=>c.name+' :: '+c.description.slice(0,60)).join('\n'));
const m={name:'tsw-class-166-dtg-thejag',title:'Class 166',eyebrow:'Great Western Railway · Dovetail Games · TCA Quadrant Airbus',profileName:p.name,developer:'Dovetail Games',route:'Great Western Express: London Paddington – Reading',colors:{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},logos:[{file:'../../assets/logo-gwr-navy.svg',alt:'Great Western Railway'},{file:'../../assets/logo-dtg-navy.png',alt:'Dovetail Games'}],dlc,credit:'© TheJAG',cab:{file:'../../assets/class-166-dtg-cab.jpg',height:196,position:'50% 50%'},
controls:{
 speedbrake:{name:'Reverser',notches:['Off','Forward','Neutral','Reverse'],start:0},
 leftThrottle:{name:'Power / brake',notches:['Full service','B2','B1','Off','P1','P2','P3','P4','P5','P6','P7'],start:0},
 rightThrottle:null, flap:null,
 leftThrottleButton:null, rightThrottleButton:{name:'Engine start'}, gearLever:{name:'AWS reset'},
 autoBrk:{name:'Headlights',positions:[{short:'0',desc:'–'},{short:'BTV',desc:'Off'},{short:'LO',desc:'Day'},{short:'2',desc:'Marker only'},{short:'3',desc:'Night'},{short:'HI',desc:'Tail only'}],start:1},
 eng1:{name:'Horn high',start:true}, eng2:{name:'Horn low',start:true},
 leftAux:{name:'TPWS / AWS isolation'}, rightAux:{name:'DSD isolation'},
 modeSwitch:{name:'Wipers',left:'slower',right:'faster'}, roundAux:{name:'Guard buzzer'}, rudTrim:{name:'Doors L / R'},
 parkBrk:{name:'Master key',flat:'out',up:'in'}},
setup:['Master key in (PARK BRK)','Start the engine (right throttle button)','Reverser from Off to Neutral','Check the TPWS / AWS and DSD isolation lights are out; DRA in the cab','Headlights to Day','Open doors (RUD TRIM)'],
depart:['Close doors, wait for the guard buzzer (round aux)','Check the signal and release the DRA','Reverser to Forward','Handle from Full service through Off to P1','Notch up to P7 as speed rises','Acknowledge AWS with the gear lever']};
fs.writeFileSync('tools/manual/trains/tsw-class-166-dtg-thejag.json',JSON.stringify(m,null,2)+'\n');console.log('manual data ok');
