# R24家庭学習・一行問題の選定

選定の起点はNotion問題DBと型DB。R24H全29件を列挙し、全ページの問題本文・答え・プロパティを読み取った。ローカルmd/PDFは同一レコードの照合・補完にだけ使用した。R25〜27は未習のため対象外。Notion/Dropbox原本は変更していない。

採用18代表、同型統合8、保留3。Notionの大分類をそのまま18型あると主張するものではない。P15/P16内で、必要な未知量・条件の対応・切替・割合・休業・能力比・周期末端の判断が異なる場合だけ小単位に分けた。これはR24H範囲の選定で、履修全範囲のNotion型を網羅するものではない。

難度はNotionで確認した各型の基礎難度の最大値＋問題の上乗せから再計算した。17問がD1〜4標準、1問がD5〜6応用、D7〜8難問は0問。難問枠を埋めるための難度上書きはしない。従前の独自仮判定はauthoredDifficultyDraftに監査用で残し、出題難度には使わない。

## 全29候補の採否

全件「教材=5年授業」「区分=家庭学習用H」「図=なし」。Notionの時期は④-4/④-5が5年前期、他が5年後期だが、教材回の関連は同じR24。scopeUnitsは問題番号・教材回でR24とする。URLがNotionレコードを一意に特定し、UUID・全取得プロパティ・本文はreferences/notion-r24-oneline-snapshot.jsonに保存。

| 問題（Notion） | 型コード/基礎 | 上乗せ→D | Notion答え | 採否・代表/理由 |
|---|---|---|---|---|
| [R24H①-1](https://app.notion.com/3f52b010743c812ea5d6f051934aef0e) | P15(3) | 0→3 | 21日 | 統合→R24H①-2。既知の2能力を加えて全体を割る同型。数値の大小だけでは別単位にしない。 |
| [R24H①-2](https://app.notion.com/3f52b010743c81bb8f5bebb3a38546f2) | P15(3) | 0→3 | 20日 | 採用：work.parallel.complete。全体を共通の量にそろえ、同時に働く1日分を足して全体を割る。日数の平均を取らない。 |
| [R24H①-3](https://app.notion.com/3f52b010743c812eaf31fdcab597f8cf) | P15(3) | 0→3 | 20日 | 採用：work.phases.known_rates。途中までの2人の仕事量を引き、残りをBの1日分で割り、最初の12日を加える。 |
| [R24H①-4](https://app.notion.com/3f52b010743c8186985ecdf1c914a739) | P15(3) | 0→3 | 45日 | 採用：work.parallel.subtract。2人で働く速さからAの速さを引いてBの速さを出す。所要日数どうしを引かない。 |
| [R24H①-5](https://app.notion.com/3f52b010743c81de8f35e91eebbd6890) | P15(3) | 1→4 | 48日 | 採用：work.overlap.three_rates。(A+B)+(B+C)にはBが2回含まれるので、3人分を1回引いてBを残す。 |
| [R24H②-1](https://app.notion.com/3f52b010743c81b1b447dcb9da0858eb) | P15(3) | 0→3 | 12日 | 採用：work.phases.infer_remaining_rate。Aの既知の能力から残りの仕事量を求め、その残りをBの作業日数で割って能力を逆算する。 |
| [R24H②-2](https://app.notion.com/3f52b010743c8157acfed5d4f4c7df6a) | P15(3) | 0→3 | 20日 | 採用：work.fractions.infer_both_rates。全体の分数と作業日数から各人の1日分を求める。8日や40日は全体を仕上げる日数ではない。 |
| [R24H②-3](https://app.notion.com/3f52b010743c8117a9add1971d4e488f) | P15(3) | 0→3 | 48日間 | 採用：work.fractions.elapsed_unknown。残りの分数からBの能力を出し、共同能力との差でAの能力を求め、Aの担当量を割る。 |
| [R24H②-4](https://app.notion.com/3f52b010743c81c0bc28ecb3735c1b11) | P15(3) | 0→3 | 30日 | 採用：work.fractions.joint_then_subtract。共同作業の部分量を12日で割り、残りから求めたAの能力を引く。12日は全体の日数ではない。 |
| [R24H③-1](https://app.notion.com/3f52b010743c81bc978cf6d91a8b877a) | P15(3) | 1→4 | 2日 | 採用：work.absence.one_unknown。Aは全8日働いたと捉え、Bの担当量から実働日数を求めて、経過8日との差を取る。 |
| [R24H③-2](https://app.notion.com/3f52b010743c81909901ebae2cc31af0) | P15(3) | 1→4 | 13日 | 採用：work.absence.elapsed_unknown。2人とも毎日働いた仮想仕事量に休みの分を補い、1日分の和で割って経過日数を求める。 |
| [R24H③-3](https://app.notion.com/3f52b010743c8145ba10c694bd3c0e5f) | P15(3) | 1→4 | 11日 | 統合→R24H③-2。休みの量を仮想仕事量へ戻して経過日数を出す同型。人数が3人でも新判断はない。 |
| [R24H④-1](https://app.notion.com/3f52b010743c812d9964d837acdf3529) | P15(3) | 0→3 | 12個 | 統合→R24H①-3。既知の単価・能力で前半量を引き、残りを後半の単価・能力で割る。買い物の表現差はtransfer。 |
| [R24H④-2](https://app.notion.com/3f52b010743c81a49974e7fe0368bd03) | P15(3) | 0→3 | 10個 | 統合→R24H①-2。全体金額を共通量として1組の価格を足し全体を割る。同数の2商品の組と2人の1日分は同じ合成量。 |
| [R24H④-3](https://app.notion.com/3f52b010743c812e9f7fe3cfe01d9f09) | P15(3) | 0→3 | 14分35秒 | 統合→R24H①-2。同時注水の1分分を足して全体を割る。分秒換算は別の計算技能として扱い新仕事算型にしない。 |
| [R24H④-4](https://app.notion.com/3f52b010743c815182a4d4c5bfb78656) | T01(3) | 1→4 | 3時間44分後 | 統合→R24H①-2。NotionではT01出会い型だが未知の全距離を共通量に置くとP15と同じ加法・除法。T01代表は既存R20H①-1で保持。 |
| [R24H④-5](https://app.notion.com/3f52b010743c8119bcb8d80daeac1d7c) | X01(2)/X04(2) | 1→3 | 18分 | 採用：work.equal_times.total_duration。3つの方法を同時に使った時間ではなく、各方法に使う同じ時間を求めて3倍する。 |
| [R24H⑤-1](https://app.notion.com/3f52b010743c81a9b1e0d39ae0f7398f) | P15(3) | 0→3 | 27日 | 採用：work.persondays.change_staff。人日で全体と前半を求め、残りを後半人数で割った日数に前半16日を加える。 |
| [R24H⑤-2](https://app.notion.com/3f52b010743c8185a777efc18b41e577) | P15(3) | 0→3 | 3人 | 採用：work.persondays.additional_staff。残り量÷残り日数で必要総人数を出し、現在6人との差だけを増員として答える。 |
| [R24H⑤-3](https://app.notion.com/3f52b010743c8102914ffbfd1f25b7c9) | P15(3) | 0→3 | 12人 | 採用：work.persondays.fraction_total。18人×6日は全体の6割であり、割合から残り4割の人日を求め、残り6日で割る。 |
| [R24H⑤-4](https://app.notion.com/3f52b010743c811993f7e76daeed7e80) | P16(4) | 0→4 | 10日 | 採用：work.persondays.different_abilities。高校生と中学生を同じ1人分とせず、人数×日数の逆比で1人の能力を出して組み合わせる。 |
| [R24H⑤-5](https://app.notion.com/3f52b010743c81f7a878d759b4909c2b) | P16(4) | 0→4 | 6日 | 統合→R24H⑤-4。異なる能力の2集団を同じ仕事量でそろえて合成する同型。高校生/中学生と大人/子どもの違いだけ。 |
| [R24H⑥-1](https://app.notion.com/3f52b010743c8105be1dd0e1335a2a1d) | P16(4)/P12(3) | 0→4 | 36日間 | 採用：work.replacement.infer_two_rates。Aの7日分とBの5日分が同じなので能力比を逆比5:7にし、2人15日分から全体を出す。 |
| [R24H⑥-2](https://app.notion.com/3f52b010743c81ad847ae4f5a60c091a) | P16(4)/P12(3) | 1→5 | 42日間 | 採用：work.replacement.infer_three_rates。Cの4日分＝(A+B)の3日分＝Aの8日分を連結し、Bを差で取り出して3人の能力比を決める。 |
| [R24H⑥-3](https://app.notion.com/3f52b010743c8141b2f1c8176c6f5b27) | P16(4)/P12(3) | 0→4 | (1)8:7 (2)13分40秒 | 保留：比と分秒の2回答。共有条件を改作・分割せず今回は保留。P12の逆比判断は⑥-1に残す。 |
| [R24H⑥-4](https://app.notion.com/3f52b010743c81fc9039eefae4d37bc7) | P16(4)/P12(3)/T13(4) | 1→5 | (1)15分20秒 (2)6分後 | 保留：同一大問の2回答。後半の停止時刻逆算T13は独立未収録として明示し、型の完全網羅を主張しない。 |
| [R24H⑦-1](https://app.notion.com/3f52b010743c81928d55c57ba8948990) | P16(4)/X04(2) | 0→4 | 24日目 | 統合→R24H⑦-2。Notion P16＋X04共通。整数周期と残りを順に処理する同型。⑦-2は最後が部分日になるため日目判断まで確認可能。 |
| [R24H⑦-2](https://app.notion.com/3f52b010743c818cb486e7b0e928d044) | P16(4)/X04(2) | 0→4 | 22日目 | 採用：work.cycles.ordinal_finish。1周期3日の仕事量を出し、完了しない整数周期を消化した後、Aから順に残量を比べて終了日を決める。 |
| [R24H⑦-3](https://app.notion.com/3f52b010743c81f2935de6433e1edad7) | P16(4)/X04(2) | 1→5 | (1)20日目、BとC (2)67時間5分 | 保留：日目＋働く人名、実働時間の複数回答。最終日の部分時間合算は今回未収録。本文は5時間でNotion答えと一致、メモの8時間や解き筋200/5/8/10は採用しない。 |

## 原文と原本の区別

採用17問のtext/sourceText/source.sourceTextはNotionの「問題」節の全文をそのまま保存。改行・句読点も取得本文に従う。原本目視転記はsource.pdfSourceText、Notion取得本文はsource.notionSourceTextに別保存。Notionの「解き筋（下書き）」は元Nの数値が複数残っており、そのまま教材解説に流用していない。問題本文・答えと原本を照合して新たに5段階解説を制作した。Notionのverificationは未認証で、データの正確さを保証する認証として扱わない。

R24H④-5だけはNotionが『R24N④-5の数値替え／10分・18分・1時間30分』の短縮本文。[元N](https://app.notion.com/p/3f52b010743c81c2b4cfc090a631a009?pvs=204)の『各方法を同じ時間ずつ使う』条件と原本H p.37の同一番号を照合し、原本H全文を補完した。HのNotion原文自体はsource.notionSourceTextで保持し、補完をtextOriginに明示した。別問題への差替えではない。

R24H⑥-2はNotionも原本も「A1人が8日多く」。md略記だけ「B1人が8日」。A条件ではA:B:C=3:5:6、全体126、Aだけ42日で公式答えに一致する。仮にB条件ならA:B:C=5:3:6なので126/5日となる。初期調査メモの168/5日という比較値は誤りで訂正。元mdは変更していない。

## 教材化・検証

採用18問それぞれに必要判断を示すunit、5段階の解説、途中量を問う数値checkpointを付けた。答えを丸覚えするだけではcheckpointに答えられない構成。数値替えは根拠のない生成を避け、今回付けていない。関連16本は足す/引く、既知能力/逆算能力、残量/全体、同能力/異能力、同時/周期という新判断で結ぶ。

tests/selected-oneline-validation.cjsでBigInt有理数により18答えと18checkpointを独立計算し、現coreの厳密判定で正答/数値誤りを検証。Notion原文一致、18URL/UUID、scope、型基礎＋上乗せ、unit参照、16リンクを検査。同型統合・保留問題の主要数値も別式で検算した。PDF p.45の公式解答一覧と全29候補の答えが一致することを目視確認。

再現：python references/build-selected-oneline.py、python references/report-selected-oneline.py、node tests/selected-oneline-validation.cjs（pilot-sansuから実行）。Notion snapshotは2026-10-11取得時点のローカル証拠であり、その後の編集は自動追随しない。

## 既存一行3問の点検（既存ファイルは変更なし）

| 既存問題 | Notion型 | 判断 | 結論 |
|---|---|---|---|
| [R20H①-1](https://app.notion.com/3f42b010743c81cf9adcd5461b55f722) | T01/X01 | 距離を速さの和で割って時間を出す。 | 維持。T01の基本代表。 |
| [R20H①-2](https://app.notion.com/3f42b010743c81f5b8c2dd474cfe49e4) | T04/T01 | 距離÷時間で速さの和を逆算し、既知のAの速さを引いてBを出す。 | 維持。T01共通でもT04の未知能力推定が追加されるため、単なる数値替えではない。 |
| [R20H①-5](https://app.notion.com/3f42b010743c8180a7c6d617cbf7d61c) | T05/T02 | 同じ向きの周回で追いつくには1周分の差を埋めるので、1周÷速さの差。 | 維持。T05/T02で、T01の和を使う出会いと選ぶ演算・距離の意味が異なる。 |

3問ともNotion本文全文・答え・型を確認した。①-1と①-2は同じ和速関係を用いるが、必要判断が変わるので別unit維持を推奨する。すべてを式の見かけだけで一代表へ圧縮すると逆算・既知速さ控除の習得確認が消える。
