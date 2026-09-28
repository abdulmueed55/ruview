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
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Punjab Test Generator AI API</title>
<style>
body{font-family:Inter,Arial,sans-serif;background:#f5f7fb;color:#182033;margin:0;padding:40px}
.card{max-width:760px;margin:auto;background:#fff;border:1px solid #e4e8f0;border-radius:18px;padding:28px;box-shadow:0 16px 50px rgba(30,50,90,.08)}
h1{margin:0 0 8px;font-size:28px}.ok{display:inline-block;padding:6px 10px;border-radius:999px;background:#e8f8ef;color:#158a52;font-weight:700;font-size:12px}
p{color:#667085;line-height:1.6}.links{display:grid;gap:10px;margin-top:22px}.links a{display:block;padding:12px 14px;border:1px solid #e3e8f2;border-radius:12px;text-decoration:none;color:#3659e3;background:#fafbff}
.meta{margin-top:18px;padding:14px;border-radius:12px;background:#f7f9fc;font-size:13px}
</style></head><body><div class="card">
<span class="ok">API LIVE</span>
<h1>Punjab Test Generator AI API</h1>
<p>Backend for the Gemini-powered question bank generator.</p>
<div class="meta"><b>Model:</b> ${MODEL}<br><b>Gemini key configured:</b> ${API_KEY?'Yes':'No'}</div>
<div class="links">
<a href="/health">Health Check</a>
<a href="/stats">Question Bank Stats</a>
</div>
</div></body></html>`));

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