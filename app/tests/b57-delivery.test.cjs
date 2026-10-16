const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const data=require('../content/combined.json'),batch=require('../content/b57-playable-84.json'),C=require('../src/core.js');
function raw(s){if(s.parts)return s.parts.map(raw);if(s.dimension==='ratio')return s.terms.join(':');if(s.dimension==='text')return s.value;if(s.dimension==='clock')return (s.ampm||'')+(s.ampm?Number(s.h)%12:s.h)+'時'+s.m+'分'+(s.s?s.s+'秒':'');return s.n+'/'+s.d;}
test('released 193 and 200 grade correctly and retain source quality history',()=>{
 const a=data.problems.find(p=>p.id==='b57-APP108-P193-01-B'),b=data.problems.find(p=>p.id==='b57-APP108-P200-01-A');
 assert.equal(a.source.pdfPage,2);assert.ok(C.grade('5:2',a.answer).correct);assert.ok(!C.grade('2:5',a.answer).correct);
 assert.ok(C.grade('125cm',b.answer).correct);assert.ok(!C.grade('85cm',b.answer).correct);
 const r=data.b57Catalog.representatives.find(r=>r.appProblemId===b.id);
 assert.equal(r.deliveryStatus,'出題可能');assert.ok(r.quality.current.some(x=>x.type==='旧DB説明の品質記録'&&x.deliveryBlocking===false));
 assert.ok(r.qualityHistory.length);assert.ok(r.quality.relatedPoint.some(x=>x.text.includes('a/r')));
});
test('new speed answer accepts equivalent hour and minute expressions',()=>{const p=batch.problems.find(p=>p.id==='b57-APP108-P226-01-A');for(const raw of ['14km/h','14km/時','時速14km','700/3m/分'])assert.ok(C.grade(raw,p.answer).correct,raw);assert.equal(C.grade('14m/分',p.answer).correct,false);});
test('enumeration independently verifies counting answers',()=>{
 const counts={P092:0,P094:0,P101:0,P235:0,P237:0,P238:0};
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 for(let n=100;n<1000;n++){const ds=String(n).split('').map(Number);if(ds.every(x=>x<=4)&&new Set(ds).size===3&&n%3===0)counts.P092++;if(n%11===0&&new Set(ds).size===3)counts.P094=n;if(ds.reduce((a,b)=>a+b)===6)counts.P237++;}
 for(let n=120;n<=300;n++)if(gcd(n,60)===1)counts.P101++;
 for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)for(let c=1;c<=6;c++)if(a+b+c===7)counts.P235++;
 for(let n=2222;n<=5555;n+=2){const ds=String(n).split('').map(Number);if(n%4===0&&ds.every(x=>[2,3,4,5].includes(x))&&[2,3,5].every(x=>ds.filter(d=>d===x).length<=2)&&ds.filter(d=>d===4).length<=3)counts.P238++;}
 for(const [point,answer] of Object.entries(counts)){const p=batch.problems.find(p=>p.id.includes('-'+point+'-'));if(p)assert.ok(C.grade(String(answer),p.answer).correct,point+' enumerated '+answer);}
});
test('84 decisions complete; only checked deliveries are playable',()=>{const a=data.b57Catalog.deliveryRound;assert.equal(a.requested,84);assert.equal(a.records.length,84);assert.equal(a.ready,batch.problems.length);assert.equal(a.ready+a.held,84);for(const r of a.records){const p=data.problems.find(p=>p.id===r.appProblemId);if(r.status==='ready'){assert.ok(p);assert.ok(C.isActiveProblem(p));}else{assert.ok(r.holdReason);assert.ok(!p);}}});
test('all new answers, accepted expressions, checkpoints and selection bands work',()=>{for(const p0 of batch.problems){const p=data.problems.find(x=>x.id===p0.id);assert.ok(C.grade(raw(p.answer),p.answer).correct,p.id);for(const alt of p.answer.accepted||[])assert.ok(C.grade(alt,p.answer).correct,p.id+' accepted');assert.ok(!C.grade('未回答',p.answer).correct,p.id);assert.ok(p.explanation.steps.some(s=>s.checkpoint));assert.equal(new Set(p.explanation.steps.map(s=>s.body)).size,p.explanation.steps.length,p.id+' repeated explanation');for(const s of p.explanation.steps){assert.ok(!/答え=None|undefined/.test(s.body+' '+s.equation),p.id);if(s.checkpoint)assert.ok(C.grade(raw(s.checkpoint.answer),s.checkpoint.answer).correct,p.id+' checkpoint');}assert.equal(p.scopeUnits.length,0);assert.equal(p.expeditionOnly,true);assert.equal(p.reviewEligible,false);assert.ok(C.selectProblem([p],C.initialState(),{category:p.category,tier:p.b57.selectionTier,mode:'all'},'2026-10-16'),p.id+' selection');for(const tier of ['basic','standard','advanced'].filter(x=>x!==p.b57.selectionTier))assert.equal(C.selectProblem([p],C.initialState(),{category:p.category,tier,mode:'all'},'2026-10-16'),null);if(p.figureRequired)assert.ok(fs.existsSync(path.join(__dirname,'../dist',p.figure)));}});
