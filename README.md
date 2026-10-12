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


## 自由遠征への統合（2026-10-12）

別入口の追加問題集と自己採点を廃止しました。自動採点・4段階の解説・途中確認が完成した20問を、既存の一行問題・図形の自由遠征に追加しています。通常出題は143問（計算27・一行96・図形20）。報酬・復習段階は既存の仕組みを使い、直近復習と次回グノレブの残りが0になってから自由遠征に進めます。解説や図が未完成の選定候補は配信しません。選定資料は保管しています。
