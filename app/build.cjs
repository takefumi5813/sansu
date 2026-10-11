const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = p => fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const sources = ['content/arithmetic.json','content/selected-calc.json','content/selected-oneline.json','content/selected-geometry.json'].map(p=>JSON.parse(read(p)));
const legacyCatalog = JSON.parse(read('references/legacy-catalog.json'));
const roster=JSON.parse(read('content/heroes.json'));
const cleanHero=({rank,unlockLevel,...hero})=>hero;
const catalog = {...legacyCatalog,heroes:roster.heroes.filter(h=>roster.activeIds.includes(h.id)).map(cleanHero),equipment:JSON.parse(read('content/equipment.json')).equipment};
const assets = JSON.parse(read('references/visual-assets.json'));
for(const group of Object.values(assets))for(const asset of Object.values(group)){
  if(!fs.existsSync(path.join(root,'dist',asset)))throw Error('Missing visual asset '+asset);
}
for(const hero of catalog.heroes){
  if(!assets.heroes[hero.id])throw Error('Missing hero portrait '+hero.id);
  if(!['genghis','lancelot','caesar','yamato','augustus','taigong','beowulf'].includes(hero.id)&&!fs.existsSync(path.join(root,'dist/assets/silhouettes',hero.id+'.svg')))throw Error('Missing hero silhouette '+hero.id);
}
const data = {version:'pilot-2026-10-11-notion-selection-v1',problems:sources.flatMap(x=>x.problems),units:sources.flatMap(x=>x.units),links:sources.flatMap(x=>x.links),catalog,reservedHeroes:roster.heroes.filter(h=>roster.reservedIds.includes(h.id)).map(cleanHero),legacyEquipment:legacyCatalog.equipment,assets};
const C = require('./src/core.js');
const ids = new Set();
const excludedUnits = new Set(JSON.parse(read('content/scope-plan.json')).nextAssessment.excludedUnlearnedUnits);
for (const p of data.problems) {
  if(ids.has(p.id))throw Error('Duplicate problem '+p.id);ids.add(p.id);
  if(!/^https:\/\/(?:app\.)?notion\.(?:com|so)\//.test(p.source?.url||''))throw Error('Missing Notion selection source '+p.id);
  if((p.scopeUnits||[]).some(u=>excludedUnits.has(u)))throw Error('Unlearned lesson in selection '+p.id);
  if(!data.units.some(u=>u.id===p.unitId))throw Error('Missing unit '+p.unitId);
  if(!C.grade(p.answer.n+'/'+p.answer.d,p.answer).correct)throw Error('Invalid answer '+p.id);
  if(p.figureRequired&&(!p.figure||!fs.existsSync(path.join(root,'dist',p.figure))))throw Error('Missing figure '+p.id);
  if(p.category==='calc'){
    const s=C.calcScore(p.expression);
    if(!s.supported||!C.grade(s.answer.n+'/'+s.answer.d,p.answer).correct)throw Error('Calculation verification '+p.id);
    if(s.score!==p.score||s.star!==p.star)throw Error('Score mismatch '+p.id+' '+JSON.stringify(s));
  }
  if(p.explanation.steps.length<4||p.explanation.steps.length>8)throw Error('Explanation length '+p.id);
}
const json=JSON.stringify(data).replace(/</g,'\\u003c');
let html=read('src/shell.html');
for(const [key,value] of [['__DATA__',json],['/*__CSS__*/',read('src/style.css')+'\n'+read('src/campaign.css')+'\n'+read('src/visual-assets.css')+'\n'+read('src/opening.css')],['/*__CORE__*/',read('src/core.js')],['/*__GEAR__*/',read('src/gear.js')],['/*__APP__*/',read('src/app.js').replace('/*__CAMPAIGN_UI__*/',()=>read('src/campaign-ui.js'))]])html=html.replace(key,()=>value);
fs.writeFileSync(path.join(root,'dist/index.html'),html);
fs.writeFileSync(path.join(root,'content/combined.json'),JSON.stringify(data,null,2));
console.log(JSON.stringify({problems:data.problems.length,units:data.units.length,links:data.links.length,htmlBytes:Buffer.byteLength(html),heroes:catalog.heroes.length,equipment:catalog.equipment.length}));
