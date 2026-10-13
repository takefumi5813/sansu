const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/core.js');
const p={id:'p',unitId:'u',category:'oneline',difficulty:3,answer:{n:'8',d:'1',unit:'',dimension:'scalar'},homeStudy:true,scopeUnits:['R24'],domain:'速さ',explanation:{steps:[{id:'cp',checkpoint:{answer:{n:'1',d:'1',unit:'',dimension:'scalar'}}}]}};
const one=(id,unit)=>({...p,id,unitId:unit||id});
const calc=i=>({id:'c'+i,unitId:'cu'+i,category:'calc',expression:i+'+4',star:2,answer:{n:String(i+4),d:'1',unit:'',dimension:'scalar'},explanation:{steps:[]}});
function owned(...ids){const s=C.initialState();s.inventory.heroes=ids;return s;}
test('ability tiers follow bond levels 1-3 / 4-6 / 7-10',()=>{assert.equal(C.abilityTier(0),1);assert.equal(C.abilityTier(14),1);assert.equal(C.abilityTier(15),2);assert.equal(C.abilityTier(59),2);assert.equal(C.abilityTier(60),3);assert.equal(C.abilityTier(150),3);});
test('soul ability adds one soul per independent pass up to the daily tier cap; not for unowned heroes',()=>{
 let s=owned('himiko');const party=[{id:'himiko',type:'soul'}];
 let r=C.commitAttempt(s,one('a'),{id:'1',day:'2026-10-12',raw:'8',mode:'review',party});
 assert.equal(r.result.souls,2);assert.deepEqual(r.result.abilities,[{heroId:'himiko',type:'soul',amount:1}]);
 r=C.commitAttempt(r.state,one('b'),{id:'2',day:'2026-10-12',raw:'8',mode:'review',party});
 assert.equal(r.result.abilities,undefined);
 const wrong=C.commitAttempt(owned('himiko'),one('c'),{id:'3',day:'2026-10-12',raw:'9',party});assert.equal(wrong.result.souls,0);
 const stranger=C.commitAttempt(owned(),one('d'),{id:'4',day:'2026-10-12',raw:'8',party});assert.equal(stranger.result.abilities,undefined);
 s=owned('himiko');s.heroBonds.himiko=60;let x=s;for(const id of ['a','b','c','d']){x=C.commitAttempt(x,one(id),{id,day:'2026-10-12',raw:'8',party}).state;}
 assert.equal(x.souls,4+3+2);
});
test('forge ability adds materials only on paid calculation passes',()=>{
 let s=owned('heracles');const party=[{id:'heracles',type:'forge'}];
 const r=C.commitAttempt(s,calc(1),{id:'x1',day:'2026-10-12',raw:'5',party});assert.equal(r.result.materials,2);assert.equal(r.result.xp,5);
 const again=C.commitAttempt(r.state,calc(1),{id:'x2',day:'2026-10-12',raw:'5',party});assert.equal(again.result.materials,0);
});
test('two companions both gain bond; bond teller adds one more within its cap',()=>{
 const s=owned('okita','arthur');const party=[{id:'okita',type:'bond'},{id:'arthur',type:'echo'}];
 const r=C.commitAttempt(s,one('a'),{id:'1',day:'2026-10-12',raw:'8',mode:'all',party});
 assert.deepEqual(r.result.bonds.map(b=>[b.heroId,b.gained]),[['okita',2],['arthur',2]]);
 const r2=C.commitAttempt(r.state,one('b'),{id:'2',day:'2026-10-12',raw:'8',mode:'all',party});
 assert.deepEqual(r2.result.bonds.map(b=>b.gained),[1,1]);
 assert.deepEqual(r.state.rewards['bond:2026-10-12:a'].heroIds,['okita','arthur']);
});
test('luck raises the box chance, treasure adds gems on a miss, mission adds daily rewards',()=>{
 function daily(party,roll){let s=owned(...party.map(h=>h.id));let r;for(let i=1;i<=5;i++){r=C.commitAttempt(s,calc(i),{id:'d'+i,day:'2026-10-12',raw:String(i+4),party,random:()=>roll});s=r.state;}return r;}
 assert.equal(daily([{id:'kongming',type:'luck'}],.14).result.equipmentLottery.won,true);
 assert.equal(daily([],.14).result.equipmentLottery.won,false);
 const t=daily([{id:'urashima',type:'treasure'}],.9).result.equipmentLottery;assert.equal(t.missesAfter,2);assert.equal(t.bonusGems,1);
 const m=daily([{id:'napoleon',type:'mission'}],.9);assert.ok(m.result.abilities.some(a=>a.type==='mission'&&a.amount===1));assert.equal(m.state.materials,5+5+1);
});
test('echo ability may return one soul after a summon',()=>{
 const s=owned('arthur');s.loadout.hero='arthur';s.souls=C.summonCost(s,[{id:'arthur'},{id:'momotaro'}]);let calls=0;const rolls=[.5,.1];
 const r=C.summonHero(s,[{id:'arthur'},{id:'momotaro'}],{random:()=>rolls[calls++],party:[{id:'arthur',type:'echo'}]});
 assert.equal(r.result.refund,1);assert.equal(r.result.refundHeroId,'arthur');assert.equal(r.state.souls,1);assert.equal(r.state.loadout.partner,'momotaro');
 const n=C.summonHero(s,[{id:'arthur'},{id:'momotaro'}],{random:()=>.5});assert.equal(n.result.refund,0);
});
test('old single-companion saves gain an empty partner slot',()=>{const s=C.initialState();s.loadout={hero:'arthur',equipment:[]};s.inventory.heroes=['arthur'];assert.equal(C.normalizeState(s).loadout.partner,null);});
