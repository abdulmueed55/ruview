(function(){
  function classifyQuestion(q){
    const t=String(q.type||'').toLowerCase();
    if(t.includes('mcq')) return 'mcq';
    if(t.includes('long')||t.includes('comprehensive')||t.includes('descriptive')||t.includes('constructed')||t.includes('crq')) return 'long';
    return 'short';
  }
  function questionPool(){
    if(typeof allQuestions==='function') return allQuestions();
    return [];
  }
  window.renderBuilder=function(){
    title.textContent='Test Builder';
    const all=questionPool();
    const qs=all.filter(q=>picked.has(q.id));
    const total=qs.reduce((s,q)=>s+(Number(q.marks)||0),0);
    const subject=(selectedBook&&selectedBook.title)||'Subject';
    const grade=selectedGrade||'';
    const academy=localStorage.getItem('ptg_academy')||'Your School / Academy';
    const testTitle=localStorage.getItem('ptg_test_title')||'Chapter Test';
    const testTime=localStorage.getItem('ptg_test_time')||'45 Minutes';
    const mcqs=qs.filter(q=>classifyQuestion(q)==='mcq');
    const shorts=qs.filter(q=>classifyQuestion(q)==='short');
    const longs=qs.filter(q=>classifyQuestion(q)==='long');
    const selectedSummary=qs.length?`${qs.length} selected • ${total} marks`:'No questions selected';
    const section=(label,items,start,inst)=>{
      if(!items.length)return '';
      return `<div class="paper-section"><div class="paper-section-head"><b>${label}</b><span>${items.reduce((s,q)=>s+(Number(q.marks)||0),0)} marks</span></div><p class="paper-instruction">${inst}</p>${items.map((q,i)=>`<div class="paper-q"><div class="paper-q-text"><b>Q${start+i}.</b> ${esc(q.text||'')}</div><div class="paper-marks">[${Number(q.marks)||0}]</div>${q.options?`<div class="paper-options">${q.options.map((o,j)=>`<span>${String.fromCharCode(65+j)}. ${esc(o)}</span>`).join('')}</div>`:''}</div>`).join('')}</div>`;
    };
    let n=1;
    const a=section('SECTION A — MCQs',mcqs,n,'Choose the correct option.'); n+=mcqs.length;
    const b=section('SECTION B — SHORT QUESTIONS',shorts,n,'Answer briefly and show working where required.'); n+=shorts.length;
    const c=section('SECTION C — LONG QUESTIONS',longs,n,'Answer in detail. Show complete working where applicable.');
    app.innerHTML=`
      <div class="builder-steps">
        <div class="builder-step active"><strong>1</strong><span>Paper Details</span></div>
        <div class="builder-step ${qs.length?'active':''}"><strong>2</strong><span>Select Questions</span></div>
        <div class="builder-step ${qs.length?'active':''}"><strong>3</strong><span>Preview & Print</span></div>
      </div>
      <div class="builder-layout">
        <div class="panel builder-controls">
          <div class="section-head"><h2>Paper Details</h2><span class="pill">${selectedSummary}</span></div>
          <label>School / Academy Name<input id="paperAcademy" class="paper-input" value="${esc(academy)}"></label>
          <label>Test Title<input id="paperTitle" class="paper-input" value="${esc(testTitle)}"></label>
          <div class="paper-form-grid">
            <label>Class<input class="paper-input" value="Class ${esc(grade)}" disabled></label>
            <label>Subject<input class="paper-input" value="${esc(subject)}" disabled></label>
          </div>
          <div class="paper-form-grid">
            <label>Time<input id="paperTime" class="paper-input" value="${esc(testTime)}"></label>
            <label>Total Marks<input class="paper-input" value="${total}" disabled></label>
          </div>
          ${qs.length?`<button id="printPaper" class="primary paper-action">Print / Save as PDF</button><button id="clearPaper" class="paper-secondary">Clear Selected Questions</button>`:`<div class="builder-help"><b>How to make a test</b><ol><li>Study Content open karo.</li><li>Class → Book → Chapter choose karo.</li><li>Questions ke checkboxes tick karo.</li><li>“Open Test Builder” dabao.</li></ol></div>`}
        </div>
        <div class="paper-wrap">
          <div id="paperPreview" class="paper-sheet">
            <div class="paper-school" id="previewAcademy">${esc(academy)}</div>
            <div class="paper-title" id="previewTitle">${esc(testTitle)}</div>
            <div class="paper-meta"><span><b>Class:</b> ${esc(grade)}</span><span><b>Subject:</b> ${esc(subject)}</span><span><b>Time:</b> <span id="previewTime">${esc(testTime)}</span></span><span><b>Total Marks:</b> ${total}</span></div>
            <div class="paper-student"><span>Name: __________________________</span><span>Roll No: ____________</span><span>Date: ____________</span></div>
            ${qs.length?(a+b+c):'<div class="paper-empty"><b>Your final paper will appear here.</b><br>Select questions from Study Content first.</div>'}
          </div>
        </div>
      </div>`;
    const syncField=(id,previewId,key)=>{const el=document.getElementById(id);if(!el)return;el.oninput=()=>{document.getElementById(previewId).textContent=el.value;localStorage.setItem(key,el.value)}};
    syncField('paperAcademy','previewAcademy','ptg_academy');
    syncField('paperTitle','previewTitle','ptg_test_title');
    syncField('paperTime','previewTime','ptg_test_time');
    const printBtn=document.getElementById('printPaper');if(printBtn)printBtn.onclick=()=>window.print();
    const clearBtn=document.getElementById('clearPaper');if(clearBtn)clearBtn.onclick=()=>{picked.clear();renderBuilder()};
  };
})();