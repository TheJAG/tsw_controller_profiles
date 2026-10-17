// Rewrite one train's README line and keep tools/trains.json (the registry) in sync.
// Usage (from repo root):
//   node tools/readme_status.js "<README name>" <todo|soon|done> [--game tsw|tsc|rt] [--dev DTG] [--profile <release slug>] [--no-manual] [--add "<country>"]
//   node tools/readme_status.js --sync          # only regenerate tools/trains.json from the README
// A status change re-renders the train's manual (its cab-test badge reads tools/trains.json); --no-render skips that.
// Line formats (trailing two spaces are part of the format):
//   `TODO ◼️` **Name** <sub>— DEV</sub>
//   `SOON 🟨` **Name** <sub>— DEV · [profile](releases/<slug>.tswprofile) · [manual](profiles/documentation/<slug>.pdf)</sub>
// Game sections are the blocks under the three image banners (TSW, TSC, Running Train); --add inserts a new name
// alphabetically in the given country block of the TSW section (or at the end of the section for the other games).
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const argv=process.argv.slice(2); const opt={game:'tsw',manual:true}; const pos=[];
for(let i=0;i<argv.length;i++){const a=argv[i]; if(a==='--sync') opt.sync=true; else if(a==='--no-manual') opt.manual=false; else if(a==='--no-render') opt.render=false; else if(a.startsWith('--')) opt[a.slice(2)]=argv[++i]; else pos.push(a);}
const readmePath=path.join(root,'README.md');
const raw=fs.readFileSync(readmePath,'utf8'); const eol=raw.includes('\r\n')?'\r\n':'\n';
const lines=raw.split(/\r?\n/);
const STATUS={todo:'`TODO ◼️`',soon:'`SOON 🟨`',done:'`DONE ✅`'};
const games=['tsw','tsc','rt'];
const lineRe=/^`(TODO|SOON|DONE) [^`]*`\s+\*\*(.+?)\*\*(?:\s+<sub>— (.*?)<\/sub>)?\s*$/;
const parseLine=l=>{const m=lineRe.exec(l); if(!m) return null; const r={status:m[1].toLowerCase(),name:m[2],dev:null,profile:null,manual:null};
  if(m[3]){const parts=m[3].split(' · '); r.dev=parts[0]; for(const p of parts.slice(1)){const k=/\[(profile|manual)\]\(([^)]+)\)/.exec(p); if(k) r[k[1]]=k[2];}} return r;};
// index: game + country per line
function index(){ const out=[]; let g=-1, country=null;
  for(let i=0;i<lines.length;i++){const l=lines[i]; if(/^<img\b/.test(l.trim())||/^<br><img\b/.test(l.trim())){g++;country=null;continue;}
    const h=/^\*\*(.+)\*\*\s*$/.exec(l); if(h&&!lineRe.test(l)){country=h[1];continue;}
    const p=parseLine(l); if(p) out.push(Object.assign({line:i,game:games[g]||('section'+g),country},p));}
  return out; }
function fmt(status,name,dev,slug,manual){ let s=STATUS[status]+' **'+name+'**';
  if(status==='todo'){ if(dev) s+=' <sub>— '+dev+'</sub>'; }
  else { const parts=[dev||'?']; if(slug){parts.push('[profile](releases/'+slug+'.tswprofile)'); if(manual) parts.push('[manual](profiles/documentation/'+slug+'.pdf)');} s+=' <sub>— '+parts.join(' · ')+'</sub>'; }
  return s+'  '; }
function sync(){ const regPath=path.join(__dirname,'trains.json'); const old=fs.existsSync(regPath)?JSON.parse(fs.readFileSync(regPath,'utf8')):[];
  const extra=new Map(old.map(t=>[t.game+'|'+t.name,t]));
  const reg=index().map(e=>{const o=extra.get(e.game+'|'+e.name)||{}; const r={game:e.game,country:e.country,name:e.name,status:e.status,dev:e.dev,profile:e.profile,manual:e.manual};
    for(const k of ['route','pak','classes','family','capture','notes']) if(o[k]!==undefined) r[k]=o[k]; return r;});
  fs.writeFileSync(regPath,JSON.stringify(reg,null,2).replace(/(\n\s+)("classes": \[)([^\]]*)\]/g,(m,ws,k,v)=>ws+k+v.replace(/\s*\n\s*/g,' ').trim()+']')+'\n');
  console.log('trains.json: '+reg.length+' trains ('+reg.filter(t=>t.status==='done').length+' done, '+reg.filter(t=>t.status==='soon').length+' soon)');
  guides(reg); }
// tools/guides.json: per train its TSW vehicle classes (from the profile JSON) and guide paths, plus the safety manuals;
// fetched by TSW Route Guides from raw.githubusercontent.com to find the guide for the train being driven.
// `generated` changes only when the rest of the file does.
const countryName=h=>h?h.replace(/[\u{1F1E6}-\u{1F1FF}]/gu,'').replace(/\s+/g,' ').trim():null;
const countrySlug=n=>n?n.toLowerCase().replace(/&/g,' ').replace(/[^a-z\s-]/g,'').trim().replace(/[\s-]+/g,'-'):null;
function guides(reg){ const profDir=path.join(root,'profiles'), docDir=path.join(profDir,'documentation');
  const profFiles=fs.readdirSync(profDir).filter(f=>f.endsWith('.json'));
  const doc=(slug,ext)=>slug&&fs.existsSync(path.join(docDir,slug+ext))?'profiles/documentation/'+slug+ext:null;
  const classesOf=slug=>{ if(!slug) return []; const re=new RegExp('^'+slug.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'-(\\d+)\\.json$');
    const f=profFiles.map(f=>[f,re.exec(f)]).filter(x=>x[1]).sort((a,b)=>Number(b[1][1])-Number(a[1][1]))[0]; if(!f) return [];
    try{ const j=JSON.parse(fs.readFileSync(path.join(profDir,f[0]),'utf8')); return [...new Set((j.rail_class_information||[]).map(c=>c.class_name).filter(Boolean))].sort(); }catch(e){ return []; } };
  const trains=reg.map(t=>{ const slug=t.profile?path.basename(t.profile,'.tswprofile'):null; const cn=countryName(t.country);
    return {game:t.game,name:t.name,country:countrySlug(cn),country_name:cn,dev:t.dev,status:t.status,slug,classes:classesOf(slug),html:doc(slug,'.html'),pdf:doc(slug,'.pdf')}; });
  const safeDir=path.join(__dirname,'manual','safety');
  const safety=fs.readdirSync(safeDir).filter(f=>f.endsWith('.json')).sort().map(f=>{ const j=JSON.parse(fs.readFileSync(path.join(safeDir,f),'utf8'));
    const country=f.replace(/\.json$/,''); const t=trains.find(x=>x.country===country); const name=j.name||('tsw-safety-'+country+'-thejag');
    return {country,country_name:t?t.country_name:String(j.title||'').replace(/^Safety systems · /,''),html:doc(name,'.html'),pdf:doc(name,'.pdf')}; });
  const outPath=path.join(__dirname,'guides.json'); let generated=new Date().toISOString().replace(/\.\d+Z$/,'Z');
  try{ const prev=JSON.parse(fs.readFileSync(outPath,'utf8')); if(JSON.stringify({trains:prev.trains,safety:prev.safety})===JSON.stringify({trains,safety})) generated=prev.generated; }catch(e){}
  fs.writeFileSync(outPath,JSON.stringify({generated,trains,safety},null,2).replace(/(\n\s+)("classes": \[)([^\]]*)\]/g,(m,ws,k,v)=>ws+k+v.replace(/\s*\n\s*/g,' ').trim()+']')+'\n');
  console.log('guides.json: '+trains.length+' trains ('+trains.filter(t=>t.classes.length).length+' with classes, '+trains.filter(t=>t.html).length+' with a guide), '+safety.length+' safety manuals'); }
if(opt.sync&&!pos.length){sync();process.exit(0);}
if(pos.length<2||!STATUS[pos[1]]){console.error('usage: node tools/readme_status.js "<name>" <todo|soon|done> [--game tsw|tsc|rt] [--dev DTG] [--profile slug] [--no-manual] [--add "<country>"] | --sync');process.exit(1);}
const [name,status]=pos; const idx=index();
let e=idx.find(x=>x.game===opt.game&&x.name===name);
if(!e&&!opt.add){console.error('no line for "'+name+'" in section '+opt.game+'; use --add "<country>" to insert it');process.exit(1);}
const slug=opt.profile||(e&&e.profile?path.basename(e.profile,'.tswprofile'):null);
const dev=opt.dev||(e&&e.dev)||null;
if(status!=='todo'&&!slug){console.error('need --profile <slug> for '+status);process.exit(1);}
const newLine=fmt(status,name,dev,slug,opt.manual);
if(e){ lines[e.line]=newLine; console.log('replaced line '+(e.line+1)+': '+newLine.trim()); }
else { const sect=idx.filter(x=>x.game===opt.game&&(opt.game!=='tsw'||x.country===opt.add)); if(!sect.length){console.error('country/section "'+opt.add+'" not found in '+opt.game);process.exit(1);}
  const after=sect.filter(x=>x.name.localeCompare(name,'en',{numeric:true})<0).pop(); const at=after?after.line+1:sect[0].line;
  lines.splice(at,0,newLine); console.log('inserted at line '+(at+1)+': '+newLine.trim()); }
fs.writeFileSync(readmePath,lines.join(eol));
sync();
// the manual's cab-test badge shows the README status, so a change re-renders the manual when its data file exists
if(opt.render!==false&&slug&&(!e||e.status!==status)){ const data=path.join(__dirname,'manual','trains',slug+'.json');
  if(fs.existsSync(data)){ console.log('re-rendering the manual for its cab-test badge'); const r=require('child_process').spawnSync(process.execPath,[path.join(__dirname,'manual','render_manual.js'),path.relative(root,data)],{stdio:'inherit',cwd:root}); if(r.status) process.exit(r.status); } }
