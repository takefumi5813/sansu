(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const abs=x=>x<0n?-x:x;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a||1n;}
function rat(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('分母を0にはできません');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
const out=r=>({n:String(r.n),d:String(r.d)});
const plus=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d);
const times=(a,b)=>rat(a.n*b.n,a.d*b.d);
function dec(s){if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)||s.length>100)throw Error('数を入力してください');const sign=s[0]==='-'?-1n:1n;s=s.replace(/^[+-]/,'');const p=s.split('.');return rat(sign*BigInt((p[0]||'0')+(p[1]||'')),10n**BigInt((p[1]||'').length));}
function norm(s){return String(s).normalize('NFKC').replace(/[−–]/g,'-').replace(/[⁄／]/g,'/').trim();}
function number(s){let m=s.match(/^([+-]?\d+)(?:\s+|と)(\d+)\s*\/\s*(\d+)$/);if(m){const whole=BigInt(m[1]),a=BigInt(m[2]),b=BigInt(m[3]);if(!b||a>=b)throw Error('帯分数の分数部分を確かめてください');return rat((abs(whole)*b+a)*(m[1][0]==='-'?-1n:1n),b);}m=s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);return m?rat(m[1],m[2]):dec(s);}
const units={scalar:{'': '1'},length:{m:'1',cm:'1/100',mm:'1/1000',km:'1000','メートル':'1'},area:{'m2':'1','m^2':'1','㎡':'1','cm2':'1/10000','cm^2':'1/10000','平方センチメートル':'1/10000'},volume:{'m3':'1','cm3':'1/1000000',L:'1/1000',mL:'1/1000000'},time:{min:'1','分':'1',s:'1/60','秒':'1/60',h:'60','時間':'60'},speed:{'m/min':'1','m/分':'1','m/s':'60','km/h':'50/3'},percent:{'%':'1','パーセント':'1'}};
function unitNorm(s){return norm(s).replace(/²/g,'2').replace(/³/g,'3').replace(/\s/g,'');}
function parseSingleAnswer(raw,spec={}){try{let s=norm(raw);if(!s||s.length>200)throw Error('答えを入力してください');const m=s.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:(?:\s+|と)\d+\s*\/\s*\d+|\s*\/\s*\d+)?)(.*)$/);if(!m)throw Error('数値と単位を確かめてください');let r=number(m[1].trim());const dim=spec.dimension||'scalar',canonical=unitNorm(spec.unit||''),given=unitNorm(m[2]||canonical);const sourceMap=spec.acceptedUnits?{[canonical]:'1',...spec.acceptedUnits}:(units[dim]||{});const map={};for(const [key,value] of Object.entries(sourceMap))map[unitNorm(key)]=value;if(given!==canonical){if(map[given]==null||map[canonical]==null)throw Error('指定された単位で入力してください');const a=typeof map[given]==='object'?rat(map[given].n,map[given].d):number(String(map[given]));const b=typeof map[canonical]==='object'?rat(map[canonical].n,map[canonical].d):number(String(map[canonical]));r=times(r,times(a,rat(b.d,b.n)));}return {valid:true,value:out(r)};}catch(e){return {valid:false,error:e.message};}}
function parseAnswer(raw,spec={}){
 if(isParts(spec)){const g=gradeParts(raw,spec);return g.valid?{valid:true,value:g.normalized}:{valid:false,error:g.error};}
 if(isRatio(spec))return parseRatio(raw,spec);
 if(isClock(spec)){const p=parseClock(raw,spec);return p.valid?{valid:true,value:p.value}:p;}
 const s=norm(raw).replace(/\s/g,'');
 if(spec.dimension==='time'&&s.length<=200){
  const parts=[...s.matchAll(/(\d+\/\d+|\d+(?:\.\d+)?|\.\d+)(時間|分|秒)/g)];
  if(parts.length>=2&&parts.map(p=>p[0]).join('')===s){
   let total=rat(0),previous=4;const order={'時間':3,'分':2,'秒':1};
   for(const part of parts){
    if(order[part[2]]>=previous)return {valid:false,error:'時間・分・秒の順で、各単位を1回ずつ入力してください'};
    previous=order[part[2]];const value=parseSingleAnswer(part[0],spec);if(!value.valid)return value;
    total=plus(total,rat(value.value.n,value.value.d));
   }
   return {valid:true,value:out(total)};
  }
 }
 return parseSingleAnswer(raw,spec);
}
function gradeSingle(raw,spec){const p=parseAnswer(raw,spec);if(!p.valid)return p;const a=rat(p.value.n,p.value.d),b=rat(spec.n,spec.d);return {valid:true,correct:a.n===b.n&&a.d===b.d,normalized:p.value};}
// Answer formats: single {n,d,unit,dimension}; ratio {dimension:'ratio',terms:[...]}; clock {dimension:'clock',h,m,s?,ampm?}; multiple fields {parts:[{label,...single|ratio|clock}]}.
const RATIO_HINT='最も簡単な整数の比で答えよう';
const isRatio=spec=>!!spec&&spec.dimension==='ratio'&&Array.isArray(spec.terms);
const isParts=spec=>!!spec&&Array.isArray(spec.parts);
function parseRatio(raw,spec){
 if(typeof raw!=='string'&&typeof raw!=='number')return {valid:false,error:'答えを入力してください'};
 const s=norm(raw).replace(/\s/g,'');if(!s)return {valid:false,error:'答えを入力してください'};if(s.length>200)return {valid:false,error:'比を確かめてください'};
 const items=s.split(/[:対∶]/),count=spec.terms.length;
 if(items.length!==count)return {valid:false,error:count+'つの数を「：」で区切って入力してください'};
 if(items.some(x=>!/^\d+$/.test(x)))return {valid:false,error:'比の各項は整数で入力しよう（'+RATIO_HINT+'）'};
 const terms=items.map(x=>BigInt(x));if(terms.some(x=>x===0n))return {valid:false,error:'比の各項は0より大きい整数で入力してください'};
 return {valid:true,value:{terms:terms.map(String)}};
}
function gradeRatio(raw,spec){
 const p=parseRatio(raw,spec);if(!p.valid)return p;
 const given=p.value.terms.map(x=>BigInt(x)),expected=spec.terms.map(x=>BigInt(norm(x)));
 const g=given.reduce((a,b)=>gcd(a,b)),e=expected.reduce((a,b)=>gcd(a,b)),correct=g===1n&&given.every((x,i)=>x===expected[i]);
 const result={valid:true,correct,normalized:p.value};
 // Equivalent but not reduced (6:4 for 3:2): recorded as incorrect, with a hint.
 if(!correct&&g>1n&&given.every((x,k)=>x/g===expected[k]/e)){result.error=RATIO_HINT;result.hint=RATIO_HINT;}
 return result;
}
// Clock: {dimension:'clock',h:'0'..'23'(24h),m,s?,ampm?:'午前'|'午後',unit:''}. ampm only says the answer must be written with 午前/午後.
const CLOCK_HINT='午前・午後もつけて答えよう';
const isClock=spec=>!!spec&&spec.dimension==='clock';
const clockInt=(x,max)=>{const t=x==null?'':norm(x);return /^\d{1,2}$/.test(t)&&Number(t)<=max?Number(t):null;};
function clockSpec(spec){
 const h=clockInt(spec.h,23),m=clockInt(spec.m,59),sec=spec.s==null||spec.s===''?0:clockInt(spec.s,59);
 if(h===null||m===null||sec===null)return null;
 if(spec.ampm!=null&&!(spec.ampm==='午前'&&h<12||spec.ampm==='午後'&&h>=12))return null;
 return {h,m,s:sec};
}
function parseClock(raw,spec){
 if(typeof raw!=='string'&&typeof raw!=='number')return {valid:false,error:'答えを入力してください'};
 const s=norm(raw).replace(/\s/g,'');if(!s)return {valid:false,error:'答えを入力してください'};
 const m=s.length<=40&&(s.match(/^(午前|午後)?(\d{1,2})時(?:(\d{1,2})分(?:(\d{1,2})秒)?)?$/)||s.match(/^(午前|午後)?(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/));
 if(!m)return {valid:false,error:'「8時19分」のように時刻で答えよう'};
 const ampm=m[1]||null,h=Number(m[2]),min=m[3]===undefined?0:Number(m[3]),sec=m[4]===undefined?null:Number(m[4]);
 if(h>(ampm?12:23)||min>59||(sec??0)>59)return {valid:false,error:ampm?'午前・午後のときは0〜12時で入力してください':'時は0〜23、分・秒は0〜59で入力してください'};
 // 午前12時 is 0時, 午後 adds 12 (午後0時=12時, 午後12時=12時).
 const h24=ampm?h%12+(ampm==='午後'?12:0):h,value={h:String(h24),m:String(min)};if(sec!==null)value.s=String(sec);if(ampm)value.ampm=ampm;
 return {valid:true,value,hour:h};
}
function gradeClock(raw,spec){
 const e=clockSpec(spec);if(!e)return {valid:false,error:'答えの形式を確認できません'};
 const p=parseClock(raw,spec);if(!p.valid)return p;
 const v=p.value,secs=(h,m,s)=>(h*60+m)*60+s,given=secs(Number(v.h),Number(v.m),Number(v.s||0));
 // Answer that must name 午前/午後, input in 12-hour form without it (hour ≤12 matching h or h-12):
 // accepted unless the problem itself requires 午前/午後 (requireAmpm:true); then a 午後 answer gets a hint.
 if(spec.ampm&&!v.ampm&&p.hour<=12&&(p.hour===e.h||p.hour===e.h-12)&&secs(0,Number(v.m),Number(v.s||0))===secs(0,e.m,e.s)){
  if(spec.ampm==='午前'||spec.requireAmpm!==true)return {valid:true,correct:true,normalized:v};
  return {valid:true,correct:false,normalized:v,error:CLOCK_HINT,hint:CLOCK_HINT};
 }
 return {valid:true,correct:given===secs(e.h,e.m,e.s),normalized:v};
}
function formatClock(spec){
 const h=Number(norm(spec.h)),hour=spec.ampm?spec.ampm+(h%12):String(h),sec=spec.s!=null&&spec.s!==''&&Number(norm(spec.s))!==0?Number(norm(spec.s))+'秒':'';
 return hour+'時'+Number(norm(spec.m))+'分'+sec;
}
function gradeOne(raw,spec){if(!spec||typeof spec!=='object'||isParts(spec))return {valid:false,error:'答えの形式を確認できません'};if(isRatio(spec))return gradeRatio(raw,spec);if(isClock(spec))return gradeClock(raw,spec);if(Array.isArray(raw))return {valid:false,error:'答えを入力してください'};return gradeSingle(raw,spec);}
function gradeParts(raw,spec){
 if(!spec.parts.length)return {valid:false,error:'答えの形式を確認できません'};
 if(!Array.isArray(raw)||raw.length!==spec.parts.length)return {valid:false,error:'すべての欄に答えを入力してください',parts:spec.parts.map(()=>({valid:false,correct:false}))};
 const results=spec.parts.map((part,i)=>gradeOne(raw[i],part)),parts=results.map(r=>{const x={valid:!!r.valid,correct:!!r.correct};if(r.error)x.error=r.error;if(r.hint)x.hint=r.hint;return x;});
 const label=i=>spec.parts[i].label||'('+(i+1)+')',bad=results.findIndex(r=>!r.valid);
 if(bad>=0)return {valid:false,error:label(bad)+' '+results[bad].error,invalidPart:bad,parts};
 const result={valid:true,correct:results.every(r=>r.correct),normalized:results.map(r=>r.normalized),parts};
 const hinted=results.findIndex(r=>r.hint);if(hinted>=0){result.hint=label(hinted)+' '+results[hinted].hint;result.error=result.hint;}
 return result;
}
// Single answers keep the original path unchanged (gradeSingle), including raw coercion.
function grade(raw,spec){if(isParts(spec))return gradeParts(raw,spec);if(isRatio(spec))return gradeRatio(raw,spec);if(isClock(spec))return gradeClock(raw,spec);return gradeSingle(raw,spec);}
function formatAnswer(spec){
 if(!spec)return '';
 if(isParts(spec))return spec.parts.map((p,i)=>(p.label||'('+(i+1)+')')+' '+formatAnswer(p)).join('　');
 if(isRatio(spec))return spec.terms.map(x=>norm(x)).join('：');
 if(isClock(spec))return formatClock(spec);
 const value=String(spec.d)==='1'?String(spec.n):spec.n+'/'+spec.d,plain=spec.unit?value+' '+spec.unit:value;
 if(spec.dimension==='time'&&String(spec.d)==='1'&&/^\d+$/.test(String(spec.n))){const n=Number(spec.n),u=unitNorm(spec.unit||'');
  if((u==='秒'||u==='s')&&n>=60)return Math.floor(n/60)+'分'+(n%60?n%60+'秒':'')+'（'+plain+'）';
  if((u==='分'||u==='min')&&n>=60)return Math.floor(n/60)+'時間'+(n%60?n%60+'分':'')+'（'+plain+'）';}
 return plain;
}
function initialState(){return {schemaVersion:1,xp:0,stars:0,materials:0,souls:0,heroBonds:{},bondRuleVersion:2,heroSummons:0,heroEchoes:0,heroExchangeOffers:[],equipmentBoxes:0,equipmentTraining:{'starter-dagger':1},equipmentDiscoveries:0,gearPity:0,loadout:{hero:null,partner:null,equipment:['starter-dagger']},units:{},attempts:[],rewards:{},daily:{},drafts:{},inventory:{heroes:[],equipment:['starter-dagger']}};}
function normalizeState(state){const s=clone(state||initialState());if(s.materials==null)s.materials=0;if(s.souls==null)s.souls=0;if(s.heroBonds===undefined)s.heroBonds={};if(s.bondRuleVersion===undefined){if(s.heroBonds&&typeof s.heroBonds==='object'&&!Array.isArray(s.heroBonds)){for(const [id,value] of Object.entries(s.heroBonds))if(Number.isInteger(value)&&value>=0&&value<=300)s.heroBonds[id]=Math.min(value,150);}s.bondRuleVersion=2;}if(s.heroSummons==null)s.heroSummons=0;if(s.heroEchoes===undefined)s.heroEchoes=0;if(s.heroExchangeOffers===undefined)s.heroExchangeOffers=[];if(s.equipmentBoxes==null)s.equipmentBoxes=0;if(s.equipmentTraining==null)s.equipmentTraining={};if(s.equipmentDiscoveries==null)s.equipmentDiscoveries=0;if(s.gearPity==null)s.gearPity=0;if(!s.inventory.equipment.includes('starter-dagger'))s.inventory.equipment.push('starter-dagger');if(s.equipmentTraining['starter-dagger']==null)s.equipmentTraining['starter-dagger']=1;if(s.loadout==null)s.loadout={hero:null,partner:null,equipment:[]};if(s.loadout.hero===undefined)s.loadout.hero=null;if(s.loadout.partner===undefined||(s.loadout.partner!==null&&s.loadout.partner===s.loadout.hero))s.loadout.partner=null;if(s.loadout.equipment.length<3&&!s.loadout.equipment.includes('starter-dagger'))s.loadout.equipment.push('starter-dagger');for(const d of Object.values(s.daily||{})){if(d.completed==null)d.completed=[];if(d.calcPaid==null)d.calcPaid=[];if(d.chainXp==null)d.chainXp=0;}return s;}
function migrateHeroRoster(state,reservedIds){const next=normalizeState(state),reserved=new Set(Array.isArray(reservedIds)?reservedIds.filter(id=>typeof id==='string'):[]);if(Array.isArray(next.heroExchangeOffers))next.heroExchangeOffers=next.heroExchangeOffers.filter(id=>typeof id!=='string'||!reserved.has(id));return next;}
function heroCatalogValid(heroes){return Array.isArray(heroes)&&heroes.length>0&&heroes.every(h=>h&&typeof h.id==='string'&&h.id.length>0)&&new Set(heroes.map(h=>h.id)).size===heroes.length;}
function summonHero(state,heroes,{random=Math.random,party=[]}={}){
 const fail=error=>({state,result:{valid:false,error}}),count=state.heroSummons??0,echoes=state.heroEchoes===undefined?0:state.heroEchoes;
 if(!Number.isSafeInteger(state.souls)||state.souls<3)return fail('召喚には英雄の魂が3個必要です');
 if(!Number.isSafeInteger(count)||count<0||count>=Number.MAX_SAFE_INTEGER)return fail('召喚回数の形式を確認できません');
 if(!Number.isSafeInteger(echoes)||echoes<0||echoes>=Number.MAX_SAFE_INTEGER)return fail('英雄の残響の記録を確認できません');
 if(!heroCatalogValid(heroes))return fail('英雄の一覧を確認できません');
 if(!Array.isArray(state.inventory?.heroes))return fail('所有英雄の記録を確認できません');
 let roll;try{roll=random();}catch(_){return fail('召喚の抽選に失敗しました');}if(!Number.isFinite(roll)||roll<0||roll>=1)return fail('召喚の抽選値を確認できません');
 const selected=heroes[Math.floor(roll*heroes.length)],next=normalizeState(state),duplicate=next.inventory.heroes.includes(selected.id),echoesGained=duplicate?1:0,summonCount=count+1;
 next.souls-=3;next.heroSummons=summonCount;next.heroEchoes+=echoesGained;if(!duplicate)next.inventory.heroes.push(selected.id);
 joinParty(next,selected.id);
 let refund=0,refundHeroId=null;const echo=partyOf(next,party).filter(h=>h.type==='echo');const chance=Math.min(80,echo.reduce((n,h)=>n+abilityValue('echo',h.tier),0))/100;
 if(chance>0){let roll2;try{roll2=random();}catch(_){roll2=1;}if(Number.isFinite(roll2)&&roll2<chance){refund=1;next.souls+=1;refundHeroId=echo[Math.min(echo.length-1,Math.floor(roll2/chance*echo.length))].id;}}
 const result={valid:true,heroId:selected.id,duplicate,cost:3,refund,echoesGained,summonCount,guaranteed:false};if(refundHeroId)result.refundHeroId=refundHeroId;
 return {state:next,result};
}
function exchangeOffersValid(offers,heroes){return Array.isArray(offers)&&offers.length<=3&&offers.every(id=>typeof id==='string'&&heroes.some(h=>h.id===id))&&new Set(offers).size===offers.length;}
function prepareHeroExchange(state,heroes,{random=Math.random}={}){
 const fail=error=>({state,result:{valid:false,error}}),echoes=state.heroEchoes===undefined?0:state.heroEchoes,offers=state.heroExchangeOffers===undefined?[]:state.heroExchangeOffers;
 if(!Number.isSafeInteger(echoes)||echoes<3)return fail('英雄との交換には残響が3個必要です');
 if(!heroCatalogValid(heroes))return fail('英雄の一覧を確認できません');
 if(!Array.isArray(state.inventory?.heroes))return fail('所有英雄の記録を確認できません');
 if(!exchangeOffersValid(offers,heroes))return fail('交換候補の記録を確認できません');
 const owned=new Set(state.inventory.heroes),kept=offers.filter(id=>!owned.has(id)),pool=heroes.map(h=>h.id).filter(id=>!owned.has(id)&&!kept.includes(id));
 const target=Math.min(3,heroes.filter(h=>!owned.has(h.id)).length),nextOffers=[];
 for(let i=0;i<Math.max(offers.length,target);i++){
  if(i<offers.length&&!owned.has(offers[i])){nextOffers.push(offers[i]);continue;}
  if(nextOffers.length+kept.filter(id=>offers.indexOf(id)>i).length>=target)continue;
  let roll;try{roll=random();}catch(_){return fail('交換候補の抽選に失敗しました');}
  if(!Number.isFinite(roll)||roll<0||roll>=1)return fail('交換候補の抽選値を確認できません');
  nextOffers.push(pool.splice(Math.floor(roll*pool.length),1)[0]);
 }
 if(state.heroExchangeOffers!==undefined&&JSON.stringify(nextOffers)===JSON.stringify(offers))return {state,result:{valid:true,offers:[...offers]}};
 const next=normalizeState(state);next.heroExchangeOffers=nextOffers;return {state:next,result:{valid:true,offers:[...nextOffers]}};
}
function exchangeHero(state,heroes,heroId){
 const fail=error=>({state,result:{valid:false,error}}),echoes=state.heroEchoes===undefined?0:state.heroEchoes,offers=state.heroExchangeOffers===undefined?[]:state.heroExchangeOffers;
 if(!Number.isSafeInteger(echoes)||echoes<3)return fail('英雄との交換には残響が3個必要です');
 if(!heroCatalogValid(heroes)||typeof heroId!=='string'||!heroes.some(h=>h.id===heroId))return fail('交換する英雄を確認できません');
 if(!Array.isArray(state.inventory?.heroes))return fail('所有英雄の記録を確認できません');
 if(!exchangeOffersValid(offers,heroes))return fail('交換候補の記録を確認できません');
 if(state.inventory.heroes.includes(heroId))return fail('この英雄とはすでに契約しています');
 if(!offers.includes(heroId))return fail('現在の交換候補から英雄を選んでください');
 const next=normalizeState(state);next.heroEchoes-=3;next.heroExchangeOffers=[];next.inventory.heroes.push(heroId);joinParty(next,heroId);
 return {state:next,result:{valid:true,heroId,cost:3}};
}
// 英雄の能力。tiers は絆Lv1〜3／4〜6／7〜10 の値。説明文は UI 側（campaign-ui.js）と同じ数値を使う。
const HERO_ABILITIES={soul:{tiers:[1,2,3]},forge:{tiers:[2,3,4]},mission:{tiers:[1,2,3]},treasure:{tiers:[1,2,3]},luck:{tiers:[5,10,15]},echo:{tiers:[20,30,40]},bond:{tiers:[1,2,3]}};
function abilityTier(points){const l=bondProgress(points).level;return l>=7?3:l>=4?2:1;}
function abilityValue(type,tier){return HERO_ABILITIES[type]?HERO_ABILITIES[type].tiers[Math.max(1,Math.min(3,tier))-1]:0;}
function joinParty(s,id){s.loadout=s.loadout||{hero:null,partner:null,equipment:[]};if(!s.loadout.hero)s.loadout.hero=id;else if(!s.loadout.partner&&s.loadout.hero!==id)s.loadout.partner=id;}
function partyOf(s,party){if(!Array.isArray(party))return [];const owned=s.inventory?.heroes||[],seen=new Set(),out=[];for(const h of party){if(!h||typeof h.id!=='string'||!HERO_ABILITIES[h.type]||!owned.includes(h.id)||seen.has(h.id))continue;seen.add(h.id);out.push({id:h.id,type:h.type,tier:abilityTier(s.heroBonds?.[h.id]||0)});if(out.length===2)break;}return out;}
function useAbility(s,day,hero){const d=daily(s,day);d.abilityUses=d.abilityUses||{};const used=d.abilityUses[hero.id]||0;if(used>=abilityValue(hero.type,hero.tier))return false;d.abilityUses[hero.id]=used+1;return true;}
function bondProgress(points){points=Number.isFinite(Number(points))?Math.max(0,Math.min(150,Math.floor(Number(points)))):0;const thresholds=[0,3,8,15,25,40,60,85,115,150];let level=1;while(level<10&&points>=thresholds[level])level++;const nextAt=level===10?null:thresholds[level];return {points,level,maxLevel:10,maxPoints:150,nextAt,remaining:nextAt===null?0:nextAt-points,power:100+(level-1)*10};}
function companionIds(s,o){const raw=Array.isArray(o.party)&&o.party.length?o.party.map(h=>h&&h.id):Array.isArray(o.heroIds)?o.heroIds:[o.heroId];const out=[];for(const id of raw)if(typeof id==='string'&&s.inventory.heroes.includes(id)&&!out.includes(id)&&out.length<2)out.push(id);return out;}
function awardBond(s,p,o,qualified,log){if(!qualified||p.category==='calc'||o.purpose!=='normal'||o.mode!=='all')return null;const ids=companionIds(s,o);if(!ids.length)return null;const key='bond:'+o.day+':'+p.unitId;if(s.rewards[key])return null;
 const tellers=partyOf(s,o.party).filter(h=>h.type==='bond'&&ids.includes(h.id));let extra=0,teller=null;for(const h of tellers)if(useAbility(s,o.day,h)){extra=1;teller=h.id;break;}
 const out=[];for(const id of ids){const previous=bondProgress(s.heroBonds[id]||0);if(previous.points>=150)continue;const next=bondProgress(previous.points+1+extra);s.heroBonds[id]=next.points;out.push({heroId:id,gained:next.points-previous.points,points:next.points,level:next.level,previousLevel:previous.level,maxed:next.points===150});}
 if(!out.length)return null;s.rewards[key]={xp:0,stars:0,materials:0,souls:0,heroId:ids[0],heroIds:ids,bond:1};if(teller&&log)log.push({heroId:teller,type:'bond',amount:1});return out;}
function dayKey(now=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
function addDays(day,n){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Invalid day');const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function level(xp){return xp>=12000?900:Math.floor(900-899*Math.exp(-Math.max(0,xp)/1500));}
function status(s,p){return s.units[p.unitId]||{stage:0,highestStageEver:0,due:null,dueReason:null,awardedStages:[]};}
function remaining(p,state,day){const u=status(state,p);return u.stage!==4&&((u.stage===0&&!u.due)||(u.due&&u.due<=day));}
function inScope(p,scope,mode='gnorev'){return !p.expeditionOnly&&(p.homeStudy||(mode==='review'&&p.reviewEligible===true))&&(p.scopeUnits||[]).some(x=>(scope||[]).includes(x));}
function getCampaignStatus(problems,state,filters={},day=dayKey()){
 const valid=problems.filter(p=>p.category!=='calc'&&(!p.figureRequired||p.figure)&&!(Number(filters.grade||5)===5&&p.difficulty>8)&&remaining(p,state,day));
 const count=(scope,mode)=>new Set(valid.filter(p=>inScope(p,scope,mode)).map(p=>p.unitId)).size;
 const review=count(filters.recentUnits,'review'),gnorev=count(filters.scopeUnits,'gnorev');return {review,gnorev,allUnlocked:review===0&&gnorev===0};
}
function eligible(p,f={}){
 if(f.category&&p.category!==f.category)return false;if(p.figureRequired&&!p.figure)return false;
 if(p.category==='calc')return !f.star||p.star===Number(f.star);
 if(Number(f.grade||5)===5&&p.difficulty>8)return false;
 const tier=f.tier||'standard',range={standard:[1,4],advanced:[5,6],hard:[7,10]}[tier];if(!range||p.difficulty<range[0]||p.difficulty>range[1])return false;
 if(f.domains?.length&&!f.domains.includes(p.domain)&&!f.domains.some(d=>(p.domains||[]).includes(d)))return false;
 if(f.mode==='review'&&!inScope(p,f.recentUnits,'review'))return false;if(f.mode==='gnorev'&&!inScope(p,f.scopeUnits))return false;return true;
}
function selectProblem(problems,state,filters={},day=dayKey()){
 if(filters.category!=='calc'&&(filters.mode||'all')==='all'&&!getCampaignStatus(problems,state,filters,day).allUnlocked)return null;
 const seen=new Set(),targeted=['review','gnorev'].includes(filters.mode);
 const active=Object.values(state.units).filter(u=>u.stage<4&&(u.stage>0||u.due)).length;
 const soon=Object.values(state.units).filter(u=>u.due&&u.due>=day&&u.due<=addDays(day,7)).length;
 const allowNew=targeted||(active<60&&soon<5);
 return problems.filter(p=>eligible(p,filters)).map(p=>{const u=status(state,p),due=u.due&&u.due<=day;
  if(p.category==='calc'){const count=state.attempts.filter(a=>a.day===day&&a.problemId===p.id&&a.purpose==='normal').length;return {p,rank:2,date:'',count};}
  if(seen.has(p.unitId))return {p,rank:99,date:''};seen.add(p.unitId);
  return {p,rank:u.stage===4?99:due?(u.dueReason==='repair'?0:1):u.stage===0&&!u.due&&allowNew?2:99,date:u.due||'',count:0};
 }).filter(x=>x.rank<99).sort((a,b)=>a.rank-b.rank||a.date.localeCompare(b.date)||a.count-b.count||a.p.id.localeCompare(b.p.id))[0]?.p||null;
}
function reward(s,key,xp=0,materials=0,souls=0){if(s.rewards[key])return false;s.rewards[key]={xp,stars:0,materials,souls};s.xp+=xp;s.materials+=materials;s.souls+=souls;return true;}
function daily(s,day){return s.daily[day]||(s.daily[day]={completed:[],calcPaid:[],chainXp:0});}
const expressionKey=p=>norm(p.expression||p.text).replace(/[×✕]/g,'*').replace(/÷/g,'/').replace(/\s/g,'');
function learningCurrency(s,p,day,checkpoint=false){const unit='learning:'+day+':'+p.unitId,expr='calc-material:'+day+':'+expressionKey(p);if(p.category!=='calc')return reward(s,unit,0,0,1);if(s.rewards[expr]||(checkpoint&&s.rewards[unit]))return false;reward(s,expr,0,1,0);reward(s,unit);return true;}
function markComplete(s,p,a,random=Math.random,ctx=null){const party=ctx?partyOf(s,ctx.party):[],log=ctx?ctx.log:[];const d=daily(s,a.day),key=p.category==='calc'?'calc:'+p.id:'unit:'+p.unitId;a.completed=true;if(d.completed.includes(key))return;d.completed.push(key);const calc=d.completed.filter(x=>x.startsWith('calc:')).length,noncalc=d.completed.filter(x=>x.startsWith('unit:')).length;if(p.category==='calc'&&calc===5&&reward(s,'daily-material:'+a.day,0,5,0)){const missesBefore=s.gearPity,guaranteed=missesBefore===9,luck=party.filter(h=>h.type==='luck'),chance=0.1+Math.min(45,luck.reduce((n,h)=>n+abilityValue('luck',h.tier),0))/100,won=guaranteed||random()<chance;let bonusGems=0;const finders=[];if(!won)for(const h of party.filter(h=>h.type==='treasure')){const add=Math.min(abilityValue('treasure',h.tier),9-(missesBefore+1+bonusGems));if(add>0){bonusGems+=add;finders.push(h.id);}}s.gearPity=won?0:missesBefore+1+bonusGems;d.equipmentLottery={won,guaranteed,missesBefore,missesAfter:s.gearPity};if(luck.length)d.equipmentLottery.chance=Math.round(chance*100);if(bonusGems){d.equipmentLottery.bonusGems=bonusGems;d.equipmentLottery.gemHeroIds=finders;for(const id of finders)log.push({heroId:id,type:'treasure',amount:bonusGems});}if(won&&!guaranteed&&luck.length)log.push({heroId:luck[0].id,type:'luck',amount:Math.round(chance*100)});s.rewards['daily-material:'+a.day].equipmentLottery={...d.equipmentLottery};if(won){s.equipmentBoxes++;s.rewards['daily-material:'+a.day].equipmentBoxes=1;}for(const h of party.filter(h=>h.type==='mission')){const v=abilityValue('mission',h.tier);if(reward(s,'ability-mission:'+a.day+':calc:'+h.id,0,v,0))log.push({heroId:h.id,type:'mission',amount:v,currency:'materials'});}}if(p.category!=='calc'&&noncalc===2&&reward(s,'daily-soul:'+a.day,0,0,2)){for(const h of party.filter(h=>h.type==='mission')){const v=abilityValue('mission',h.tier);if(reward(s,'ability-mission:'+a.day+':soul:'+h.id,0,0,v))log.push({heroId:h.id,type:'mission',amount:v,currency:'souls'});}}}
function commitAttempt(state,p,options){
 const o={purpose:'normal',...options},spec=o.purpose==='variant'?p.variant?.answer:p.answer;
 if(!spec)return {state,result:{valid:false,error:'数値替えがありません'}};const g=grade(o.raw,spec);if(!g.valid)return {state,result:g};
 if(!o.id||!/^\d{4}-\d{2}-\d{2}$/.test(o.day||''))return {state,result:{valid:false,error:'解答IDと日付が必要です'}};
 const previous=state.attempts.find(a=>a.id===o.id);if(previous){const result={...previous.result,materials:previous.result.materials||0,souls:previous.result.souls||0,equipmentBoxes:previous.result.equipmentBoxes||0,duplicate:true};delete result.equipmentLottery;return {state,result};}
 const old=status(state,p),due=(!old.due&&old.stage===0)||(old.due&&old.due<=o.day);
 if(p.category!=='calc'&&o.purpose==='normal'&&due&&old.stage===3&&g.correct&&!o.assisted&&o.checkpointPassed==null)return {state,result:{...g,needsGraduationCheck:true,xp:0,stars:0,materials:0,souls:0,equipmentBoxes:0,stage:3,due:old.due}};
 const s=normalizeState(state),startXp=s.xp,startMaterials=s.materials,startSouls=s.souls,startBoxes=s.equipmentBoxes,a={id:o.id,day:o.day,problemId:p.id,unitId:p.unitId,category:p.category,purpose:o.purpose,mode:o.mode||null,heroId:o.heroId||(Array.isArray(o.party)&&o.party[0]?.id)||null,heroIds:Array.isArray(o.party)?o.party.map(h=>h&&h.id).filter(x=>typeof x==='string'):(o.heroId?[o.heroId]:[]),correct:g.correct,assisted:!!o.assisted,completed:false};
 const d=daily(s,o.day),hadLottery=!!d.equipmentLottery,ctx={party:o.party,log:[]};let u=clone(old),paid=false;
 if(o.purpose==='normal'){
  if(p.category==='calc'){
   if(g.correct&&!o.assisted){const expr=expressionKey(p);if(!d.calcPaid.includes(expr)){d.calcPaid.push(expr);paid=reward(s,'calc:'+o.day+':'+expr,[0,3,5,7][p.star]||0);learningCurrency(s,p,o.day);}markComplete(s,p,a,o.random,ctx);}
   else if(o.checkpointPassed){learningCurrency(s,p,o.day,true);markComplete(s,p,a,o.random,ctx);}
  }else if(due&&u.stage!==4){
   const pass=g.correct&&!o.assisted&&!(old.stage===3&&o.checkpointPassed===false);
   if(pass){u.stage++;u.highestStageEver=Math.max(u.highestStageEver||0,u.stage);u.due=u.stage===4?null:addDays(o.day,[0,14,60,180][u.stage]);u.dueReason=u.stage===4?null:'review';u.awardedStages=u.awardedStages||[];
    if(!u.awardedStages.includes(u.stage)){u.awardedStages.push(u.stage);const xp=p.difficulty<=4?5:p.difficulty<=6?7:p.difficulty<=8?8:p.difficulty===9?9:10;paid=reward(s,'stage:'+p.unitId+':'+u.stage,xp);}
    learningCurrency(s,p,o.day);markComplete(s,p,a,o.random,ctx);
   }else{u.stage=Math.max(0,u.stage-1);u.due=addDays(o.day,3);u.dueReason='repair';if(o.checkpointPassed){learningCurrency(s,p,o.day,true);markComplete(s,p,a,o.random,ctx);}}
   s.units[p.unitId]=u;
  }
 }
 if(paid&&o.chainIndex>0){const bonus=Math.min(o.chainIndex,2,3-d.chainXp);if(bonus>0&&reward(s,'chain:'+o.id,bonus))d.chainXp+=bonus;}
 const result={...g,qualified:g.correct&&!o.assisted&&o.purpose==='normal'&&(p.category==='calc'||!!due)&&!(old.stage===3&&o.checkpointPassed===false),xp:s.xp-startXp,stars:0,materials:s.materials-startMaterials,souls:s.souls-startSouls,equipmentBoxes:s.equipmentBoxes-startBoxes,stage:u.stage,due:u.due,graduated:u.stage===4};const party=partyOf(s,o.party);if(result.qualified&&o.purpose==='normal'){
  if(p.category!=='calc')for(const h of party.filter(h=>h.type==='soul'))if(useAbility(s,o.day,h)){s.souls+=1;ctx.log.push({heroId:h.id,type:'soul',amount:1});}
  if(p.category==='calc'&&paid)for(const h of party.filter(h=>h.type==='forge'))if(useAbility(s,o.day,h)){s.materials+=1;ctx.log.push({heroId:h.id,type:'forge',amount:1});}
 }
 const bonds=awardBond(s,p,o,result.qualified,ctx.log);if(bonds)result.bonds=bonds;result.materials=s.materials-startMaterials;result.souls=s.souls-startSouls;if(ctx.log.length)result.abilities=ctx.log;if(!hadLottery&&d.equipmentLottery)result.equipmentLottery={...d.equipmentLottery};a.result=result;s.attempts.push(a);return {state:s,result};
}
function completeLearning(state,p,{attemptId,day,checkpointId,random=Math.random,party=[]}){
 const a=state.attempts.find(x=>x.id===attemptId&&x.problemId===p.id&&x.day===day&&x.purpose==='normal');
 if(!a||a.completed||a.correct&&!a.assisted&&a.result.qualified)return {state,result:{valid:false,error:'確認対象の解答がありません'}};
 if(!(p.explanation?.steps||[]).some(x=>x.checkpoint&&(x.checkpoint.id||x.id)===checkpointId))return {state,result:{valid:false,error:'確認問題が一致しません'}};
 const s=normalizeState(state),next=s.attempts.find(x=>x.id===attemptId),bm=s.materials,bs=s.souls,bb=s.equipmentBoxes,hadLottery=!!s.daily[day]?.equipmentLottery;learningCurrency(s,p,day,true);const ctx={party,log:[]};markComplete(s,p,next,random,ctx);const result={valid:true,xp:0,stars:0,materials:s.materials-bm,souls:s.souls-bs,equipmentBoxes:s.equipmentBoxes-bb,completed:true};if(ctx.log.length)result.abilities=ctx.log;if(!hadLottery&&s.daily[day].equipmentLottery)result.equipmentLottery={...s.daily[day].equipmentLottery};return {state:s,result};
}
function getRelated(problems,links,current,state,{direction,filters={},day=dayKey()}){
 if((filters.mode||'all')==='all'&&!getCampaignStatus(problems,state,filters,day).allUnlocked)return null;
 const target=direction==='up'?current.difficulty+1:current.difficulty,ids=links.filter(l=>l.from===current.unitId&&['contrast','extension','transfer'].includes(l.relation)).map(l=>l.to);
 const candidates=problems.filter(p=>ids.includes(p.unitId)&&p.unitId!==current.unitId&&p.difficulty===target);return selectProblem(candidates,state,filters,day);
}

// Parse only arithmetic syntax. No executable strings are evaluated.
function calcScore(expression){try{let input=norm(expression).replace(/[×✕]/g,'*').replace(/[{}\[\]]/g,x=>'{['.includes(x)?'(':')');if(input.length>500||/[□=a-zA-Z]/.test(input))throw Error('逆算・未知数はこの試作の自動評価対象外です');let i=0;const features={n:0,f:0,d:0,u:0,p:0,z:1,t:1,h:0,w:0,B:0,A:0},denoms=new Set();const digits=x=>String(abs(x)).length;const digitDecimal=s=>{const r=dec(s);features.d|=s.includes('.')?1:0;features.z=Math.max(features.z,(s.split('.')[0].replace(/^[-+]/,'')||'0').length);features.t=Math.max(features.t,digits(r.d));return r;};function spaces(){while(/\s/.test(input[i]||'')&&i<input.length)i++;}function atom(depth){spaces();if(input[i]==='('){i++;features.p=Math.max(features.p,depth+1);const a=sum(depth+1);spaces();if(input[i++]!==')')throw Error('括弧を確かめてください');return a;}if(input[i]==='+'||input[i]==='-'){const sign=input[i++];const a=atom(depth);return sign==='-'?rat(-a.n,a.d):a;}const m=input.slice(i).match(/^(\d+(?:\.\d*)?|\.\d+)/);if(!m)throw Error('対応していない数式です');i+=m[0].length;let value=digitDecimal(m[0]);const frac=input.slice(i).match(/^\s*\/\s*(\d+)(?![\d.])/);if(frac&&!m[0].includes('.')){i+=frac[0].length;features.f=1;denoms.add(frac[1]);features.t=Math.max(features.t,frac[1].length);value=rat(value.n,frac[1]);}return value;}function op(a,b,c){features.n++;const da=digits(a.n),db=digits(b.n);features.w+=c==='+'||c==='-'?Math.max(0,Math.max(da,db)-2):c==='*'?Math.max(0,da*db-2):Math.max(0,da+db-3);let r;if(c==='+'||c==='-'){if(a.d!==b.d)features.h++;features.t=Math.max(features.t,digits(a.d/gcd(a.d,b.d)*b.d));r=plus(a,rat(c==='-'?-b.n:b.n,b.d));}else r=times(a,c==='/'?rat(b.d,b.n):b);features.t=Math.max(features.t,digits(r.d));return r;}function product(depth){let a=atom(depth);for(;;){spaces();const c=input[i];if(c!=='*'&&c!=='/'&&c!=='÷')return a;i++;a=op(a,atom(depth),c==='÷'?'/':c);}}function sum(depth){let a=product(depth);for(;;){spaces();const c=input[i];if(c!=='+'&&c!=='-')return a;i++;a=op(a,product(depth),c);}}const answer=sum(0);spaces();if(i!==input.length)throw Error('対応していない数式です');if(denoms.size){const v=Math.max(...[...denoms].map(x=>x.length));features.B=denoms.size===1?2*(v-1):4*(v-1)**2;}let q=answer.d,two=0,five=0;while(q%2n===0n){q/=2n;two++;}while(q%5n===0n){q/=5n;five++;}features.A=q===1n?(Math.max(two,five)>3?2:0):(answer.d<=99n?2:4);const {n,f,d,u,p,z,t,h,w,B,A}=features;const score=3*Math.max(n-1,0)+6*f+4*d+4*f*d+10*u+3*p+2*Math.max(z-1,0)+B+2*Math.max(t-1,0)+3*h+2*w+A;return {supported:true,score,star:score<=12?1:score<=27?2:3,answer:out(answer),features};}catch(e){return {supported:false,error:e.message};}}

function createStorage(dbName='sansu-pilot-v1'){let dbPromise;function db(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined')return reject(Error('この環境では保存機能を利用できません'));const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('保存領域を開けません'));r.onblocked=()=>reject(Error('他の画面が保存領域を使用中です'));}));}let queue=Promise.resolve();return {async load(){await queue;const connection=await db();return new Promise((resolve,reject)=>{const tx=connection.transaction('state','readonly');let value;const r=tx.objectStore('state').get('current');r.onsuccess=()=>{value=r.result;};tx.oncomplete=()=>{if(value&&value.schemaVersion!==1)reject(Error('保存データの版が対応外です'));else resolve(normalizeState(value||initialState()));};tx.onerror=tx.onabort=()=>reject(tx.error||Error('保存データを読めません'));});},save(state){const snapshot=clone(state);const action=queue.catch(()=>{}).then(async()=>{const connection=await db();return new Promise((resolve,reject)=>{const tx=connection.transaction('state','readwrite');tx.objectStore('state').put(snapshot,'current');tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error||Error('端末への保存に失敗しました'));});});queue=action;return action;},async close(){await queue.catch(()=>{});if(dbPromise)(await dbPromise).close();}};}
const api={initialState,normalizeState,migrateHeroRoster,bondProgress,HERO_ABILITIES,abilityTier,abilityValue,summonHero,prepareHeroExchange,exchangeHero,getCampaignStatus,dayKey,addDays,level,parseAnswer,grade,formatAnswer,selectProblem,commitAttempt,completeLearning,getRelated,calcScore,createStorage};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SansuCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
