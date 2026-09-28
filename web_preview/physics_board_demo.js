(function(){
  function take(arr,n){return arr.slice(0,n)}
  function qsBy(ch,type){return (ch.questions||[]).filter(q=>String(q.type).toLowerCase()===String(type).toLowerCase())}
  function longQs(ch){return (ch.questions||[]).filter(q=>['long','crq'].includes(String(q.type).toLowerCase()))}
  function mcqHtml(q,i){return '<div class="board-mcq"><b>'+(i+1)+'.</b> '+esc(q.text)+'<div class="board-options">'+(q.options||[]).map((o,j)=>'<span>'+String.fromCharCode(65+j)+'. '+esc(o)+'</span>').join('')+'</div></div>'}
  function shortHtml(q,i){return '<div class="board-short"><b>'+String.fromCharCode(97+i)+')</b> '+esc(q.text)+'</div>'}
  function detailedHtml(num,a,b){return '<div class="board-detail"><div><b>Q'+num+' (a)</b> '+esc(a.text)+' <span>[4]</span></div><div><b>Q'+num+' (b)</b> '+esc(b.text)+' <span>[5]</span></div></div>'}

  function renderPhysicsBoardDemo(){
    const g9=DATA.classes.find(c=>c.grade===9),book=g9?.books.find(b=>b.id==='g9-physics');
    if(!book||book.chapters.length<9)return;
    title.textContent='Physics Board Paper 2026';
    const ch=book.chapters;

    const mcqPlan=[1,1,2,2,1,2,1,1,1];
    const mcqs=[];
    mcqPlan.forEach((n,i)=>mcqs.push(...take(qsBy(ch[i],'MCQ'),n)));

    const q2=[...take(qsBy(ch[0],'Short'),3),...take(qsBy(ch[2],'Short'),3),...take(qsBy(ch[1],'Short'),2)];
    const q3=[...take(qsBy(ch[3],'Short'),3),...take(qsBy(ch[4],'Short'),3),...take(qsBy(ch[5],'Short'),2)];
    const q4=[...take(qsBy(ch[6],'Short'),3),...take(qsBy(ch[7],'Short'),3),...take(qsBy(ch[8],'Short'),2)];

    function pickDetailed(group){
      const a=longQs(ch[group[0]])[0]||qsBy(ch[group[0]],'Short')[0];
      const b=longQs(ch[group[1]])[0]||longQs(ch[group[2]])[0]||qsBy(ch[group[1]],'Short')[0];
      return [a,b];
    }
    const d5=pickDetailed([0,1,2]),d6=pickDetailed([3,4,5]),d7=pickDetailed([6,7,8]);

    app.innerHTML=
      '<button class="back" id="backPhysics">← Back to Physics</button>'+
      '<div class="board-demo-toolbar"><div><b>Official 2026 Scheme Demo</b><span>Class 9 Physics • 60 marks • 2 hours</span></div><button class="primary" id="printPhysics">Print / Save PDF</button></div>'+
      '<div class="board-paper">'+
        '<div class="board-title">CLASS IX — PHYSICS</div>'+
        '<div class="board-subtitle">Board-Style Model Paper • Annual Examination 2026</div>'+
        '<div class="board-meta"><span><b>Total Marks:</b> 60</span><span><b>Time:</b> 2 Hours</span><span><b>Objective:</b> 15 min</span><span><b>Subjective:</b> 1 hr 45 min</span></div>'+
        '<div class="board-section"><h3>PART-I — OBJECTIVE <span>12 Marks</span></h3><p>Q1. Attempt all MCQs.</p>'+mcqs.map(mcqHtml).join('')+'</div>'+
        '<div class="board-section"><h3>PART-II — SUBJECTIVE <span>30 Marks</span></h3>'+
          '<div class="board-qgroup"><h4>Q2. Attempt any 5 out of 8. <span>(2×5=10)</span></h4>'+q2.map(shortHtml).join('')+'</div>'+
          '<div class="board-qgroup"><h4>Q3. Attempt any 5 out of 8. <span>(2×5=10)</span></h4>'+q3.map(shortHtml).join('')+'</div>'+
          '<div class="board-qgroup"><h4>Q4. Attempt any 5 out of 8. <span>(2×5=10)</span></h4>'+q4.map(shortHtml).join('')+'</div>'+
        '</div>'+
        '<div class="board-section"><h3>PART-III — DETAILED QUESTIONS <span>18 Marks</span></h3><p>Attempt any 2 questions. Each question carries 9 marks.</p>'+
          detailedHtml(5,d5[0],d5[1])+detailedHtml(6,d6[0],d6[1])+detailedHtml(7,d7[0],d7[1])+
        '</div>'+
        '<div class="board-note"><b>Scheme used:</b> MCQs: Ch. 3,4,6 = 2 each; Ch. 1,2,5,7,8,9 = 1 each. Q2: Ch.1×3 + Ch.3×3 + Ch.2×2. Q3: Ch.4×3 + Ch.5×3 + Ch.6×2. Q4: Ch.7×3 + Ch.8×3 + Ch.9×2. Long groups: 1–3, 4–6, 7–9.</div>'+
      '</div>';
    document.getElementById('backPhysics').onclick=()=>{selectedChapter=null;window.renderBook()};
    document.getElementById('printPhysics').onclick=()=>window.print();
  }

  const oldRenderBook=window.renderBook;
  window.renderBook=function(){
    oldRenderBook();
    if(selectedChapter||selectedGrade!==9||selectedBook?.id!=='g9-physics')return;
    const panel=app.querySelector('.panel');
    if(!panel)return;
    const card=document.createElement('div');
    card.className='board-demo-card';
    card.innerHTML='<div><span class="board-demo-kicker">OFFICIAL 2026 PATTERN</span><h3>Generate Full Board-Style Physics Paper</h3><p>12 MCQs • 24 short questions across Q2–Q4 • 3 detailed questions • 60 marks • 2 hours</p></div><button class="primary" id="generatePhysicsBoard">Generate Demo Paper</button>';
    panel.insertBefore(card,panel.querySelector('.chapter-list'));
    document.getElementById('generatePhysicsBoard').onclick=renderPhysicsBoardDemo;
  };
  window.renderPhysicsBoardDemo=renderPhysicsBoardDemo;
})();