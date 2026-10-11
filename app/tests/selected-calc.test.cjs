'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),selected=require('../content/selected-calc.json'),evidence=require('../references/r24-calc-notion-evidence.json');
const pages=new Map(evidence.pages.map(p=>[p.id,p]));
for(const p of selected.problems)test(p.id+' Notion原文・厳密採点・途中確認',()=>{
  const original=pages.get(p.id);assert(original);assert.equal(p.text,original.problemText);assert.equal(p.sourceText,original.problemText);assert.equal(p.source.sourceText,original.problemText);assert.equal(p.source.url,original.url);
  assert.equal(p.source.notionProperties['区分'],'計算マスター');assert.equal(p.homeStudy,false);assert(p.scopeUnits.every(s=>!['R25','R26','R27'].includes(s)));
  const result=C.calcScore(p.expression);assert.equal(result.supported,true);assert.deepEqual(result.answer,{n:p.answer.n,d:p.answer.d});assert.equal(result.score,p.score);assert.equal(result.star,p.star);
  assert.equal(C.grade(original.answerText,p.answer).correct,true);assert.equal(C.grade(p.answer.n+'/'+p.answer.d,p.answer).correct,true);
  assert.equal(C.grade((BigInt(p.answer.n)+BigInt(p.answer.d))+'/'+p.answer.d,p.answer).correct,false);assert.equal(C.grade('1/0',p.answer).valid,false);
  assert(p.explanation.steps.length>=4&&p.explanation.steps.length<=8);const cp=p.explanation.steps.filter(s=>s.checkpoint);assert(cp.length>0);
  for(const s of cp){const a=s.checkpoint.answer;assert.equal(C.grade(a.n+'/'+a.d,a).correct,true);assert.equal(C.grade((BigInt(a.n)+BigInt(a.d))+'/'+a.d,a).correct,false);assert(s.checkpoint.prompt.length>5);}
});
for(const v of selected.existingVerification)test(v.id+' 既存計算のNotion再照合',()=>{
  const p=require('../content/arithmetic.json').problems.find(p=>p.id===v.id),source=pages.get(v.id);assert(p&&source);assert.equal(v.normalizedExpressionMatch,true);assert.equal(v.answerMatch,true);assert.equal(C.grade(source.answerText,p.answer).correct,true);assert.equal(v.notionText,source.problemText);assert.equal(v.url,source.url);
});
test('追加22問・各帯5以上・17R24と5補充・出典とID重複なし',()=>{
 assert.equal(selected.problems.length,22);assert.equal(selected.problems.filter(p=>p.scopeUnits.includes('R24')).length,17);assert.equal(selected.problems.filter(p=>!p.scopeUnits.includes('R24')).length,5);
 for(const star of [1,2,3])assert(selected.problems.filter(p=>p.star===star).length>=5);
 assert.equal(new Set(selected.problems.map(p=>p.id)).size,22);assert.equal(new Set(selected.problems.map(p=>p.unitId)).size,22);
 for(const p of selected.problems)assert(selected.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
 assert.equal(evidence.rows.filter(p=>p['問題'].startsWith('R24K-')).length,50);assert.equal(evidence.pages.filter(p=>p.id.startsWith('R24K-')).length,50);
});
test('逆算等の未対応設問を勝手に数値計算へ改題しない',()=>{
 const ids=new Set(selected.problems.map(p=>p.id));for(const n of [2,3,5,6,8,13,15,16,17,18,19,20,21,22,23,24,27,28,30,31,33,38,40,41,42,43,44,45,46,47,48,49,50])assert(!ids.has('R24K-'+n));
});
