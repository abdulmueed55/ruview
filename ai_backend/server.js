import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
app.use(cors());
app.use(express.json({limit:'3mb'}));

const PORT=process.env.PORT||10000;
const MODEL=process.env.GEMINI_MODEL||'gemini-3.8-flash';
const API_KEY=process.env.GEMINI_API_KEY||'';
const STORE=path.join(__dirname,'data','question-bank.json');
const JOBS=path.join(__dirname,'data','jobs.json');
const {Pool}=pg;
let pool=null;
async function initDb(){
 if(!process.env.DATABASE_URL)return;
 try{
  pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:5,connectionTimeoutMillis:8000});
  await pool.query(`CREATE TABLE IF NOT EXISTS questions (
   id text PRIMARY KEY, hash text UNIQUE NOT NULL, grade integer NOT NULL, book_id text NOT NULL, book_title text,
   chapter_id text NOT NULL, chapter_title text, topic text, exercise text, type text NOT NULL, marks integer NOT NULL DEFAULT 1,
   difficulty text, question text NOT NULL, answer text NOT NULL, options jsonb, source_ref text, source_excerpt text,
   confidence numeric, status text NOT NULL DEFAULT 'AI Generated', model text, created_at timestamptz NOT NULL DEFAULT now()
  ); CREATE INDEX IF NOT EXISTS questions_scope_idx ON questions(grade,book_id,chapter_id,type);
  CREATE TABLE IF NOT EXISTS generation_jobs (
   id text PRIMARY KEY, status text NOT NULL, target_count integer NOT NULL, processed integer NOT NULL DEFAULT 0,
   accepted integer NOT NULL DEFAULT 0, failed integer NOT NULL DEFAULT 0, payload jsonb NOT NULL, error text,
   created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  console.log('Postgres question bank ready');
 }catch(e){console.error('Postgres init failed; using JSON fallback:',e.message);pool=null}
}
async function getBank(filters={}){
 if(!pool){
  let rows=await readJson(STORE,[]);
  if(filters.grade)rows=rows.filter(q=>String(q.grade)===String(filters.grade));
  if(filters.bookId)rows=rows.filter(q=>q.bookId===filters.bookId);
  if(filters.chapterId)rows=rows.filter(q=>q.chapterId===filters.chapterId);
  if(filters.type)rows=rows.filter(q=>q.type===filters.type);
  return rows.slice(0,Math.min(Number(filters.limit)||1000,5000));
 }
 const where=[],vals=[];
 if(filters.grade){vals.push(Number(filters.grade));where.push(`grade=${vals.length}`)}
 if(filters.bookId){vals.push(filters.bookId);where.push(`book_id=${vals.length}`)}
 if(filters.chapterId){vals.push(filters.chapterId);where.push(`chapter_id=${vals.length}`)}
 if(filters.type){vals.push(filters.type);where.push(`type=${vals.length}`)}
 const limit=Math.min(Number(filters.limit)||1000,5000);vals.push(limit);
 const r=await pool.query(`SELECT id,grade,book_id AS "bookId",book_title AS "bookTitle",chapter_id AS "chapterId",
 chapter_title AS "chapterTitle",topic,exercise,type,marks,difficulty,question,question AS text,answer,options,
 source_ref AS "sourceRef",source_excerpt AS "sourceExcerpt",confidence,status,model,created_at AS "createdAt"
 FROM questions ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY created_at DESC LIMIT ${vals.length}`,vals);
 return r.rows;
}
async function statsData(){
 if(!pool){const bank=await readJson(STORE,[]),byType={},byGrade={};for(const q of bank){byType[q.type]=(byType[q.type]||0)+1;byGrade[q.grade]=(byGrade[q.grade]||0)+1}return{total:bank.length,byType,byGrade,target:20000}}
 const total=(await pool.query('SELECT COUNT(*)::int n FROM questions')).rows[0].n;
 const t=(await pool.query('SELECT type,COUNT(*)::int n FROM questions GROUP BY type')).rows;
 const g=(await pool.query('SELECT grade,COUNT(*)::int n FROM questions GROUP BY grade')).rows;
 return{total,byType:Object.fromEntries(t.map(x=>[x.type,x.n])),byGrade:Object.fromEntries(g.map(x=>[String(x.grade),x.n])),target:20000};
}
async function insertRows(rows){
 if(!rows.length)return 0;
 if(!pool){const bank=await readJson(STORE,[]),hashes=new Set(bank.map(q=>q.hash||hashQuestion(q))),accepted=[];for(const q of rows){if(hashes.has(q.hash))continue;hashes.add(q.hash);accepted.push(q)}await writeJson(STORE,bank.concat(accepted));return accepted.length}
 let n=0;for(const q of rows){const r=await pool.query(`INSERT INTO questions(id,hash,grade,book_id,book_title,chapter_id,chapter_title,topic,exercise,type,marks,difficulty,question,answer,options,source_ref,source_excerpt,confidence,status,model)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'AI Generated',$19) ON CONFLICT(hash) DO NOTHING`,
 [q.id,q.hash,q.grade,q.bookId,q.bookTitle,q.chapterId,q.chapterTitle,q.topic,q.exercise,q.type,q.marks,q.difficulty,q.question,q.answer,q.options?JSON.stringify(q.options):null,q.sourceRef,q.sourceExcerpt,q.confidence,q.model]);n+=r.rowCount}return n;
}

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

app.get('/health',(req,res)=>res.json({ok:true,model:MODEL,keyConfigured:!!API_KEY,database:!!pool}));
app.get('/stats',async(req,res)=>{try{res.json(await statsData())}catch(e){res.status(500).json({error:e.message})}});
app.get('/questions',async(req,res)=>{try{res.json(await getBank(req.query))}catch(e){res.status(500).json({error:e.message})}});
app.post('/generate',async(req,res)=>{
 try{
  const {grade,bookId,bookTitle,chapterId,chapterTitle,topics=[],sourceText='',types=['MCQ','Short','Long'],count=20}=req.body;
  if(!grade||!bookId||!chapterId||!sourceText)return res.status(400).json({error:'grade, bookId, chapterId and sourceText are required'});
  const safeCount=Math.max(5,Math.min(Number(count)||20,50));
  const prompt=buildPrompt({grade,bookId,bookTitle,chapterId,chapterTitle,topics,sourceapp.post('/generate',async(req,res)=>{
 try{
  const {grade,bookId,bookTitle,chapterId,chapterTitle,topics=[],sourceText='',types=['MCQ','Short','Long'],count=20}=req.body;
  if(!grade||!bookId||!chapterId||!sourceText)return res.status(400).json({error:'grade, bookId, chapterId and sourceText are required'});
  const safeCount=Math.max(5,Math.min(Number(count)||20,50));
  const prompt=buildPrompt({grade,bookId,bookTitle,chapterId,chapterTitle,topics,sourceText,types,count:safeCount});
  const out=await callGemini({prompt},safeCount);
  const rows=[];for(const raw of out.questions||[]){
   const q={...raw,grade:Number(grade),bookId,bookTitle,chapterId,chapterTitle:chapterTitle||raw.chapterTitle,text:raw.question,
   createdAt:new Date().toISOString(),model:MODEL,status:'AI Generated'};q.hash=hashQuestion(q);q.id='q-'+q.hash.slice(0,24);
   if(validQuestion(q)&&Number(q.confidence)>=0.75)rows.push(q);
  }
  const accepted=await insertRows(rows);const total=(await statsData()).total;
  res.json({accepted,rejected:Math.max(0,safeCount-rows.length),total,questions:rows});
 }catch(e){res.status(500).json({error:e.message})}
});
app.post('/jobs/plan',async(req,res)=>{
 try{
  const {catalog,target=20000,types=['MCQ','Short','Long']}=req.body;
  if(!catalog?.classes)return res.status(400).json({error:'catalog.classes required'});
  const chapters=[];
  for(const cls of catalog.classes)for(const book of cls.books||[])for(const ch of book.chapters||[])
   chapters.push({grade:cls.grade,bookId:book.id,bookTitle:book.title,chapterId:ch.id,chapterTitle:ch.title,
    topics:(ch.topics||[]).map(t=>typeof t==='string'?t:t.title),sourceText:ch.sourceText||'',types});
  if(!chapters.length)return res.status(400).json({error:'No chapters supplied'});
  const totalTarget=Number(target)||20000,base=Math.floor(totalTarget/chapters.length),rem=totalTarget%chapters.length;
  const jobs=chapters.map((c,i)=>({id:'job-'+crypto.randomUUID(),...c,targetCount:base+(i<rem?1:0),status:c.sourceText?'planned':'blocked_source',processed:0,accepted:0,failed:0}));
  if(pool)for(const j of jobs)await pool.query('INSERT INTO generation_jobs(id,status,target_count,payload) VALUES($1,$2,$3,$4)',[j.id,j.status,j.targetCount,JSON.stringify(j)]);
  else await writeJson(JOBS,jobs);
  res.json({target:totalTarget,chapters:chapters.length,jobs});
 }catch(e){res.status(500).json({error:e.message})}
});
app.get('/jobs',async(req,res)=>{
 try{
  if(pool){const r=await pool.query('SELECT id,status,target_count "targetCount",processed,accepted,failed,error,created_at "createdAt",updated_at "updatedAt",payload FROM generation_jobs ORDER BY created_at DESC LIMIT 100');return res.json(r.rows)}
  res.json(await readJson(JOBS,[]));
 }catch(e){res.status(500).json({error:e.message})}
});
async function updateJob(id,patch){
 if(pool){const map={status:'status',processed:'processed',accepted:'accepted',failed:'failed',error:'error'},f=[],v=[];for(const[k,x]of Object.entries(patch)){if(!map[k])continue;v.push(x);f.push(map[k]+'=$'+v.length)}if(f.length){v.push(id);await pool.query('UPDATE generation_jobs SET '+f.join(',')+',updated_at=now() WHERE id=$'+v.length,v)}}
 else{const jobs=await readJson(JOBS,[]),i=jobs.findIndex(j=>j.id===id);if(i>=0){jobs[i]={...jobs[i],...patch,updatedAt:new Date().toISOString()};await writeJson(JOBS,jobs)}}
}
async function processJob(job){
 if(!job.sourceText){await updateJob(job.id,{status:'blocked_source',error:'Source material is required'});return}
 await updateJob(job.id,{status:'running'});
 let processed=Number(job.processed)||0,accepted=Number(job.accepted)||0,failed=Number(job.failed)||0,target=Number(job.targetCount)||0;
 while(processed<target&&failed<3){
  const take=Math.min(25,target-processed);
  try{const r=await generateNow(job,take);accepted+=r.accepted;processed+=take;await updateJob(job.id,{status:processed>=target?'completed':'running',processed,accepted,failed})}
  catch(e){failed++;await updateJob(job.id,{status:failed>=3?'failed':'running',processed,accepted,failed,error:e.message});if(failed<3)await new Promise(r=>setTimeout(r,1500))}
 }
}
async function generateNow(job,count){
 const {grade,bookId,bookTitle,chapterId,chapterTitle,topics=[],sourceText,types=['MCQ','Short','Long']}=job;
 const safeCount=Math.max(5,Math.min(Number(count)||20,50));const out=await callGemini({prompt:buildPrompt({grade,bookId,bookTitle,chapterId,chapterTitle,topics,sourceText,types,count:safeCount})},safeCount);
 const rows=[];for(const raw of out.questions||[]){const q={...raw,grade:Number(grade),bookId,bookTitle,chapterId,chapterTitle:chapterTitle||raw.chapterTitle,text:raw.question,createdAt:new Date().toISOString(),model:MODEL,status:'AI Generated'};q.hash=hashQuestion(q);q.id='q-'+q.hash.slice(0,24);if(validQuestion(q)&&Number(q.confidence)>=0.75)rows.push(q)}
 return{accepted:await insertRows(rows),questions:rows};
}
app.post('/jobs/run',async(req,res)=>{
 const id=req.body?.jobId;if(!id)return res.status(400).json({error:'jobId required'});let job;
 if(pool){const r=await pool.query('SELECT id,status,target_count "targetCount",processed,accepted,failed,payload,error FROM generation_jobs WHERE id=$1',[id]);if(!r.rows[0])return res.status(404).json({error:'Job not found'});job={...r.rows[0],...(r.rows[0].payload||{})}}
 else{job=(await readJson(JOBS,[])).find(x=>x.id===id);if(!job)return res.status(404).json({error:'Job not found'})}
 if(['running','completed'].includes(job.status))return res.json({ok:true,status:job.status});
 processJob(job).catch(e=>console.error('job worker',e));res.json({ok:true,status:'started',jobId:id});
});
initDb().then(()=>app.listen(PORT,()=>console.log('AI Question Bank API listening on',PORT)));
