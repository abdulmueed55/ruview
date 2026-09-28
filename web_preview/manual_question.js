(function(){
  const KEY='ptg_manual_questions_v1';
  function loadManual(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function saveManual(items){localStorage.setItem(KEY,JSON.stringify(items))}
  function makeId(){return 'manual-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)}
  function allManual(){return loadManual()}
  const baseAllQuestions=window.allQuestions;
  window.allQuestions=function(){
    const base=typeof baseAllQuestions==='function'?baseAllQuestions():[];
    return base.concat(allManual());
  };

  function formHtml(){
    return '<div class="manual-modal-backdrop" id="manualBackdrop">'+
      '<div class="manual-modal">'+
        '<div class="manual-modal-head"><div><span class="manual-kicker">TEACHER QUESTION</span><h3>Add Manual Question</h3><p>Type your own question and add it directly to the current paper.</p></div><button id="manualClose" class="manual-x">×</button></div>'+
        '<div class="manual-form">'+
          '<div class="manual-grid">'+
            '<label>Question Type<select id="manualType" class="paper-input"><option>MCQ</option><option>Short</option><option>Long</option><option>Numerical</option><option>CRQ</option><option>Practical</option><option>Translation</option></select></label>'+
            '<label>Marks<input id="manualMarks" type="number" min="1" max="20" class="paper-input" value="1"></label>'+
          '</div>'+
          '<label>Question<textarea id="manualText" class="manual-textarea" rows="4" placeholder="Type the question here..."></textarea></label>'+
          '<div id="manualMcqBox">'+
            '<label>Option A<input id="manualA" class="paper-input"></label>'+
            '<label>Option B<input id="manualB" class="paper-input"></label>'+
            '<label>Option C<input id="manualC" class="paper-input"></label>'+
            '<label>Option D<input id="manualD" class="paper-input"></label>'+
            '<label>Correct Answer<select id="manualAnswer" class="paper-input"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></label>'+
          '</div>'+
          '<div class="manual-actions"><button class="paper-secondary" id="manualCancel">Cancel</button><button class="primary" id="manualAdd">Add to Paper</button></div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }

  function openManual(){
    document.body.insertAdjacentHTML('beforeend',formHtml());
    const type=document.getElementById('manualType');
    const marks=document.getElementById('manualMarks');
    function syncType(){
      const isMcq=type.value==='MCQ';
      document.getElementById('manualMcqBox').style.display=isMcq?'grid':'none';
      if(isMcq&&(!marks.value||Number(marks.value)>2))marks.value=1;
      if(!isMcq&&Number(marks.value)===1)marks.value=2;
    }
    type.onchange=syncType;syncType();
    const close=()=>document.getElementById('manualBackdrop')?.remove();
    document.getElementById('manualClose').onclick=close;
    document.getElementById('manualCancel').onclick=close;
    document.getElementById('manualBackdrop').onclick=e=>{if(e.target.id==='manualBackdrop')close()};
    document.getElementById('manualAdd').onclick=()=>{
      const text=document.getElementById('manualText').value.trim();
      if(!text){document.getElementById('manualText').focus();return}
      const q={
        id:makeId(),
        type:type.value,
        marks:Math.max(1,Number(marks.value)||1),
        topic:'Manual Question',
        exercise:'Teacher Added',
        text,
        status2026:'active',
        verificationStatus:'teacher-manual',
        sourceType:'teacher-entered',
        sourceRef:'Entered manually by teacher',
        manual:true
      };
      if(type.value==='MCQ'){
        const opts=['manualA','manualB','manualC','manualD'].map(id=>document.getElementById(id).value.trim()).filter(Boolean);
        if(opts.length<2){document.getElementById('manualA').focus();return}
        q.options=opts;
        const ai=Number(document.getElementById('manualAnswer').value)||0;
        q.answer=opts[Math.min(ai,opts.length-1)]||opts[0];
      }
      const items=loadManual();items.push(q);saveManual(items);picked.add(q.id);close();
      if(window.renderBuilder)window.renderBuilder();
    };
  }

  function injectButton(){
    if(document.getElementById('manualQuestionBtn'))return;
    const btn=document.createElement('button');
    btn.id='manualQuestionBtn';btn.className='paper-secondary manual-add-btn';btn.textContent='+ Add Manual Question';
    btn.onclick=openManual;
    const controls=document.querySelector('.builder-controls-body');
    if(controls){
      const basket=controls.querySelector('.question-basket');
      controls.insertBefore(btn,basket||controls.firstChild);
    }
  }

  const oldBuilder=window.renderBuilder;
  window.renderBuilder=function(){
    oldBuilder();
    setTimeout(injectButton,0);
  };

  document.addEventListener('click',e=>{
    const target=e.target.closest('[data-remove]');
    if(!target)return;
    const id=target.dataset.remove;
    const items=loadManual();
    if(items.some(q=>q.id===id)){
      saveManual(items.filter(q=>q.id!==id));
    }
  });
})();