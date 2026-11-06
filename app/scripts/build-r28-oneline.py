"""R28（平面図形(3) 面積比）家庭学習用Hの代表13問を図つきで教材化する。
- 問題文・答え・細分類・難易度は Notion 問題DB の R28H（2026-11-06 登録）。図は原本PDFの白紙面から切り抜いたもの。
- 解き筋は独立に作り、各ステップの数値を fractions で検算する。H の解答一覧はスキャンに無いので、答えは自力計算＋検算（Notionメモにも記載）。
"""
import json, shutil, hashlib, sys
from fractions import Fraction as F
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SRC = Path('/home/claude/r28')
ids = json.loads((SRC/'pageids.json').read_text())
items = {i['code']: i for i in json.loads((SRC/'items.json').read_text())}
SUBNAME = {'P205-01':'等高図形(割合有)','P204-01':'区切り面積','P330-01':'等底図形','P206-01':'隣辺比','P207-01':'足して180°の隣辺比'}

def area(n, label=None):
    n = F(n); r = {'n': str(n.numerator), 'd': str(n.denominator), 'unit': 'cm²', 'dimension': 'area', 'acceptedUnits': {'cm²': '1', 'cm2': '1', '平方センチメートル': '1'}}
    if label: r['label'] = label
    return r
def length(n, label=None):
    n = F(n); r = {'n': str(n.numerator), 'd': str(n.denominator), 'unit': 'cm', 'dimension': 'length', 'acceptedUnits': {'cm': '1', 'センチメートル': '1', 'mm': '0.1'}}
    if label: r['label'] = label
    return r
def ratio(*t, label=None):
    r = {'dimension': 'ratio', 'terms': [str(x) for x in t], 'unit': ''}
    if label: r['label'] = label
    return r
def sc(n, unit=''):
    n = F(n); return {'n': str(n.numerator), 'd': str(n.denominator), 'unit': unit, 'dimension': 'scalar'}
def st(title, body, eq, cp=None, check=True):
    if check is not True: assert check, (title, eq)
    s = {'title': title, 'body': body, 'equation': eq}
    if cp: s['checkpoint'] = {'prompt': cp[0], 'answer': sc(cp[1], cp[2] if len(cp) > 2 else '')}
    return s

P = {}
# ①-1
h = F(18, 4)
P['①-1'] = (dict(id='r28.area.parallel_bases', name='平行線の間の図形は底辺の比で面積が決まる', definition='平行線の間にある図形は高さが同じなので、面積は「底辺（台形は上底＋下底）」に比例する。', decision='底辺1cmあたりの面積を出して、底辺の長さ（上底＋下底）をかける'),
  {'parts': [area(45, '㋑'), area(90, '㋒'), area(108, '㋓'), area(72, '㋔')]},
  [st('高さが同じことに目をつける', '㋐〜㋔はどれも平行な2本の直線の間にあるので、高さが同じです。三角形の面積は底辺に比例します。', '18÷4＝4.5', ('三角形で、底辺1cmあたりの面積は何cm²ですか。', h, 'cm²'), 18/F(4) == h),
   st('㋑を求める', '㋑は底辺10cmの三角形です。', '4.5×10＝45', None, h*10 == 45),
   st('㋒を求める', '㋒は平行四辺形です。平行四辺形は、同じ底辺・同じ高さの三角形の2倍の面積です。', '4.5×10×2＝90', None, h*20 == 90),
   st('㋓を求める', '台形は、底辺が「上底＋下底」の三角形と同じ面積です。6＋18＝24cmの三角形と考えます。', '4.5×(6＋18)＝108', None, h*24 == 108),
   st('㋔を求める', '㋔は平行四辺形の中の三角形で、底辺16cm・高さは平行線の幅と同じです。', '4.5×16＝72', None, h*16 == 72)])
# ⑥-1
P['⑥-1'] = (dict(id='r28.area.trapezoid_half', name='台形を2等分する線の比', definition='台形を対角線で2つの三角形に分けると、面積の比は上底：下底。全体を比で表してから半分を考える。', decision='上底：下底で2つの三角形に分け、全体の半分になる三角形の底辺の比を出す'),
  {'parts': [ratio(4, 5, label='(1)'), ratio(1, 9, label='(2)')]},
  [st('対角線で2つの三角形に分ける', '三角形ABDと三角形DBCは、高さが台形の高さで同じです。面積の比は底辺の比 AD：BC です。', '12：15＝4：5', ('三角形ABDを4とすると、三角形DBCはいくつですか。', 5), True),
   st('台形全体と半分を比で表す', '台形全体は4＋5＝9です。BEで2等分するので、半分は4.5です。', '(4＋5)÷2＝4.5', ('台形の半分はいくつですか。', F(9, 2)), True),
   st('三角形EBCの大きさを決める', 'BEの右下の三角形EBCが4.5になればよいです。三角形EBCと三角形DBCは頂点Bを共有し、底辺がDC上にあるので、面積の比は EC：DC です。', '4.5：5＝9：10', None, True),
   st('DE：ECを出す', 'DCを10とするとECは9、DEは10−9＝1です。', '10−9＝1', None, True)])
# ⑥-4
P['⑥-4'] = (dict(id='r28.area.trapezoid_reverse', name='台形の面積比から辺の比をさかのぼる', definition='対角線でできる2つの三角形の比（上底：下底）と、問題の面積比を連比でそろえ、三角形の比から辺の比を出す。', decision='2つの比の合計を最小公倍数でそろえ、三角形EBC：三角形DBC＝EC：DC'),
  {'answer': ratio(7, 25)},
  [st('対角線BDで分ける', '三角形ABDと三角形DBCの面積の比は AD：BC です。', '8：32＝1：4', None, True),
   st('2つの比の合計をそろえる', '1：4の合計は5、㋐：㋑＝3：5の合計は8です。台形全体を5と8の最小公倍数40にそろえます。', '5×8＝40', ('台形全体をいくつにそろえますか。', 40), True),
   st('それぞれの大きさを出す', '三角形DBC＝40×4/5＝32、㋑（三角形EBC）＝40×5/8＝25です。', '40×4÷5＝32', None, F(40*5, 8) == 25),
   st('EC：DCを出す', '三角形EBCと三角形DBCはBを頂点とし、底辺がDC上にあるので、面積の比がそのまま EC：DC です。', '25：32', None, True),
   st('DE：ECにする', 'DE＝32−25＝7なので、DE：EC＝7：25です。', '32−25＝7', None, True)])
# ②-1
P['②-1'] = (dict(id='r28.area.base_ratio', name='高さが同じ三角形の面積比＝底辺の比', definition='頂点を共有し底辺が同じ直線上にある三角形は、面積の比が底辺の比になる。', decision='BD：DCの比を面積にあてはめる'),
  {'answer': area(25)},
  [st('高さが同じ三角形を見つける', '三角形ABDと三角形ADCは頂点Aが同じで、底辺がどちらもBC上にあります。高さが同じなので、面積の比は底辺の比です。', '3：5', None, True),
   st('比の1にあたる面積を出す', '三角形ABDが比の3にあたり15cm²です。', '15÷3＝5', ('比の1にあたる面積は何cm²ですか。', 5, 'cm²'), True),
   st('三角形ADCを出す', '三角形ADCは比の5にあたります。', '5×5＝25', None, True),
   st('確かめる', '2つを合わせた三角形ABCは40cm²で、15：25＝3：5になっています。', '15＋25＝40', None, True)])
# ③-1
P['③-1'] = (dict(id='r28.area.equal_split', name='面積の等しい三角形に分ける（底辺の比を順に）', definition='面積が等しい三角形に分けたとき、高さが同じ組を見つけて「面積の比＝底辺の比」を順に使う。', decision='高さが同じ2つの三角形を順に選び、底辺の比で長さを出す'),
  {'parts': [length(F(15, 2), '(1)'), length(5, '(2)'), length(12, '(3)')]},
  [st('DEを求める', '三角形FBDと三角形FDEは頂点Fが同じで底辺がBC上にあり、面積が等しいので底辺も等しくなります。', 'DE＝BD＝7.5', ('DEは何cmですか。', F(15, 2), 'cm'), True),
   st('BE：ECを考える', '三角形ABEは等しい三角形3つ分、三角形AECは1つ分です。頂点Aが同じなので BE：EC＝3：1 です。', 'BE＝7.5＋7.5＝15', None, True),
   st('ECを求める', 'BEが比の3にあたります。', '15÷3＝5', None, True),
   st('BF：FAを考える', '三角形FBE（2つ分）と三角形FEA（1つ分）は頂点Eが同じで、底辺がAB上にあります。BF：FA＝2：1です。', 'BF＝6×2＝12', None, True)])
# ④-3
P['④-3'] = (dict(id='r28.area.shared_vertex_product', name='頂点を共有する三角形を順に分けて比をかける', definition='大きな三角形を底辺の比で分け、さらにその中を線上の比で分ける。面積の比を順にかけ合わせる。', decision='まず底辺の比、次に線上の比で分け、全体を同じ単位でそろえる'),
  {'parts': [ratio(21, 20, label='(1)'), ratio(7, 17, label='(2)')]},
  [st('(1) 底辺の比で分ける', '頂点から引いた線で、全体は底辺3cmと5cmの2つの三角形に分かれます。面積の比は3：5です。左の三角形がAです。', '3：5', None, True),
   st('(1) 右の三角形を線上の比で分ける', '右の三角形は、線上の点で上3cm・下4cmに分けられています。下の部分Bは右の三角形の4/7です。', '5×4/7＝20/7', ('Bは、Aを3としたときいくつですか（分数で）。', F(20, 7)), True),
   st('(1) 比を整数にする', 'A：B＝3：20/7。両方に7をかけます。', '3×7＝21', None, True),
   st('(2) 1つの角を共有する三角形', 'Aは左下の角を共有する三角形です。全体の辺は5＋7＝12cmと7＋3＝10cmで、Aの辺は5cmと7cmです。', '5/12×7/10＝7/24', ('Aは全体の何分のいくつですか。', F(7, 24)), F(5, 12)*F(7, 10) == F(7, 24)),
   st('(2) A：Bを出す', 'Bは残りの24−7＝17です。', '24−7＝17', None, True)])
# ⑦-2
P['⑦-2'] = (dict(id='r28.area.extended_mixed', name='辺をのばした三角形（比がばらばら）', definition='辺をのばしてできる外側の三角形は、もとの三角形と「足して180°」の角をはさむ。はさむ2辺の比の積で面積が出る。', decision='3つの外側の三角形を、はさむ2辺の倍率の積で1つずつ求めて足す'),
  {'answer': area(F(341, 2))},
  [st('外側の三角形DBEを求める', '角DBEは角ABCと足して180°の角です。DB＝AB×5/2、BE＝BC×(4＋5)/4 なので、面積は三角形ABCの5/2×9/4倍です。', '12×5/2×9/4＝67.5', ('三角形DBEは何cm²ですか。', F(135, 2), 'cm²'), 12*F(5, 2)*F(9, 4) == F(135, 2)),
   st('外側の三角形ECFを求める', 'CE＝CB×5/4、CF＝CA×(3＋4)/3 です。', '12×5/4×7/3＝35', None, 12*F(5, 4)*F(7, 3) == 35),
   st('外側の三角形FADを求める', 'AF＝AC×4/3、AD＝AB×(2＋5)/2 です。', '12×4/3×7/2＝56', None, 12*F(4, 3)*F(7, 2) == 56),
   st('全部を足す', 'まん中の三角形ABCと外側の3つを足します。', '12＋67.5＋35＋56＝170.5', None, 12+F(135, 2)+35+56 == F(341, 2))])
# ②-4
P['②-4'] = (dict(id='r28.area.diagonals_four', name='対角線で4つに分けた四角形', definition='対角線で分けた4つの三角形は、となり合う2つの面積の比が対角線の分かれ方の比になる。向かい合う三角形の面積の積は等しい。', decision='となり合う三角形の比から BO：DO を出し、もう一組に使う'),
  {'parts': [ratio(2, 3, label='(1)'), area(18, '(2)')]},
  [st('BO：DOを出す', '㋑（三角形BOC）と㋒（三角形COD）は頂点Cが同じで、底辺BO・ODがBD上にあります。', '16：24＝2：3', None, True),
   st('同じ比を㋐と㋓に使う', '㋐（三角形ABO）と㋓（三角形AOD）も頂点Aが同じで、底辺はBO・ODです。㋐：㋓＝2：3です。', '12÷2×3＝18', ('㋓は何cm²ですか。', 18, 'cm²'), True),
   st('積で確かめる', '向かい合う三角形の面積の積は等しくなります。㋐×㋒と㋑×㋓をくらべます。', '12×24＝16×18', None, 12*24 == 16*18),
   st('答えをまとめる', 'BO：DO＝2：3、㋓＝18cm²です。', '12＋16＋24＋18＝70', None, True)])
# ④-2
P['④-2'] = (dict(id='r28.area.adjacent_sides', name='1つの角を共有する三角形（隣辺比）', definition='同じ角をはさむ2辺の比の積で、三角形の面積の比が決まる。', decision='AE/AC、AD/ABを順にかける'),
  {'parts': [area(24, '(1)'), area(6, '(2)')]},
  [st('三角形ABEを出す', '三角形ABEと三角形ABCは頂点Bが同じで、底辺AE・ACが同じ直線上にあります。AE：AC＝2：5です。', '60×2/5＝24', ('三角形ABEは何cm²ですか。', 24, 'cm²'), True),
   st('三角形ADEを出す', '三角形ADEと三角形ABEは頂点Eが同じで、底辺AD・ABが同じ直線上にあります。AD：AB＝1：4です。', '24×1/4＝6', None, True),
   st('隣辺比でまとめて確かめる', '角Aをはさむ2辺の比をかけると、三角形ADEは三角形ABCの1/4×2/5です。', '60×1/4×2/5＝6', None, 60*F(1, 4)*F(2, 5) == 6),
   st('答えをまとめる', '三角形ABE＝24cm²、三角形ADE＝6cm²です。', '24−6＝18', None, True)])
# ⑤-2
P['⑤-2'] = (dict(id='r28.area.inner_triangle', name='内側の三角形は周りの三角形を引く', definition='辺上の点を結んだ内側の三角形は、全体から角の3つの三角形（隣辺比で求める）を引く。', decision='3つの角の三角形を隣辺比で出して全体から引く'),
  {'answer': area(24)},
  [st('三角形APRを出す', '角Aをはさむ辺の比は AP/AB＝2/3、AR/AC＝2/5 です。', '72×2/3×2/5＝19.2', ('三角形APRは何cm²ですか。', F(96, 5), 'cm²'), 72*F(2, 3)*F(2, 5) == F(96, 5)),
   st('三角形BPQを出す', '角Bをはさむ辺の比は BP/BA＝1/3、BQ/BC＝3/4 です。', '72×1/3×3/4＝18', None, 72*F(1, 3)*F(3, 4) == 18),
   st('三角形CQRを出す', '角Cをはさむ辺の比は CQ/CB＝1/4、CR/CA＝3/5 です。', '72×1/4×3/5＝10.8', None, 72*F(1, 4)*F(3, 5) == F(54, 5)),
   st('全体から引く', '3つの角の三角形の合計は48cm²です。', '72−(19.2＋18＋10.8)＝24', None, 72-(F(96, 5)+18+F(54, 5)) == 24)])
# ⑦-1
P['⑦-1'] = (dict(id='r28.area.inner_twice', name='内側の三角形を2回つくる', definition='辺を同じ比で分けて内側の三角形をつくると、面積はいつも同じ割合になる。2回なら割合を2回かける。', decision='1回で何分のいくつになるかを出し、2回かけてからもとに戻す'),
  {'answer': area(F(256, 5))},
  [st('角の三角形1つの割合', '4等分した点なので、角をはさむ辺は1/4と3/4です。角の三角形1つは全体の1/4×3/4です。', '1/4×3/4＝3/16', None, True),
   st('内側の三角形の割合', '角の三角形は3つあるので、内側の三角形DEFは全体の1−3/16×3です。', '1−3/16×3＝7/16', ('三角形DEFは三角形ABCの何分のいくつですか。', F(7, 16)), 1-F(9, 16) == F(7, 16)),
   st('2回くり返す', '三角形GHIは三角形DEFの7/16なので、三角形ABCの7/16×7/16です。', '7/16×7/16＝49/256', None, True),
   st('三角形ABCを出す', '9.8cm²が49/256にあたります。', '9.8÷49/256＝51.2', None, F(98, 10)/F(49, 256) == F(256, 5))])
# ⑤-3
P['⑤-3'] = (dict(id='r28.area.extended_same', name='辺を同じ倍率でのばした三角形', definition='外側の三角形は、もとの三角形と足して180°の角をはさむ。はさむ2辺の倍率の積で面積が出る。', decision='外側の三角形1つを隣辺比で出し、3つ分ともとの三角形を足す'),
  {'parts': [area(36, '(1)'), area(111, '(2)')]},
  [st('外側の三角形の辺の倍率', 'ADはABの4倍です。FはCAをAの先へのばした点で、CFがCAの4倍なのでAFはACの3倍です。', '4−1＝3', ('AFはACの何倍ですか。', 3), True),
   st('三角形ADFを出す', '角DAFは角BACと足して180°の角です。はさむ2辺の倍率をかけます。', '3×4×3＝36', None, True),
   st('ほかの2つも同じ', '三角形BED、三角形CFEも同じ倍率なので、どれも36cm²です。', '36×3＝108', None, True),
   st('三角形DEFを出す', 'まん中の三角形ABCと外側3つを足します。', '3＋108＝111', None, True)])
# ⑤-4
P['⑤-4'] = (dict(id='r28.area.extended_different', name='辺をちがう倍率でのばした三角形', definition='倍率がちがっても、外側の三角形は「はさむ2辺の倍率の積」で1つずつ出せる。', decision='三角形ABCを1として、3つの外側の三角形を倍率の積で出して足す'),
  {'answer': sc(33, '倍')},
  [st('のばした部分の倍率を出す', 'AD＝AB×2なのでBD＝AB×1、BE＝BC×4なのでCE＝BC×3、CF＝CA×6なのでAF＝CA×5です。', '6−1＝5', ('AFはCAの何倍ですか。', 5), True),
   st('Aのまわりの三角形', '三角形ADFは、ADがABの2倍、AFがACの5倍です。', '1×2×5＝10', None, True),
   st('Bのまわりの三角形', '三角形BEDは、BDがBAの1倍、BEがBCの4倍です。', '1×1×4＝4', None, True),
   st('Cのまわりの三角形', '三角形CFEは、CEがCBの3倍、CFがCAの6倍です。', '1×3×6＝18', None, True),
   st('全部を足す', '三角形ABCの1と外側の3つを足します。', '1＋10＋4＋18＝33', None, True)])

problems, units = [], []
for k, (u, ans, steps) in P.items():
    code = f'R28H{k}'; it = items[code]; pid = ids[code]
    text = it['content'].split('## 問題\n\n')[1].split('\n\n## 答え')[0]
    src = SRC/'figs'/f'H{k}.png'
    fname = f'figs/r28/h{"①②③④⑤⑥⑦".index(k[0])+1}-{k[2:]}.png'
    shutil.copy(src, ROOT/'dist'/fname)
    for i, s in enumerate(steps): s['id'] = f's{i+1}'
    assert 4 <= len(steps) <= 8 and any('checkpoint' in s for s in steps)
    answer = ans.get('answer') or {'parts': ans['parts']}
    problems.append({'id': code, 'unitId': u['id'], 'category': 'geometry', 'domain': '面積比', 'text': text, 'sourceText': text,
        'source': {'title': code, 'path': 'C:/Users/tsuzu/Dropbox/算数DB/原本/5年授業/5-28 平面図形(3)-面積比-.pdf', 'locator': f'51N-H28 家庭学習用 {k}（図は後期2 図版の問題図と同じ切り抜き）',
                   'scopeUnits': ['R28'], 'sourceText': text, 'databasePath': 'C:/Users/tsuzu/Dropbox/算数DB/本文/算数DB_通常授業_後期.md',
                   'verification': '2026-11-06、R28原本PDFから書き起こしたNotion本文（R28H）を出典に採用。H の解答一覧ページはスキャンに無いため、答えは独立計算（Python fractions）で求め、Nの公式解説と同じ解き方で検算。解説・途中確認は独立制作し、各式を数値で検算。',
                   'url': 'https://app.notion.com/' + pid, 'notionId': pid, 'sourceAnswer': it['答え'], 'notionSourceText': text, 'textOrigin': 'notion-problem-body-verbatim',
                   'figureSha256': hashlib.sha256((ROOT/'dist'/fname).read_bytes()).hexdigest(),
                   'difficultyProvenance': 'Notion細分類の基礎難度＋上乗せ。'},
        'answer': answer, 'difficulty': it['難'], 'figureRequired': True, 'figure': fname, 'scopeUnits': ['R28'], 'homeStudy': True, 'revision': 1,
        'explanation': {'steps': steps}})
    units.append({**u, 'domain': '面積比', 'representativeId': code, 'prerequisites': []})
links = [{'from': 'r28.area.base_ratio', 'to': 'r28.area.equal_split', 'relation': 'extension', 'difference': '1回の底辺比から、等しい三角形を順にたどる形へ。'},
         {'from': 'r28.area.adjacent_sides', 'to': 'r28.area.inner_triangle', 'relation': 'extension', 'difference': '隣辺比1回から、角の三角形3つを引く形へ。'},
         {'from': 'r28.area.extended_same', 'to': 'r28.area.extended_different', 'relation': 'extension', 'difference': '同じ倍率から、辺ごとにちがう倍率へ。'},
         {'from': 'r28.area.trapezoid_half', 'to': 'r28.area.trapezoid_reverse', 'relation': 'extension', 'difference': '2等分から、面積比を与えて辺の比をさかのぼる形へ。'}]
analysis = [{'kind': 'selection_basis', 'detail': 'Notion問題DBのR28H全29件から、細分類×難易度と解き方の判断が変わるところで13の学習単位に分け、各単位の代表問を採用（Notionの「代表」と同じ13問）。'},
            {'kind': 'difficulty', 'detail': 'DはNotionの難易度（面積比の5細分類はどれも基礎難度4＋上乗せ0〜2）。'},
            {'kind': 'scope', 'detail': 'R28は11/6に履修。直近授業をR28にする。次回グノレブ（11/11、No.24〜27）の範囲は変えない。'}]
out = {'problems': problems, 'units': units, 'links': links, 'analysis': analysis}
(ROOT/'content/selected-r28-oneline.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(problems))
