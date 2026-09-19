(function(){
  if(typeof window.renderLibrary!=='function') return;
  const originalRenderLibrary=window.renderLibrary;
  const originalRenderBook=window.renderBook;
  const originalRenderChapter=window.renderChapter;

  function classQuestionCount(cls){
    return (cls.books||[]).flatMap(b=>b.chapters||[]).reduce((n,c)=>n+((c.exerciseBank||[]).flatMap(e=>e.questions||[]).length||(c.questions||[]).length),0);
  }

  window.renderLibrary=function(){
    if(!DATA)return;
    title.textContent='Teacher Test Studio';
    const cls=currentClass();
    const books=cls.books.filter(b=>b.title.toLowerCase().includes(search.toLowerCase()));
    const totalBooks=DATA.classes.flatMap(c=>c.books).length;
    const allQ=typeof allQuestions==='function'?allQuestions():[];
    app.innerHTML=
      '<div class="hero">'+
        '<div class="hero-content">'+
          '<div class="hero-kicker">SMART PAPER CREATION</div>'+
          '<h2>Create a polished test paper in minutes.</h2>'+
          '<p>Choose a class, open a subject, pick chapter-wise questions, and watch your final paper build live.</p>'+
          '<div class="hero-actions">'+
            '<button class="hero-btn" id="heroCreate">Create New Test</button>'+
            '<button class="hero-btn alt" id="heroBuilder">Open Paper Studio ('+picked.size+')</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="quick-stats">'+
        '<div class="quick-stat"><strong>'+DATA.classes.length+'</strong><span>Classes available</span></div>'+
        '<div class="quick-stat"><strong>'+totalBooks+'</strong><span>Subjects in library</span></div>'+
        '<div class="quick-stat"><strong>'+allQ.length+'</strong><span>Question records</span></div>'+
        '<div class="quick-stat"><strong>'+picked.size+'</strong><span>In current paper</span></div>'+
      '</div>'+
      '<div class="toolbar">'+
        '<input id="search" class="search" placeholder="Search subject, e.g. Mathematics or Physics…" value="'+esc(search)+'">'+
        '<select id="gradeSelect" class="select">'+DATA.classes.map(c=>'<option value="'+c.grade+'" '+(c.grade===selectedGrade?'selected':'')+'>Class '+c.grade+'</option>').join('')+'</select>'+
      '</div>'+
      '<div class="class-grid">'+DATA.classes.map(c=>'<div class="class-card '+(c.grade===selectedGrade?'active':'')+'" data-grade="'+c.grade+'"><div class="grade">'+c.grade+'</div><small>'+esc(c.levelLabel)+' • '+classQuestionCount(c)+' questions</small></div>').join('')+'</div>'+
      '<div class="section-head"><h2>Class '+cls.grade+' Subjects</h2><span class="pill">'+books.length+' subjects • '+picked.size+' selected</span></div>'+
      '<div class="book-list">'+(books.map((b,i)=>'<div class="book" data-book="'+i+'"><div class="book-icon">'+(b.icon||'📘')+'</div><div><h3>'+esc(b.title)+'</h3><p>'+(b.chapters||[]).length+' chapters • '+esc(b.medium)+' • '+esc(b.academicSession||'Current session')+'</p></div><div class="arrow">›</div></div>').join('')||'<div class="panel">No subject found.</div>')+'</div>';

    document.getElementById('search').oninput=e=>{search=e.target.value;window.renderLibrary()};
    document.getElementById('gradeSelect').onchange=e=>{selectedGrade=+e.target.value;search='';window.renderLibrary()};
    document.querySelectorAll('[data-grade]').forEach(x=>x.onclick=()=>{selectedGrade=+x.dataset.grade;search='';window.renderLibrary()});
    document.querySelectorAll('[data-book]').forEach(x=>x.onclick=()=>{selectedBook=books[+x.dataset.book];selectedChapter=null;window.renderBook()});
    document.getElementById('heroCreate').onclick=()=>document.getElementById('search').focus();
    document.getElementById('heroBuilder').onclick=()=>document.querySelector('[data-view=builder]').click();
  };

  window.renderBook=function(){
    title.textContent=selectedBook.title;
    if(selectedChapter)return window.renderChapter();
    const chapters=selectedBook.chapters||[];
    app.innerHTML=
      '<button class="back" id="back">← All Subjects</button>'+
      '<div class="panel"><div class="crumbs">Class '+selectedGrade+' / '+esc(selectedBook.title)+'</div>'+
      '<div class="section-head"><h2>'+esc(selectedBook.title)+'</h2><span class="pill">'+chapters.length+' chapters</span></div>'+
      '<p style="color:var(--muted);font-size:11px;margin:-2px 0 15px">'+esc(selectedBook.detailSourceLabel||selectedBook.sourceLabel||'Punjab curriculum')+' • '+esc(selectedBook.academicSession||'Current session')+'</p>'+
      '<div class="chapter-list">'+(chapters.map((c,i)=>'<div class="chapter" data-ch="'+i+'"><div class="num">'+(i+1)+'</div><div><h4>'+esc(c.title)+'</h4><p>'+((c.exerciseSections||c.exercises||[]).length)+' sections • '+countChapterQuestions(c)+' selectable questions</p></div><div class="arrow">›</div></div>').join('')||'<div class="builder-empty"><h3>Chapter mapping pending</h3><p>This subject is available, but its current chapter structure is still being verified.</p></div>')+'</div></div>';
    document.getElementById('back').onclick=()=>{selectedBook=null;window.renderLibrary()};
    document.querySelectorAll('[data-ch]').forEach(x=>x.onclick=()=>{selectedChapter=chapters[+x.dataset.ch];window.renderChapter()});
  };

  window.renderChapter=function(){
    const c=selectedChapter;
    const meta=c.exerciseSections||c.exercises||[];
    const bank=c.exerciseBank||[];
    const blocks=meta.map(m=>{
      const e=bank.find(x=>x.title===m.title)||{title:m.title,status2026:m.status2026,questions:(c.questions||[]).filter(q=>q.exercise===m.title)};
      return exerciseBlock(e,m);
    }).join('');
    app.innerHTML=
      '<button class="back" id="backCh">← Chapters</button>'+
      '<div class="panel"><div class="crumbs">Class '+selectedGrade+' / '+esc(selectedBook.title)+' / '+esc(c.title)+'</div>'+
      '<div class="section-head"><h2>'+esc(c.title)+'</h2><span class="pill">'+countChapterQuestions(c)+' questions • '+picked.size+' in paper</span></div>'+
      '<p style="font-size:11px;color:var(--muted);margin:0 0 12px">Tick a question to add it instantly to your paper.</p>'+
      (blocks||'<div class="builder-empty"><h3>No question bank yet</h3><p>This chapter structure is available, but selectable questions are not loaded yet.</p></div>')+
      (countChapterQuestions(c)>0?'<button class="primary" id="openBuilder" style="margin-top:14px">Open Paper Studio • '+picked.size+' selected</button>':'')+
      '</div>';
    document.getElementById('backCh').onclick=()=>{selectedChapter=null;window.renderBook()};
    document.querySelectorAll('[data-qid]').forEach(x=>x.onchange=()=>{x.checked?picked.add(x.dataset.qid):picked.delete(x.dataset.qid);window.renderChapter()});
    const ob=document.getElementById('openBuilder');if(ob)ob.onclick=()=>document.querySelector('[data-view=builder]').click();
  };

  const oldRender=window.render;
  window.render=function(){if(!DATA)return;title.textContent='Teacher Test Studio';selectedBook?window.renderBook():window.renderLibrary()};

  setTimeout(()=>{ if(DATA && !selectedBook) window.renderLibrary(); },250);
})();