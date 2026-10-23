'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../src/core.js');
const one=require('../content/selected-r26-oneline.json'),calc=require('../content/selected-calc-r26.json'),plan=require('../content/scope-plan.json');
const rawOne=a=>a.terms?a.terms.join(':'):a.n+'/'+a.d;
const raw=a=>a.parts?a.parts.map(rawOne):rawOne(a);
test('R26一行問題：18単位・代表1問・正答とcheckpoint・Notion出典・Notion難易度',()=>{
 assert.equal(one.problems.length,18);assert.equal(new Set(one.units.map(u=>u.id)).size,18);
 for(const p of one.problems){
  assert.match(p.id,/^R26H[①-⑦]-\d$/);assert.deepEqual(p.scopeUnits,['R26']);assert.equal(p.homeStudy,true);assert.equal(p.figureRequired,false);
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);assert.equal(p.text,p.source.notionSourceText);
  assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);
  const cps=p.explanation.steps.filter(s=>s.checkpoint);assert.equal(cps.length,1,p.id);
  assert.ok(C.grade(raw(cps[0].checkpoint.answer),cps[0].checkpoint.answer).correct,p.id);
  assert.ok(p.explanation.steps.length>=4&&p.explanation.steps.length<=8);
  assert.ok(one.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
  const t=p.source.notionTypes;assert.ok(t.length>=1);assert.ok(p.difficulty>=Math.max(...t.map(x=>x.baseDifficulty)),p.id);
 }
 for(const l of one.links){assert.ok(one.units.some(u=>u.id===l.from));assert.ok(one.units.some(u=>u.id===l.to));}
});
test('R26一行問題：まちがった答えは不正解',()=>{
 const p=one.problems.find(x=>x.id==='R26H②-4');assert.equal(C.grade('167',p.answer).correct,false);assert.equal(C.grade('168',p.answer).correct,true);
 const r=one.problems.find(x=>x.id==='R26H①-2');assert.equal(C.grade(['30:28','45','42'],r.answer).correct,false);assert.equal(C.grade(['15:14','45','42'],r.answer).correct,true);
});
test('R26計算：原式の答えがcalcScore/calcInverseと一致',()=>{
 assert.equal(calc.problems.length,32);
 for(const p of calc.problems){
  const s=p.expression.includes('□')?C.calcInverse(p.expression):C.calcScore(p.expression);
  assert.ok(s.supported,p.id);assert.ok(C.grade(s.answer.n+'/'+s.answer.d,p.answer).correct,p.id);
  assert.deepEqual(p.scopeUnits,['R26']);assert.ok(p.explanation.steps.some(x=>x.checkpoint));
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);
 }
});
test('出題範囲：直近R26、次回グノレブはR24・R25・R26',()=>{
 assert.equal(plan.recentLesson.unit,'R26');assert.deepEqual(plan.nextAssessment.activeLearnedUnits,['R24','R25','R26']);assert.deepEqual(plan.nextAssessment.excludedUnlearnedUnits,['R27']);
});
