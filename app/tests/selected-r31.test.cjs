'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const C=require('../src/core.js');
const one=require('../content/selected-r31-oneline.json'),plan=require('../content/scope-plan.json'),cls=require('../content/notion-classification.json');
const rawOne=a=>a.terms?a.terms.join(':'):a.items?a.items.join('、'):a.n+'/'+a.d;
const raw=a=>a.parts?a.parts.map(rawOne):rawOne(a);
test('R31（図形の移動）：代表10問・1単位1問・図・正答とcheckpoint・Notion出典・Notion細分類の難易度',()=>{
 assert.equal(one.problems.length,10);assert.equal(new Set(one.units.map(u=>u.id)).size,10);
 for(const p of one.problems){
  assert.match(p.id,/^R31(H|N)/);assert.deepEqual(p.scopeUnits,['R31']);
  assert.ok(p.figureRequired&&fs.existsSync(path.join(__dirname,'..','dist',p.figure)),p.id);
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);
  assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);
  const cps=p.explanation.steps.filter(s=>s.checkpoint);assert.ok(cps.length>=1,p.id);
  for(const c of cps)assert.ok(C.grade(raw(c.checkpoint.answer),c.checkpoint.answer).correct,p.id);
  assert.ok(p.explanation.steps.length>=4&&p.explanation.steps.length<=8);
  assert.ok(one.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
  const row=cls.problems[p.source.url.slice(-32)];assert.ok(row,p.id);assert.equal(row.difficulty,p.difficulty,p.id);assert.equal(row.rep,true,p.id);
  assert.ok(!/\(1\)\(2\)/.test(p.text),p.id);
 }
});
test('R31：子どもが書きそうな答えの形',()=>{
 const g=(id,ans)=>C.grade(ans,one.problems.find(x=>x.id===id).answer).correct;
 assert.equal(g('R31H①-1','25'),true);assert.equal(g('R31H①-1','25cm²'),true);assert.equal(g('R31H①-1','50'),false);
 assert.equal(g('R31H②-2',['6','8.5','3.5','11']),true);assert.equal(g('R31H②-2',['6秒後','8と1/2秒後','3.5秒','11']),true);assert.equal(g('R31H②-2',['6','8.5','3','11']),false);
 assert.equal(g('R31H②-3','8'),true);assert.equal(g('R31H②-3','8秒後'),true);assert.equal(g('R31H②-3','6'),false);
 assert.equal(g('R31H③-1',['3','4','5','4','8','10.5']),true);assert.equal(g('R31H③-1',['3角形','4','5','4','8','10.5']),true);assert.equal(g('R31H③-1',['3','4','5','3','8','10.5']),false);
 assert.equal(g('R31H③-2',['13','4.5']),true);assert.equal(g('R31H③-3',['4','7']),true);assert.equal(g('R31H③-3',['7','4']),false);
 assert.equal(g('R31N④-3','9.42'),true);assert.equal(g('R31N④-3','9.42cm'),true);assert.equal(g('R31N④-3','9.4'),false);
 assert.equal(g('R31H⑤-2',['37.68','219.8']),true);assert.equal(g('R31H⑥-2',['58.28','516.48']),true);
 assert.equal(g('R31H⑦-3',['143.4','1143.76']),true);assert.equal(g('R31H⑦-3',['143.4','1147.2']),false);
});
test('出題範囲：直近R31、次回グノレブ（12/11、No.28〜31）は既習のR28〜R31',()=>{
 assert.equal(plan.recentLesson.unit,'R31');assert.deepEqual(plan.nextAssessment.activeLearnedUnits,['R28','R29','R30','R31']);
});
