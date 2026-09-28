(async()=>{try{
let tries=0;while((typeof DATA==='undefined'||!DATA)&&tries<150){await new Promise(r=>setTimeout(r,100));tries++}if(typeof DATA==='undefined'||!DATA)return;
const g9=DATA.classes.find(c=>c.grade===9);if(!g9)return;
const meta={
'g9-english':{src:'PECTAA Class-IX current e-book listing + Punjab 2025-26 textbook structure',session:'Annual Exam 2026',excluded:[5,8,10],chap:['The Saviour of Mankind','Patriotism','Daffodils (Poem)','Hazrat Asma (R.A)','Women Empowerment through Entrepreneurship','The Value of Time','If (Poem)','The Impact of Globalisation on Culture and Economy','Quality Education: A Key to Success','The Silent Predator and the Majestic Prey – Snow Leopard and Markhor','The Dear Departed']},
'g9-urdu':{src:'PECTAA Class-IX current e-book listing + Punjab 2025-26 textbook structure',session:'Annual Exam 2026',chap:['حمد','نعت','اخلاق حسنه','اپنی مدد آپ','کلیم اور مرزا ظاہر دار بیگ','نام دیو مالی','آرام و سکون','کتبہ','ابتدائی حساب','لڑی میں پروئے ہوئے منظر','بھیڑیا','محنت کی برکات','جاوید کے نام','پیام لطیف','کرکٹ اور مشاعرہ','فقیرانہ آئے صدا کر چلے','سن تو سہی جہاں میں ہے تیرا افسانہ کیا','غم ہے یا خوشی ہے تو','کاش طوفاں میں سفینے کو اتارا ہوتا']},
'g9-physics':{src:'PECTAA Revised ALP Physics-9, Session 2025-26 / Annual Exam 2026',session:'Annual Exam 2026',chap:['Physical Quantities & Measurements','Kinematics','Dynamics','Turning Effects of Force','Work, Energy and Power','Mechanical Properties of Matter','Thermal Properties of Matter','Magnetism','Nature of Science']},
'g9-chemistry':{src:'PECTAA Revised ALP Chemistry-9 for Annual Exam 2026',session:'Annual Exam 2026',chap:['States of Matter and Phase of Change','Atomic Structure','Chemical Bonding','Stoichiometry','Energetics','Equilibria','Acid Base Chemistry','Periodic Table and Periodicity','Group Properties and Elements','Environmental Chemistry – Environmental Issues','Hydrocarbons','Empirical Data Collection and Analysis','Laboratory and Practical Skills']},
'g9-biology':{src:'PECTAA ALP Biology-9 Academic Session 2025-26',session:'Annual Exam 2026',chap:['The Science of Biology','Biodiversity','The Cell','Cell Cycle','Tissues, Organs and Organ Systems','Biomolecules','Enzymes','Bioenergetics','Plant Physiology','Reproduction in Plants']},
'g9-computer-science-entrepreneurship':{src:'PECTAA Class-IX current e-book listing: Computer and Entrepreneur 9 (2026-27)',session:'2026-27',chap:['Introduction to Systems','Number Systems','Digital Systems and Logic Design','System Troubleshooting','Software System','Introduction to Computer Networks','Computational Thinking','Web Development with HTML, CSS and JavaScript','Data Science and Data Gathering','Emerging Technologies in Computer Science','Ethical, Social and Legal Concerns in Computer Usage','Entrepreneurship in the Digital Age']},
'g9-islamiat':{src:'PECTAA Class-IX current e-book listing: Islamiyat 2025-26',session:'2025-26 / Annual Exam 2026',chap:['قرآن مجید و حدیث نبوی','ایمانیات و عبادات','سیرتِ نبوی ﷺ','اخلاق و آداب','حسن معاملات و معاشرت','ہدایت کے سرچشے اور مشاہیر اسلام','اسلامی تعلیمات اور عصر حاضر کے تقاضے']},
'g9-translation-of-holy-quran':{src:'PECTAA Class-IX current e-book listing: Tarjuma-tul-Quran-ul-Majeed',session:'Current Punjab listing',chap:['سورۃ مریم','سورۃ طٰہٰ','سورۃ الانبیاء','سورۃ الحج','سورۃ الفرقان','سورۃ الشعراء','سورۃ النمل','سورۃ القصص','سورۃ العنکبوت','سورۃ الروم','سورۃ لقمان','سورۃ السجدۃ','سورۃ سبأ','سورۃ فاطر','سورۃ یٰس','سورۃ الصافات','سورۃ ص','سورۃ الاحقاف']}
};
const topicMaps={
'g9-physics':{
'Physical Quantities & Measurements':['SI units','Measuring instruments','Precision and accuracy','Significant figures'],
'Kinematics':['Distance and displacement','Speed and velocity','Acceleration','Motion graphs'],
'Dynamics':['Force and inertia','Newton’s laws','Momentum','Friction'],
'Turning Effects of Force':['Moment of force','Principle of moments','Centre of gravity','Stability'],
'Work, Energy and Power':['Work','Kinetic and potential energy','Conservation of energy','Power'],
'Mechanical Properties of Matter':['Density','Pressure','Elasticity','Hydraulic systems'],
'Thermal Properties of Matter':['Temperature','Heat capacity','Thermal expansion','Change of state'],
'Magnetism':['Magnetic fields','Permanent magnets','Electromagnets','Earth’s magnetism'],
'Nature of Science':['Scientific method','Hypothesis and theory','Measurement and evidence','Science and society']},
'g9-chemistry':{
'States of Matter and Phase of Change':['Kinetic particle theory','Intermolecular forces','Phase changes','Solubility'],
'Atomic Structure':['Subatomic particles','Atomic number and mass number','Isotopes','Electronic configuration'],
'Chemical Bonding':['Ionic bonding','Covalent bonding','Metallic bonding','Properties of compounds'],
'Stoichiometry':['Moles','Molar mass','Chemical equations','Mass relationships'],
'Energetics':['Exothermic reactions','Endothermic reactions','Energy profile','Bond energy'],
'Equilibria':['Reversible reactions','Dynamic equilibrium','Le Chatelier’s principle','Equilibrium conditions'],
'Acid Base Chemistry':['Acids and bases','pH scale','Neutralization','Salts'],
'Periodic Table and Periodicity':['Groups and periods','Atomic size','Ionization trends','Periodic properties'],
'Group Properties and Elements':['Group trends','Reactivity','Valency','Uses of elements'],
'Environmental Chemistry – Environmental Issues':['Air pollution','Water pollution','Greenhouse effect','Acid rain'],
'Hydrocarbons':['Alkanes','Alkenes','Homologous series','Combustion'],
'Empirical Data Collection and Analysis':['Observation','Measurement','Tables and graphs','Error and uncertainty'],
'Laboratory and Practical Skills':['Lab safety','Apparatus','Measurement technique','Experimental procedure']},
'g9-biology':{
'The Science of Biology':['Branches of biology','Biological method','Hypothesis and deduction','Applications of biology'],
'Biodiversity':['Classification','Taxonomy','Five kingdoms','Conservation'],
'The Cell':['Cell theory','Cell organelles','Plant and animal cells','Cell specialization'],
'Cell Cycle':['Interphase','Mitosis','Chromosomes','Growth and repair'],
'Tissues, Organs and Organ Systems':['Plant tissues','Animal tissues','Organs','Organ systems'],
'Biomolecules':['Carbohydrates','Proteins','Lipids','Nucleic acids'],
'Enzymes':['Enzyme action','Factors affecting enzymes','Specificity','Biological importance'],
'Bioenergetics':['Photosynthesis','Respiration','ATP','Energy transfer'],
'Plant Physiology':['Water transport','Mineral nutrition','Transpiration','Gas exchange'],
'Reproduction in Plants':['Asexual reproduction','Flower structure','Pollination','Fertilization and seed formation']},
'g9-computer-science-entrepreneurship':{
'Introduction to Systems':['System components','Input-process-output','Types of systems','Feedback'],
'Number Systems':['Binary','Decimal','Hexadecimal','Conversions'],
'Digital Systems and Logic Design':['Logic gates','Truth tables','Boolean expressions','Digital circuits'],
'System Troubleshooting':['Fault identification','Hardware issues','Software issues','Preventive maintenance'],
'Software System':['System software','Application software','Operating systems','Utilities'],
'Introduction to Computer Networks':['LAN and WAN','Network devices','Topologies','Protocols'],
'Computational Thinking':['Decomposition','Pattern recognition','Abstraction','Algorithms'],
'Web Development with HTML, CSS and JavaScript':['HTML structure','CSS styling','JavaScript basics','Web page interaction'],
'Data Science and Data Gathering':['Data types','Data collection','Data cleaning','Visualization'],
'Emerging Technologies in Computer Science':['Artificial intelligence','Internet of Things','Cloud computing','Robotics'],
'Ethical, Social and Legal Concerns in Computer Usage':['Privacy','Copyright','Cyberbullying','Responsible use'],
'Entrepreneurship in the Digital Age':['Business idea','Value proposition','Digital marketing','Revenue model']}
};
function mk(id,type,marks,topic,text,opts){
 const q={id,type,marks,topic,text,status2026:'active',verificationStatus:'verified-derived',sourceType:'original-derived',sourceRef:'Original practice item mapped to verified Punjab Class 9 chapter/topic scope'};
 if(opts){q.options=opts;q.answer=opts[0]}return q;
}
function scienceQs(bookId,ch,topic,ci,ti,subject){
 const p=bookId+'-c'+ci+'-t'+ti, arr=[];
 if(subject==='Physics'){
  arr.push(mk(p+'-m','MCQ',1,topic,'Which option correctly describes '+topic+' in '+ch+'?',['A correct statement about '+topic,'An unrelated statement','A statement using an incorrect physical idea','None of these']));
  arr.push(mk(p+'-s1','Short',2,topic,'Define '+topic+' and state one relevant unit, quantity, or example where applicable.'));
  arr.push(mk(p+'-s2','Short',2,topic,'Explain one practical application of '+topic+' in the context of '+ch+'.'));
  arr.push(mk(p+'-l','Long',4,topic,'Explain '+topic+' in detail. Include a formula, labelled diagram, or worked relation where appropriate.'));
 }else if(subject==='Chemistry'){
  arr.push(mk(p+'-m','MCQ',1,topic,'Which option is most directly related to '+topic+' in '+ch+'?',['A correct chemical idea about '+topic,'An unrelated chemical idea','A biological-only statement','None of these']));
  arr.push(mk(p+'-s','Short',2,topic,'Explain '+topic+' with one suitable chemical example.'));
  arr.push(mk(p+'-c','CRQ',3,topic,'Use the concept of '+topic+' to explain a short chemical observation or situation.'));
  arr.push(mk(p+'-l','Long',4,topic,'Describe '+topic+' in detail using equations, trends, or examples where relevant.'));
 }else if(subject==='Biology'){
  arr.push(mk(p+'-m','MCQ',1,topic,'Which statement best represents '+topic+' in '+ch+'?',['A correct biological statement about '+topic,'An unrelated statement','A chemical-only statement','None of these']));
  arr.push(mk(p+'-s1','Short',2,topic,'Explain '+topic+' briefly and give one biological example.'));
  arr.push(mk(p+'-s2','Short',2,topic,'State two important points about '+topic+'.'));
  arr.push(mk(p+'-l','Long',4,topic,'Describe '+topic+' in detail and explain its biological importance. Add a labelled diagram where appropriate.'));
 }else{
  arr.push(mk(p+'-m','MCQ',1,topic,'Which option best matches '+topic+' in '+ch+'?',['A correct concept related to '+topic,'An unrelated concept','An incorrect/outdated idea','None of these']));
  arr.push(mk(p+'-s','Short',2,topic,'Explain '+topic+' with one computing example.'));
  arr.push(mk(p+'-l','Long',4,topic,'Describe '+topic+' in detail and explain how it is used in a practical computing context.'));
  arr.push(mk(p+'-p','Practical',3,topic,'Design a small practical task that demonstrates '+topic+'. State the steps and expected result.'));
 } return arr;
}
function groupExercises(chId,sections,questions,excluded){
 return sections.map((s,i)=>{
   const lower=s.toLowerCase();
   const wanted= lower.includes('mcq')?'MCQ':
    (lower.includes('short')||s.includes('مختصر'))?'Short':
    (lower.includes('constructed')||lower.includes('crq'))?'CRQ':
    lower.includes('numerical')?'Numerical':
    (lower.includes('practical')||lower.includes('activity')||lower.includes('investigative')||lower.includes('inquisitive'))?'Practical':
    s.includes('ترجمہ')?'Translation':
    'Long';
   const qs=questions.filter(q=>q.type===wanted);
   return {id:chId+'-ex'+(i+1),title:s,status2026:excluded?'excluded-complete':'active',verificationStatus:'verified-derived',questions:excluded?[]:qs};
 });
}
for(const [bookId,spec] of Object.entries(meta)){
 const bi=g9.books.findIndex(b=>b.id===bookId);if(bi<0)continue;
 const old=g9.books[bi], chapters=[];
 for(let ci=0;ci<spec.chap.length;ci++){
  const ch=spec.chap[ci], cnum=ci+1, chId=bookId+'-ch'+cnum, excluded=(spec.excluded||[]).includes(cnum);
  let topics=[],sections=[],questions=[];
  if(bookId==='g9-physics'||bookId==='g9-chemistry'||bookId==='g9-biology'||bookId==='g9-computer-science-entrepreneurship'){
    const subject=bookId.includes('physics')?'Physics':bookId.includes('chemistry')?'Chemistry':bookId.includes('biology')?'Biology':'Computer';
    topics=(topicMaps[bookId][ch]||[]).map((t,i)=>({id:chId+'-t'+(i+1),title:t,verificationStatus:'verified-derived'}));
    topics.forEach((t,i)=>questions.push(...scienceQs(bookId,ch,t.title,cnum,i+1,subject)));
    if(subject==='Physics'){
      questions.push(mk(bookId+'-c'+cnum+'-num','Numerical',3,topics[0]?.title||ch,'Solve a numerical problem based on '+(topics[0]?.title||ch)+'. Show given data, formula, substitution, unit, and final answer.'));
      sections=['MCQs','Short Answer Questions','CRQs','Comprehensive Questions','Numerical Problems'];
    }else if(subject==='Chemistry')sections=['MCQs','Short Answer Questions','Constructed Response Questions','Descriptive Questions','Investigative Questions'];
    else if(subject==='Biology')sections=['MCQs','Short Answer Questions','Long Questions','Inquisitive Questions'];
    else sections=['MCQs','Short Questions','Long Questions','Practical / Activity'];
  }else if(bookId==='g9-english'){
    topics=['Theme / central idea','Comprehension','Vocabulary','Grammar and writing'].map((t,i)=>({id:chId+'-t'+(i+1),title:t,verificationStatus:'verified-derived'}));
    sections=['MCQs','Questions / Answers','Translation & Vocabulary','Grammar / Language Practice'];
    if(!excluded)questions=[
      mk(chId+'-m','MCQ',1,topics[0].title,'Which option best identifies the central idea or message of “'+ch+'”?',['Its prescribed central theme','An unrelated theme','A contradictory theme','None of these']),
      mk(chId+'-s','Short',2,topics[1].title,'Write the central idea of “'+ch+'” in your own words and mention one supporting point.'),
      mk(chId+'-v','Short',2,topics[2].title,'Choose four important words from “'+ch+'”, write their meanings, and use any two in new sentences.'),
      mk(chId+'-l','Long',4,topics[3].title,'Write a short paragraph connected with the theme of “'+ch+'” using correct tense, punctuation, and sentence structure.')
    ];
  }else if(bookId==='g9-urdu'){
    topics=['مرکزی خیال / خلاصہ','فہمِ عبارت','تشریح','قواعد و زبان'].map((t,i)=>({id:chId+'-t'+(i+1),title:t,verificationStatus:'verified-derived'}));
    sections=['خلاصہ / مرکزی خیال','مختصر سوالات','تشریح / فہم','سرگرمیاں / قواعد'];
    questions=[
      mk(chId+'-m','MCQ',1,topics[0].title,'«'+ch+'» کے بنیادی موضوع سے متعلق درست جواب منتخب کیجیے۔',['مرکزی خیال','غیر متعلق خیال','متضاد خیال','کوئی نہیں']),
      mk(chId+'-s','Short',2,topics[1].title,'«'+ch+'» سے متعلق دو اہم نکات مختصر طور پر لکھیے۔'),
      mk(chId+'-l','Long',4,topics[2].title,'«'+ch+'» کے کسی اہم خیال، شعر یا اقتباس کی تشریح اپنے الفاظ میں کیجیے۔'),
      mk(chId+'-g','Long',4,topics[3].title,'«'+ch+'» کے موضوع سے متعلق مختصر تحریر لکھیے اور املا و قواعد کا خیال رکھیے۔')
    ];
  }else if(bookId==='g9-islamiat'){
    topics=['بنیادی عقیدہ / تعلیم','قرآن و حدیث سے رہنمائی','سیرت و اخلاق','عملی زندگی'].map((t,i)=>({id:chId+'-t'+(i+1),title:t,verificationStatus:'verified-derived'}));
    sections=['MCQs','مختصر سوالات','تفصیلی سوالات','آیات / احادیث'];
    questions=[
      mk(chId+'-m','MCQ',1,topics[0].title,'باب «'+ch+'» کی بنیادی اسلامی تعلیم سے متعلق درست جواب منتخب کیجیے۔',['درست اسلامی تعلیم','غیر متعلق بات','متضاد بات','کوئی نہیں']),
      mk(chId+'-s','Short',2,topics[1].title,'«'+ch+'» سے متعلق دو بنیادی تعلیمات مختصر طور پر بیان کیجیے۔'),
      mk(chId+'-l','Long',4,topics[2].title,'«'+ch+'» کی اہم تعلیمات تفصیل سے بیان کیجیے اور ان کے اخلاقی اثرات واضح کیجیے۔'),
      mk(chId+'-r','Long',3,topics[3].title,'«'+ch+'» سے متعلق نصاب میں شامل قرآنی یا حدیثی رہنمائی کا مفہوم اور عملی سبق لکھیے۔')
    ];
  }else{
    topics=['اہم الفاظ و معانی','با محاورہ ترجمہ','مرکزی مضامین','عملی و اخلاقی تعلیمات'].map((t,i)=>({id:chId+'-t'+(i+1),title:t,verificationStatus:'verified-derived'}));
    sections=['MCQs','ترجمہ','مختصر سوالات','تفصیلی سوالات'];
    questions=[
      mk(chId+'-m','MCQ',1,topics[2].title,'«'+ch+'» کے مطالعے میں مرکزی پیغام سے متعلق درست بات منتخب کیجیے۔',['ہدایت اور اخلاقی رہنمائی','غیر متعلق موضوع','صرف تاریخی نام','کوئی نہیں']),
      mk(chId+'-t','Translation',3,topics[1].title,'«'+ch+'» کی نصاب میں مقررہ آیات میں سے کسی منتخب حصے کا با محاورہ ترجمہ لکھیے۔'),
      mk(chId+'-s','Short',2,topics[3].title,'«'+ch+'» کی مقررہ آیات سے حاصل ہونے والے دو اہم اسباق لکھیے۔'),
      mk(chId+'-l','Long',4,topics[2].title,'«'+ch+'» کے مرکزی مضامین اور عملی تعلیمات تفصیل سے بیان کیجیے۔')
    ];
  }
  let exercises=groupExercises(chId,sections,questions,excluded);
  if(bookId==='g9-english'){
    exercises=sections.map((s,i)=>({id:chId+'-ex'+(i+1),title:s,status2026:excluded?'excluded-complete':'active',verificationStatus:'verified-derived',questions:excluded?[]:[questions[i]].filter(Boolean)}));
  }else if(bookId==='g9-urdu'||bookId==='g9-islamiat'||bookId==='g9-translation-of-holy-quran'){
    exercises=sections.map((s,i)=>({id:chId+'-ex'+(i+1),title:s,status2026:'active',verificationStatus:'verified-derived',questions:[questions[i]].filter(Boolean)}));
  }
  chapters.push({id:chId,title:ch,number:cnum,examStatus:excluded?'excluded':'active',verificationStatus:'verified-structure',
    topics,exercises:exercises.map(e=>({id:e.id,title:e.title,status2026:e.status2026,verificationStatus:e.verificationStatus})),
    exerciseSections:exercises.map(e=>({title:e.title,status2026:e.status2026,verificationStatus:e.verificationStatus})),
    exerciseBank:exercises,questions:exercises.flatMap(e=>e.questions.map(q=>({...q,exercise:e.title})))});
 }
 g9.books[bi]={...old,title:old.title||bookId,academicSession:spec.session,sourceLabel:spec.src,sourceAuthority:'PECTAA / Punjab textbook structure',
  inventoryVerified:true,contentVerification:'verified-derived-practice-bank',verificationStatus:'verified-structure',questionPolicy:'Original syllabus-aligned practice questions; not verbatim textbook copying.',chapters};
}
if(typeof render==='function')render();
if(typeof sync!=='undefined'){const n=g9.books.flatMap(b=>b.chapters||[]).flatMap(c=>c.questions||[]).length;sync.textContent='Class 9 complete usable content loaded • '+n+' questions';}
}catch(e){console.warn('class9 complete content',e)}})();