// Answer-bearing selections are available now; unresolved source issues remain visible.
// Manual checks are separate from mastery, rewards, and the automatic scheduler.
let bankFilter = {category:'', domain:'', status:'', query:''};
function bankUnlocked(){return C.getCampaignStatus(DATA.problems,state,filters(),today()).allUnlocked;}
function bankGradeAllowed(entry){return Number(settings.grade)!==5||Number(entry.baseDifficulty)+Number(entry.uplift)<=8;}
function bankTarget(entry){return entry.targetSubquestions.map(q=>q==='all'?'対象全体':`(${q})`).join('・');}
function bankStatus(entry){return {existing:'既存問題と対応',self_check:'答え合わせで練習',pending:'補完予定'}[entry.status];}
function showSelectedBank(){
  const dialog=$('#settings-dialog');dialog.classList.remove('guild-dialog');
  $('.dialog-head h2').textContent='追加問題集';
  const entries=DATA.selectedBank.entries,unlocked=bankUnlocked(),counts=DATA.selectedBank.counts;
  $('#settings-content').innerHTML=`<section class="settings-section bank-catalog"><p>選定一覧の${entries.length}件を収録。1件に複数の小問を含む場合があります。</p><p class="bank-note">既存問題と対応 ${counts.existing}件 ／ 答え合わせで練習 ${counts.self_check}件 ／ 補完予定 ${counts.pending}件</p><p>${unlocked?'自由遠征を解放しました。':'直近復習と次回グノレブの残りが両方0になると、問題に取り組めます。'} 答え合わせでの練習は報酬・任務・復習段階の対象外です。</p><div class="bank-filters"><label>分類<select id="bank-category"><option value="">すべて</option><option value="oneline">一行問題</option><option value="geometry">図形</option></select></label><label>分野<select id="bank-domain"><option value="">すべて</option>${[...new Set(entries.map(e=>e.domain))].map(d=>`<option>${esc(d)}</option>`).join('')}</select></label><label>状態<select id="bank-status"><option value="">すべて</option><option value="self_check">答え合わせで練習</option><option value="existing">既存問題と対応</option><option value="pending">補完予定</option></select></label><label>教材名で探す<input id="bank-query" type="search" maxlength="100"></label></div><p id="bank-count" role="status"></p><div id="bank-list"></div></section>`;
  for(const key of ['category','domain','status','query']){
    const field=$('#bank-'+key);field.value=bankFilter[key];
    field.addEventListener(key==='query'?'input':'change',()=>{bankFilter[key]=field.value;renderBankList();});
  }
  renderBankList();if(!dialog.open)dialog.showModal();
}
function renderBankList(){
  const list=DATA.selectedBank.entries.filter(e=>(!bankFilter.category||e.category===bankFilter.category)&&(!bankFilter.domain||e.domain===bankFilter.domain)&&(!bankFilter.status||e.status===bankFilter.status)&&(!bankFilter.query||e.source.title.toLocaleLowerCase().includes(bankFilter.query.toLocaleLowerCase()))),unlocked=bankUnlocked();
  $('#bank-count').textContent=`${list.length}件`;
  $('#bank-list').innerHTML=list.map(e=>{
    const gradeAllowed=bankGradeAllowed(e),canOpen=unlocked&&gradeAllowed&&!!e.sourceAnswerText.trim(),record=state.bankPractice?.[e.id];
    return `<article class="bank-list-item"><div><b>${esc(e.source.title)}</b><span class="bank-badge">${bankStatus(e)}</span><p>${esc(names[e.category])} · ${esc(e.domain)} · 小問 ${esc(bankTarget(e))}</p>${e.status==='pending'?`<small>${esc(e.preparationNeeds.join('・'))}</small>`:''}${record?.result?`<small>前回：${record.result==='understood'?'自分で確認済み':'もう一度取り組む'}（${esc(record.day)}）</small>`:''}</div><button class="quiet" data-bank-open="${e.id}" ${canOpen?'':'disabled'}>${!unlocked?'自由遠征で解放':!gradeAllowed?'6年生設定の対象':!e.sourceAnswerText.trim()?'答えの準備中':e.status==='existing'?'既存問題へ':'取り組む'}</button></article>`;
  }).join('')||'<p>該当する教材はありません。</p>';
  $$('[data-bank-open]').forEach(b=>b.onclick=()=>openBankEntry(b.dataset.bankOpen));
}
function openBankEntry(id){
  const entry=DATA.selectedBank.entries.find(e=>e.id===id);
  if(!entry||!bankUnlocked()||!bankGradeAllowed(entry)||!entry.sourceAnswerText.trim())return;
  if(entry.status==='existing'){
    const p=DATA.problems.find(p=>entry.existingProblemIds.includes(p.id)&&canEnter(p,'practice'));
    if(p){$('#settings-dialog').close();startProblem(p,'practice');}return;
  }
  const record=state.bankPractice?.[entry.id];
  $('.dialog-head h2').textContent=entry.source.title;
  $('#settings-content').innerHTML=`<section class="settings-section bank-reader"><button id="bank-back" class="quiet">一覧に戻る</button><p class="bank-note">取り組む小問：<b>${esc(bankTarget(entry))}</b><br>共通条件を保つためページ全体を表示しています。指定された小問に取り組んでください。</p>${entry.status==='pending'?`<p id="bank-preparation" class="bank-note">補完予定：${esc(entry.preparationNeeds.join('・'))}。図や条件が足りない場合は、出典を参照するか次の問題へ進んでください。掲載の答えは資料の記載で、正しさが未確認の箇所があります。</p>`:''}<div id="bank-problem" class="bank-source">${esc(entry.problemText)}</div><label for="bank-answer">自分の答え・メモ（紙に書いてもかまいません）</label><textarea id="bank-answer" rows="4" maxlength="5000">${esc(record?.answerText||'')}</textarea><p><button id="bank-reveal" class="primary">答えを確認する</button></p><div id="bank-solution" hidden></div><p class="bank-footnote">答え合わせで練習します。自動採点・報酬・復習段階への加算はありません。<a href="${esc(entry.source.url)}" target="_blank" rel="noopener noreferrer">Notionの出典</a></p></section>`;
  $('#bank-back').onclick=showSelectedBank;
  $('#bank-answer').oninput=e=>saveBankPractice(entry.id,{answerText:e.target.value});
  $('#bank-reveal').onclick=()=>{
    if(!bankUnlocked()){showSelectedBank();return;}
    const panel=$('#bank-solution');panel.hidden=false;
    panel.innerHTML=`<h3>${entry.status==='pending'?'資料に記載された答え（補完前）':'答え（ページ全体）'}</h3><p>上の指定小問の答えを確認してください。</p><div class="bank-source">${esc(entry.sourceAnswerText)}</div><details><summary>考え方と確認</summary><p>${esc(entry.learningDecision)}</p>${entry.answerChecks.map(c=>`<p class="bank-source">${esc(c)}</p>`).join('')}</details><p>自分で確認した結果を残せます。</p><div class="bank-result-actions"><button class="quiet" data-bank-result="understood">答えを確認できた</button><button class="quiet" data-bank-result="retry">もう一度取り組む</button></div><p id="bank-result-message" role="status"></p>`;
    $$('[data-bank-result]').forEach(b=>b.onclick=async()=>{
      if(!bankUnlocked()){showSelectedBank();return;}
      await saveBankPractice(entry.id,{answerText:$('#bank-answer').value,result:b.dataset.bankResult});
      if($('#bank-result-message'))$('#bank-result-message').textContent=storageBroken?'端末に保存できていません。上部から記録を書き出してください。':'練習の記録を保存しました。';
    });
  };
}
function saveBankPractice(id,change){
  return enqueue(s=>{const next=clone(s);next.bankPractice||={};next.bankPractice[id]={answerText:'',...next.bankPractice[id],...change,day:today()};return next;});
}
