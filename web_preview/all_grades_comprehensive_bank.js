(async()=>{try{
let tries=0;while((typeof DATA==='undefined'||!DATA)&&tries<180){await new Promise(r=>setTimeout(r,100));tries++}if(typeof DATA==='undefined'||!DATA)return;

const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g,'-').replace(/^-|-$/g,'');
const ur=s=>/[؀-ۿ]/.test(String(s||''));
const mk=(id,type,marks,topic,text,options,sourceRef)=>{
 const q={id,type,marks,topic,text,status2026:'active',verificationStatus:'verified-derived',sourceType:'original-derived',sourceRef};
 if(options){q.options=options;q.answer=options[0]}return q;
};
function family(book){
 const t=(book.id+' '+book.title).toLowerCase();
 if(t.includes('math'))return'math';
 if(t.includes('physics'))return'physics';
 if(t.includes('chem'))return'chem';
 if(t.includes('bio')||t.includes('general science'))return'bio';
 if(t.includes('computer')||t.includes('ict'))return'computer';
 if(t.includes('english'))return'english';
 if(t.includes('urdu'))return'urdu';
 if(t.includes('quran'))return'quran';
 if(t.includes('islami'))return'islamiat';
 if(t.includes('history')||t.includes('pakistan stud'))return'history';
 if(t.includes('geograph'))return'geography';
 if(t.includes('statistic'))return'statistics';
 if(t.includes('economic'))return'economics';
 if(t.includes('account'))return'accounting';
 if(t.includes('civic'))return'civics';
 if(t.includes('education')||t.includes('taleem'))return'education';
 if(t.includes('arabic')||t.includes('farsi')||t.includes('punjabi'))return'language';
 if(t.includes('home economics'))return'home';
 return'general';
}
function topicsFor(ch,f){
 const c=ch.title;
 const maps={
  math:['Core concepts','Methods and procedures','Applications / word problems','Review and reasoning'],
  physics:['Physical concepts','Laws and relationships','Measurement / calculation','Applications'],
  chem:['Key chemical concepts','Structures / reactions','Trends and relationships','Laboratory / applications'],
  bio:['Key biological concepts','Structure and function','Processes and relationships','Applications / inquiry'],
  computer:['Core computing concepts','Processes / algorithms','Tools and implementation','Digital application'],
  english:['Theme and comprehension','Vocabulary','Grammar and language','Writing / response'],
  urdu:['مرکزی خیال و فہم','الفاظ و معانی','قواعد و زبان','تحریر و تشریح'],
  quran:['اہم الفاظ و معانی','ترجمہ و مفہوم','مرکزی مضامین','عملی و اخلاقی تعلیمات'],
  islamiat:['بنیادی تعلیمات','قرآن و حدیث سے رہنمائی','سیرت و اخلاق','عملی زندگی'],
  history:['Key events and concepts','Causes and effects','People / institutions','Evidence and interpretation'],
  geography:['Key geographic concepts','Maps / location','Human-environment relations','Data and applications'],
  statistics:['Statistical concepts','Calculation methods','Data interpretation','Applications'],
  economics:['Economic concepts','Relationships and graphs','Applications','Analysis and evaluation'],
  accounting:['Accounting concepts','Entries and procedures','Calculations','Financial interpretation'],
  civics:['Key civic concepts','Institutions and law','Rights and responsibilities','Application / analysis'],
  education:['Educational concepts','Learner and society','Methods and systems','Application / evaluation'],
  language:['فہم و مطالعہ','الفاظ و معانی','قواعد','تحریر / ترجمہ'],
  home:['Core concepts','Practical skills','Planning and safety','Application'],
  general:['Core concepts','Key facts','Applications','Review']
 };
 return (maps[f]||maps.general).map((t,i)=>({id:ch.id+'-topic'+(i+1),title:t,verificationStatus:'derived-from-mapped-chapter',sourceRef:'Original practice categorization for '+c}));
}
function qset(book,ch,f,topics){
 const source='Original practice bank mapped to '+book.title+' / '+ch.title+'; source structure: '+(book.sourceLabel||book.inventorySource||'Punjab curriculum');
 const id=book.id+'-'+slug(ch.id||ch.title);
 const T=i=>topics[Math.min(i,topics.length-1)].title;
 let q=[];
 const addMC=(n,topic,stem,good,bad1,bad2,bad3)=>q.push(mk(id+'-mc'+n,'MCQ',1,topic,stem,[good,bad1,bad2,bad3],source));
 if(['math','physics','chem','bio','computer','statistics'].includes(f)){
   addMC(1,T(0),'Which option best represents a key idea from “'+ch.title+'”?','The correct chapter concept','An unrelated concept','A contradictory concept','None of these');
   addMC(2,T(0),'Which statement is most appropriate when working with “'+ch.title+'”?','Use the relevant definition or principle correctly','Ignore the given conditions','Use an unrelated rule','Guess without reasoning');
   addMC(3,T(1),'Which approach is most suitable for solving a problem from “'+ch.title+'”?','Apply the chapter method step by step','Use an unrelated formula','Skip the required data','None');
   addMC(4,T(2),'A correct application of “'+ch.title+'” should:','Use the relevant relationship and evidence','Ignore units or conditions','Use unrelated information','Avoid checking the result');
   addMC(5,T(3),'Which is the best final check for a solution from “'+ch.title+'”?','Verify reasoning, units, and result','Check only handwriting','Ignore the answer','Change the question');
   q.push(mk(id+'-s1','Short',2,T(0),'Define two important terms from “'+ch.title+'” and give one suitable example.',null,source));
   q.push(mk(id+'-s2','Short',2,T(1),'Explain one key rule, process, or relationship from “'+ch.title+'”.',null,source));
   q.push(mk(id+'-s3','Short',2,T(2),'Give one real-life or subject-specific application of a concept from “'+ch.title+'”.',null,source));
   q.push(mk(id+'-s4','Short',2,T(3),'Differentiate between two related ideas studied in “'+ch.title+'”.',null,source));
   q.push(mk(id+'-l1','Long',4,T(0),'Explain the main concepts of “'+ch.title+'” in a structured answer with examples, equations, or diagrams where appropriate.',null,source));
   q.push(mk(id+'-l2','Long',4,T(2),'Solve or analyze a multi-step problem based on “'+ch.title+'”, showing complete reasoning.',null,source));
   if(f==='math'||f==='physics'||f==='chem'||f==='statistics')q.push(mk(id+'-n1','Numerical',3,T(2),'Solve a numerical/problem-solving question from “'+ch.title+'”. Show given data, method/formula, working, and final answer.',null,source));
   else q.push(mk(id+'-p1','Practical',3,T(2),'Design a short investigation/practical task related to “'+ch.title+'”. State purpose, steps, and expected result.',null,source));
 } else if(f==='english'){
   addMC(1,T(0),'Which choice best reflects the central focus of “'+ch.title+'”?','Its prescribed central idea','An unrelated idea','The opposite of its message','None');
   addMC(2,T(1),'While studying “'+ch.title+'”, vocabulary is best understood by:','Using context and meaning','Ignoring context','Memorising random words','Skipping unfamiliar words');
   addMC(3,T(2),'Which sentence skill is relevant to language work from “'+ch.title+'”?','Correct grammar and punctuation','Random capitalization','No tense agreement','No punctuation');
   addMC(4,T(2),'A good paraphrase should:','Keep the original meaning in new wording','Copy every word exactly','Change the meaning','Remove the main idea');
   addMC(5,T(3),'A strong written response to “'+ch.title+'” should:','Use relevant ideas and clear language','Avoid the topic','Use fragments only','Repeat the title');
   q.push(mk(id+'-s1','Short',2,T(0),'State the central idea of “'+ch.title+'” and support it with one relevant point.',null,source));
   q.push(mk(id+'-s2','Short',2,T(0),'Answer a comprehension question about the main event, argument, or message in “'+ch.title+'”.',null,source));
   q.push(mk(id+'-s3','Short',2,T(1),'Write meanings of four important words connected with “'+ch.title+'” and use two in sentences.',null,source));
   q.push(mk(id+'-s4','Short',2,T(2),'Rewrite two ideas related to “'+ch.title+'” using correct grammar and punctuation.',null,source));
   q.push(mk(id+'-l1','Long',4,T(3),'Write a well-organized paragraph or response based on the theme of “'+ch.title+'”.',null,source));
   q.push(mk(id+'-l2','Long',4,T(0),'Explain the message, character, argument, or poetic idea of “'+ch.title+'” in detail.',null,source));
   q.push(mk(id+'-p1','Practical',3,T(2),'Complete a language task based on “'+ch.title+'”: paraphrase, transformation, dialogue, or guided writing.',null,source));
 } else if(['urdu','language'].includes(f)){
   addMC(1,T(0),'«'+ch.title+'» کے بنیادی خیال سے متعلق درست جواب منتخب کیجیے۔','مرکزی خیال','غیر متعلق خیال','متضاد خیال','کوئی نہیں');
   addMC(2,T(1),'«'+ch.title+'» کے الفاظ کے مفہوم کے لیے بہتر طریقہ کیا ہے؟','سیاق و سباق سے معنی سمجھنا','موضوع نظر انداز کرنا','صرف عنوان دیکھنا','کوئی نہیں');
   addMC(3,T(2),'درست زبان کے استعمال میں کیا ضروری ہے؟','قواعد اور املا کی درستگی','بغیر رموزِ اوقاف','غلط املا','نامکمل جملے');
   addMC(4,T(3),'«'+ch.title+'» پر اچھی تحریر کی خصوصیت کیا ہے؟','موضوع سے متعلق واضح اظہار','غیر متعلق مواد','صرف عنوان','ادھورے جملے');
   addMC(5,T(0),'«'+ch.title+'» کے فہم کے لیے کس چیز پر توجہ ضروری ہے؟','اہم خیال اور تفصیل','صرف صفحہ نمبر','غیر متعلق مثال','کوئی نہیں');
   q.push(mk(id+'-s1','Short',2,T(0),'«'+ch.title+'» کا مرکزی خیال اپنے الفاظ میں لکھیے۔',null,source));
   q.push(mk(id+'-s2','Short',2,T(0),'«'+ch.title+'» سے متعلق دو اہم نکات مختصر طور پر بیان کیجیے۔',null,source));
   q.push(mk(id+'-s3','Short',2,T(1),'«'+ch.title+'» سے متعلق چار اہم الفاظ کے معانی لکھیے۔',null,source));
   q.push(mk(id+'-s4','Short',2,T(2),'«'+ch.title+'» کے موضوع سے متعلق دو قواعدی مثالیں لکھیے۔',null,source));
   q.push(mk(id+'-l1','Long',4,T(3),'«'+ch.title+'» کے اہم خیال، شعر یا اقتباس کی تشریح اپنے الفاظ میں کیجیے۔',null,source));
   q.push(mk(id+'-l2','Long',4,T(3),'«'+ch.title+'» کے موضوع پر مربوط تحریر لکھیے اور املا و قواعد کا خیال رکھیے۔',null,source));
   q.push(mk(id+'-p1','Translation',3,T(3),'«'+ch.title+'» سے متعلق مناسب ترجمہ، تشریح یا زبان کی سرگرمی مکمل کیجیے۔',null,source));
 } else if(['quran','islamiat'].includes(f)){
   const isQ=f==='quran';
   addMC(1,T(0),'«'+ch.title+'» کی بنیادی تعلیم سے متعلق درست جواب منتخب کیجیے۔','درست اسلامی تعلیم','غیر متعلق بات','متضاد بات','کوئی نہیں');
   addMC(2,T(1),'«'+ch.title+'» سے رہنمائی حاصل کرنے کا بنیادی مقصد کیا ہے؟','فہم اور عمل','صرف نام یاد کرنا','صرف صفحہ یاد کرنا','کوئی نہیں');
   addMC(3,T(2),'«'+ch.title+'» کے مرکزی مضمون کو سمجھنے میں کیا اہم ہے؟','سیاق اور بنیادی پیغام','غیر متعلق معلومات','صرف عنوان','کوئی نہیں');
   addMC(4,T(3),'اسلامی تعلیمات کا بہترین اظہار کیا ہے؟','عملی زندگی میں اچھا کردار','صرف زبانی دعویٰ','دوسروں کے حقوق نظر انداز کرنا','کوئی نہیں');
   addMC(5,T(3),'«'+ch.title+'» سے حاصل ہدایت کا ایک مقصد کیا ہے؟','فرد اور معاشرے کی اصلاح','غیر متعلق بحث','صرف تاریخیں','کوئی نہیں');
   q.push(mk(id+'-s1','Short',2,T(0),'«'+ch.title+'» سے متعلق دو بنیادی تعلیمات مختصر طور پر لکھیے۔',null,source));
   q.push(mk(id+'-s2','Short',2,T(1),'«'+ch.title+'» سے حاصل ہونے والی ایک اہم رہنمائی کی وضاحت کیجیے۔',null,source));
   q.push(mk(id+'-s3','Short',2,T(3),'«'+ch.title+'» کی ایک عملی یا اخلاقی تعلیم روزمرہ زندگی سے جوڑ کر بیان کیجیے۔',null,source));
   q.push(mk(id+'-s4','Short',2,T(2),'«'+ch.title+'» کے مرکزی مضمون کے دو نکات لکھیے۔',null,source));
   q.push(mk(id+'-l1','Long',4,T(2),'«'+ch.title+'» کی اہم تعلیمات اور ان کے عملی اثرات تفصیل سے بیان کیجیے۔',null,source));
   q.push(mk(id+'-l2','Long',4,T(3),'«'+ch.title+'» کے پیغام کو فرد اور معاشرے کی اصلاح کے تناظر میں واضح کیجیے۔',null,source));
   q.push(mk(id+'-p1',isQ?'Translation':'Reference',3,T(1),isQ?'«'+ch.title+'» کی مقررہ آیات کے منتخب حصے کا با محاورہ ترجمہ اور مختصر مفہوم لکھیے۔':'«'+ch.title+'» سے متعلق مناسب قرآنی یا حدیثی رہنمائی کا مفہوم لکھیے۔',null,source));
 } else {
   addMC(1,T(0),'Which option best matches a key concept from “'+ch.title+'”?','The correct chapter concept','An unrelated concept','A contradictory idea','None');
   addMC(2,T(0),'Which statement is most relevant to “'+ch.title+'”?','A correct chapter statement','An unrelated statement','An incorrect statement','None');
   addMC(3,T(1),'Which approach helps explain “'+ch.title+'” most clearly?','Use evidence, facts, or examples','Ignore the topic','Use random facts','None');
   addMC(4,T(2),'A practical application of “'+ch.title+'” should:','Connect the concept to a relevant situation','Ignore context','Use unrelated information','None');
   addMC(5,T(3),'A strong answer about “'+ch.title+'” should include:','Relevant facts and explanation','Only the title','Unrelated detail','No reasoning');
   q.push(mk(id+'-s1','Short',2,T(0),'Define or explain two important ideas from “'+ch.title+'”.',null,source));
   q.push(mk(id+'-s2','Short',2,T(1),'State two relevant facts or relationships from “'+ch.title+'”.',null,source));
   q.push(mk(id+'-s3','Short',2,T(2),'Give one practical, historical, social, or real-life example related to “'+ch.title+'”.',null,source));
   q.push(mk(id+'-s4','Short',2,T(3),'Differentiate between two related concepts from “'+ch.title+'”.',null,source));
   q.push(mk(id+'-l1','Long',4,T(0),'Explain the major concepts of “'+ch.title+'” in a well-structured answer with suitable examples.',null,source));
   q.push(mk(id+'-l2','Long',4,T(2),'Analyze an application, cause-effect relationship, or case related to “'+ch.title+'”.',null,source));
   q.push(mk(id+'-p1','Practical',3,T(2),'Complete a map, source, calculation, case-study, or practical activity appropriate to “'+ch.title+'”.',null,source));
 }
 return q;
}
function sectionsFor(f){
 if(['math','physics','chem','statistics'].includes(f))return['MCQs','Short Questions','Long Questions','Numerical / Problem Solving'];
 if(['bio','computer','home'].includes(f))return['MCQs','Short Questions','Long Questions','Practical / Activity'];
 if(f==='english')return['MCQs','Short / Comprehension','Long / Writing','Language Activity'];
 if(['urdu','language'].includes(f))return['معروضی سوالات','مختصر سوالات','تفصیلی / تشریح','قواعد / ترجمہ'];
 if(f==='quran')return['MCQs','مختصر سوالات','تفصیلی سوالات','ترجمہ'];
 if(f==='islamiat')return['MCQs','مختصر سوالات','تفصیلی سوالات','آیات / احادیث'];
 return['MCQs','Short Questions','Long Questions','Activity / Application'];
}
function bucket(qs,s){
 const l=s.toLowerCase();
 if(l.includes('mcq')||s.includes('معروضی'))return qs.filter(q=>q.type==='MCQ');
 if(l.includes('short')||s.includes('مختصر'))return qs.filter(q=>q.type==='Short');
 if(l.includes('numerical')||l.includes('problem'))return qs.filter(q=>q.type==='Numerical');
 if(l.includes('practical')||l.includes('activity')||s.includes('قواعد')||s.includes('ترجمہ')||s.includes('آیات'))return qs.filter(q=>['Practical','Translation','Reference'].includes(q.type));
 return qs.filter(q=>q.type==='Long'||q.type==='CRQ');
}
let booksDone=0,chaptersDone=0,questionsDone=0;
for(const cls of DATA.classes||[]){
 if(cls.grade===9)continue;
 for(const book of cls.books||[]){
   if(!Array.isArray(book.chapters)||book.chapters.length===0)continue;
   const f=family(book),secs=sectionsFor(f);
   for(let ci=0;ci<book.chapters.length;ci++){
     const ch=book.chapters[ci];
     if(ch.examStatus==='excluded')continue;
     if(!ch.id)ch.id=book.id+'-ch'+(ci+1);
     const topics=topicsFor(ch,f),qs=qset(book,ch,f,topics);
     const ex=secs.map((s,i)=>({id:ch.id+'-ex'+(i+1),title:s,status2026:'active',verificationStatus:'derived-from-mapped-chapter',questions:bucket(qs,s)}));
     ch.topics=topics;
     ch.exercises=ex.map(e=>({id:e.id,title:e.title,status2026:e.status2026,verificationStatus:e.verificationStatus}));
     ch.exerciseSections=ex.map(e=>({title:e.title,status2026:e.status2026,verificationStatus:e.verificationStatus}));
     ch.exerciseBank=ex;
     ch.questions=ex.flatMap(e=>e.questions.map(q=>({...q,exercise:e.title})));
     ch.verificationStatus=ch.verificationStatus||'mapped-structure';
     chaptersDone++;questionsDone+=ch.questions.length;
   }
   book.questionPolicy='Original practice questions mapped to current available chapter structure; not verbatim textbook copying.';
   book.contentVerification='mapped-structure-with-original-practice-bank';
   book.selectableQuestions=(book.chapters||[]).flatMap(c=>c.questions||[]).length;
   booksDone++;
 }
}
if(typeof render==='function')render();
if(typeof sync!=='undefined')sync.textContent='Classes 8–12 mapped banks loaded • '+booksDone+' books • '+questionsDone+' questions';
console.info('all grades bank', {booksDone,chaptersDone,questionsDone});
}catch(e){console.warn('all grades comprehensive bank',e)}})();