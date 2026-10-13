const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),data=require('../content/selected-calc-4.json'),source=require('../references/calc-exam-source.json'),all=require('../content/combined.json');
const existing=[require('../content/selected-calc.json'),require('../content/selected-calc-2.json'),require('../content/selected-calc-3.json'),require('../content/arithmetic.json')];
const P=data.problems;
test('51 exam/hard calculation problems keep source, answer and unit consistency',()=>{
 assert.equal(P.length,51);assert.equal(source.length,51);assert.equal(data.units.length,P.length);
 const old=new Set(existing.flatMap(x=>x.problems.map(p=>p.id)));
 const srcById=new Map(source.map(s=>[s.id,s]));
 for(const p of P){
  assert.ok(!old.has(p.id),'duplicate of an existing problem '+p.id);
  const s=srcById.get(p.id);assert.ok(s,p.id);
  assert.equal(p.source.sourceAnswer,s.answerText);assert.equal(p.sourceText,s.localText);assert.equal(p.expression,s.ex);assert.equal(p.source.sourceText,s.verbatim);
  assert.equal(p.category,'calc');assert.ok(data.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
  if(p.id==='R21K-57'){assert.equal(p.source.url,'https://app.notion.com/p/3f62b010743c814b86c3f1c0cd37b91c');assert.equal(p.source.sourceAnswer,'84');}
  else{assert.equal(p.source.url,'');assert.match(p.source.path,/^\/算数DB\/原本\//);assert.ok(Number.isInteger(s.pdfPage)&&s.pdfPage>=1,p.id);assert.ok(s.school&&s.number,p.id);}
 }
 assert.ok(P.some(p=>p.id==='gb08-2025-1-1'&&p.source.title.includes('桜蔭')));
 assert.ok(P.some(p=>p.id==='gb31-2026-1'&&p.source.title.includes('灘')));
 assert.equal(P.find(p=>p.id==='R21K-58'),undefined);
});
test('every expression is recomputed exactly and matches the stored answer, score and star',()=>{
 for(const p of P){
  const r=p.expression.includes('□')?C.calcInverse(p.expression):C.calcScore(p.expression);
  assert.equal(r.supported,true,p.id);assert.deepEqual(r.answer,{n:p.answer.n,d:p.answer.d},p.id);assert.equal(r.score,p.score,p.id);assert.equal(r.star,p.star,p.id);
  assert.equal(C.grade(p.answer.n+'/'+p.answer.d,p.answer).correct,true,p.id);
 }
});
test('the two specified exam problems have the answers that the exact solver gives',()=>{
 const a=P.find(p=>p.id==='gb08-2025-1-1'),b=P.find(p=>p.id==='gb31-2026-1');
 assert.deepEqual(C.calcInverse('(15/7+0.6)*□+85/13-19/91=9').answer,{n:'405',d:'416'});assert.deepEqual(a.answer,{n:'405',d:'416',unit:'',dimension:'scalar'});
 assert.deepEqual(C.calcInverse('(36.25-2026/707÷□)*84=7/4÷(1/6+1/8)').answer,{n:'8',d:'101'});assert.deepEqual(b.answer,{n:'8',d:'101',unit:'',dimension:'scalar'});
});
test('50 problems are hard tier with bracket + fraction + several operations; R21K-57 is advanced',()=>{
 const tiers={basic:0,standard:0,advanced:0,hard:0};
 for(const p of P)tiers[C.calcTier(p)]++;
 assert.deepEqual(tiers,{basic:0,standard:0,advanced:1,hard:50});
 for(const p of P.filter(p=>C.calcTier(p)==='hard')){const sh=C.calcShape(p);assert.ok(sh.par&&sh.fracN>=1&&sh.ops>=4,p.id);}
 assert.equal(C.calcTier(P.find(p=>p.id==='R21K-57')),'advanced');
});
test('explanations have 4-8 steps, a checkpoint, and every □ step equation is satisfied by the answer',()=>{
 for(const p of P){
  const steps=p.explanation.steps;assert.ok(steps.length>=4&&steps.length<=8,p.id);
  assert.ok(steps.some(s=>s.checkpoint),p.id);assert.deepEqual(steps.map(s=>s.id),steps.map((_,i)=>'step-'+(i+1)));
  for(const s of steps){
   assert.ok(s.title&&s.body&&s.equation,p.id);
   if(s.checkpoint)assert.equal(C.grade(s.checkpoint.answer.n+'/'+s.checkpoint.answer.d,s.checkpoint.answer).correct,true,p.id);
  }
  assert.ok(!/NaN|undefined|\[object/.test(JSON.stringify(steps)),p.id);
 }
});
test('the build includes the new problems and they are served as calc hard problems',()=>{
 const ids=new Set(all.problems.map(p=>p.id));
 for(const p of P)assert.ok(ids.has(p.id),p.id);
 const hardCalc=all.problems.filter(p=>p.category==='calc'&&C.calcTier(p)==='hard');
 const fresh=new Set(P.map(p=>p.id));assert.equal(hardCalc.filter(p=>!fresh.has(p.id)).length,18);assert.equal(hardCalc.filter(p=>fresh.has(p.id)).length,50);
});
