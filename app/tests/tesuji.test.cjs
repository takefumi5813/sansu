const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),bank=require('../content/expedition-tesuji.json'),all=require('../content/combined.json');
const raw=a=>a.parts?a.parts.map(raw):a.dimension==='ratio'?a.terms.join(':'):`${a.n}/${a.d}`;
test('tesuji answers, ratios and ordered sides use the existing grader',()=>{
 for(const p of bank.problems){assert(C.grade(raw(p.answer),p.answer).correct,p.id);const bad=p.answer.parts?['40','24']:p.answer.dimension==='ratio'?'1:1':'-1';assert(!C.grade(bad,p.answer).correct,p.id);for(const s of p.explanation.steps)if(s.checkpoint)assert(C.grade(raw(s.checkpoint.answer),s.checkpoint.answer).correct,p.id);}
 assert(C.grade('2:35',bank.problems.find(p=>p.id==='TS平27').answer).correct);
 assert(C.grade('95.22cm2',bank.problems.find(p=>p.id==='TS動46').answer).correct);
});
test('tesuji additions preserve the 710 existing questions and expedition-only scope',()=>{
 assert.equal(bank.problems.length,44);assert.equal(all.problems.length,754);assert.equal(new Set(all.problems.map(p=>p.id)).size,754);
 for(const p of bank.problems){assert.equal(all.problems.filter(q=>q.id===p.id).length,1);assert.deepEqual(p.scopeUnits,[]);assert.equal(p.expeditionOnly,true);assert.equal(p.reviewEligible,false);assert.equal(p.homeStudy,false);assert.equal(bank.units.filter(u=>u.representativeId===p.id).length,1);}
});
test('problem and explanation images are present and shipped identically',()=>{
 for(const p of bank.problems){assert(/^https:\/\/app.notion.com\//.test(p.source.url));assert(p.explanation.steps.length>=4);for(const f of [p.figure,...p.explanation.steps.filter(s=>s.visual).map(s=>s.visual.src)]){const a=fs.readFileSync(path.resolve(__dirname,'../dist',f)),b=fs.readFileSync(path.resolve(__dirname,'../..',f));assert.deepEqual(a,b);assert.equal(a.subarray(1,4).toString(),'PNG');assert(a.readUInt32BE(16)>300);}}
});
