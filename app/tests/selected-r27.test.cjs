'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../src/core.js');
const one=require('../content/selected-r27-oneline.json'),calc=require('../content/selected-calc-r27.json'),plan=require('../content/scope-plan.json'),cls=require('../content/notion-classification.json');
const rawOne=a=>a.terms?a.terms.join(':'):a.n+'/'+a.d;
const raw=a=>a.parts?a.parts.map(rawOne):rawOne(a);
test('R27一行問題：15単位・代表1問・正答とcheckpoint・Notion出典・Notion細分類の難易度',()=>{
 assert.equal(one.problems.length,15);assert.equal(new Set(one.units.map(u=>u.id)).size,15);
 for(const p of one.problems){
  assert.match(p.id,/^R27H[①-⑦]-\d$/);assert.deepEqual(p.scopeUnits,['R27']);assert.equal(p.homeStudy,true);assert.equal(p.figureRequired,false);
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);assert.equal(p.text,p.source.notionSourceText);
  assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);
  const cps=p.explanation.steps.filter(s=>s.checkpoint);assert.equal(cps.length,1,p.id);
  assert.ok(C.grade(raw(cps[0].checkpoint.answer),cps[0].checkpoint.answer).correct,p.id);
  assert.ok(p.explanation.steps.length>=4&&p.explanation.steps.length<=8);
  assert.ok(one.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
  const row=cls.problems[p.source.url.slice(-32)];assert.ok(row,p.id);assert.equal(row.difficulty,p.difficulty,p.id);assert.equal(row.rep,true,p.id);
  assert.equal(cls.subdivisions[row.sub].chu,'ニュートン算',p.id);
 }
 for(const l of one.links){assert.ok(one.units.some(u=>u.id===l.from));assert.ok(one.units.some(u=>u.id===l.to));}
});
test('R27一行問題：まちがった答えは不正解',()=>{
 const p=one.problems.find(x=>x.id==='R27H②-1');assert.equal(C.grade(['6','9','15'],p.answer).correct,false);assert.equal(C.grade(['6','9','14'],p.answer).correct,true);
 const q=one.problems.find(x=>x.id==='R27H⑦-3');assert.equal(C.grade('1.6',q.answer).correct,true);assert.equal(C.grade('1.4',q.answer).correct,false);
});
test('R27計算：原式の答えがcalcScore/calcInverseと一致',()=>{
 assert.equal(calc.problems.length,24);
 for(const p of calc.problems){
  const s=p.expression.includes('□')?C.calcInverse(p.expression):C.calcScore(p.expression);
  assert.ok(s.supported,p.id);assert.ok(C.grade(s.answer.n+'/'+s.answer.d,p.answer).correct,p.id);
  assert.deepEqual(p.scopeUnits,['R27']);assert.ok(p.explanation.steps.some(x=>x.checkpoint));
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);
 }
});
test('出題範囲：直近R27、次回グノレブはR24〜R27',()=>{
 assert.equal(plan.recentLesson.unit,'R27');assert.deepEqual(plan.nextAssessment.activeLearnedUnits,['R24','R25','R26','R27']);assert.deepEqual(plan.nextAssessment.excludedUnlearnedUnits,[]);
});
