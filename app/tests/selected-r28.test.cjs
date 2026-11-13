'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const C=require('../src/core.js');
const one=require('../content/selected-r28-oneline.json'),calc=require('../content/selected-calc-r28.json'),plan=require('../content/scope-plan.json'),cls=require('../content/notion-classification.json');
const rawOne=a=>a.terms?a.terms.join(':'):a.n+'/'+a.d;
const raw=a=>a.parts?a.parts.map(rawOne):rawOne(a);
test('R28図形（面積比）：13単位・代表1問・図・正答とcheckpoint・Notion出典・Notion細分類の難易度',()=>{
 assert.equal(one.problems.length,13);assert.equal(new Set(one.units.map(u=>u.id)).size,13);
 for(const p of one.problems){
  assert.match(p.id,/^R28H[①-⑦]-\d$/);assert.deepEqual(p.scopeUnits,['R28']);assert.equal(p.homeStudy,true);
  assert.equal(p.figureRequired,true);assert.ok(fs.existsSync(path.join(__dirname,'..','dist',p.figure)),p.id);
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);assert.equal(p.text,p.source.notionSourceText);
  assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);
  const cps=p.explanation.steps.filter(s=>s.checkpoint);assert.ok(cps.length>=1,p.id);
  for(const c of cps)assert.ok(C.grade(raw(c.checkpoint.answer),c.checkpoint.answer).correct,p.id);
  assert.ok(p.explanation.steps.length>=4&&p.explanation.steps.length<=8);
  assert.ok(one.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
  const row=cls.problems[p.source.url.slice(-32)];assert.ok(row,p.id);assert.equal(row.difficulty,p.difficulty,p.id);assert.equal(row.rep,true,p.id);
  assert.equal(cls.subdivisions[row.sub].chu,'相似・辺の比・面積比',p.id);
 }
 for(const l of one.links){assert.ok(one.units.some(u=>u.id===l.from));assert.ok(one.units.some(u=>u.id===l.to));}
});
test('R28図形：まちがった答えは不正解',()=>{
 const p=one.problems.find(x=>x.id==='R28H⑤-2');assert.equal(C.grade('24',p.answer).correct,true);assert.equal(C.grade('25',p.answer).correct,false);
 const q=one.problems.find(x=>x.id==='R28H⑥-4');assert.equal(C.grade('7:25',q.answer).correct,true);assert.equal(C.grade('25:7',q.answer).correct,false);
});
test('R28計算：原式の答えがcalcScore/calcInverseと一致',()=>{
 assert.equal(calc.problems.length,29);
 for(const p of calc.problems){
  const s=p.expression.includes('□')?C.calcInverse(p.expression):C.calcScore(p.expression);
  assert.ok(s.supported,p.id);assert.ok(C.grade(s.answer.n+'/'+s.answer.d,p.answer).correct,p.id);
  assert.deepEqual(p.scopeUnits,['R28']);assert.ok(p.explanation.steps.some(x=>x.checkpoint));
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);
 }
});
test('出題範囲：R28は次回グノレブ（12/11、No.28〜31）の範囲に入る',()=>{
 assert.ok(plan.nextAssessment.activeLearnedUnits.includes('R28'));
});
