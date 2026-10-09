// Usage: node gen_manual.js <template.docx> <spec.json> <out.docx>
// spec: { boxes: {"<anchorIndex>": "line1\nline2"}, cells: {"old text": "new text"}, links: {"old-url": "new-url"}, photo: "path.jpg", photoExtent: {cx, cy} }
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [tpl, specPath, out] = process.argv.slice(2);
if (!tpl || !specPath || !out) { console.error('usage: node tools/gen_manual.js <template.docx> <spec.json> <out.docx>'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
// image paths in the spec are resolved relative to the spec file's folder
const specDir = path.dirname(path.resolve(specPath));
const resolveSpecPath = f => (path.isAbsolute(f) ? f : path.join(specDir, f));
if (spec.photo) spec.photo = resolveSpecPath(spec.photo);
for (const im of spec.inlineImages || []) im.file = resolveSpecPath(im.file);
if (spec.inlinePhoto) spec.inlinePhoto.file = resolveSpecPath(spec.inlinePhoto.file);
const work = fs.mkdtempSync(path.join(path.dirname(out), 'docx_'));
cp.execSync(`unzip -o -q "${tpl}" -d "${work}"`);
const docPath = path.join(work, 'word/document.xml');
let xml = fs.readFileSync(docPath, 'utf8');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\t/g, '</w:t><w:tab/><w:t xml:space="preserve">');
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// replace all paragraphs of a cell with the given lines, cloning the first paragraph's pPr/rPr
const rebuildParas = (inner, lines) => {
  const paras = inner.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
  if (!paras.length) return inner;
  const first = paras[0];
  const pPr = (first.match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [''])[0];
  const rPr = (first.match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0];
  return lines.map(l => `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${esc(l)}</w:t></w:r></w:p>`).join('');
};

// 1. text boxes addressed by anchor index (same order as dump_boxes.js)
let idx = 0;
xml = xml.replace(/<wp:anchor[\s\S]*?<\/wp:anchor>/g, a => {
  const i = idx++;
  const txt = spec.boxes && spec.boxes[String(i)];
  const ext = spec.boxExt && spec.boxExt[String(i)];
  if (ext) {
    if (ext.cx !== undefined && ext.cy !== undefined) {
      a = a.replace(/<wp:extent cx="\d+" cy="\d+"\/>/, `<wp:extent cx="${ext.cx}" cy="${ext.cy}"/>`)
           .replace(/<a:ext cx="\d+" cy="\d+"\/>/, `<a:ext cx="${ext.cx}" cy="${ext.cy}"/>`);
    }
    if (ext.x !== undefined) a = a.replace(/(<wp:positionH[^>]*>[\s\S]*?<wp:posOffset>)-?\d+(<\/wp:posOffset>)/, `$1${ext.x}$2`);
    if (ext.y !== undefined) a = a.replace(/(<wp:positionV[^>]*>[\s\S]*?<wp:posOffset>)-?\d+(<\/wp:posOffset>)/, `$1${ext.y}$2`);
  }
  if (txt === undefined) return a;
  return a.replace(/<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/, (m, inner) => {
    const paras = inner.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
    if (!paras.length) return m;
    const first = paras[0];
    const pPr = (first.match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [''])[0];
    const rPr = (first.match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0];
    const lines = txt.split('\n');
    const np = lines.map(l => `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${esc(l)}</w:t></w:r></w:p>`).join('');
    return `<w:txbxContent>${np}</w:txbxContent>`;
  });
});

// 2. plain text replacements inside <w:t> runs (title, checklist cells, link captions)
if (spec.cells) for (const [a, b] of Object.entries(spec.cells)) {
  const re = new RegExp('(<w:t(?: [^>]*)?>)' + reEsc(a) + '(</w:t>)', 'g');
  const n = (xml.match(re) || []).length;
  if (!n) console.warn('WARN cell text not found:', a);
  xml = xml.replace(re, (m, p1, p2) => p1 + esc(b) + p2);
}
// 2a. colorMap: {"OLDHEX": "NEWHEX"} applied to drawing fills (srgbClr) and run colours (w:color)
if (spec.colorMap) for (const [a, b] of Object.entries(spec.colorMap)) {
  const n1 = (xml.match(new RegExp(`srgbClr val="${a}"`, 'gi')) || []).length;
  const n2 = (xml.match(new RegExp(`w:color w:val="${a}"`, 'gi')) || []).length;
  if (!n1 && !n2) console.warn('WARN colour not found:', a);
  xml = xml.replace(new RegExp(`srgbClr val="${a}"`, 'gi'), `srgbClr val="${b}"`)
           .replace(new RegExp(`w:color w:val="${a}"`, 'gi'), `w:color w:val="${b}"`)
           .replace(new RegExp(`<w:background w:color="${a}"`, 'gi'), `<w:background w:color="${b}"`);
}
// 2b. tables (body order, template has no nested tables):
//     dropTables: [i]; dropRows: {"i": [r, ...]}; cellLines: {"t:r:c": ["line", ...]} replaces a cell's paragraphs
if (spec.dropTables || spec.dropRows || spec.cellLines) {
  let t = 0;
  xml = xml.replace(/<w:body>([\s\S]*)<\/w:body>/, (m, body) => {
    const nb = body.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, tbl => {
      const i = t++;
      if (spec.dropTables && spec.dropTables.includes(i)) return '';
      const rows = (spec.dropRows && spec.dropRows[String(i)]) || [];
      let r = 0;
      return tbl.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g, tr => {
        const ri = r++;
        if (rows.includes(ri)) return '';
        let c = 0;
        return tr.replace(/<w:tc>([\s\S]*?)<\/w:tc>/g, (mc, inner) => {
          const key = `${i}:${ri}:${c++}`;
          const lines = spec.cellLines && spec.cellLines[key];
          if (!lines) return mc;
          const tcPr = (inner.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/) || [''])[0];
          return '<w:tc>' + tcPr + rebuildParas(inner.replace(tcPr, ''), lines) + '</w:tc>';
        });
      });
    });
    return '<w:body>' + nb + '</w:body>';
  });
}
// 2b2. dropEmptyParasAfterTable: {"t": n} removes up to n empty paragraphs directly following table t
if (spec.dropEmptyParasAfterTable) {
  xml = xml.replace(/<w:body>([\s\S]*)<\/w:body>/, (m, body) => {
    let t = 0;
    const parts = body.split(/(<w:tbl>[\s\S]*?<\/w:tbl>)/);
    for (let i = 1; i < parts.length; i += 2) {
      const n = spec.dropEmptyParasAfterTable[String(t++)];
      if (!n) continue;
      let left = n;
      parts[i + 1] = parts[i + 1].replace(/<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g, p => {
        if (left > 0 && !/<w:t[ >]|<w:drawing|<w:pict|<w:sectPr/.test(p)) { left--; return ''; }
        return p;
      });
    }
    return '<w:body>' + parts.join('') + '</w:body>';
  });
}
// 2c. dropTrailingParas: remove every paragraph after the last table except the one carrying sectPr
if (spec.dropTrailingParas) {
  xml = xml.replace(/<w:body>([\s\S]*)<\/w:body>/, (m, body) => {
    const last = body.lastIndexOf('</w:tbl>');
    if (last < 0) return m;
    const head = body.slice(0, last + 8);
    let tail = body.slice(last + 8);
    tail = tail.replace(/<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g, p => (/<w:sectPr/.test(p) ? p : ''));
    // Word needs a paragraph after a trailing table; keep it tiny so it stays on the same page
    const tiny = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr></w:pPr></w:p>';
    return '<w:body>' + head + tiny + tail + '</w:body>';
  });
}
fs.writeFileSync(docPath, xml);

// 3. hyperlink targets
const relPath = path.join(work, 'word/_rels/document.xml.rels');
let rels = fs.readFileSync(relPath, 'utf8');
if (spec.links) for (const [a, b] of Object.entries(spec.links)) {
  if (!rels.includes(a)) console.warn('WARN link not found:', a);
  rels = rels.split(a).join(b.replace(/&/g, '&amp;'));
}
fs.writeFileSync(relPath, rels);

// 4. loco photo: inlinePhoto {rId, file, cx, cy} replaces the media file behind rId and resizes that inline drawing
const inlineImages = [].concat(spec.inlineImages || [], spec.inlinePhoto ? [spec.inlinePhoto] : []);
for (const p of inlineImages) {
  let target = (rels.match(new RegExp(`<Relationship Id="${p.rId}"[^>]*Target="([^"]+)"`)) || [])[1];
  if (!target) throw new Error('rId not found in rels: ' + p.rId);
  // keep the media extension consistent with the new file (content types are registered per extension)
  const newExt = path.extname(p.file).toLowerCase().replace('.jpg', '.jpeg');
  if (path.extname(target).toLowerCase() !== newExt) {
    const newTarget = target.replace(/\.[a-z]+$/i, newExt);
    rels = rels.replace(`Target="${target}"`, `Target="${newTarget}"`);
    fs.writeFileSync(relPath, rels);
    target = newTarget;
  }
  fs.copyFileSync(p.file, path.join(work, 'word', target));
  let doc = fs.readFileSync(docPath, 'utf8');
  doc = doc.replace(/<wp:inline[\s\S]*?<\/wp:inline>/g, inl => {
    if (!inl.includes(`r:embed="${p.rId}"`)) return inl;
    return inl.replace(/<wp:extent cx="\d+" cy="\d+"\/>/, `<wp:extent cx="${p.cx}" cy="${p.cy}"/>`)
              .replace(/<a:ext cx="\d+" cy="\d+"\/>/, `<a:ext cx="${p.cx}" cy="${p.cy}"/>`);
  });
  fs.writeFileSync(docPath, doc);
}

cp.execSync(`py -3 -I "${path.join(__dirname, 'zipdir.py')}" "${work}" "${out}"`, { stdio: 'inherit' });
fs.rmSync(work, { recursive: true, force: true });
console.log('wrote', out);
