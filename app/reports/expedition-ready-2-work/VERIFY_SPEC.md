# 独立検算 仕様

あなたは検算担当。作成者とは別に、問題文だけを見て解き、作成者の答え・解説・途中確認を検査する。

入力：`/home/claude/work/authored/batch-N.json` のうち `status:"ready"` の行だけ。
手順（各行）：
1. まず `text` だけを読み、**answer や steps を見る前に**自分で解く（Python可）。
2. 自分の答えと `answer`（単一 {n,d,unit,dimension}／比 {dimension:"ratio",terms}／複数 {parts:[…]}）を比べる。単位・dimension が問題の要求と合っているかも見る（例：面積なのに length、％で答える問題なのに scalar 等）。
3. `text` が児童にとって条件不足・あいまいでないか（図への言及が残っていないか、指定小問以外に答える欄が必要に見えないか）。
4. `steps` の数値・式が正しく、答えと矛盾しないか。小学5年生の解き方として妥当か。
5. `checkpoint` の答えが prompt から一意に決まり、正しいか（単一数値であること）。

出力：`/home/claude/work/verified/batch-N.json` に、ready 行それぞれ1要素：
```json
{"id":"selected-xxxx","verdict":"pass"|"fail","myAnswer":"自分の答え","note":"fail の理由（具体的に）。pass なら空でよい"}
```
少しでも誤り・あいまいさがあれば fail（直し方を note に）。作成ファイルは編集しない。
最後に pass/fail 件数と fail の内訳を報告。

## 追加：本文の忠実さ
元の候補 `/home/claude/work/batches/batch-N.json` の同じ id の `problemText`・`targetSubquestions` と text を見比べる。
許される変更は、指定小問以外の小問を外す／「【答えるのは(n)だけです】」／単位・答え方の指示の追加／［図：…］注記やページ表記の削除だけ。
文面の要約・言い換え・条件の追加があれば fail。
