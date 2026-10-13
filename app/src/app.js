(async function () {
  'use strict';
  const C = SansuCore;
  const G = SansuGear;
  const DATA = JSON.parse(document.getElementById('pilot-data').textContent);
  const byUnit = Object.fromEntries(DATA.units.map(u => [u.id, u]));
  DATA.problems.forEach(p => { p.domain = byUnit[p.unitId]?.domain || p.domain || ''; });
  const app = document.getElementById('app');
  const $ = (q, parent = document) => parent.querySelector(q);
  const $$ = (q, parent = document) => [...parent.querySelectorAll(q)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = s => JSON.parse(JSON.stringify(s));
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random();
  const names = {calc:'計算', oneline:'一行問題', geometry:'図形'};
  const storage = C.createStorage('sansu-pilot-v1');
  let state = C.initialState(), storageBroken = false, writeQueue = Promise.resolve(), session = null, view = 'home';
  let settings = {category:'oneline', mode:'review', domain:'', tier:'standard',difficulty:10, recentUnits:['R24'],star:1, grade:5, testDate:'2026-11-11', scopeUnits:['R24']};
  try { settings = {...settings, ...JSON.parse(localStorage.getItem('sansu-pilot-preferences') || '{}')}; } catch (_) {}
  if(!['review','gnorev','all'].includes(settings.mode))settings.mode='review';
  if(!['basic','standard','advanced','hard'].includes(settings.tier))settings.tier='standard';
  if(!Array.isArray(settings.recentUnits))settings.recentUnits=['R24'];
  // Replace the original pilot's demo default, preserving other chosen lessons.
  if(!settings.learnedScopeVersion&&settings.recentUnits.length===1&&settings.recentUnits[0]==='R20')settings.recentUnits=['R24'];
  if(!Array.isArray(settings.scopeUnits))settings.scopeUnits=['R24'];
  // Explicit user correction: lessons 25–27 are not yet studied.
  if(!settings.learnedScopeVersion){
    settings.recentUnits=settings.recentUnits.filter(u=>!['R25','R26','R27'].includes(u));
    settings.scopeUnits=settings.scopeUnits.filter(u=>!['R25','R26','R27'].includes(u));
  }
  settings.learnedScopeVersion=1;
  let ink = [], figureInk = [], tool = 'pen', color = '#203c42', width = 3, finger = false, zoom = 1, lastPenAt = 0, penNoticeShown = false;
  let canvasBindings = [], toastTimer;
  const today = () => C.dayKey();
  function unlockInventory(s) { return C.migrateHeroRoster(s,(DATA.reservedHeroes||[]).map(h=>h.id)); }
  function currentSession(active) { return session===active; }
  function checkDay() { if(session.day===today())return true;toast('日付が変わりました。今日の問題を選び直してください。');renderHome();return false; }
  const filters = () => ({category:settings.category,mode:settings.mode,domains:settings.domain?[settings.domain]:[],difficulty:10,tier:settings.tier,recentUnits:settings.recentUnits,star:settings.star,grade:settings.grade,scopeUnits:settings.scopeUnits});
  function failSave(e) {
    storageBroken = true;
    const bar = $('#save-status'); bar.hidden = false;
    bar.innerHTML = `この端末に保存できていません。画面を閉じる前に記録を書き出してください。 <button id="emergency-export" class="quiet">記録を書き出す</button><span class="sr-only">${esc(e.message)}</span>`;
    $('#emergency-export').onclick = exportRecords;
  }
  function enqueue(mutator) {
    const action = writeQueue.catch(() => {}).then(async () => {
      const updated = mutator(state);
      if (updated) state = unlockInventory(updated);
      // State remains available in memory when storage fails; never pretend it was saved.
      try { await storage.save(state); } catch (e) { failSave(e); }
      syncHeader();
      return state;
    });
    writeQueue = action; return action;
  }
  function rememberSettings() { try { localStorage.setItem('sansu-pilot-preferences', JSON.stringify(settings)); } catch (_) {} }
  function syncHeader() { $('#top-stars').innerHTML = resources(); }
  function displayText(t){return String(t||'').replace(/\n?[［\[]図[：:][^］\]]*[］\]]/g,'').trim();}
  function toast(text) { clearTimeout(toastTimer); $('#toast').textContent = text; $('#toast').hidden = false; toastTimer = setTimeout(() => $('#toast').hidden = true, 3200); }
  function disposeCanvases() { canvasBindings.forEach(x => x()); canvasBindings = []; }
  function orb() { return `<svg class="orb" viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="75" fill="#e4eddf"/><circle cx="90" cy="90" r="53" fill="none" stroke="#b7c9b8" stroke-width="1"/><path d="M45 117L90 39L135 117Z" fill="none" stroke="#789b8b" stroke-width="2"/><path d="M45 117H135M90 39V117M57 96H122" stroke="#789b8b"/><circle cx="90" cy="90" r="10" fill="#d4aa63"/><circle cx="90" cy="39" r="4" fill="#19545b"/><circle cx="45" cy="117" r="4" fill="#19545b"/><circle cx="135" cy="117" r="4" fill="#19545b"/></svg>`; }
  function dailyProgress() { return state.daily[today()]?.completed?.length || 0; }
  function nextLevelProgress() {
    const lv = C.level(state.xp); if (lv === 900) return {percent:100,remaining:0};
    const threshold = x => x >= 900 ? 12000 : Math.ceil(-1500 * Math.log((900 - x) / 899));
    const lo = lv === 1 ? 0 : threshold(lv), hi = threshold(lv+1);
    return {percent: Math.min(100, 100*(state.xp-lo)/Math.max(1,hi-lo)),remaining:Math.max(0,hi-state.xp)};
  }
  /*__CAMPAIGN_UI__*/
  function effectiveProblem() {
    const p=session.problem;
    return session.purpose==='variant'?{...p,...p.variant,id:p.id+':variant',figure:p.variant.figure||null,figureRequired:!!p.variant.figure,sourceConvention:p.variant.sourceConvention||'',source:{title:'理解確認用の数値替え',verification:'承認した解法の条件を保ち、数値と答えを検算した生成問題です。'},explanation:p.variant.explanation||{steps:[]}}:p;
  }
  function startProblem(p,purpose='normal',chainIndex=0) {
    if(!canEnter(p,purpose)){toast('優先範囲の修練を終えると、自由遠征を解放します。');return;}
    disposeCanvases(); session={problem:p,purpose,chainIndex,mode:settings.mode,heroId:companion()?.id||null,party:partyPayload(),id:uid(),day:today(),assisted:false,result:null,step:0,checkpointPassed:false};
    ink=[];figureInk=[];zoom=1;tool='pen';view='question';renderQuestion();window.scrollTo({top:0});
  }
  function questionPaper(p,compact=false) {
    return `<article class="paper"><div class="paper-inner"><div class="question-number">${session.purpose==='variant'?'理解確認 · 数値替え':session.purpose==='practice'?'経験値なしの練習':state.units[p.unitId]?.due&&state.units[p.unitId].due<=session.day?'REVIEW · 期限の来た復習':'ONE QUESTION · 今日のひとつ'}</div><div class="question-text" id="question-text">${esc(displayText(p.text))}</div>${p.sourceConvention?`<p class="caption">${esc(p.sourceConvention)}</p>`:''}${p.figure?`<div class="question-figure" id="question-figure"><div class="figure-content"><img id="original-figure" src="${esc(p.figure)}" alt="問題の原本図版"><canvas class="figure-ink" id="figure-canvas" aria-label="図への書き込み"></canvas></div></div><div class="figure-controls"><button id="figure-enlarge" class="quiet">図を大きく見る</button><button id="figure-write" class="quiet">図に書き込む</button></div>`:''}<details class="source-info"><summary>出典と確認範囲</summary><p>${esc(p.source.title)}</p><p>${esc(p.source.locator||'')}</p><p>${esc(p.source.verification||'')}</p>${p.source.url?`<a href="${esc(p.source.url)}" target="_blank" rel="noopener">Notionの原文を見る ↗</a>`:''}</details></div></article>`;
  }
  function scratchMarkup(review=false) {
    return `<section class="scratch-card"><div class="scratch-toolbar"><div class="tool-group"><button id="tool-pen" class="${tool==='pen'?'active':''}">ペン</button><button id="tool-erase" class="${tool==='eraser'?'active':''}">消しゴム</button><button id="ink-undo" class="quiet">1本戻す</button></div><div class="tool-group">${['#203c42','#29669b','#aa493d'].map(c=>`<button class="color-btn ${color===c?'active':''}" data-color="${c}" style="background:${c}" aria-label="${c==='#203c42'?'黒':c==='#29669b'?'青':'赤'}ペン"></button>`).join('')}<select id="pen-width" aria-label="ペンの太さ"><option value="2" ${width===2?'selected':''}>細</option><option value="3" ${width===3?'selected':''}>標準</option><option value="5" ${width===5?'selected':''}>太</option></select></div></div><div class="scratch-viewport"><div class="scratch-inner"><canvas id="scratch-canvas" class="scratch-canvas" aria-label="計算と図の下書き"></canvas></div></div><div class="scratch-foot"><label><input type="checkbox" id="finger-mode" ${finger?'checked':''}> 指でも書く</label><div><button id="ink-zoom" class="quiet" style="min-height:30px;padding:0 9px">拡大 ${zoom}×</button> <span id="ink-saved">${storageBroken?'未保存':'下書きは端末に保存'}</span></div></div></section>`;
  }
  // Answer formats: single {n,d,unit,dimension}; ratio {dimension:'ratio',terms}; clock {dimension:'clock',h,m,s?,ampm?}; multiple fields {parts:[{label,...}]}.
  const isPartsSpec=spec=>Array.isArray(spec?.parts);
  const isRatioSpec=spec=>spec?.dimension==='ratio';
  const isClockSpec=spec=>spec?.dimension==='clock';
  const fieldPlaceholder=part=>isRatioSpec(part)?'比を入力（例 3：2）':isClockSpec(part)?'例 8時19分':'数を入力';
  function answerFieldsMarkup(spec){
    const field=(part,id,label)=>`<input id="${id}" class="answer-input" type="text" inputmode="${isRatioSpec(part)||isClockSpec(part)?'text':'decimal'}" autocomplete="off" maxlength="200" placeholder="${fieldPlaceholder(part)}" aria-describedby="answer-error"${label?` aria-label="${esc(label)}の答え"`:''}><span class="unit-label"${label?' style="min-width:2.2em"':''}>${esc(part.unit||'')}</span>`;
    if(!isPartsSpec(spec))return `<label for="answer">答え</label>${field(spec||{},'answer')}`;
    return `<label>答え</label><div class="answer-parts" style="display:flex;flex-direction:column;gap:8px;width:100%">${spec.parts.map((part,i)=>{const label=part.label||`(${i+1})`;return `<div class="answer-part" data-part="${i}" style="display:flex;align-items:center;gap:10px;flex-wrap:nowrap"><span class="part-label" style="min-width:2.6em;font-weight:700">${esc(label)}</span>${field(part,'answer-'+i,label)}</div>`;}).join('')}</div>`;
  }
  function keypadMarkup(spec){
    const has=test=>isPartsSpec(spec)?spec.parts.some(test):test(spec),ratio=has(isRatioSpec),clock=has(isClockSpec);
    const keys=['7','8','9','4','5','6','／','1','2','3','0','．','−','⌫'];if(ratio)keys.splice(13,0,'：');if(clock)keys.splice(keys.length-1,0,'時','分');
    const columns=7+(ratio?1:0)+(clock?1:0);
    return `<div class="keypad" aria-label="数字と分数の入力"${columns>7?` style="grid-template-columns:repeat(${columns},1fr)"`:''}>${keys.map(x=>`<button type="button" data-key="${x}">${x}</button>`).join('')}</div>`;
  }
  function answerInputs(){return $$('#answer-form .answer-input');}
  function answerRaw(spec){return isPartsSpec(spec)?answerInputs().map(input=>input.value):$('#answer').value;}
  function lockAnswer(){answerInputs().forEach(input=>input.disabled=true);$('#hint-open').disabled=true;}
  function partsSummary(r,spec){
    if(!isPartsSpec(spec)||!Array.isArray(r.parts))return '';
    return `<p class="caption part-results">${spec.parts.map((part,i)=>`${esc(part.label||`(${i+1})`)} ${r.parts[i]?.correct?'○':'×'}`).join('　')}</p>`;
  }
  function renderQuestion() {
    disposeCanvases(); const p=effectiveProblem();
    app.innerHTML=`<div class="learning-head"><div><span class="pill">${names[p.category]}</span> <span class="caption">${session.purpose==='variant'?'理解を確かめる1問 · 経験値0pt':session.purpose==='practice'?'練習 · 経験値0pt':p.category==='calc'?C.CALC_TIER_LABELS[C.calcTier(p.score)]:'答えにたどり着く考え方を探そう'}</span></div><button id="leave-question" class="quiet">今日はここまで</button></div><div class="learning-grid">${questionPaper(p)}<div>${scratchMarkup()}</div></div><form id="answer-form" class="answer-panel">${answerFieldsMarkup(p.answer)}<button id="submit-answer" type="submit" class="primary">OK</button><button id="hint-open" type="button" class="quiet">考え方のヒント</button><p id="answer-error" class="answer-message" hidden></p></form>${keypadMarkup(p.answer)}<div id="answer-result"></div>`;
    bindPaper();bindScratch();
    $('#leave-question').onclick=finish;
    $('#answer-form').onsubmit=submitAnswer;
    $('#hint-open').onclick=()=>{session.assisted=true;const step=p.explanation.steps[0];toast(step?.body||'問題の条件と、求めたいものを整理してみよう。');$('#hint-open').textContent='ヒントを利用中';};
    session.lastField=0;$$('.answer-input').forEach((input,i)=>input.addEventListener('focus',()=>{session.lastField=i;}));
    $$('[data-key]').forEach(b=>b.onclick=()=>{const input=answerInputs()[session.lastField]||answerInputs()[0];if(!input||input.disabled)return;const k=b.dataset.key;input.value=k==='⌫'?input.value.slice(0,-1):input.value+({'／':'/','．':'.','−':'-','：':':'}[k]||k);input.focus();});
    if(session.purpose==='normal'&&state.attempts.some(a=>a.problemId===p.id)){
      const old=state.attempts.filter(a=>a.problemId===p.id).at(-1),draft=old&&state.drafts[old.id];
      if(draft){const b=document.createElement('button');b.type='button';b.className='quiet';b.textContent='前回の下書きを見る（補助）';b.onclick=()=>{session.assisted=true;ink=clone(draft.ink||[]);figureInk=clone(draft.figureInk||[]);renderQuestion();toast('前回の下書きを表示しました。今回の正解は独力正解に数えません。');};$('.scratch-foot').append(b);}
    }
  }
  function bindPaper() {
    if($('#original-figure')) {
      const img=$('#original-figure'),canvas=$('#figure-canvas'); let writable=false;
      const bind=()=>{if(img.isConnected)bindCanvas(canvas,()=>figureInk,v=>figureInk=v,()=>writable&&view==='question');};
      if(img.complete)bind();else img.onload=bind;
      img.onerror=()=>{if(!img.isConnected)return;toast('必要な図版を読み込めません。この問題には解答できません。');if($('#submit-answer'))$('#submit-answer').disabled=true;};
      canvas.style.pointerEvents='none';$('#figure-write').onclick=()=>{writable=!writable;canvas.style.pointerEvents=writable?'auto':'none';$('#figure-write').textContent=writable?'図への記入を終了':'図に書き込む';$('#figure-write').classList.toggle('primary',writable);};
      $('#figure-enlarge').onclick=()=>{const dialog=$('#settings-dialog'),title=dialog.querySelector('.dialog-head h2');title.textContent='図を大きく見る';dialog.classList.add('figure-zoom');dialog.addEventListener('close',()=>{title.textContent='記録と設定';dialog.classList.remove('figure-zoom');},{once:true});$('#settings-content').innerHTML=`<div class="figure-zoom-view"><img src="${esc(effectiveProblem().figure)}" alt="拡大した原本の図"></div><p class="caption">図は原寸で表示しています。はみ出す部分は指で動かして見られます。</p>`;dialog.showModal();};
    }
  }
  function bindScratch() {
    bindCanvas($('#scratch-canvas'),()=>ink,v=>ink=v,()=>view==='question');
    const toolbar=$('.scratch-card');if(toolbar&&!toolbar.dataset.palmGuard){toolbar.dataset.palmGuard='1';let suppress=0;toolbar.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&penRecently()&&!e.target.closest('canvas')){suppress=Date.now();e.preventDefault();e.stopPropagation();}},true);toolbar.addEventListener('click',e=>{if(Date.now()-suppress<700){e.preventDefault();e.stopPropagation();}},true);}
    $('#tool-pen').onclick=()=>setTool('pen');$('#tool-erase').onclick=()=>setTool('eraser');
    $('#ink-undo').onclick=()=>{ink.pop();redrawAll();persistInk();};
    $$('[data-color]').forEach(b=>b.onclick=()=>{color=b.dataset.color;tool='pen';$$('[data-color]').forEach(x=>x.classList.toggle('active',x===b));setTool('pen');});
    $('#pen-width').onchange=e=>width=Number(e.target.value);
    $('#finger-mode').onchange=e=>finger=e.target.checked;
    $('#ink-zoom').onclick=()=>{zoom=zoom===3?1:zoom+1;const inner=$('.scratch-inner');inner.style.width=zoom*100+'%';inner.style.height=zoom*100+'%';$('#ink-zoom').textContent=`拡大 ${zoom}×`;redrawAll();};
  }
  function setTool(t){tool=t;if($('#tool-pen'))$('#tool-pen').classList.toggle('active',t==='pen');if($('#tool-erase'))$('#tool-erase').classList.toggle('active',t==='eraser');}
  function redrawAll(){canvasBindings.forEach(fn=>fn.draw?.());}
  const penSeen=()=>lastPenAt>0,penRecently=()=>Date.now()-lastPenAt<1500;
  document.addEventListener('touchmove',e=>{if(penRecently()&&(view==='question'||view==='explanation')&&e.touches.length<2)e.preventDefault();},{passive:false});
  function bindCanvas(canvas,get,set,enabled) {
    // Pen input: strokes are drawn incrementally (no full redraw per move), coalesced events keep fast Pencil
    // strokes smooth, and the pen always wins over touches so a resting palm cannot block or scroll the pad.
    if(!canvas)return; const ctx=canvas.getContext('2d'); let active=null,activeType=null,lastMoveAt=0,dirty=false,cssW=0,cssH=0;
    const touches=new Map(); let pan=null;
    const coordinate=(e,r)=>({x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,p:e.pressure||.5,t:Date.now()});
    function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return false;const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.setTransform(dpr,0,0,dpr,0,0);cssW=r.width;cssH=r.height;return true;}
    function strokeStyle(s){ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.lineCap='round';ctx.lineJoin='round';}
    function draw(){if(!resize())return;ctx.clearRect(0,0,cssW,cssH);for(const s of get()){if(!s.points.length)continue;ctx.beginPath();strokeStyle(s);s.points.forEach((p,i)=>i?ctx.lineTo(p.x*cssW,p.y*cssH):ctx.moveTo(p.x*cssW,p.y*cssH));if(s.points.length===1){const p=s.points[0];ctx.lineTo(p.x*cssW+.1,p.y*cssH+.1);}ctx.stroke();}}
    function segment(s,from){if(!s||s.points.length<2)return;ctx.beginPath();strokeStyle(s);const pts=s.points;ctx.moveTo(pts[from-1].x*cssW,pts[from-1].y*cssH);for(let i=from;i<pts.length;i++)ctx.lineTo(pts[i].x*cssW,pts[i].y*cssH);ctx.stroke();}
    function erase(point){const strokes=get();const index=strokes.findLastIndex(s=>s.points.some(p=>Math.hypot((p.x-point.x)*cssW,(p.y-point.y)*cssH)<17));if(index>=0){strokes.splice(index,1);set(strokes);draw();dirty=true;}}
    function release(id){try{if(canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id);}catch(_){}}
    function endStroke(save=true){if(active===null)return;for(const s of get())if(s.pointerId===active)delete s.pointerId;release(active);active=null;activeType=null;if(save&&dirty){dirty=false;persistInk();}}
    function cancelTouchStroke(){if(activeType!=='touch')return;const strokes=get(),s=strokes.at(-1);if(s&&s.pointerId===active){strokes.pop();set(strokes);}release(active);active=null;activeType=null;draw();}
    const isPalm=e=>e.pointerType==='touch'&&(Math.max(e.width||0,e.height||0)>=40||penRecently());
    const down=e=>{
      if(e.pointerType==='pen'){lastPenAt=Date.now();if(finger&&!penNoticeShown){finger=false;penNoticeShown=true;const box=$('#finger-mode');if(box)box.checked=false;toast('ペンを検出しました。手のひらで線が書かれないよう「指でも書く」を切りました。');}pan=null;}
      if(e.pointerType==='touch'){
        touches.set(e.pointerId,{x:e.clientX,y:e.clientY});e.preventDefault();
        if(isPalm(e)||active!==null&&activeType==='pen')return;
        if(!finger){const viewport=canvas.closest('.scratch-viewport');if(viewport&&touches.size===2&&!penRecently()){const [a,b]=[...touches.values()];pan={x:(a.x+b.x)/2,y:(a.y+b.y)/2,viewport};}else if(viewport&&touches.size===1&&!penSeen()){canvas.setPointerCapture(e.pointerId);pan={id:e.pointerId,x:e.clientX,y:e.clientY,viewport};}return;}
      }
      if(!enabled())return;
      if(active!==null){if(e.pointerType==='pen'&&activeType!=='pen')cancelTouchStroke();else if(Date.now()-lastMoveAt>1500)endStroke();else return;}
      e.preventDefault();try{canvas.setPointerCapture(e.pointerId);}catch(_){}active=e.pointerId;activeType=e.pointerType;lastMoveAt=Date.now();resize();const r=canvas.getBoundingClientRect(),p=coordinate(e,r);
      if(tool==='eraser')erase(p);else{get().push({id:uid(),color,width,points:[p],pointerId:e.pointerId});const s=get().at(-1);ctx.beginPath();strokeStyle(s);ctx.moveTo(p.x*cssW,p.y*cssH);ctx.lineTo(p.x*cssW+.1,p.y*cssH+.1);ctx.stroke();dirty=true;}
    };
    const move=e=>{
      if(e.pointerType==='touch'&&touches.has(e.pointerId)){const t=touches.get(e.pointerId);
        if(pan&&pan.id===undefined&&touches.size===2){t.x=e.clientX;t.y=e.clientY;const [a,b]=[...touches.values()],cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;pan.viewport.scrollLeft+=pan.x-cx;pan.viewport.scrollTop+=pan.y-cy;pan.x=cx;pan.y=cy;e.preventDefault();return;}
        if(pan?.id===e.pointerId&&!penRecently()){e.preventDefault();pan.viewport.scrollLeft+=pan.x-e.clientX;pan.viewport.scrollTop+=pan.y-e.clientY;pan.x=e.clientX;pan.y=e.clientY;t.x=e.clientX;t.y=e.clientY;return;}
        t.x=e.clientX;t.y=e.clientY;}
      if(e.pointerId!==active)return;e.preventDefault();lastMoveAt=Date.now();if(activeType==='pen')lastPenAt=lastMoveAt;
      const r=canvas.getBoundingClientRect(),events=e.getCoalescedEvents?.()||[];const list=events.length?events:[e];
      if(tool==='eraser'){for(const ev of list)erase(coordinate(ev,r));return;}
      const s=get().at(-1);if(!s||s.pointerId!==active)return;const from=s.points.length;for(const ev of list)s.points.push(coordinate(ev,r));segment(s,from);
    };
    const up=e=>{if(e.pointerType==='touch'){touches.delete(e.pointerId);if(pan&&(pan.id===e.pointerId||pan.id===undefined))pan=null;}if(e.pointerId!==active)return;if(activeType==='pen')lastPenAt=Date.now();const s=get().at(-1);if(s&&s.pointerId===e.pointerId)delete s.pointerId;endStroke();};
    const lost=e=>{if(e.pointerId===active){const s=get().at(-1);if(s&&s.pointerId===e.pointerId)delete s.pointerId;endStroke();}};
    const block=e=>e.preventDefault();
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',lost);
    canvas.addEventListener('touchstart',block,{passive:false});canvas.addEventListener('touchmove',block,{passive:false});canvas.addEventListener('contextmenu',block);
    const observer=new ResizeObserver(draw);observer.observe(canvas.parentElement);draw();
    const dispose=()=>{endStroke();observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',lost);canvas.removeEventListener('touchstart',block);canvas.removeEventListener('touchmove',block);canvas.removeEventListener('contextmenu',block);};dispose.draw=draw;canvasBindings.push(dispose);
  }
  function persistInk(){if(!session)return;const id=session.id,problem=session.problem,snapshot={problemId:problem.id,revision:problem.revision,ink:clone(ink),figureInk:clone(figureInk),day:session.day,purpose:session.purpose,assisted:session.assisted,chainIndex:session.chainIndex,mode:session.mode,heroId:session.heroId,party:session.party};enqueue(s=>{const next=clone(s);next.drafts[id]=snapshot;return next;}).then(()=>{if($('#ink-saved'))$('#ink-saved').textContent=storageBroken?'未保存':'下書きを保存しました';});}
  async function submitAnswer(e) {
    e.preventDefault();if(!session||session.result||!checkDay())return;
    const active=session,options={id:active.id,day:active.day,assisted:active.assisted,purpose:active.purpose,chainIndex:active.chainIndex,mode:active.mode,heroId:active.heroId,party:active.party};
    const button=$('#submit-answer');button.disabled=true;$('#answer-error').hidden=true;
    const spec=active.purpose==='variant'?active.problem.variant?.answer:active.problem.answer,raw=answerRaw(spec);let response;answerInputs().forEach(input=>input.removeAttribute('aria-invalid'));
    await enqueue(s=>{response=C.commitAttempt(s,active.problem,{...options,raw});return response.state;});
    if(!currentSession(active)||view!=='question')return;
    if(!response.result.valid){$('#answer-error').textContent=response.result.error;$('#answer-error').hidden=false;button.disabled=false;const bad=Number.isInteger(response.result.invalidPart)?answerInputs()[response.result.invalidPart]:null;if(bad){bad.setAttribute('aria-invalid','true');bad.focus();}return;}
    if(response.result.needsGraduationCheck){session.pendingRaw=raw;lockAnswer();renderGraduationCheck();return;}
    session.result=response.result;lockAnswer();renderResult();
  }
  function renderGraduationCheck(){
    const cp=effectiveProblem().explanation.steps.find(x=>x.checkpoint)?.checkpoint;
    if(!cp){$('#answer-result').innerHTML='<div class="result-card wrong">卒業確認が未整備のため、今回は段階を進めません。</div>';return;}
    $('#answer-result').innerHTML=`<div class="result-card"><h2>答えは合っています。最後に考え方を確認。</h2><div class="checkpoint"><p>${esc(cp.prompt)}</p><input id="graduation-answer" type="text" inputmode="decimal" aria-label="卒業の確認解答"><span> ${esc(cp.answer.unit)}</span> <button id="graduation-submit" class="primary">確認する</button><p id="graduation-error" class="cp-message"></p></div></div>`;
    $('#graduation-submit').onclick=async()=>{if(!checkDay())return;const active=session,result=C.grade($('#graduation-answer').value,cp.answer);if(!result.valid){$('#graduation-error').textContent=result.error;return;}$('#graduation-submit').disabled=true;const options={id:active.id,day:active.day,raw:active.pendingRaw,purpose:active.purpose,assisted:active.assisted,checkpointPassed:result.correct,chainIndex:active.chainIndex,mode:active.mode,heroId:active.heroId,party:active.party};let response;await enqueue(s=>{response=C.commitAttempt(s,active.problem,options);return response.state;});if(!currentSession(active)||view!=='question')return;active.result=response.result;renderResult();};
  }
  function renderResult(){
    const r=session.result,p=effectiveProblem(),independent=r.correct&&r.qualified;
    const canSame=session.chainIndex<2&&session.purpose==='normal'&&independent&&C.getRelated(DATA.problems,DATA.links,session.problem,state,{direction:'same',filters:filters(),day:session.day});
    const canUp=session.chainIndex<2&&session.purpose==='normal'&&independent&&C.getRelated(DATA.problems,DATA.links,session.problem,state,{direction:'up',filters:filters(),day:session.day});
    $('#answer-result').innerHTML=`<section class="result-card ${independent||r.correct&&session.purpose!=='normal'?'':'wrong'}"><h2>${r.graduated?'代表問題を卒業！':independent?'正解。ひとつ、力になりました。':r.correct?'答えは合っています。考え方も確かめよう。':'ここから、わかるに変えよう。'}</h2><p>${r.graduated?'間隔を空けて解き、考え方も確認できました。':session.purpose==='variant'?'説明を読んだ直後の理解確認です。元の問題の復習日は変わりません。':session.purpose==='practice'?'練習として記録しました。復習の段階と経験値は変わりません。':independent?(r.due?`次は ${r.due} ごろに復習します。`:'今日の計算を記録しました。'):(r.due?`解説で確かめて、${r.due} にもう一度。`:'解説のチェックポイントで、考え方を確かめましょう。')}</p>${partsSummary(r,p.answer)}${r.hint?`<p class="caption ratio-hint">${esc(r.hint)}</p>`:''}<span class="xp-label">${r.xp?`＋${r.xp}pt`:'経験値の追加なし'}</span> <span class="caption">${r.materials?`· 鍛造素材 ＋${r.materials}`:r.souls?`· 英雄の魂 ＋${r.souls}`:''}</span>${r.equipmentBoxes&&!r.equipmentLottery?'<span class="caption box-reward"> · 装備箱 ＋'+r.equipmentBoxes+'</span>':''}${r.equipmentLottery?`<p class="caption equipment-lottery">${equipmentLotteryText(r.equipmentLottery)}</p>`:''}${abilityResult(r.abilities)}${bondResult(r.bonds)}<div class="result-actions"><button id="explanation-open" class="${independent?'quiet':'primary'}">${independent?'解き方を振り返る':'解説を一つずつ見る'}</button>${canSame?'<button id="related-same" class="gold-btn">同じ難しさで広げる</button>':''}${canUp?'<button id="related-up" class="gold-btn">一段階上に挑戦</button>':''}${p.category==='calc'&&session.purpose==='normal'?'<button id="next-calculation" class="gold-btn">次の計算へ</button>':''}<button id="finish-session" class="${independent?'primary':'quiet'}">今日はここまで</button></div></section>`;
    $('#explanation-open').onclick=()=>{view='explanation';session.step=0;renderExplanation();};$('#finish-session').onclick=finish;
    if($('#next-calculation'))$('#next-calculation').onclick=()=>{const next=C.selectProblem(DATA.problems,state,{...filters(),category:'calc'},today());if(next)startProblem(next);};
    if(canSame)$('#related-same').onclick=()=>startProblem(canSame,'normal',session.chainIndex+1);
    if(canUp)$('#related-up').onclick=()=>startProblem(canUp,'normal',session.chainIndex+1);
    $('#answer-result').scrollIntoView({block:'nearest',behavior:'smooth'});
    if(r.equipmentLottery&&!r.duplicate&&!session.treasureShown){session.treasureShown=true;setTimeout(()=>playTreasure(r.equipmentLottery),700);}
  }
  function renderVisual(visual){
    if(!visual)return '';
    if(visual.kind==='image'&&visual.src)return `<img src="${esc(visual.src)}" alt="${esc(visual.alt||'解説図')}" style="width:100%;max-height:330px;object-fit:contain">`;
    // Text/equations remain authoritative; only approved built-in diagrams are rendered.
    if(visual.kind==='opposing-motion'||visual.kind==='meeting')return `<svg viewBox="0 0 460 140" role="img" aria-label="両側から進むと間隔が縮まる"><path d="M45 85H415" stroke="#b5c9ba" stroke-width="3"/><path d="M45 85H155l-10-8m10 8l-10 8M415 85H305l10-8m-10 8l10 8" fill="none" stroke="#19545b" stroke-width="4"/><circle cx="45" cy="85" r="9" fill="#19545b"/><circle cx="415" cy="85" r="9" fill="#bd8939"/><text x="100" y="55" text-anchor="middle" fill="#203c42" font-size="15">左から進む距離</text><text x="360" y="55" text-anchor="middle" fill="#203c42" font-size="15">右から進む距離</text><text x="230" y="125" text-anchor="middle" fill="#203c42" font-size="15">二つの分だけ、間隔が縮まる</text></svg>`;
    return '';
  }
  function renderExplanation(){
    disposeCanvases();const p=effectiveProblem(),steps=p.explanation.steps,step=steps[session.step];
    if(!step){toast('この教材の解説は未整備です。');renderQuestion();return;}
    app.innerHTML=`<div class="learning-head"><span class="pill">${esc(byUnit[p.unitId]?.name||'考え方の確認')}</span><button id="finish-session" class="quiet">今日はここまで</button></div><div class="learning-grid"><div class="review-left">${questionPaper(p,true)}${scratchMarkup(true)}</div><article class="explanation-card"><div class="step-top"><span>考え方 ${session.step+1}／${steps.length}</span><span class="step-dots">${steps.map((_,i)=>`<i class="${i<=session.step?'done':''}"></i>`).join('')}</span></div><h2>${esc(step.title)}</h2><p class="body">${esc(step.body)}</p>${renderVisual(step.visual)?`<div class="visual">${renderVisual(step.visual)}</div>`:''}${step.equation?`<div class="equation">${esc(step.equation)}</div>`:''}${step.checkpoint?`<div class="checkpoint"><p>${esc(step.checkpoint.prompt)}</p><input id="checkpoint-answer" type="text" inputmode="decimal" aria-label="考え方の確認解答"><span> ${esc(step.checkpoint.answer.unit)}</span> <button id="checkpoint-submit" class="primary">確かめる</button><p class="cp-message" id="checkpoint-message"></p></div>`:''}${session.step===steps.length-1&&p.answer?`<div class="answer-reveal"><span>答え</span><strong>${esc(C.formatAnswer(p.answer))}</strong></div>`:''}<div class="step-nav"><button id="step-prev" class="quiet" ${session.step===0?'disabled':''}>前の説明</button><button id="step-next" class="primary">${session.step===steps.length-1?'説明を終える':'次の説明 →'}</button></div><div id="variant-panel"></div></article></div>`;
    bindPaper();bindScratch();$('#finish-session').onclick=finish;
    $('#step-prev').onclick=()=>{session.step--;renderExplanation();};
    $('#step-next').onclick=()=>{if(session.step<steps.length-1){session.step++;renderExplanation();}else renderExplanationEnd();};
    if(step.checkpoint)$('#checkpoint-submit').onclick=async()=>{
      if(!checkDay())return;const active=session,stepIndex=active.step;
      const g=C.grade($('#checkpoint-answer').value,step.checkpoint.answer);
      if(!g.valid){$('#checkpoint-message').textContent=g.error;return;}
      if(!g.correct){$('#checkpoint-message').textContent='式と図をもう一度見比べてみよう。';return;}
      session.checkpointPassed=true;
      let response;
      if(active.purpose==='normal'&&active.result&&(!active.result.correct||active.assisted||!active.result.qualified)) await enqueue(s=>{response=C.completeLearning(s,active.problem,{attemptId:active.id,day:active.day,checkpointId:step.checkpoint.id||step.id,party:active.party||[]});return response.state;});
      if(!currentSession(active)||view!=='explanation'||active.step!==stepIndex)return;
      $('#checkpoint-message').textContent=`合っています。${equipmentLotteryText(response?.result.equipmentLottery)}${response?.result.equipmentBoxes&&!response?.result.equipmentLottery?'装備箱＋'+response.result.equipmentBoxes+'。':''}${response?.result.materials?`鍛造素材＋${response.result.materials}。理解を記録しました。`:response?.result.souls?`英雄の魂＋${response.result.souls}。理解を記録しました。`:''}`;
      if(response?.result.equipmentLottery&&!active.treasureShown){active.treasureShown=true;setTimeout(()=>playTreasure(response.result.equipmentLottery),600);}
      if(session.step===steps.length-1)renderExplanationEnd();
    };
  }
  function renderExplanationEnd(){
    const p=session.problem,allowed=session.purpose==='normal'&&(!session.result.correct||session.assisted||!session.result.qualified)&&session.checkpointPassed&&p.variant&&!state.attempts.some(a=>a.unitId===p.unitId&&a.day===today()&&a.purpose==='variant');
    $('#variant-panel').innerHTML=`<div class="result-card" style="padding:18px"><h3>考え方を確かめました。</h3><p>${allowed?'数値を変えた1問で、使えるか試せます。経験値と復習回数は増えません。':'今日はここまでで大丈夫。日を空けた復習につなげましょう。'}</p><div class="result-actions">${allowed?'<button id="variant-start" class="gold-btn">数値替えに挑戦</button>':''}<button id="explanation-finish" class="primary">今日はここまで</button></div></div>`;
    $('#explanation-finish').onclick=finish;if(allowed)$('#variant-start').onclick=()=>startProblem(p,'variant');
  }
  async function finish(){
    const active=session;persistInk();view='finishing';await writeQueue.catch(()=>{});if(session!==active||view!=='finishing')return;disposeCanvases();view='finish';
    app.innerHTML=`<section class="finish-card"><div class="finish-icon">✦</div><div class="eyebrow">A SMALL STEP, A LASTING DISCOVERY</div><h1>今日の学びを、明日の力に。</h1><p>${dailyCounts().calc>=5&&dailyCounts().quest>=2?'今日の任務をすべて達成しました。':'今日の修練を記録しました。'}<br>${storageBroken?'保存できていない記録があります。書き出してから画面を閉じてください。':'記録と下書きは、この端末に保存しています。'}</p><p>累計 ${state.xp}pt · Lv.${C.level(state.xp)}</p><div class="resource-wallet">${resources()}</div><p class="caption">鍛冶師の修練 ${Math.min(dailyCounts().calc,5)} / 5 · 英雄との契約 ${Math.min(dailyCounts().quest,2)} / 2</p><button id="return-home" class="primary">ホームへ戻る</button>${storageBroken?'<button id="finish-export" class="quiet">記録を書き出す</button>':''}</section>`;
    $('#return-home').onclick=renderHome;if($('#finish-export'))$('#finish-export').onclick=exportRecords;
  }
  function inventoryHtml(){return `<h3>英雄 ${activeHeroCount()}／${DATA.catalog.heroes.length}</h3><p>全英雄が最初から召喚候補です。</p><h3>装備 ${activeEquipmentCount()}／${DATA.catalog.equipment.length}</h3><p>旅立ちの短剣で冒険を始め、装備箱で新しい装備を発見します。</p>${forgeHtml()}`;}
  function exportRecords(){const payload={application:'sansu-pilot',schemaVersion:1,contentVersion:DATA.version,exportedAt:new Date().toISOString(),state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`sansu-pilot-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  function validateBackup(value){
    const s=value?.state?unlockInventory(value.state):null,object=x=>!!x&&typeof x==='object'&&!Array.isArray(x),strings=x=>Array.isArray(x)&&x.every(v=>typeof v==='string'),natural=x=>Number.isSafeInteger(x)&&x>=0,date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x));
    const reject=()=>{throw Error('記録の形式を確認できません。この試作版の正常なバックアップを選んでください。');};
    if(value?.application!=='sansu-pilot'||value.schemaVersion!==1||s?.schemaVersion!==1||!natural(s.xp)||!natural(s.stars)||!natural(s.materials)||!natural(s.souls)||!natural(s.heroEchoes)||!Array.isArray(s.attempts)||!['units','rewards','daily','drafts','inventory'].every(k=>object(s[k])))reject();
    if(s.bankPractice!==undefined){
      if(!object(s.bankPractice))reject();
      for(const [id,r] of Object.entries(s.bankPractice))if(!/^selected-[a-f0-9]{16}$/.test(id)||!object(r)||typeof r.answerText!=='string'||r.answerText.length>5000||!date(r.day)||(r.result!==undefined&&!['understood','retry'].includes(r.result)))reject();
    }
    if(JSON.stringify(value).length>15000000)throw Error('バックアップが大きすぎます');
    for(const key of ['heroes','equipment'])if(!strings(s.inventory[key]))reject();
    for(const u of Object.values(s.units))if(!object(u)||!natural(u.stage)||u.stage>4||!natural(u.highestStageEver)||u.highestStageEver>4||!(u.due===null||date(u.due))||!Array.isArray(u.awardedStages)||!u.awardedStages.every(n=>natural(n)&&n>=1&&n<=4))reject();
    for(const [day,d] of Object.entries(s.daily))if(!date(day)||!object(d)||!strings(d.completed)||!strings(d.calcPaid)||!natural(d.chainXp))reject();
    for(const r of Object.values(s.rewards))if(!object(r)||!natural(r.xp)||!natural(r.stars))reject();
    const ids=new Set();
    for(const a of s.attempts){if(!object(a)||typeof a.id!=='string'||ids.has(a.id)||!date(a.day)||typeof a.problemId!=='string'||typeof a.unitId!=='string'||!['calc','oneline','geometry'].includes(a.category)||!['normal','variant','practice'].includes(a.purpose)||typeof a.correct!=='boolean'||typeof a.assisted!=='boolean'||typeof a.completed!=='boolean'||!object(a.result)||typeof a.result.qualified!=='boolean')reject();ids.add(a.id);}
    for(const d of Object.values(s.drafts)){if(!object(d)||typeof d.problemId!=='string'||!date(d.day))reject();for(const key of ['ink','figureInk']){if(!Array.isArray(d[key]))reject();for(const stroke of d[key]){if(!object(stroke)||typeof stroke.color!=='string'||!/^#[0-9a-f]{6}$/i.test(stroke.color)||!Number.isFinite(stroke.width)||stroke.width<=0||stroke.width>50||!Array.isArray(stroke.points))reject();for(const p of stroke.points)if(!object(p)||!Number.isFinite(p.x)||!Number.isFinite(p.y))reject();}}}
    if(s.loadout&&(!object(s.loadout)||!(s.loadout.hero===null||typeof s.loadout.hero==='string')||!(s.loadout.partner==null||typeof s.loadout.partner==='string')||s.loadout.partner&&!s.inventory.heroes.includes(s.loadout.partner)||!strings(s.loadout.equipment)||s.loadout.equipment.length>3||s.loadout.equipment.some(id=>!s.inventory.equipment.includes(id))||s.loadout.hero&&!s.inventory.heroes.includes(s.loadout.hero)))reject();
    if(!strings(s.heroExchangeOffers)||s.heroExchangeOffers.length>3||new Set(s.heroExchangeOffers).size!==s.heroExchangeOffers.length||s.heroExchangeOffers.some(id=>!DATA.catalog.heroes.some(h=>h.id===id)))reject();
    if(s.bondRuleVersion!==2||!object(s.heroBonds)||Object.entries(s.heroBonds).some(([id,n])=>!natural(n)||n>150||!s.inventory.heroes.includes(id)))reject();
    if(!natural(s.gearPity)||s.gearPity>9||!natural(s.heroSummons)||!natural(s.equipmentBoxes)||!natural(s.equipmentDiscoveries)||!object(s.equipmentTraining)||Object.entries(s.equipmentTraining).some(([id,n])=>!natural(n)||n<1||n>10||!s.inventory.equipment.includes(id)))reject();
    if(s.bonds&&(!object(s.bonds)||Object.values(s.bonds).some(n=>!natural(n))))reject();
    return s;
  }
  function openSettings(tab='settings'){
    const dialog=$('#settings-dialog');dialog.classList.remove('guild-dialog');$('.dialog-head h2').textContent='記録と設定';
    $('#settings-content').innerHTML=tab==='inventory'?`<div class="settings-section">${inventoryHtml()}</div>`:`<div class="settings-section"><h3>保護者の設定</h3><p>直近授業と次回グノレブの範囲を別々に設定します。直近授業は第24回、次回グノレブは既習の第24回を対象にしています。第25〜27回は未習のため含めていません。授業が進んだら変更してください。</p><label>学年 <select id="grade-setting"><option value="5" ${settings.grade===5?'selected':''}>5年生</option><option value="6" ${settings.grade===6?'selected':''}>6年生</option></select></label><p><label>直近授業の範囲（カンマ区切り）<br><input id="recent-scope" value="${esc(settings.recentUnits.join(','))}" style="width:100%"></label></p><p><label>次回グノレブの日 <input id="test-date" type="date" value="${esc(settings.testDate)}"></label></p><p><label>次回グノレブの範囲（カンマ区切り）<br><input id="test-scope" value="${esc(settings.scopeUnits.join(','))}" style="width:100%;padding:9px;border:1px solid #bdcdbf;border-radius:9px"></label></p><button id="save-preferences" class="primary">設定を保存</button></div><div class="settings-section"><h3>学習の記録</h3><p>${state.attempts.length}回の解答 · ${state.xp}pt · ${Object.values(state.drafts).length}件の下書き</p><button id="export-records" class="quiet">バックアップを書き出す</button><p><label>この試作のバックアップを読み込む<br><input id="import-records" type="file" accept="application/json,.json"></label></p><p id="import-message"></p><table class="history-table"><thead><tr><th>日付</th><th>教材</th><th>結果</th></tr></thead><tbody>${state.attempts.slice(-12).reverse().map(a=>`<tr><td>${esc(a.day)}</td><td>${esc(DATA.problems.find(p=>p.id===a.problemId)?.source.title||a.problemId)}</td><td>${a.correct?'○':'×'} ${a.assisted?'補助あり':''}</td></tr>`).join('')}</tbody></table></div><div class="settings-section"><h3>この試作の範囲</h3><p>段階解説・手書き・正確な数値判定・復習・報酬を確認するPhase Aです。下書きを外部へ送るAI機能はまだありません。公開もしていません。</p><button id="inventory-from-settings" class="quiet">英雄・装備の図鑑</button></div>`;
    if(!dialog.open)dialog.showModal();
    if(tab==='settings'){
      $('#save-preferences').onclick=()=>{settings.grade=Number($('#grade-setting').value);settings.testDate=$('#test-date').value;settings.recentUnits=$('#recent-scope').value.split(/[,、\s]+/).filter(Boolean);settings.scopeUnits=$('#test-scope').value.split(/[,、\s]+/).filter(Boolean);if(settings.grade===5&&settings.difficulty>8)settings.difficulty=8;rememberSettings();dialog.close();if(view==='home')renderHome();toast('範囲設定を保存しました。');};
      $('#export-records').onclick=exportRecords;
      $('#import-records').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>15000000)throw Error('ファイルが大きすぎます');const imported=validateBackup(JSON.parse(await file.text()));$('#import-message').textContent='この端末の試作記録を置き換えます。';const button=document.createElement('button');button.className='primary';button.textContent='確認して読み込む';button.onclick=async()=>{await enqueue(()=>clone(imported));dialog.close();renderHome();toast('バックアップを読み込みました。');};$('#import-message').append(button);}catch(err){$('#import-message').textContent=err.message;}};
      $('#inventory-from-settings').onclick=()=>openGuild('collection');
    }
  }
  $('#records-open').onclick=()=>openSettings();$('#settings-close').onclick=()=>$('#settings-dialog').close();
  $('#brand').onclick=e=>{e.preventDefault();if(session&&view!=='home')finish();else renderHome();};
  window.addEventListener('pagehide',()=>{persistInk();});
  app.innerHTML='<p class="loading">今日の学びを準備しています…</p>';
  try{state=unlockInventory(validateBackup({application:'sansu-pilot',schemaVersion:1,state:await storage.load()}));}catch(e){failSave(e);}
  syncHeader();renderHome();
  const enter=$('#begin-adventure');
  $('#opening-record').textContent=state.attempts.length?'Lv.'+C.level(state.xp)+' · これまでの歩みを、次の一歩へ。':'小さなひらめきから、冒険がはじまる。';
  enter.disabled=false;
  enter.onclick=()=>{document.body.dataset.screen='home';$('#opening').hidden=true;window.scrollTo({top:0});$('#start')?.focus({preventScroll:true});};
  window.SansuPilot={snapshot:()=>clone(state),data:DATA,storageName:'sansu-pilot-v1',whenSaved:()=>writeQueue};
})();
