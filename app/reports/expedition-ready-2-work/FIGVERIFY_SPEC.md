# 図つき問題の独立検算 仕様

あなたは検算担当。作成者とは別に、**問題文と図だけ**を見て解き、作成者の答え・解説・途中確認と図の切り出しを検査する。

入力：`/home/claude/figwork/out-N.json` のうち `figureOk:true` かつ `textOk:true` かつ `answerOk:true` の行。
図の画像：`/home/claude/sansu/app/dist/<figure>`（Read で開いて見る）。元の候補は `/home/claude/figwork/jobs-N.json` の同じ id（problemText・figPages・locations）。

各行：
1. `text` と図の画像だけを見て（answer・steps を見る前に）自分で解く（Python可）。
2. 図の検査：
   - 問題を解くのに必要な数字・記号・位置関係が図に全部あり、読める。
   - 解説・答え・解き方の書き込み、別の問題・別の小問の図、見出し文字（「DB図版 p.○」）が入っていない。
   - problemText の［図：…］説明と矛盾しない。必要なら元のシート画像（jobs の locations の pdf・sheet → /home/claude/figwork/sheets/<pdf名>/sNNN.jpg）を見て、切り出しが正しい図か確認。
3. 自分の答えと `answer` が一致するか、単位・dimension が要求どおりか。
4. `steps` の数値・図との対応が正しいか。`checkpoint` が単一数値で一意に正しいか。
5. 本文の忠実さ：`text` が problemText の文面そのまま（許される変更：指定小問以外を外す／【答えるのは(n)だけです】／単位・答え方の指示の追加／［図：…］注記やページ表記の削除）。要約メモ形式なら fail。

出力：`/home/claude/figwork/figverified/out-N.json`：検査した行ごとに
```json
{"id":"selected-…","verdict":"pass"|"fail","myAnswer":"…","note":"fail の理由と直し方"}
```
少しでも誤り・あいまいさがあれば fail。他のファイルは編集しない。最後に pass/fail 件数と fail 内訳を報告。
