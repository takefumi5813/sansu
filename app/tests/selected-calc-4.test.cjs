const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('fs');
const C=require('../src/core.js'),data=require('../content/selected-calc-4.json'),source=require('../references/calc-exam-source.json'),reserve=require('../references/calc-exam-reserve.json'),all=require('../content/combined.json');
const existing=[require('../content/selected-calc.json'),require('../content/selected-calc-2.json'),require('../content/selected-calc-3.json'),require('../content/arithmetic.json')];
const P=data.problems;
test('only problems that exist in Notion are served: R21K-57 with its Notion page',()=>{
 assert.equal(P.length,1);assert.equal(source.length,1);assert.equal(data.units.length,1);
 const p=P[0],s=source[0];
 assert.equal(p.id,'R21K-57');assert.equal(p.source.url,'https://app.notion.com/p/3f62b010743c814b86c3f1c0cd37b91c');
 assert.equal(p.source.sourceAnswer,'84');assert.equal(p.source.sourceAnswer,s.answerText);assert.equal(p.sourceText,s.localText);assert.equal(p.expression,s.ex);
 const old=new Set(existing.flatMap(x=>x.problems.map(q=>q.id)));assert.ok(!old.has(p.id));
 assert.ok(data.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
 
});
test('exam problems that are not in Notion are kept only as an unserved reserve',()=>{
 assert.equal(reserve.length,50);
 const served=new Set(all.problems.map(p=>p.id));
 for(const r of reserve){assert.ok(!served.has(r.id),r.id);assert.ok(!r.notionUrl,r.id);}
 assert.ok(!/exam-pdf/.test(fs.readFileSync(__dirname+'/../build.cjs','utf8')),'build.cjs must not accept non-Notion sources');
});
test('R21K-57 is recomputed exactly; its explanation steps are verified',()=>{
 const p=P[0];const r=C.calcInverse(p.expression);
 assert.equal(r.supported,true);assert.deepEqual(r.answer,{n:p.answer.n,d:p.answer.d});assert.equal(r.score,p.score);assert.equal(r.star,p.star);
 assert.equal(C.calcTier(p),'advanced');
 const steps=p.explanation.steps;assert.ok(steps.length>=4&&steps.length<=8);assert.ok(steps.some(s=>s.checkpoint));
 assert.ok(!/NaN|undefined|\[object/.test(JSON.stringify(steps)));
});
test('the build includes R21K-57 and the other hard calculation problems are unchanged (18)',()=>{
 assert.ok(all.problems.some(p=>p.id==='R21K-57'));
 const hardCalc=all.problems.filter(p=>p.category==='calc'&&C.calcTier(p)==='hard');assert.equal(hardCalc.length,18);
});
