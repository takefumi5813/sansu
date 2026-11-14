'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const C=require('../src/core.js');
const one=require('../content/notion-reps-20261114-kt12.json'),cls=require('../content/notion-classification.json');
const raw=a=>a.n+'/'+a.d;
test('基礎力テスト12月号（KT12）：代表3問・正答とcheckpoint・図・Notionの細分類と難易度',()=>{
 assert.equal(one.problems.length,3);
 for(const p of one.problems){
  assert.match(p.id,/^KT12-\d\d\(\d\)$/);assert.deepEqual(p.scopeUnits,['KT12']);
  if(p.figureRequired)assert.ok(fs.existsSync(path.join(__dirname,'..','dist',p.figure)),p.id);
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);
  assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);
  const cps=p.explanation.steps.filter(s=>s.checkpoint);assert.ok(cps.length>=1,p.id);
  for(const c of cps)assert.ok(C.grade(raw(c.checkpoint.answer),c.checkpoint.answer).correct,p.id);
  assert.ok(one.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
  const row=cls.problems[p.source.url.slice(-32)];assert.ok(row,p.id);assert.equal(row.difficulty,p.difficulty,p.id);assert.equal(row.rep,true,p.id);
 }
});
test('KT12：子どもが書きそうな答えの形',()=>{
 const g=(id,ans)=>C.grade(ans,one.problems.find(x=>x.id===id).answer).correct;
 assert.equal(g('KT12-06(4)','5'),true);assert.equal(g('KT12-06(4)','5年'),true);assert.equal(g('KT12-06(4)','6'),false);
 assert.equal(g('KT12-01(8)','6'),true);assert.equal(g('KT12-01(8)','6m'),true);assert.equal(g('KT12-01(8)','4'),false);
 assert.equal(g('KT12-25(6)','64'),true);assert.equal(g('KT12-25(6)','64cm²'),true);assert.equal(g('KT12-25(6)','24'),false);
});
