'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const C=require('../src/core.js');
const one=require('../content/notion-reps-20261114-gn.json'),cls=require('../content/notion-classification.json');
const rawOne=a=>a.terms?a.terms.join(':'):a.items?a.items.join('、'):a.n+'/'+a.d;
const raw=a=>a.parts?a.parts.map(rawOne):rawOne(a);
test('基本の制覇 相当算・仕事算・倍数算（GN相仕倍）：代表23問・正答とcheckpoint・図・Notionの細分類と難易度',()=>{
 assert.equal(one.problems.length,23);assert.equal(new Set(one.units.map(u=>u.id)).size,23);
 for(const p of one.problems){
  assert.match(p.id,/^GN相仕倍[①②③]/);assert.deepEqual(p.scopeUnits,['GN相仕倍']);
  if(p.figureRequired)assert.ok(fs.existsSync(path.join(__dirname,'..','dist',p.figure)),p.id);
  assert.match(p.source.url,/^https:\/\/app\.notion\.com\/[0-9a-f]{32}$/);
  assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);
  const cps=p.explanation.steps.filter(s=>s.checkpoint);assert.ok(cps.length>=1,p.id);
  for(const c of cps)assert.ok(C.grade(raw(c.checkpoint.answer),c.checkpoint.answer).correct,p.id);
  assert.ok(p.explanation.steps.length>=4&&p.explanation.steps.length<=8,p.id);
  assert.ok(one.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
  const row=cls.problems[p.source.url.slice(-32)];assert.ok(row,p.id);assert.equal(row.difficulty,p.difficulty,p.id);assert.equal(row.rep,true,p.id);
 }
});
test('GN相仕倍：子どもが書きそうな答えの形',()=>{
 const g=(id,ans)=>C.grade(ans,one.problems.find(x=>x.id===id).answer).correct;
 assert.equal(g('GN相仕倍①Ch-2(1)','1と1/15'),true);assert.equal(g('GN相仕倍①Ch-2(1)','16/15倍'),true);assert.equal(g('GN相仕倍①Ch-2(1)','1と1/16'),false);
 assert.equal(g('GN相仕倍①Ch-1(4)','43.2'),true);assert.equal(g('GN相仕倍①Ch-1(4)','43.2kg'),true);assert.equal(g('GN相仕倍①Ch-1(4)','216/5'),true);
 assert.equal(g('GN相仕倍③Ch-1(4)','2400円'),true);assert.equal(g('GN相仕倍③Ch-1(4)','2400'),true);
 assert.equal(g('GN相仕倍③Ch-2(6)','8/33'),true);assert.equal(g('GN相仕倍③Ch-2(6)','16/66'),true);
 assert.equal(g('GN相仕倍①例3',['540','120']),true);assert.equal(g('GN相仕倍①例3',['540円','120題']),true);assert.equal(g('GN相仕倍①例3',['120','540']),false);
 assert.equal(g('GN相仕倍②例10',['9','26']),true);assert.equal(g('GN相仕倍②例10',['9日','26日']),true);
 assert.equal(g('GN相仕倍①練4',['168','276']),true);assert.equal(g('GN相仕倍①練12',['3','200','192']),true);
 assert.equal(g('GN相仕倍②Ch-1(3)','14'),true);assert.equal(g('GN相仕倍②Ch-1(3)','14時間'),true);
 assert.equal(g('GN相仕倍②Ch-3(2)','36'),true);assert.equal(g('GN相仕倍①Ch-3(1)','18'),true);
});
