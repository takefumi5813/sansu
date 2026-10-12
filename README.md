# 算数クロニクル

「冒険に進む」から入る算数一問一答。計算・一行問題・図形の学びで装備を鍛え、英雄を召喚します。

公開画面はルートの index.html。学習記録は利用端末のブラウザーに保存されます。

今回の教材はNotionを基準に選定した49問（計算27・一行21・図形1）。復習と次回グノレブ対策は既習の第24回を対象とし、第25〜27回は含めません。選定の詳細は docs/ を参照してください。

## 開発

ソース・教材は app/ にあります。

```text
node app/build.cjs
node --test app/tests/core.test.cjs app/tests/gear.test.cjs app/tests/selected-calc.test.cjs
node app/tests/selected-oneline-validation.cjs
node app/tests/selected-geometry-validation.cjs
```

ビルド結果は app/dist/。配信時は index.html と assets/、figs/ をルートへコピーします。ブラウザー検証は開発環境のPlaywrightとChromeのパスを指定します。教材再選定スクリプトはローカル保管のNotionスナップショットを必要とします。個人の学習履歴・誤答ログ・Notionの生スナップショットはこのリポジトリに含めません。


## 追加問題集（2026-10-12）

選定一覧479件（404出典ページ、複数小問を含む）を取り込みました。ホームの「追加問題集を見る」から開けます。既存問題対応84件、答え合わせ練習136件、図・条件などの補完予定259件です。補完予定も答えの記載があるため開けますが、資料記載の参考解答として表示し、自動採点はしません。直近復習・次回グノレブを終えた後に利用できます。追加練習のメモと自己確認結果は端末に保存します。通常の自動出題は123問です。Notionは更新していません。
