// Draft a profile for a captured train from a family template.
// Usage (from repo root):
//   node tools/draft_profile.js tools/captures/<Class>.json --family uk-dmu --name "Class 153" --dev dtg
//        [--slug class-153] [--classes RVM_TFW_Class153] [--out profiles/x.json] [--game tsw]
// The template (tools/families.json) gives the TCA layout; every node it refers to is resolved in the capture by input
// identifier (or bare node name), cab-prefixed pairs become {SIDE:a:b}_Name, lever steps come from the sweep.
// sync_control blocks are dropped, keyboard fallbacks become direct controls when the train has the node, unmatched
// assignments are removed and listed so you can decide. Review the draft before releasing it.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const argv=process.argv.slice(2); const opt={game:'tsw'};
const pos=[];
for(let i=0;i<argv.length;i++){const a=argv[i]; if(a.startsWith('--')) opt[a.slice(2)]=argv[++i]; else pos.push(a);}
if(!pos[0]||!opt.family||!opt.name||!opt.dev){console.error('usage: node tools/draft_profile.js <capture.json> --family <uk-unit|uk-dmu|de-unit|nl-unit> --name "Class 153" --dev dtg [--slug x] [--classes PREFIX] [--out file]');process.exit(1);}
const fam=JSON.parse(fs.readFileSync(path.join(__dirname,'families.json'),'utf8'));
const family=fam.families[opt.family]; if(!family){console.error('unknown family '+opt.family+'; known: '+Object.keys(fam.families).join(', '));process.exit(1);}
const cap=JSON.parse(fs.readFileSync(pos[0],'utf8'));
const tpl=JSON.parse(fs.readFileSync(path.join(root,family.template),'utf8'));
const tplCap=family.capture&&fs.existsSync(path.join(root,family.capture))?JSON.parse(fs.readFileSync(path.join(root,family.capture),'utf8')):null;
const warn=[], unmatched=[], notes=[];
const r4=v=>Math.round(v*1e4)/1e4;

// ---- capture index
const pair=cap.cab&&cap.cab.pair||null;
const prefixRe=pair?new RegExp('^('+pair.join('|')+')_'):null;
const bare=n=>n.replace(/^\{SIDE:[^}]*\}_/,'').replace(prefixRe||/^$/,'');
const inputs=cap.controls.filter(c=>c.inputValue!==undefined);
const byId={}, byBare={};
for(const c of inputs){ if(c.identifier&&c.identifier!=='None')(byId[c.identifier]=byId[c.identifier]||[]).push(c); (byBare[bare(c.name)]=byBare[bare(c.name)]||[]).push(c); }
const tplBare={}; if(tplCap) for(const c of tplCap.controls){ if(c.identifier) tplBare[c.name.replace(/^[A-Z][A-Za-z]?_/,'')]=c.identifier; }
const identifierOf=tplNode=>{const b=tplNode.replace(/^\{SIDE:[^}]*\}_/,'').replace(/^[A-Z][A-Za-z]?_(?=[A-Z])/,''); return tplBare[b]||fam.nodeIdentifiers[b]||fam.nodeIdentifiers[tplNode]||null;};

// Resolve a template node to {name (profile string), concrete (real node for lever lookup), ctrl}
function resolve(tplNode){
  const id=identifierOf(tplNode); const b=tplNode.replace(/^\{SIDE:[^}]*\}_/,'').replace(/^[A-Z][A-Za-z]?_(?=[A-Z])/,'');
  let cands=(id&&id!=='None'&&byId[id])||byBare[b]||[];
  if(cands.length>1&&cands.some(c=>bare(c.name)===b)) cands=cands.filter(c=>bare(c.name)===b);
  if(!cands.length) return null;
  if(cands.length>1&&pair){
    const sides=new Set(cands.map(c=>(prefixRe.exec(c.name)||[])[1]).filter(Boolean));
    const bares=new Set(cands.map(c=>bare(c.name)));
    if(bares.size===1&&sides.size===2) return {name:'{SIDE:'+pair[0]+':'+pair[1]+'}_'+bare(cands[0].name),concrete:cands[0].name,ctrl:cands[0]};
    if(bares.size>1) warn.push(tplNode+' matched several nodes by identifier '+id+': '+cands.map(c=>c.name).join(', ')+' -> took '+cands[0].name);
  } else if(cands.length>1) warn.push(tplNode+' matched '+cands.map(c=>c.name).join(', ')+' -> took '+cands[0].name);
  return {name:cands[0].name,concrete:cands[0].name,ctrl:cands[0]};
}
const leverOf=r=>r&&cap.levers&&cap.levers[r.concrete]||null;
const notchValues=l=>{ if(l.swept&&l.notches.length>1) return l.notches.map(n=>r4(n.snapped));
  const n=l.notchCount||0; if(n>1){warn.push('unswept lever, even spacing assumed'); return Array.from({length:n},(_,i)=>r4(l.rotational?i/n:i/(n-1)));} return null; };
const notchNames=l=>l.swept?l.notches.map(n=>n.name||('#'+n.index)):[];
const isKeyName=k=>/^(shift\+|ctrl\+|alt\+)*([a-z0-9]|space|enter|tab|escape|backspace|[;'`,./\\\[\]-])$/i.test(k||'');

function fixDirect(a,ctrlName){
  const r=resolve(a.controls); if(!r){unmatched.push(ctrlName+': '+a.controls+' (direct_control)');return null;}
  a.controls=r.name; const l=leverOf(r); const iv=a.input_value||(a.input_value={});
  if(!l){warn.push(ctrlName+': '+r.name+' is not a lever in the capture; steps kept from the template');return a;}
  if(iv.step_thresholds){warn.push(ctrlName+': template step_thresholds dropped (lever specific), re-add by hand if the lever has free zones');delete iv.step_thresholds;}
  const steps=notchValues(l);
  if(steps){iv.min=steps[0];iv.max=steps[steps.length-1];iv.steps=steps;}
  else {delete iv.steps; iv.min=l.minInput==null?0:l.minInput; iv.max=l.maxInput==null?1:l.maxInput;}
  for(const k of Object.keys(iv)) if(iv[k]===null) delete iv[k];
  const names=notchNames(l); a._notchNames=names;
  return a;
}
function fixAction(act,ctrlName,isDeact){
  if(!act) return act;
  if(act.keys&&!isKeyName(act.keys)&&byBare[act.keys]){act.controls=act.keys;delete act.keys;notes.push(ctrlName+': "keys":"'+act.controls+'" treated as a control');}
  if(act.keys){ const ids=fam.keyRoles[act.keys]||[]; const id=ids.find(i=>byId[i]);
    if(id){const r=resolve(byId[id][0].name); act.controls=r.name; delete act.keys; if(act.value===undefined) act.value=isDeact?0:1; if(!isDeact) act.hold=true; act._ctrl=r.ctrl; act._lever=leverOf(r); act._fromKey=true; notes.push(ctrlName+': key '+JSON.stringify(ids)+' -> direct control '+r.name);}
    return act; }
  if(act.controls){ const r=resolve(act.controls); if(!r){return null;} act.controls=r.name; act._ctrl=r.ctrl; act._lever=leverOf(r); }
  return act;
}
function fixAssignment(a,ctrlName){
  if(a.type==='sync_control'){notes.push(ctrlName+': sync_control dropped');return null;}
  if(a.type==='direct_control') return fixDirect(a,ctrlName);
  const act=fixAction(a.action_activate,ctrlName,false);
  if(a.action_activate&&!act){unmatched.push(ctrlName+': '+a.action_activate.controls+' ('+a.type+')');return null;}
  a.action_activate=act;
  if(act&&act._fromKey&&!a.action_deactivate&&act._ctrl&&/PushButton/.test(act._ctrl.objectClass||'')) a.action_deactivate={controls:act.controls,value:0,hold:false};
  if(a.action_deactivate){const d=fixAction(a.action_deactivate,ctrlName,true); if(!d) delete a.action_deactivate; else a.action_deactivate=d;}
  // push buttons take 1 then 0; spring levers rest at 0.5
  const c=act&&act._ctrl, l=act&&act._lever;
  if(c&&/PushButton/.test(c.objectClass||'')&&a.action_deactivate&&a.action_deactivate.value===0.5){a.action_deactivate.value=0;notes.push(ctrlName+': '+act.controls+' is a push button, release value 0.5 -> 0');}
  if(act&&act.relative&&l&&l.notchCount>1){const s=r4(1/(l.notchCount-1)); act.value=act.value<0?-s:s;}
  return a;
}
// headlight rotary: AutoBrake0..4 get the first five distinct notch names of the Headlights lever
function headlights(controls){
  const abs=controls.filter(c=>/^AutoBrake\d$/.test(c.name));
  for(const c of abs){ const as=c.assignments||[c.assignment];
    for(const a of as){ const act=a&&a.action_activate; const l=act&&act._lever; if(!l||!l.swept||!/Headlights/.test(act._ctrl.identifier||'')) continue;
      const all=[]; for(const n of l.notches){ if(!all.find(d=>d.name===n.name)) all.push(n); }
      // preferred AUTO BRK order: off, day/on, marker/dim, night/high beam, tail; whatever is left follows
      const pref=[/^off/i,/day|^on$|full/i,/marker|dim|low/i,/night|high|beam/i,/tail/i]; const distinct=[];
      for(const re of pref){const m=all.find(n=>re.test(n.name||'')&&!distinct.includes(n)); if(m) distinct.push(m);}
      for(const n of all) if(!distinct.includes(n)) distinct.push(n);
      const i=Number(c.name.slice(-1)); const d=distinct[i];
      if(d){act.value=r4(d.snapped); c.description='Headlights | '+d.name;} else {c.description='Headlights | (unassigned)';}
      if(all.length!==5&&!headlights.said){headlights.said=true;warn.push('Headlights lever has '+all.length+' distinct positions ('+l.notches.map(n=>n.name+'@'+n.snapped).join(', ')+'); AUTO BRK got '+distinct.slice(0,5).map(n=>n.name).join(', ')+' - check');}
    } }
}
// ---- build
const out={name:opt.game.toUpperCase()+' | '+opt.name+' | '+opt.dev.toUpperCase()+' | TheJAG',auto_select:true,apps:tpl.apps||['Train Sim World'],rail_class_information:[],controls:[],controller:tpl.controller};
for(const t of tpl.controls){
  const c=JSON.parse(JSON.stringify(t)); const list=(c.assignments||[c.assignment]).map(a=>fixAssignment(a,c.name)).filter(Boolean);
  if(!list.length){unmatched.push(c.name+' dropped entirely ('+(t.description||'')+')');continue;}
  const names=list.find(a=>a._notchNames)&&list.find(a=>a._notchNames)._notchNames;
  if(names&&names.length){const base=(c.description||'').replace(/\s*\(.*\)\s*$/,''); c.description=base+' ('+names.join(' / ')+')';}
  if(c.assignments) c.assignments=list; else c.assignment=list[0];
  out.controls.push(c);
}
headlights(out.controls);
const clean=o=>{ if(Array.isArray(o)) o.forEach(clean); else if(o&&typeof o==='object'){ for(const k of Object.keys(o)){ if(k.startsWith('_')) delete o[k]; else clean(o[k]); } } };
clean(out.controls);
// ---- rail classes from the pak index
const pakFile=path.join(__dirname,'pak_classes.txt');
if(fs.existsSync(pakFile)){
  const rows=fs.readFileSync(pakFile,'utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>l.split('\t'));
  let prefix=opt.classes; const stem=cap.objectClass.replace(/_C$/,'');
  if(!prefix){ const toks=stem.split('_'); const k=toks.findIndex((t,i)=>i>=2&&/\d/.test(t)); if(k>0) prefix=toks.slice(0,k+1).join('_');
    if(!prefix){ for(let n=toks.length;n>=3;n--){ const p=toks.slice(0,n).join('_'); if(rows.filter(r=>r[1]===p||r[1].startsWith(p+'_')).length>=2){prefix=p;break;} } } prefix=prefix||stem; }
  const cls=[...new Set(rows.filter(r=>r[1]===prefix||r[1].startsWith(prefix+'_')).map(r=>r[1]+'_C'))];
  if(!cls.includes(cap.objectClass)) cls.unshift(cap.objectClass);
  out.rail_class_information=cls.map(c=>({class_name:c}));
  notes.push('rail classes from pak index with prefix '+prefix+': '+cls.length);
} else out.rail_class_information=[{class_name:cap.objectClass}];
// ---- write
const slug=opt.slug||opt.name.toLowerCase().replace(/^br\s+class/,'class').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const file=opt.out||path.join(root,'profiles',opt.game+'-'+slug+'-'+opt.dev.toLowerCase()+'-thejag-'+Math.floor(Date.now()/1000)+'.json');
fs.writeFileSync(file,JSON.stringify(out,null,2)+'\n');
console.log('wrote',path.relative(root,file));
console.log('--- controls');
for(const c of out.controls){const as=c.assignments||[c.assignment];console.log('  '+c.name.padEnd(20)+(c.description||'').padEnd(60)+' '+as.map(a=>a.type+':'+(a.controls||(a.action_activate&&(a.action_activate.controls||a.action_activate.keys)))+(a.input_value&&a.input_value.steps?' '+JSON.stringify(a.input_value.steps)+(a.input_value.invert?' inv':''):'')).join(' ; '));}
if(unmatched.length){console.log('--- unmatched (removed)');unmatched.forEach(u=>console.log('  '+u));}
if(notes.length){console.log('--- notes');notes.forEach(u=>console.log('  '+u));}
if(warn.length){console.log('--- warnings');warn.forEach(u=>console.log('  '+u));}
const used=new Set(); for(const c of out.controls) for(const a of (c.assignments||[c.assignment])) for(const k of ['controls']) { if(a[k]) used.add(bare(a[k])); for(const act of [a.action_activate,a.action_deactivate]) if(act&&act.controls) used.add(bare(act.controls)); }
const spare=inputs.filter(c=>c.identifier&&c.identifier!=='None'&&!used.has(bare(c.name))).map(c=>bare(c.name)+'['+c.identifier+']');
console.log('--- unused identified nodes: '+[...new Set(spare)].join(', '));
