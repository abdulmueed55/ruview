(async()=>{try{
  const r=await fetch('data/official_catalog_2026_27.json?ts='+Date.now(),{cache:'no-store'});
  const catalog=r.ok?await r.json():null;
  let tries=0;while((typeof DATA==='undefined'||!DATA)&&tries<120){await new Promise(x=>setTimeout(x,100));tries++}
  if(typeof DATA==='undefined'||!DATA)return;

  // Strict rule: previously generated/generic practice questions are never selectable.
  for(const cls of DATA.classes||[]){
    for(const book of cls.books||[]){
      book.strictVerification=true;
      for(const ch of book.chapters||[]){
        ch.questions=[];
        for(const e of ch.exerciseBank||[])e.questions=[];
      }
    }
  }

  // Preserve inventory provenance from official PECTAA catalog.
  if(catalog){
    for(const cc of catalog.classes||[]){
      const cls=DATA.classes.find(c=>c.grade===cc.grade); if(!cls)continue;
      for(const b of cls.books||[]){
        const official=(cc.books||[]).find(x=>x.id===b.id);
        b.inventoryVerified=!!official;
        b.inventorySource=official?'PECTAA current e-book listing':'Not matched to strict official catalog';
        b.contentVerification='pending-textbook-inspection';
      }
    }
  }

  // Grade 9 Mathematics: keep structure/exclusion metadata only; no synthetic practice records.
  const g9=DATA.classes.find(c=>c.grade===9);
  const math=g9?.books.find(b=>b.id==='g9-mathematics');
  if(math){
    math.contentVerification='structure-only';
    math.sourceLabel='PECTAA Grade-9 Mathematics ALP / current textbook structure — questions hidden until source-verified';
  }

  if(typeof render==='function')render();
  if(typeof sync!=='undefined')sync.textContent='Strict verified-only mode • generated questions disabled';
}catch(e){console.warn('verified-only gate',e)}})();