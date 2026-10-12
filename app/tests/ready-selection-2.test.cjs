const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),ready=require('../content/expedition-ready-2.json'),all=require('../content/combined.json');
const raw=s=>Array.isArray(s.parts)?s.parts.map(raw):s.dimension==='ratio'?s.terms.join(':'):s.dimension==='clock'?(s.ampm||'')+(s.ampm?Number(s.h)%12:Number(s.h))+'時'+s.m+'分'+(s.s!=null&&Number(s.s)?s.s+'秒':''):s.n+'/'+s.d;
const wrong=s=>Array.isArray(s.parts)?s.parts.map((p,i)=>i===s.parts.length-1?wrong(p):raw(p)):s.dimension==='ratio'?s.terms.map((t,i)=>i?Number(t)+1:t).join(':'):s.dimension==='clock'?(Number(s.h)%12+1)+'時'+s.m+'分':(Number(s.n)+Number(s.d))+'/'+s.d;
test('second ready set is served in the normal free expedition only, with complete explanations',()=>{
 assert(ready.problems.length>0);
 for(const p of ready.problems){
  assert(all.problems.some(q=>q.id===p.id),p.id);
  assert.equal(p.expeditionOnly,true);assert.equal(p.homeStudy,false);assert.equal(p.reviewEligible,false);if(p.figureRequired){assert(/^figs\/notion\/[0-9a-f]{16}\.png$/.test(p.figure),p.id);assert(require('node:fs').existsSync(require('node:path').join(__dirname,'../dist',p.figure)),p.id);}else assert.equal(p.figure,undefined,p.id);
  assert(p.explanation.steps.length>=4&&p.explanation.steps.every(s=>s.title&&s.body),p.id);
  assert(!/［図|図：|図版p/.test(p.text),p.id);
  assert(C.grade(raw(p.answer),p.answer).correct,p.id);
  assert(!C.grade(wrong(p.answer),p.answer).correct,p.id);
  const cp=p.explanation.steps.at(-1).checkpoint;assert(cp,p.id);
  assert(C.grade(cp.answer.n+'/'+cp.answer.d,cp.answer).correct,p.id);
  assert(C.formatAnswer(p.answer).length>0);
 }
});
test('second ready set uses the existing expedition selection, rewards, and graduation',()=>{
 const day='2026-10-12';
 for(const p of ready.problems.slice(0,10)){
  const tier=p.difficulty<=4?'standard':p.difficulty<=6?'advanced':'hard';
  assert(C.selectProblem([p],C.initialState(),{category:p.category,mode:'all',tier,recentUnits:['R24'],scopeUnits:['R24']},day),p.id);
  const a=C.commitAttempt(C.initialState(),p,{id:'n',day,raw:raw(p.answer),purpose:'normal',mode:'all'});
  assert(a.result.correct,p.id);assert.equal(a.state.units[p.unitId].stage,1);
  const g=C.initialState();g.units[p.unitId]={stage:3,due:day,highestStageEver:3,awardedStages:[1,2,3]};
  assert(C.commitAttempt(g,p,{id:'g',day,raw:raw(p.answer),checkpointPassed:true}).result.graduated,p.id);
 }
});
test('free expedition stays locked while priority ranges remain',()=>{
 assert.equal(C.selectProblem(all.problems,C.initialState(),{category:'oneline',mode:'all',recentUnits:['R24'],scopeUnits:['R24']},'2026-10-12'),null);
});
