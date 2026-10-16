function b57Evidence(value){
  if(value==null)return '';
  if(typeof value==='string')return value;
  if(Array.isArray(value))return value.map(b57Evidence).filter(Boolean).join(' ／ ');
  if(typeof value==='object')return Object.values(value).filter(v=>typeof v!=='boolean'&&typeof v!=='number').map(b57Evidence).filter(Boolean).join(' ／ ');
  return '';
}
function b57Source(source){return [source.path,source.additional_page_location||source.source_locator||(source.pdf_page?'PDF '+source.pdf_page+'ページ':''),source.location_basis,source.page_evidence_status].filter(Boolean).join(' ／ ');}
function openB57Catalog(){
  const dialog=$('#settings-dialog'),cat=DATA.b57Catalog;
  dialog.querySelector('.dialog-head h2').textContent='代表問・難易度・保留';
  const reps=new Map(cat.representatives.map(r=>[r.inventoryId,r]));
  $('#settings-content').innerHTML=`<div class="settings-section"><p>全443細分類。採用済み${cat.counts.adopted}件（計算別掲・補足を含む）。採用と出題準備は別に管理します。</p><p>原D・★を残し、比較用難易度を別表示しています。品質保留と教材化待ちは通常出題に入りません。</p><label>Point・細分類・問題ID・語句を検索 <input id="b57-search" style="width:100%"></label><label>表示 <select id="b57-filter"><option value="all">すべて</option><option value="hold">保留・不足</option><option value="empty">代表問なし</option><option value="waiting">教材化待ち</option></select></label><p id="b57-count"></p><div id="b57-results"></div><details><summary>計算別掲・B57外の採用記録</summary><div id="b57-extra"></div></details></div>`;
  function record(r){const node=document.createElement('details');node.className='b57-record';node.innerHTML=`<summary>${esc(r.questionId)}｜${esc(r.comparisonDifficulty)}〔原：${esc(r.originalDifficulty)}〕｜${esc(r.deliveryStatus)}</summary><p>${esc(r.name)}</p><p>難易度根拠：${esc(r.comparisonBasis)}</p><p>対応根拠：${esc(r.mappingBasis)}</p><p>出典：${esc(b57Source(r.source))}</p>${r.approvedCorrectConditions?`<p class="b57-warning">採用基準の正しい条件：${esc(r.approvedCorrectConditions)}</p>`:''}<details><summary>品質保留・確認範囲</summary><p>${esc(b57Evidence(r.quality)||'個別の保留記録なし')}</p></details><details><summary>代表指定の出典</summary><p>${esc(b57Evidence(r.designation))}</p></details>`;return node;}
  function render(){const q=$('#b57-search').value.toLowerCase().trim(),filter=$('#b57-filter').value,root=$('#b57-results');root.replaceChildren();let count=0;
    for(const b of cat.branches){const rows=b.representativeIds.map(id=>reps.get(id)),v=b.difficultyCoverage,cs=cat.candidateDispositions.filter(a=>a.subdivision_id===b.id&&a.action!=='採用');
      if(q&&!JSON.stringify([b,rows,cs]).toLowerCase().includes(q))continue;
      if(filter==='hold'&&!v.pending_levels.length&&!v.still_missing_expected_levels.length&&!v.quality_wait)continue;
      if(filter==='empty'&&rows.length)continue;if(filter==='waiting'&&!rows.some(r=>r.deliveryStatus==='教材化待ち'))continue;
      count++;const node=document.createElement('details');node.className='b57-branch';node.open=!!q;node.innerHTML=`<summary>${esc(b.id)}｜Point${b.point} ${esc(b.pointName)}｜${rows.length}問</summary><p>${esc(b.major)}／${esc(b.minor)}／${esc(b.name)}</p><p>${esc(v.status)}。使用可能な帯：${esc(v.available_levels.join('・')||'なし')}。保留帯：${esc(v.pending_levels.join('・')||'なし')}。不足帯：${esc(v.still_missing_expected_levels.join('・')||'なし')}</p>`;
      rows.forEach(r=>node.append(record(r)));if(!rows.length){const p=document.createElement('p');p.textContent='代表問なし';node.append(p);}
      cs.forEach(a=>{const p=document.createElement('p');p.className='b57-warning';p.textContent=`【非計上・${a.action}】${a.question_id}：${a.basis}`;node.append(p);});root.append(node);
    }$('#b57-count').textContent=count+'細分類を表示';
    const extra=$('#b57-extra');extra.replaceChildren();cat.representatives.filter(r=>!r.primaryMappings.length&&(!q||JSON.stringify(r).toLowerCase().includes(q))).forEach(r=>extra.append(record(r)));
  }
  $('#b57-search').oninput=render;$('#b57-filter').onchange=render;render();if(!dialog.open)dialog.showModal();
}
