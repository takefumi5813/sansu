# 算数アプリ 候補問題の教材化 仕様（オーサリング担当向け）

対象：小学5年生（グノーブル）向けの算数アプリ。候補行（Notion教材から選定済み）を、
「自動採点＋段階解説＋途中確認」付きの出題データにする。

## 入力
`/home/claude/work/batches/batch-N.json` … 候補行の配列。主なフィールド：
- `id`（"selected-xxxx"）, `selectionKey`, `category`(oneline/geometry), `domain`
- `problemText`：Notionに書き起こした教材本文（小問(1)(2)…を含むことがある）。`［図：…］`は書き起こし担当が付けた図の文字説明で、児童向け本文ではない。
- `targetSubquestions`：出題する小問（`["all"]`なら全体。`["2"]`なら小問(2)だけ）
- `sourceAnswerText`：資料の答え（ページ全体の答えのことがある）
- `answerChecks`：調査時の検算メモ（参考。誤りを含むことがある）
- `learningDecision`：この行で身につけたい判断（解説の核にする）
- `evidence.qualityIssues`：既知の疑義
- `figureRequirement`, `preparationNeeds`, `baseDifficulty`, `uplift`

## 出力
`/home/claude/work/authored/batch-N.json` に、入力と同じ順で1行1要素の配列を書く。
**入力の全行について必ず1要素**を出す（採用できない行も `status:"hold"` で理由付きで出す）。

```json
{
  "id": "selected-xxxx",
  "status": "ready" | "hold",
  "holdReason": "hold のときだけ。何が足りないか具体的に",
  "figureRequired": false,
  "figureNote": "図が必要な場合、どんな図が必要か（hold判断に使う）",
  "text": "児童に見せる問題文",
  "answer": { ... 下記「答えの形式」 },
  "steps": [ {"title":"…","body":"…","equation":"…"}, ... ],
  "checkpoint": {"prompt":"…","answer":{"n":"5","d":"1","unit":"つ","dimension":"scalar"}},
  "solverCheck": "自分で本文条件から解いた式・列挙（1〜3行）。資料の答えとの一致を明記",
  "sourceAnswerMatch": true
}
```

### status の判断（厳守）
`ready` にしてよいのは、次の全部を満たすときだけ：
1. 出題する小問と共通条件が本文から明確。
2. **本文条件だけから自分で解き**、資料の答え（該当小問）と一致した。一致しなければ `hold`（答えに合わせて条件を勝手に足さない）。
3. 図・表がなくても児童が問題を正しく読める。具体的には：
   - 本文が「右の図」「下の図」「表」などに依存し、図の内容が本文の言葉だけでは伝わらない → `figureRequired:true`, `status:"hold"`（holdReason「原図が必要」＋figureNoteに必要な図）。
   - `［図：…］`の説明がないと解けない場合も同じく hold。**図を勝手に作図・再構成しない**。
   - 図が補助にすぎず本文だけで条件がそろう場合は、`［図：…］`の注記を消し、「右の図のように」等の図への言及がある場合は hold（本文改変になるため）。図への言及がなければ ready 可。
4. 答えを下記形式で自動採点できる。記号の選択・作図・範囲・場合の列挙そのもの・時刻（午前○時○分）など、形式に合わないものは `hold`（holdReason「回答形式：…」）。
5. 既知の疑義（qualityIssues）が解消している。

### text（問題文）
- 教材の文面をそのまま使う（要約・言い換え禁止）。文言を足してよいのは、出題する小問を示す一文と単位の指示だけ。
- 小問指定のとき：冒頭の共通文（「次の　　にあてはまる数を求めなさい。」など共通条件）＋指定小問の本文。指定小問が前の小問の結果や条件を使う場合は、その前の小問の本文も残し、末尾に `【答えるのは(2)だけです】` のように書く。
- 小問が1つだけになる場合は小問番号 `(2)` を外してよい。
- `［図：…］` 注記は児童向けには出さない（上のルール3）。

### 答えの形式（answer）
単一の数値：
```json
{"n":"240","d":"1","unit":"通り","dimension":"scalar"}
```
- `n`/`d` は既約分数の整数文字列（小数 2.5 → n:"5", d:"2"）。
- `dimension`：scalar / length(cm,m,km,mm) / area(cm²,m²) / volume(cm³,m³,L,mL) / time(分,秒,時間) / speed(m/分,m/秒,km/時) / percent(%)。
  単位が長さ・面積などなら該当 dimension、それ以外（通り、個、人、円、g、度、本、cm²以外の独自単位など）は scalar で `unit` に単位文字列を入れる。
  - 面積は unit "cm²"、体積は "cm³"。速さは "m/分" "km/時" など。時間は "分" "秒"。
- 小問を複数出す・1問で答えが複数あるとき：
```json
{"parts":[{"label":"(1)","n":"22","d":"1","unit":"cm","dimension":"length"},
          {"label":"(2)","n":"56","d":"1","unit":"cm²","dimension":"area"}]}
```
- 比の答え（「最も簡単な整数の比で」）：
```json
{"dimension":"ratio","terms":["3","2"],"unit":""}
```
  terms は最も簡単な整数の比。parts の中に比を入れてもよい（label を付ける）。
- 帯分数・分数で答える問題は分数（n/d）で入れる。児童は「1と2/3」相当を 5/3 で入力する。

### 解説（steps）
- 4〜6段。小学5年生が読める日本語。1段の body は2文程度、equation は式1本（全角の×÷＝を使う）。
- 1段目＝条件の整理、中ほど＝`learningDecision` の考え方（なぜその方法か）、最後の段＝考え方の確かめ。
- 解説の数値は本文と自分の検算に合わせる。`answerChecks` の数値をうのみにしない（別問題の数値が混入した例がある）。
- 「Notion」「資料」「下書き」など内部用語、答えだけの丸写しは書かない。

### 途中確認（checkpoint）
- 最後の段に付く確認問題。**単一の数値**（scalar/length/…いずれか、比・複数不可）。
- 最終答えそのものではなく、解き方の要（ひと組にするといくつ、1あたりいくら、差はいくつ、等）を問う。
- 本文と解説から答えが一意に決まること。

### 確認
書き終えたら、自分の出力を `python3 -c "import json;json.load(open('…'))"` で読み込めることを確認する。ready の各行について、解いた結果と answer が一致しているか見直す。
