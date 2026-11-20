'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const C=require('../src/core.js');
const one=require('../content/selected-r30-oneline.json'),plan=require('../content/scope-plan.json'),cls=require('../content/notion-classification.json');
const rawOne=a=>a.terms?a.terms.join(':'):a.items?a.items.join('、'):a.n+'/'+a.d;
const raw=a=>a.parts?a.parts.map(rawOne):rawOne(a);
test('R30（かげ・折り返し）：代表23問・1単位1問・図・正答とcheckpoint・Notion出典・Notion細分類の難易度',()=>{
 assert.equal(one.problems.length,23);assert.equal(new Set(one.units.map(u=>u.id)).size,23);
 for(const p of one.problems){
  assert.match(p.id,/^R30(H|N|T|K)/);assert.deepEqual(p.scopeUnits,['R30']);
  if(p.figureRequired)assert.ok(fs.existsSync(path.join(__dirname,'..','dist',p.figure)),p.id);
  else assert.ok(['R30K-23','R30K-25','R30H⑥-2'].includes(p.id),p.id);
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);
  assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);
  const cps=p.explanation.steps.filter(s=>s.checkpoint);assert.ok(cps.length>=1,p.id);
  for(const c of cps)assert.ok(C.grade(raw(c.checkpoint.answer),c.checkpoint.answer).correct,p.id);
  assert.ok(p.explanation.steps.length>=4&&p.explanation.steps.length<=8);
  assert.ok(one.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
  const row=cls.problems[p.source.url.slice(-32)];assert.ok(row,p.id);assert.equal(row.difficulty,p.difficulty,p.id);assert.equal(row.rep,true,p.id);
 }
 assert.deepEqual(one.problems.filter(p=>p.category==='oneline').map(p=>p.id).sort(),['R30K-23','R30K-25']);
});
test('R30：子どもが書きそうな答えの形',()=>{
 const g=(id,ans)=>C.grade(ans,one.problems.find(x=>x.id===id).answer).correct;
 assert.equal(g('R30H①-1','3'),true);assert.equal(g('R30H①-1','3m'),true);assert.equal(g('R30H①-1','300cm'),true);assert.equal(g('R30H①-1','5'),false);
 assert.equal(g('R30H①-2','2.4'),true);assert.equal(g('R30H①-2','2と2/5m'),true);
 assert.equal(g('R30T⑤-1','3:10'),true);assert.equal(g('R30T⑤-1','3：10'),true);assert.equal(g('R30T⑤-1','3:8'),false);
 assert.equal(g('R30H③-3','25.35'),true);assert.equal(g('R30H③-3','25.35cm²'),true);assert.equal(g('R30H③-3','25と7/20'),true);assert.equal(g('R30H③-3','50.7'),false);
 assert.equal(g('R30H③-1','127.5'),true);assert.equal(g('R30H③-1','255'),false);
 assert.equal(g('R30H②-2',['7','11.8']),true);assert.equal(g('R30H②-2',['7m','16.8']),false);
 assert.equal(g('R30H④-3',['2187.5','4116']),true);
 assert.equal(g('R30H⑥-2',['0.8','10.2']),true);assert.equal(g('R30H⑥-2',['秒速0.8m','10.2m']),true);assert.equal(g('R30H⑥-2',['0.8m/秒','1020cm']),true);assert.equal(g('R30H⑥-2',['0.9','10.2']),false);
 assert.equal(g('R30H⑥-3',['176','72','104']),true);assert.equal(g('R30H⑥-3',['176cm','72cm','104cm']),true);assert.equal(g('R30H⑥-3',['176','104','72']),false);
 assert.equal(g('R30H⑦-2',['12','40','25/41']),true);assert.equal(g('R30H⑦-2',['12','40','25/41倍']),true);assert.equal(g('R30H⑦-2',['12','40','41/25']),false);
 assert.equal(g('R30T⑤-3',['3:7','78']),true);assert.equal(g('R30T⑤-3',['1:3','78']),false);
 assert.equal(g('R30K-23','9'),true);assert.equal(g('R30K-25','299'),true);assert.equal(g('R30K-25','300'),false);
});
test('出題範囲：直近R30、次回グノレブ（12/11、No.28〜31）は既習のR28・R29・R30',()=>{
 assert.equal(plan.recentLesson.unit,'R30');assert.deepEqual(plan.nextAssessment.activeLearnedUnits,['R28','R29','R30']);
});
