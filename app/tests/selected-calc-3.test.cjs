const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),data=require('../content/selected-calc-3.json'),source=require('../references/calc-inverse-source.json'),existing=[require('../content/selected-calc.json'),require('../content/selected-calc-2.json')];
const P=data.problems;
test('158 inverse and bracket problems keep Notion source, answer and unit consistency',()=>{
 assert.equal(P.length,158);assert.equal(data.units.length,P.length);
 const old=new Set(existing.flatMap(x=>x.problems.map(p=>p.id)));
 const srcById=new Map(source.map(s=>[s.id,s]));
 for(const p of P){
  assert.ok(!old.has(p.id),'duplicate of an existing problem '+p.id);
  const s=srcById.get(p.id);assert.ok(s,p.id);
  assert.equal(p.source.url,s.notionUrl);assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);
  assert.equal(p.source.sourceAnswer,s.answerText);assert.equal(p.sourceText,s.localText);assert.equal(p.expression,s.ex);
  assert.equal(p.category,'calc');assert.ok(data.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
 }
 assert.equal(P.find(p=>p.id==='R21K-58'),undefined);
});
test('every expression is recomputed exactly and matches the stored answer, score and star',()=>{
 for(const p of P){
  const r=p.expression.includes('□')?C.calcInverse(p.expression):C.calcScore(p.expression);
  assert.equal(r.supported,true,p.id);assert.deepEqual(r.answer,{n:p.answer.n,d:p.answer.d},p.id);assert.equal(r.score,p.score,p.id);assert.equal(r.star,p.star,p.id);
  assert.equal(C.grade(p.answer.n+'/'+p.answer.d,p.answer).correct,true,p.id);
 }
});
test('inverse problems really contain □ and the hard tier has bracket + fraction + several operations',()=>{
 const tiers={basic:0,standard:0,advanced:0,hard:0};
 for(const p of P)tiers[C.calcTier(p)]++;
 assert.deepEqual(tiers,{basic:14,standard:65,advanced:62,hard:17});
 const hard=P.filter(p=>C.calcTier(p)==='hard');
 for(const p of hard){const sh=C.calcShape(p);assert.ok(sh.par&&sh.fracN>=1&&sh.ops>=4,p.id);}
 assert.ok(hard.filter(p=>p.expression.includes('□')).length>=12);
 assert.ok(P.filter(p=>p.expression.includes('□')).length>=130);
});
test('explanations have 4-8 steps, a checkpoint, and every □ step equation is satisfied by the answer',()=>{
 for(const p of P){
  const steps=p.explanation.steps;assert.ok(steps.length>=4&&steps.length<=8,p.id);
  assert.ok(steps.some(s=>s.checkpoint),p.id);assert.deepEqual(steps.map(s=>s.id),steps.map((_,i)=>'step-'+(i+1)));
  for(const s of steps){
   assert.ok(s.title&&s.body&&s.equation,p.id);
   if(s.checkpoint)assert.equal(C.grade(s.checkpoint.answer.n+'/'+s.checkpoint.answer.d,s.checkpoint.answer).correct,true,p.id);
   if(s.equation.includes('□')&&!s.equation.includes('と')){const r=C.calcInverse(s.equation.replace(/＝/g,'='));assert.equal(r.supported,true,p.id+' '+s.equation);assert.deepEqual(r.answer,{n:p.answer.n,d:p.answer.d},p.id+' '+s.equation);}
  }
  assert.ok(!/NaN|undefined|\[object/.test(JSON.stringify(steps)),p.id);
 }
});
