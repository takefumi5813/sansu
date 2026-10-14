const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),all=require('../content/combined.json');
const reviews=require('../content/difficulty-reviews.json').problems;
test('reviewed subquestions select under standard and cannot leak into advanced',()=>{
 assert.equal(Object.keys(reviews).length,16);
 for(const [id,r] of Object.entries(reviews)){
  const p=all.problems.find(p=>p.id===id);assert(p,id);
  assert.equal(p.difficulty,r.difficulty,id);
  const state=C.initialState(),before=JSON.stringify(state);
  const filter={category:p.category,mode:'all',recentUnits:[],scopeUnits:[],grade:5};
  assert.equal(C.selectProblem([p],state,{...filter,tier:'standard'},'2026-10-14')?.id,id);
  assert.equal(C.selectProblem([p],state,{...filter,tier:'advanced'},'2026-10-14'),null);
  assert.equal(JSON.stringify(state),before,'selection preserves existing learning state');
 }
});
