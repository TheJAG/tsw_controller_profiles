// Scaffold a schematic-manual data file (tools/manual/trains/<name>.json) from a profile and its capture.
// Usage (from repo root):
//   node tools/draft_manual.js profiles/<file>.json [--capture tools/captures/<Class>.json] [--family uk-dmu]
//        [--operator "NS"] [--route "Zwolle – Groningen"] [--logo ../../assets/logo-ns.png] [--diagram ../../assets/x.png --source "Drawing: ..."]
//        [--dlc store.steampowered.com/app/...] [--flip] [--out file]
// Notch pills are listed top to bottom; top = TCA lever pushed fully forward = raw axis 1 (Class 153 cab test, 2026-10-10),
// so a plain lever shows the game's last notch at the top and an inverted lever its notch 0. --flip reverses that.
// The capture is found by the profile's rail classes when --capture is omitted. Checklists and the eyebrow come from
// the family's manual (tools/families.json) and are marked in _todo for you to rewrite.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const argv=process.argv.slice(2); const opt={}; const pos=[];
for(let i=0;i<argv.length;i++){const a=argv[i]; if(a==='--flip') opt.flip=true; else if(a.startsWith('--')) opt[a.slice(2)]=argv[++i]; else pos.push(a);}
if(!pos[0]){console.error('usage: node tools/draft_manual.js profiles/<file>.json [--capture x.json] [--family uk-dmu] [--operator ..] [--route ..] [--logo ..] [--diagram .. --source ..] [--dlc ..] [--flip]');process.exit(1);}
const prof=JSON.parse(fs.readFileSync(pos[0],'utf8'));
const fam=JSON.parse(fs.readFileSync(path.join(__dirname,'families.json'),'utf8'));
const todo=[];
// capture lookup
let cap=null;
if(opt.capture) cap=JSON.parse(fs.readFileSync(opt.capture,'utf8'));
else { const dir=path.join(__dirname,'captures'); const classes=new Set((prof.rail_class_information||[]).map(c=>c.class_name));
  for(const f of fs.existsSync(dir)?fs.readdirSync(dir):[]) if(classes.has(f.replace(/\.json$/,''))){cap=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));break;} }
if(!cap) todo.push('no capture found: notch names are placeholders');
const famCfg=opt.family?fam.families[opt.family]:null;
const famManual=famCfg&&fs.existsSync(path.join(root,famCfg.manual))?JSON.parse(fs.readFileSync(path.join(root,famCfg.manual),'utf8')):null;
// The TCA levers report raw 1 when pushed fully forward (user cab test on the Class 153, 2026-10-10), so the top pill is raw 1:
// a plain lever shows the game's last notch on top (Class 153: 7), an inverted lever its notch 0 (reverser: Off).
const TOP_IS_RAW_ONE=!opt.flip;

const ctl=n=>prof.controls.find(c=>c.name===n);
const assigns=c=>c?(c.assignments||[c.assignment]).filter(Boolean):[];
const descName=c=>(c&&c.description||'').replace(/\s*\(.*\)\s*$/,'').replace(/\s*\|.*$/,'').trim();
const pair=cap&&cap.cab&&cap.cab.pair;
const concrete=n=>{ if(!cap) return null; const b=n.replace(/^\{SIDE:[^}]*\}_/,''); if(/^\{SIDE/.test(n)&&pair) return cap.levers[pair[0]+'_'+b]?pair[0]+'_'+b:pair[1]+'_'+b; return b; };
const near=(steps,v)=>{let k=0;for(let i=0;i<steps.length;i++) if(Math.abs(steps[i]-v)<Math.abs(steps[k]-v)) k=i;return k;};

function leverEntry(ctrlName){
  const c=ctl(ctrlName); if(!c) return null;
  const a=assigns(c).find(x=>x.type==='direct_control'); if(!a) return null;
  const iv=a.input_value||{}; const inv=!!iv.invert; const lever=cap&&cap.levers[concrete(a.controls)];
  let names=lever&&lever.swept?lever.notches.map(n=>n.name||('#'+n.index)):null;
  let steps=iv.steps||(lever&&lever.swept?lever.notches.map(n=>n.snapped):null);
  if(!names){ const m=/\((.*)\)\s*$/.exec(c.description||''); names=m?m[1].split(' / '):(steps?steps.map((_,i)=>'notch '+i):['max','min']); if(!m) todo.push(ctrlName+': notch names unknown'); }
  let start=null;
  if(lever&&steps&&steps.length===names.length){ start=near(steps,lever.inputValue); }
  // orientation: top of the pill column = raw 1 = game notch 0 when inverted, game last notch otherwise
  const gameOrderOnTop=TOP_IS_RAW_ONE?inv:!inv;
  let list=names.slice(); if(!gameOrderOnTop){ list.reverse(); if(start!=null) start=names.length-1-start; }
  if(steps&&iv.steps&&steps.some(s=>s===null)) todo.push(ctrlName+': lever has free zones, check the pill list');
  return {name:descName(c)||ctrlName,notches:list,start};
}
const buttonEntry=(n,extra)=>{const c=ctl(n); return c?Object.assign({name:descName(c)},extra||{}):null;};
function autoBrk(){
  const ab=[0,1,2,3,4].map(i=>ctl('AutoBrake'+i)); if(!ab.some(Boolean)) return null;
  const shorts=['0','BTV','LO','2','3','HI']; const positions=shorts.map(s=>({short:s,desc:'–'}));
  let name='Headlights';
  ab.forEach((c,i)=>{ if(!c) return; const d=c.description||''; const m=/^(.*?)\s*\|\s*(.*)$/.exec(d); if(m){name=m[1];positions[i+1].desc=m[2];} else positions[i+1].desc=d; });
  return {name,positions,start:1};
}
function eng(n){const c=ctl(n); if(!c) return null; const d=c.description||''; return {name:d.replace(/\s*\|\s*/,' ').replace(/\s*\(.*\)$/,'').trim(),start:true};}
function modeSwitch(){const l=ctl('RotaryCrank'),r=ctl('RotaryIgnStart'); if(!l&&!r) return null; const d=((l||r).description||'');
  if(/wiper/i.test(d)) return {name:'Wipers',left:'slower',right:'faster'}; return {name:descName(l||r),left:descName(l)||'–',right:descName(r)||'–'};}
function rudTrim(){const l=ctl('RudderTrimLeft'),r=ctl('RudderTrimRight'); if(!l&&!r) return null; if(l&&r&&/door/i.test(l.description||'')) return {name:'Doors L / R'}; return {name:[descName(l),descName(r)].filter(Boolean).join(' / ')};}
function parkBrk(){const c=ctl('ParkingBrake'); if(!c) return null; const fm=famManual&&famManual.controls&&famManual.controls.parkBrk; return {name:descName(c),flat:fm?fm.flat:'off',up:fm?fm.up:'on'};}

const title=(prof.name.split('|')[1]||prof.name).trim();
const devCode=(prof.name.split('|')[2]||'').trim().toLowerCase();
const devNames={dtg:'Dovetail Games',rivet:'Rivet Games',tsg:'Train Sim Germany',firefly:'Firefly Studios',vs:'Vector Simulations',rt:'Running Train'};
const developer=devNames[devCode]||devCode;
const name=path.basename(pos[0]).replace(/-\d+\.json$/,'');
const operator=opt.operator||(famManual&&famManual.eyebrow.split(' · ')[0])||'OPERATOR';
if(!opt.operator) todo.push('operator name (eyebrow) is a placeholder');
if(!opt.route) todo.push('route is a placeholder');
if(!opt.diagram) todo.push('no side-view drawing yet (diagram)');
if(!opt.logo) todo.push('no operator logo yet (logos[0])');
const logos=[]; if(opt.logo) logos.push({file:opt.logo,alt:operator}); logos.push({file:'../../assets/logo-dtg.jpg',alt:'Dovetail Games'});
if(devCode!=='dtg') todo.push('developer logo: logos[1] is the DTG logo, replace for '+developer);
const out={
  _todo:todo,
  name,title,eyebrow:operator+' · '+developer+' · TCA Quadrant Airbus',profileName:prof.name,developer,route:opt.route||'ROUTE',
  colors:famManual&&famManual.colors||{navy:'#223261',blue:'#4a66a8',paper:'#f3f5f9'},
  logos,diagram:opt.diagram?{file:opt.diagram,source:opt.source||'Drawing: Wikimedia Commons'}:null,
  dlc:opt.dlc||(famManual&&famManual.dlc)||'store.steampowered.com/app/4678800',credit:'© TheJAG',
  controls:{
    speedbrake:leverEntry('SpeedbrakeLever'),leftThrottle:leverEntry('LeftThrottle'),rightThrottle:leverEntry('RightThrottle'),flap:leverEntry('FlapLever'),
    leftThrottleButton:buttonEntry('LeftThrottleButton'),rightThrottleButton:buttonEntry('RightThrottleButton'),gearLever:buttonEntry('GearLever'),
    autoBrk:autoBrk(),eng1:eng('LeftEngineOn'),eng2:eng('RightEngineOn'),leftAux:buttonEntry('LeftAuxButton'),rightAux:buttonEntry('RightAuxButton'),
    modeSwitch:modeSwitch(),roundAux:buttonEntry('RoundAuxButton'),rudTrim:rudTrim(),parkBrk:parkBrk()
  },
  setup:famManual?famManual.setup:['Master key in','Set reverser to neutral','Set headlights','Open doors'],
  depart:famManual?famManual.depart:['Close doors','Check signal','Set reverser to forward','Release brakes','Apply power']
};
if(famManual) todo.push('setup/depart checklists copied from '+path.basename(famCfg.manual)+', rewrite for this train');
if(!todo.length) delete out._todo;
const file=opt.out||path.join(__dirname,'manual','trains',name+'.json');
// notch and position arrays on one line, like the hand-written data files
fs.writeFileSync(file,JSON.stringify(out,null,2).replace(/(\n\s+)("notches"|"positions"): \[([^\]]*)\]/g,(m,ws,k,v)=>ws+k+': ['+v.replace(/\s*\n\s*/g,' ').trim()+']')+'\n');
console.log('wrote',path.relative(root,file));
for(const [k,v] of Object.entries(out.controls)) console.log('  '+k.padEnd(20)+(v?JSON.stringify(v):'null'));
if(todo.length){console.log('--- todo');todo.forEach(t=>console.log('  '+t));}
