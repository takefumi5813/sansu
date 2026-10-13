const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = p => fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const sources = ['content/arithmetic.json','content/selected-calc.json','content/selected-calc-2.json','content/selected-calc-3.json','content/selected-calc-4.json','content/selected-oneline.json','content/selected-geometry.json','content/expedition-foundations.json','content/expedition-ratio-speed.json','content/expedition-geometry.json','content/expedition-ready.json','content/expedition-ready-2.json'].map(p=>JSON.parse(read(p)));
const legacyCatalog = JSON.parse(read('references/legacy-catalog.json'));
const roster=JSON.parse(read('content/heroes.json'));
const profiles=JSON.parse(read('content/hero-profiles.json')).profiles;
const cleanHero=({rank,unlockLevel,...hero})=>{const pr=profiles[hero.id];if(!pr||!pr.story||!pr.ability||!['soul','forge','mission','treasure','luck','echo','bond'].includes(pr.ability.type)||!pr.ability.name)throw Error('Missing hero profile/ability '+hero.id);return {...hero,...pr};};
const catalog = {...legacyCatalog,heroes:roster.heroes.filter(h=>roster.activeIds.includes(h.id)).map(cleanHero),equipment:JSON.parse(read('content/equipment.json')).equipment};
const assets = JSON.parse(read('references/visual-assets.json'));
for(const group of Object.values(assets))for(const asset of Object.values(group)){
  if(!fs.existsSync(path.join(root,'dist',asset)))throw Error('Missing visual asset '+asset);
}
for(const hero of catalog.heroes){
  if(!assets.heroes[hero.id])throw Error('Missing hero portrait '+hero.id);
  if(!['genghis','lancelot','caesar','yamato','augustus','taigong','beowulf'].includes(hero.id)&&!fs.existsSync(path.join(root,'dist/assets/silhouettes',hero.id+'.svg')))throw Error('Missing hero silhouette '+hero.id);
}
const data = {version:'pilot-2026-10-12-integrated-expedition-v2',problems:sources.flatMap(x=>x.problems),units:sources.flatMap(x=>x.units),links:sources.flatMap(x=>x.links),catalog,reservedHeroes:roster.heroes.filter(h=>roster.reservedIds.includes(h.id)).map(cleanHero),legacyEquipment:legacyCatalog.equipment,assets};
const C = require('./src/core.js');
// Canonical input for each answer format: single → "n/d", ratio → "a:b(:c)", clock → "(午前|午後)h時m分(s秒)", parts → array of each part's canonical input.
function canonicalRaw(spec){
  if(!spec||typeof spec!=='object')throw Error('Missing answer spec');
  if(Array.isArray(spec.parts)){if(!spec.parts.length)throw Error('Empty answer parts');return spec.parts.map(part=>{if(Array.isArray(part.parts))throw Error('Nested answer parts');return canonicalRaw(part);});}
  if(spec.dimension==='ratio'){if(!Array.isArray(spec.terms)||spec.terms.length<2)throw Error('Ratio needs 2+ terms');return spec.terms.join(':');}
  if(spec.dimension==='clock'){if(spec.h==null||spec.m==null)throw Error('Clock needs h and m');return (spec.ampm||'')+(spec.ampm?Number(spec.h)%12:Number(spec.h))+'時'+spec.m+'分'+(spec.s!=null&&spec.s!==''?spec.s+'秒':'');}
  return spec.n+'/'+spec.d;
}
const unitIds=new Set();
for(const u of data.units){
  if(unitIds.has(u.id))throw Error('Duplicate learning unit '+u.id);unitIds.add(u.id);
  const representatives=data.problems.filter(p=>p.unitId===u.id);
  if(representatives.length!==1||representatives[0].id!==u.representativeId)throw Error('Expected one representative per learning unit '+u.id);
}
for(const link of data.links)if(!unitIds.has(link.from)||!unitIds.has(link.to)||link.from===link.to)throw Error('Invalid learning link '+JSON.stringify(link));
const ids = new Set();
const excludedUnits = new Set(JSON.parse(read('content/scope-plan.json')).nextAssessment.excludedUnlearnedUnits);
for (const p of data.problems) {
  for(const key of ['記録','正答率','メモ','決め手','確度'])if(p.source?.notionProperties)delete p.source.notionProperties[key];
  if(!p.domain)p.domain=data.units.find(u=>u.id===p.unitId)?.domain;
  if(ids.has(p.id))throw Error('Duplicate problem '+p.id);ids.add(p.id);
  if(p.category!=='calc'&&(typeof p.domain!=='string'||!p.domain.trim()))throw Error('Missing subject domain '+p.id);
  if(p.category!=='calc'&&(!Number.isInteger(p.difficulty)||p.difficulty<1||p.difficulty>10))throw Error('Invalid difficulty '+p.id);
  if(!/^https:\/\/(?:app\.)?notion\.(?:com|so)\//.test(p.source?.url||'')&&!(p.source?.origin==='exam-pdf'&&/^\/算数DB\/原本\//.test(p.source.path||'')&&/p\.\d+/.test(p.source.locator||'')))throw Error('Missing Notion selection source '+p.id);
  if((p.scopeUnits||[]).some(u=>excludedUnits.has(u)))throw Error('Unlearned lesson in selection '+p.id);
  if(!data.units.some(u=>u.id===p.unitId))throw Error('Missing unit '+p.unitId);
  if(!C.grade(canonicalRaw(p.answer),p.answer).correct)throw Error('Invalid answer '+p.id);
  if(p.figureRequired&&(!p.figure||!fs.existsSync(path.join(root,'dist',p.figure))))throw Error('Missing figure '+p.id);
  if(p.category==='calc'){
    const s=p.expression.includes('□')?C.calcInverse(p.expression):C.calcScore(p.expression);
    if(!s.supported||!C.grade(s.answer.n+'/'+s.answer.d,p.answer).correct)throw Error('Calculation verification '+p.id);
    if(s.score!==p.score||s.star!==p.star)throw Error('Score mismatch '+p.id+' '+JSON.stringify(s));
  }
  if(p.explanation.steps.length<4||p.explanation.steps.length>8)throw Error('Explanation length '+p.id);
}
const json=JSON.stringify(data).replace(/</g,'\\u003c');
let html=read('src/shell.html');
for(const [key,value] of [['__DATA__',json],['/*__CSS__*/',read('src/style.css')+'\n'+read('src/campaign.css')+'\n'+read('src/visual-assets.css')+'\n'+read('src/opening.css')],['/*__CORE__*/',read('src/core.js')],['/*__GEAR__*/',read('src/gear.js')],['/*__APP__*/',read('src/app.js').replace('/*__CAMPAIGN_UI__*/',()=>read('src/campaign-ui.js')+'\n'+read('src/hero-ui.js'))]])html=html.replace(key,()=>value);
fs.writeFileSync(path.join(root,'dist/index.html'),html);
fs.writeFileSync(path.join(root,'content/combined.json'),JSON.stringify(data,null,2));
console.log(JSON.stringify({problems:data.problems.length,units:data.units.length,links:data.links.length,htmlBytes:Buffer.byteLength(html),heroes:catalog.heroes.length,equipment:catalog.equipment.length}));
