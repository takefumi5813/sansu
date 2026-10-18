const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),bank=require('../content/expedition-speed-gw519-gn.json'),data=require('../content/combined.json');
const raw=a=>a.parts?a.parts.map(raw):a.dimension==='clock'?`${a.h}時${a.m}分`:`${a.n}/${a.d}`;
// Notion問題DBの難易度（型の基礎難度の最大＋上乗せ、2026-10-18 判定）
const expected={'GW519-25①':5,'GW519-29①':4,'GW519-30①':7,'GW519-26①':4,'GN速さ②練4':4,'GN速さ③練3':3,'GN速さ③練5':4,'GN速さ③Ch-1(5)':6};
test('GW519・GN速さから採用した8問の答え・途中確認・難易度',()=>{
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
  assert.equal(g('GW519-25①',['3/4km','48分','33分','1と3/8km']),true);
  assert.equal(g('GW519-26①',['分速60m','分速180m','1分30秒']),true);
  assert.equal(g('GN速さ③練3',['38と2/11','49と1/11','16','21と9/11']),true);
  assert.equal(g('GN速さ③Ch-1(5)',['5','5と5/11']),true);
  assert.equal(g('GW519-30①',['19.2','2432']),true);
});
