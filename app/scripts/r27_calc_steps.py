"""R27計算マスターの短い四則計算（4段に満たないもの）の解説。各式は build-calc-r27.py の check_equation で検算する。"""
from fractions import Fraction as F
from math import lcm
from r25_calc_steps import fr, im, frac_addsub
from r26_calc_steps import dstr, dec_mul_div, pow2_sum

def frac_minus_dec(a, b_txt, b):
    # 分数−小数
    a, b = F(a), F(b); c = lcm(a.denominator, b.denominator); ans = a - b
    return [('小数を分数に直す', f'分数と小数のひき算です。{b_txt}を分数にすると{im(b)}です。', f'{b_txt}＝{im(b)}', None),
            ('分母をそろえる', f'{a.denominator}と{b.denominator}の最小公倍数{c}を分母にします。', f'{im(a)}−{im(b)}＝{int(a*c)}/{c}−{int(b*c)}/{c}', (f'分母を{c}にそろえると、{im(b)}の分子はいくつですか。', b * c)),
            ('分子どうしをひく', '分母はそのままで、分子だけをひきます。', f'{int(a*c)}/{c}−{int(b*c)}/{c}＝{int(ans*c)}/{c}', None),
            ('約分する', '分子と分母を同じ数で割れるだけ割ります。', f'{int(ans*c)}/{c}＝{fr(ans)}', None),
            ('逆の計算で確かめる', f'答えに{b_txt}を足すと、はじめの数に戻ります。', f'{fr(ans)}＋{b_txt}＝{im(a)}', None)]

def q38_times(n):
    n = F(n); N = dstr(n); q = n / 8; ans = q * 3
    return [('小数を分数に直す', '0.375はよく使う小数で、分数にすると3/8です。', '0.375＝3/8', None),
            ('分数のかけ算にする', f'0.375×{N}は、{N}を8で割って3倍することと同じです。', f'0.375×{N}＝{N}÷8×3', None),
            ('割り算を先にする', f'{N}を8で割ります。', f'{N}÷8＝{dstr(q)}', (f'{N}÷8はいくつですか。', q)),
            ('かけて答えを出す', '3倍して答えです。', f'{dstr(q)}×3＝{dstr(ans)}', None),
            ('逆の計算で確かめる', f'答えを0.375で割ると{N}に戻ります。', f'{dstr(ans)}÷0.375＝{N}', None)]

def order_ops_div(a, b, c, d, e):
    # a−b×c＋d÷e
    p = b * c; q = F(d, e); x = a - p; ans = x + q
    return [('計算の順番を決める', 'ひき算・かけ算・たし算・割り算がまざっています。かけ算と割り算を先にして、そのあとたし算・ひき算を左から計算します。', f'{a}−{b}×{c}＋{d}÷{e}＝{a}−{p}＋{fr(q)}', None),
            ('かけ算をする', f'{b}×{c}を先に計算します。', f'{b}×{c}＝{p}', (f'{b}×{c}はいくつですか。', p)),
            ('割り算をする', f'{d}÷{e}も先に計算します。', f'{d}÷{e}＝{fr(q)}', None),
            ('左から順にひき算・たし算をする', 'たし算・ひき算は左から順に計算します。', f'{a}−{p}＋{fr(q)}＝{fr(ans)}', None)]

def three_fracs(a, b, c):
    # a−b＋c（分母がちがう3つの分数）
    a, b, c = F(a), F(b), F(c); L = lcm(a.denominator, b.denominator, c.denominator); ans = a - b + c
    na, nb, nc = int(a*L), int(b*L), int(c*L)
    return [('分母を素数の積で見る', f'分母{a.denominator}・{b.denominator}・{c.denominator}を素数のかけ算に分けて、最小公倍数を見つけます。', f'{im(a)}−{im(b)}＋{im(c)}＝{na}/{L}−{nb}/{L}＋{nc}/{L}', (f'3つの分母の最小公倍数はいくつですか。', L)),
            ('分子どうしを計算する', '分母をそろえたら、分子だけを左から計算します。', f'{na}/{L}−{nb}/{L}＋{nc}/{L}＝{na-nb+nc}/{L}', None),
            ('約分する', '分子と分母を同じ数で割れるだけ割ります。', f'{na-nb+nc}/{L}＝{im(ans)}', None),
            ('確かめる', '答えにひいた数を足し、足した数をひくと、はじめの数に戻ります。', f'{im(ans)}＋{im(b)}−{im(c)}＝{im(a)}', None)]

def chain4(t, fs, ops):
    # t: 表示用の数, fs: 分数, ops: 3つの演算（'×' or '÷'）
    fs = [F(x) for x in fs]
    expr_t = t[0] + ''.join(o + x for o, x in zip(ops, t[1:]))
    expr_f = im(fs[0]) + ''.join(o + im(x) for o, x in zip(ops, fs[1:]))
    inv = [fs[0]] + [x if o == '×' else 1 / x for o, x in zip(ops, fs[1:])]
    expr_m = '×'.join(im(x) for x in inv)
    ans = F(1)
    for x in inv: ans *= x
    return [('小数・帯分数を分数に直す', 'かけ算と割り算だけの式なので、全部を分数に直して1つにまとめると約分がしやすくなります。', f'{expr_t}＝{expr_f}', None),
            ('割り算を逆数のかけ算にする', '分数で割ることは、その逆数をかけることと同じです。', f'{expr_f}＝{expr_m}', None),
            ('約分してからかける', '分子と分母で約分できる組を先に消してからかけます。', f'{expr_m}＝{fr(ans)}', (f'{expr_t}はいくつですか。', ans)),
            ('ふつうの順で確かめる', '左から順に計算しても同じ答えになります。', f'{expr_t}＝{fr(ans)}', None)]

R = {}
R['R27K-1'] = lambda: frac_minus_dec(F(5, 6), '0.5', F(1, 2))
R['R27K-29'] = lambda: frac_minus_dec(F(11, 12), '0.25', F(1, 4))
R['R27K-4'] = lambda: frac_addsub('7と8/15', F(113, 15), '−', '2と7/10', F(27, 10))
R['R27K-32'] = lambda: frac_addsub('9と8/15', F(143, 15), '−', '2と5/6', F(17, 6))
R['R27K-13'] = lambda: q38_times('4.8')
R['R27K-41'] = lambda: q38_times('5.6')
R['R27K-16'] = lambda: pow2_sum(4096)
R['R27K-44'] = lambda: pow2_sum(2048)
R['R27K-17'] = lambda: order_ops_div(109, 9, 8, 54, 3)
R['R27K-45'] = lambda: order_ops_div(112, 12, 7, 48, 3)
R['R27K-19'] = lambda: dec_mul_div('3.13', '6.8', '1.7')
R['R27K-47'] = lambda: dec_mul_div('1.23', '7.6', '1.9')
R['R27K-22'] = lambda: three_fracs(F(61, 85), F(23, 34), F(20, 51))
R['R27K-50'] = lambda: three_fracs(F(53, 85), F(13, 34), F(20, 51))
R['R27K-24'] = lambda: chain4(['520', '0.3', '7.8', '3と1/4'], [520, F(3, 10), F(39, 5), F(13, 4)], ['×', '÷', '×'])
R['R27K-52'] = lambda: chain4(['720', '1.2', '0.8', '2と2/5'], [720, F(6, 5), F(4, 5), F(12, 5)], ['×', '÷', '÷'])
SPECIAL = R
