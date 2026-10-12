# 候補問題の教材化（第2弾）2026-10-12

## 結果
- 未教材化だった候補 375 行を全件処理。
- **通常の自由遠征に追加：119 問**（一行問題 104・図形 15）。`content/expedition-ready-2.json`
- 未配信で保管：256 行。`content/expedition-prepared-hold.json`（各行に `holdReason`。223 行は答え・段階解説・途中確認まで作成済み）

| 保留の理由 | 行数 |
|---|---:|
| 原図・表・グラフが必要（本文が図を参照、条件が図にしかない） | 210 |
| Notion本文が要約メモ形式（原本の文面が必要） | 29 |
| 回答形式（記号選択・作図・列挙・分単位以下が分数の時刻など） | 16 |
| 独立検算で不一致 | 1 |

## 作り方
1. 候補を7束に分け、作成担当が本文条件だけから解き、資料の答えと照合して ready/hold を判定し、問題文・答え・段階解説（4〜6段）・途中確認を作成（仕様：作業用 AUTHORING_SPEC）。
2. 別の検算担当が、答えと解説を見る前に問題文だけから解き直し、答え・単位・解説・途中確認・本文の忠実さを検査（VERIFY_SPEC）。不合格は修正するか保留。
3. `scripts/build-ready-selection-2.py` が「作成 ready ＋ 検算 pass ＋ 未習範囲でない ＋ 図不要 ＋ 要約メモ形式でない ＋ 形式検証」を満たす行だけを配信データにする。
   - 作業ファイル（authored/verified）はリポジトリ外。作業記録は `reports/expedition-ready-2-work/`。再生成は `python3 app/scripts/build-ready-selection-2.py app/reports/expedition-ready-2-work`。

## アプリ側の変更
- 答えの形式を追加：比（`dimension:"ratio"`）、複数欄（`parts`）、時刻（`dimension:"clock"`）。仕様は CONTRACT.md。
- 解説の最後の段に「答え」を表示（`formatAnswer`）。長い時間は「10分48秒（648秒）」のように表示。
- 追加問題は既存20問と同じく `expeditionOnly:true / homeStudy:false / reviewEligible:false`。

## 次にやること
- 原図が必要な210行：Notionの「図」プロパティ（例「図版p.41」）が Dropbox /算数DB/図版/ の図版PDFのページを指している。そこから該当図を切り出して `figs/` に置けば、作成済みの答え・解説をそのまま配信できる。
- 要約メモ形式の29行：原本の問題文を書き起こせば配信可能。
- 分単位が分数の時刻（例 2時36と12/13分）：時刻形式を分数の分に対応させれば6行が配信可能。
