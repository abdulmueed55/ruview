(function(){
function unique(arr){const m=new Map();for(const q of arr||[])if(q&&q.id&&!m.has(q.id))m.set(q.id,q);return [...m.values()]}
function pool(book){return unique((book.chapters||[]).flatMap(c=>c.questions||[]))}
function byType(ps,type){const t=String(type).toLowerCase();return ps.filter(q=>String(q.type||'').toLowerCase()===t)}
function nonMcq(ps){return ps.filter(q=>String(q.type||'').toLowerCase()!=='mcq')}
function take(arr,n,offset){return arr.slice(offset||0,(offset||0)+n)}
function mcqLine(q,i){return '<div class="allboard-mcq"><b>'+(i+1)+'.</b> '+esc(q.text)+'<div class="board-options">'+(q.options||[]).map((o,j)=>'<span>'+String.fromCharCode(65+j)+'. '+esc(o)+'</span>').join('')+'</div></div>'}
function qLine(q,i){return '<div class="allboard-q"><b>'+String.fromCharCode(97+i)+')</b> '+esc(q.text)+' <span>['+(Number(q.marks)||2)+']</span></div>'}
function qNum(q,i){return '<div class="allboard-q"><b>'+(i+1)+'.</b> '+esc(q.text)+' <span>['+(Number(q.marks)||2)+']</span></div>'}
function sec(title,marks,body,note){return '<div class="board-section"><h3>'+title+' <span>'+marks+' Marks</span></h3>'+(note?'<p>'+note+'</p>':'')+body+'</div>'}
function safeQ(arr,i){return arr[i%Math.max(1,arr.length)]||{text:'Question bank item pending.',marks:2}}
function renderGeneric(book,conf){
 const ps=pool(book),mcqs=byType(ps,'MCQ'),shorts=byType(ps,'Short'),longs=unique([...byType(ps,'Long'),...byType(ps,'CRQ'),...byType(ps,'Numerical'),...byType(ps,'Practical'),...byType(ps,'Translation')]);
 title.textContent=book.title+' Paper';
 let body='';
 if(conf.kind==='english'){
   body+=sec('PAPER-I — OBJECTIVE',19,take(mcqs,19).map(mcqLine).join(''),'Attempt all 19 objective questions.');
   const shortSet=take(shorts.length?shorts:nonMcq(ps),8);
   body+=sec('PAPER-II — SUBJECTIVE',56,
     '<div class="board-qgroup"><h4>Q2. Answer any FIVE questions. <span>(2×5=10)</span></h4>'+shortSet.map(qLine).join('')+'</div>'+
     '<div class="board-qgroup"><h4>Q3. Translation / paraphrase practice <span>[8]</span></h4>'+take(nonMcq(ps),2,8).map(qNum).join('')+'</div>'+
     '<div class="board-qgroup"><h4>Q4–Q5. Poetry / comprehension / vocabulary <span>[15]</span></h4>'+take(nonMcq(ps),4,10).map(qNum).join('')+'</div>'+
     '<div class="board-qgroup"><h4>Q6. Composition — letter, story or dialogue <span>[8]</span></h4><div class="allboard-q">Write one original composition task suitable for Class 9 English.</div></div>'+
     '<div class="board-qgroup"><h4>Q7. Unseen comprehension <span>[10]</span></h4><div class="allboard-q">Read an unseen passage supplied by the teacher and answer five comprehension questions.</div></div>'+
     '<div class="board-qgroup"><h4>Q8–Q9. Translation and voice/grammar <span>[5+5]</span></h4><div class="allboard-q">Attempt the prescribed language transformation tasks.</div></div>'
   ,'Pattern anchored to the current Grade-9 model-paper skill categories.');
 } else if(conf.kind==='math'){
   body+=sec('PART-I — OBJECTIVE',15,take(mcqs,15).map(mcqLine).join(''),'Attempt all MCQs.');
   let off=0,shortBody='';
   for(let k=2;k<=4;k++){const set=take(shorts.length?shorts:nonMcq(ps),9,off);off+=9;shortBody+='<div class="board-qgroup"><h4>Q'+k+'. Attempt any SIX out of 9. <span>(2×6=12)</span></h4>'+set.map(qLine).join('')+'</div>'}
   body+=sec('PART-II — SHORT QUESTIONS',36,shortBody);
   const l=longs.length?longs:nonMcq(ps);
   body+=sec('PART-III — LONG QUESTIONS',24,'<p>Attempt any FOUR questions.</p>'+take(l,5).map((q,i)=>'<div class="board-detail"><b>Q'+(i+5)+'.</b> '+esc(q.text)+' <span>[6]</span></div>').join(''));
 } else if(conf.kind==='science'){
   body+=sec('PART-I — OBJECTIVE',12,take(mcqs,12).map(mcqLine).join(''),'Attempt all 12 MCQs.');
   let off=0,shortBody='';
   for(let k=2;k<=4;k++){const set=take(shorts.length?shorts:nonMcq(ps),8,off);off+=8;shortBody+='<div class="board-qgroup"><h4>Q'+k+'. Attempt any FIVE out of 8. <span>(2×5=10)</span></h4>'+set.map(qLine).join('')+'</div>'}
   body+=sec('PART-II — SHORT QUESTIONS',30,shortBody);
   const l=longs.length?longs:nonMcq(ps);
   body+=sec('PART-III — DETAILED QUESTIONS',18,'<p>Attempt any TWO out of three questions.</p>'+take(l,6).reduce((h,q,i)=>h+(i%2===0?'<div class="board-detail"><b>Q'+(5+i/2)+' (a)</b> '+esc(q.text)+' <span>[4]</span>':'<div><b>(b)</b> '+esc(q.text)+' <span>[5]</span></div></div>'),''));
 } else if(conf.kind==='computer'){
   body+=sec('PART-I — OBJECTIVE',10,take(mcqs,10).map(mcqLine).join(''),'Attempt all 10 MCQs.');
   let off=0,s='';
   for(let k=2;k<=4;k++){const set=take(shorts.length?shorts:nonMcq(ps),6,off);off+=6;s+='<div class="board-qgroup"><h4>Q'+k+'. Attempt any FOUR out of 6. <span>(2×4=8)</span></h4>'+set.map(qLine).join('')+'</div>'}
   body+=sec('PART-II — SHORT QUESTIONS',24,s);
   const l=longs.length?longs:nonMcq(ps);
   body+=sec('PART-III — DESCRIPTIVE / PRACTICAL',16,'<p>Attempt the required detailed/practical questions.</p>'+take(l,4).map((q,i)=>'<div class="board-detail"><b>Q'+(i+5)+'.</b> '+esc(q.text)+' <span>[4]</span></div>').join(''));
 } else if(conf.kind==='urdu'){
   body+=sec('حصہ اوّل — معروضی',15,take(mcqs,15).map(mcqLine).join(''),'تمام معروضی سوالات حل کریں۔');
   const ss=shorts.length?shorts:nonMcq(ps),ll=longs.length?longs:nonMcq(ps);
   body+=sec('حصہ دوم — مختصر سوالات',20,'<div class="board-qgroup"><h4>کسی دس سوالات کے مختصر جواب دیں۔</h4>'+take(ss,14).map(qLine).join('')+'</div>');
   body+=sec('حصہ سوم — تشریح، خلاصہ اور قواعد',40,take(ll,8).map(qNum).join(''),'مطلوبہ تعداد کے سوالات حل کریں۔');
 } else if(conf.kind==='islamiat'){
   body+=sec('حصہ اوّل — معروضی',15,take(mcqs,15).map(mcqLine).join(''),'تمام سوالات حل کریں۔');
   const ss=shorts.length?shorts:nonMcq(ps),ll=longs.length?longs:nonMcq(ps);
   body+=sec('حصہ دوم — مختصر سوالات',20,'<div class="board-qgroup"><h4>مقررہ تعداد میں مختصر جواب دیں۔</h4>'+take(ss,12).map(qLine).join('')+'</div>');
   body+=sec('حصہ سوم — تفصیلی / قرآن و حدیث',15,take(ll,4).map(qNum).join(''),'تفصیلی سوالات میں اسلامی تعلیمات کا عملی پہلو واضح کریں۔');
 } else {
   body+=sec('حصہ اوّل — معروضی',10,take(mcqs,10).map(mcqLine).join(''),'تمام معروضی سوالات حل کریں۔');
   const tr=byType(ps,'Translation'),ss=shorts.length?shorts:nonMcq(ps),ll=longs.length?longs:nonMcq(ps);
   body+=sec('حصہ دوم — ترجمہ',12,take(tr.length?tr:nonMcq(ps),4).map(qNum).join(''),'مقررہ آیات کے منتخب حصوں کا با محاورہ ترجمہ لکھیں۔');
   body+=sec('حصہ سوم — مختصر سوالات',12,take(ss,8).map(qLine).join(''));
   body+=sec('حصہ چہارم — تفصیلی سوالات',16,take(ll,4).map(qNum).join(''));
 }
 app.innerHTML='<button class="back" id="allboardBack">← Back to '+esc(book.title)+'</button>'+
 '<div class="board-demo-toolbar"><div><b>'+esc(conf.label)+'</b><span>Class 9 • '+esc(book.title)+' • '+conf.total+' marks</span></div><button class="primary" id="allboardPrint">Print / Save PDF</button></div>'+
 '<div class="board-paper"><div class="board-title">CLASS IX — '+esc(book.title.toUpperCase())+'</div><div class="board-subtitle">'+esc(conf.label)+'</div>'+
 '<div class="board-meta"><span><b>Total Marks:</b> '+conf.total+'</span><span><b>Session:</b> 2026</span><span><b>Question Bank:</b> '+ps.length+'</span><span><b>Source:</b> Punjab / PECTAA aligned</span></div>'+body+
 '<div class="board-note"><b>Data policy:</b> questions are original practice items mapped to the verified Class 9 curriculum/model-paper categories; textbook wording is not copied verbatim.</div></div>';
 document.getElementById('allboardBack').onclick=()=>{selectedChapter=null;window.renderBook()};
 document.getElementById('allboardPrint').onclick=()=>window.print();
}
const configs={
'g9-english':{kind:'english',total:75,label:'Board-Style English Model Paper 2026'},
'g9-mathematics':{kind:'math',total:75,label:'Board-Style Mathematics Paper 2026'},
'g9-chemistry':{kind:'science',total:60,label:'Board-Style Chemistry Paper 2026'},
'g9-biology':{kind:'science',total:60,label:'Board-Style Biology Paper 2026'},
'g9-computer-science-entrepreneurship':{kind:'computer',total:50,label:'Official-Pattern Computer Science & Entrepreneurship Paper 2026'},
'g9-urdu':{kind:'urdu',total:75,label:'Punjab-Style Urdu Practice Paper'},
'g9-islamiat':{kind:'islamiat',total:50,label:'Punjab-Style Islamiat Practice Paper'},
'g9-translation-of-holy-quran':{kind:'quran',total:50,label:'Punjab-Style Tarjuma-tul-Quran Practice Paper'}
};
const old=window.renderBook;
window.renderBook=function(){
 old();
 if(selectedChapter||selectedGrade!==9||!selectedBook)return;
 if(selectedBook.id==='g9-physics')return;
 const conf=configs[selectedBook.id];if(!conf)return;
 const panel=app.querySelector('.panel');if(!panel)return;
 const ps=pool(selectedBook),card=document.createElement('div');card.className='board-demo-card';
 card.innerHTML='<div><span class="board-demo-kicker">CLASS 9 PAPER ENGINE</span><h3>Generate Full '+esc(selectedBook.title)+' Paper</h3><p>'+ps.length+' mapped practice questions available • subject-specific paper layout</p></div><button class="primary" id="generateAllBoard">Generate Paper</button>';
 panel.insertBefore(card,panel.querySelector('.chapter-list'));
 document.getElementById('generateAllBoard').onclick=()=>renderGeneric(selectedBook,conf);
};
window.renderClass9SubjectPaper=(id)=>{const g9=DATA.classes.find(c=>c.grade===9),b=g9?.books.find(x=>x.id===id);if(b&&configs[id])renderGeneric(b,configs[id])};
})();