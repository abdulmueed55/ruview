(async()=>{try{
  const r=await fetch('data/official_catalog_2026_27.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)return;
  const catalog=await r.json();
  let tries=0;while((typeof DATA==='undefined'||!DATA)&&tries<120){await new Promise(x=>setTimeout(x,100));tries++}
  if(typeof DATA==='undefined'||!DATA)return;
  const iconFor=t=>/math/i.test(t)?'➗':/physics|chemistry|biology|science/i.test(t)?'🧪':/computer/i.test(t)?'💻':'📘';
  for(const cc of catalog.classes||[]){
    const cls=DATA.classes.find(c=>c.grade===cc.grade);if(!cls)continue;
    const oldById=new Map((cls.books||[]).map(b=>[b.id,b]));
    cls.books=(cc.books||[]).map(spec=>{
      const old=oldById.get(spec.id)||{};
      return {
        ...old,
        id:spec.id,
        title:spec.title,
        track:spec.track,
        medium:old.medium||'English / Urdu',
        academicSession:old.academicSession||'Current PECTAA listing',
        icon:old.icon||iconFor(spec.title),
        inventoryVerified:true,
        inventorySource:'PECTAA current e-book listing',
        contentVerification:old.contentVerification||'pending-textbook-inspection',
        sourceLabel:old.sourceLabel||'PECTAA official book inventory — detailed content pending textbook verification',
        chapters:Array.isArray(old.chapters)?old.chapters:[]
      };
    });
  }
  if(typeof render==='function')render();
}catch(e){console.warn('official catalog patch',e)}})();