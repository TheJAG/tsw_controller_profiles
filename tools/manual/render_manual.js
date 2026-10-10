// Quick Reference Manual generator (schematic layout, A4, one page).
// Usage (from repo root): node tools/manual/render_manual.js tools/manual/trains/<train>.json [outdir]
// Produces <outdir>/<name>.html (self-contained) and <outdir>/<name>.pdf printed with headless Chrome/Edge.
// Default outdir: profiles/documentation
const fs = require('fs'), path = require('path'), cp = require('child_process');

const dataPath = process.argv[2];
if (!dataPath) { console.error('usage: node tools/manual/render_manual.js tools/manual/trains/<train>.json [outdir]'); process.exit(1); }
const D = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const dataDir = path.dirname(path.resolve(dataPath));
const repoRoot = path.resolve(__dirname, '..', '..');
const outDir = path.resolve(process.argv[3] || path.join(repoRoot, 'profiles', 'documentation'));
const asset = f => path.isAbsolute(f) ? f : path.resolve(dataDir, f);
const dataUri = f => { const p = asset(f); const ext = path.extname(p).toLowerCase(); const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream'; return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`; };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const C = Object.assign({ navy: '#223261', blue: '#4a66a8', red: '#d7263d', green: '#1f9d55', paper: '#f3f5f9', ink: '#141a2b', muted: '#5b6478', rule: '#cfd5e2' }, D.colors || {});
const quadrant = dataUri(D.quadrant || '../../assets/tca-quadrant-airbus.png');

/* ---------- SVG helpers ---------- */
const tx = (x, y, s, cls = 'lbl', anchor = 'middle') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;
const pw = s => Math.round(String(s).length * 5.4 + 14);
const pillS = (cx, cy, s, on) => { const w = pw(s); return `<rect class="spill ${on ? 'on' : ''}" x="${(cx - w / 2).toFixed(1)}" y="${(cy - 7).toFixed(1)}" width="${w}" height="14" rx="7"/><text class="spt ${on ? 'on' : ''}" x="${cx}" y="${(cy + 3.5).toFixed(1)}" text-anchor="middle">${esc(s)}</text>`; };
const start = (x, y) => `<circle class="start" cx="${x}" cy="${y}" r="5"/>`;
const sub2 = (x, y, name, sub) => tx(x, y, name) + (sub ? tx(x, y + 12, sub, 'sub') : '');

// vertical lever: slot with ticks, pills beside it, knob at the start notch
function lever(cx, y0, y1, l, pillX, anchorSide, label, labelX) {
  let out = tx(labelX, 34, label) + tx(labelX, 46, l && l.name ? l.name : 'not assigned', 'sub');
  const assigned = l && l.notches && l.notches.length;
  out += `<rect class="slot" x="${cx - 11}" y="${y0 - 6}" width="22" height="${y1 - y0 + 12}" rx="6"/>`;
  if (!assigned) return out + `<rect class="knob" x="${cx - 26}" y="${(y0 + y1) / 2 - 14}" width="52" height="28" rx="7" opacity=".3"/>`;
  const n = l.notches.length, step = n > 1 ? (y1 - y0) / (n - 1) : 0, st = l.start == null ? -1 : l.start;
  // continuous: true = no detents; the slot gets a filled inner track and null entries in notches leave a gap without tick or pill
  if (l.continuous) out += `<rect x="${cx - 4}" y="${y0}" width="8" height="${y1 - y0}" rx="4" fill="var(--navy)" opacity=".28"/>`;
  l.notches.forEach((name, i) => { if (name == null) return; const y = y0 + i * step; if (!l.continuous) out += `<line class="tick" x1="${cx - 8}" y1="${y}" x2="${cx + 8}" y2="${y}"/>`; const w = pw(name); out += pillS(anchorSide === 'start' ? pillX + w / 2 : pillX - w / 2, y, name, i === st); });
  const ky = y0 + (st >= 0 ? st : (n - 1) / 2) * step;
  out += `<rect class="knob" x="${cx - 22}" y="${ky - 14}" width="44" height="28" rx="7" opacity=".92"/>` + (st >= 0 ? start(cx, ky) : '');
  return out;
}
// six-position rotary (AUTO BRK): positions on an arc, description under each, pointer at the start position
function dial(cx, cy, r) {
  const ang = [-120, -80, -40, 0, 40, 80], R = 70, st = r.start == null ? -1 : r.start;
  let out = `<circle class="btn" cx="${cx}" cy="${cy}" r="22"/>`;
  if (st >= 0) { const a0 = ang[st] * Math.PI / 180; out += `<line class="tick" x1="${cx}" y1="${cy}" x2="${(cx + 19 * Math.sin(a0)).toFixed(1)}" y2="${(cy - 19 * Math.cos(a0)).toFixed(1)}" style="stroke-width:3;stroke-linecap:round"/>` + start(cx, cy); }
  (r.positions || []).slice(0, 6).forEach((p, i) => { const a = ang[i] * Math.PI / 180, x = cx + R * Math.sin(a), y = cy - R * Math.cos(a); out += pillS(x, y, p.short, i === st) + tx(x.toFixed(1), (y + 17).toFixed(1), p.desc || '', 'sub xs'); });
  return out;
}
const button = (x, y, w, h, b, dotAtBottom) => `<rect class="btn" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>` + (b && b.start ? start(x + w / 2, dotAtBottom ? y + h : y) : '');

function schematic() {
  const K = D.controls || {};
  const Hc = 640;
  let s = `<rect class="mod" x="4" y="10" width="200" height="${Hc}" rx="10"/><rect class="mod" x="212" y="10" width="298" height="${Hc}" rx="10"/><rect class="mod" x="518" y="10" width="200" height="${Hc}" rx="10"/>`;
  // left module: speedbrake lever, gear lever, AUTO BRK rotary
  s += lever(70, 80, 240, K.speedbrake, 100, 'start', K.speedbrake && K.speedbrake.name ? K.speedbrake.name : 'Speedbrake lever', 104).replace(tx(104, 46, K.speedbrake && K.speedbrake.name ? K.speedbrake.name : 'not assigned', 'sub'), tx(104, 46, 'Speedbrake lever', 'sub'));
  const gl = K.gearLever || {};
  s += `<rect class="slot" x="96" y="300" width="16" height="44" rx="4"/><rect class="knob" x="90" y="310" width="28" height="14" rx="3"/>` + (gl.start !== false ? start(104, 344) : '') + sub2(104, 364, gl.name || 'not assigned', 'Gear lever');
  const ab = K.autoBrk || {};
  s += dial(104, 494, ab) + sub2(104, 556, ab.name || 'not assigned', 'AUTO BRK rotary');
  // centre module: two throttles, ENG buttons, aux buttons, mode switch
  const lt = K.leftThrottle, rt = K.rightThrottle;
  // the two throttles sit symmetrically about the card centre (362); each lever's pills face the centre gap
  s += tx(270, 34, lt && lt.name ? lt.name : 'Left throttle') + tx(270, 46, lt && lt.name ? 'Left throttle' : 'not assigned', 'sub');
  s += lever(270, 80, 290, lt, 296, 'start', '', 270).replace(/<text[^>]*>(?:[^<]*)<\/text>/, '').replace(/<text[^>]*>(?:[^<]*)<\/text>/, '');
  s += tx(454, 34, rt && rt.name ? rt.name : 'Right throttle') + tx(454, 46, rt && rt.name ? 'Right throttle' : 'not assigned', 'sub');
  s += lever(454, 80, 290, rt, 428, 'end', '', 454).replace(/<text[^>]*>(?:[^<]*)<\/text>/, '').replace(/<text[^>]*>(?:[^<]*)<\/text>/, '');
  const ltb = K.leftThrottleButton; if (ltb) s += `<circle class="acc" cx="270" cy="330" r="6"/>` + tx(270, 350, ltb.name, 'sub') + tx(270, 361, 'Left throttle button', 'sub');
  const rtb = K.rightThrottleButton; if (rtb) s += `<circle class="acc" cx="454" cy="330" r="6"/>` + tx(454, 350, rtb.name, 'sub') + tx(454, 361, 'Right throttle button', 'sub');
  const e1 = K.eng1 || {}, e2 = K.eng2 || {};
  s += button(262, 390, 36, 30, e1, true) + sub2(280, 440, e1.name || 'not assigned', 'ENG 1');
  s += button(424, 390, 36, 30, e2, true) + sub2(442, 440, e2.name || 'not assigned', 'ENG 2');
  const la = K.leftAux || {}, ra = K.rightAux || {}, ms = K.modeSwitch || {};
  s += button(246, 530, 36, 26, la) + sub2(264, 574, la.name || 'not assigned', 'Left aux');
  s += `<circle class="btn" cx="361" cy="543" r="22"/><rect class="knob" x="357" y="527" width="8" height="20" rx="2"/>` + start(361, 543) + tx(332, 541, ms.left || '', 'sub', 'end') + tx(332, 553, '◀', 'sub', 'end') + tx(390, 541, ms.right || '', 'sub', 'start') + tx(390, 553, '▶', 'sub', 'start') + sub2(361, 586, ms.name || 'not assigned', 'Mode switch');
  s += button(440, 530, 36, 26, ra) + sub2(458, 574, ra.name || 'not assigned', 'Right aux');
  // right module: flap lever, round aux, RUD TRIM, PARK BRK
  const fl = K.flap;
  s += tx(622, 34, fl && fl.name ? fl.name : 'Flap lever') + tx(622, 46, fl && fl.name ? 'Flap lever' : 'not assigned', 'sub');
  s += `<rect class="slot" x="608" y="74" width="28" height="222" rx="6"/>`;
  if (fl && fl.notches && fl.notches.length) { const n = fl.notches.length, st = fl.start == null ? -1 : fl.start; fl.notches.forEach((name, i) => { const y = 80 + i * 210 / (n - 1); s += `<line class="tick" x1="${614}" y1="${y}" x2="${630}" y2="${y}"/>` + pillS(584 - pw(name) / 2, y, name, i === st); }); const ky = 80 + (st >= 0 ? st : (n - 1) / 2) * 210 / (n - 1); s += `<rect class="knob" x="594" y="${ky - 25}" width="56" height="50" rx="10" opacity=".92"/>` + (st >= 0 ? start(622, ky) : ''); }
  else s += `<rect class="knob" x="592" y="120" width="60" height="50" rx="10" opacity=".3"/>`;
  const rd = K.roundAux || {}, rtm = K.rudTrim || {}, pb = K.parkBrk || {};
  s += `<circle class="acc" cx="572" cy="350" r="12"/>` + sub2(572, 378, rd.name || 'not assigned', 'Round aux');
  s += `<circle class="btn" cx="664" cy="350" r="20"/><rect class="knob" x="660" y="334" width="8" height="18" rx="2"/>` + sub2(664, 388, rtm.name || 'not assigned', 'RUD TRIM');
  s += `<rect x="573" y="507" width="96" height="26" rx="5" transform="rotate(90 657 520)" class="ghost"/>` + tx(657, 416, 'PARK BRK', 'sub');
  s += `<rect class="knob" x="573" y="507" width="96" height="26" rx="5"/><circle cx="657" cy="520" r="5" class="pivot"/>` + tx(612, 525, 'PARK BRK', 'onknob') + start(585, 520);
  s += sub2(623, 556, pb.name || 'not assigned', pb.flat || pb.up ? `flat = ${pb.flat || ''} · rotate up = ${pb.up || ''}` : '');
  s += tx(618, 620, '● recommended starting position', 'sub');
  return `<svg viewBox="0 0 722 ${Hc + 20}" role="img" aria-label="Schematic of the TCA quadrant">${s}</svg>`;
}

const li = arr => (arr || []).map(x => `<li>${esc(x)}</li>`).join('');
const logos = (D.logos || []).map(l => `<img class="logo" src="${dataUri(l.file)}" alt="${esc(l.alt || '')}" style="${l.invertToNavy ? 'filter:invert(1) brightness(.25) sepia(1) hue-rotate(190deg) saturate(3)' : ''}">`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(D.title)} · TCA quick reference</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
@page { size: A4; margin: 0; }
:root { --navy: ${C.navy}; --blue: ${C.blue}; --red: ${C.red}; --green: ${C.green}; --paper: ${C.paper}; --ink: ${C.ink}; --muted: ${C.muted}; --rule: ${C.rule};
  --display: "Barlow Condensed", "Arial Narrow", sans-serif; --body: "Barlow", "Segoe UI", sans-serif; --mono: "JetBrains Mono", Consolas, monospace; }
html, body { margin: 0; padding: 0; background: #fff; }
.sheet { width: 794px; height: 1122px; background: var(--paper); color: var(--ink); position: relative; overflow: hidden; font-size: 12px; line-height: 1.3; font-family: var(--body); }
.sheet * { box-sizing: border-box; }
h1, h2 { font-family: var(--display); margin: 0; line-height: 1; }
ul { margin: 0; padding-left: 16px; }
.logo { height: 28px; width: auto; display: block; }
.head { padding: 22px 36px 4px; display: flex; align-items: flex-end; justify-content: space-between; }
.head h1 { font-size: 46px; font-weight: 700; color: var(--navy); letter-spacing: -.01em; }
.head .sub { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; font-family: var(--display); font-weight: 600; }
.schem { padding: 2px 36px 0; }
.schem svg { width: 100%; height: auto; display: block; }
.schem text { font-family: var(--display); font-weight: 600; }
.schem .lbl { font-size: 13px; fill: var(--navy); }
.schem .sub { font-size: 10px; fill: var(--muted); font-family: var(--body); font-weight: 400; }
.schem .sub.xs { font-size: 8.5px; }
.schem .mod { fill: #fff; stroke: var(--navy); stroke-width: 2; }
.schem .slot { fill: #d9deea; stroke: var(--navy); stroke-width: 1.5; }
.schem .knob { fill: var(--navy); }
.schem .btn { fill: #fff; stroke: var(--navy); stroke-width: 1.5; }
.schem .acc { fill: var(--red); }
.schem .start { fill: var(--green); stroke: #fff; stroke-width: 1.5; }
.schem .tick { stroke: var(--navy); stroke-width: 1.2; }
.schem .spill { fill: #fff; stroke: var(--navy); stroke-width: 1; }
.schem .spill.on { fill: var(--green); stroke: var(--green); }
.schem .spt { font-size: 9px; fill: var(--navy); font-weight: 600; }
.schem .spt.on { fill: #fff; }
.schem .onknob { font-size: 10px; fill: #fff; }
.schem .ghost { fill: none; stroke: var(--navy); stroke-width: 1.5; stroke-dasharray: 4 3; }
.schem .pivot { fill: #fff; stroke: var(--navy); stroke-width: 1.5; }
.lists { display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 20px; padding: 6px 36px 0; }
/* with a cab band the schematic is shorter: push the checklists and the band down so they do not crowd the schematic */
.sheet.withcab .lists { padding-top: 22px; }
.sheet.withcab .cab { padding-top: 10px; }
.lists.two { grid-template-columns: 1fr 1fr; }
.lists h2 { font-size: 14px; color: var(--navy); margin-bottom: 3px; border-bottom: 1.5px solid var(--navy); padding-bottom: 3px; }
.lists li { font-size: 11px; }
.hwrow { display: grid; grid-template-columns: 150px 1fr; gap: 12px; align-items: start; }
.hwrow img { width: 150px; height: auto; display: block; border-radius: 4px; }
.hwtxt { font-size: 10.5px; color: var(--muted); line-height: 1.4; }
/* cab photo: a full-width band of the driver's desk (wide screenshot), between the checklists and the side view */
.cab { padding: 10px 36px 0; }
.cab img { width: 100%; height: ${D.cab && D.cab.height || 188}px; object-fit: cover; object-position: ${D.cab && D.cab.position || '50% 50%'}; display: block; border-radius: 6px; }
.sheet.withcab .schem svg { height: ${D.schematicHeight || 596}px; width: auto; max-width: 100%; margin: 0 auto; }
/* side view: same height on every manual (the Class 333 drawing at full width is 48px), centred, background stripped in-page */
.diagram { position: absolute; left: 36px; right: 36px; bottom: 30px; text-align: center; }
.diagram img { height: ${D.diagram && D.diagram.height || 48}px; width: auto; max-width: 100%; display: inline-block; }
.foot { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 36px; font-size: 10px; color: var(--muted); display: flex; justify-content: space-between; }
</style></head><body><div class="sheet${D.cab ? ' withcab' : ''}">
<div class="head"><div><div class="sub">${esc(D.eyebrow || '')}</div><h1>${esc(D.title)}</h1></div><div style="display:flex;gap:14px">${logos}</div></div>
<div class="schem">${schematic()}</div>
<div class="lists${D.cab ? ' two' : ''}">
  <div><h2>${esc((D.lists && D.lists.setupTitle) || 'Cab setup')}</h2><ul>${li(D.setup)}</ul></div>
  <div><h2>${esc((D.lists && D.lists.departTitle) || 'Cleared to depart')}</h2><ul>${li(D.depart)}</ul></div>
  ${D.cab ? '' : `<div><h2>Controller</h2><div class="hwrow"><img src="${quadrant}" alt="Thrustmaster TCA Quadrant Airbus"><div class="hwtxt">${(D.controllerNotes || ['Thrustmaster TCA Quadrant Airbus Edition.', 'Profile: ' + (D.profileName || ''), 'Game: ' + [D.developer, D.title, D.route].filter(Boolean).join(', ')]).map(esc).join('<br>')}</div></div></div>`}
</div>
${D.cab ? `<div class="cab"><img src="${dataUri(D.cab.file)}" alt="${esc(D.title)} driver's desk"></div>` : ''}
${D.diagram ? `<div class="diagram"><img id="diag" src="${dataUri(D.diagram.file)}" alt="${esc(D.title)} side view"></div>` : ''}
<div class="foot"><span>${esc(D.diagram && D.diagram.source || '')}</span><span>${esc([D.dlc, D.cab ? 'Profile: ' + (D.profileName || '') : ''].filter(Boolean).join(' · '))}</span><span>${esc(D.credit || '')}</span></div>
</div>
${D.diagram && D.diagram.clean !== false ? `<script>
// strip the flat background around the side view: flood fill from the picture edges, pixels close to the edge colour become transparent
(function(){var img=document.getElementById('diag');if(!img)return;var tol=${Number(D.diagram.tolerance) || 40};
function go(){try{var W=Math.min(2400,img.naturalWidth||2400),H=Math.round(W*(img.naturalHeight||1)/(img.naturalWidth||1));var c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');x.drawImage(img,0,0,W,H);
var d=x.getImageData(0,0,W,H),p=d.data,ref=function(i){return[p[i*4],p[i*4+1],p[i*4+2],p[i*4+3]];};
var cs=[0,W-1,(H-1)*W,(H-1)*W+W-1].map(ref);if(cs.every(function(k){return k[3]<10;}))return;
var bg=[0,1,2].map(function(k){return cs.map(function(c){return c[k];}).sort(function(a,b){return a-b;})[1];});
var near=function(i){var r=p[i*4]-bg[0],g=p[i*4+1]-bg[1],b=p[i*4+2]-bg[2];return r*r+g*g+b*b<=tol*tol;};
var seen=new Uint8Array(W*H),st=[],i;for(i=0;i<W;i++){st.push(i,(H-1)*W+i);}for(i=0;i<H;i++){st.push(i*W,i*W+W-1);}
while(st.length){i=st.pop();if(seen[i]||!near(i))continue;seen[i]=1;p[i*4+3]=0;var x0=i%W,y0=(i/W)|0;if(x0>0)st.push(i-1);if(x0<W-1)st.push(i+1);if(y0>0)st.push(i-W);if(y0<H-1)st.push(i+W);}
x.putImageData(d,0,0);img.src=c.toDataURL('image/png');}catch(e){}}
if(img.complete&&img.naturalWidth)go();else img.addEventListener('load',go,{once:true});})();
</script>` : ''}
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const base = path.join(outDir, D.name);
fs.writeFileSync(base + '.html', html);
const browsers = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const browser = browsers.find(b => fs.existsSync(b));
if (!browser) { console.error('no Chrome/Edge found; HTML written to ' + base + '.html'); process.exit(2); }
try { fs.unlinkSync(base + '.pdf'); } catch (e) {}
cp.execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000', '--print-to-pdf=' + base + '.pdf', 'file:///' + (base + '.html').replace(/\\/g, '/')], { stdio: 'ignore' });
console.log('wrote', base + '.html', 'and', base + '.pdf');
