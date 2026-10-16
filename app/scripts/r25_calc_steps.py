"""R25計算マスターの短い四則計算（4段に満たないもの）の解説。各式は build-calc-r25.py の check_equation で検算する。"""
from fractions import Fraction as F
from math import lcm
from decimal import Decimal

def fr(x):
    x = F(x); w, r = divmod(x.numerator, x.denominator)
    if r == 0: return str(w)
    return f'{w}と{r}/{x.denominator}' if w else f'{r}/{x.denominator}'
def im(x):
    x = F(x); return str(x.numerator) if x.denominator == 1 else f'{x.numerator}/{x.denominator}'

def frac_addsub(a_txt, a, op, b_txt, b):
    a, b = F(a), F(b); c = lcm(a.denominator, b.denominator)
    na, nb = a * c, b * c; ans = a + b if op == '＋' else a - b; back = '−' if op == '＋' else '＋'
    s = []
    if a_txt != im(a) or b_txt != im(b):
        s.append(('帯分数を仮分数にする', '帯分数のままだと引けないところがあるので、仮分数に直してから計算します。',
                  f'{a_txt}{op}{b_txt}＝{im(a)}{op}{im(b)}', None))
    s.append(('分母をそろえる', f'{a.denominator}と{b.denominator}の最小公倍数{c}を分母にします。分母を何倍したかと同じだけ分子も何倍します。',
              f'{im(a)}{op}{im(b)}＝{na}/{c}{op}{nb}/{c}', (f'分母を{c}にそろえると、{im(b)}の分子はいくつですか。', nb)))
    s.append(('分子どうしを計算する', '分母はそのままで、分子だけを計算します。', f'{na}/{c}{op}{nb}/{c}＝{int(na + nb if op == "＋" else na - nb)}/{c}', None))
    s.append(('約分して帯分数にする', '分子と分母を同じ数で割れるだけ割り、1より大きければ帯分数にします。', f'{int(ans * c)}/{c}＝{fr(ans)}', None))
    s.append(('逆の計算で確かめる', '答えから逆の計算をして、はじめの数に戻るか確かめます。', f'{fr(ans)}{back}{b_txt}＝{a_txt}', None))
    return s

def dec_times(d, dfrac, n):
    d, n = str(d), int(n); f = F(dfrac); ans = f * n
    return [('小数を分数に直す', f'{d}はよく使う小数で、分数にすると{im(f)}です。分数にすると約分が使えます。', f'{d}＝{im(f)}', None),
            ('分数のかけ算にする', f'{d}×{n}は、{n}を{f.denominator}で割って{f.numerator}倍することと同じです。', f'{d}×{n}＝{n}÷{f.denominator}×{f.numerator}', None),
            ('割り算を先にする', f'{n}を{f.denominator}で割ります。', f'{n}÷{f.denominator}＝{n // f.denominator}', (f'{n}÷{f.denominator}はいくつですか。', F(n, f.denominator))),
            ('かけて答えを出す', f'{f.numerator}倍して答えです。', f'{n // f.denominator}×{f.numerator}＝{fr(ans)}', None),
            ('逆の計算で確かめる', f'答えを{d}で割ると{n}に戻ります。', f'{fr(ans)}÷{d}＝{n}', None)]

def distrib(k, xs):
    # k×x1＋x2×k＋k×x3
    s = sum(F(x) for x in xs); a, b, c = xs
    return [('共通の数を見つける', f'3つのかけ算すべてに{k}が入っています。かける順番を入れかえても答えは同じなので、{k}をまとめられます。',
             f'{k}×{a}＋{b}×{k}＋{k}×{c}＝{k}×({a}＋{b}＋{c})', None),
            ('かっこの中を計算する', '小数点をそろえて足します。', f'{a}＋{b}＋{c}＝{fr(s)}', (f'{a}＋{b}＋{c}はいくつですか。', s)),
            ('まとめたかけ算をする', f'{k}に{fr(s)}をかけます。', f'{k}×{fr(s)}＝{fr(k * s)}', None),
            ('1つずつ計算して確かめる', '3つのかけ算をそれぞれ計算して足しても、同じ答えになります。',
             f'{fr(k * F(a))}＋{fr(k * F(b))}＋{fr(k * F(c))}＝{fr(k * s)}', None)]

def add_mul(a, af, b, bf, n):
    af, bf = F(af), F(bf); p = bf * n; ans = af + p
    return [('計算の順番を決める', 'たし算とかけ算がまざっているので、かけ算を先にします。', f'{a}＋{b}×{n}＝{a}＋{fr(p) if p.denominator == 1 else im(p)}', None),
            ('小数を分数に直す', f'{a}も{b}も8分の何かで表せます。', f'{a}＋{b}×{n}＝{im(af)}＋{im(bf)}×{n}', None),
            ('かけ算をする', f'{im(bf)}に{n}をかけます。分母はそのままで分子を{n}倍します。', f'{im(bf)}×{n}＝{im(p)}', (f'{im(bf)}×{n}を分数で答えましょう。', p)),
            ('たし算をする', '分母がそろっているので分子どうしを足し、約分します。', f'{im(af)}＋{im(p)}＝{fr(ans)}', None)]

def mixed_ms(a_txt, a, op, b_txt, b, c_txt, c):
    a, b, c = F(a), F(b), F(c); p = b * c; ans = a + p if op == '＋' else a - p
    return [('かけ算を先にする', f'{op}と×がまざっているので、{b_txt}×{c_txt}を先に計算します。', f'{a_txt}{op}{b_txt}×{c_txt}＝{a_txt}{op}{fr(p) if p.denominator==1 else im(p)}', None),
            ('小数を分数に直す', '分数と小数がまざっているときは、分数にそろえると約分が使えます。', f'{c_txt}＝{im(c)}', None),
            ('かけ算をする', '分子どうし・分母どうしをかけて約分します。', f'{b_txt}×{im(c)}＝{im(p)}', (f'{b_txt}×{c_txt}を分数で答えましょう。', p)),
            (('ひき算をする' if op == '−' else 'たし算をする'), f'{a_txt}を分数にして計算します。', f'{im(a)}{op}{im(p)}＝{fr(ans)}', None),
            ('小数で確かめる', '答えを小数で表しても同じ大きさです。', f'{fr(ans)}＝{a_txt}{op}{b_txt}×{c_txt}', None)]

def dec_div(a, b, q):
    a10, b10 = F(a) * 10, F(b) * 10
    return [('割る数を整数にする', f'割る数{b}と割られる数{a}の小数点を、どちらも1けた右に動かします（10倍）。商は変わりません。', f'{a}÷{b}＝{(Decimal(a)*10).normalize()}÷{fr(b10)}', None),
            ('商の見当をつける', f'{fr(b10)}×{int(F(q))+1}＝{fr(b10*(int(F(q))+1))}は{(Decimal(a)*10).normalize()}より大きいので、商は{int(F(q))}をこえて{int(F(q))+1}より小さい数です。', f'{fr(b10)}×{int(F(q))}＝{fr(b10*int(F(q)))}', None),
            ('筆算で割る', f'商の小数点は、動かしたあとの割られる数の小数点にそろえます。', f'{(Decimal(a)*10).normalize()}÷{fr(b10)}＝{q}', (f'{a}÷{b}はいくつですか。', F(q))),
            ('かけ算で確かめる', '商に割る数をかけると、割られる数に戻ります。', f'{b}×{q}＝{a}', None)]

def mul_div(a, af, b, bf, c, cf):
    af, bf, cf = F(af), F(bf), F(cf); ans = af * bf / cf
    return [('小数を分数に直す', 'かけ算と割り算だけの式なので、分数に直して1つの分数にまとめると約分がしやすくなります。', f'{a}×{b}÷{c}＝{im(af)}×{im(bf)}÷{im(cf)}', None),
            ('割り算を逆数のかけ算にする', f'{im(cf)}で割ることは、{im(1/cf)}をかけることと同じです。', f'{im(af)}×{im(bf)}÷{im(cf)}＝{im(af)}×{im(bf)}×{im(1/cf)}', None),
            ('約分してかける', '分子と分母で約分できる組を先に消してからかけます。', f'{im(af)}×{im(bf)}×{im(1/cf)}＝{im(ans)}', (f'{a}×{b}÷{c}を分数で答えましょう。', ans)),
            ('帯分数・小数で確かめる', '仮分数を帯分数にします。小数で計算しても同じ値です。', f'{im(ans)}＝{fr(ans)}', None)]

SPECIAL = {
 'R25K-1': lambda: frac_addsub('1/9', F(1,9), '＋', '13/18', F(13,18)),
 'R25K-31': lambda: frac_addsub('1/4', F(1,4), '＋', '7/12', F(7,12)),
 'R25K-2': lambda: frac_addsub('6と5/6', F(41,6), '−', '2と14/15', F(44,15)),
 'R25K-32': lambda: frac_addsub('6と5/24', F(149,24), '−', '2と29/60', F(149,60)),
 'R25K-3': lambda: dec_times('0.25', F(1,4), 76),
 'R25K-33': lambda: dec_times('0.75', F(3,4), 24),
 'R25K-6': lambda: distrib(17, ['1.9','2.7','5.4']),
 'R25K-36': lambda: distrib(19, ['2.3','1.9','5.8']),
 'R25K-7': lambda: add_mul('0.125', F(1,8), '0.875', F(7,8), 9),
 'R25K-37': lambda: add_mul('0.375', F(3,8), '0.625', F(5,8), 9),
 'R25K-11': lambda: mixed_ms('0.8', F(4,5), '−', '2/5', F(2,5), '0.75', F(3,4)),
 'R25K-41': lambda: mixed_ms('0.6', F(3,5), '＋', '1と1/5', F(6,5), '0.75', F(3,4)),
 'R25K-15': lambda: dec_div('22.91', '7.9', '2.9'),
 'R25K-45': lambda: dec_div('34.71', '8.9', '3.9'),
 'R25K-25': lambda: mul_div('0.875', F(7,8), '1.8', F(9,5), '0.75', F(3,4)),
 'R25K-55': lambda: mul_div('0.625', F(5,8), '4.8', F(24,5), '0.75', F(3,4)),
}
