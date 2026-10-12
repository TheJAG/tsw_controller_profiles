// Shared helpers for the per-train build scripts in tools/mk/ (2026-10-12). New scripts import these and keep only
// the train's own node names, values, lever bands and manual data. The 114 older scripts define their own copies and
// stay as they are, because their profiles are cab-tested.
//
//   const { load, save, writeManual, pakClasses, capture, lever, mom, tog, togA, momA, pair, key, set, rel } = require('./lib');
//   const { f, dlc, p } = load('store.steampowered.com/app/<id>');   // argv: <profile.json> [store link]
//   p.rail_class_information = pakClasses(/TSG_DB_BR218$/);
//   p.controls = [ ... ];  save(f, p);  writeManual({ name: '<slug>', ..., dlc });
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');

// profile in, profile out
function load(defaultDlc) {
  const f = process.argv[2];
  if (!f) { console.error('usage: node ' + path.relative(ROOT, process.argv[1]) + ' profiles/<file>.json [store.steampowered.com/app/<id>]'); process.exit(1); }
  const dlc = process.argv[3] || defaultDlc;
  if (!dlc || /DLCID/.test(dlc)) { console.error('give the Steam store link of the DLC as the second argument'); process.exit(1); }
  return { f, dlc, p: JSON.parse(fs.readFileSync(f, 'utf8')) };
}
function save(f, p) { fs.writeFileSync(f, JSON.stringify(p, null, 2) + '\n'); console.log(p.rail_class_information.map(c => c.class_name).join(' ')); }
function writeManual(m) {
  const out = path.join(ROOT, 'tools', 'manual', 'trains', m.name + '.json');
  fs.writeFileSync(out, JSON.stringify(m, null, 2) + '\n');
  console.log('manual data', path.relative(ROOT, out));
}

// rail classes from the pak scan: every name matching re, as rail_class_information entries
function pakClasses(re, exclude = /_Base$/) {
  const names = fs.readFileSync(path.join(ROOT, 'tools', 'pak_classes.txt'), 'utf8').split(/\r?\n/)
    .map(l => l.trim().split(/\s+/)[1]).filter(n => n && re.test(n) && !exclude.test(n));
  return [...new Set(names)].map(n => ({ class_name: n + '_C' }));
}

// capture and its levers; older captures store levers as an array, newer ones as a map
function capture(objectClass) { return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'captures', objectClass + '.json'), 'utf8')); }
function lever(cap, name) { return Array.isArray(cap.levers) ? cap.levers.find(l => l.name === name) : cap.levers[name]; }

// assignments
const set = (node, v) => ({ type: 'momentary', threshold: 0.9, action_activate: { controls: node, value: v, hold: false } });
const rel = (node, v) => ({ type: 'momentary', threshold: 0.9, action_activate: { controls: node, value: v, relative: true, hold: false, enable_api_fallback: true } });
const momA = (node, on, off) => ({ type: 'momentary', threshold: 0.9, action_activate: { controls: node, value: on, hold: false, enable_api_fallback: true }, action_deactivate: { controls: node, value: off, hold: false, enable_api_fallback: true } });
const pair = momA;
const togA = (node, on, off) => ({ type: 'toggle', threshold: 0.9, action_activate: { controls: node, value: on, hold: false, enable_api_fallback: true }, action_deactivate: { controls: node, value: off, hold: false, enable_api_fallback: true } });

// whole controls
const mom = (name, desc, node, on, off, hold = true) => ({ name, description: desc, assignment: { type: 'momentary', threshold: 0.9, action_activate: { controls: node, value: on, hold }, action_deactivate: { controls: node, value: off, hold: false } } });
const tog = (name, desc, node, on, off) => ({ name, description: desc, assignment: togA(node, on, off) });
const key = (name, desc, k) => ({ name, description: desc, assignment: { type: 'momentary', threshold: 0.9, action_activate: { keys: k } } });

module.exports = { load, save, writeManual, pakClasses, capture, lever, set, rel, momA, pair, togA, mom, tog, key };
