const {api}=require('./tswapi.js');
const fs=require('fs');
(async()=>{
  const cls=await api('/get/CurrentDrivableActor.ObjectClass');
  const list=await api('/list/CurrentDrivableActor');
  const out={objectClass:cls.Values.ObjectClass,controls:[]};
  for(const n of list.Nodes){
    const name=n.Name;
    const oc=await api('/get/CurrentDrivableActor/'+encodeURIComponent(name)+'.ObjectClass');
    const iv=await api('/get/CurrentDrivableActor/'+encodeURIComponent(name)+'.InputValue');
    const rec={name,objectClass:oc&&oc.Values?oc.Values.ObjectClass:null};
    if(iv&&iv.Result==='Success'&&iv.Values&&iv.Values.InputValue!==undefined){
      rec.inputValue=iv.Values.InputValue;
      const id=await api('/get/CurrentDrivableActor/'+encodeURIComponent(name)+'.Property.InputIdentifier');
      rec.identifier=id&&id.Values?id.Values.identifier:null;
      const di=await api('/get/CurrentDrivableActor/'+encodeURIComponent(name)+'.Property.DisplayInfo');
      rec.named=di&&di.Values&&di.Values.namedValues?di.Values.namedValues.map(v=>v.displayName+'['+v.valueSource+' '+v.valueRange.min+'..'+v.valueRange.max+']').join(' | '):'';
    }
    out.controls.push(rec);
  }
  fs.writeFileSync(process.argv[2],JSON.stringify(out,null,2));
  console.log('class',out.objectClass,'nodes',out.controls.length);
  for(const c of out.controls) if(c.inputValue!==undefined) console.log([c.name,c.objectClass,c.identifier,c.inputValue,c.named].join('\t'));
})();
