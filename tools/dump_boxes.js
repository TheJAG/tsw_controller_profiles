const fs=require('fs');
const xml=fs.readFileSync(process.argv[2],'utf8');
// split into anchors
const re=/<wp:anchor[\s\S]*?<\/wp:anchor>/g;
let m,i=0;
while((m=re.exec(xml))){
  const a=m[0];
  const h=(a.match(/<wp:positionH[^>]*>[\s\S]*?<wp:posOffset>(-?\d+)<\/wp:posOffset>/)||[])[1];
  const v=(a.match(/<wp:positionV[^>]*>[\s\S]*?<wp:posOffset>(-?\d+)<\/wp:posOffset>/)||[])[1];
  const ext=(a.match(/<wp:extent cx="(\d+)" cy="(\d+)"/)||[]);
  const name=(a.match(/<wp:docPr id="\d+" name="([^"]*)"/)||[])[1];
  const txb=a.match(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/);
  let text='';
  if(txb){ text=txb[0].replace(/<\/w:p>/g,' | ').replace(/<w:tab\/>/g,'\t').replace(/<[^>]+>/g,'').trim(); }
  const pic=/<pic:pic/.test(a)?' [PIC '+((a.match(/r:embed="([^"]+)"/)||[])[1])+']':'';
  const shape=(a.match(/<a:prstGeom prst="([^"]+)"/)||[])[1]||'';
  console.log(`${i++}\t${name}\tx=${h}\ty=${v}\tcx=${ext[1]}\tcy=${ext[2]}\t${shape}${pic}\t${text}`);
}
