"""R30（平面図形(5) かげ・折り返し）の代表23問を教材化する（2026-11-20）。
- 問題文・答え・細分類・難易度は Notion 問題DB の R30（代表にした23問）。図は原本PDFの白紙面から切り抜いたもの。
- 解き筋は教材（原本の解答・解説：N解説 p.20〜29、H解答 p.66〜68、T解説 p.43〜50）の考え方に合わせ、各ステップの数値を fractions で検算する。
  H⑤-1・H⑥-2・H⑥-3 は H に公式解説がないので、同じ解き方の N⑤-1・N⑥-2・N⑥-3 の解説に合わせた。答えは公式解答と一致。
- T⑤の面積・比は、座標（斜交座標でも面積比・辺の比は変わらない）でも別に検算する。
- 入力：/home/claude/r30/appsrc/reps.json（Notion 登録データの抜き出し）、/home/claude/r30/appsrc/figs/*.png
- 出力：content/selected-r30-oneline.json、content/notion-classification.json（23行を追加）、dist/figs/r30/*.png、
  /home/claude/r30/appsrc/steps_md.json（Notion に貼る段階解説の Markdown）
"""
import json, shutil, hashlib
from fractions import Fraction as F
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SRC = Path('/home/claude/r30/appsrc')
R = json.loads((SRC/'reps.json').read_text())
CM = {'cm': '1', 'センチメートル': '1', 'mm': '1/10', 'm': '100'}
M = {'m': '1', 'メートル': '1', 'cm': '1/100'}
CM2 = {'cm²': '1', 'cm2': '1', '平方センチメートル': '1'}
SPEED = {'m/秒': '1', 'm/s': '1', 'cm/秒': '1/100'}

def _n(v): v = F(v); return str(v.numerator), str(v.denominator)
def length(v, label=None, unit='cm', acc=None):
    n, d = _n(v); r = {'n': n, 'd': d, 'unit': unit, 'dimension': 'length', 'acceptedUnits': acc or (M if unit == 'm' else CM)}
    if label: r['label'] = label
    return r
def area(v, label=None, unit='cm²', acc=None):
    n, d = _n(v); r = {'n': n, 'd': d, 'unit': unit, 'dimension': 'area', 'acceptedUnits': acc or CM2}
    if label: r['label'] = label
    return r
def ratio(*t, label=None):
    r = {'dimension': 'ratio', 'terms': [str(x) for x in t], 'unit': ''}
    if label: r['label'] = label
    return r
def sc(v, unit='', label=None, acc=None):
    n, d = _n(v); r = {'n': n, 'd': d, 'unit': unit, 'dimension': 'scalar'}
    if acc: r['acceptedUnits'] = acc
    if label: r['label'] = label
    return r
def speed(v, label=None):
    n, d = _n(v); r = {'n': n, 'd': d, 'unit': 'm/秒', 'dimension': 'speed', 'acceptedUnits': SPEED}
    if label: r['label'] = label
    return r
def st(title, body, eq, cp=None, check=True):
    assert check is True, (title, eq)
    s = {'title': title, 'body': body, 'equation': eq}
    if cp: s['checkpoint'] = {'prompt': cp[0], 'answer': sc(cp[1], cp[2] if len(cp) > 2 else '')}
    return s

# 座標での検算（T⑤）
def meet(p1, p2, p3, p4):
    """直線p1p2と直線p3p4の交点"""
    (x1, y1), (x2, y2), (x3, y3), (x4, y4) = p1, p2, p3, p4
    den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
    a, b = x1*y2 - y1*x2, x3*y4 - y3*x4
    return ((a*(x3-x4) - (x1-x2)*b)/den, (a*(y3-y4) - (y1-y2)*b)/den)
def poly(*ps):
    s = 0
    for i in range(len(ps)):
        (x1, y1), (x2, y2) = ps[i], ps[(i+1) % len(ps)]
        s += x1*y2 - x2*y1
    return abs(F(s))/2
def lerp(p, q, t): return (p[0] + (q[0]-p[0])*t, p[1] + (q[1]-p[1])*t)
def dist_ratio(p, q, r):
    """p→q と p→r の長さの比（同じ直線上）"""
    return (q[0]-p[0])/(r[0]-p[0]) if r[0] != p[0] else (q[1]-p[1])/(r[1]-p[1])

P = {}
def add(code, uid, name, decision, ans, steps, cat='geometry', domain='かげと相似'):
    P[code] = dict(u=dict(id=uid, name=name, definition=name, decision=decision), ans=ans, steps=steps, cat=cat, domain=domain)

# ---------- かげ（電灯） ----------
add('R30H①-1', 'r30.shadow.lamp_distance', '電灯のかげ：高さの比＝地面の長さの比（距離を求める）', '照明灯と人でピラミッド形。高さの比が「照明灯の根もとからかげの先まで」と「かげ」の比になる',
    {'answer': length(3, unit='m')},
    [st('ピラミッド形を見つける', 'かげの先を頂点にして、照明灯（4m）と人（1.6m）が平行に立っています。大小2つの直角三角形は相似です。', '4：1.6＝5：2', None, F(4)/F(8, 5) == F(5, 2)),
     st('地面の長さの比', '高さの比5：2が、そのまま「照明灯の根もとからかげの先まで」：「かげ」の比になります。', '全体⑤：かげ②', ('かげ2mは比のいくつにあたりますか。', 2), True),
     st('比の1にあたる長さ', 'かげ2mが②なので、①は1mです。', '2÷2＝1（m）', None, F(2, 2) == 1),
     st('xを求める', 'xは全体⑤からかげ②を引いた③です。', 'x＝1×(5−2)＝3（m）', None, F(2, 2)*(5-2) == 3)])

add('R30H①-2', 'r30.shadow.lamp_length', '電灯のかげ：差の比からかげの長さを出す', '高さの比で地面の長さの比を出し、照明灯から人までの長さを「全体−かげ」の比にあてる',
    {'answer': length(F(12, 5), unit='m')},
    [st('高さの比', '照明灯4.9mとマサト君1.4mで、かげの先を頂点にしたピラミッド形の相似ができます。', '4.9：1.4＝7：2', None, F(49, 10)/F(14, 10) == F(7, 2)),
     st('地面の長さの比', '「照明灯からかげの先まで」：「かげ」＝7：2です。照明灯からマサト君までは、その差の⑦−②＝⑤です。', '7−2＝5', ('照明灯からマサト君までの6mは比のいくつですか。', 5), True),
     st('比の1にあたる長さ', '6mが⑤にあたります。', '6÷5＝1.2（m）', None, F(6, 5) == F(12, 10)),
     st('かげの長さ', 'かげは②です。', '1.2×2＝2.4（m）', None, F(6, 5)*2 == F(12, 5))])

add('R30H①-3', 'r30.shadow.lamp_height', '電灯のかげ：地面の長さの比から高さを出す', '「照明灯からかげの先まで」：「かげ」の比が、照明灯：木の高さの比',
    {'answer': length(F(5, 2), unit='m')},
    [st('地面の長さ', '照明灯の根もとから木のかげの先までは、3＋5＝8mです。', '3＋5＝8（m）', None, 3+5 == 8),
     st('相似比', 'かげの先を頂点にしたピラミッド形で、照明灯と木が対応します。', '8：5', ('照明灯と木の高さの比は8：□。□はいくつですか。', 5), True),
     st('木の高さ', '照明灯4mが⑧にあたるので、木は⑤です。', '4×5/8＝2.5（m）', None, 4*F(5, 8) == F(5, 2)),
     st('確かめ', '木2.5mとかげ5mの比は1：2、照明灯4mと8mも1：2で同じ形です。', '2.5：5＝4：8', None, F(5, 2)/5 == F(4, 8))])

add('R30H①-4', 'r30.shadow.sun_basic', '太陽のかげ：棒の高さ：かげの比を使う', '太陽の光は平行なので、同じ時刻なら高さ：かげの比はどこでも同じ',
    {'answer': length(F(5, 2), unit='m')},
    [st('太陽の光は平行', '同じ時刻なら、太陽の光の向きはどこでも同じです。木と棒のかげの三角形は相似です。', '高さ：かげ＝1：1.8'),
     st('木のかげは棒のかげの何倍か', '木のかげ4.5mは、棒のかげ1.8mの何倍かを求めます。', '4.5÷1.8＝2.5（倍）', ('木のかげは棒のかげの何倍ですか。', F(5, 2), '倍'), F(45, 10)/F(18, 10) == F(5, 2)),
     st('木の高さ', '高さも同じ2.5倍です。', '1×2.5＝2.5（m）', None, 1*F(5, 2) == F(5, 2)),
     st('確かめ', '2.5：4.5＝5：9、1：1.8＝5：9で同じ比です。', '5：9', None, F(5, 2)/F(9, 2) == 1/F(9, 5))], domain='かげと相似')

add('R30H②-2', 'r30.shadow.wall_step_reverse', 'かべ・段差にできるかげ（逆算）：高さの差からかげ', 'かべにうつった高さで水平に切る／低い地面の高さで考える。高さ：かげ＝5：7',
    {'parts': [length(7, '(1)', 'm'), length(F(59, 5), '(2)', 'm')]},
    [st('高さ：かげの比', '1mの棒のかげが1.4mなので、高さ：かげ＝1：1.4です。', '1：1.4＝5：7', None, F(1)/F(14, 10) == F(5, 7)),
     st('(1) かべの高さで水平に切る', 'かべにうつった3mの高さで水平に線を引くと、その上の木の部分8−3＝5mが比の⑤です。', '⑤＝8−3＝5（m）', ('比の①は何mですか。', 1, 'm'), F(8-3, 5) == 1),
     st('(1) xを求める', 'xは水平に引いた線の長さで、比の⑦です。', '⑦＝1×7＝7（m）', None, 1*7 == 7),
     st('(2) 低い地面で考える', '段差の下の地面から見ると、木の高さは9＋3＝12mです。光の線が下の地面にとどくまでの水平の長さは、12mの⑦/⑤倍です。', '(9＋3)×7/5＝16.8（m）', None, (9+3)*F(7, 5) == F(84, 5)),
     st('(2) xを求める', '16.8mのうち、木から段差までの5mを引いた残りがxです。', 'x＝16.8−5＝11.8（m）', None, F(84, 5)-5 == F(59, 5))])

add('R30H②-4', 'r30.shadow.two_buildings', '2つのビル：屋上にうつるかげ（Bの屋上の高さで切る）', 'Bのかげで高さを出し、Aは「Bの屋上より上の部分」を道路＋屋上のかげから出して足す',
    {'parts': [length(F(15, 2), '(1)', 'm'), length(F(23, 2), '(2)', 'm')]},
    [st('高さ：かげの比', '1mの棒のかげが1.6mなので、高さ：かげ＝1：1.6です。', '1：1.6＝5：8', None, F(1)/F(16, 10) == F(5, 8)),
     st('(1) ビルBの高さ', 'Bのかげ12mが比の⑧にあたり、高さは⑤です。', '12×5/8＝7.5（m）', ('ビルBの高さは何mですか。', F(15, 2), 'm'), 12*F(5, 8) == F(15, 2)),
     st('(2) Bの屋上の高さで切る', '真横から見て、Bの屋上の高さで水平に切ります。その上のAの部分のかげは、道路のはば5mと屋上のかげ1.4mを合わせた長さです。', '5＋1.4＝6.4（m）', None, 5+F(14, 10) == F(32, 5)),
     st('(2) 屋上より上の部分', 'かげ6.4mが⑧なので、高さは⑤です。', '6.4×5/8＝4（m）', None, F(32, 5)*F(5, 8) == 4),
     st('(2) ビルAの高さ', 'Bの屋上までの高さを足します。', '7.5＋4＝11.5（m）', None, F(15, 2)+4 == F(23, 2))])

# ---------- 折り返し ----------
add('R30H③-1', 'r30.fold.isosceles_overlap', '頂点どうしを重ねる折り返し：錯角で二等辺三角形', '折り返しで等しい角と、平行線の錯角で、重なりの三角形が二等辺三角形になる',
    {'answer': area(F(255, 2))},
    [st('折り返しで等しい長さ', 'AとCが重なるので、折り目EF上の点からAとCまでの長さは等しく、FA＝FCです。', 'FC＝25−8＝17（cm）', ('FAは何cmですか。', 17, 'cm'), 25-8 == 17),
     st('二等辺三角形を見つける', '折り返しで角EFC＝角EFA。ADとBCが平行なので錯角で角EFC＝角FEA。よって角EFA＝角FEAで、三角形AEFはAE＝AFの二等辺三角形です。', 'EA＝FA＝17（cm）'),
     st('確かめ', '三角形ABFは直角三角形で、15×15＋8×8＝17×17 が成り立ちます。', '225＋64＝289', None, 15*15+8*8 == 17*17),
     st('かげの部分の面積', '三角形AEFの底辺をEA＝17cmとすると、高さはAB＝15cmです。', '17×15÷2＝127.5（cm²）', None, F(17*15, 2) == F(255, 2))], domain='合同・折り返し')

add('R30H③-2', 'r30.fold.diagonal_overhang', '対角線で折り返し：重なりは二等辺三角形、はみ出し分を引く', '折り返した辺の長さは変わらない。重なりの三角形は二等辺三角形で、底辺＝横−はみ出し',
    {'answer': area(300)},
    [st('折り返しで変わらない長さ', '対角線で折り返した三角形は、もとの三角形と合同です。上の辺からはみ出した直角三角形は、たての辺を折り返した24cmの辺と、7cmの辺をもちます。', 'はみ出した直角三角形：24cmと7cm'),
     st('二等辺三角形', '折り返しで等しい角と、平行線の錯角が等しいので、かげの部分は対角線を底辺とする二等辺三角形です。その等しい辺は、横の辺を折り返した32cmから、はみ出した7cmを引いた長さです。', '32−7＝25（cm）', ('重なりの三角形の等しい辺は何cmですか。', 25, 'cm'), 32-7 == 25),
     st('確かめ', 'はみ出した直角三角形は 7、24、25 の辺をもちます。', '7×7＋24×24＝25×25', None, 7*7+24*24 == 25*25),
     st('かげの部分の面積', '底辺25cm、高さは長方形のたて24cmです。', '25×24÷2＝300（cm²）', None, F(25*24, 2) == 300)], domain='合同・折り返し')

add('R30H③-3', 'r30.fold.diagonal_height', '対角線で折り返し：二等辺三角形の高さを相似で出す', '重なりの二等辺三角形は対角線の真ん中に垂線。長方形の半分の直角三角形と相似（5：12：13）',
    {'answer': area(F(507, 20))},
    [st('辺の比', '長方形のたて6cm、横14.4cm、対角線15.6cmの比を整数にします。', '6：14.4：15.6＝5：12：13', None, F(6)/F(6, 5) == 5 and F(72, 5)/F(6, 5) == 12 and F(78, 5)/F(6, 5) == 13),
     st('二等辺三角形の高さの位置', 'かげの部分は対角線を底辺とする二等辺三角形です。頂点から対角線に垂線を下ろすと、対角線の真ん中に下ります。', '15.6÷2＝7.8（cm）', None, F(78, 5)/2 == F(39, 5)),
     st('相似で高さを出す', '垂線でできる直角三角形は、長方形の半分の直角三角形（5：12：13）と相似で、7.8cmが⑫、高さが⑤にあたります。', '7.8×5/12＝3.25（cm）', ('二等辺三角形の高さは何cmですか。', F(13, 4), 'cm'), F(39, 5)*F(5, 12) == F(13, 4)),
     st('かげの部分の面積', '底辺15.6cm、高さ3.25cmです。', '15.6×3.25÷2＝25.35（cm²）', None, F(78, 5)*F(13, 4)/2 == F(507, 20))], domain='折り返しと相似')

add('R30H③-4', 'r30.fold.side_onto_diagonal', '辺を対角線に重ねる折り返し：相似で折り目の位置', '折り返した辺は対角線上に重なる。小さい直角三角形は長方形の半分と相似（8：15：17）',
    {'answer': area(1020)},
    [st('辺の比', '長方形の半分の三角形ABCの辺の比を整数にします。', '32：60：68＝8：15：17', None, F(32, 4) == 8 and F(60, 4) == 15 and F(68, 4) == 17),
     st('AFの長さ', 'CQで折ると辺BCが対角線ACに重なり、BはAC上の点Fにきます。CF＝CB＝60cmです。', 'AF＝68−60＝8（cm）', ('AFは何cmですか。', 8, 'cm'), 68-60 == 8),
     st('相似でQFを出す', '三角形AFQは角Fが直角で角Aが共通なので、三角形ABCと相似です。AF：FQ＝AB：BC＝8：15です。', 'QF＝8×15/8＝15（cm）', None, 8*F(15, 8) == 15),
     st('三角形AQCの面積', '三角形AQCは、底辺AC＝68cm、高さQF＝15cmです。', '68×15÷2＝510（cm²）', None, F(68*15, 2) == 510),
     st('平行四辺形AQCPの面積', '平行四辺形AQCPは対角線ACで同じ大きさの三角形2つに分かれます。', '510×2＝1020（cm²）', None, 510*2 == 1020)], domain='折り返しと相似')

add('R30H④-1', 'r30.fold.corner_on_side', '頂点が辺上にくる折り返し：○×の角で相似', '折り返した頂点の角は直角のまま。その両側の直角三角形は○×の角が等しく相似',
    {'answer': length(15)},
    [st('DFの長さ', '横の長さは17cmなので、ADも17cmです。', 'DF＝17−8＝9（cm）', ('DFは何cmですか。', 9, 'cm'), 17-8 == 9),
     st('相似を見つける', '角BFEは折り返す前の角Cで直角です。Fのところで○＋×＝90°になり、三角形ABFと三角形DFEは角の大きさが同じで相似です（角ABF＝角DFE）。', '三角形ABF∽三角形DFE'),
     st('対応する辺の比', '三角形DFEで、直角をはさむ辺はDE＝4.8cmとDF＝9cmです。', '4.8：9＝8：15', None, F(48, 10)/9 == F(8, 15)),
     st('ABを求める', '三角形ABFで、AFがDEに、ABがDFに対応します。AF：AB＝8：15です。', 'AB＝8×15/8＝15（cm）', None, 8*F(15, 8) == 15)], domain='折り返しと相似')

add('R30H④-3', 'r30.fold.corner_area', '頂点が辺上にくる折り返し：相似の比から辺→面積', '折り返した辺はもとの長さ。○×の角で相似を見つけ、斜辺の比から辺を出して面積へ',
    {'parts': [area(F(4375, 2), '(1)'), area(4116, '(2)')]},
    [st('(1) 折り返した辺の長さ', '折り返しても長さは変わりません。CF＝CB＝175cm、EF＝EB＝49−24＝25cmです。', 'EF＝49−24＝25（cm）', ('EFは何cmですか。', 25, 'cm'), 49-24 == 25),
     st('(1) 三角形CFE', '角CFEは折り返す前の角Bで直角です。', '175×25÷2＝2187.5（cm²）', None, F(175*25, 2) == F(4375, 2)),
     st('(2) 相似を見つける', 'Fのところで○＋×＝90°なので、三角形CDFと三角形FAEは相似です。斜辺どうしの比はCF：FE＝175：25です。', '175：25＝7：1', None, F(175, 25) == 7),
     st('(2) DFを求める', 'DFはAEと対応します。', 'DF＝24×7＝168（cm）', None, 24*7 == 168),
     st('(2) 三角形CDF', 'CDは長方形のたて49cmです。', '168×49÷2＝4116（cm²）', None, F(168*49, 2) == 4116)], domain='折り返しと相似')

add('R30H⑤-1', 'r30.fold.square_midpoint', '正方形の頂点を辺の中点へ折る：3：4：5の直角三角形が3つ並ぶ', '1つ目の直角三角形で辺の比をつかみ、○×の角で次々に相似な三角形に写す',
    {'parts': [length(64, '(1)'), length(20, '(2)')]},
    [st('正方形の1辺とDM', 'ME＝AE＝60cmです。1辺は60＋36＝96cm、MはCDの真ん中なのでDM＝48cmです。', 'DM＝96÷2＝48（cm）', None, F(60+36, 2) == 48),
     st('三角形EDMの形', 'ED：DM：ME＝36：48：60です。', '36：48：60＝3：4：5', ('ED：DM：ME＝3：4：□。□はいくつですか。', 5), F(36, 12) == 3 and F(48, 12) == 4 and F(60, 12) == 5),
     st('(1) 三角形MCG', 'Mのところの角は直角なので、三角形EDMと三角形MCGは相似です。MCがEDに、CGがDMに対応します（3：4）。', 'CG＝48×4/3＝64（cm）', None, 48*F(4, 3) == 64),
     st('(2) GMとHG', 'GMはMEに対応するので、GM＝48×5/3＝80cm。折り返した辺HMはもとのAB＝96cmです。', 'HG＝96−80＝16（cm）', None, 96-48*F(5, 3) == 16),
     st('(2) 三角形FHG', '三角形FHGも同じ形（3：4：5）です。HGが④、FGが⑤にあたります。', 'FG＝16×5/4＝20（cm）', None, 16*F(5, 4) == 20)], domain='折り返しと相似')

# ---------- かげ（応用） ----------
add('R30H⑥-1', 'r30.shadow.two_lamps', '2本の街灯：前後のかげが等しい→(街灯−身長)の比で道のりを分ける', '子どもの頭の高さで水平に切る。かげが等しいので、上の三角形どうしが相似になり、比で道のりを分ける',
    {'answer': length(F(32, 5), unit='m')},
    [st('頭の高さで水平に切る', '子どもの頭の高さ1.4mで水平に線を引くと、街灯の上の部分はAが7−1.4、Bが6.3−1.4です。', '7−1.4＝5.6、6.3−1.4＝4.9', None, 7-F(14, 10) == F(28, 5) and F(63, 10)-F(14, 10) == F(49, 10)),
     st('相似な三角形', '前と後のかげが等しいので、子どもの下の小さい三角形2つは合同です。そのため、Aの街灯の上の三角形とBの街灯の上の三角形も相似になります。', '5.6：4.9＝8：7', ('相似比は8：□。□はいくつですか。', 7), F(28, 5)/F(49, 10) == F(8, 7)),
     st('道のりを比で分ける', 'A地点から子どもまで：子どもからB地点まで＝8：7です。全体12mを8＋7＝15に分けます。', '12×8/(8＋7)＝6.4（m）', None, 12*F(8, 15) == F(32, 5)),
     st('確かめ', 'Bから子どもまでは12−6.4＝5.6m。6.4：5.6＝8：7で合っています。', '6.4：5.6＝8：7', None, F(32, 5)/F(28, 5) == F(8, 7))])

add('R30H⑥-2', 'r30.shadow.walking', '歩く人のかげ：等身大のかげで位置→速さ。へいのかげは身長より上の三角形の相似', '街灯：身長の比で、かげが身長と等しくなる位置を出す。へいのかげは頭の高さより上（下）の三角形で考える',
    {'parts': [speed(F(4, 5), '(1)'), length(F(51, 5), '(2)', 'm')]},
    [st('(1) 高さの比', '街灯8m、A君1.6m（160cm）です。', '8：1.6＝5：1', None, F(8)/F(8, 5) == 5),
     st('(1) 等身大のかげの位置', 'かげが1.6mのとき、かげの先を頂点にしたピラミッド形で「街灯からかげの先まで」：「かげ」＝5：1。A君は街灯から④のところにいます。', '1.6×(5−1)＝6.4（m）', ('8秒後、A君は街灯から何mのところにいますか。', F(32, 5), 'm'), F(8, 5)*(5-1) == F(32, 5)),
     st('(1) 速さ', '8秒で6.4m歩いたので、', '6.4÷8＝0.8（m/秒）', None, F(32, 5)/8 == F(4, 5)),
     st('(2) 12秒後の位置', '12秒後は街灯から0.8×12＝9.6mのところにいます。', '0.8×12＝9.6（m）', None, F(4, 5)*12 == F(48, 5)),
     st('(2) 頭より上の三角形の相似', '光の線は、街灯の上（8m）からA君の頭（1.6m）を通り、へいの1.2mにとどきます。A君の頭の高さで切ると、街灯側は6.4m下がって9.6m進み、へい側は1.6−1.2＝0.4m下がります。', '(8−1.6)：(1.6−1.2)＝16：1', None, (8-F(8, 5))/(F(8, 5)-F(6, 5)) == 16),
     st('(2) へいまでの距離', 'A君からへいまでは9.6mの1/16です。', '9.6×1/16＋9.6＝0.6＋9.6＝10.2（m）', None, F(48, 5)/16+F(48, 5) == F(51, 5))])

add('R30H⑥-3', 'r30.shadow.stairs', '石段のかげ：真横から見て高さ：底辺の比を一定にする', '棒の先から、かげの先がある段の高さまでの差と水平の長さで、比を一定にして位置を出す',
    {'parts': [length(176, '(1)'), length(72, '(2) 何cmから'), length(104, '(2) 何cmまで')]},
    [st('(1) 真横から見た三角形', '棒は石段のすぐ前に立っています。かげの先は最上段の角で、高さ20×3＝60cm、棒からの水平の長さは40×2＝80cmです。', '高さ110−60＝50、底辺80', None, 110-20*3 == 50 and 40*2 == 80),
     st('(1) 高さ：かげの比', '光の線は、50cm下がる間に水平に80cm進みます。', '50：80＝5：8', None, F(50, 80) == F(5, 8)),
     st('(1) 平地のかげ', '平地では、棒の高さ110cmが比の⑤、かげが⑧にあたります。', '110×8/5＝176（cm）', ('平地での棒のかげは何cmですか。', 176, 'cm'), 110*F(8, 5) == 176),
     st('(2) Aの部分', 'Aは2段目の正面（高さ20cmから40cmまでの面）で、石段の手前のはし（1段目の正面）から奥へ40cmのところにあります。', 'Aの高さ：20cm〜40cm'),
     st('(2) かげの先がAの上のはし', 'かげの先が高さ40cmにくるとき、光の線は110−40＝70cm下がるので、水平に70×8/5＝112cm進みます。棒からAまでが112cmなので、石段の手前のはしまでは40cmを引いた長さです。', '70×8/5−40＝72（cm）', None, 70*F(8, 5)-40 == 72),
     st('(2) かげの先がAの下のはし', 'かげの先が高さ20cmにくるとき、光の線は110−20＝90cm下がります。', '90×8/5−40＝104（cm）', None, 90*F(8, 5)-40 == 104),
     st('(2) 答えをまとめる', '棒を遠ざけるほど、かげの先は低いところにきます。', '72cmから104cmまで')])

add('R30H⑦-1', 'r30.shadow.wall_tower', 'かべにうつるかげ：かげの先より上の三角形の高さ：底辺を人で求めて鉄塔に使う', 'かべにうつった高さで切った「上の三角形」の高さ：底辺を人で出し、同じ比を鉄塔に使う',
    {'answer': length(29, unit='m')},
    [st('かべABの高さ', 'ビルは16m、ベランダの床は10mです。', 'AB＝16−10＝6（m）', None, 16-10 == 6),
     st('かべにうつったかげ', '鉄塔のかげはABの半分で3m、人のかげはその2/5です。', '6×1/2×2/5＝1.2（m）', ('人のかげがかべにうつった高さは何mですか。', F(6, 5), 'm'), 6*F(1, 2)*F(2, 5) == F(6, 5)),
     st('人で比を出す', '人の頭から、かべのかげの先までの光の線を考えます。高さは1.6−1.2＝0.4m下がり、水平には人からかべまでの1m進みます。', '(1.6−1.2)：1＝2：5', None, (F(8, 5)-F(6, 5))/1 == F(2, 5)),
     st('鉄塔の上の部分', '鉄塔からかべまでの水平の長さは36＋4＝40mです。かべのかげの先より上の鉄塔の部分は、40mの2/5です。', '(36＋4)×2/5＝16（m）', None, (36+4)*F(2, 5) == 16),
     st('鉄塔の高さ', 'かげの先の高さは、床の10mにかべの3mを足した13mです。', '16＋10＋6×1/2＝29（m）', None, 16+10+6*F(1, 2) == 29)])

add('R30H⑦-2', 'r30.fold.rect_four_triangles', '長方形を斜めに折る：3：4：5の三角形を4つつなぐ。高さが同じ台形は上底＋下底の比', 'GHIの3：4：5を、相似な4つの直角三角形に順に写す。辺の和で残りを出す',
    {'parts': [length(12, '(1)'), length(40, '(2)'), sc(F(25, 41), '倍', '(3)')]},
    [st('三角形の形', 'GH：GI：HI＝6：8：10です。折り返しでできた直角三角形HGI・HBE・ICK・KJFは、どれも○×の角が等しく相似です。', '6：8：10＝3：4：5', None, F(6, 2) == 3 and F(8, 2) == 4 and F(10, 2) == 5),
     st('(1) BEを求める', 'EG＝AE なので、BE＋EH＋HG＝AB＝33cm。三角形HBEで BE：EH＝4：5です。', 'BE＝(33−6)×4/(4＋5)＝12（cm）', ('BEは何cmですか。', 12, 'cm'), (33-6)*F(4, 9) == 12),
     st('(2) BHとIC', 'BH＝12×3/4＝9cm。BC＝AD＝51cmなので、', 'IC＝51−(9＋10)＝32（cm）', None, 12*F(3, 4) == 9 and 51-(9+10) == 32),
     st('(2) IKを求める', '三角形ICKで、ICが④、IKが⑤にあたります。', 'IK＝32×5/4＝40（cm）', None, 32*F(5, 4) == 40),
     st('(3) KJとFJ', 'GJ＝AD＝51cmなので KJ＝51−(8＋40)＝3cm。三角形KJFでKJが③、FJが④です。', 'FJ＝3×4/3＝4（cm）', None, 51-(8+40) == 3 and 3*F(4, 3) == 4),
     st('(3) 台形の辺', '台形EGJFは台形AEFDを折り返したものです。AE＝33−12＝21cm、DF＝FJ＝4cm、FC＝33−4＝29cmです。', 'AE＝21、DF＝4、BE＝12、FC＝29', None, 33-12 == 21 and 33-4 == 29),
     st('(3) 何倍か', '2つの台形は高さがどちらも51cmなので、面積の比は（上底＋下底）の比です。', '(21＋4)÷(12＋29)＝25/41（倍）', None, F(21+4, 12+29) == F(25, 41))], domain='折り返しと相似')

# ---------- 計算マスター（一行） ----------
add('R30K-23', 'r30.calc.symbol_nested_inverse', '約束記号の逆算：内側を△とおいて外側から戻す', '内側の｛ ｝を△とおき、外側の式から△を出してから、内側の□を出す',
    {'answer': sc(9)},
    [st('約束を確かめる', '｛a，b｝は、aとbの2倍を足して3でわった数です。', '｛a，b｝＝(a＋2×b)/3'),
     st('内側を△とおく', '｛□，12｝＝△とおくと、｛8，△｝＝10 です。', '(8＋2×△)/3＝10'),
     st('△を求める', '3をかけて10×3＝30。8を引いて2でわります。', '△＝(10×3−8)÷2＝11', ('△はいくつですか。', 11), F(10*3-8, 2) == 11 and F(8+2*11, 3) == 10),
     st('□を求める', '(□＋2×12)/3＝11 なので、11×3から2×12を引きます。', '□＝11×3−2×12＝9', None, 11*3-2*12 == 9),
     st('確かめ', '｛9，12｝＝(9＋24)/3＝11、｛8，11｝＝(8＋22)/3＝10 です。', '(8＋2×11)/3＝10', None, F(9+2*12, 3) == 11 and F(8+2*11, 3) == 10)], cat='oneline', domain='記号・定義された演算')

add('R30K-25', 'r30.num.not_multiple_2_3_nth', '2でも3でも割り切れない数のN番目：最小公倍数ごとの周期', '6ごとに区切ると、1と5の2個ずつが並ぶ。何組目の何番目かを出す',
    {'answer': sc(299)},
    [st('周期を見つける', '2と3の最小公倍数は6です。1〜6のうち、2でも3でも割り切れないのは1と5の2個です。', '1〜6：｛1，5｝の2個'),
     st('何組目か', '6ごとに2個ずつ出てくるので、100番目は何組目の何番目かを出します。', '100÷2＝50（組）あまり0', ('100番目は何組目ですか。', 50, '組'), divmod(100, 2) == (50, 0)),
     st('50組目の数', '50組目は 6×49＋1 から 6×50 までで、その中の2個目（6×49＋5）です。', '6×50−1＝299', None, 6*49+5 == 299 and 6*50-1 == 299),
     st('確かめ', '1〜299 で2でも3でも割り切れない数を数えると 299−(149＋99−49)＝100個です。', '299−149−99＋49＝100', None, sum(1 for k in range(1, 300) if k % 2 and k % 3) == 100 and 299 % 2 == 1 and 299 % 3 == 2)], cat='oneline', domain='倍数の個数')

# ---------- T⑤ 応用問題（面積比） ----------
_A, _B, _C = (F(1), F(3)), (F(0), F(0)), (F(3), F(0))
_E = lerp(_A, _B, F(1, 3)); _F = lerp(_A, _C, F(1, 3))
_G = meet(_F, (_F[0]+_B[0]-_A[0], _F[1]+_B[1]-_A[1]), _B, _C); _H = meet(_F, _G, _E, _C)
assert poly(_A, _E, _F)/poly(_B, _G, _H, _E) == F(3, 10)
add('R30T⑤-1', 'r30.area.two_parallels', '平行線2組：ちょうちょ形と底辺比で面積をつなぐ', 'FG＝EBから相似比を出し、ちょうちょ形の4つの三角形に面積を書きこんで、底辺比で広げる',
    {'answer': ratio(3, 10)},
    [st('ピラミッド形の相似', 'EBGFは平行四辺形なのでFG＝EB。三角形AEFと三角形FGCは三角形ABCと相似で、AE：FG＝AE：EB＝1：2です。', 'EF：GC＝1：2', None, True),
     st('ちょうちょ形', 'EFとGCは平行なので、三角形EHFと三角形CHGは相似比1：2です。EH：HC＝FH：HG＝1：2です。', 'EHF：FHC：EHG：HGC＝①：②：②：④', ('三角形HGCは面積の比でいくつですか（EHF＝①）。', 4), F(1*2) == 2 and F(2*2) == 4),
     st('三角形EBG', '三角形EGC＝②＋④＝⑥。BG＝EFなので BG：GC＝1：2で、三角形EBGは三角形EGCの1/2です。', '(2＋4)×1/2＝3', None, (2+4)*F(1, 2) == 3),
     st('三角形AEF', '三角形EFC＝①＋②＝③。AF：FC＝AE：EB＝1：2なので、三角形AEFは三角形EFCの1/2です。', '(1＋2)×1/2＝1.5', None, (1+2)*F(1, 2) == F(3, 2)),
     st('比を出す', '四角形BGHE＝三角形EBG＋三角形EHG＝③＋②＝⑤です。', '1.5：5＝3：10', None, F(3, 2)/5 == F(3, 10))], domain='面積比')

_B2, _C2, _A2, _D2 = (F(0), F(0)), (F(24), F(0)), (F(0), F(18)), (F(24), F(18))
_E2, _F2 = (F(6), F(0)), (F(24), F(6)); _G2 = meet(_A2, _F2, _D2, _E2)
assert poly(_E2, _C2, _F2, _G2) == 114
add('R30T⑤-2', 'r30.area.extend_butterfly', '辺を延長してちょうちょ形：高さの比で面積を出す', 'AFをBCの延長と交わらせて2つのちょうちょ形を作り、大きい三角形から小さい三角形を引く',
    {'answer': area(114)},
    [st('AFを延長する', 'AFとBCの延長の交点をHとします。ADとCHが平行なので、三角形AFDと三角形HFCはちょうちょ形の相似で、DF：FC＝(18−6)：6＝2：1です。', 'CH＝24×1/2＝12（cm）', ('CHは何cmですか。', 12, 'cm'), 24*F(6, 18-6) == 12),
     st('もう1つのちょうちょ形', 'HE＝(24−6)＋12＝30cm。ADとEHが平行なので、三角形AGDと三角形HGEは相似で、相似比は24：30＝4：5です。', '24：30＝4：5', None, F(24, 30) == F(4, 5)),
     st('三角形HGEの高さ', 'ADとBCの間の長さ18cmを4：5に分けると、Gから辺BCまでの高さは⑤です。', '18×5/9＝10（cm）', None, 18*F(5, 9) == 10),
     st('三角形HGEと三角形HFC', '三角形HGEは底辺30cm、高さ10cm。三角形HFCは底辺12cm、高さ6cmです。', '30×10÷2＝150、12×6÷2＝36', None, F(30*10, 2) == 150 and F(12*6, 2) == 36),
     st('四角形ECFG', '三角形HGEから三角形HFCを引きます。', '150−36＝114（cm²）', None, 150-36 == 114)], domain='面積比')

_B3, _C3 = (F(0), F(0)), (F(5), F(0)); _A3 = (F(1), F(4)); _D3 = (_A3[0]+5, _A3[1])
_E3 = lerp(_A3, _D3, F(2, 5)); _F3 = lerp(_C3, _D3, F(1, 6)); _P3 = meet(_A3, _F3, _B3, _E3)
_ap = dist_ratio(_A3, _P3, _F3)
assert _ap/(1-_ap) == F(3, 7)
assert poly(_B3, _C3, _F3, _P3)/poly(_A3, _B3, _C3, _D3)*180 == 78
add('R30T⑤-3', 'r30.area.two_butterflies_link', '延長線でちょうちょ形を2つ作り、連比でそろえる', 'AFをBCの延長と交わらせ、AF：FG と AP：PG を全体AGでそろえる',
    {'parts': [ratio(3, 7, label='(1)'), area(78, '(2)')]},
    [st('(1) AFを延長する', 'AFとBCの延長の交点をGとします。AD＝⑤とすると、三角形AFDと三角形GFCは相似比 DF：FC＝5：1 です。', 'CG＝①、AF：FG＝5：1', None, True),
     st('(1) もう1つのちょうちょ形', 'AE＝②、BG＝⑤＋①＝⑥です。AEとBGが平行なので、三角形APEと三角形GPBは相似です。', 'AP：PG＝2：6＝1：3', ('BGは比でいくつですか（AD＝⑤）。', 6), F(2, 6) == F(1, 3)),
     st('(1) AGの長さをそろえる', 'AGを 5＋1＝6 と 1＋3＝4 の最小公倍数12にします。AF＝10、AP＝3です。', 'AP：PF＝3：(10−3)＝3：7', None, 12*F(5, 6) == 10 and 12*F(1, 4) == 3),
     st('(2) 三角形BCF', '三角形BCDは平行四辺形の1/2。CFはCDの1/6なので、', '180×1/2×1/6＝15（cm²）', None, 180*F(1, 2)*F(1, 6) == 15),
     st('(2) 三角形PBF', '三角形ABFは平行四辺形の1/2（底辺AB、高さは平行四辺形と同じ）。PF：AF＝7：10です。', '180×1/2×7/10＝63（cm²）', None, 180*F(1, 2)*F(7, 10) == 63),
     st('(2) 四角形BCFP', '2つの三角形を合わせます。', '15＋63＝78（cm²）', None, 15+63 == 78)], domain='面積比')

assert len(P) == 23 and set(P) == set(R), set(R) ^ set(P)
FIG = {'R30K-23': None, 'R30K-25': None, 'R30H⑥-2': None}

def fmt(v):
    v = F(v)
    if v.denominator == 1: return str(v.numerator)
    d = v.denominator
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    if d == 1: return format(float(v), 'f').rstrip('0').rstrip('.') if len(str(float(v))) < 12 else str(v)
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

problems, units = [], []
cls_rows = {}
md = {}
cls = json.loads((ROOT/'content/notion-classification.json').read_text())
for code, v in P.items():
    r = R[code]; pid = r['pid']
    steps = v['steps']
    for i, s in enumerate(steps): s['id'] = f's{i+1}'
    assert 4 <= len(steps) <= 8 and any('checkpoint' in s for s in steps), code
    base = cls['subdivisions'][r['sub']]['base']
    diff = base + r['up']
    assert diff == r['diff'], (code, diff, r['diff'])
    prob = {'id': code, 'unitId': v['u']['id'], 'category': v['cat'], 'domain': v['domain'], 'text': r['text'], 'sourceText': r['text'],
            'source': {'title': code, 'url': 'https://app.notion.com/' + pid, 'notionPageId': pid,
                       'path': 'C:/Users/tsuzu/Dropbox/算数DB/原本/5年授業/5-30 平面図形(5)-かげ・折り返し-.pdf', 'locator': f'5年No.30 {code}（図は後期3 図版の問題図と同じ切り抜き）',
                       'scopeUnits': ['R30'], 'databasePath': 'C:/Users/tsuzu/Dropbox/算数DB/本文/算数DB_通常授業_後期.md',
                       'verification': '2026-11-20 Claude作成。問題文・答えは Notion 問題DB（原本から全文）と一致し、答えは公式解答と一致。段階解説は教材の解説の解き方に即して作成し（H⑤-1・H⑥-2・H⑥-3 は H に解説がないため同じ型の N の解説に合わせた）、各ステップの式を Python（fractions）で検算。',
                       'sourceAnswer': r['ans'], 'textOrigin': 'notion-problem-body-verbatim', 'difficultyProvenance': 'Notion細分類の基礎難度＋上乗せ。'},
            'answer': v['ans'].get('answer') or {'parts': v['ans']['parts']}, 'difficulty': diff, 'scopeUnits': ['R30'], 'homeStudy': code.startswith('R30H'), 'revision': 1,
            'explanation': {'steps': steps}}
    src = SRC/'figs'/f'{code}.png'
    if code not in FIG:
        fname = f'figs/r30/{code[3:]}.png'
        (ROOT/'dist/figs/r30').mkdir(parents=True, exist_ok=True)
        shutil.copy(src, ROOT/'dist'/fname)
        prob['figure'] = fname; prob['figureRequired'] = True
        prob['source']['figureSha256'] = hashlib.sha256((ROOT/'dist'/fname).read_bytes()).hexdigest()
    else:
        assert not src.exists(), code
        prob['figureRequired'] = False
    problems.append(prob)
    units.append({**v['u'], 'domain': v['domain'], 'representativeId': code, 'prerequisites': []})
    cls_rows[pid] = {'sub': r['sub'], 'related': r['rel'], 'difficulty': diff, 'rep': True, 'variant': False}
    md[code] = steps_md(code, steps)
links = [{'from': 'r30.shadow.lamp_distance', 'to': 'r30.shadow.lamp_length', 'relation': 'extension', 'difference': '高さの比から距離を出す形から、差の比でかげの長さを出す形へ。'},
         {'from': 'r30.shadow.sun_basic', 'to': 'r30.shadow.wall_step_reverse', 'relation': 'extension', 'difference': '平らな地面のかげから、かべ・段差にできるかげへ。'},
         {'from': 'r30.shadow.wall_step_reverse', 'to': 'r30.shadow.two_buildings', 'relation': 'extension', 'difference': '1本の木から、2つのビルの屋上にうつるかげへ。'},
         {'from': 'r30.fold.diagonal_overhang', 'to': 'r30.fold.diagonal_height', 'relation': 'extension', 'difference': 'はみ出し分がわかる形から、二等辺三角形の高さを相似で出す形へ。'},
         {'from': 'r30.fold.corner_on_side', 'to': 'r30.fold.corner_area', 'relation': 'extension', 'difference': '辺の長さから、2つの三角形の面積まで。'}]
analysis = [{'kind': 'selection_basis', 'detail': 'Notion問題DBのR30で「代表」にした23問（細分類×難易度ごと）。H（家庭学習用）はNの数値替えなのでHを代表にし、T⑤の応用問題と計算マスターK-23・K-25を加えた。'},
            {'kind': 'difficulty', 'detail': 'DはNotionの難易度（細分類の基礎難度＋上乗せ）。'},
            {'kind': 'scope', 'detail': 'R30は11/20に履修。直近授業をR30にし、次回グノレブ（12/11、No.28〜31）の範囲に履修済みのR28・R29・R30を入れる。'}]
out = {'problems': problems, 'units': units, 'links': links, 'analysis': analysis}
(ROOT/'content/selected-r30-oneline.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
cls['problems'].update(cls_rows)
(ROOT/'content/notion-classification.json').write_text(json.dumps(cls, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(SRC/'steps_md.json').write_text(json.dumps(md, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(problems), [(p['id'], p['difficulty']) for p in problems])
