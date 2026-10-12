# 宝箱の描き直し

前版の平面的なSVGを、既存の装備画像の描画密度に合わせた透過PNGに交換しました。古金色の彫金、紺色の木目、金属の厚み、陰影を加えました。開いた状態は蓋が蝶番で本体につながり、紺色の内張りが見えます。2枚を切り替えて開封を表現します。

生成には組み込みの ImageGen を使用。既存の `app/dist/assets/equipment/storm-axe-v1.png` を質感と画風の参考にしました。出力はどちらも1254×1254、RGBA、背景透過です。生成後の画像加工は行っていません。

保存先：

- `assets/treasure/relic-chest-closed-v2.png`
- `assets/treasure/relic-chest-open-v2.png`
- 配信用に同一ファイルを `app/dist/assets/treasure/` に配置。

## 生成プロンプト

### 閉じた状態

Use case: stylized-concept. Asset type: production transparent PNG treasure chest for an illustrated fantasy mathematics RPG. The reference axe is STYLE AND MATERIAL reference only; create a NEW subject, one CLOSED treasure chest. Match the axe's refined painterly realism, densely engraved antique gold fittings, dimensional worn metal highlights, deep midnight blue material and small restrained amethyst. Chest: substantial heirloom reliquary, dark navy lacquered wood with visible subtle grain, thick aged brass/gold bands, finely engraved botanical scrollwork, reinforced corners, substantial central lock with a small violet crystal. Elegantly crafted, convincingly heavy, neither cute nor cartoon. View almost front on, camera slightly above, tiny right side visible, horizontal chest centered. Closed lid. Warm soft upper-left light, cool navy shadows, crisp readable silhouette at 240px display size. Isolated on GENUINELY TRANSPARENT background, no environment, no floor, no cast shadow outside object, no glow or particles, no text, no symbols or UI. Whole object fits inside square canvas, approximately 85% canvas width, leave top and bottom transparent margin. This is a game item illustration, not a flat icon or vector diagram. Render detailed engraved physical materials matching the supplied axe.

### 開いた状態

Use case: precise-object-edit. Create the OPEN state of this exact fantasy treasure chest for a game animation. Preserve the same square canvas, genuinely transparent background, camera angle, chest width, base position, body silhouette, navy wood grain, antique engraved gold material, violet gem and lighting. Keep the LOWER BODY pixel-aligned as closely as possible at the same position; do not resize or move it. Change only the lid: naturally hinged backward and upward to an open 65-degree position, fitted to the body with connected hinges, with a dark navy velvet interior and subtle warm gold light just inside the cavity. The lid should be visibly physically connected rather than floating. Open lid may use transparent space above current chest. Empty chest: no equipment, coins, treasure piles, text, particles, magical rays or external glow. No ground or background. Exactly the same refined painted realistic game-item style. Important: this is a matching alternate animation state, keep the body and perspective invariant. Preserve actual alpha transparency.
