'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../src/core.js');
const one=require('../content/selected-r25-oneline.json'),calc=require('../content/selected-calc-r25.json');
const raw=a=>a.parts?a.parts.map(p=>p.n+'/'+p.d):a.n+'/'+a.d;
test('R25一行問題：13単位・代表1問・正答とcheckpoint・Notion出典',()=>{
 assert.equal(one.problems.length,13);assert.equal(new Set(one.units.map(u=>u.id)).size,13);
 for(const p of one.problems){
  assert.match(p.id,/^R25H[①-⑦]-\d$/);assert.deepEqual(p.scopeUnits,['R25']);assert.equal(p.homeStudy,true);
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);assert.equal(p.text,p.source.notionSourceText);
  assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);
  const cps=p.explanation.steps.filter(s=>s.checkpoint);assert.equal(cps.length,1,p.id);
  assert.ok(C.grade(raw(cps[0].checkpoint.answer),cps[0].checkpoint.answer).correct,p.id);
  assert.ok(p.explanation.steps.length>=4&&p.explanation.steps.length<=8);
  assert.ok(one.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
 }
 for(const l of one.links){assert.ok(one.units.some(u=>u.id===l.from));assert.ok(one.units.some(u=>u.id===l.to));}
});
test('R25計算：原式の答えがcalcScore/calcInverseと一致',()=>{
 assert.ok(calc.problems.length>=20);
 for(const p of calc.problems){
  const s=p.expression.includes('□')?C.calcInverse(p.expression):C.calcScore(p.expression);
  assert.ok(s.supported,p.id);assert.ok(C.grade(s.answer.n+'/'+s.answer.d,p.answer).correct,p.id);
  assert.deepEqual(p.scopeUnits,['R25']);assert.ok(p.explanation.steps.some(x=>x.checkpoint));
 }
});
