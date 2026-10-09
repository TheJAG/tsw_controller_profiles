// Usage (from repo root): node tools/build_release.js profiles/<profile>.json
// Writes releases/<profile-name-without-timestamp>.tswprofile the same way the app's "save for sharing" does:
// description fields stripped, controller block with the TCA SDL mapping, key order name/controls/auto_select/controller/rail_class_information.
const fs = require('fs'), path = require('path');
const src = process.argv[2];
if (!src) { console.error('usage: node tools/build_release.js profiles/<file>.json'); process.exit(1); }
const p = JSON.parse(fs.readFileSync(src, 'utf8'));
const sdl = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sdl_mappings', 'tca-quadrant-airbus.sdl.json'), 'utf8'));
const strip = o => JSON.parse(JSON.stringify(o, (k, v) => (k === 'description' ? undefined : v)));
const rel = {
  name: p.name,
  controls: strip(p.controls),
  auto_select: p.auto_select,
  controller: { usb_id: p.controller.usb_id, mapping: { name: 'TCA Quadrant Airbus - ' + p.name, usb_id: p.controller.usb_id, data: sdl.data } },
  rail_class_information: p.rail_class_information,
};
const out = path.join(__dirname, '..', 'releases', path.basename(src).replace(/-\d+\.json$/, '') + '.tswprofile');
fs.writeFileSync(out, JSON.stringify(rel, null, 2) + '\n');
console.log('wrote', out);
