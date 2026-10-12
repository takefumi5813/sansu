# 図の切り出し 仕様

目的：保留中の候補問題に、原本の図版（DB図版PDFのシート画像）から**その問題の図だけ**を切り出して付け、アプリで出題できるようにする。

## 入力
- `/home/claude/figwork/jobs-N.json`：担当分の行。各行に
  - `id`, `title`（例 4R24T①-3）, `targetSubquestions`, `problemText`（Notionの本文。［図：…］は図の文字説明）, `figureNote`, `holdReason`
  - `figPages`（図版の通し番号）, `locations`：[{p, pdf, sheet, x, y, w, h, headingText}] … シート画像上の見出し「DB図版 p.N／…」の位置（左上x,y、見出し行の幅w・高さh、px）
  - `status`："found"（見出しが見つかった）/"missing"（索引に無い）
- シート画像：`/home/claude/figwork/sheets/<pdf名から.pdfを除いた名前>/sNNN.jpg`（NNNは3桁0埋めのシート番号）
- 作成済みの教材データ：`/home/claude/work/authored/batch-*.json` の同じ id（text・answer・steps・checkpoint。hold でも多くは作成済み）

## 手順（1行ずつ）
1. 該当シートを Read で開いて目で見る。見出しの下にある図のうち、**この問題（targetSubquestions）を解くのに必要な図**を特定する。1つの見出しの下に問題図と解説図が並ぶことがある。**解説の図・答えや解き方が書き込まれた図・別の小問の図は入れない**（必要な小問の図が別ならそれだけ）。
2. 切り出し枠を決め、Python（PIL）で切り出す：
   - 見出し行（「DB図版 p.N／…」）は含めない。図の外周に約6mm（220dpiで約50px）の余白。寸法の数字・記号・軸ラベルが欠けないこと。
   - 複数の図が必要なら縦に並べて1枚にまとめてよい（間に白20px）。
   - グレースケール、長辺は原寸のまま（縮小しない。ただし長辺1600px超なら1600pxに縮小）。PNG（`optimize=True`）で保存：
     `/home/claude/sansu/app/dist/figs/notion/<idの selected- を除いた16桁>.png`
3. 切り出した画像を Read で開いて確認：必要な数字・記号がすべて読めるか、余計なもの（解説・答え・別問題・見出し）が入っていないか。
4. 判定：
   - `figureOk:true`：問題文＋この図で、児童が条件を正しく読める（problemText の［図：…］説明と矛盾しない）。
   - `figureOk:false`：見つからない、違う図、図版に必要な部分が無い、解説図しかない、など → `reason` を具体的に。
5. 教材データの準備（figureOk:true のとき）：authored の同じ id をもとに、出題用データを作る
   - `text`：教材の文面そのまま（problemText から［図：…］注記・図版ページ表記を除く。指定小問以外は外してよい／前の小問の結果を使うなら残して【答えるのは(n)だけです】）。「右の図」などの言及はそのまま残してよい（図が付くので）。要約メモ形式の本文（問いの文になっていない）なら `figureOk` は true でも `textOk:false` とする。
   - `answer`・`steps`・`checkpoint`：authored のものを使う。ただし**図を見て**数値・位置関係が合っているか確認し、合わなければ直すか `answerOk:false`。authored に無ければ作る（AUTHORING_SPEC：/home/claude/work/AUTHORING_SPEC.md。形式は単一数値／比 {dimension:"ratio",terms}／時刻 {dimension:"clock",h,m}／複数欄 {parts:[…]}。記号選択・作図・列挙は自動採点できないので `answerOk:false`）。
   - 本文条件＋図だけから自分で解き直し、資料の答え（authored の solverCheck や problemText 中の答え）と一致することを確認。

## 出力
`/home/claude/figwork/out-N.json`：担当の全行について1要素
```json
{"id":"selected-…","figure":"figs/notion/xxxxxxxxxxxxxxxx.png","figureOk":true,"textOk":true,"answerOk":true,
 "reason":"(false のとき)","text":"…","answer":{…},"steps":[{"title","body","equation"}…],"checkpoint":{"prompt","answer":{n,d,unit,dimension}},
 "solverCheck":"図から読んだ数値と解いた式。資料の答えと一致"}
```
figureOk が false の行は figure・text 等を省略してよい。
最後に、ok件数・不可件数と理由の内訳、迷った行を報告。Notion・Dropbox・リポジトリの他ファイルは変更しない（書いてよいのは figs/notion/ と out-N.json だけ）。
