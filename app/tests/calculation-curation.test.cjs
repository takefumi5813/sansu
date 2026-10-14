const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),data=require('../content/combined.json');
const reviews=require('../content/calculation-curation.json').problems;
test('reviewed calculation selection preserves records while excluding archived questions in every mode',()=>{
 const state=C.initialState();
 for(const [id,r] of Object.entries(reviews)){
  const p=data.problems.find(p=>p.id===id);assert(p,id);
  assert.equal(p.curation.active,r.active,id);
  assert.equal(p.category==='calc'?C.calcTier(p):(p.difficulty<=2?'basic':p.difficulty<=4?'standard':p.difficulty<=6?'advanced':'hard'),r.tier,id);
  if(r.active)continue;
  state.attempts.push({id:'old-'+id,problemId:id,day:'2026-10-13',correct:true});
  state.drafts['draft-'+id]={problemId:id,revision:p.revision,day:'2026-10-14'};
  const before=JSON.stringify(state);
  for(const mode of ['all','review','gnorev'])for(const tier of ['basic','standard','advanced','hard']){
   assert.equal(C.selectProblem([p],state,{category:p.category,mode,tier,recentUnits:[],scopeUnits:[]},'2026-10-14'),null,id+' '+mode+' '+tier);
  }
  assert.equal(JSON.stringify(state),before,'archive does not modify history or drafts');
  assert.equal(data.problems.find(q=>q.id===state.attempts.at(-1).problemId)?.source.title,p.source.title);
 }
});
test('integer-only calculation length never implies advanced and reviewed tier is authoritative',()=>{
 for(const expression of ['(1+2+3+4+5)*6','6*{(81-3*□)-75÷25}=126','(1+2+3+4+5+6+7)*□=224'])
  assert.equal(C.calcTier({expression,answer:{n:'1',d:'1'}}),'standard');
 for(const p of data.problems.filter(p=>p.category==='calc')){
  assert(p.curation,'all published calculation records are reviewed: '+p.id);
  const sh=C.calcShape(p);if(!sh.frac&&!sh.dec)assert.ok(['basic','standard'].includes(C.calcTier(p)),p.id);
  assert.equal(p.star,{basic:1,standard:1,advanced:2,hard:3}[C.calcTier(p)]);
 }
});
test('archive does not block progression through priority scopes',()=>{
 const p={id:'archived',unitId:'archived',category:'oneline',difficulty:4,homeStudy:true,scopeUnits:['R24'],curation:{active:false}};
 const result=C.getCampaignStatus([p],C.initialState(),{recentUnits:['R24'],scopeUnits:['R24']},'2026-10-14');
 assert.equal(result.allUnlocked,true);
});
