(function(){
const API='https://punjab-test-generator-ai-api.onrender.com';
async function getStats(){try{const r=await fetch(API+'/stats');return await r.json()}catch{return {total:0,byType:{},byGrade:{},target:20000}}}
function card(label,val){return '<div class="quick-stat"><strong>'+val+'</strong><span>'+label+'</span></div>'}
async function renderAiBank(){
 title.textContent='AI Question Bank';
 app.innerHTML='<div class="panel"><div class="builder-empty"><h3>Loading AI bank…</h3><p>Reading generator status.</p></div></div>';
 const s=await getStats();
 app.innerHTML=
 '<div class="hero"><div class="hero-content"><div class="hero-kicker">GEMINI QUESTION BANK</div><h2>Build a 20,000-question Punjab curriculum bank.</h2><p>Source-grounded generation, typed categories, duplicate filtering, answers, marks and chapter mapping.</p></div></div>'+
 '<div class="quick-stats">'+card('Generated',s.total||0)+card('Target',s.target||20000)+card('MCQs',s.byType?.MCQ||0)+card('Short Q/A',s.byType?.Short||0)+'</div>'+
 '<div class="quick-stats">'+card('Long Q/A',s.byType?.Long||0)+card('Numericals',s.byType?.Numerical||0)+card('CRQs',s.byType?.CRQ||0)+card('Practical',s.byType?.Practical||0)+'</div>'+
 '<div class="panel"><div class="section-head"><h2>Generator Status</h2><span class="pill">'+Math.round(((s.total||0)/(s.target||20000))*100)+'% complete</span></div>'+
 '<div class="ai-progress"><div style="width:'+Math.min(100,((s.total||0)/(s.target||20000))*100)+'%"></div></div>'+
 '<p style="color:var(--muted);font-size:12px;line-height:1.6">API: '+API+'<br>Gemini generation stays server-side. Questions are stored by class, book, chapter, topic and type.</p>'+
 '<div class="section-head"><h2>Generation categories</h2></div>'+
 '<div class="topic-grid">'+
 ['MCQs — options + correct answer','Short Q/A — concise answer','Long Q/A — marking guide','Numericals — working + answer','CRQs — reasoning answer','Practical/Activity — steps + result','Translation/Grammar','Comprehension'].map(x=>'<div class="topic"><b>'+x+'</b><span>Separate searchable bank category</span></div>').join('')+
 '</div></div>';
}
const nav=document.querySelector('.sidebar');
if(nav&&!document.querySelector('[data-view=ai-bank]')){
 const b=document.createElement('button');b.className='nav';b.dataset.view='ai-bank';b.textContent='✦  AI Question Bank';
 const syncBtn=nav.querySelector('[data-view=sync]');nav.insertBefore(b,syncBtn);
 b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderAiBank()};
}
window.renderAiBank=renderAiBank;
})();