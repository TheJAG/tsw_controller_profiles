// Make a profile follow the active cab: every control node wired to the F cab whose B twin exists in the train's capture
// gets the app's {SIDE:F:B} placeholder (Reverser_F -> Reverser_{SIDE:F:B}, Horn_FL -> Horn_{SIDE:F:B}L, F_AutoBrake ->
// {SIDE:F:B}_AutoBrake, BrakeKeyF -> BrakeKey{SIDE:F:B}). Nodes without a twin (single-cab power cars, back-wall switches)
// are left alone. The app resolves the placeholder from CurrentDrivableActor.Function.GetActiveCab, which follows the seat
// (Class 31 user test 2026-10-11) even where IS_GetActiveCab errors. Usage: node tools/apply_side.js profiles/<file>.json
// [more files], or require('./apply_side.js').apply(file) at the end of a tools/mk script.
const fs = require('fs');
const path = require('path');
const capDir = path.join(__dirname, 'captures');
let caps = null;
function loadCaps() {
  if (caps) return caps;
  caps = {};
  for (const f of fs.readdirSync(capDir).filter(x => x.endsWith('.json'))) {
    try {
      const c = JSON.parse(fs.readFileSync(path.join(capDir, f), 'utf8'));
      const controls = Array.isArray(c.controls) ? c.controls : Object.values(c.controls || {});
      caps[f.replace(/\.json$/, '')] = new Set([...Object.keys(c.levers || {}), ...controls.map(x => x.name)]);
    } catch (e) { /* not a capture */ }
  }
  return caps;
}
function twin(n) {
  let m;
  if (n.includes('{SIDE')) return null;
  if ((m = n.match(/^(.*)_F([LR]?)(\s.*)?$/))) return { b: m[1] + '_B' + m[2] + (m[3] || ''), side: m[1] + '_{SIDE:F:B}' + m[2] + (m[3] || '') };
  if ((m = n.match(/^F_(.*)$/))) return { b: 'B_' + m[1], side: '{SIDE:F:B}_' + m[1] };
  if ((m = n.match(/^(.*[a-z])F(\s\(.*\))?$/))) return { b: m[1] + 'B' + (m[2] || ''), side: m[1] + '{SIDE:F:B}' + (m[2] || '') };
  return null;
}
function apply(file, opt = {}) {
  const p = JSON.parse(fs.readFileSync(file, 'utf8'));
  const classes = (p.rail_class_information || []).map(c => c.class_name);
  const all = loadCaps();
  const cap = classes.map(c => all[c]).find(Boolean);
  if (!cap) { if (!opt.quiet) console.log(path.basename(file) + ': no capture for ' + classes.join(', ') + ', left alone'); return { changed: 0, skipped: [] }; }
  const map = {}, skipped = [];
  JSON.stringify(p, (k, v) => { if (k === 'controls' && typeof v === 'string') { const t = twin(v); if (t) { if (cap.has(t.b)) map[v] = t.side; else skipped.push(v); } } return v; });
  const out = JSON.parse(JSON.stringify(p), (k, v) => (k === 'controls' && typeof v === 'string' && map[v]) ? map[v] : v);
  const changed = Object.keys(map).length;
  if (changed) fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
  if (!opt.quiet) console.log(path.basename(file) + ': ' + changed + ' node(s) on {SIDE:F:B}' + (skipped.length ? ', kept on F (no B twin): ' + [...new Set(skipped)].join(', ') : ''));
  return { changed, skipped };
}
module.exports = { apply, twin };
if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length) { console.error('usage: node tools/apply_side.js profiles/<file>.json [...]'); process.exit(1); }
  for (const f of files) apply(f);
}
