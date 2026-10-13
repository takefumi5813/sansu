'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../src/core.js');
const hold=require('../content/expedition-hold-integration.json');
const all=require('../content/combined.json');
// This fixture comes from the earlier PDF audit, not from the generated app data.
const audit=require('./fixtures/hold-source-audit.json');
const byId=new Map(hold.problems.map(p=>[p.id,p]));
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const pageId=url=>url.match(/[0-9a-f]{32}/i)?.[0];
const raw=a=>a.parts?a.parts.map(raw):a.dimension==='ratio'?a.terms.join(':'):a.dimension==='clock'?`${a.h}時${a.m}分${Number(a.s)?a.s+'秒':''}`:`${a.n}/${a.d}`;
const wrong=a=>a.parts?a.parts.map((p,i)=>i===a.parts.length-1?wrong(p):raw(p)):a.dimension==='clock'?`${(Number(a.h)+1)%24}時${a.m}分`:a.dimension==='ratio'?a.terms.map((n,i)=>String(Number(n)+(i===0?1:0))).join(':'):`${BigInt(a.n)+BigInt(a.d)}/${a.d}`;

test('hold publication preserves independent source-audit identity and verbatim evidence',()=>{
 assert.equal(byId.size,52,'exactly the 52 reviewed problems, without duplicate IDs');
 assert.deepEqual([...byId.keys()].sort(),audit.approved.map(x=>x.id).sort());
 for(const a of audit.approved){
  const p=byId.get(a.id),s=p.source;
  assert(['A1','A2','A3'].includes(s.handoffGroup),p.id);
  assert.equal(s.handoffGroup,a.group,p.id);
  assert.equal(pageId(s.url),pageId(a.notionUrl),p.id);
  assert(/^https:\/\/(app\.)?notion\.(com|so)\//.test(s.url),p.id);
  assert.equal(s.originalProblemId,a.id,p.id);
  for(const key of ['problemSource','answerSource']){
   assert(s[key]?.file.startsWith('/算数DB/原本/'),`${p.id}: ${key}`);
   assert(Number.isInteger(s[key].page)&&s[key].page>0,`${p.id}: ${key} page`);
  }
  if(a.sourceTextSha256)assert.equal(digest(s.sourceText),a.sourceTextSha256,`${p.id}: source text was changed`);
  if(a.officialAnswer)assert.equal(s.sourceAnswer,a.officialAnswer,`${p.id}: printed answer evidence`);
  assert.equal(all.problems.filter(x=>x.id===p.id).length,1,p.id);
 }
});

test('question selection can remove subquestions but cannot paraphrase retained source lines',()=>{
 for(const p of hold.problems){
  const source=p.source.sourceText.split('\n'),shown=p.text.split('\n');
  let cursor=0;
  for(const line of shown){
   const next=source.indexOf(line,cursor);
   assert(next>=cursor,`${p.id}: retained line is not verbatim: ${line}`);
   for(const removed of source.slice(cursor,next))assert(/^\([1-9]\)/.test(removed),`${p.id}: common condition was removed`);
   cursor=next+1;
  }
  for(const removed of source.slice(cursor))assert(/^\([1-9]\)/.test(removed),`${p.id}: common condition was removed`);
  assert(!/\ball$/.test(p.source.title),`${p.id}: internal selection marker in title`);
 }
});

test('required original figures are real PNGs and are shipped unchanged in the built app',()=>{
 for(const p of hold.problems){
  if(!p.figureRequired)continue;
  assert(/^figs\/[^.][^\n]*\.png$/.test(p.figure)&&!p.figure.includes('..'),p.id);
  const original=fs.readFileSync(path.resolve(__dirname,'../..',p.figure));
  const built=fs.readFileSync(path.resolve(__dirname,'../dist',p.figure));
  assert.deepEqual([...original.subarray(0,8)],[137,80,78,71,13,10,26,10],p.id);
  assert(original.readUInt32BE(16)>=100&&original.readUInt32BE(20)>=70,`${p.id}: figure is a tiny or blank placeholder`);
  assert.equal(digest(built),digest(original),`${p.id}: built figure differs`);
 }
});

test('all 52 answers and numerical checkpoints work through the existing grading engine',()=>{
 for(const p of hold.problems){
  assert.equal(C.grade(raw(p.answer),p.answer).correct,true,p.id);
  assert.equal(C.grade(wrong(p.answer),p.answer).correct,false,`${p.id}: changed answer accepted`);
  if(p.answer.parts){
   assert(p.answer.parts.every(a=>a.label&&!a.parts),p.id);
   assert.equal(C.grade(raw(p.answer).slice(1),p.answer).valid,false,`${p.id}: missing answer part`);
  }
  assert(p.explanation.steps.length>=4&&p.explanation.steps.length<=8,p.id);
  assert(p.explanation.steps.every(s=>s.title&&s.body),p.id);
  const checkpoints=p.explanation.steps.filter(s=>s.checkpoint).map(s=>s.checkpoint);
  assert(checkpoints.length,p.id);
  for(const cp of checkpoints){
   assert(cp.prompt&&cp.answer.n!=null&&cp.answer.d!=null&&!cp.answer.parts,p.id);
   assert.equal(C.grade(raw(cp.answer),cp.answer).correct,true,`${p.id}: checkpoint`);
   assert.equal(C.grade(wrong(cp.answer),cp.answer).correct,false,`${p.id}: changed checkpoint accepted`);
  }
 }
});

test('printed-answer examples retain usable clock, speed, and ordered multipart input',()=>{
 // Literal answers below were read from the original printed answer pages.
 const examples=[
  ['selected-a719b12c9c308973','12'],
  ['selected-a0207c6635c2066e',['7','9031']],
  ['selected-e4307b148c6fc638',['時速1.5km','時速9.5km']],
  ['selected-e385fefc2b3bf7bc','2時24分'],
  ['selected-7ae7ac309898b28f',['6','10']],
  ['selected-e1439dc19fbba560',['23','98']],
  ['selected-81ca2d669bf765f3',['15','255']],
  ['selected-69e7ae665534e32d',['午前7時35分','2分']],
  ['selected-b8a477725c303e56',['秒速16m','80m']],
  ['selected-2f419f892cc5a183',['100m','245m']]
 ];
 for(const [id,input] of examples)assert.equal(C.grade(input,byId.get(id).answer).correct,true,id);
 assert.equal(C.grade(['10','6'],byId.get('selected-7ae7ac309898b28f').answer).correct,false,'rank endpoints must not be interchanged');
 assert.equal(C.grade('2時間24分',byId.get('selected-e385fefc2b3bf7bc').answer).valid,false,'clock time must not be treated as elapsed duration');
});

test('unconfirmed answers, nonnumeric A4, mismatched A5 and entrance exams are not published',()=>{
 const allIds=new Set(all.problems.map(p=>p.id));
 for(const id of [...audit.excludedIds,'春04K-7','春04K-25','春04K-26','春04K-28','R21K-58'])assert(!allIds.has(id),id);
 for(const p of hold.problems){
  assert(!/入試|栄冠|学校別/.test(p.source.title+' '+p.source.problemSource.file),p.id);
  assert.equal(p.expeditionOnly,true,p.id);
  assert.equal(p.homeStudy,false,p.id);
  assert.equal(p.reviewEligible,false,p.id);
 }
});
