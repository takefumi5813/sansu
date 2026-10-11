const assert=require('node:assert/strict');
const C=require('../src/core.js');
const p=require('../content/selected-geometry.json').problems[0];
// Independent coordinate check: intersect the chord from vertex 0 to 3 with radius 1.
const vertex=k=>({x:Math.sin(k*Math.PI/4),y:Math.cos(k*Math.PI/4)});
const A=vertex(0),B=vertex(1),D=vertex(3),v={x:D.x-A.x,y:D.y-A.y};
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const t=-cross(A,B)/cross(v,B),P={x:A.x+t*v.x,y:A.y+t*v.y};
const pa={x:A.x-P.x,y:A.y-P.y},pb={x:B.x-P.x,y:B.y-P.y};
const angle=Math.acos((pa.x*pb.x+pa.y*pb.y)/(Math.hypot(pa.x,pa.y)*Math.hypot(pb.x,pb.y)))*180/Math.PI;
assert.ok(Math.abs(angle-67.5)<1e-10);
assert.ok(C.grade('67.5度',p.answer).correct);
assert.ok(C.grade('135/2°',p.answer).correct);
assert.equal(C.grade('112.5',p.answer).correct,false);
const f={category:'geometry',mode:'review',recentUnits:['R24'],scopeUnits:['R24'],tier:'standard',grade:5,difficulty:10};
assert.equal(C.selectProblem([p],C.initialState(),f,'2026-10-11')?.id,p.id);
assert.equal(C.selectProblem([p],C.initialState(),{...f,mode:'gnorev'},'2026-10-11'),null);
console.log('PASS: coordinate intersection, angle units, wrong-side angle and review-only eligibility');
