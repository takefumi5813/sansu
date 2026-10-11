const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Gear = require('../src/gear.js');
const catalog = require('../content/equipment.json');
const items = catalog.equipment;
const state = () => ({schemaVersion:1, xp:0, stars:7, materials:100, souls:12, equipmentBoxes:1, equipmentTraining:{'starter-dagger':1}, equipmentDiscoveries:0,
  heroBonds:{arthur:35}, heroSummons:20, inventory:{heroes:['arthur'],equipment:['starter-dagger']}, loadout:{hero:'arthur',equipment:['starter-dagger']},
  units:{u:{stage:2}}, attempts:[{id:'old'}], rewards:{old:{xp:5}}, daily:{'2026-10-11':{completed:['a']}}});
const discover = (s, index, list = catalog) => Gear.discoverEquipment(s,list,{random:()=>(index+.5)/items.length});
function frozen(value) { if(value && typeof value==='object') {Object.freeze(value);Object.values(value).forEach(frozen);} return value; }
test('browser global and CommonJS expose the same three operations',()=>{
  const context={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/gear.js'),'utf8'),context);
  assert.deepEqual(Object.keys(context.SansuGear).sort(),Object.keys(Gear).sort());
});
test('all twelve types are uniformly discoverable at zeroXP; starter dagger is already owned',()=>{
  assert.equal(items.length,12);assert.equal(new Set(items.map(x=>x.type)).size,12);
  assert(items.every(x=>x.rank===1 && x.domain==='' && !Object.hasOwn(x,'unlockLevel')));
  for(let i=0;i<items.length;i++) {
    const s=frozen(state()),r=discover(s,i);assert.equal(r.result.valid,true);assert.equal(r.result.gearId,items[i].id);
    assert.equal(r.result.duplicate,i===0);assert.equal(r.result.refund,i===0?3:0);assert.equal(r.result.discoveryCount,1);
    assert.equal(r.state.equipmentBoxes,0);assert.equal(r.state.equipmentTraining[items[i].id],1);
    const expected=i===0?['starter-dagger']:['starter-dagger',items[i].id];
    assert.deepEqual(r.state.inventory.equipment,expected);assert.deepEqual(r.state.loadout.equipment,expected);
    assert.equal(s.equipmentBoxes,1);assert.equal(s.equipmentDiscoveries,0);assert.deepEqual(s.inventory.equipment,['starter-dagger']);
  }
});
test('new discovery changes only box/count/ownership/training/loadout, preserving other state',()=>{
  const s=state(),r=discover(s,1);const expected=structuredClone(s);
  expected.equipmentBoxes=0;expected.equipmentDiscoveries=1;expected.inventory.equipment.push(items[1].id);expected.equipmentTraining[items[1].id]=1;expected.loadout.equipment.push(items[1].id);
  assert.deepEqual(r.state,expected);assert.notEqual(r.state,s);assert.notEqual(r.state.inventory,s.inventory);
  assert.deepEqual(catalog,require('../content/equipment.json'));
});
test('fourth discovered equipment is owned atLv1 without replacing occupied three slots',()=>{
  let s=state();for(let i=1;i<4;i++){s.equipmentBoxes=1;s=discover(s,i).state;}
  assert.deepEqual(s.inventory.equipment,items.slice(0,4).map(x=>x.id));assert.deepEqual(s.loadout.equipment,items.slice(0,3).map(x=>x.id));assert.equal(s.equipmentTraining[items[3].id],1);
});
test('duplicate consumes one box, refunds three materials and preserves trained level and loadout',()=>{
  const s=discover(state(),0).state;s.equipmentBoxes=1;s.equipmentTraining[items[0].id]=7;const before=structuredClone(s),r=discover(frozen(s),0);
  assert.equal(r.result.duplicate,true);assert.equal(r.result.refund,3);assert.equal(r.result.discoveryCount,2);
  const expected=structuredClone(before);expected.equipmentBoxes=0;expected.equipmentDiscoveries=2;expected.materials+=3;assert.deepEqual(r.state,expected);
});
test('uniform random interval boundaries choose first and last, invalid draws preserve identity',()=>{
  for(const [roll,index] of [[0,0],[1/12,1],[.5,6],[1-Number.EPSILON,11]]) {
    const r=Gear.discoverEquipment(state(),items,{random:()=>roll});assert.equal(r.result.gearId,items[index].id);
  }
  for(const random of [()=>-1,()=>1,()=>NaN,()=>Infinity,()=>undefined,()=>{throw Error('rng');}]) {
    const s=frozen(state()),r=Gear.discoverEquipment(s,catalog,{random});assert.equal(r.result.valid,false);assert.equal(r.state,s);
  }
});
test('empty boxes/malformed catalogs/balances never consume currency or call random',()=>{
  const badCatalogs=[[],{},[items[0],items[0]],[{id:'bad',rank:0}]];
  for(const c of badCatalogs){const s=frozen(state()),r=Gear.discoverEquipment(s,c);assert.equal(r.result.valid,false);assert.equal(r.state,s);}
  for(const boxes of [0,-1,0.5,undefined,NaN]){const s=state();s.equipmentBoxes=boxes;const r=Gear.discoverEquipment(s,catalog,{random:()=>{throw Error('must not run');}});assert.equal(r.result.valid,false);assert.equal(r.state,s);}
  const s=state();s.materials=-1;assert.equal(discover(s,0).state,s);
});
test('level1 to10 charges the next level, preserves identity/name/rank/XP and all other currencies',()=>{
  let s=discover(state(),0).state;const id=items[0].id,initial=structuredClone(s);
  for(let level=2;level<=10;level++) {
    const before=structuredClone(s),r=Gear.trainEquipment(frozen(s),id,catalog);assert.equal(r.result.valid,true);assert.equal(r.result.cost,level);assert.equal(r.result.previousLevel,level-1);
    assert.equal(r.result.level,level);assert.equal(r.result.power,items[0].rank*10+(level-1)*3);
    const expected=structuredClone(before);expected.materials-=level;expected.equipmentTraining[id]=level;assert.deepEqual(r.state,expected);s=r.state;
  }
  assert.equal(s.materials,initial.materials-54);assert.equal(s.inventory.equipment[0],id);
  const max=Gear.trainEquipment(s,id,catalog);assert.equal(max.result.valid,false);assert.equal(max.state,s);
  assert.deepEqual(Gear.gearProgress(items[0],10),{level:10,maxLevel:10,power:items[0].rank*10+27,nextCost:null,maxed:true});
});
test('training exact balance succeeds; insufficient materials, unknown/unowned items fail unchanged',()=>{
  const s=discover(state(),0).state,id=items[0].id;s.materials=2;const yes=Gear.trainEquipment(s,id,items);assert.equal(yes.result.valid,true);assert.equal(yes.state.materials,0);assert.equal(s.materials,2);
  s.materials=1;const no=Gear.trainEquipment(frozen(s),id,items);assert.equal(no.result.valid,false);assert.equal(no.state,s);
  for(const id of ['unknown',items[1].id]){const r=Gear.trainEquipment(s,id,catalog);assert.equal(r.result.valid,false);assert.equal(r.state,s);}
});
test('training legacy owned equipment without a training entry begins atLv1',()=>{
  const s=state(),id=items[0].id;s.inventory.equipment=[id];delete s.equipmentTraining;const r=Gear.trainEquipment(s,id,catalog);assert.equal(r.result.previousLevel,1);assert.equal(r.result.level,2);assert.equal(r.state.equipmentTraining[id],2);
});
test('progress clamps display levels; malformed saved training levels cannot be charged',()=>{
  assert.equal(Gear.gearProgress(items[0],0).level,1);assert.equal(Gear.gearProgress(items[0],99).level,10);assert.equal(Gear.gearProgress(items[0],NaN).level,1);
  for(const bad of [0,11,2.5,'3']){const s=state(),id=items[0].id;s.inventory.equipment=[id];s.equipmentTraining[id]=bad;const r=Gear.trainEquipment(s,id,catalog);assert.equal(r.result.valid,false);assert.equal(r.state,s);}
});
