// Safety-systems manual generator: one country's signal aspects and train protection, A4, several pages, in the style of the train manuals.
// Usage (from repo root): node tools/manual/render_safety.js tools/manual/safety/<country>.json [outdir]
// Produces <outdir>/<name>.html (self-contained) and <outdir>/<name>.pdf printed with headless Chrome/Edge, then reports any page whose
// content runs past the sheet (the overflow check runs in the page itself and is read back with --dump-dom).
// Default outdir: profiles/documentation. Data format: tools/manual/safety/README.md.
const fs = require('fs'), path = require('path'), cp = require('child_process');

const dataPath = process.argv[2];
if (!dataPath) { console.error('usage: node tools/manual/render_safety.js tools/manual/safety/<country>.json [outdir]'); process.exit(1); }
const D = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const dataDir = path.dirname(path.resolve(dataPath));
const repoRoot = path.resolve(__dirname, '..', '..');
const outDir = path.resolve(process.argv[3] || path.join(repoRoot, 'profiles', 'documentation'));
const asset = f => path.isAbsolute(f) ? f : path.resolve(dataDir, f);
const dataUri = f => { const p = asset(f); const ext = path.extname(p).toLowerCase(); const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream'; return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`; };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const C = Object.assign({ navy: '#223261', blue: '#4a66a8', red: '#d7263d', green: '#1f9d55', paper: '#f3f5f9', ink: '#141a2b', muted: '#5b6478', rule: '#cfd5e2' }, D.colors || {});

/* ---------- signal drawings ---------- */
const LAMP = { red: '#e3262e', yellow: '#ffb400', green: '#16c46c', white: '#f6f6ee', lunar: '#dde7ff', blue: '#3c7cff', orange: '#ff7a00', purple: '#a24bff' };
const INK = { black: '#16181d', white: '#ffffff', yellow: '#ffcc00', red: '#d4202a', green: '#128a4a', blue: '#1f4fb5', orange: '#ff7a00', grey: '#8a8f99' };
const col = c => INK[c] || LAMP[c] || c;
const rays = (x, y, r) => { let s = ''; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, c = Math.cos(a), d = Math.sin(a); s += `<line x1="${(x + c * (r + 3)).toFixed(1)}" y1="${(y + d * (r + 3)).toFixed(1)}" x2="${(x + c * (r + 7)).toFixed(1)}" y2="${(y + d * (r + 7)).toFixed(1)}" class="ray"/>`; } return s; };
function lamp(x, y, c, s, r = 7) {
  if (s === 'off' || s === '-') return `<circle cx="${x}" cy="${y}" r="${r}" class="dark"/>`;
  const f = LAMP[c] || c;
  return `<circle cx="${x}" cy="${y}" r="${r + 3.5}" fill="${f}" opacity=".28"/><circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>` + (s === 'flash' || s === '*' ? rays(x, y, r) : '');
}
// each part returns {w, h, draw(x0, y0)} where x0 is the centre line
function part(p) {
  if (p.kind === 'head' && p.column) {
    const r = p.r || 7, gap = r * 2 + 7, n = p.column.length, w = r * 2 + 14, h = n * gap + 5;
    return { w, h, draw: (cx, y) => `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${p.shape === 'round' ? w / 2 : 5}" class="head"/>` +
      p.column.map((l, i) => { const m = /^([a-z#0-9]+)([*-]?)$/.exec(l) || [0, l, '']; return lamp(cx, y + 5 + gap / 2 + i * gap, m[1], m[2] === '*' ? 'flash' : m[2] === '-' ? 'off' : 'on', r); }).join('') };
  }
  if (p.kind === 'head') {
    const w = p.w || 40, h = p.h || 40;
    return { w, h, draw: (cx, y) => (p.shape === 'none' ? '' : `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${p.shape === 'round' ? Math.min(w, h) / 2 : p.rx != null ? p.rx : 5}" class="head"${p.fill ? ` style="fill:${col(p.fill)}"` : ''}/>`) +
      (p.lamps || []).map(l => lamp(cx - w / 2 + l.x, y + l.y, l.c, l.s || 'on', l.r || 7)).join('') };
  }
  if (p.kind === 'number') {
    const t = String(p.text), w = Math.max(30, t.length * 14 + 12), h = 30, s = p.s || 'on';
    return { w, h, draw: (cx, y) => `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="4" class="head"/>` +
      `<text x="${cx}" y="${y + 23}" class="num" text-anchor="middle" fill="${s === 'off' ? '#3a3d45' : LAMP[p.color || 'white'] || p.color}">${esc(t)}</text>` + (s === 'flash' ? rays(cx - w / 2 + 3, y + 3, 1) + rays(cx + w / 2 - 3, y + 3, 1) : '') };
  }
  if (p.kind === 'plate') {
    const lines = String(p.text || '').split('\n'), shape = p.shape || 'rect', fg = col(p.fg || 'black'), bg = col(p.bg || 'white'), bd = col(p.border || 'black');
    const long = Math.max(...lines.map(l => l.length)), fs = p.size || (long > 3 ? 11 : lines.length > 1 ? 13 : 17);
    let w = p.w || Math.max(30, long * fs * 0.62 + 12), h = p.h || Math.max(30, lines.length * fs * 1.05 + 10);
    if (shape === 'triangle' || shape === 'triangle-down') { w = p.w || Math.max(w + 12, 42); h = p.h || Math.round(w * 0.87); }
    if (shape === 'diamond' || shape === 'circle' || shape === 'square') { w = h = p.w || Math.max(w, h, 34); }
    return { w, h, draw: (cx, y) => {
      let g; const x = cx - w / 2;
      if (shape === 'triangle') g = `<path d="M${cx} ${y + 1} L${x + w - 1} ${y + h - 1} L${x + 1} ${y + h - 1}Z"`;
      else if (shape === 'triangle-down') g = `<path d="M${x + 1} ${y + 1} L${x + w - 1} ${y + 1} L${cx} ${y + h - 1}Z"`;
      else if (shape === 'diamond') g = `<path d="M${cx} ${y + 1} L${x + w - 1} ${y + h / 2} L${cx} ${y + h - 1} L${x + 1} ${y + h / 2}Z"`;
      else if (shape === 'circle') g = `<circle cx="${cx}" cy="${y + h / 2}" r="${w / 2 - 1}"`;
      else g = `<rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${h - 1.5}" rx="${p.rx != null ? p.rx : 2}"`;
      g += ` fill="${bg}" stroke="${bd}" stroke-width="${p.bw || 1.5}" stroke-linejoin="round"/>`;
      const ty = shape === 'triangle' ? y + h * 0.62 : shape === 'triangle-down' ? y + h * 0.38 : y + h / 2;
      return g + lines.map((l, i) => `<text x="${cx}" y="${(ty + (i - (lines.length - 1) / 2) * fs * 1.05 + fs * 0.36).toFixed(1)}" class="pt" style="font-size:${fs}px" fill="${fg}" text-anchor="middle">${esc(l)}</text>`).join('');
    } };
  }
  if (p.kind === 'arm') {
    // semaphore arm pivoting on the post; angle in degrees, positive = raised (upper quadrant), negative = lowered
    const side = p.side === 'left' ? -1 : 1, L = 46, distant = p.type === 'distant';
    if (p.type === 'de') { // German Formhauptsignal: white arm with a red rim, round disc at the end
      const rise = L * Math.sin((p.angle || 0) * Math.PI / 180);
      return { w: 2 * L + 20, h: 22 + Math.abs(rise), draw: (cx, y) => { const py = y + 11 + Math.max(0, rise);
        return `<g transform="translate(${cx} ${py}) scale(${side} 1) rotate(${-(p.angle || 0)})"><rect x="0" y="-4.5" width="${L - 6}" height="9" fill="#fff" stroke="${INK.red}" stroke-width="2.2"/><circle cx="${L}" cy="0" r="9" fill="#fff" stroke="${INK.red}" stroke-width="2.6"/></g><circle cx="${cx}" cy="${py}" r="3" fill="#222"/>`; } };
    }
    const rise = L * Math.sin((p.angle || 0) * Math.PI / 180);
    return { w: 2 * L + 8, h: 14 + Math.abs(rise), draw: (cx, y) => { const py = y + 7 + Math.max(0, rise);
      const body = distant ? `<path d="M0 -5 L${L} -5 L${L - 8} 0 L${L} 5 L0 5Z" fill="${INK.yellow}" stroke="#222" stroke-width="1"/><path d="M${L - 16} -5 L${L - 22} 0 L${L - 16} 5" fill="none" stroke="#222" stroke-width="2.5"/>`
        : `<rect x="0" y="-5" width="${L}" height="10" fill="${INK.red}" stroke="#222" stroke-width="1"/><rect x="${L - 16}" y="-5" width="6" height="10" fill="#fff"/>`;
      return `<g transform="translate(${cx} ${py}) scale(${side} 1) rotate(${-(p.angle || 0)})">${body}</g><circle cx="${cx}" cy="${py}" r="3" fill="#222"/>`; } };
  }
  if (p.kind === 'gap') return { w: 0, h: p.h || 6, draw: () => '' };
  throw new Error('unknown signal part ' + JSON.stringify(p));
}
// one signal: parts stacked top-down on a post that runs to the ground line at height H
function signalSvg(sig, H) {
  const ps = (sig.parts || []).map(part), gap = 4;
  const W = Math.max(64, ...ps.map(p => p.w + 16));
  const cx = W / 2, top = 6;
  const content = ps.reduce((a, p) => a + p.h + gap, 0) - gap;
  let s = '';
  let y = sig.post === false ? (H - content) / 2 : sig.post === 'short' ? Math.max(top, H - content - 26) : top;
  // the post starts behind the first part, never above it
  const postTop = y + Math.min(10, ps.length ? ps[0].h / 2 : 0);
  if (sig.post !== false) s += `<rect x="${cx - 3}" y="${postTop}" width="6" height="${H - postTop}" class="post"/>`;
  s += `<line x1="6" y1="${H}" x2="${W - 6}" y2="${H}" class="ground"/>`;
  ps.forEach(p => { s += p.draw(cx, y); y += p.h + gap; });
  return `<svg viewBox="0 0 ${W} ${H + 3}" width="${W}" height="${H + 3}" class="sig">${s}</svg>`;
}
const sigHeight = sig => (sig.parts || []).map(part).reduce((a, p) => a + p.h + 4, 0) + (sig.post === false ? 10 : 30);

/* ---------- sections ---------- */
const li = arr => (arr || []).map(x => `<li>${md(x)}</li>`).join('');
function section(S) {
  const h = S.title ? `<h2>${esc(S.title)}</h2>` : '';
  if (S.kind === 'intro') return `<section class="intro">${h}${(S.paragraphs || []).map(p => `<p>${md(p)}</p>`).join('')}</section>`;
  if (S.kind === 'systems') return `<section>${h}<div class="sys" style="grid-template-columns:repeat(${S.cols || Math.min(3, S.items.length)},1fr)">${S.items.map(it => `<div class="card"><div class="sn">${esc(it.name)}</div><div class="sf">${esc(it.full || '')}</div><p>${md(it.summary || '')}</p>` +
    (it.where ? `<div class="kv"><span>Where</span>${md(it.where)}</div>` : '') + (it.quadrant ? `<div class="kv q"><span>Quadrant</span>${md(it.quadrant)}</div>` : '') + `</div>`).join('')}</div></section>`;
  if (S.kind === 'aspects') {
    const H = Math.max(96, ...S.items.map(it => sigHeight(it.signal)));
    return `<section>${h}${S.note ? `<div class="note">${md(S.note)}</div>` : ''}<div class="asp" style="grid-template-columns:repeat(${S.cols || 4},1fr)">${S.items.map(it => `<div class="card"><div class="pic">${signalSvg(it.signal, H)}</div><div class="an">${esc(it.name)}</div><div class="am">${md(it.meaning || '')}</div>` +
      (it.drive ? `<div class="ad"><span>Drive</span>${md(it.drive)}</div>` : '') + `</div>`).join('')}</div></section>`;
  }
  if (S.kind === 'howto') return `<section>${h}<div class="how" style="grid-template-columns:repeat(${S.cols || 2},1fr)">${S.blocks.map(b => `<div class="blk"><h3>${esc(b.title)}</h3>` +
    (b.steps ? `<ol>${li(b.steps)}</ol>` : '') + (b.bullets ? `<ul>${li(b.bullets)}</ul>` : '') + (b.note ? `<div class="note">${md(b.note)}</div>` : '') + `</div>`).join('')}</div></section>`;
  if (S.kind === 'table') return `<section>${h}<table><thead><tr>${S.head.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${S.rows.map(r => `<tr>${r.map(c => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`;
  if (S.kind === 'callout') return `<section class="callout"><b>${esc(S.title || '')}</b> ${md(S.text || '')}</section>`;
  throw new Error('unknown section kind ' + S.kind);
}

const logos = (D.logos || []).map(l => `<img class="logo" src="${dataUri(l.file)}" alt="${esc(l.alt || '')}">`).join('');
const N = D.pages.length;
const pages = D.pages.map((P, i) => `<div class="sheet" data-page="${i + 1}">
<div class="head${i ? ' small' : ''}"><div class="ht"><div class="sub">${esc(D.eyebrow || '')}</div><h1>${esc(D.title)}</h1></div><div style="display:flex;gap:14px">${logos}</div></div>
<div class="body">${P.sections.map(section).join('')}</div>
<div class="foot"><span>${esc(D.sources && D.sources.length ? 'Sources: ' + D.sources.join(' · ') : '')}</span><span>${i + 1} / ${N}</span><span>${esc(D.credit || '')}</span></div>
</div>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(D.title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
@page { size: A4; margin: 0; }
:root { --navy: ${C.navy}; --blue: ${C.blue}; --red: ${C.red}; --green: ${C.green}; --paper: ${C.paper}; --ink: ${C.ink}; --muted: ${C.muted}; --rule: ${C.rule};
  --display: "Barlow Condensed", "Arial Narrow", sans-serif; --body: "Barlow", "Segoe UI", sans-serif; }
html, body { margin: 0; padding: 0; background: #fff; }
.sheet { width: 794px; height: 1122px; background: var(--paper); color: var(--ink); position: relative; overflow: hidden; font-size: 11px; line-height: 1.32; font-family: var(--body); break-after: page; }
.sheet:last-child { break-after: auto; }
.sheet * { box-sizing: border-box; }
h1, h2, h3 { font-family: var(--display); margin: 0; line-height: 1; }
.logo { height: 28px; width: auto; max-width: 150px; object-fit: contain; display: block; }
.head { padding: 22px 36px 4px; display: flex; gap: 20px; align-items: flex-end; justify-content: space-between; }
.head h1 { font-size: 46px; font-weight: 700; color: var(--navy); letter-spacing: -.01em; }
.head.small { padding-top: 16px; } .head.small h1 { font-size: 26px; } .head.small .logo { height: 20px; }
/* header stays on one line: a long title next to wide logos gets a smaller size */
.head .ht { flex: 1 1 auto; min-width: 0; } .head .ht h1, .head .sub { white-space: nowrap; } .head > div:last-child { flex: 0 0 auto; }
.head:not(.small) h1 { font-size: ${D.title.length > 24 ? 38 : 46}px; }
.head .sub { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; font-family: var(--display); font-weight: 600; }
.sheet { display: flex; flex-direction: column; }
/* the body takes the room between the header and the footer, so the overflow check also catches text running into the footer */
.body { flex: 1 1 auto; min-height: 0; margin: 0 36px 4px; overflow: hidden; }
section { margin-top: 12px; }
h2 { font-size: 15px; color: var(--navy); margin-bottom: 6px; border-bottom: 1.5px solid var(--navy); padding-bottom: 3px; }
h3 { font-size: 13px; color: var(--navy); margin-bottom: 3px; }
p { margin: 0 0 5px; }
ul, ol { margin: 0; padding-left: 16px; } li { margin-bottom: 2px; }
.intro p { font-size: 11.5px; }
.card { background: #fff; border: 1px solid var(--rule); border-radius: 6px; padding: 7px 8px; }
.sys, .asp, .how { display: grid; gap: 7px; }
.sys .sn { font-family: var(--display); font-weight: 700; font-size: 17px; color: var(--navy); line-height: 1; }
.sys .sf { font-size: 9.5px; color: var(--muted); margin: 1px 0 4px; }
.kv { font-size: 10px; margin-top: 3px; } .kv span, .ad span { font-family: var(--display); font-weight: 700; text-transform: uppercase; letter-spacing: .06em; font-size: 9px; color: var(--blue); margin-right: 5px; }
.kv.q span { color: var(--green); }
.asp .card { display: flex; flex-direction: column; padding: 5px 7px 7px; }
.asp .pic { display: flex; justify-content: center; margin-bottom: 3px; }
.asp .an { font-family: var(--display); font-weight: 700; font-size: 13px; color: var(--navy); line-height: 1.05; margin-bottom: 2px; }
.asp .am { font-size: 10px; } .asp .ad { font-size: 10px; margin-top: 3px; padding-top: 3px; border-top: 1px dashed var(--rule); }
.sig .head { fill: #1b1d22; stroke: #000; stroke-width: 1; }
.sig .dark { fill: #3a3d45; }
.sig .ray { stroke: #e0a400; stroke-width: 1.6; stroke-linecap: round; }
.sig .post { fill: #9aa1ad; }
.sig .ground { stroke: var(--rule); stroke-width: 2; }
.sig .num { font-family: var(--display); font-weight: 700; font-size: 24px; }
.sig .pt { font-family: var(--display); font-weight: 700; }
.how .blk { background: #fff; border: 1px solid var(--rule); border-radius: 6px; padding: 7px 9px; }
.how ol li::marker { font-family: var(--display); font-weight: 700; color: var(--navy); }
.note { font-size: 10px; color: var(--muted); margin: 2px 0 6px; }
.blk .note { margin: 4px 0 0; }
table { width: 100%; border-collapse: collapse; background: #fff; font-size: 10.5px; }
th { font-family: var(--display); font-weight: 700; font-size: 11.5px; color: #fff; background: var(--navy); text-align: left; padding: 4px 6px; }
td { padding: 3px 6px; border-bottom: 1px solid var(--rule); vertical-align: top; }
.callout { background: #fff; border-left: 4px solid var(--red); border-radius: 4px; padding: 7px 10px; font-size: 11px; }
.callout b:first-child { font-family: var(--display); font-size: 13px; color: var(--red); margin-right: 4px; }
.foot { flex: 0 0 auto; padding: 6px 36px 8px; font-size: 9.5px; color: var(--muted); display: flex; justify-content: space-between; gap: 20px; }
.foot span:first-child { flex: 1; } .foot span:last-child { flex: 0 0 auto; }
</style></head><body>${pages}
<script>
// mark every page whose content runs past the sheet; render_safety.js reads data-overflow back with --dump-dom
document.fonts.ready.then(function(){var o=[];document.querySelectorAll('.sheet').forEach(function(s){var b=s.querySelector('.body');if(b.scrollHeight>b.clientHeight+1)o.push(s.dataset.page+':+'+(b.scrollHeight-b.clientHeight)+'px');});document.body.setAttribute('data-overflow',o.join(','));});
</script>
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const base = path.join(outDir, D.name);
fs.writeFileSync(base + '.html', html);
const browsers = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const browser = browsers.find(b => fs.existsSync(b));
if (!browser) { console.error('no Chrome/Edge found; HTML written to ' + base + '.html'); process.exit(2); }
const url = 'file:///' + (base + '.html').replace(/\\/g, '/');
try { fs.unlinkSync(base + '.pdf'); } catch (e) {}
cp.execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000', '--print-to-pdf=' + base + '.pdf', url], { stdio: 'ignore' });
console.log('wrote', base + '.html', 'and', base + '.pdf', '(' + N + ' pages)');
const dom = cp.execFileSync(browser, ['--headless=new', '--disable-gpu', '--virtual-time-budget=8000', '--dump-dom', url], { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
const m = /<body[^>]*data-overflow="([^"]*)"/.exec(dom);
if (!m) console.log('overflow check: no result (fonts not loaded in time?)');
else if (m[1]) { console.error('OVERFLOW on page ' + m[1] + ': shorten the text or move a section to the next page'); process.exit(3); }
else console.log('overflow check: every page fits');
