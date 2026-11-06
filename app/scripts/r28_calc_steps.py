"""R28計算マスターの短い計算（4段に満たないもの）の解説。各式は build-calc-r28.py の check_equation で検算する。"""
from fractions import Fraction as F
from math import gcd, lcm
from r25_calc_steps import fr, im
from r26_calc_steps import dstr
from r27_calc_steps import chain4

def int_div_frac(a, b):
    g = gcd(a, b); ans = F(a, b)
    return [('割り算を分数で表す', f'わり切れない割り算の商は、分数で表せます。{a}÷{b}は、{a}を分子、{b}を分母にした分数です。', f'{a}÷{b}＝{a}/{b}', None),
            ('最大公約数を見つける', f'{a}と{b}はどちらも{g}でわり切れます。', f'{a}÷{g}＝{a//g}', (f'{a}と{b}の最大公約数はいくつですか。', g)),
            ('約分する', f'分子と分母を{g}でわって、これ以上約分できない分数にします。', f'{a}/{b}＝{im(ans)}', None),
            ('かけ算で確かめる', f'商に割る数{b}をかけると、割られる数{a}に戻ります。', f'{im(ans)}×{b}＝{a}', None)]

def frac_plus_dec(a, b_txt, b):
    a, b = F(a), F(b); c = lcm(a.denominator, b.denominator); ans = a + b
    return [('小数を分数に直す', f'分数と小数のたし算です。{b_txt}を分数にすると{im(b)}です。', f'{b_txt}＝{im(b)}', None),
            ('分母をそろえる', f'{a.denominator}と{b.denominator}の最小公倍数{c}を分母にします。', f'{im(a)}＋{im(b)}＝{int(a*c)}/{c}＋{int(b*c)}/{c}', (f'分母を{c}にそろえると、{im(b)}の分子はいくつですか。', b * c)),
            ('分子どうしを足す', '分母はそのままで、分子だけを足します。', f'{int(a*c)}/{c}＋{int(b*c)}/{c}＝{int(ans*c)}/{c}', None),
            ('約分できるか確かめる', '分子と分母に共通の約数がないので、これで答えです。', f'{int(ans*c)}/{c}＝{im(ans)}', None),
            ('逆の計算で確かめる', f'答えから{b_txt}をひくと、はじめの数に戻ります。', f'{im(ans)}−{b_txt}＝{im(a)}', None)]

def dec_minus_mixed(a_txt, a, b_txt, b):
    a, b = F(a), F(b); ans = a - b; fpart = b - int(b)
    return [('帯分数の分数部分を小数に直す', f'小数と帯分数のひき算です。分母が5の分数は小数に直しやすいので、小数にそろえます。{im(fpart)}は{dstr(fpart)}です。', f'{im(fpart)}＝{dstr(fpart)}', None),
            ('帯分数を小数にする', f'整数部分の{int(b)}と合わせます。', f'{b_txt}＝{dstr(b)}', (f'{b_txt}を小数で表しましょう。', b)),
            ('小数のひき算をする', '小数点の位置をそろえてひきます。', f'{a_txt}−{dstr(b)}＝{dstr(ans)}', None),
            ('たし算で確かめる', 'ひいた数を答えに足すと、はじめの数に戻ります。', f'{dstr(ans)}＋{dstr(b)}＝{a_txt}', None)]

def div_by_eighth(a, d_txt, d):
    d = F(d); ans = a / d
    return [('小数を分数に直す', f'{d_txt}はよく使う小数で、分数にすると{im(d)}です。', f'{d_txt}＝{im(d)}', None),
            ('分数の割り算にする', f'{im(d)}で割ることは、逆数の{im(1/d)}をかけることと同じです。', f'{a}÷{im(d)}＝{a}×{im(1/d)}', None),
            ('かけ算をする', f'{a}に{im(1/d)}をかけます。', f'{a}×{im(1/d)}＝{fr(ans)}', (f'{a}÷{d_txt}はいくつですか。', ans)),
            ('かけ算で確かめる', f'答えに{d_txt}をかけると、{a}に戻ります。', f'{fr(ans)}×{d_txt}＝{a}', None)]

def frac_mul_cancel(a, b):
    a, b = F(a), F(b)
    g1 = gcd(a.numerator, b.denominator); a1 = F(a.numerator // g1, a.denominator); b1 = F(b.numerator, b.denominator // g1)
    g2 = gcd(b.numerator, a.denominator)
    an, ad, bn, bd = a.numerator // g1, a.denominator // g2, b.numerator // g2, b.denominator // g1
    s1 = f'{an}/{a.denominator}×{b.numerator}/{bd}'
    s2 = f'{an}/{ad}×{bn}/{bd}'
    ans = a * b
    return [('かける前に約分する', f'分数のかけ算は、かける前に分子と分母で約分できる組を消しておくと楽です。まず{a.numerator}と{b.denominator}を{g1}でわります。', f'{im(a)}×{im(b)}＝{s1}', None),
            ('もう一組約分する', f'次に{b.numerator}と{a.denominator}を{g2}でわります。', f'{s1}＝{s2}', None),
            ('分子どうし・分母どうしをかける', '約分したあとの数でかけます。', f'{s2}＝{im(ans)}', (f'{im(a)}×{im(b)}を分数で答えましょう。', ans)),
            ('割り算で確かめる', f'答えを{im(b)}で割ると、はじめの{im(a)}に戻ります。', f'{im(ans)}÷{im(b)}＝{im(a)}', None)]

def dec_div2(a, b, q):
    a, b, q = F(a), F(b), F(q); A, B = a * 100, b * 100; k = int(q)
    return [('割る数を整数にする', f'割る数{dstr(b)}が整数になるように、割る数も割られる数も100倍します（小数点を2けた右へ）。商は変わりません。', f'{dstr(a)}÷{dstr(b)}＝{dstr(A)}÷{dstr(B)}', None),
            ('商の見当をつける', f'{dstr(B)}×{k}＝{dstr(B*k)}、{dstr(B)}×{k+1}＝{dstr(B*(k+1))}なので、商は{k}と{k+1}の間です。', f'{dstr(B)}×{k}＝{dstr(B*k)}', None),
            ('筆算で割る', '商の小数点は、動かしたあとの割られる数の小数点にそろえます。', f'{dstr(A)}÷{dstr(B)}＝{dstr(q)}', (f'{dstr(a)}÷{dstr(b)}はいくつですか。', q)),
            ('かけ算で確かめる', '商に割る数をかけると、割られる数に戻ります。', f'{dstr(b)}×{dstr(q)}＝{dstr(a)}', None)]

def reorder_mul(a, b, c, d):
    # a×b×c÷d で a÷d がわり切れる
    q = a // d; ans = q * c * b
    return [('計算の順番をくふうする', f'かけ算と割り算だけの式なので、順番を入れかえても答えは同じです。{a}÷{d}がわり切れることに目をつけます。', f'{a}×{b}×{c}÷{d}＝{a}÷{d}×{c}×{b}', None),
            ('割り算を先にする', f'{a}を{d}で割ります。', f'{a}÷{d}＝{q}', (f'{a}÷{d}はいくつですか。', q)),
            ('切りのよい数をつくる', f'{q}×{c}を先にすると切りのよい数になります。', f'{q}×{c}＝{q*c}', None),
            ('残りをかける', f'最後に{b}をかけます。', f'{q*c}×{b}＝{ans}', None)]

def order_ops2(a, b, c, d, e):
    # a×b−c÷d×e
    p = a * b; q = F(c, d) * e; ans = p - q
    return [('計算の順番を決める', 'かけ算・割り算をたし算・ひき算より先にします。ひき算の左右をそれぞれ計算します。', f'{a}×{b}−{c}÷{d}×{e}＝{p}−{fr(q)}', None),
            ('左のかけ算をする', f'{a}×{b}を計算します。', f'{a}×{b}＝{p}', (f'{a}×{b}はいくつですか。', p)),
            ('右は左から順に計算する', f'割り算とかけ算は左から順にします。{c}÷{d}を先にしてから×{e}です。', f'{c}÷{d}×{e}＝{fr(q)}', None),
            ('ひき算をする', '最後にひき算をします。', f'{p}−{fr(q)}＝{fr(ans)}', None)]

def mixed_four(a_t, a, b_t, b, c, n, e):
    a, b, c, e = F(a), F(b), F(c), F(e); p = a / b; q = c * n; ans = p - q + e
    return [('計算の順番を決める', '割り算とかけ算を先にして、そのあとたし算・ひき算を左から計算します。', f'{a_t}÷{b_t}−{im(c)}×{n}＋{im(e)}＝{fr(p)}−{im(q)}＋{im(e)}', None),
            ('帯分数の割り算をする', '帯分数を仮分数に直し、割る数の逆数をかけます。', f'{a_t}÷{b_t}＝{im(a)}×{im(1/b)}＝{fr(p)}', (f'{a_t}÷{b_t}はいくつですか。', p)),
            ('かけ算をする', f'{im(c)}に{n}をかけて約分します。', f'{im(c)}×{n}＝{im(q)}', None),
            ('左から順にひき算・たし算をする', '分母をそろえて左から計算します。', f'{fr(p)}−{im(q)}＋{im(e)}＝{fr(ans)}', None)]

def pi_common(r1, r2, num, den):
    k = r1 * r1 - r2 * r2; f = F(num, den); m = k * f; ans = m * F(314, 100)
    return [('共通の部分でくくる', f'2つのかけ算はどちらも「3.14×{num}/{den}」をふくんでいます。分配法則でまとめます。', f'{r1}×{r1}×3.14×{num}/{den}−{r2}×{r2}×3.14×{num}/{den}＝({r1}×{r1}−{r2}×{r2})×3.14×{num}/{den}', None),
            ('かっこの中を計算する', f'{r1}×{r1}＝{r1*r1}、{r2}×{r2}＝{r2*r2}です。', f'{r1}×{r1}−{r2}×{r2}＝{k}', (f'{r1}×{r1}−{r2}×{r2}はいくつですか。', k)),
            ('分数をかける', f'{num}/{den}は約分すると{im(f)}です。{k}にかけます。', f'{k}×{num}/{den}＝{fr(m)}', None),
            ('3.14をかける', '3.14のかけ算は最後に1回だけします。', f'{fr(m)}×3.14＝{dstr(ans)}', None)]

R = {}
R['R28K-3'] = lambda: int_div_frac(6, 9)
R['R28K-30'] = lambda: int_div_frac(6, 14)
R['R28K-4'] = lambda: frac_plus_dec(F(2, 3), '0.25', F(1, 4))
R['R28K-31'] = lambda: frac_plus_dec(F(2, 7), '0.25', F(1, 4))
R['R28K-5'] = lambda: dec_minus_mixed('6.8', F(68, 10), '4と2/5', F(22, 5))
R['R28K-32'] = lambda: dec_minus_mixed('7.2', F(72, 10), '4と4/5', F(24, 5))
R['R28K-6'] = lambda: div_by_eighth(24, '0.125', F(1, 8))
R['R28K-33'] = lambda: div_by_eighth(32, '0.125', F(1, 8))
R['R28K-8'] = lambda: frac_mul_cancel(F(15, 56), F(16, 25))
R['R28K-35'] = lambda: frac_mul_cancel(F(44, 49), F(28, 33))
R['R28K-9'] = lambda: dec_div2('0.629', '0.17', '3.7')
R['R28K-36'] = lambda: dec_div2('0.551', '0.19', '2.9')
R['R28K-13'] = lambda: reorder_mul(76, 7, 25, 19)
R['R28K-40'] = lambda: reorder_mul(116, 11, 25, 29)
R['R28K-14'] = lambda: chain4(['28/33', '1と17/22', '26/35'], [F(28, 33), F(39, 22), F(26, 35)], ['÷', '×'])
R['R28K-41'] = lambda: chain4(['1と11/34', '2と7/10', '2と1/25'], [F(45, 34), F(27, 10), F(51, 25)], ['÷', '×'])
R['R28K-17'] = lambda: order_ops2(21, 3, 48, 4, 3)
R['R28K-19'] = lambda: mixed_four('7と1/3', F(22, 3), '1と5/6', F(11, 6), F(7, 8), 2, F(3, 4))
R['R28K-20'] = lambda: pi_common(5, 4, 240, 360)
R['R28K-47'] = lambda: pi_common(13, 5, 240, 360)
SPECIAL = R
