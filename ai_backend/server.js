import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
app.use(cors());
app.use(express.json({limit:'3mb'}));

const PORT=process.env.PORT||10000;
const MODEL=process.env.GEMINI_MODEL||'gemini-3.8-flash';
const API_KEY=process.env.GEMINI_API_KEY||'';
const STORE=path.join(__dirname,'data','question-bank.json');
const JOBS=path.join(__dirname,'data','jobs.json');

async function readJson(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'))}catch{return fallback}}
async function writeJson(file,data){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(data,null,2))}
function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').trim()}
function hashQuestion(q){return crypto.createHash('sha256').update([q.grade,q.bookId,q.chapterId,q.type,norm(q.question)].join('|')).digest('hex')}
function validQuestion(q){
  if(!q||!q.grade||!q.bookId||!q.chapterId||!q.type||!q.question)return false;
  if(q.type==='MCQ'&&(!Array.isArray(q.options)||q.options.length!==4||!q.answer))return false;
  if(['Short','Long','Numerical','CRQ','Practical','Translation','Grammar','Comprehension'].includes(q.type)&&!q.answer)return false;
  return true;
}
function schema(count){
 return {
  type:'object',
  properties:{
   questions:{type:'array',minItems:count,maxItems:count,items:{
    type:'object',
    properties:{
     grade:{type:'integer'},
     bookId:{type:'string'},chapterId:{type:'string'},chapterTitle:{type:'string'},topic:{type:'string'},
     type:{type:'string',enum:['MCQ','Short','Long','Numerical','CRQ','Practical','Translation','Grammar','Comprehension']},
     marks:{type:'integer'},difficulty:{type:'string',enum:['easy','medium','hard']},
     question:{type:'string'},answer:{type:'string'},
     options:{type:['array','null'],items:{type:'string'}},
     sourceRef:{type:'string'},sourceExcerpt:{type:'string'},confidence:{type:'number'}
    },
    required:['grade','bookId','chapterId','chapterTitle','topic','type','marks','difficulty','question','answer','sourceRef','sourceExcerpt','confidence']
   }}
  },required:['questions']
 };
}
async function callGemini(payload,count){
 if(!API_KEY)throw new Error('GEMINI_API_KEY is not configured');
 const body={
  model:MODEL,
  input:payload.prompt,
  response_format:{type:'text',mime_type:'application/json',schema:schema(count)}
 };
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
  method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':API_KEY},body:JSON.stringify(body)
 });
 if(!r.ok)throw new Error('Gemini '+r.status+': '+(await r.text()).slice(0,500));
 const data=await r.json();
 const text=data.output_text || data?.steps?.flatMap(s=>s.content||[]).find(c=>c.type==='text')?.text;
 if(!text)throw new Error('Gemini returned no structured text');
 return JSON.parse(text);
}
function buildPrompt({grade,bookId,bookTitle,chapterId,chapterTitle,topics,sourceText,types,count}){
 return `You are building a Punjab curriculum question bank.
Use ONLY the supplied source material and mapped chapter/topic scope. Do not invent facts outside the source.
Generate exactly ${count} ORIGINAL practice questions. Do NOT copy textbook wording verbatim.
Grade: ${grade}
Book ID: ${bookId}
Book: ${bookTitle}
Chapter ID: ${chapterId}
Chapter: ${chapterTitle}
Allowed topics: ${topics.join(', ')}
Allowed types: ${types.join(', ')}
Rules:
- MCQ must have exactly 4 plausible options and a correct answer.
- Short/Long/Numerical/CRQ/Practical/Translation/Grammar/Comprehension must include a concise correct answer or marking guide.
- Use realistic Punjab-board difficulty mix: 35% easy, 45% medium, 20% hard.
- sourceRef must identify this provided source.
- sourceExcerpt must be a brief factual anchor from the source, not a long quote.
- confidence 0 to 1; below 0.75 means uncertain.
- Keep every question strictly inside this grade/book/chapter.
SOURCE MATERIAL:
${sourceText}`;
}

app.get('/',(req,res)=>res.type('html').send(`<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Punjab Test Generator — AI Dashboard</title>
<style>
:root{--bg:#f4f7fb;--ink:#162033;--muted:#718096;--line:#e5eaf2;--brand:#3659e3;--pink:#ec4899;--green:#12a66a}
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;background:var(--bg);color:var(--ink)}
.shell{display:grid;grid-template-columns:245px 1fr;min-height:100vh}.side{background:#111827;color:#fff;padding:22px 16px;display:flex;flex-direction:column;gap:9px}
.brand{display:flex;gap:10px;align-items:center;padding:4px 6px 20px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:8px}
.logo{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,var(--brand),var(--pink));font-weight:800}
.brand b{font-size:14px}.brand small{display:block;color:#94a3b8;margin-top:3px}
.nav{padding:11px 12px;border-radius:11px;color:#b7c0d0;text-decoration:none}.nav.active{background:rgba(54,89,227,.23);color:#fff}
.sidefoot{margin-top:auto;color:#8f9bad;font-size:11px;line-height:1.6}.main{padding:28px;max-width:1500px;width:100%}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.top h1{margin:0;font-size:26px}.top p{margin:5px 0 0;color:var(--muted);font-size:12px}
.live{padding:8px 11px;border-radius:999px;background:#e9f8f0;color:#128054;font-size:11px;font-weight:800}
.hero{padding:24px;border-radius:22px;background:linear-gradient(120deg,#17213e,#3659e3 58%,#725cf2);color:#fff;margin-bottom:18px;box-shadow:0 18px 50px rgba(54,89,227,.18)}
.hero h2{margin:5px 0 8px;font-size:28px}.hero p{margin:0;color:rgba(255,255,255,.75);max-width:720px;line-height:1.55;font-size:12px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 6px 22px rgba(24,35,70,.05)}
.card strong{display:block;font-size:24px}.card span{font-size:11px;color:var(--muted)}
.panel{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;margin-bottom:16px}
.panel h3{margin:0 0 12px;font-size:16px}.progress{height:14px;background:#edf1f7;border-radius:999px;overflow:hidden}.bar{height:100%;background:linear-gradient(90deg,var(--brand),var(--pink));width:0}
.row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.list{display:grid;gap:8px}.item{display:flex;justify-content:space-between;padding:10px 12px;border:1px solid var(--line);border-radius:11px;background:#fbfcff;font-size:12px}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.btn{display:inline-block;padding:10px 14px;border-radius:11px;text-decoration:none;font-size:12px;font-weight:750}.primary{background:var(--brand);color:#fff}.secondary{background:#f1f4ff;color:#334fc0}
code{font-size:11px;background:#f3f5f9;padding:3px 6px;border-radius:6px}
@media(max-width:900px){.shell{grid-template-columns:1fr}.side{display:none}.cards{grid-template-columns:1fr 1fr}.row{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="shell">
<aside class="side">
 <div class="brand"><div class="logo">PT</div><div><b>Punjab Test Generator</b><small>AI Bank Admin</small></div></div>
 <a class="nav active" href="/">▦ Dashboard</a>
 <a class="nav" href="/stats">● Stats JSON</a>
 <a class="nav" href="/health">✓ Health</a>
 <a class="nav" href="/questions">≡ Questions API</a>
 <div class="sidefoot">Gemini model<br><b>${MODEL}</b><br><br>API key: <b>${API_KEY?'Configured':'Missing'}</b></div>
</aside>
<main class="main">
 <div class="top"><div><h1>AI Question Bank Dashboard</h1><p>Classes 8–12 • source-grounded generation • 20,000 question target</p></div><span class="live">API LIVE</span></div>
 <div class="hero"><div style="font-size:10px;letter-spacing:.16em;font-weight:800;opacity:.7">GEMINI QUESTION ENGINE</div><h2>Build the complete Punjab question bank.</h2><p>MCQs, short Q/A, long Q/A, numericals, CRQs, practicals, translation, grammar and comprehension stay separated and mapped to their exact class, book, chapter and topic.</p></div>
 <div class="cards">
  <div class="card"><strong id="total">0</strong><span>Generated Questions</span></div>
  <div class="card"><strong>20,000</strong><span>Target Bank Size</span></div>
  <div class="card"><strong id="mcq">0</strong><span>MCQs</span></div>
  <div class="card"><strong id="short">0</strong><span>Short Q/A</span></div>
 </div>
 <div class="panel"><h3>Overall Progress</h3><div class="progress"><div class="bar" id="bar"></div></div><p id="pct" style="font-size:11px;color:var(--muted);margin:8px 0 0">0% complete</p></div>
 <div class="row">
  <div class="panel"><h3>Question Types</h3><div class="list" id="types"></div></div>
  <div class="panel"><h3>Grade Distribution</h3><div class="list" id="grades"></div></div>
 </div>
 <div class="panel"><h3>System</h3>
  <div class="list">
   <div class="item"><span>Gemini model</span><b>${MODEL}</b></div>
   <div class="item"><span>API key</span><b>${API_KEY?'Configured':'Missing'}</b></div>
   <div class="item"><span>Validation</span><b>Enabled</b></div>
   <div class="item"><span>Duplicate filtering</span><b>Enabled</b></div>
  </div>
  <div class="actions"><a class="btn primary" href="https://punjab-test-generator-preview.onrender.com">Open Teacher App</a><a class="btn secondary" href="/stats">Open Raw Stats</a><a class="btn secondary" href="/health">Health Check</a></div>
 </div>
</main></div>
<script>
async function load(){
 try{
  const s=await fetch('/stats').then(r=>r.json());
  document.getElementById('total').textContent=(s.total||0).toLocaleString();
  document.getElementById('mcq').textContent=(s.byType?.MCQ||0).toLocaleString();
  document.getElementById('short').textContent=(s.byType?.Short||0).toLocaleString();
  const pct=Math.min(100,((s.total||0)/(s.target||20000))*100);
  document.getElementById('bar').style.width=pct+'%';document.getElementById('pct').textContent=pct.toFixed(1)+'% complete';
  const types=['MCQ','Short','Long','Numerical','CRQ','Practical','Translation','Grammar','Comprehension'];
  document.getElementById('types').innerHTML=types.map(k=>'<div class="item"><span>'+k+'</span><b>'+((s.byType?.[k]||0).toLocaleString())+'</b></div>').join('');
  document.getElementById('grades').innerHTML=[8,9,10,11,12].map(g=>'<div class="item"><span>Class '+g+'</span><b>'+((s.byGrade?.[g]||0).toLocaleString())+'</b></div>').join('');
 }catch(e){}
}load();setInterval(load,15000);
</script>
</body></html>`));

app.get('/health',(req,res)=>res.json({ok:true,model:MODEL,keyConfigured:!!API_KEY}));
app.get('/stats',async(req,res)=>{
 const bank=await readJson(STORE,[]);
 const byType={};const byGrade={};
 for(const q of bank){byType[q.type]=(byType[q.type]||0)+1;byGrade[q.grade]=(byGrade[q.grade]||0)+1}
 res.json({total:bank.length,byType,byGrade,target:20000});
});
app.get('/questions',async(req,res)=>{
 const bank=await readJson(STORE,[]);
 const {grade,bookId,chapterId,type,limit='100'}=req.query;
 let rows=bank;
 if(grade)rows=rows.filter(q=>String(q.grade)===String(grade));
 if(bookId)rows=rows.filter(q=>q.bookId===bookId);
 if(chapterId)rows=rows.filter(q=>q.chapterId===chapterId);
 if(type)rows=rows.filter(q=>q.type===type);
 res.json(rows.slice(0,Math.min(Number(limit)||100,1000)));
});
app.post('/generate',async(req,res)=>{
 try{
  const {grade,bookId,bookTitle,chapterId,chapterTitle,topics=[],sourceText='',types=['MCQ','Short','Long'],count=20}=req.body;
  if(!grade||!bookId||!chapterId||!sourceText)return res.status(400).json({error:'grade, bookId, chapterId and sourceText are required'});
  const safeCount=Math.max(5,Math.min(Number(count)||20,50));
  const prompt=buildPrompt({grade,bookId,bookTitle,chapterId,chapterTitle,topics,sourceText,types,count:safeCount});
  const out=await callGemini({prompt},safeCount);
  const bank=await readJson(STORE,[]);
  const hashes=new Set(bank.map(q=>q.hash||hashQuestion(q)));
  const accepted=[],rejected=[];
  for(const raw of out.questions||[]){
   const q={...raw,grade:Number(grade),bookId,chapterId,chapterTitle:chapterTitle||raw.chapterTitle,createdAt:new Date().toISOString(),model:MODEL};
   q.hash=hashQuestion(q);
   if(!validQuestion(q)||q.confidence<0.75||hashes.has(q.hash)){rejected.push(q);continue}
   hashes.add(q.hash);accepted.push(q);
  }
  await writeJson(STORE,bank.concat(accepted));
  res.json({accepted:accepted.length,rejected:rejected.length,total:(bank.length+accepted.length),questions:accepted});
 }catch(e){res.status(500).json({error:e.message})}
});
app.post('/jobs/plan',async(req,res)=>{
 const {catalog,target=20000}=req.body;
 if(!catalog?.classes)return res.status(400).json({error:'catalog.classes required'});
 const chapters=[];
 for(const cls of catalog.classes)for(const book of cls.books||[])for(const ch of book.chapters||[])chapters.push({grade:cls.grade,bookId:book.id,bookTitle:book.title,chapterId:ch.id,chapterTitle:ch.title,topics:(ch.topics||[]).map(t=>t.title)});
 if(!chapters.length)return res.status(400).json({error:'No chapters supplied'});
 const base=Math.floor(target/chapters.length),rem=target%chapters.length;
 const jobs=chapters.map((c,i)=>({...c,targetCount:base+(i<rem?1:0),status:'planned'}));
 await writeJson(JOBS,jobs);
 res.json({target,chapters:chapters.length,jobs});
});

app.listen(PORT,()=>console.log('AI Question Bank API listening on',PORT));