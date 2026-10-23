"""R26計算マスターの短い四則計算（4段に満たないもの）の解説。各式は build-calc-r26.py の check_equation で検算する。"""
from fractions import Fraction as F
from r25_calc_steps import fr, im, frac_addsub, mul_div

def dstr(x):
    x = F(x)
    for k in range(0, 6):
        if (x * 10**k).denominator == 1:
            if k == 0: return str(x.numerator)
            s = str(int(x * 10**k)).zfill(k + 1); return s[:-k] + '.' + s[-k:]
    return fr(x)

def order_ops(a, b, c, d):
    # a−b×c＋d
    p = b * c; x = a - p; ans = x + d
    return [('計算の順番を決める', 'ひき算・かけ算・たし算がまざっています。かけ算を先にして、そのあとたし算・ひき算を左から計算します。', f'{a}−{b}×{c}＋{d}＝{a}−{p}＋{d}', None),
            ('かけ算をする', f'{b}×{c}を先に計算します。', f'{b}×{c}＝{p}', (f'{b}×{c}はいくつですか。', p)),
            ('左からひき算をする', 'たし算・ひき算は左から順に計算します。', f'{a}−{p}＝{x}', None),
            ('たし算をして答えを出す', f'残りの＋{d}をします。', f'{x}＋{d}＝{ans}', None)]

def mixed_dec_add(a_txt, a, b_txt, b):
    a, b = F(a), F(b); from math import lcm; c = lcm(a.denominator, b.denominator); ans = a + b
    return [('小数を分数に直す', f'分数と小数のたし算です。{b_txt}は分数で表すと{im(b)}です。', f'{b_txt}＝{im(b)}', None),
            ('帯分数を仮分数にして分母をそろえる', f'{a_txt}を仮分数{im(a)}にし、{a.denominator}と{b.denominator}の最小公倍数{c}を分母にします。', f'{im(a)}＋{im(b)}＝{int(a*c)}/{c}＋{int(b*c)}/{c}', (f'分母を{c}にそろえると、{im(b)}の分子はいくつですか。', b * c)),
            ('分子どうしを足す', '分母はそのままで、分子だけを足します。', f'{int(a*c)}/{c}＋{int(b*c)}/{c}＝{int(ans*c)}/{c}', None),
            ('帯分数に直す', '約分できるか確かめ、1より大きいので帯分数にします。', f'{int(ans*c)}/{c}＝{fr(ans)}', None),
            ('逆の計算で確かめる', '答えから足した数をひくと、はじめの数に戻ります。', f'{fr(ans)}−{b_txt}＝{a_txt}', None)]

def div_unit_frac(a, d):
    ans = a * d
    return [('割り算を逆数のかけ算にする', f'分数で割るときは、割る数の分母と分子を入れかえた数（逆数）をかけます。1/{d}の逆数は{d}です。', f'{a}÷1/{d}＝{a}×{d}', None),
            ('かけ算をする', f'{a}に{d}をかけます。', f'{a}×{d}＝{ans}', (f'{a}×{d}はいくつですか。', ans)),
            ('意味で考える', f'{a}÷1/{d}は「1/{d}が何こ分で{a}になるか」です。1の中に1/{d}は{d}こあるので、{a}の中には{a}×{d}こあります。', f'1÷1/{d}＝{d}', None),
            ('かけ算で確かめる', f'答えに1/{d}をかけると、{a}に戻ります。', f'{ans}×1/{d}＝{a}', None)]

def frac_add_mul(a, b, n):
    # a＋b×n（分数）
    p = b * n; ans = a + p
    return [('計算の順番を決める', 'たし算とかけ算がまざっているので、かけ算を先にします。', f'{im(a)}＋{im(b)}×{n}＝{im(a)}＋{im(p)}', None),
            ('かけ算をする', f'{im(b)}に{n}をかけます。分母はそのままで分子を{n}倍します。', f'{im(b)}×{n}＝{im(p)}', (f'{im(b)}×{n}を分数で答えましょう。', p)),
            ('たし算をする', '分母がそろっているので、分子どうしを足します。', f'{im(a)}＋{im(p)}＝{(a+p)*a.denominator}/{a.denominator}', None),
            ('約分する', '分子が分母で割り切れるので、整数になります。', f'{(a+p)*a.denominator}/{a.denominator}＝{fr(ans)}', None)]

def dec_mul_div(a, b, c):
    a, b, c = F(a), F(b), F(c); q = b / c; ans = a * q
    A, B, C = dstr(a), dstr(b), dstr(c)
    return [('計算の順番をくふうする', f'かけ算と割り算だけの式なので、割り切れる{B}÷{C}を先に計算しても答えは同じです。', f'{A}×{B}÷{C}＝{A}×({B}÷{C})', None),
            ('割り算を先にする', f'{B}÷{C}は、どちらも10倍して{dstr(b*10)}÷{dstr(c*10)}と考えます。', f'{B}÷{C}＝{dstr(q)}', (f'{B}÷{C}はいくつですか。', q)),
            ('かけ算をする', f'{A}に{dstr(q)}をかけます。', f'{A}×{dstr(q)}＝{dstr(ans)}', None),
            ('割り算で確かめる', f'答えを{dstr(q)}で割ると{A}に戻ります。', f'{dstr(ans)}÷{dstr(q)}＝{A}', None)]

def q34_times(n):
    n = F(n); N = dstr(n); q = n / 4; ans = q * 3
    return [('小数を分数に直す', '0.75はよく使う小数で、分数にすると3/4です。', '0.75＝3/4', None),
            ('分数のかけ算にする', f'0.75×{N}は、{N}を4で割って3倍することと同じです。', f'0.75×{N}＝{N}÷4×3', None),
            ('割り算を先にする', f'{N}を4で割ります。', f'{N}÷4＝{dstr(q)}', (f'{N}÷4はいくつですか。', q)),
            ('かけて答えを出す', '3倍して答えです。', f'{dstr(q)}×3＝{dstr(ans)}', None),
            ('逆の計算で確かめる', f'答えを0.75で割ると{N}に戻ります。', f'{dstr(ans)}÷0.75＝{N}', None)]

def pow2_sum(last):
    terms = []; t = 1
    while t <= last: terms.append(t); t *= 2
    s = '＋'.join(map(str, terms)); nxt = last * 2
    return [('小さいところで決まりを見つける', '1＋2＝3＝4−1、1＋2＋4＝7＝8−1のように、2倍ずつふえる数を1から足すと「次の数−1」になります。', '1＋2＋4＋8＝16−1', ('1＋2＋4＋8はいくつですか。', 15)),
            ('決まりを使う', f'最後の数{last}の次の数は{nxt}です。', f'{s}＝{nxt}−1', None),
            ('答えを出す', f'{nxt}から1をひきます。', f'{nxt}−1＝{nxt-1}', None),
            ('確かめる', f'最後の{last}をのぞいた和は{last}−1＝{last-1}です。それに{last}を足すと答えになります。', f'{last-1}＋{last}＝{nxt-1}', None)]

def arith_sum(txts, vals):
    n = len(txts); a, b = F(vals[0]), F(vals[-1]); ans = (a + b) * n / 2
    s = '＋'.join(txts)
    return [('数の並び方を見る', f'1/3ずつふえる数が{n}こ並んでいます。こういう和は、最初と最後を組にして考えます。', f'{s}＝({txts[0]}＋{txts[-1]})×{n}÷2', None),
            ('最初と最後を足す', '最初と最後、2番目と最後から2番目…を足すと、どの組も同じ値になります。', f'{txts[0]}＋{txts[-1]}＝{fr(a+b)}', (f'{txts[0]}＋{txts[-1]}はいくつですか。', a + b)),
            ('組の数を考える', f'{n}こを2つずつ組にすると、{fr(a+b)}が{fr(F(n,2))}組分です。', f'{fr(a+b)}×{n}÷2＝{fr(ans)}', None),
            ('平均で確かめる', f'真ん中の大きさ（平均）は{fr((a+b)/2)}です。平均×こ数でも同じです。', f'{fr((a+b)/2)}×{n}＝{fr(ans)}', None)]

def common_frac(x, f2, y, f1):
    # x×f2−y×f1 で f2＝2×f1
    f1, f2 = F(f1), F(f2); x2 = x * 2; d = x2 - y; ans = d * f1
    return [('かける分数をそろえる', f'{im(f2)}は{im(f1)}の2倍です。{x}×{im(f2)}は{x}×2＝{x2}に{im(f1)}をかけたのと同じです。', f'{x}×{im(f2)}＝{x2}×{im(f1)}', None),
            ('共通の数でまとめる', f'どちらにも{im(f1)}がかかっているので、まとめられます（分配法則）。', f'{x2}×{im(f1)}−{y}×{im(f1)}＝({x2}−{y})×{im(f1)}', None),
            ('かっこの中を計算する', 'かっこの中のひき算をします。', f'{x2}−{y}＝{d}', (f'{x2}−{y}はいくつですか。', d)),
            ('分数をかける', f'{d}に{im(f1)}をかけます。約分してから計算します。', f'{d}×{im(f1)}＝{fr(ans)}', None)]

def two_terms(a_t, a, b_t, b, op1, c_t, c, d_t, d, dec):
    a, b, c, d = map(F, (a, b, c, d)); p = a * b; q = c / d if op1 == '÷' else c * d; ans = p + q
    out = lambda v: dstr(v) if dec and (v * 1000).denominator == 1 else fr(v)
    return [('計算の順番を決める', f'たし算の両側にかけ算・割り算があります。{a_t}×{b_t}と{c_t}{op1}{d_t}を先に計算します。', f'{a_t}×{b_t}＋{c_t}{op1}{d_t}＝{fr(p)}＋{fr(q)}', None),
            ('前のかけ算をする', '帯分数と小数を仮分数に直してから計算します。', f'{a_t}×{b_t}＝{im(a)}×{im(b)}＝{fr(p)}', (f'{a_t}×{b_t}はいくつですか。', p)),
            ('後ろの割り算をする', '分数で割るときは、割る数の逆数をかけます。', f'{c_t}{op1}{d_t}＝{im(c)}×{im(1/d)}＝{fr(q)}', None),
            ('たし算をする', '2つの結果を足して答えです。', f'{fr(p)}＋{fr(q)}＝{out(ans)}', None)]

R = {}
R['R26K-1'] = lambda: order_ops(100, 8, 9, 18)
R['R26K-31'] = lambda: order_ops(100, 7, 9, 17)
R['R26K-4'] = lambda: mixed_dec_add('2と1/3', F(7,3), '1.5', F(3,2))
R['R26K-34'] = lambda: mixed_dec_add('4と1/3', F(13,3), '5.25', F(21,4))
R['R26K-5'] = lambda: frac_addsub('10と1/2', F(21,2), '−', '1と5/6', F(11,6))
R['R26K-35'] = lambda: frac_addsub('10と1/3', F(31,3), '−', '1と7/12', F(19,12))
R['R26K-6'] = lambda: div_unit_frac(24, 4)
R['R26K-36'] = lambda: div_unit_frac(36, 6)
R['R26K-9'] = lambda: frac_add_mul(F(1,3), F(2,3), 7)
R['R26K-39'] = lambda: frac_add_mul(F(1,7), F(6,7), 8)
R['R26K-12'] = lambda: dec_mul_div('3.13', '5.1', '1.7')
R['R26K-42'] = lambda: dec_mul_div('1.13', '5.7', '1.9')
R['R26K-14'] = lambda: q34_times('9.6')
R['R26K-44'] = lambda: q34_times('3.6')
R['R26K-17'] = lambda: pow2_sum(256)
R['R26K-47'] = lambda: pow2_sum(1024)
R['R26K-19'] = lambda: mul_div('1と2/3', F(5,3), '2.25', F(9,4), '2と1/7', F(15,7))
R['R26K-49'] = lambda: mul_div('1と1/9', F(10,9), '2.75', F(11,4), '1と7/15', F(22,15))
R['R26K-27'] = lambda: two_terms('6と2/3', F(20,3), '1.5', F(3,2), '÷', '3と1/3', F(10,3), '2/3', F(2,3), False)
R['R26K-57'] = lambda: two_terms('5と2/3', F(17,3), '1.25', F(5,4), '÷', '4と1/3', F(13,3), '0.8', F(4,5), True)
R['R26K-28'] = lambda: arith_sum(['1と1/3','1と2/3','2','2と1/3','2と2/3','3','3と1/3','3と2/3'], [F(4,3), F(11,3)])
R['R26K-58'] = lambda: arith_sum(['2と1/3','2と2/3','3','3と1/3','3と2/3','4','4と1/3','4と2/3','5'], [F(7,3), F(5)])
R['R26K-29'] = lambda: common_frac(1839, F(9,25), 678, F(9,50))
R['R26K-59'] = lambda: common_frac(1643, F(9,35), 486, F(9,70))
SPECIAL = R
