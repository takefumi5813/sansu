// 英雄の能力・紹介ページ・同行の編成。build.cjs が campaign-ui.js のあとに連結する（同じクロージャ内）。
// 能力の数値は core.js の HERO_ABILITIES を唯一の出どころにする（C.abilityValue）。
const ABILITY_INFO={
  soul:{label:'魂の導き',mark:'crystal',text:v=>`一行問題・図形を自力で正解すると、英雄の魂＋1（1日${v}回まで）`,short:v=>`正解で魂＋1（1日${v}回）`},
  forge:{label:'鍛冶の加護',mark:'sword',text:v=>`新しい計算を自力で正解すると、鍛造素材＋1（1日${v}回まで）`,short:v=>`計算で素材＋1（1日${v}回）`},
  mission:{label:'任務の誉れ',mark:'flame',text:v=>`今日の任務を達成すると追加の報酬。「鍛冶師の修練」で素材＋${v}、「英雄との契約」で魂＋${v}`,short:v=>`任務の報酬＋${v}`},
  treasure:{label:'宝探し',mark:'star',text:v=>`宝箱で装備が見つからなかったとき、宝石を${v}個多く拾う（宝石9個で次は装備が確定）`,short:v=>`宝石を${v}個多く拾う`},
  luck:{label:'幸運の星',mark:'star',text:v=>`宝箱で装備が見つかる確率が 10% から ${10+v}% に上がる`,short:v=>`宝箱の確率 ${10+v}%`},
  echo:{label:'召喚の縁',mark:'crystal',text:v=>`召喚の儀のあと、${v}%の確率で英雄の魂が1個もどってくる`,short:v=>`召喚で魂がもどる ${v}%`},
  bond:{label:'絆の語り部',mark:'shield',text:v=>`自由遠征で自力正解すると、同行の2人の絆がもう一段深まる（1日${v}回まで）`,short:v=>`絆がもう一段（1日${v}回）`}
};
const TIER_NAMES=['絆Lv.1〜3','絆Lv.4〜6','絆Lv.7〜10'];
const BOND_STEPS=[0,3,8,15,25,40,60,85,115,150];
let partySlot=0;
function heroById(id){return allHeroes().find(h=>h.id===id)||null;}
function ownsHero(id){return !!id&&state.inventory.heroes.includes(id);}
function partySlots(){const l=state.loadout||{};return [ownsHero(l.hero)?heroById(l.hero):null,ownsHero(l.partner)?heroById(l.partner):null];}
function partyHeroes(){return partySlots().filter(Boolean);}
function partyPayload(){return partyHeroes().filter(h=>h.ability&&ABILITY_INFO[h.ability.type]).map(h=>({id:h.id,type:h.ability.type}));}
function companion(){return partyHeroes()[0]||null;}
function heroTier(h){return C.abilityTier(state.heroBonds?.[h.id]||0);}
function abilityValueFor(h,tier=heroTier(h)){return C.abilityValue(h.ability?.type,tier);}
function abilityChip(h){const info=ABILITY_INFO[h?.ability?.type];if(!info)return '';return `<span class="ability-chip ability-${esc(h.ability.type)}">${icon(info.mark)}${esc(info.label)}</span>`;}
function abilityShort(h){const info=ABILITY_INFO[h?.ability?.type];return info?info.short(abilityValueFor(h)):'';}
function bondCard(hero,compact=false){
  if(!hero)return '';
  const b=C.bondProgress(state.heroBonds?.[hero.id]||0),lo=BOND_STEPS[b.level-1],hi=b.nextAt,pct=hi===null?100:Math.round((b.points-lo)/(hi-lo)*100);
  return `<div class="bond-card ${compact?'compact':''}" data-bond-hero="${esc(hero.id)}"><div class="bond-heading"><span>${compact?'絆':esc(hero.name)+'との絆'} <b>Lv.${b.level}${b.level===b.maxLevel?' MAX':''}</b></span>${b.level===b.maxLevel?'<span class="bond-power">生涯の盟友</span>':''}</div><div class="bond-meter" aria-hidden="true"><i style="width:${pct}%"></i></div></div>`;
}
function bondResult(bonds){
  const list=(Array.isArray(bonds)?bonds:bonds?[bonds]:[]).filter(b=>b&&b.gained);if(!list.length)return '';
  return list.map(b=>{const h=heroById(b.heroId);const up=b.level>b.previousLevel;return `<div class="bond-reward"><span class="bond-emblem">${icon('star')}</span><div><small>FREE EXPEDITION</small><strong>${esc(h?.name||'同行の英雄')}との絆が深まった</strong><span>${b.maxed?'絆 Lv.10 — 生涯の盟友へ。':up?`絆レベルが ${b.previousLevel} → ${b.level} に上がった！${C.abilityTier(BOND_STEPS[b.level-1])>C.abilityTier(BOND_STEPS[b.previousLevel-1])?' 能力が強くなった。':''}`:`絆 Lv.${b.level}`}</span></div></div>`;}).join('');
}
function abilityLogText(a){
  const h=heroById(a.heroId),info=ABILITY_INFO[a.type];if(!h||!info)return '';
  const what=a.type==='soul'?`英雄の魂 ＋${a.amount}`:a.type==='forge'?`鍛造素材 ＋${a.amount}`:a.type==='mission'?(a.currency==='souls'?`任務の報酬 魂 ＋${a.amount}`:`任務の報酬 素材 ＋${a.amount}`):a.type==='treasure'?`宝石を ${a.amount}個 多く拾った`:a.type==='luck'?`宝箱の確率 ${a.amount}% で装備を発見`:a.type==='bond'?'絆がもう一段深まった':'';
  return `<li><b>${esc(h.name)}</b>〈${esc(h.ability.name)}〉${esc(what)}</li>`;
}
function abilityResult(list){if(!Array.isArray(list)||!list.length)return '';const items=list.map(abilityLogText).join('');return items?`<div class="ability-reward"><small>同行の英雄の能力</small><ul>${items}</ul></div>`:'';}
function abilityTiersHtml(h){
  const info=ABILITY_INFO[h.ability?.type];if(!info)return '';const owned=ownsHero(h.id),now=owned?heroTier(h):0;
  return `<ol class="ability-tiers">${[1,2,3].map(t=>`<li class="${t===now?'current':''}${owned&&t<now?' passed':''}"><span>${TIER_NAMES[t-1]}</span><p>${esc(info.text(C.abilityValue(h.ability.type,t)))}</p>${t===now?'<em>いまの力</em>':''}</li>`).join('')}</ol>`;
}
function slotOf(id){const l=state.loadout||{};return l.hero===id?0:l.partner===id?1:-1;}
function heroProfileHtml(h){
  const owned=ownsHero(h.id),slot=slotOf(h.id),info=ABILITY_INFO[h.ability?.type];
  const actions=owned?`<div class="profile-actions">${[0,1].map(i=>`<button class="${slot===i?'quiet':'primary'}" data-assign="${esc(h.id)}" data-assign-slot="${i}" ${slot===i?'disabled':''}>${slot===i?`同行${i+1}にいます`:`同行${i+1}に入れる`}</button>`).join('')}${slot>=0?`<button class="quiet" data-unassign="${slot}">同行をはずす</button>`:''}</div>`:'<p class="profile-locked">まだ召喚していない英雄です。召喚の儀で出会えます。</p>';
  return `<article class="hero-profile"><button class="text-button profile-back" data-profile-back>← もどる</button><div class="profile-hero"><div class="profile-portrait">${owned?art(h,'profile-art'):anonymousHeroArt(h)}</div><div class="profile-identity"><span class="eyebrow">${esc(h.epithet||'')}</span><h3>${owned?esc(h.name):'？？？'}</h3><dl class="profile-facts"><div><dt>時代</dt><dd>${esc(h.era||'—')}</dd></div><div><dt>出身</dt><dd>${esc(h.origin||'—')}</dd></div></dl>${owned?bondCard(h,true):''}</div></div>${owned?`<section class="profile-story"><h4>どんな英雄？</h4><p>${esc(h.story||h.description)}</p></section>`:''}${info?`<section class="profile-ability"><div class="ability-head">${abilityChip(h)}<h4>${esc(h.ability.name)}</h4></div><p class="ability-flavor">${esc(h.ability.flavor||'')}</p>${abilityTiersHtml(h)}<p class="ability-note">能力は、同行（2人まで）にしているときだけ働きます。絆が深まるほど強くなります。</p></section>`:''}${actions}</article>`;
}
function partySlotHtml(h,i){
  const selected=partySlot===i;
  if(!h)return `<button class="party-slot empty ${selected?'selected':''}" data-slot="${i}" aria-pressed="${selected}"><span class="slot-label">同行${i+1}</span><span class="slot-empty-mark">＋</span><strong>あいています</strong><small>${selected?'下の英雄をタップして入れる':'タップしてえらぶ'}</small></button>`;
  return `<div class="party-slot ${selected?'selected':''}"><button class="slot-main" data-slot="${i}" aria-pressed="${selected}"><span class="slot-label">同行${i+1}${selected?' · 入れ替え中':''}</span>${art(h,'slot-art')}<strong>${esc(h.name)}</strong>${abilityChip(h)}<small>${esc(abilityShort(h))}</small></button>${bondCard(h,true)}<div class="slot-tools"><button class="text-button" data-hero-profile="${esc(h.id)}">紹介を見る</button><button class="text-button" data-unassign="${i}">はずす</button></div></div>`;
}
function partyHtml(){
  const slots=partySlots(),owned=allHeroes().filter(h=>ownsHero(h.id));
  if(slots[partySlot]&&!slots[1-partySlot])partySlot=1-partySlot;
  return `<section class="party-board"><div class="party-intro"><span class="eyebrow">YOUR PARTY</span><h3>同行する英雄（2人まで）</h3><p><b>① 入れ替えたい枠をタップ → ② 下の英雄をタップ</b>で入れ替わります。同行している英雄の能力が働き、自由遠征で自力正解すると2人との絆が深まります。</p></div><div class="party-slots">${slots.map(partySlotHtml).join('')}</div></section>${owned.length?`<section class="party-roster"><h3>契約した英雄 · ${owned.length}人</h3><p class="guild-description">いま選んでいる枠：<b>同行${partySlot+1}</b>。英雄をタップするとこの枠に入ります（もう一方の枠にいる英雄なら、入れ替わります）。</p><div class="roster-grid">${owned.map(h=>{const at=slotOf(h.id);return `<div class="roster-card ${at>=0?'in-party':''}"><button class="roster-pick" data-assign="${esc(h.id)}" data-assign-slot="${partySlot}" aria-label="${esc(h.name)}を同行${partySlot+1}に入れる">${art(h)}<strong>${esc(h.name)}</strong>${abilityChip(h)}<small>${esc(abilityShort(h))}</small>${at>=0?`<em class="party-badge">同行${at+1}</em>`:''}</button><button class="text-button" data-hero-profile="${esc(h.id)}">紹介</button></div>`;}).join('')}</div></section>`:`<p class="guild-description">まだ英雄と契約していません。英雄召喚で仲間を迎えましょう。</p>`}`;
}
function collectionHtml(){
  const card=h=>{const owned=ownsHero(h.id),at=slotOf(h.id);return `<button class="hero-collection ${owned?'owned':'locked'}" data-hero-profile="${esc(h.id)}" aria-label="${owned?esc(h.name)+'の紹介':'未召喚の英雄'}">${owned?art(h):anonymousHeroArt(h)}<div><small>${owned?(at>=0?`同行${at+1}`:'契約済み'):'未召喚'}</small><h3>${owned?esc(h.name):'？？？'}</h3>${owned?`<p class="collection-epithet">${esc(h.epithet||'')}</p>${abilityChip(h)}${bondCard(h,true)}`:abilityChip(h)}</div></button>`;};
  const reserved=(DATA.reservedHeroes||[]).filter(h=>ownsHero(h.id));
  return `<p class="guild-description">旅の仲間 ${activeHeroCount()} / ${DATA.catalog.heroes.length} · 装備 ${activeEquipmentCount()} / ${DATA.catalog.equipment.length}　<b>英雄をタップすると紹介ページ</b>が開きます。同行の入れ替えは「同行の編成」タブで。</p><button class="party-shortcut" data-guild-jump="party">${icon('shield')}同行の英雄を入れ替える<span>${partyHeroes().map(h=>esc(h.name)).join('・')||'まだいません'} ${icon('arrow')}</span></button><div class="hero-gallery">${DATA.catalog.heroes.map(card).join('')}</div>${reserved.length?`<section class="legacy-heroes"><h3>これまでの仲間</h3><div class="hero-gallery">${reserved.map(card).join('')}</div></section>`:''}${legacyEquipmentHtml()}`;
}
function partySidebarHtml(){
  const slots=partySlots();
  return `<section class="guild-card party-card"><div class="guild-heading"><span class="guild-icon">${icon('shield')}</span><span class="eyebrow">YOUR PARTY</span></div><h2>同行の英雄</h2><div class="party-mini">${slots.map((h,i)=>h?`<div class="party-mini-slot"><div class="mini-art">${art(h)}</div><div><small>同行${i+1} · 絆Lv.${C.bondProgress(state.heroBonds?.[h.id]||0).level}</small><strong>${esc(h.name)}</strong>${abilityChip(h)}</div></div>`:`<div class="party-mini-slot empty"><div class="mini-art">＋</div><div><small>同行${i+1}</small><strong>あいています</strong></div></div>`).join('')}</div><button id="party-open" class="guild-action">同行を入れ替える<span>${icon('arrow')}</span></button></section>`;
}
async function openHeroProfile(id,back='collection'){
  const h=heroById(id);if(!h)return;
  const dialog=$('#settings-dialog');dialog.classList.add('guild-dialog');$('.dialog-head h2').textContent=ownsHero(id)?h.name:'英雄の紹介';
  $('#settings-content').innerHTML=heroProfileHtml(h);if(!dialog.open)dialog.showModal();
  $('[data-profile-back]').onclick=()=>openGuild(back);
  bindHeroUi(()=>openHeroProfile(id,back));
  $('#settings-content').scrollTop=0;
}
async function assignHero(id,slot){
  if(!ownsHero(id)||(slot!==0&&slot!==1))return;
  await enqueue(s=>{if(!s.inventory.heroes.includes(id))return s;const next=clone(s);next.loadout=next.loadout||{hero:null,partner:null,equipment:[]};const keys=['hero','partner'],mine=keys[slot],other=keys[1-slot],prev=next.loadout[mine]||null;if(next.loadout[other]===id)next.loadout[other]=prev;next.loadout[mine]=id;if(next.loadout.partner&&next.loadout.partner===next.loadout.hero)next.loadout.partner=null;if(!next.loadout.hero&&next.loadout.partner){next.loadout.hero=next.loadout.partner;next.loadout.partner=null;}return next;});
}
async function unassignHero(slot){
  await enqueue(s=>{const next=clone(s);next.loadout=next.loadout||{hero:null,partner:null,equipment:[]};if(slot===0){next.loadout.hero=next.loadout.partner||null;next.loadout.partner=null;}else next.loadout.partner=null;return next;});
}
function bindHeroUi(rerender){
  $$('[data-hero-profile]').forEach(b=>b.onclick=()=>openHeroProfile(b.dataset.heroProfile,$('.guild-tabs .active')?.dataset.guild||'collection'));
  $$('[data-guild-jump]').forEach(b=>b.onclick=()=>openGuild(b.dataset.guildJump));
  $$('[data-slot]').forEach(b=>b.onclick=()=>{partySlot=Number(b.dataset.slot);openGuild('party');});
  $$('[data-assign]').forEach(b=>b.onclick=async()=>{const id=b.dataset.assign,slot=Number(b.dataset.assignSlot);await assignHero(id,slot);const h=heroById(id);toast(`${h?.name||'英雄'}が同行${slot+1}になりました。`);const slots=partySlots();if(!slots[1-slot])partySlot=1-slot;await rerender();$('.party-board')?.scrollIntoView({block:'start',behavior:'smooth'});if(view==='home')renderHome();});
  $$('[data-unassign]').forEach(b=>b.onclick=async()=>{await unassignHero(Number(b.dataset.unassign));partySlot=Number(b.dataset.unassign)===0&&!partySlots()[0]?0:partySlot;rerender();if(view==='home')renderHome();});
}
