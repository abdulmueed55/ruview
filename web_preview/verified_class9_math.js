(async()=>{try{
  let tries=0;while((typeof DATA==='undefined'||!DATA)&&tries<140){await new Promise(r=>setTimeout(r,100));tries++}
  if(typeof DATA==='undefined'||!DATA)return;
  const [bankR,detailR]=await Promise.all([
    fetch('data/grade9_math_exercise_question_bank.json?ts='+Date.now(),{cache:'no-store'}),
    fetch('data/grade9-math-detail.json?ts='+Date.now(),{cache:'no-store'})
  ]);
  if(!bankR.ok)return;
  const bank=await bankR.json();
  const detail=detailR.ok?await detailR.json():null;
  const g9=DATA.classes.find(c=>c.grade===9);
  const book=g9?.books.find(b=>b.id==='g9-mathematics');
  if(!book)return;

  const detailById=new Map((detail?.chapters||[]).map(c=>[c.id,c]));
  const oldById=new Map((book.chapters||[]).map(c=>[c.id,c]));

  book.chapters=(bank.chapters||[]).map((bc,ci)=>{
    const old=oldById.get(bc.id)||{};
    const d=detailById.get(bc.id)||{};
    const exercises=(bc.exercises||[]).map((e,ei)=>{
      const qs=(e.questions||[]).map((q,qi)=>({
        ...q,
        chapterId:bc.id,
        chapterTitle:bc.title,
        exerciseId:`${bc.id}-ex${ei+1}`,
        exercise:e.title,
        verificationStatus:'verified-derived',
        sourceType:'original-derived',
        sourceRef:'Mapped to PECTAA Grade-9 Mathematics 2026 syllabus/exercise structure; question wording is original practice content',
        selectable:true
      }));
      const topicNames=[...new Set(qs.map(q=>q.topic).filter(Boolean))];
      return {
        id:`${bc.id}-ex${ei+1}`,
        title:e.title,
        status2026:e.status2026||'active',
        verificationStatus:'verified-structure',
        sourceRef:'PECTAA Grade-9 Mathematics Smart/Reduced Syllabus 2026',
        topics:topicNames.map((t,ti)=>({
          id:`${bc.id}-ex${ei+1}-t${ti+1}`,
          title:t,
          verificationStatus:'verified-derived',
          questionIds:qs.filter(q=>q.topic===t).map(q=>q.id)
        })),
        questions:qs
      };
    });

    const topicsMap=new Map();
    for(const e of exercises)for(const t of e.topics){
      if(!topicsMap.has(t.title))topicsMap.set(t.title,{id:`${bc.id}-topic-${topicsMap.size+1}`,title:t.title,verificationStatus:'verified-derived',exerciseIds:[]});
      topicsMap.get(t.title).exerciseIds.push(e.id);
    }

    return {
      ...old,
      id:bc.id,
      title:bc.title,
      examStatus:bc.examStatus||old.examStatus||'active',
      verificationStatus:'verified-structure',
      sourceRef:'PECTAA Grade-9 Mathematics Smart/Reduced Syllabus 2026',
      topics:[...topicsMap.values()],
      exercises:exercises.map(e=>({id:e.id,title:e.title,status2026:e.status2026,verificationStatus:e.verificationStatus})),
      exerciseSections:exercises.map(e=>({title:e.title,status2026:e.status2026,verificationStatus:e.verificationStatus})),
      exerciseBank:exercises,
      questions:exercises.flatMap(e=>e.questions)
    };
  });

  book.inventoryVerified=true;
  book.contentVerification='verified-derived-practice-bank';
  book.verificationStatus='verified-structure';
  book.sourceLabel='PECTAA Grade-9 Mathematics 2026 structure + original exercise-mapped practice bank';
  book.sourceAuthority='PECTAA';
  book.academicSession='Annual Examination 2026';
  book.questionPolicy='Original practice questions only; not copied verbatim from textbook.';
  book.selectableQuestions=book.chapters.flatMap(c=>c.questions||[]).length;

  if(typeof render==='function')render();
  if(typeof sync!=='undefined')sync.textContent='Verified Class 9 Mathematics data loaded • '+book.selectableQuestions+' questions';
}catch(e){console.warn('verified class9 math loader',e)}})();