const fs=require('fs');
let xml=fs.readFileSync(process.argv[2],'utf8');
// remove drawings (anchors) to see body flow
xml=xml.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g,'[DRAWING]');
const body=xml.match(/<w:body>([\s\S]*)<\/w:body>/)[1];
// iterate top-level: paragraphs and tables
const re=/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g;
let m,i=0;
while((m=re.exec(body))){
  const el=m[0];
  if(el.startsWith('<w:tbl>')){
    const rows=el.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g)||[];
    console.log(`${i++}\tTABLE rows=${rows.length}`);
    rows.forEach((r,ri)=>{const cells=(r.match(/<w:tc>[\s\S]*?<\/w:tc>/g)||[]).map(c=>c.replace(/<\/w:p>/g,' / ').replace(/<[^>]+>/g,'').trim().slice(0,90));console.log(`\t\trow${ri}: ${cells.join(' || ')}`);});
  } else {
    const style=(el.match(/<w:pStyle w:val="([^"]+)"/)||[])[1]||'';
    const num=(el.match(/<w:numId w:val="(\d+)"/)||[])[1];
    const ilvl=(el.match(/<w:ilvl w:val="(\d+)"/)||[])[1];
    const br=/<w:br w:type="page"\/>/.test(el)?' [PAGEBREAK]':'';
    const sect=/<w:sectPr/.test(el)?' [SECT]':'';
    const text=el.replace(/<[^>]+>/g,'').trim();
    console.log(`${i++}\tP style=${style}${num?' num='+num+'/'+ilvl:''}${br}${sect}\t${text.slice(0,100)}`);
  }
}
