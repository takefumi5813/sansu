const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),ready=require('../content/expedition-ready.json'),all=require('../content/combined.json');
const factorial=n=>n<2?1:n*factorial(n-1),choose=(n,k)=>factorial(n)/factorial(k)/factorial(n-k);
const gcd=(a,b)=>b?gcd(b,a%b):a;
const numerators=Array.from({length:30},(_,i)=>i+1).filter(n=>gcd(n,30)===1);
const expected=[factorial(5)*2,factorial(3)**2,factorial(4)-factorial(3),choose(8,3),choose(5,3)*choose(4,2),1+choose(4,2),choose(5,1)+choose(5,2),Array.from({length:200},(_,i)=>i+1).filter(n=>200%n===0).length,numerators.length,numerators.reduce((a,b)=>a+b,0)/30,300*60/90,120*.4,5/4*100,300/(2/5-1/3),Array.from({length:20},(_,i)=>1+3*i).reduce((a,b)=>a+b),12*5/(7-5),84/(7-4),8*30+30*.5-180,2.5*100**3,Math.min(30-24,30-26)];
test('new answers independently match arithmetic or combinatorial enumeration',()=>{
 assert.equal(ready.problems.length,expected.length);
 ready.problems.forEach((p,i)=>assert(Math.abs(Number(p.answer.n)/Number(p.answer.d)-expected[i])<1e-9,p.id));
});
test('only normal problem sources are distributed, with complete explanations and objective checkpoints',()=>{
 assert.equal(all.selectedBank,undefined);assert.equal(all.problems.length,143+require('../content/expedition-ready-2.json').problems.length+require('../content/selected-calc-2.json').problems.length+require('../content/selected-calc-3.json').problems.length+require('../content/expedition-hold-integration.json').problems.length);
 for(const p of ready.problems){
  assert(all.problems.some(q=>q.id===p.id));assert.equal(p.expeditionOnly,true);assert(!p.homeStudy);
  assert.equal(p.explanation.steps.length,4);assert(p.explanation.steps.every(s=>s.body&&s.equation));
  const cp=p.explanation.steps.find(s=>s.checkpoint).checkpoint;
  assert(C.grade(cp.answer.n+'/'+cp.answer.d,cp.answer).correct);
  assert(C.grade(p.answer.n+'/'+p.answer.d,p.answer).correct);
  assert(!C.grade((Number(p.answer.n)+1).toString(),p.answer).correct);
 }
});
test('new questions use existing expedition gate, grading, reward, review, and graduation checks',()=>{
 const p=ready.problems[0],day='2026-10-12',s=C.initialState();
 assert.equal(C.selectProblem(all.problems,s,{category:'oneline',mode:'all',recentUnits:['R24'],scopeUnits:['R24']},day),null);
 assert(C.selectProblem([p],s,{category:'oneline',mode:'all',tier:p.difficulty<=2?'basic':p.difficulty<=4?'standard':p.difficulty<=6?'advanced':'hard',recentUnits:['R24'],scopeUnits:['R24']},day));
 const a=C.commitAttempt(s,p,{id:'new',day,raw:p.answer.n,purpose:'normal',mode:'all'});
 assert(a.result.correct);assert.equal(a.result.souls,1);assert.equal(a.state.units[p.unitId].stage,1);assert.equal(a.state.units[p.unitId].due,'2026-10-26');
 const graduated=C.initialState();graduated.units[p.unitId]={stage:3,due:day,highestStageEver:3,awardedStages:[1,2,3]};
 assert(C.commitAttempt(graduated,p,{id:'grad',day,raw:p.answer.n}).result.needsGraduationCheck);
 const cp=p.explanation.steps.find(s=>s.checkpoint).checkpoint;assert(C.grade(cp.answer.n,cp.answer).correct);
 assert(C.commitAttempt(graduated,p,{id:'grad',day,raw:p.answer.n,checkpointPassed:true}).result.graduated);
});
