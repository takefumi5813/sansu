"""R31（平面図形(6) 図形の移動）の代表10問を教材化する（2026-11-27）。
- 問題文・答え・細分類・難易度は Notion 問題DB の R31（代表にした10問）。図は原本PDFの白紙面から切り抜いたもの（後期3 図版と同じ切り抜き）。
- 解き筋は教材（原本の N 解説 p.18〜25 と H 解答一覧 p.41〜43）の考え方に合わせ、各ステップの数値を fractions で検算する。
  H には一部しか公式解説がないので、同じ解き方の N の解説に合わせた。答えは公式解答と一致。
- H⑥-2・H⑦-3 の問題文は Notion では「(1)(2)」と略していたので、N⑥-2・N⑦-3 と同じ聞き方で全文にした（Notion 側も同じ文に直す）。
- 入力：/home/claude/w/reps.json（Notion 登録データの抜き出し）、/home/claude/w/figs/p*.png
- 出力：content/selected-r31-oneline.json、content/notion-classification.json（10行を追加）、dist/figs/r31/*.png、
  /home/claude/w/steps_md.json（Notion に貼る段階解説の Markdown）
"""
import json, shutil, hashlib
from fractions import Fraction as F
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SRC = Path('/home/claude/w')
R = json.loads((SRC/'reps.json').read_text())
PI = F(314, 100)
CM = {'cm': '1', 'センチメートル': '1', 'mm': '1/10', 'm': '100'}
CM2 = {'cm²': '1', 'cm2': '1', '平方センチメートル': '1'}
SEC = {'秒後': '1', '秒': '1'}
KAKU = {'角形': '1'}

def _n(v): v = F(v); return str(v.numerator), str(v.denominator)
def length(v, label=None):
    n, d = _n(v); r = {'n': n, 'd': d, 'unit': 'cm', 'dimension': 'length', 'acceptedUnits': CM}
    if label: r['label'] = label
    return r
def area(v, label=None):
    n, d = _n(v); r = {'n': n, 'd': d, 'unit': 'cm²', 'dimension': 'area', 'acceptedUnits': CM2}
    if label: r['label'] = label
    return r
def sec(v, label=None):
    n, d = _n(v); r = {'n': n, 'd': d, 'unit': '秒後', 'dimension': 'scalar', 'acceptedUnits': SEC}
    if label: r['label'] = label
    return r
def kaku(v, label):
    n, d = _n(v); return {'n': n, 'd': d, 'unit': '角形', 'dimension': 'scalar', 'acceptedUnits': KAKU, 'label': label}
def sc(v, unit=''):
    n, d = _n(v); return {'n': n, 'd': d, 'unit': unit, 'dimension': 'scalar'}
def st(title, body, eq, cp=None, check=True):
    assert check is True, (title, eq)
    s = {'title': title, 'body': body, 'equation': eq}
    if cp: s['checkpoint'] = {'prompt': cp[0], 'answer': sc(cp[1], cp[2] if len(cp) > 2 else '')}
    return s

TEXT = {
 'R31H⑥-2': '図のようなところを、半径4cmの円がAの位置からBの位置まで線にそって転がります。(1) 円の中心がえがく線の長さを求めなさい。(2) 円が通った部分の面積を求めなさい。（円周率は3.14）（図：右はしにかべのある長さ30cmの段の上（A）から、段の角をまわって高さ30cmのかべにそって下の床（B）まで）',
 'R31H⑦-3': '図のようなかぎ形をした図形のまわりを半径4cmの円が1周します。(1) 円の中心が通ったあとの線の長さを求めなさい。(2) 円が通ったあとの部分の面積を求めなさい。（円周率は3.14）（図：1辺30cmの正方形の右下から1辺15cmの正方形を切り取ったかぎ形。辺は30・15・15・15・15・30cm）',
}

P = {}
def add(code, uid, name, decision, ans, steps, domain):
    P[code] = dict(u=dict(id=uid, name=name, definition=name, decision=decision), ans=ans, steps=steps, domain=domain)

# ---------- 平行移動（重なり） ----------
add('R31H①-1', 'r31.slide.overlap_isosceles', 'ずらした直角二等辺三角形の重なり：底辺から高さ', 'ずらした長さだけ底辺が短い、同じ形の直角二等辺三角形が重なり',
    {'answer': area(25)},
    [st('重なりの形', '同じ直角二等辺三角形を横にずらすと、重なり（かげの部分）も直角二等辺三角形になります。', 'かげ＝直角二等辺三角形'),
     st('かげの底辺', 'ずらした4cmの分だけ、かげの底辺は短くなります。', '14−4＝10（cm）', ('かげの三角形の底辺は何cmですか。', 10, 'cm'), 14-4 == 10),
     st('かげの高さ', '直角二等辺三角形の高さは、斜めの辺（底辺）の半分です。', '10÷2＝5（cm）', None, F(10, 2) == 5),
     st('面積', '底辺10cm、高さ5cmの三角形です。', '10×5÷2＝25（cm²）', None, F(10*5, 2) == 25)], '図形の移動（平行移動）')

add('R31H②-2', 'r31.slide.contain_and_area', '2つの直角二等辺三角形：含まれる時間・重なりが○cm²の時刻', '頂点どうしが重なる瞬間を「動いた長さ÷速さ」で出す。重なりは直角二等辺三角形',
    {'parts': [sec(6, '(1)から'), sec(F(17, 2), '(1)まで'), sec(F(7, 2), '(2)1回目'), sec(11, '(2)2回目')]},
    [st('完全に含まれ始めるとき', 'BがEに重なると、三角形ABCが三角形DEFの中に入りきります。Bは8＋4＝12cm動きます。', '12÷2＝6（秒後）', None, F(8+4, 2) == 6),
     st('完全に含まれ終わるとき', 'CがFに重なるまでは中に入っています。Cは4＋13＝17cm動きます。', '17÷2＝8.5（秒後）', ('完全に含まれ終わるのは何秒後ですか。', F(17, 2), '秒後'), F(4+13, 2) == F(17, 2)),
     st('重なりの形', '重なりはいつも直角二等辺三角形です。面積4.5cm²なら、等しい辺は3cmです。', '□×□÷2＝4.5 → □＝3（cm）', None, F(3*3, 2) == F(9, 2)),
     st('1回目', 'CがEより3cm右に進んだときです。', '(4＋3)÷2＝3.5（秒後）', None, F(4+3, 2) == F(7, 2)),
     st('2回目', '三角形ABCがFをこえていき、BがFの3cm手前にきたときです。', '(8＋4＋13−3)÷2＝11（秒後）', None, F(8+4+13-3, 2) == 11)], '図形の移動（平行移動）')

add('R31H②-3', 'r31.slide.both_move', '両方が動く（出会い）：重なりが○cm²→近づいた長さ÷速さの和', '2つの図形が近づく速さは速さの和。重なりの形から近づいた長さを出す',
    {'answer': sec(8)},
    [st('重なりの形', 'はじめの重なりは直角二等辺三角形です。面積8cm²なら、等しい辺は4cmです。', '□×□÷2＝8 → □＝4（cm）', ('重なりの直角二等辺三角形の等しい辺は何cmですか。', 4, 'cm'), F(4*4, 2) == 8),
     st('近づいた長さ', '間の20cmをうめて、さらに4cm重なるまでに近づく長さです。', '20＋4＝24（cm）', None, 20+4 == 24),
     st('近づく速さ', '向かい合って動くので、1秒に近づく長さは速さの和です。', '2＋1＝3（cm）', None, 2+1 == 3),
     st('時間', '24cmを1秒に3cmずつ近づきます。', '24÷3＝8（秒後）', None, F(24, 3) == 8)], '図形の移動（平行移動）')

# H③-1：形の変化（座標で確かめる。長方形 x0..10, 高さ5。三角形は左はしL、先L+8、高さはL+8−x）
def shape_kind(m):
    L = F(m) - 14
    tip = L + 8
    if tip <= 0: return 0
    cut_top = (L + 8 - max(L, 0)) > 5           # 重なりの左はしでの高さが5をこえる
    cut_right = tip > 10
    if cut_right and L + 8 - 10 >= 5: return 4   # 右の辺で高さ5以上→長方形
    return 3 + int(cut_top) + int(cut_right)
seq = []
for m in [F(k, 4) for k in range(1, 4*24)]:
    k = shape_kind(m)
    if k and (not seq or seq[-1] != k): seq.append(k)
assert seq == [3, 4, 5, 4], seq
assert shape_kind(F(161, 10)) == 5 and shape_kind(F(209, 10)) == 5 and shape_kind(F(159, 10)) == 4 and shape_kind(F(211, 10)) == 4
add('R31H③-1', 'r31.slide.shape_change', '重なりの形の変化（三・四・五角形）と時間', '重なりの辺が長方形のどの辺で切られるかを順に見る。切られはじめ・終わりの位置を「動いた長さ」で出す',
    {'parts': [kaku(3, '㋐'), kaku(4, '㋑'), kaku(5, '㋒'), kaku(4, '㋓'), sec(8, '(2)から'), sec(F(21, 2), '(2)まで')]},
    [st('はじめは三角形、次に四角形', '三角形の先が長方形に入ると、重なりは三角形です。重なりのはばが5cmをこえると、長方形の上の辺で切られて四角形になります。', '三角形 → 四角形'),
     st('五角形になる', '三角形の先が長方形の右の辺をこえると、右の辺でも切られて五角形になります。', '三角形の先が右の辺をこえる → 五角形', ('㋒は何角形ですか（数を答えます）。', 5, '角形')),
     st('五角形になり始めるとき', '三角形の先が、間の6cmと長方形の横10cmを進んだときです。', '(6＋10)÷2＝8（秒後）', None, F(6+10, 2) == 8),
     st('五角形が終わるとき', 'ななめの辺の高さが5cmになる点（直角の辺から8−5＝3cm右）が、長方形の右の辺にきたときです。', '(8＋6＋10−3)÷2＝10.5（秒後）', None, F(8+6+10-3, 2) == F(21, 2)),
     st('最後の形', 'そのあとは長方形の右側が高さ5cmいっぱいに重なり、四角形（長方形）になります。', '三→四→五→四')], '図形の移動（平行移動）')

# H③-2（長方形 x0..6, 高さ3。三角形は左はし −2、頂点 x=2 高さ4、右はし6）
def over(a):
    # a＝三角形の左はしの位置。∫min(3, 高さ) を区分で数える（1/100刻みの台形近似ではなく、折れ線の区間で正確に）
    pts = sorted(set([F(0), F(6), a, a+4, a+8] + [a+3, a+5]))
    pts = [p for p in pts if 0 <= p <= 6]
    def h(x):
        if x < a or x > a+8: return F(0)
        return min(F(3), (x-a) if x <= a+4 else (a+8-x))
    return sum((pts[i+1]-pts[i])*(h(pts[i])+h(pts[i+1]))/2 for i in range(len(pts)-1))
assert over(F(-2)) == 13
best = max((over(F(k, 10) - 10), F(k, 10)) for k in range(0, 200))
assert best[0] == over(F(-1)) and over(F(-1)) > over(F(-11, 10)) and over(F(-1)) > over(F(-9, 10))
add('R31H③-2', 'r31.slide.overlap_max', '直角二等辺三角形と長方形：重なりの面積・最大になる時刻', '重なり＝長方形−はみ出す直角二等辺三角形。はみ出しが最も小さいのは左右に同じだけはみ出すとき',
    {'parts': [area(13, '(1)'), sec(F(9, 2), '(2)')]},
    [st('4秒後の位置', '2×4＝8cm動くので、三角形の右はしは長方形の左はしから8−2＝6cm、ちょうど右はしにきます。', '2×4−2＝6（cm）', None, 2*4-2 == 6),
     st('はみ出す部分', '長方形の高さは3cm、三角形の高さは4cmです。長方形の左上と右上に、等しい辺1cmと3cmの直角二等辺三角形が三角形の外にはみ出します。', '1cmと3cm'),
     st('(1)の面積', '長方形からはみ出す部分を引きます。', '3×6−(1×1÷2＋3×3÷2)＝13（cm²）', ('(1)の答えは何cm²ですか。', 13, 'cm²'), 3*6-(F(1, 2)+F(9, 2)) == 13),
     st('(2) 最も大きくなるとき', '三角形の頂点が長方形のはばの真ん中にくると、左右のはみ出しが1cmずつで最も小さくなります。三角形の左はしが長方形の左はしの1cm手前にきたときです。', '(2＋8−1)÷2＝4.5（秒後）', None, F(2+8-1, 2) == F(9, 2))], '図形の移動（平行移動）')

# H③-3（正方形 0..4。三角形：左はしa、右はしa+12、頂点a+6 高さ6。a＝m−15）
def cut(m):
    a = F(m) - 15
    r = a + 12
    right = max(F(0), 8 - r) if r < 8 else F(0)       # x+y＞r の部分（右上の角）
    left = max(F(0), 4 + a) if a > -4 else F(0)       # y＞x−a の部分（左上の角）
    return 16 - right*right/2 - left*left/2
assert cut(8) == F(23, 2) and cut(14) == F(23, 2) and cut(F(79, 10)) < F(23, 2) and cut(F(141, 10)) < F(23, 2)
add('R31H③-3', 'r31.slide.overlap_time_twice', '重なりが○cm²になる2つの時刻（逆算）', '正方形から切り取られる直角二等辺三角形の大きさを出し、右のななめの辺・左のななめの辺の位置にもどす',
    {'parts': [sec(4, '1回目'), sec(7, '2回目')]},
    [st('切り取られる部分', '重なり11.5cm²のとき、正方形16cm²から直角二等辺三角形が切り取られています。その面積と等しい辺を出します。', '16−11.5＝4.5、□×□÷2＝4.5 → □＝3（cm）', ('切り取られる直角二等辺三角形の等しい辺は何cmですか。', 3, 'cm'), 16-F(23, 2) == F(9, 2) and F(9, 2) == F(9, 2)),
     st('1回目の位置', '1回目は、右のななめの辺が正方形の右上の角を切り取るときです。右はしは正方形の右下の角から4−3＝1cm右にあります。', '3＋4＋1＝8（cm）動く', None, 3+4+1 == 8),
     st('1回目の時刻', '秒速2cmで8cm動きます。', '8÷2＝4（秒後）', None, F(8, 2) == 4),
     st('2回目', '2回目は、左のななめの辺が正方形の左上の角を3cm切り取るときで、左はしは正方形の左の辺の1cm手前です。', '(12＋3−1)÷2＝7（秒後）', None, F(12+3-1, 2) == 7)], '図形の移動（平行移動）')

# ---------- 回転移動（転がす） ----------
a1, a2, a3 = 90-60, 360-(60+90), 90-60
assert (a1, a2, a3) == (30, 210, 30)
add('R31N④-3', 'r31.roll.triangle_around_square', '正方形のまわりを正三角形が転がる：中心角を1つずつ出す', '回転の中心になる頂点ごとに「何度回るか」を出し、同じ半径の弧をまとめる',
    {'answer': length(F(471, 50))},
    [st('転がり方', '正三角形は、正方形の左下・左上・右上の角を中心に3回回ります。点Aはどの回転でも動き、半径はいつも2cmです。', '半径2cmの弧が3つ'),
     st('1回目と3回目', '正方形の角90°から正三角形の角60°を引いた分だけ回ります。', '90−60＝30（度）', None, a1 == 30),
     st('2回目', '正方形の上の左の角では、まわりの360°から正三角形の60°と正方形の90°を引いた分だけ回ります。', '360−(60＋90)＝210（度）', ('3回の中心角の合計は何度ですか。', 270, '度'), a1+a2+a3 == 270),
     st('長さ', '半径2cmの円の、270°分の弧です。', '4×3.14×270/360＝9.42（cm）', None, 4*PI*F(270, 360) == F(471, 50))], '図形の移動（転がり）')

arc = 20*PI*F(36, 360); quarter = 20*PI*F(90, 360)
assert arc == F(157, 25) and quarter*2 + arc == F(942, 25)
add('R31H⑤-2', 'r31.roll.sector_center', 'おうぎ形を転がす：中心の線・おうぎ形が通った部分の面積', '①半径の先を中心に90°回る ②弧が転がる間は中心が直線と平行に弧の長さだけ進む ③反対の半径の先を中心に90°',
    {'parts': [length(F(942, 25), '(1)'), area(F(1099, 5), '(2)')]},
    [st('点Oの動き', '① Aを中心に90°回る（半径10cm）② 弧が直線の上を転がる間、Oは直線と平行に弧の長さだけ進む ③ Bを中心に90°回る。', '曲線2つ＋直線1つ'),
     st('(1) 曲線の部分', '半径10cm、中心角90°の弧が2つです。', '20×3.14×90/360×2＝31.4（cm）', None, quarter*2 == F(157, 5)),
     st('(1) まっすぐな部分', '弧の長さ（中心角36°）と同じだけ進みます。', '20×3.14×36/360＝6.28 → 31.4＋6.28＝37.68（cm）', ('(1)の答えは何cmですか。', F(942, 25), 'cm'), quarter*2+arc == F(942, 25)),
     st('(2) 通った部分', '半径10cm・中心角90°のおうぎ形2つと、たて10cm・横6.28cmの長方形です。', '10×10×3.14×90/360×2＋10×6.28＝219.8（cm²）', None, 100*PI*F(90, 360)*2 + 10*arc == F(1099, 5))], '図形の移動（転がり）')

L1 = (30-4)*2 + 8*PI*F(90, 360)
A1 = 8*26*2 + 8*8*PI*F(90, 360) + 4*4*PI*F(180, 360)*2
assert L1 == F(1457, 25) and A1 == F(12912, 25)
add('R31H⑥-2', 'r31.roll.circle_step', '円が段を転がる：外側の角はおうぎ形が加わる', '中心の通り道は辺から半径だけはなれた線。外側の角では中心が角を中心に回る。通った部分＝帯＋角のおうぎ形＋両はしの半円',
    {'parts': [length(F(1457, 25), '(1)'), area(F(12912, 25), '(2)')]},
    [st('中心の通り道', '円の中心は、段の上を30−4＝26cm進み、段の角を中心に半径4cmの四分円をえがき、かべにそって30−4＝26cm下ります。', '26cm、四分円、26cm', None, 30-4 == 26),
     st('(1) 長さ', 'まっすぐな部分2本と、半径4cmの四分円の弧です。', '26×2＋8×3.14×90/360＝58.28（cm）', ('(1)の答えは何cmですか。', F(1457, 25), 'cm'), L1 == F(1457, 25)),
     st('(2) 帯の部分', '中心がまっすぐ進む間、円ははば8cm（直径）の帯を通ります。', '8×26×2＝416（cm²）', None, 8*26*2 == 416),
     st('(2) 角と両はし', '段の角では半径8cmの四分円、出発と到着の位置では半径4cmの半円が2つ加わります。', '8×8×3.14×90/360＋4×4×3.14×180/360×2＝100.48 → 416＋100.48＝516.48（cm²）', None, A1 == F(12912, 25))], '図形の移動（転がり）')

L2 = 30+30+15+15+(15-4)*2 + 8*PI*F(90, 360)*5
A2 = (30+30+15+15)*8 + 8*8*PI*F(90, 360)*5 + (15*15-(15-8)*(15-8)) - (4*4-4*4*PI*F(90, 360))
assert L2 == F(717, 5) and A2 == F(28594, 25)
add('R31H⑦-3', 'r31.roll.circle_around_l', 'かぎ形のまわりを1周：へこんだ角は通れない部分がある', '出っぱった角はおうぎ形、へこんだ角は中心の線が短くなり、すみに円が届かない部分が残る',
    {'parts': [length(F(717, 5), '(1)'), area(F(28594, 25), '(2)')]},
    [st('(1) まっすぐな部分', '外側の辺30・30・15・15はそのまま。へこんだ角をはさむ2辺は、半径4cmずつ短くなります。', '30＋30＋15＋15＋11＋11＝112（cm）', None, 30+30+15+15+11+11 == 112),
     st('(1) 曲線の部分', '出っぱった角5か所で、半径4cmの四分円の弧をえがきます。', '8×3.14×90/360×5＝31.4 → 112＋31.4＝143.4（cm）', ('(1)の答えは何cmですか。', F(717, 5), 'cm'), L2 == F(717, 5)),
     st('(2) 外側の帯と角', '外側の4辺にそったはば8cmの帯と、5つの角の半径8cmのおうぎ形です。', '(30＋30＋15＋15)×8＝720、8×8×3.14×90/360×5＝251.2', None, (30+30+15+15)*8 == 720 and 64*PI*F(1, 4)*5 == F(1256, 5)),
     st('(2) へこんだ角', 'へこんだ角のまわりは、1辺15cmの正方形から1辺7cmの正方形を引いた形から、円が届かないすみを引きます。', '15×15−7×7＝176、4×4−4×4×3.14×90/360＝3.44 → 176−3.44＝172.56', None, 176-(16-16*PI/4) == F(4314, 25)),
     st('(2) 合計', '3つを合わせます。', '720＋251.2＋172.56＝1143.76（cm²）', None, A2 == F(28594, 25))], '図形の移動（転がり）')

assert len(P) == 10 and set(P) == set(R), set(R) ^ set(P)
FIGPAGE = {'R31H①-1': 657, 'R31H②-2': 661, 'R31H②-3': 662, 'R31H③-1': 663, 'R31H③-2': 664, 'R31H③-3': 665, 'R31N④-3': 646, 'R31H⑤-2': 670, 'R31H⑥-2': 672, 'R31H⑦-3': 677}

def fmt(v):
    v = F(v)
    if v.denominator == 1: return str(v.numerator)
    d = v.denominator
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    if d == 1: return format(float(v), 'f').rstrip('0').rstrip('.')
    w, r = divmod(v.numerator, v.denominator)
    return f'{w}と{r}/{v.denominator}' if w else f'{r}/{v.denominator}'

def steps_md(code, steps):
    out = ['## 段階解説（一問一答）', '', '<toggle>', '答えと解説', '', f"<b>答え：{R[code]['ans']}</b>", '']
    for i, s in enumerate(steps, 1):
        out += [f"### {i}. {s['title']}", '', s['body'], '', s['equation'], '']
        if 'checkpoint' in s:
            a = s['checkpoint']['answer']
            out += [f"途中確認：{s['checkpoint']['prompt']}", '', f"答え：{fmt(F(int(a['n']), int(a['d'])))}{a['unit']}", '']
    while out[-1] == '': out.pop()
    out.append('</toggle>')
    return '\n'.join(out)

problems, units, cls_rows, md = [], [], {}, {}
cls = json.loads((ROOT/'content/notion-classification.json').read_text())
for code, v in P.items():
    r = R[code]; pid = r['pid']
    steps = v['steps']
    for i, s in enumerate(steps): s['id'] = f's{i+1}'
    assert 4 <= len(steps) <= 8 and any('checkpoint' in s for s in steps), code
    diff = cls['subdivisions'][r['sub']]['base'] + r['up']
    text = TEXT.get(code, r['text'])
    prob = {'id': code, 'unitId': v['u']['id'], 'category': 'geometry', 'domain': v['domain'], 'text': text, 'sourceText': text,
            'source': {'title': code, 'url': 'https://app.notion.com/' + pid, 'notionPageId': pid,
                       'path': 'C:/Users/tsuzu/Dropbox/算数DB/原本/5年授業/5-31 平面図形(6)-図形の移動-.pdf', 'locator': f'5年No.31 {code}（図は後期3 図版 p.{FIGPAGE[code]} と同じ切り抜き）',
                       'scopeUnits': ['R31'], 'databasePath': 'C:/Users/tsuzu/Dropbox/算数DB/本文/算数DB_通常授業_後期.md',
                       'verification': '2026-11-27 Claude作成。問題文・答えは Notion 問題DB（原本から全文）と一致し、答えは公式解答と一致。段階解説は教材の解説の解き方に即して作成し（H は解説が一部だけなので同じ型の N の解説に合わせた）、各ステップの式を Python（fractions）で検算。平行移動の3問は重なりの形・面積を座標でも検算。',
                       'sourceAnswer': r['ans'], 'textOrigin': 'notion-problem-body-verbatim', 'difficultyProvenance': 'Notion細分類の基礎難度＋上乗せ。'},
            'answer': v['ans'].get('answer') or {'parts': v['ans']['parts']}, 'difficulty': diff, 'scopeUnits': ['R31'], 'homeStudy': code.startswith('R31H'), 'revision': 1,
            'explanation': {'steps': steps}}
    fname = f'figs/r31/{code[3:]}.png'
    (ROOT/'dist/figs/r31').mkdir(parents=True, exist_ok=True)
    shutil.copy(SRC/'figs'/f'p{FIGPAGE[code]}.png', ROOT/'dist'/fname)
    prob['figure'] = fname; prob['figureRequired'] = True
    prob['source']['figureSha256'] = hashlib.sha256((ROOT/'dist'/fname).read_bytes()).hexdigest()
    problems.append(prob)
    units.append({**v['u'], 'domain': v['domain'], 'representativeId': code, 'prerequisites': []})
    cls_rows[pid] = {'sub': r['sub'], 'related': r['rel'], 'difficulty': diff, 'rep': True, 'variant': False}
    md[code] = steps_md(code, steps)
links = [{'from': 'r31.slide.overlap_isosceles', 'to': 'r31.slide.contain_and_area', 'relation': 'extension', 'difference': '止まった重なりから、動かして重なりが変わる形へ。'},
         {'from': 'r31.slide.contain_and_area', 'to': 'r31.slide.both_move', 'relation': 'extension', 'difference': '片方だけ動く形から、両方が向かい合って動く形へ。'},
         {'from': 'r31.slide.shape_change', 'to': 'r31.slide.overlap_max', 'relation': 'extension', 'difference': '形の変化から、面積が最大になる位置へ。'},
         {'from': 'r31.slide.overlap_max', 'to': 'r31.slide.overlap_time_twice', 'relation': 'extension', 'difference': '時刻から面積を出す形から、面積から2つの時刻を逆算する形へ。'},
         {'from': 'r31.roll.circle_step', 'to': 'r31.roll.circle_around_l', 'relation': 'extension', 'difference': '出っぱった角だけの道から、へこんだ角のある図形のまわりへ。'}]
analysis = [{'kind': 'selection_basis', 'detail': 'Notion問題DBのR31で「代表」にした10問（細分類×難易度ごと）。H（家庭学習用）はNの数値替えなのでHを代表にし、Hの聞き方がちがうN④-3はNを代表にした。T（R30の復習）・計算マスターは同じ細分類×難易度にすでに代表があるので代表にしない。'},
            {'kind': 'difficulty', 'detail': 'DはNotionの難易度（細分類の基礎難度＋上乗せ）。'},
            {'kind': 'scope', 'detail': 'R31は11/27に履修。直近授業をR31にし、次回グノレブ（12/11、No.28〜31）の範囲に履修済みのR28〜R31を入れる。'}]
out = {'problems': problems, 'units': units, 'links': links, 'analysis': analysis}
(ROOT/'content/selected-r31-oneline.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
cls['problems'].update(cls_rows)
(ROOT/'content/notion-classification.json').write_text(json.dumps(cls, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(SRC/'steps_md.json').write_text(json.dumps(md, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(problems), [(p['id'], p['difficulty']) for p in problems])
