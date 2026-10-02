import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import pg from 'pg';

const {Pool}=pg;
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
app.use(cors());
app.use(express.json({limit:'5mb'}));

const PORT=process.env.PORT||10000;
const MODEL=process.env.GEMINI_MODEL||'gemini-3.8-flash';
const API_KEY=process.env.GEMINI_API_KEY||'';
const STORE=path.join(__dirname,'data','question-bank.json');
const JOBS=path.join(__dirname,'data','jobs.json');
let pool=null;

async function readJson(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'))}catch{return fallback}}
async function writeJson(file,data){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(data,null,2))}
function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').trim()}
function hashQuestion(q){return crypto.createHash('sha256').update([q.grade,q.bookId,q.chapterId,q.type,norm(q.question||q.text)].join('|')).digest('hex')}
function validQuestion(q){
 if(!q||!q.grade||!q.bookId||!q.chapterId||!q.type||!(q.question||q.text))return false;
 if(q.type==='MCQ'&&(!Array.isArray(q.options)||q.options.length!==4||!q.answer))return false;
 if(['Short','Long','Numerical','CRQ','Practical','Translation','Grammar','Comprehension'].includes(q.type)&&!q.answer)return false;
 return true;
}
function schema(count){return{type:'object',properties:{questions:{type:'array',minItems:count,maxItems:count,items:{type:'object',properties:{
grade:{type:'integer'},bookId:{type:'string'},chapterId:{type:'string'},chapterTitle:{type:'string'},topic:{type:'string'},
type:{type:'string',enum:['MCQ','Short','Long','Numerical','CRQ','Practical','Translation','Grammar','Comprehension']},
marks:{type:'integer'},difficulty:{type:'string',enum:['easy','medium','hard']},question:{type:'string'},answer:{type:'string'},
options:{type:['array','null'],items:{type:'string'}},sourceRef:{type:'string'},sourceExcerpt:{type:'string'},confidence:{type:'number'}
},required:['grade','bookId','chapterId','chapterTitle','topic','type','marks','difficulty','question','answer','options','sourceRef','sourceExcerpt','confidence']}}},required:['questions']}}
async function initDb(){
 if(!process.env.DATABASE_URL)return;
 try{
  pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:5,connectionTimeoutMillis:8000});
  await pool.query(`CREATE TABLE IF NOT EXISTS questions(
   id text PRIMARY KEY,hash text UNIQUE NOT NULL,grade integer NOT NULL,book_id text NOT NULL,book_title text,
   chapter_id text NOT NULL,chapter_title text,topic text,exercise text,type text NOT NULL,marks integer NOT NULL DEFAULT 1,
   difficulty text,question text NOT NULL,answer text NOT NULL,options jsonb,source_ref text,source_excerpt text,
   confidence numeric,status text NOT NULL DEFAULT 'AI Generated',model text,created_at timestamptz NOT NULL DEFAULT now());
   CREATE INDEX IF NOT EXISTS questions_scope_idx ON questions(grade,book_id,chapter_id,type);
   CREATE TABLE IF NOT EXISTS generation_jobs(
   id text PRIMARY KEY,status text NOT NULL,target_count integer NOT NULL,processed integer NOT NULL DEFAULT 0,
   accepted integer NOT NULL DEFAULT 0,failed integer NOT NULL DEFAULT 0,payload jsonb NOT NULL,error text,
   created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`);
  console.log('Postgres question bank ready');
 }catch(e){console.error('Postgres init failed:',e.message);pool=null}
}
async function getBank(f={}){
 if(!pool){
  let rows=await readJson(STORE,[]);
  if(f.grade)rows=rows.filter(q=>String(q.grade)===String(f.grade));
  if(f.bookId)rows=rows.filter(q=>q.bookId===f.bookId);
  if(f.chapterId)rows=rows.filter(q=>q.chapterId===f.chapterId);
  if(f.type)rows=rows.filter(q=>q.type===f.type);
  return rows.slice(0,Math.min(Number(f.limit)||1000,5000));
 }
 const w=[],v=[];
 if(f.grade){v.push(Number(f.grade));w.push(`grade=$${v.length}`)}
 if(f.bookId){v.push(f.bookId);w.push(`book_id=$${v.length}`)}
 if(f.chapterId){v.push(f.chapterId);w.push(`chapter_id=$${v.length}`)}
 if(f.type){v.push(f.type);w.push(`type=$${v.length}`)}
 const lim=Math.min(Number(f.limit)||1000,5000);v.push(lim);
 const r=await pool.query(`SELECT id,grade,book_id AS "bookId",book_title AS "bookTitle",chapter_id AS "chapterId",chapter_title AS "chapterTitle",
 topic,exercise,type,marks,difficulty,question,question AS text,answer,options,source_ref AS "sourceRef",source_excerpt AS "sourceExcerpt",
 confidence,status,model,created_at AS "createdAt" FROM questions ${w.length?'WHERE '+w.join(' AND '):''} ORDER BY created_at DESC LIMIT $${v.length}`,v);
 return r.rows;
}
async function statsData(){
 if(!pool){const b=await readJson(STORE,[]),t={},g={};for(const q of b){t[q.type]=(t[q.type]||0)+1;g[q.grade]=(g[q.grade]||0)+1}return{total:b.length,byType:t,byGrade:g,target:20000}}
 const total=(await pool.query('SELECT COUNT(*)::int n FROM questions')).rows[0].n;
 const t=(await pool.query('SELECT type,COUNT(*)::int n FROM questions GROUP BY type')).rows;
 const g=(await pool.query('SELECT grade,COUNT(*)::int n FROM questions GROUP BY grade')).rows;
 return{total,byType:Object.fromEntries(t.map(x=>[x.type,x.n])),byGrade:Object.fromEntries(g.map(x=>[String(x.grade),x.n])),target:20000};
}
async function insertRows(rows){
 if(!rows.length)return 0;
 if(!pool){const b=await readJson(STORE,[]),h=new Set(b.map(q=>q.hash||hashQuestion(q))),a=[];for(const q of rows){if(h.has(q.hash))continue;h.add(q.hash);a.push(q)}await writeJson(STORE,b.concat(a));return a.length}
 let n=0;
 for(const q of rows){const r=await pool.query(`INSERT INTO questions(id,hash,grade,book_id,book_title,chapter_id,chapter_title,topic,exercise,type,marks,difficulty,question,answer,options,source_ref,source_excerpt,confidence,status,model)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'AI Generated',$19) ON CONFLICT(hash) DO NOTHING`,
 [q.id,q.hash,q.grade,q.bookId,q.bookTitle,q.chapterId,q.chapterTitle,q.topic,q.exercise,q.type,q.marks,q.difficulty,q.question,q.answer,q.options?JSON.stringify(q.options):null,q.sourceRef,q.sourceExcerpt,q.confidence,q.model]);n+=r.rowCount}
 return n;
}
async function callGemini(prompt,count){
 if(!API_KEY)throw new Error('GEMINI_API_KEY is not configured');
 const body={model:MODEL,input:prompt,response_format:{type:'text',mime_type:'application/json',schema:schema(count)}};
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':API_KEY},body:JSON.stringify(body)});
 if(!r.ok)throw new Error('Gemini '+r.status+': '+(await r.text()).slice(0,800));
 const d=await r.json(),txt=d.output_text||d?.steps?.flatMap(x=>x.content||[]).find(x=>x.type==='text')?.text;
 if(!txt)throw new Error('Gemini returned no structured text');
 return JSON.parse(txt);
}
function buildPrompt({grade,bookId,bookTitle,chapterId,chapterTitle,topics,sourceText,types,count}){
 return `Build original Punjab curriculum practice questions. Use ONLY supplied source material and exact mapped scope. Never invent facts and never reproduce textbook wording verbatim.
Generate exactly ${count} questions.
Grade: ${grade}
Book ID: ${bookId}
Book: ${bookTitle}
Chapter ID: ${chapterId}
Chapter: ${chapterTitle}
Allowed topics: ${topics.join(', ')||'Only supplied chapter'}
Allowed types: ${types.join(', ')}
Rules: MCQ has exactly 4 options; every type needs a correct answer/marking guide; difficulty mix easy/medium/hard; sourceRef identifies the supplied source; sourceExcerpt is a brief factual anchor; confidence below 0.75 will be rejected; stay strictly inside grade/book/chapter/topic.
SOURCE MATERIAL:
${sourceText}`;
}
function makeRows(out,meta){
 const rows=[];
 for(const raw of out.questions||[]){
  const q={...raw,grade:Number(meta.grade),bookId:meta.bookId,bookTitle:meta.bookTitle,chapterId:meta.chapterId,chapterTitle:meta.chapterTitle||raw.chapterTitle,text:raw.question,createdAt:new Date().toISOString(),model:MODEL,status:'AI Generated'};
  q.hash=hashQuestion(q);q.id='q-'+q.hash.slice(0,24);
  if(validQuestion(q)&&Number(q.confidence)>=0.75)rows.push(q);
 }
 return rows;
}
async function generateNow(meta,count){
 const safe=Math.max(5,Math.min(Number(count)||20,50));
 const out=await callGemini(buildPrompt({...meta,count:safe}),safe);
 const rows=makeRows(out,meta),accepted=await insertRows(rows);
 return{accepted,rejected:Math.max(0,safe-rows.length),questions:rows};
}

app.get('/',(req,res)=>res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Punjab Test Generator AI</title><style>
body{margin:0;font-family:Inter,Arial,sans-serif;background:#f4f7fb;color:#162033}.wrap{max-width:1100px;margin:auto;padding:28px}.hero{padding:26px;border-radius:22px;background:linear-gradient(120deg,#17213e,#3659e3 60%,#725cf2);color:#fff}.hero h1{margin:6px 0}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.card,.panel{background:#fff;border:1px solid #e5eaf2;border-radius:16px;padding:16px}.card strong{display:block;font-size:25px}.muted{color:#718096;font-size:12px}.bar{height:12px;background:#edf1f7;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#3659e3,#ec4899)}.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.item{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eef1f5;font-size:12px}@media(max-width:800px){.cards,.row{grid-template-columns:1fr 1fr}}@media(max-width:520px){.cards,.row{grid-template-columns:1fr}}</style></head><body><div class="wrap"><div class="hero"><div style="font-size:10px;letter-spacing:.16em;font-weight:800;opacity:.7">GEMINI QUESTION ENGINE</div><h1>Punjab Test Generator AI Bank</h1><p>20,000 target • exact class/book/chapter scope • typed categories • validation + duplicate filtering</p></div><div class="cards"><div class="card"><strong id="total">0</strong><span class="muted">Generated</span></div><div class="card"><strong>20,000</strong><span class="muted">Target</span></div><div class="card"><strong id="mcq">0</strong><span class="muted">MCQs</span></div><div class="card"><strong id="short">0</strong><span class="muted">Short</span></div></div><div class="panel"><b>Progress</b><div class="bar" style="margin-top:10px"><i id="p" style="width:0%"></i></div><div id="pct" class="muted" style="margin-top:8px">0%</div></div><div class="row"><div class="panel"><b>Types</b><div id="types"></div></div><div class="panel"><b>Classes</b><div id="grades"></div></div></div><p class="muted">Gemini: ${MODEL} • API key: ${API_KEY?'configured':'missing'} • Postgres: ${pool?'connected':'JSON fallback'}</p></div><script>
async function load(){try{const s=await fetch('/stats').then(r=>r.json());document.getElementById('total').textContent=(s.total||0).toLocaleString();document.getElementById('mcq').textContent=(s.byType?.MCQ||0).toLocaleString();document.getElementById('short').textContent=(s.byType?.Short||0).toLocaleString();const p=Math.min(100,(s.total||0)/20000*100);document.getElementById('p').style.width=p+'%';document.getElementById('pct').textContent=p.toFixed(1)+'%';document.getElementById('types').innerHTML=['MCQ','Short','Long','Numerical','CRQ','Practical','Translation','Grammar','Comprehension'].map(x=>'<div class="item"><span>'+x+'</span><b>'+((s.byType?.[x]||0).toLocaleString())+'</b></div>').join('');document.getElementById('grades').innerHTML=[8,9,10,11,12].map(x=>'<div class="item"><span>Class '+x+'</span><b>'+((s.byGrade?.[x]||0).toLocaleString())+'</b></div>').join('')}catch(e){}}load();setInterval(load,15000)</script></body></html>`));
app.get('/health',(req,res)=>res.json({ok:true,model:MODEL,keyConfigured:!!API_KEY,database:!!pool}));
app.get('/stats',async(req,res)=>{try{res.json(await statsData())}catch(e){res.status(500).json({error:e.message})}});
app.get('/questions',async(req,res)=>{try{res.json(await getBank(req.query))}catch(e){res.status(500).json({error:e.message})}});
app.post('/generate',async(req,res)=>{try{
 const {grade,bookId,bookTitle,chapterId,chapterTitle,topics=[],sourceText='',types=['MCQ','Short','Long'],count=20}=req.body;
 if(!grade||!bookId||!chapterId||!sourceText)return res.status(400).json({error:'grade, bookId, chapterId and sourceText are required'});
 const result=await generateNow({grade,bookId,bookTitle,chapterId,chapterTitle,topics,sourceText,types},count);
 result.total=(await statsData()).total;res.json(result);
}catch(e){res.status(500).json({error:e.message})}});
app.post('/jobs/plan',async(req,res)=>{try{
 const {catalog,target=20000,types=['MCQ','Short','Long']}=req.body;if(!catalog?.classes)return res.status(400).json({error:'catalog.classes required'});
 const chapters=[];for(const cls of catalog.classes)for(const book of cls.books||[])for(const ch of book.chapters||[])chapters.push({grade:cls.grade,bookId:book.id,bookTitle:book.title,chapterId:ch.id,chapterTitle:ch.title,topics:(ch.topics||[]).map(t=>typeof t==='string'?t:t.title),sourceText:ch.sourceText||'',types});
 if(!chapters.length)return res.status(400).json({error:'No chapters supplied'});
 const n=Number(target)||20000,base=Math.floor(n/chapters.length),rem=n%chapters.length;
 const jobs=chapters.map((c,i)=>({id:'job-'+crypto.randomUUID(),...c,targetCount:base+(i<rem?1:0),status:c.sourceText?'planned':'blocked_source',processed:0,accepted:0,failed:0}));
 if(pool)for(const j of jobs)await pool.query('INSERT INTO generation_jobs(id,status,target_count,payload) VALUES($1,$2,$3,$4)',[j.id,j.status,j.targetCount,JSON.stringify(j)]);else await writeJson(JOBS,jobs);
 res.json({target:n,chapters:chapters.length,jobs});
}catch(e){res.status(500).json({error:e.message})}});
app.get('/jobs',async(req,res)=>{try{if(pool){const r=await pool.query('SELECT id,status,target_count AS "targetCount",processed,accepted,failed,error,created_at AS "createdAt",updated_at AS "updatedAt" FROM generation_jobs ORDER BY created_at DESC LIMIT 100');return res.json(r.rows)}res.json(await readJson(JOBS,[]))}catch(e){res.status(500).json({error:e.message})}});
async function updateJob(id,p){
 if(pool){const map={status:'status',processed:'processed',accepted:'accepted',failed:'failed',error:'error'},f=[],v=[];for(const[k,x]of Object.entries(p)){if(!map[k])continue;v.push(x);f.push(map[k]+'=$'+v.length)}if(f.length){v.push(id);await pool.query('UPDATE generation_jobs SET '+f.join(',')+',updated_at=now() WHERE id=$'+v.length,v)}}else{const a=await readJson(JOBS,[]),i=a.findIndex(x=>x.id===id);if(i>=0){a[i]={...a[i],...p,updatedAt:new Date().toISOString()};await writeJson(JOBS,a)}}}
async function runJob(job){
 if(!job.sourceText){await updateJob(job.id,{status:'blocked_source',error:'Source material is required'});return}
 await updateJob(job.id,{status:'running'});let processed=Number(job.processed)||0,accepted=Number(job.accepted)||0,failed=Number(job.failed)||0,target=Number(job.targetCount)||0;
 while(processed<target&&failed<3){const take=Math.min(25,target-processed);try{const r=await generateNow(job,take);processed+=take;accepted+=r.accepted;await updateJob(job.id,{status:processed>=target?'completed':'running',processed,accepted,failed})}catch(e){failed++;await updateJob(job.id,{status:failed>=3?'failed':'running',processed,accepted,failed,error:e.message});if(failed<3)await new Promise(r=>setTimeout(r,1500))}}}
app.post('/jobs/run',async(req,res)=>{try{const id=req.body?.jobId;if(!id)return res.status(400).json({error:'jobId required'});let job;if(pool){const r=await pool.query('SELECT id,status,target_count AS "targetCount",processed,accepted,failed,payload FROM generation_jobs WHERE id=$1',[id]);if(!r.rows[0])return res.status(404).json({error:'Job not found'});job={...r.rows[0],...(r.rows[0].payload||{})}}else{job=(await readJson(JOBS,[])).find(x=>x.id===id);if(!job)return res.status(404).json({error:'Job not found'})}if(['running','completed'].includes(job.status))return res.json({ok:true,status:job.status});runJob(job).catch(e=>console.error('job',e));res.json({ok:true,status:'started',jobId:id})}catch(e){res.status(500).json({error:e.message})}});

initDb().then(()=>app.listen(PORT,()=>console.log('AI Question Bank API listening on '+PORT)));
