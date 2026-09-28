(async()=>{try{
let tries=0;while((typeof DATA==='undefined'||!DATA)&&tries<160){await new Promise(r=>setTimeout(r,100));tries++}if(typeof DATA==='undefined'||!DATA)return;
const g9=DATA.classes.find(c=>c.grade===9);if(!g9)return;
const src='Original practice item aligned to Punjab Grade-9 model-paper skill category';
function q(id,type,marks,topic,text,options,answer){
 const x={id,type,marks,topic,text,status2026:'active',verificationStatus:'verified-derived',sourceType:'original-derived',sourceRef:src};
 if(options){x.options=options;x.answer=answer||options[0]}return x;
}
function addToFirst(bookId,exerciseTitle,items){
 const b=g9.books.find(x=>x.id===bookId);if(!b||!b.chapters?.length)return;
 const ch=b.chapters[0];
 let ex=(ch.exerciseBank||[]).find(e=>e.title===exerciseTitle);
 if(!ex){ex={id:ch.id+'-supp-'+exerciseTitle.toLowerCase().replace(/[^a-z0-9]+/g,'-'),title:exerciseTitle,status2026:'active',verificationStatus:'verified-derived',questions:[]};ch.exerciseBank=(ch.exerciseBank||[]).concat(ex);ch.exerciseSections=(ch.exerciseSections||[]).concat({title:exerciseTitle,status2026:'active',verificationStatus:'verified-derived'});}
 const seen=new Set((ex.questions||[]).map(z=>z.id));for(const item of items)if(!seen.has(item.id))ex.questions.push(item);
 ch.questions=(ch.exerciseBank||[]).flatMap(e=>(e.questions||[]).map(z=>({...z,exercise:e.title})));
}
const eng=[
q('g9eng-v1','MCQ',1,'Verb Forms','By next June, Sara ___ her course.',['will have completed','completes','completed','is completing'],'will have completed'),
q('g9eng-v2','MCQ',1,'Verb Forms','The sun ___ in the east.',['rises','rise','is rise','has rising'],'rises'),
q('g9eng-v3','MCQ',1,'Verb Forms','They ___ for two hours before the bus arrived.',['had been waiting','wait','are waiting','will wait'],'had been waiting'),
q('g9eng-v4','MCQ',1,'Verb Forms','Ali ___ his homework every evening.',['does','do','doing','done'],'does'),
q('g9eng-v5','MCQ',1,'Verb Forms','We ___ the museum tomorrow.',['will visit','visited','visits','has visited'],'will visit'),
q('g9eng-sp1','MCQ',1,'Spelling','Choose the correctly spelled word.',['Environment','Enviroment','Environmant','Envirenment'],'Environment'),
q('g9eng-sp2','MCQ',1,'Spelling','Choose the correctly spelled word.',['Responsibility','Responsibilty','Responcibility','Responsibillity'],'Responsibility'),
q('g9eng-sp3','MCQ',1,'Spelling','Choose the correctly spelled word.',['Education','Educasion','Edducation','Educatoin'],'Education'),
q('g9eng-sp4','MCQ',1,'Spelling','Choose the correctly spelled word.',['Entrepreneur','Enterpreneur','Entreprenure','Entreprenuer'],'Entrepreneur'),
q('g9eng-voc1','MCQ',1,'Vocabulary','The word “crucial” is closest in meaning to:',['essential','ordinary','distant','silent'],'essential'),
q('g9eng-voc2','MCQ',1,'Vocabulary','The word “commendable” is closest in meaning to:',['praiseworthy','careless','harmful','weak'],'praiseworthy'),
q('g9eng-voc3','MCQ',1,'Vocabulary','The word “prosperity” means:',['well-being and success','complete silence','sudden danger','physical weakness'],'well-being and success'),
q('g9eng-voc4','MCQ',1,'Vocabulary','The opposite of “inclusive” is:',['exclusive','helpful','equal','open'],'exclusive'),
q('g9eng-voc5','MCQ',1,'Vocabulary','The word “patriotism” refers to:',['love and devotion to one’s country','fear of travel','interest in sports','study of plants'],'love and devotion to one’s country'),
q('g9eng-g1','MCQ',1,'Grammar','In “Reading improves vocabulary”, “Reading” is a:',['gerund','pronoun','adverb','conjunction'],'gerund'),
q('g9eng-g2','MCQ',1,'Grammar','In “She spoke politely”, “politely” is an:',['adverb of manner','adjective','noun','preposition'],'adverb of manner'),
q('g9eng-g3','MCQ',1,'Grammar','“This bag is mine.” The word “mine” is a:',['possessive pronoun','reflexive pronoun','relative pronoun','demonstrative adjective'],'possessive pronoun'),
q('g9eng-g4','MCQ',1,'Grammar','“The students worked hard.” This is a:',['simple sentence','compound sentence','complex sentence','imperative sentence'],'simple sentence'),
q('g9eng-g5','MCQ',1,'Grammar','Choose the passive form of “The teacher checks the work.”',['The work is checked by the teacher.','The work checked the teacher.','The teacher is checked by the work.','The work has checking.'],'The work is checked by the teacher.')
];
addToFirst('g9-english','Board Objective Skills',eng);

const isl=[
q('g9isl-m1','MCQ',1,'ایمانیات','توحید سے مراد کیا ہے؟',['اللہ تعالیٰ کی وحدانیت پر ایمان','صرف عبادت گاہ بنانا','تاریخ کا مطالعہ','زبان سیکھنا'],'اللہ تعالیٰ کی وحدانیت پر ایمان'),
q('g9isl-m2','MCQ',1,'عبادات','نماز کا بنیادی مقصد کیا ہے؟',['اللہ کی عبادت اور یاد','صرف جسمانی ورزش','سفر کی تیاری','تجارت'],'اللہ کی عبادت اور یاد'),
q('g9isl-m3','MCQ',1,'اخلاق','وعدہ پورا کرنا کس اخلاقی قدر کی مثال ہے؟',['دیانت و ذمہ داری','تکبر','اسراف','غفلت'],'دیانت و ذمہ داری'),
q('g9isl-m4','MCQ',1,'معاشرت','اسلامی معاشرت میں پڑوسی کے ساتھ رویہ کیسا ہونا چاہیے؟',['حسن سلوک','بدگمانی','زیادتی','لاتعلقی'],'حسن سلوک'),
q('g9isl-m5','MCQ',1,'سیرت','سیرتِ نبوی ﷺ کے مطالعے کا مقصد کیا ہے؟',['عملی رہنمائی حاصل کرنا','صرف نام یاد کرنا','صرف تاریخیں یاد کرنا','کوئی نہیں'],'عملی رہنمائی حاصل کرنا'),
q('g9isl-m6','MCQ',1,'قرآن و حدیث','قرآن و حدیث مسلمان کے لیے کیا حیثیت رکھتے ہیں؟',['بنیادی مصادرِ ہدایت','صرف ادبی کتابیں','صرف تاریخی دستاویزات','غیر متعلق مواد'],'بنیادی مصادرِ ہدایت'),
q('g9isl-m7','MCQ',1,'حقوق العباد','دوسروں کے حقوق ادا کرنا کس سے متعلق ہے؟',['حسن معاملات','صرف عبادات','صرف سفر','صرف تجارت'],'حسن معاملات'),
q('g9isl-m8','MCQ',1,'صبر','مشکل میں ثابت قدم رہنے کو کیا کہتے ہیں؟',['صبر','اسراف','تکبر','غیبت'],'صبر')
];
addToFirst('g9-islamiat','Objective Bank',isl);
if(typeof render==='function')render();
}catch(e){console.warn('class9 supplemental',e)}})();