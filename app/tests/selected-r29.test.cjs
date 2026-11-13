'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const C=require('../src/core.js');
const one=require('../content/selected-r29-oneline.json'),plan=require('../content/scope-plan.json'),cls=require('../content/notion-classification.json');
const rawOne=a=>a.terms?a.terms.join(':'):a.items?a.items.join('、'):a.n+'/'+a.d;
const raw=a=>a.parts?a.parts.map(rawOne):rawOne(a);
test('R29（相似形）：代表21問・1単位1問・図・正答とcheckpoint・Notion出典・Notion細分類の難易度',()=>{
 assert.equal(one.problems.length,21);assert.equal(new Set(one.units.map(u=>u.id)).size,21);
 for(const p of one.problems){
  assert.match(p.id,/^R29(H|N|T|K)/);assert.deepEqual(p.scopeUnits,['R29']);
  if(p.figureRequired)assert.ok(fs.existsSync(path.join(__dirname,'..','dist',p.figure)),p.id);
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);
  assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);
  const cps=p.explanation.steps.filter(s=>s.checkpoint);assert.ok(cps.length>=1,p.id);
  for(const c of cps)assert.ok(C.grade(raw(c.checkpoint.answer),c.checkpoint.answer).correct,p.id);
  assert.ok(p.explanation.steps.length>=4&&p.explanation.steps.length<=8);
  assert.ok(one.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
  const row=cls.problems[p.source.url.slice(-32)];assert.ok(row,p.id);assert.equal(row.difficulty,p.difficulty,p.id);assert.equal(row.rep,true,p.id);
 }
});
test('R29：子どもが書きそうな答えの形',()=>{
 const g=(id,ans)=>C.grade(ans,one.problems.find(x=>x.id===id).answer).correct;
 assert.equal(g('R29T⑤-1','5:3:2'),true);assert.equal(g('R29T⑤-1','3:2:1'),false);
 assert.equal(g('R29N④-4','3:7:11'),true);assert.equal(g('R29N④-4','1:2:3'),false);
 assert.equal(g('R29T⑤-2','2と1/7'),true);assert.equal(g('R29T⑤-2','15/7cm'),true);
 assert.equal(g('R29H④-4','7/24'),true);
 assert.equal(g('R29T⑤-3',['32','7と1/9']),true);assert.equal(g('R29T⑤-3',['48','7と1/9']),false);
 assert.equal(g('R29T⑥-2',['⑩、⑪、⑫','7']),true);assert.equal(g('R29T⑥-2',['⑫、⑪、⑩','7回']),true);assert.equal(g('R29T⑥-2',['⑨、⑩、⑪、⑫','7']),false);
 assert.equal(g('R29H①-2',['190','2000','9.5']),true);assert.equal(g('R29H①-2',['19000cm','20a','9.5']),true);
 assert.equal(g('R29H⑦-1',['32','1/50000','5','45']),true);assert.equal(g('R29H⑦-2',['2500','120','288','1/50000']),true);
 assert.equal(g('R29H①-1',['2.5','30','10','70°','100']),true);
});
test('出題範囲：直近R29、次回グノレブ（12/11、No.28〜31）は既習のR28・R29',()=>{
 assert.equal(plan.recentLesson.unit,'R29');assert.deepEqual(plan.nextAssessment.activeLearnedUnits,['R28','R29']);
});
