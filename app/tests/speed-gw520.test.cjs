const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),bank=require('../content/expedition-speed-gw520.json'),data=require('../content/combined.json');
const raw=a=>a.parts?a.parts.map(raw):`${a.n}/${a.d}`;
// Notion問題DBの難易度（型の基礎難度の最大＋上乗せ、2026-10-23 判定）
const expected={'GW520-16①':3,'GW520-24①':4,'GW520-27①':4};
test('GW520（時計算）から採用した3問の答え・途中確認・難易度',()=>{
  assert.deepEqual(bank.problems.map(p=>p.id).sort(),Object.keys(expected).sort());
  for(const p of bank.problems){
    assert.equal(p.difficulty,expected[p.id],p.id);
    assert.equal(C.grade(raw(p.answer),p.answer).correct,true,p.id);
    assert.ok(p.explanation.steps.some(s=>s.checkpoint),p.id);
    for(const s of p.explanation.steps)if(s.checkpoint)assert.equal(C.grade(raw(s.checkpoint.answer),s.checkpoint.answer).correct,true,p.id+' '+s.id);
    assert.equal(p.expeditionOnly,true);assert.match(p.source.url,/^https:\/\/app\.notion\.com\//);
    const q=data.problems.find(x=>x.id===p.id);assert.ok(q&&C.isActiveProblem(q),p.id+' active');
  }
});
test('入力のゆれ（帯分数・分秒）を正しく判定する',()=>{
  const g=(id,r)=>C.grade(r,bank.problems.find(p=>p.id===id).answer).correct;
  assert.equal(g('GW520-16①',['5と5/11','38と2/11']),true);
  assert.equal(g('GW520-16①',['38と2/11','5と5/11']),false);
  assert.equal(g('GW520-24①',['24']),true);
  assert.equal(g('GW520-27①',['1','1と1/59']),true);
  assert.equal(g('GW520-27①',['1','1']),false);
});
