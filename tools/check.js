// Release check for one train: node tools/check.js profiles/<file>.json [...]   |   --all   |   --staged (pre-commit)
// --profile-only skips the manual checks; --quiet prints failures only.
// Exits 1 on any error. Strict rules apply to profiles with a capture in tools/captures/; legacy profiles
// (TSC, pre-capture TSW) only get the parse and release checks.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const rel = p => path.join(ROOT, p);
const LEVERS = ['SpeedbrakeLever', 'LeftThrottle', 'RightThrottle', 'FlapLever'];
const PAGE_W = 722; // 794 px page minus 2 x 36 px margins
const STRICT_FROM = 1791500000; // profiles stamped before the capture pipeline (BR 440, 2026-10-09) are legacy

let captures = null, pakClasses = null, cabUse = null;
function loadCaptures() {
  if (captures) return captures;
  captures = {};
  for (const f of fs.readdirSync(rel('tools/captures'))) {
    if (!f.endsWith('.json')) continue;
    try { const c = JSON.parse(fs.readFileSync(rel('tools/captures/' + f), 'utf8')); if (c.objectClass && Array.isArray(c.controls)) captures[c.objectClass] = c; } catch { }
  }
  return captures;
}
function loadPak() {
  if (!pakClasses) pakClasses = new Set(fs.readFileSync(rel('tools/pak_classes.txt'), 'utf8').split(/\r?\n/).map(l => l.split('\t')[1]).filter(Boolean));
  return pakClasses;
}
function loadCabUse() {
  if (cabUse) return cabUse;
  cabUse = {};
  for (const f of fs.readdirSync(rel('tools/manual/trains'))) {
    if (!f.endsWith('.json')) continue;
    try { const d = JSON.parse(fs.readFileSync(rel('tools/manual/trains/' + f), 'utf8')); if (d.cab && d.cab.file) (cabUse[path.basename(d.cab.file)] ||= []).push(f); } catch { }
  }
  return cabUse;
}

// image size without dependencies: PNG, JPEG, SVG
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.slice(1, 4).toString() === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  const s = b.toString('utf8', 0, 4000);
  const vb = s.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (vb) return { w: +vb[1], h: +vb[2] };
  const w = s.match(/<svg[^>]*\swidth="([\d.]+)/), h = s.match(/<svg[^>]*\sheight="([\d.]+)/);
  if (w && h) return { w: +w[1], h: +h[1] };
  return null;
}

// every "controls" node name used by a control's assignments
function nodeNames(o, out = []) {
  if (Array.isArray(o)) o.forEach(x => nodeNames(x, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'controls' && typeof v === 'string') out.push(v); else nodeNames(v, out); }
  return out;
}
const base = n => n.replace(/\s*\([^)]*\)\s*$/, '').trim();
function expandSide(n, cap) {
  const m = n.match(/\{SIDE(?::([A-Za-z]+):([A-Za-z]+))?\}/);
  if (!m) return [n];
  const pairs = m[1] ? [m[1], m[2]] : (cap.cab && cap.cab.pair) ? [].concat(cap.cab.pair) : ['F', 'B'];
  return pairs.map(s => n.replace(m[0], s));
}

function checkProfile(file) {
  const errors = [], warnings = [];
  const err = s => errors.push(s), warn = s => warnings.push(s);
  let p;
  try { p = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return { errors: ['profile does not parse: ' + e.message], warnings }; }
  const slug = path.basename(file).replace(/-\d+\.json$/, '').replace(/\.json$/, '');
  const classes = (p.rail_class_information || []).map(c => c.class_name);
  const caps = loadCaptures();
  const cap = classes.map(c => caps[c]).find(Boolean);
  const stamp = +(path.basename(file).match(/-(\d+)\.json$/) || [])[1] || 0;
  const legacy = !cap || stamp < STRICT_FROM;

  // release in sync with the profile
  const relFile = rel('releases/' + slug + '.tswprofile');
  if (fs.existsSync(relFile)) {
    const r = JSON.parse(fs.readFileSync(relFile, 'utf8'));
    const strip = o => JSON.parse(JSON.stringify(o, (k, v) => (k === 'description' ? undefined : v)));
    if (JSON.stringify(strip(p.controls)) !== JSON.stringify(r.controls) || JSON.stringify(p.rail_class_information) !== JSON.stringify(r.rail_class_information))
      err('release ' + path.relative(ROOT, relFile) + ' is out of date: run node tools/build_release.js ' + path.relative(ROOT, file).replace(/\\/g, '/'));
  } else warn('no release file releases/' + slug + '.tswprofile');

  if (legacy) { warn((cap ? 'made before the capture pipeline' : 'no capture for ' + (classes[0] || 'this profile')) + ': legacy profile, strict checks skipped'); return { errors, warnings, slug }; }

  // levers are direct_control only
  if (JSON.stringify(p.controls).includes('sync_control')) err('sync_control found; levers are direct_control only');
  for (const c of p.controls || []) {
    if (!LEVERS.includes(c.name)) continue;
    // a lever driven through game keys (BR 187 Skyhook reverser) is allowed; node-driven lever assignments must be direct_control
    for (const a of c.assignments || (c.assignment ? [c.assignment] : [])) if (a.type !== 'direct_control' && nodeNames(a).length) err(c.name + ' has a ' + a.type + ' assignment; levers are direct_control only');
  }

  // rail classes exist in the paks
  const pak = loadPak();
  // a class seen in the game by a capture counts as real even when the pak scan missed it (DB_767pbzfa_RVM_C, AC4400CW_RVM_C)
  for (const c of classes) if (!pak.has(c.replace(/_C$/, '')) && !caps[c]) err('rail class ' + c + ' not in tools/pak_classes.txt');

  // node names exist in the capture of one of the profile's classes
  const known = new Set();
  for (const c of classes) if (caps[c]) for (const x of caps[c].controls) known.add(base(x.name));
  for (const c of p.controls || []) for (const n of new Set(nodeNames(c))) {
    const missing = expandSide(n, cap).map(base).filter(x => !known.has(x));
    if (missing.length) err(c.name + ': node ' + missing.join(', ') + ' not in the capture');
  }

  // manual data, assets, PDF (skipped by build_release.js, which runs before the manual exists)
  if (PROFILE_ONLY) return { errors, warnings, slug };
  const dataFile = rel('tools/manual/trains/' + slug + '.json');
  if (!fs.existsSync(dataFile)) { warn('no manual data tools/manual/trains/' + slug + '.json'); return { errors, warnings, slug }; }
  const raw = fs.readFileSync(dataFile, 'utf8'), d = JSON.parse(raw);
  if (/DLCID/.test(raw)) err('manual data still holds the DLCID store-link placeholder');
  if (/"_todo"|\bTODO\b/.test(raw)) err('manual data still holds _todo / TODO items');
  const dataDir = path.dirname(dataFile);
  for (const k of ['cab', 'diagram']) {
    if (!d[k] || !d[k].file) continue;
    const f = path.resolve(dataDir, d[k].file);
    if (!fs.existsSync(f)) { err(k + ' file missing: ' + d[k].file); continue; }
    if (k === 'cab') {
      const users = loadCabUse()[path.basename(f)] || [];
      if (users.length > 1) err('cab photo ' + path.basename(f) + ' is shared by ' + users.join(', ') + ' (copied from another train?)');
    }
    if (k === 'diagram' && !d.diagram.fit) {
      const s = imageSize(f), h = d.diagram.height || 48;
      if (s && s.w * h / s.h > PAGE_W) err('diagram is ' + Math.round(s.w * h / s.h) + ' px wide at ' + h + ' px tall (limit ' + PAGE_W + '); set diagram.fit to "clip" or "width"');
    }
  }
  const pdf = rel('profiles/documentation/' + slug + '.pdf');
  if (fs.existsSync(pdf)) {
    const pages = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
    if (pages !== 1) err('manual PDF has ' + pages + ' pages; it must be one A4 page');
  } else err('manual PDF missing: profiles/documentation/' + slug + '.pdf');
  return { errors, warnings, slug };
}

// which profiles to check
const args = process.argv.slice(2);
const PROFILE_ONLY = args.includes('--profile-only');
let files = [];
const latestProfile = slug => fs.readdirSync(rel('profiles')).filter(f => f.startsWith(slug + '-') && /-\d+\.json$/.test(f) && f.replace(/-\d+\.json$/, '') === slug).sort().pop();
if (args.includes('--all')) files = fs.readdirSync(rel('profiles')).filter(f => f.endsWith('.json')).map(f => rel('profiles/' + f));
else if (args.includes('--staged')) {
  const staged = execSync('git diff --cached --name-only --diff-filter=ACM', { cwd: ROOT, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
  const set = new Set();
  for (const s of staged) {
    let m;
    if (/^profiles\/[^/]+\.json$/.test(s)) set.add(rel(s));
    else if ((m = s.match(/^(?:tools\/manual\/trains\/([^/]+)\.json|releases\/([^/]+)\.tswprofile|profiles\/documentation\/([^/]+)\.(?:pdf|html))$/))) {
      const f = latestProfile(m[1] || m[2] || m[3]); if (f) set.add(rel('profiles/' + f));
    }
  }
  files = [...set];
} else files = args.filter(a => !a.startsWith('--')).map(a => path.resolve(a));
if (!files.length) { if (!args.includes('--staged')) console.error('usage: node tools/check.js profiles/<file>.json [...] | --all | --staged'); process.exit(0); }

const quiet = args.includes('--quiet');
let failed = 0;
for (const f of files) {
  const r = checkProfile(f);
  if (r.errors.length) failed++;
  if (r.errors.length || !quiet) {
    console.log((r.errors.length ? 'FAIL ' : 'ok   ') + path.relative(ROOT, f).replace(/\\/g, '/'));
    r.errors.forEach(e => console.log('  error: ' + e));
    if (!quiet) r.warnings.forEach(w => console.log('  warn:  ' + w));
  }
}
if (files.length > 1) console.log(failed + ' of ' + files.length + ' profiles failed');
process.exit(failed ? 1 : 0);
