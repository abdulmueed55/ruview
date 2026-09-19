(function(){
  function classify(q){
    const t=String(q.type||'').toLowerCase();
    if(t.includes('mcq'))return'mcq';
    if(t.includes('long')||t.includes('comprehensive')||t.includes('descriptive')||t.includes('constructed')||t.includes('crq'))return'long';
    return'short';
  }
  function pool(){return typeof allQuestions==='function'?allQuestions():[]}
  function sectionHtml(label,items,start,instruction){
    if(!items.length)return'';
    const marks=items.reduce((s,q)=>s+(Number(q.marks)||1),0);
    return '<div class="paper-section"><div class="paper-section-head"><b>'+label+'</b><span>'+marks+' marks</span></div>'+
      '<p class="paper-instruction">'+instruction+'</p>'+
      items.map((q,i)=>'<div class="paper-q"><div class="paper-q-text"><b>Q'+(start+i)+'.</b> '+esc(q.text||'')+'</div><div class="paper-marks">['+(Number(q.marks)||1)+']</div>'+
      (q.options?'<div class="paper-options">'+q.options.map((o,j)=>'<span>'+String.fromCharCode(65+j)+'. '+esc(o)+'</span>').join('')+'</div>':'')+'</div>').join('')+
      '</div>';
  }

  window.renderBuilder=function(){
    title.textContent='Paper Studio';
    const qs=pool().filter(q=>picked.has(q.id));
    const total=qs.reduce((s,q)=>s+(Number(q.marks)||1),0);
    const mcqs=qs.filter(q=>classify(q)==='mcq');
    const shorts=qs.filter(q=>classify(q)==='short');
    const longs=qs.filter(q=>classify(q)==='long');
    const academy=localStorage.getItem('ptg_academy')||'Your School / Academy';
    const testTitle=localStorage.getItem('ptg_test_title')||'Assessment Test';
    const testTime=localStorage.getItem('ptg_test_time')||'45 Minutes';
    const subject=(selectedBook&&selectedBook.title)||'Selected Subject';
    const grade=selectedGrade||'';

    let n=1;
    const s1=sectionHtml('SECTION A — MCQs',mcqs,n,'Choose the correct option.'); n+=mcqs.length;
    const s2=sectionHtml('SECTION B — SHORT QUESTIONS',shorts,n,'Answer briefly. Show working where required.'); n+=shorts.length;
    const s3=sectionHtml('SECTION C — LONG QUESTIONS',longs,n,'Answer in detail and show complete working where applicable.');

    const basket=qs.map(q=>'<div class="basket-item"><div><b>'+esc(q.type||'Question')+' • '+(Number(q.marks)||1)+' mark'+((Number(q.marks)||1)===1?'':'s')+'</b><span>'+esc((q.text||'').slice(0,78))+(String(q.text||'').length>78?'…':'')+'</span></div><button class="basket-remove" data-remove="'+esc(q.id)+'">×</button></div>').join('');

    app.innerHTML=
      '<div class="builder-topbar"><div><h2>Paper Studio</h2><p>Build, review and print from one clean workspace.</p></div><div class="builder-progress"><span class="progress-dot on"></span><span class="progress-dot '+(qs.length?'on':'')+'"></span><span class="progress-dot '+(qs.length?'on':'')+'"></span></div></div>'+
      '<div class="builder-layout">'+
        '<div class="panel builder-controls">'+
          '<div class="builder-controls-head"><div class="mini-step done"><b>1</b><span>Paper setup</span></div></div>'+
          '<div class="builder-controls-body">'+
            '<label>School / Academy<input id="paperAcademy" class="paper-input" value="'+esc(academy)+'"></label>'+
            '<label>Test Title<input id="paperTitle" class="paper-input" value="'+esc(testTitle)+'"></label>'+
            '<div class="paper-form-grid"><label>Class<input class="paper-input" value="Class '+esc(grade)+'" disabled></label><label>Subject<input class="paper-input" value="'+esc(subject)+'" disabled></label></div>'+
            '<div class="paper-form-grid"><label>Time<input id="paperTime" class="paper-input" value="'+esc(testTime)+'"></label><label>Total Marks<input class="paper-input" value="'+total+'" disabled></label></div>'+
            '<div class="builder-summary"><div><strong>'+mcqs.length+'</strong><span>MCQs</span></div><div><strong>'+shorts.length+'</strong><span>Short</span></div><div><strong>'+longs.length+'</strong><span>Long</span></div></div>'+
            '<div class="question-basket"><div class="basket-head"><b>Question Basket</b><span class="basket-count">'+qs.length+' selected</span></div><div class="basket-items">'+(basket||'<div style="font-size:10px;color:var(--muted);padding:8px 0">Select questions from Study Content to build your paper.</div>')+'</div></div>'+
            (qs.length?'<button id="printPaper" class="primary paper-action">Print / Save as PDF</button><button id="clearPaper" class="paper-secondary">Clear Paper</button>':'<button id="goContent" class="primary paper-action">Choose Questions</button>')+
          '</div>'+
        '</div>'+
        '<div class="paper-stage"><div class="paper-stage-top"><b>LIVE A4 PREVIEW</b><span>'+qs.length+' questions • '+total+' marks</span></div>'+
          '<div class="paper-sheet"><div class="paper-brandline"></div><div class="paper-school" id="previewAcademy">'+esc(academy)+'</div><div class="paper-title" id="previewTitle">'+esc(testTitle)+'</div><div class="paper-subtitle">Punjab Curriculum Assessment</div>'+
            '<div class="paper-meta"><span><b>Class:</b> '+esc(grade)+'</span><span><b>Subject:</b> '+esc(subject)+'</span><span><b>Time:</b> <span id="previewTime">'+esc(testTime)+'</span></span><span><b>Total Marks:</b> '+total+'</span></div>'+
            '<div class="paper-student"><span>Name: __________________________</span><span>Roll No: __________</span><span>Date: __________</span></div>'+
            (qs.length?(s1+s2+s3):'<div class="paper-empty"><div class="paper-empty-icon">✦</div><b>Your paper will appear here</b><span>Choose questions from Study Content and return to Paper Studio.</span></div>')+
          '</div>'+
        '</div>'+
      '</div>';

    const bind=(id,preview,key)=>{const el=document.getElementById(id);if(!el)return;el.oninput=()=>{const p=document.getElementById(preview);if(p)p.textContent=el.value;localStorage.setItem(key,el.value)}};
    bind('paperAcademy','previewAcademy','ptg_academy');
    bind('paperTitle','previewTitle','ptg_test_title');
    bind('paperTime','previewTime','ptg_test_time');

    document.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{picked.delete(btn.dataset.remove);window.renderBuilder()});
    const printBtn=document.getElementById('printPaper');if(printBtn)printBtn.onclick=()=>window.print();
    const clearBtn=document.getElementById('clearPaper');if(clearBtn)clearBtn.onclick=()=>{picked.clear();window.renderBuilder()};
    const go=document.getElementById('goContent');if(go)go.onclick=()=>document.querySelector('[data-view=library]').click();
  };
})();