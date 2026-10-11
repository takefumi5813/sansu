'use strict';
// Independent rational calculation from the given conditions; no floating point comparisons.
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const C=require('../src/core.js');const d=require('../content/selected-oneline.json');
const snap=require('../references/notion-r24-oneline-snapshot.json');
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a||1n;}
function q(a,b=1){a=BigInt(a);b=BigInt(b);const g=gcd(a,b);return {n:a/g,d:b/g};}
function add(a,b){return q(a.n*b.d+b.n*a.d,a.d*b.d);}
function mul(a,b){return q(a.n*b.n,a.d*b.d);}
function div(a,b){return q(a.n*b.d,a.d*b.n);}
function sub(a,b){return add(a,q(-b.n,b.d));}
const sum=(...a)=>a.reduce(add,q(0)),v=x=>q(x),rate=(whole,days)=>q(whole,days);
const expected={};const set=(id,a,cp)=>expected['R24H'+id]=[a,cp];
set('①-2',div(v(180),sum(rate(180,36),rate(180,45))),sum(rate(180,36),rate(180,45)));
set('①-3',add(v(12),div(sub(v(120),mul(sum(rate(120,24),rate(120,40)),v(12))),rate(120,40))),sub(v(120),mul(sum(rate(120,24),rate(120,40)),v(12))));
set('①-4',div(v(90),sub(rate(90,18),rate(90,30))),sub(rate(90,18),rate(90,30)));
set('①-5',div(v(240),sub(sum(rate(240,30),rate(240,20)),rate(240,16))),sub(sum(rate(240,30),rate(240,20)),rate(240,16)));
const b21=div(sub(v(84),mul(rate(84,28),v(8))),v(15));set('②-1',div(v(84),add(rate(84,28),b21)),b21);
set('②-2',div(v(160),sum(q(40,8),q(120,40))),q(40,8));
const a23=sub(q(360,40),q(120,30));set('②-3',div(v(240),a23),a23);
const b24=sub(q(120,12),q(60,15));set('②-4',div(v(180),b24),b24);
const bd31=div(sub(v(48),mul(rate(48,16),v(8))),rate(48,12));set('③-1',sub(v(8),bd31),bd31);
const lost=sum(mul(rate(120,15),v(3)),mul(rate(120,24),v(5)));set('③-2',div(add(v(120),lost),sum(rate(120,15),rate(120,24))),lost);
const each45=div(v(90),sum(rate(90,10),rate(90,18),rate(90,90)));set('④-5',mul(each45,v(3)),each45);
const rem51=sub(mul(v(8),v(25)),mul(v(7),v(16)));set('⑤-1',add(v(16),div(rem51,v(8))),rem51);
const count52=div(sub(mul(v(6),v(20)),mul(v(6),v(5))),v(10));set('⑤-2',sub(count52,v(6)),count52);
const rem53=mul(div(mul(v(18),v(6)),q(3,5)),q(2,5));set('⑤-3',div(rem53,v(6)),rem53);
const daily54=sum(mul(q(270,54),v(3)),mul(q(270,90),v(4)));set('⑤-4',div(v(270),daily54),daily54);
const br61=q(7);set('⑥-1',div(mul(sum(v(5),br61),v(15)),v(5)),br61);
const br62=sub(div(mul(v(6),v(4)),v(3)),v(3));set('⑥-2',div(mul(sum(v(3),br62,v(6)),v(9)),v(3)),br62);
let day=0,left=120;const rates=[5,8,4];while(left>0){left-=rates[day%3];day++;}set('⑦-2',v(day),v(120-7*(5+8+4)));
assert.equal(d.problems.length,18);assert.equal(new Set(d.problems.map(p=>p.id)).size,18);
assert.equal(new Set(d.units.map(u=>u.id)).size,18);
for(const p of d.problems){
 const [answer,checkpoint]=expected[p.id];assert.ok(answer,p.id);
 const cp=p.explanation.steps.filter(s=>s.checkpoint);assert.equal(cp.length,1,p.id);
 for(const [actual,want] of [[p.answer,answer],[cp[0].checkpoint.answer,checkpoint]]){
  assert.deepEqual(q(actual.n,actual.d),want,p.id);assert.equal(C.grade(`${want.n}/${want.d}`,actual).correct,true,p.id);
  assert.equal(C.grade(`${want.n+want.d}/${want.d}`,actual).correct,false,p.id+' rejects numeric error');
 }
 assert.ok(p.explanation.steps.length>=4&&p.explanation.steps.length<=8);
 assert.deepEqual(p.scopeUnits,['R24']);assert.deepEqual(p.source.scopeUnits,['R24']);assert.equal(p.homeStudy,true);
 const entry=snap.pages.find(e=>e.row.問題===p.id);assert.equal(p.source.url,entry.row.url);assert.equal(p.source.notionId,entry.row.id);
 const body=entry.page.text.match(/## 問題\n([\s\S]*?)\n## 答え/)[1];assert.equal(p.source.notionSourceText,body);
 if(p.id!=='R24H④-5')assert.equal(p.text,body);else assert.ok(p.source.notionParentUrl);
 assert.equal(p.sourceText,p.text);assert.equal(p.source.sourceText,p.text);
 const base=Math.max(...p.source.notionTypes.map(t=>t.baseDifficulty));assert.equal(p.difficulty,base+(entry.row.上乗せ||0));
 assert.ok(d.units.some(u=>u.id===p.unitId&&u.representativeId===p.id));
}
for(const l of d.links){assert.ok(d.units.some(u=>u.id===l.from));assert.ok(d.units.some(u=>u.id===l.to));assert.notEqual(l.from,l.to);assert.ok(l.difference.length>12);}
// Source answer checks for compressed duplicates and held questions.
assert.deepEqual(div(v(1),sum(q(1,70),q(1,30))),q(21));
assert.deepEqual(div(add(v(84),sum(v(3*3),v(2),v(4))),v(9)),q(11));
assert.deepEqual(div(sub(v(96),v(15*4)),v(3)),q(12));
assert.deepEqual(div(v(70),sum(v(2),v(5))),q(10));
assert.deepEqual(div(v(1),sum(q(1,25),q(1,35))),q(175,12));
assert.deepEqual(div(v(1),sum(q(1,7),q(1,8))),q(56,15));
assert.deepEqual(div(v(210),sum(v(2*7),v(7*3))),q(6));
let remaining71=84,day71=0;while(remaining71>0){remaining71-=[4,3][day71%2];day71++;}assert.equal(day71,24);
assert.deepEqual(div(v(205),sum(v(8),v(7))),q(41,3)); // H⑥-3 7A=8B -> A:B=8:7
assert.deepEqual(div(v(184),sum(v(7),v(5))),q(46,3)); // H⑥-4 5A=7B
assert.deepEqual(div(sub(v(184),v(7*22)),v(5)),q(6));
assert.deepEqual(add(v(65),div(v(5),q(12,5))),q(805,12)); // H⑦-3 B=67h5m
assert.deepEqual(div(mul(sum(v(5),v(3),v(6)),v(9)),v(5)),q(126,5)); // Local md B8 typo: C4=(A+B)3=B8 -> A:B:C=5:3:6.
assert.equal(C.grade('480時間',d.problems[0].answer).correct,true);
console.log('PASS: 18 exact answers, 18 checkpoints, source fidelity, scope, Notion difficulty, 16 links, compressed/held source equations.');
