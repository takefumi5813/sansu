'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/core.js');

const ratio={dimension:'ratio',terms:['3','2'],unit:''};
const ratio3={dimension:'ratio',terms:['3','2','1'],unit:''};
const parts={parts:[{label:'(1)',n:'22',d:'1',unit:'cm',dimension:'length'},{label:'(2)',n:'56',d:'1',unit:'cm²',dimension:'area',acceptedUnits:{'cm2':'1'}}]};
const mixed={parts:[{label:'(1)',n:'22',d:'1',unit:'cm',dimension:'length'},{label:'(2)',dimension:'ratio',terms:['3','2'],unit:''}]};
const base={unitId:'u',category:'oneline',difficulty:3,homeStudy:true,scopeUnits:['R24'],domain:'比',explanation:{steps:[{id:'cp',checkpoint:{answer:{n:'1',d:'1',unit:'',dimension:'scalar'}}}]}};

test('ratio: half/full-width separators and 対 are accepted; exact reduced terms are correct',()=>{
 for(const raw of ['3:2','３：２','3対2',' 3 : 2 ','３対２'])assert.deepEqual([raw,C.grade(raw,ratio).valid,C.grade(raw,ratio).correct],[raw,true,true]);
 const wrong=C.grade('2:3',ratio);assert.equal(wrong.valid,true);assert.equal(wrong.correct,false);assert.equal(wrong.hint,undefined);
});
test('ratio: unreduced equivalent is valid but incorrect with the simplest-ratio hint',()=>{
 for(const raw of ['6:4','9：6','30対20']){const r=C.grade(raw,ratio);assert.equal(r.valid,true,raw);assert.equal(r.correct,false,raw);assert.equal(r.error,'最も簡単な整数の比で答えよう');assert.equal(r.hint,'最も簡単な整数の比で答えよう');}
 assert.equal(C.grade('6:4:2',ratio3).hint,'最も簡単な整数の比で答えよう');
 assert.equal(C.grade('6:4:1',ratio3).hint,undefined);
});
test('ratio: three-term ratios and invalid forms',()=>{
 assert.equal(C.grade('3:2:1',ratio3).correct,true);assert.equal(C.grade('３：２：１',ratio3).correct,true);
 for(const raw of ['','3:2','3:2:1:1','1.5:1:0.5','0:2:1','-3:2:1','a:b:c','3/2:1:1','3::1'])assert.equal(C.grade(raw,ratio3).valid,false,raw);
 assert.equal(C.grade(['3:2'],ratio).valid,false);
 assert.deepEqual(C.parseAnswer('３：２',ratio),{valid:true,value:{terms:['3','2']}});
});
test('parts: all correct only when every field is correct; per-field results returned',()=>{
 const ok=C.grade(['22','56'],parts);assert.equal(ok.valid,true);assert.equal(ok.correct,true);assert.deepEqual(ok.parts,[{valid:true,correct:true},{valid:true,correct:true}]);
 assert.equal(C.grade(['22cm','56cm²'],parts).correct,true);assert.equal(C.grade(['0.22m','５６'],parts).correct,true);
 const one=C.grade(['22','57'],parts);assert.equal(one.valid,true);assert.equal(one.correct,false);assert.deepEqual(one.parts.map(x=>x.correct),[true,false]);
 const m=C.grade(['22','6:4'],mixed);assert.equal(m.valid,true);assert.equal(m.correct,false);assert.equal(m.parts[1].hint,'最も簡単な整数の比で答えよう');assert.match(m.hint,/^\(2\) 最も簡単な整数の比で答えよう$/);
 assert.equal(C.grade(['22','3：2'],mixed).correct,true);
});
test('parts: an invalid field makes the whole answer invalid and names the field',()=>{
 const bad=C.grade(['22',''],parts);assert.equal(bad.valid,false);assert.equal(bad.invalidPart,1);assert.match(bad.error,/^\(2\) /);assert.deepEqual(bad.parts.map(x=>x.valid),[true,false]);
 const bad1=C.grade(['abc','56'],parts);assert.equal(bad1.invalidPart,0);assert.match(bad1.error,/^\(1\) /);
 for(const raw of ['22',['22'],['22','56','1'],null,undefined,[22]])assert.equal(C.grade(raw,parts).valid,false,JSON.stringify(raw));
 const unlabeled={parts:[{n:'1',d:'1',unit:'',dimension:'scalar'},{n:'2',d:'1',unit:'',dimension:'scalar'}]};assert.match(C.grade(['1','x'],unlabeled).error,/^\(2\) /);
});
test('formatAnswer renders single, ratio and parts answers',()=>{
 assert.equal(C.formatAnswer({n:'22',d:'1',unit:'cm',dimension:'length'}),'22 cm');
 assert.equal(C.formatAnswer({n:'5',d:'3',unit:'',dimension:'scalar'}),'5/3');
 assert.equal(C.formatAnswer(ratio),'3：2');assert.equal(C.formatAnswer(ratio3),'3：2：1');
 assert.equal(C.formatAnswer(parts),'(1) 22 cm　(2) 56 cm²');
});
test('single-format regression: grading and results are unchanged',()=>{
 const spec={n:'1',d:'2',unit:'',dimension:'scalar'};
 assert.deepEqual(C.grade('２/４',spec),{valid:true,correct:true,normalized:{n:'1',d:'2'}});
 assert.deepEqual(C.grade('0.5',spec),{valid:true,correct:true,normalized:{n:'1',d:'2'}});
 assert.equal(C.grade('100cm',{n:'1',d:'1',unit:'m',dimension:'length'}).correct,true);
 assert.equal(C.grade('2時間40分',{n:'160',d:'1',unit:'分',dimension:'time'}).correct,true);
 assert.equal(C.grade('3:2',spec).valid,false);assert.equal(C.grade('',spec).valid,false);
 assert.equal('parts' in C.grade('1/2',spec),false);
 const p={...base,id:'single',answer:{n:'8',d:'1',unit:'分',dimension:'time'}};
 const r=C.commitAttempt(C.initialState(),p,{id:'s1',day:'2026-10-11',raw:'8'});
 assert.deepEqual(Object.keys(r.result).sort(),['correct','due','equipmentBoxes','graduated','materials','normalized','qualified','souls','stage','stars','valid','xp']);
 assert.equal(r.result.correct,true);assert.equal(r.state.units.u.stage,1);assert.equal(r.state.xp,5);
});
test('commitAttempt with array raw progresses parts problems and is JSON-safe',()=>{
 const p={...base,id:'parts',answer:mixed};
 let s=C.initialState();
 const invalid=C.commitAttempt(s,p,{id:'a0',day:'2026-10-11',raw:['22','']});assert.equal(invalid.result.valid,false);assert.equal(invalid.state,s);assert.equal(invalid.result.invalidPart,1);
 const wrong=C.commitAttempt(s,p,{id:'a1',day:'2026-10-11',raw:['22','6:4']});
 assert.equal(wrong.result.valid,true);assert.equal(wrong.result.correct,false);assert.equal(wrong.result.hint,'(2) 最も簡単な整数の比で答えよう');assert.deepEqual(wrong.result.parts.map(x=>x.correct),[true,false]);
 assert.equal(wrong.state.units.u.dueReason,'repair');assert.equal(wrong.state.attempts.at(-1).correct,false);
 s=C.initialState();
 const ok=C.commitAttempt(s,p,{id:'a2',day:'2026-10-11',raw:['22cm','３：２']});
 assert.equal(ok.result.correct,true);assert.equal(ok.result.qualified,true);assert.equal(ok.state.units.u.stage,1);assert.equal(ok.state.xp,5);assert.equal(ok.state.souls,1);
 const dup=C.commitAttempt(ok.state,p,{id:'a2',day:'2026-10-11',raw:['22','3:2']});assert.equal(dup.result.duplicate,true);
 // State must survive IndexedDB structured clone and the JSON export/import round trip unchanged.
 const round=JSON.parse(JSON.stringify(ok.state));assert.deepEqual(round,ok.state);assert.deepEqual(structuredClone(ok.state),ok.state);
 assert.deepEqual(round.attempts[0].result.normalized,[{n:'22',d:'1'},{terms:['3','2']}]);
});
test('ratio problem through commitAttempt and stage-3 graduation with array raw',()=>{
 const rp={...base,id:'ratio',answer:ratio};
 const r=C.commitAttempt(C.initialState(),rp,{id:'r1',day:'2026-10-11',raw:'3対2'});assert.equal(r.result.correct,true);assert.equal(r.state.units.u.stage,1);
 const hinted=C.commitAttempt(C.initialState(),rp,{id:'r2',day:'2026-10-11',raw:'6:4'});assert.equal(hinted.result.correct,false);assert.equal(hinted.result.hint,'最も簡単な整数の比で答えよう');
 const pp={...base,id:'parts',answer:mixed},s=C.initialState();s.units.u={stage:3,due:'2026-10-11',awardedStages:[1,2,3],highestStageEver:3};
 const pending=C.commitAttempt(s,pp,{id:'g1',day:'2026-10-11',raw:['22','3:2']});assert.equal(pending.result.needsGraduationCheck,true);assert.equal(pending.state,s);
 const done=C.commitAttempt(s,pp,{id:'g1',day:'2026-10-11',raw:['22','3:2'],checkpointPassed:true});assert.equal(done.result.graduated,true);
});

const clock={dimension:'clock',h:'8',m:'19',unit:''};
const clockPm={dimension:'clock',h:'13',m:'5',unit:''};
const clockAm={dimension:'clock',h:'8',m:'19',ampm:'午前',unit:''};
const clockAskPm={dimension:'clock',h:'13',m:'5',ampm:'午後',requireAmpm:true,unit:''};
const clockSec={dimension:'clock',h:'8',m:'19',s:'30',unit:''};
const CLOCK_HINT='午前・午後もつけて答えよう';
test('clock: 24-hour, h:mm, 午前/午後 and full-width input',()=>{
 for(const raw of ['8時19分','８時１９分',' 8 時 19 分 ','8:19','８：１９','08:19','午前8時19分','8時19分0秒'])assert.deepEqual([raw,C.grade(raw,clock).valid,C.grade(raw,clock).correct],[raw,true,true]);
 for(const raw of ['13時5分','13:05','午後1時5分','午後１時５分'])assert.equal(C.grade(raw,clockPm).correct,true,raw);
 assert.equal(C.grade('1時5分',clockPm).correct,false);assert.equal(C.grade('1時5分',clockPm).hint,undefined);
 assert.equal(C.grade('午前1時5分',clockPm).correct,false);assert.equal(C.grade('20時19分',clock).correct,false);
 assert.equal(C.grade('午前12時5分',{dimension:'clock',h:'0',m:'5',unit:''}).correct,true);
 assert.equal(C.grade('午後12時',{dimension:'clock',h:'12',m:'0',unit:''}).correct,true);
 assert.deepEqual(C.grade('午後1時5分',clockPm).normalized,{h:'13',m:'5',ampm:'午後'});
 assert.deepEqual(C.parseAnswer('8:19',clock),{valid:true,value:{h:'8',m:'19'}});
});
test('clock: seconds compare as 1/60 minute',()=>{
 for(const raw of ['8時19分30秒','8:19:30','午前8時19分30秒'])assert.equal(C.grade(raw,clockSec).correct,true,raw);
 for(const raw of ['8時19分','8時19分31秒','8時20分'])assert.equal(C.grade(raw,clockSec).correct,false,raw);
 assert.equal(C.grade('8時19分30秒',clock).correct,false);
});
test('clock: answers that must name 午前/午後',()=>{
 for(const raw of ['8時19分','午前8時19分','8:19'])assert.equal(C.grade(raw,clockAm).correct,true,raw);
 assert.equal(C.grade('午後8時19分',clockAm).correct,false);assert.equal(C.grade('20時19分',clockAm).correct,false);
 assert.equal(C.grade('午後1時5分',clockAskPm).correct,true);assert.equal(C.grade('13時5分',clockAskPm).correct,true);
 for(const raw of ['1時5分','1:05']){const r=C.grade(raw,clockAskPm);assert.equal(r.valid,true,raw);assert.equal(r.correct,false,raw);assert.equal(r.hint,CLOCK_HINT);assert.equal(r.error,CLOCK_HINT);}
 assert.equal(C.grade('2時5分',clockAskPm).hint,undefined);assert.equal(C.grade('1時6分',clockAskPm).hint,undefined);
 const noon={dimension:'clock',h:'12',m:'30',ampm:'午後',requireAmpm:true,unit:''};assert.equal(C.grade('12時30分',noon).hint,CLOCK_HINT);assert.equal(C.grade('午後0時30分',noon).correct,true);
});
test('clock: 午後 context answer accepts bare 12-hour time unless 午前/午後 is required',()=>{
 const pm={dimension:'clock',h:'20',m:'4',ampm:'午後',unit:''};
 for(const raw of ['8時4分','午後8時4分','20時4分','20:04'])assert.equal(C.grade(raw,pm).correct,true,raw);
 assert.equal(C.grade('午前8時4分',pm).correct,false);assert.equal(C.grade('8時5分',pm).correct,false);
});
test('clock: invalid inputs',()=>{
 for(const raw of ['','abc','8','8時19','24時0分','8時60分','8時19分60秒','午後13時0分','午前8:19午後','8分19時','8時間19分','3:2:1:0',null,['8:19']])assert.equal(C.grade(raw,clock).valid,false,JSON.stringify(raw));
 assert.equal(C.grade('8:19',{dimension:'clock',h:'25',m:'0',unit:''}).valid,false);
 assert.equal(C.grade('8:19',{dimension:'clock',h:'8',m:'19',ampm:'午後',unit:''}).valid,false);
});
test('clock: inside parts and formatAnswer',()=>{
 const p={parts:[{label:'(1)',dimension:'clock',h:'8',m:'19',ampm:'午前',unit:''},{label:'(2)',n:'40',d:'1',unit:'分',dimension:'time'},{label:'(3)',dimension:'clock',h:'13',m:'5',ampm:'午後',requireAmpm:true,unit:''}]};
 const ok=C.grade(['午前8時19分','40','午後1時5分'],p);assert.equal(ok.valid,true);assert.equal(ok.correct,true);assert.deepEqual(ok.normalized[0],{h:'8',m:'19',ampm:'午前'});
 const h=C.grade(['8時19分','40','1時5分'],p);assert.equal(h.valid,true);assert.equal(h.correct,false);assert.deepEqual(h.parts.map(x=>x.correct),[true,true,false]);assert.equal(h.hint,'(3) '+CLOCK_HINT);
 const bad=C.grade(['8時19分','40','x'],p);assert.equal(bad.valid,false);assert.equal(bad.invalidPart,2);assert.match(bad.error,/^\(3\) /);
 assert.equal(C.formatAnswer(clock),'8時19分');assert.equal(C.formatAnswer(clockAm),'午前8時19分');assert.equal(C.formatAnswer(clockAskPm),'午後1時5分');
 assert.equal(C.formatAnswer(clockSec),'8時19分30秒');assert.equal(C.formatAnswer({dimension:'clock',h:'0',m:'5',ampm:'午前',unit:''}),'午前0時5分');
 assert.equal(C.formatAnswer(p),'(1) 午前8時19分　(2) 40 分　(3) 午後1時5分');
 const r=C.commitAttempt(C.initialState(),{...base,id:'clock',answer:p},{id:'c1',day:'2026-10-11',raw:['８：１９','40','午後1時5分']});
 assert.equal(r.result.correct,true);assert.equal(r.state.units.u.stage,1);assert.deepEqual(JSON.parse(JSON.stringify(r.state)),r.state);
});
