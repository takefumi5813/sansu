"""Notion問題DB（計算マスター R20〜R23）から計算101問を教材化する。

- 問題文・答え・URLは references/calc-extra-notion-evidence.json（Notionの各ページ本文をfetchした証跡）。
- 式は references/calc-extra-expressions.json（Dropbox本文から機械変換し、Fractionで答えを照合済み）。
- 解き筋は種類ごとのテンプレートで作り、各ステップの等式をFractionで厳密に検算する。
- 出力は content/selected-calc-2.json と reports/calc-extra-selection.md。既存のコンテンツは変更しない。
"""
from pathlib import Path
from fractions import Fraction
from math import gcd, lcm
import re, json, subprocess

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = json.loads((ROOT/'references/calc-extra-notion-evidence.json').read_text(encoding='utf-8'))
EXPR = {x['id']: x for x in json.loads((ROOT/'references/calc-extra-expressions.json').read_text(encoding='utf-8'))}
LOCAL_PATH = 'Dropbox:/算数DB/本文/算数DB_通常授業_後期.md'

# ---------- exact arithmetic (independent of calcScore) ----------
def normalize(s):
    s = s.replace('＋', '+').replace('−', '-').replace('－', '-').replace('×', '*').replace('＝', '=')
    s = re.sub(r'(\d+)と(\d+)/(\d+)', lambda m: f'{int(m[1])*int(m[3])+int(m[2])}/{m[3]}', s)
    return re.sub(r'\s+', '', s)

def exact(s):
    tokens = re.findall(r'\d+/\d+|\d+(?:\.\d*)?|[+*÷()\-]', normalize(s))
    if ''.join(tokens) != normalize(s): raise ValueError('Unsupported exact expression: ' + s)
    i = 0
    def atom():
        nonlocal i
        if tokens[i] == '(':
            i += 1; v = add(); assert tokens[i] == ')'; i += 1; return v
        if tokens[i] in '+-':
            sign = tokens[i]; i += 1; v = atom(); return -v if sign == '-' else v
        v = Fraction(tokens[i]); i += 1; return v
    def product():
        nonlocal i
        v = atom()
        while i < len(tokens) and tokens[i] in ['*', '÷']:
            op = tokens[i]; i += 1; o = atom(); v = v*o if op == '*' else v/o
        return v
    def add():
        nonlocal i
        v = product()
        while i < len(tokens) and tokens[i] in ['+', '-']:
            op = tokens[i]; i += 1; o = product(); v = v+o if op == '+' else v-o
        return v
    v = add(); assert i == len(tokens); return v

# ---------- display helpers ----------
def fmt(x):
    x = Fraction(x); return str(x.numerator) if x.denominator == 1 else f'{x.numerator}/{x.denominator}'

def mixed(x):
    x = Fraction(x)
    if x.denominator == 1: return str(x.numerator)
    w = x.numerator // x.denominator; r = x - w
    return f'{w}と{r.numerator}/{r.denominator}' if w else f'{r.numerator}/{r.denominator}'

def terminating(x):
    d = Fraction(x).denominator
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d == 1

def dec(x):
    x = Fraction(x)
    for k in range(0, 13):
        if (x*10**k).denominator == 1:
            s = str(int(x*10**k))
            if k == 0: return s
            s = s.zfill(k+1); return s[:-k] + '.' + s[-k:]
    raise ValueError('not terminating: ' + fmt(x))

def plain(x):
    return dec(x) if terminating(x) else fmt(x)

def spec(x):
    x = Fraction(x); return {'n': str(x.numerator), 'd': str(x.denominator), 'unit': '', 'dimension': 'scalar'}

def places(tok):
    return len(tok.split('.')[1]) if '.' in tok else 0

def pair(n, d):
    return f'{n}/{d}' if d != 1 else str(n)

def check_equation(eq):
    parts = eq.split('＝'); vals = [exact(p) for p in parts]
    assert all(v == vals[0] for v in vals), ('equation does not hold', eq, vals)

def step(title, body, eq, cp=None):
    check_equation(eq)
    r = {'title': title, 'body': body, 'equation': eq}
    if cp: r['checkpoint'] = {'prompt': cp[0], 'answer': spec(cp[1])}
    return r

# ---------- parsing of the displayed problem text ----------
TOK = r'\d+と\d+/\d+|\d+/\d+|\d+\.\d+|\d+'

def clean_text(text):
    s = re.sub(r'[＝=]\s*□?\s*$', '', text.strip())
    s = s.replace('+', '＋').replace('-', '−').replace('－', '−').replace('*', '×').replace(' ', '')
    return s

def parse_terms(s):
    """-> [(sign, [(op, tok), ...]), ...]   sign in '＋','−'; op in '×','÷' (first op is '×')."""
    items = re.findall(rf'({TOK})|([＋−×÷])', s)
    flat = [(t or o) for t, o in items]
    assert ''.join(flat) == s, (s, flat)
    terms = []; sign = '＋'; cur = []; op = '×'
    for t in flat:
        if t in ('＋', '−'):
            terms.append((sign, cur)); sign = t; cur = []; op = '×'
        elif t in ('×', '÷'):
            op = t
        else:
            cur.append((op, t)); op = '×'
    terms.append((sign, cur))
    return terms

def term_text(factors):
    return ''.join((('' if i == 0 else op) + tok) for i, (op, tok) in enumerate(factors))

def term_value(factors):
    v = Fraction(1)
    for op, tok in factors:
        x = exact(tok); v = v*x if op == '×' else v/x
    return v

def show(v, style):
    return {'mixed': mixed, 'dec': dec, 'frac': fmt, 'int': fmt}[style](v)

def check_form(v, style):
    return dec(v) if style == 'dec' and terminating(v) else fmt(v)

def answer_style(answer_text):
    a = answer_text.strip()
    if 'と' in a: return 'mixed'
    if '.' in a: return 'dec'
    if '/' in a: return 'frac'
    return 'int'

def conv_list(toks):
    out = []
    for t in toks:
        if 'と' in t or '.' in t:
            out.append(f'{t}＝{fmt(exact(t))}')
    return out

def first_conv_checkpoint(toks):
    for t in toks:
        if 'と' in t:
            v = exact(t); return (f'{t}を仮分数にすると、分子はいくつですか。', v.numerator)
    for t in toks:
        if '.' in t:
            v = exact(t); return (f'{t}を約分した分数にすると、分子はいくつですか。', v.numerator)
    return None

# ---------- templates ----------
def t_dec_mul(a, b, ans, style):
    pa, pb = places(a), places(b); k = pa + pb
    A = int(exact(a)*10**pa); B = int(exact(b)*10**pb); prod = A*B
    tf = lambda tok, p, I: f'{I}/{10**p}' if p else str(I)
    return [
        step('小数点をとって整数にする',
             f'小数点の右の数字の個数は、{a}が{pa}個、{b}が{pb}個で、合わせて{k}個です。小数点をとった整数どうしのかけ算に直します。',
             f'{a}×{b}＝{tf(a, pa, A)}×{tf(b, pb, B)}'),
        step('整数どうしをかける', '小数点のことは忘れて、整数のかけ算をします。', f'{A}×{B}＝{prod}',
             (f'{A}×{B}はいくつですか。', prod)),
        step('小数点を戻す', f'整数の答えの右から{k}けたのところに小数点を打ちます。{10**k}で割ることと同じです。',
             f'{prod}÷{10**k}＝{dec(ans)}'),
        step('割り算で確かめる', '答えを一方の数で割ると、もう一方の数に戻ります。', f'{dec(ans)}÷{b}＝{a}')]

def t_dec_div(a, b, ans, style):
    pa, pb = places(a), places(b); k = max(pa, pb)
    A = int(exact(a)*10**k); B = int(exact(b)*10**k); g = gcd(A, B)
    st = [
        step('割る数と割られる数を同じ数倍して整数にする',
             f'割られる数も割る数も同じ数だけ{10**k}倍しても、割り算の答えは変わりません。',
             f'{a}÷{b}＝{A}÷{B}', (f'{b}を{10**k}倍するといくつですか。', B)),
        step('割り算を分数で表す', '整数どうしの割り算は、わられる数を分子、わる数を分母にした分数で表せます。', f'{A}÷{B}＝{A}/{B}'),
        step('約分する', f'分子と分母に共通の約数があれば、その数で割って小さくします。{A}と{B}の最大公約数は{g}です。',
             f'{A}/{B}＝{fmt(ans)}', (f'{A}と{B}の最大公約数はいくつですか。', g))]
    if show(ans, style) != fmt(ans):
        st.append(step('答えの形に直す', '分数を、問題にあった形（小数や帯分数）に直します。', f'{fmt(ans)}＝{show(ans, style)}'))
    st.append(step('かけ算で確かめる', '答えに割った数をかけると、割られる数に戻ります。', f'{check_form(ans, "dec")}×{b}＝{a}'))
    return st

def t_int_div(a, b, ans, style):
    A, B = int(a), int(b); g = gcd(A, B)
    st = [step('割り算を分数で表す', 'わられる数を分子、わる数を分母にした分数にします。', f'{A}÷{B}＝{A}/{B}'),
          step('約分する', f'{A}と{B}の最大公約数{g}で割ります。', f'{A}/{B}＝{fmt(ans)}',
               (f'{A}と{B}の最大公約数はいくつですか。', g))]
    if show(ans, style) != fmt(ans):
        st.append(step('答えの形に直す', '仮分数を帯分数（や小数）に直します。', f'{fmt(ans)}＝{show(ans, style)}'))
    st.append(step('かけ算で確かめる', '答えに割った数をかけると、わられる数に戻ります。', f'{fmt(ans)}×{B}＝{A}'))
    return st

def t_zeros(a, b, ans, style):
    ca, cb = a.rstrip('0'), b.rstrip('0'); za, zb = len(a)-len(ca), len(b)-len(cb)
    return [
        step('0以外の数と10や100のかたまりに分ける', f'{a}は{ca}と{10**za}、{b}は{cb}と{10**zb}に分けられます。',
             f'{a}×{b}＝{ca}×{10**za}×{cb}×{10**zb}'),
        step('0以外の数をかける', '0の部分を除いた数どうしを先にかけます。', f'{ca}×{cb}＝{int(ca)*int(cb)}',
             (f'{ca}×{cb}はいくつですか。', int(ca)*int(cb))),
        step('0の個数を数える', f'{10**za}×{10**zb}は、0を合わせて{za+zb}個つけた数になります。', f'{10**za}×{10**zb}＝{10**(za+zb)}'),
        step('合わせる', '先に出した積に、0を{}個つけます。'.format(za+zb), f'{int(ca)*int(cb)}×{10**(za+zb)}＝{fmt(ans)}'),
        step('割り算で確かめる', '答えを一方の数で割ると、もう一方に戻ります。', f'{fmt(ans)}÷{b}＝{a}')]

def t_sector(s, ans):
    m = re.fullmatch(r'(\d+)×(\d+)×3\.14×(\d+)/(\d+)', s); A, A2, P, Q = map(int, m.groups())
    g = gcd(P, Q); K = Fraction(A*A2*P, Q)
    return [
        step('3.14は最後にかける', '3.14をかけるのは最後にして、先に半径×半径と中心角の分数の部分を計算します。',
             f'{A}×{A2}×3.14×{P}/{Q}＝{A}×{A2}×{P}/{Q}×3.14'),
        step('中心角の分数を約分する', f'{P}も{Q}も{g}で割れます。360度のうち何分のいくつかを小さい分数にします。',
             f'{P}/{Q}＝{P//g}/{Q//g}', (f'{P}と{Q}の最大公約数はいくつですか。', g)),
        step('3.14以外の部分を先に出す', f'{A}×{A2}＝{A*A2}です。{Q//g}で割れるところを割って、3.14にかける数を出します。',
             f'{A}×{A2}×{P//g}/{Q//g}＝{plain(K)}', (f'{A}×{A2}はいくつですか。', A*A2)),
        step('最後に3.14をかける', '小数のかけ算を1回だけすれば答えです。', f'{plain(K)}×3.14＝{plain(ans)}'),
        step('割り算で確かめる', '答えを3.14で割ると、先に出した数に戻ります。', f'{plain(ans)}÷3.14＝{plain(K)}')]

def t_sector_diff(s, ans):
    m = re.fullmatch(r'(\d+)×(\d+)×3\.14×(\d+)/(\d+)−(\d+)×(\d+)×3\.14×(\d+)/(\d+)', s)
    A, A2, P, Q, B, B2, P2, Q2 = map(int, m.groups()); assert (P, Q) == (P2, Q2)
    D = A*A2 - B*B2; K = Fraction(D*P, Q)
    return [
        step('共通の部分でくくる', '3.14と中心角の分数が二つの式に共通です。先に半径×半径の差を出すと、計算が短くなります。',
             f'{A}×{A2}×3.14×{P}/{Q}−{B}×{B2}×3.14×{P}/{Q}＝({A}×{A2}−{B}×{B2})×3.14×{P}/{Q}'),
        step('半径×半径の差を出す', '同じ数をかけた部分を計算してから引きます。', f'{A}×{A2}−{B}×{B2}＝{D}',
             (f'{A}×{A2}−{B}×{B2}はいくつですか。', D)),
        step('分数をかける', f'{D}を{Q}等分して{P}個ぶんにします。割り切れるところを先に割りましょう。', f'{D}×{P}/{Q}＝{plain(K)}'),
        step('最後に3.14をかける', '小数のかけ算を1回だけすれば答えです。', f'{plain(K)}×3.14＝{plain(ans)}'),
        step('割り算で確かめる', '答えを3.14で割ると、先に出した数に戻ります。', f'{plain(ans)}÷3.14＝{plain(K)}')]

def t_borrow(a, b, ans, style):
    N = int(a); m = re.fullmatch(r'(\d+)と(\d+)/(\d+)', b); A, p, q = map(int, m.groups())
    W = N - 1 - A; fr = Fraction(q-p, q)
    st = [
        step('整数から1を借りて分数にする', f'{N}から1を借りて、1を{q}/{q}と考えます。', f'{N}＝{N-1}と{q}/{q}'),
        step('整数部分どうしを引く', f'借りたあとの整数{N-1}から、{A}を引きます。', f'{N-1}−{A}＝{W}',
             (f'{N-1}−{A}はいくつですか。', W)),
        step('分数部分どうしを引く', f'分母が同じなので、分子だけ引きます。', f'{q}/{q}−{p}/{q}＝{q-p}/{q}')]
    if fr.denominator != q:
        st.append(step('約分する', '分子と分母を共通の約数で割ります。', f'{q-p}/{q}＝{fmt(fr)}'))
    st.append(step('整数部分と分数部分を合わせる', '二つの答えを合わせると帯分数になります。', f'{W}＋{fmt(fr)}＝{mixed(ans)}'))
    st.append(step('足して確かめる', '答えに引いた数を足すと、はじめの数に戻ります。', f'{mixed(ans)}＋{b}＝{N}'))
    return st

def t_dec_addsub(a, b, op, ans, style):
    k = max(places(a), places(b)); A = int(exact(a)*10**k); B = int(exact(b)*10**k)
    C = A + B if op == '＋' else A - B
    inv = '−' if op == '＋' else '＋'
    return [
        step('小数点をそろえて整数にする', f'小数点の右の位をそろえると、0.{"0"*(k-1)}1が何個分かで考えられます。',
             f'{a}{op}{b}＝{A}/{10**k}{op}{B}/{10**k}'),
        step('整数どうしの計算をする', '分母が同じなので、分子だけ計算します。', f'{A}{op}{B}＝{C}', (f'{A}{op}{B}はいくつですか。', C)),
        step('小数に戻す', f'{10**k}で割って小数に戻します。', f'{C}÷{10**k}＝{dec(ans)}'),
        step('逆の計算で確かめる', '答えから逆向きの計算をして、はじめの数に戻るか確かめます。', f'{dec(ans)}{inv}{b}＝{a}')]

def t_frac_addsub(a, b, op, ans, style):
    Fa, Fb = exact(a), exact(b); L = lcm(Fa.denominator, Fb.denominator)
    na = Fa.numerator*(L//Fa.denominator); nb = Fb.numerator*(L//Fb.denominator)
    res = Fa + Fb if op == '＋' else Fa - Fb
    inv = '−' if op == '＋' else '＋'; st = []
    cp1 = first_conv_checkpoint([a, b]); conv = conv_list([a, b])
    if conv:
        st.append(step('帯分数・小数を分数に直す',
                       '帯分数は整数部分に分母をかけて分子にたし、小数は10や100を分母にして約分します。（' + '、'.join(conv) + '）',
                       f'{a}{op}{b}＝{fmt(Fa)}{op}{fmt(Fb)}', cp1))
    if Fa.denominator != Fb.denominator:
        st.append(step('通分する', f'分母{Fa.denominator}と{Fb.denominator}の最小公倍数{L}に分母をそろえます。分母を何倍したかと同じだけ、分子も何倍します。',
                       f'{fmt(Fa)}{op}{fmt(Fb)}＝{na}/{L}{op}{nb}/{L}',
                       None if cp1 else (f'分母を{L}にそろえると、{fmt(Fa)}の分子はいくつですか。', na)))
        lhs = f'{na}/{L}{op}{nb}/{L}'
    else:
        lhs = f'{fmt(Fa)}{op}{fmt(Fb)}'
    tot = na + nb if op == '＋' else na - nb
    if pair(tot, L) != fmt(res):
        st.append(step('分子を計算する', '分母はそのままで、分子だけを計算します。', f'{lhs}＝{pair(tot, L)}',
                       None if (cp1 or Fa.denominator != Fb.denominator) else (f'{na}{op}{nb}はいくつですか。', tot)))
        st.append(step('約分する', '分子と分母を共通の約数で割って、できるだけ小さい分数にします。', f'{pair(tot, L)}＝{fmt(res)}'))
    else:
        st.append(step('分子を計算する', '分母はそのままで、分子だけを計算します。', f'{lhs}＝{fmt(res)}',
                       None if (cp1 or Fa.denominator != Fb.denominator) else (f'{na}{op}{nb}はいくつですか。', tot)))
    if show(res, style) != fmt(res):
        st.append(step('答えの形に直す', '分数を、問題にあった形（小数や帯分数）に直します。', f'{fmt(res)}＝{show(res, style)}'))
    st.append(step('逆の計算で確かめる', '答えから逆向きの計算をして、はじめの数に戻るか確かめます。', f'{fmt(res)}{inv}{fmt(Fb)}＝{fmt(Fa)}'))
    return st

def t_chain(factors, ans, style):
    toks = [t for _, t in factors]; orig = term_text(factors)
    nums = []; dens = []; mult = []
    for op, tok in factors:
        x = exact(tok); n, d = (x.numerator, x.denominator) if op == '×' else (x.denominator, x.numerator)
        nums.append(n); dens.append(d); mult.append(pair(n, d))
    mult_expr = '×'.join(mult); has_div = any(op == '÷' for op, _ in factors)
    conv = conv_list(toks)
    body = ''
    if conv: body += '帯分数・小数は分数に直します（' + '、'.join(conv) + '）。'
    if has_div: body += '÷はあとの数の逆数をかけるかけ算に直します。'
    body += '整数は分母1の分数と考えます。'
    st = [step('分数のかけ算の形にする', body, f'{orig}＝{mult_expr}', None)]
    cancels = []; changed = True
    while changed:
        changed = False
        for i in range(len(nums)):
            for j in range(len(dens)):
                g = gcd(nums[i], dens[j])
                if g > 1:
                    cancels.append((nums[i], dens[j], g)); nums[i] //= g; dens[j] //= g; changed = True
    keep = [(n, d) for n, d in zip(nums, dens) if not (n == 1 and d == 1)] or [(1, 1)]
    canc_expr = '×'.join(pair(n, d) for n, d in keep)
    N = 1; D = 1
    for n, d in zip(nums, dens): N *= n; D *= d
    res = Fraction(N, D); assert res == ans
    if cancels:
        n0, d0, g0 = cancels[0]
        desc = '、'.join(f'{n}と{d}を{g}で割る' for n, d, g in cancels)
        st.append(step('かける前に約分する', f'分子と分母に共通の約数があるときは、かけ算をする前に約分すると計算が楽になります。（{desc}）',
                       f'{mult_expr}＝{canc_expr}', (f'{n0}と{d0}は{g0}で割れます。{n0}を{g0}で割るといくつですか。', n0//g0)))
        st.append(step('分子どうし・分母どうしをかける', '約分したあとの数をかけ合わせます。', f'{canc_expr}＝{fmt(res)}'))
    else:
        st.append(step('分子どうし・分母どうしをかける', '約分できる組がないので、そのままかけ合わせます。', f'{mult_expr}＝{fmt(res)}',
                       (f'分子どうしをかけるといくつですか。', N)))
    if show(res, style) != fmt(res):
        st.append(step('答えの形に直す', '仮分数を、問題にあった形（小数や帯分数）に直します。', f'{fmt(res)}＝{show(res, style)}'))
    op, tok = factors[-1]; rest = term_value(factors[:-1]); tshow = fmt(exact(tok)) if 'と' in tok else tok
    if op == '×':
        eq = f'{check_form(res, style)}÷{tshow}＝{check_form(rest, style)}'
    else:
        eq = f'{check_form(res, style)}×{tshow}＝{check_form(rest, style)}'
    st.append(step('逆の計算で確かめる', '最後にした計算の逆の計算をして、その前の値に戻るか確かめます。', eq))
    return st

def t_mixed_ops(terms, ans, style):
    tv = [term_value(f) for _, f in terms]; st = []
    first_cp_done = False
    for (sign, factors), v in zip(terms, tv):
        if len(factors) < 2: continue
        toks = [t for _, t in factors]; conv = conv_list(toks)
        body = '＋・−より先に、×と÷を計算します。'
        if conv: body += '帯分数・小数は分数に直し（' + '、'.join(conv) + '）、'
        body += '÷は逆数のかけ算に直して、約分してから計算します。'
        cp = None
        if not first_cp_done:
            cp = first_conv_checkpoint(toks); first_cp_done = cp is not None
        st.append(step(f'{term_text(factors)}を先に計算する', body, f'{term_text(factors)}＝{fmt(v)}', cp))
    op = terms[1][0]; inv = '−' if op == '＋' else '＋'
    Fa, Fb = tv[0], tv[1]; L = lcm(Fa.denominator, Fb.denominator)
    na = Fa.numerator*(L//Fa.denominator); nb = Fb.numerator*(L//Fb.denominator)
    res = Fa + Fb if op == '＋' else Fa - Fb
    if Fa.denominator != Fb.denominator:
        st.append(step('通分する', f'二つの答えの分母{Fa.denominator}と{Fb.denominator}を、最小公倍数{L}にそろえます。',
                       f'{fmt(Fa)}{op}{fmt(Fb)}＝{na}/{L}{op}{nb}/{L}',
                       None if first_cp_done else (f'分母を{L}にそろえると、{fmt(Fa)}の分子はいくつですか。', na)))
        lhs = f'{na}/{L}{op}{nb}/{L}'
    else:
        lhs = f'{fmt(Fa)}{op}{fmt(Fb)}'
    tot = na + nb if op == '＋' else na - nb
    if pair(tot, L) != fmt(res):
        st.append(step('分子を計算する', '分母が同じなので、分子だけを計算します。', f'{lhs}＝{pair(tot, L)}'))
        st.append(step('約分する', '分子と分母を共通の約数で割って、できるだけ小さい分数にします。', f'{pair(tot, L)}＝{fmt(res)}'))
    else:
        st.append(step('たし算・ひき算をする', '分母が同じなので、分子を計算します。', f'{lhs}＝{fmt(res)}'))
    if show(res, style) != fmt(res):
        st.append(step('答えの形に直す', '仮分数を、問題にあった形（小数や帯分数）に直します。', f'{fmt(res)}＝{show(res, style)}'))
    st.append(step('逆の計算で確かめる', '答えから逆向きの計算をして、前の値に戻るか確かめます。', f'{fmt(res)}{inv}{fmt(Fb)}＝{fmt(Fa)}'))
    return st

# ---------- hand-written explanations ----------
def distrib_common(pid):
    if pid == 'R23K-17':
        return [
            step('34は17の何倍か見つける', '17×98と34をくらべると、34は17の2倍です。', '34＝17×2'),
            step('17をそろえて書く', '34を17×2に直すと、どちらの項にも17が出てきます。', '17×98＋34＝17×98＋17×2'),
            step('17でくくる', '共通の17を前に出して、かっこの中をたします。', '17×98＋17×2＝17×(98＋2)',
                 ('98＋2はいくつですか。', 100)),
            step('かけ算をする', '17×100は17の後ろに0を2個つけます。', '17×(98＋2)＝1700'),
            step('ひき算で確かめる', '答えから34を引くと、17×98に戻ります。', '1700−34＝17×98')]
    if pid == 'R23K-47':
        return [
            step('51は17の何倍か見つける', '97×17と51をくらべると、51は17の3倍です。', '51＝17×3'),
            step('17をそろえて書く', '51を3×17に直すと、どちらの項にも17が出てきます。', '97×17＋51＝97×17＋3×17'),
            step('17でくくる', '共通の17でくくって、かっこの中をたします。', '97×17＋3×17＝(97＋3)×17',
                 ('97＋3はいくつですか。', 100)),
            step('かけ算をする', '100×17は17の後ろに0を2個つけます。', '(97＋3)×17＝1700'),
            step('ひき算で確かめる', '答えから51を引くと、97×17に戻ります。', '1700−51＝97×17')]
    if pid == 'R20K-19':
        return [
            step('34×13を17の式に直す', '34は17の2倍なので、34×13＝17×(2×13)＝17×26です。', '34×13＝17×26'),
            step('51×23を17の式に直す', '51は17の3倍なので、51×23＝17×(3×23)＝17×69です。', '51×23＝17×69'),
            step('17をそろえて書く', 'どの項も17×□の形になりました。', '17×5＋34×13＋51×23＝17×5＋17×26＋17×69'),
            step('17でくくる', '共通の17でくくって、かっこの中をたします。', '17×5＋17×26＋17×69＝17×(5＋26＋69)',
                 ('5＋26＋69はいくつですか。', 100)),
            step('かけ算をする', '17×100は17の後ろに0を2個つけます。', '17×(5＋26＋69)＝1700')]
    if pid == 'R20K-49':
        return [
            step('46×13を23の式に直す', '46は23の2倍なので、46×13＝23×(2×13)＝23×26です。', '46×13＝23×26'),
            step('69×19を23の式に直す', '69は23の3倍なので、69×19＝23×(3×19)＝23×57です。', '69×19＝23×57'),
            step('23をそろえて書く', 'どの項も23×□の形になりました。', '23×7＋46×13＋69×19＝23×7＋23×26＋23×57'),
            step('23でくくる', '共通の23でくくって、かっこの中をたします。', '23×7＋23×26＋23×57＝23×(7＋26＋57)',
                 ('7＋26＋57はいくつですか。', 90)),
            step('かけ算をする', '23×90は、23×9の後ろに0を1個つけます。', '23×(7＋26＋57)＝2070')]
    if pid == 'R21K-22':
        return [
            step('かける順番を入れかえる', 'かけ算はかける順番を入れかえても答えは同じです。2.3を前にそろえます。', '3.6×2.3＝2.3×3.6'),
            step('2.3でくくる', '共通の2.3をかっこの前に出します。', '2.3×6.4＋2.3×3.6＝2.3×(6.4＋3.6)'),
            step('かっこの中をたす', '6.4と3.6は合わせると10になります。', '6.4＋3.6＝10', ('6.4＋3.6はいくつですか。', 10)),
            step('10をかける', '10をかけると、小数点が1つ右に動きます。', '2.3×10＝23'),
            step('ひき算で確かめる', '答えから前半を引くと、後半に戻ります。', '23−2.3×6.4＝3.6×2.3')]
    if pid == 'R21K-52':
        return [
            step('かける順番を入れかえる', 'かけ算はかける順番を入れかえても答えは同じです。5.8を前にそろえます。', '6.2×5.8＝5.8×6.2'),
            step('5.8でくくる', '共通の5.8をかっこの前に出します。', '5.8×3.8＋5.8×6.2＝5.8×(3.8＋6.2)'),
            step('かっこの中をたす', '3.8と6.2は合わせると10になります。', '3.8＋6.2＝10', ('3.8＋6.2はいくつですか。', 10)),
            step('10をかける', '10をかけると、小数点が1つ右に動きます。', '5.8×10＝58'),
            step('ひき算で確かめる', '答えから前半を引くと、後半に戻ります。', '58−5.8×3.8＝6.2×5.8')]
    raise KeyError(pid)

SERIES = {
    'R23K-60': [
        step('分数を2つの分数の差に分ける', '分母が「連続する2つの整数の積」の分数は、1/6＝1/(2×3)＝1/2−1/3 のように、差の形に書き直せます。', '1/6＝1/2−1/3',
             ('1/2−1/3を計算すると、分母6の分数の分子はいくつになりますか。', 1)),
        step('ほかの項も同じように分ける', '12＝3×4、20＝4×5、30＝5×6、42＝6×7、56＝7×8 なので、すべて差の形にできます。',
             '1/6＋1/12＋1/20＋1/30＋1/42＋1/56＝(1/2−1/3)＋(1/3−1/4)＋(1/4−1/5)＋(1/5−1/6)＋(1/6−1/7)＋(1/7−1/8)'),
        step('となり合う分数が消える', '＋1/3と−1/3、＋1/4と−1/4、…がたがいに消えて、最初と最後だけが残ります。',
             '(1/2−1/3)＋(1/3−1/4)＋(1/4−1/5)＋(1/5−1/6)＋(1/6−1/7)＋(1/7−1/8)＝1/2−1/8'),
        step('通分する', '分母を8にそろえます。', '1/2−1/8＝4/8−1/8', ('1/2を分母8の分数にすると、分子はいくつですか。', 4)),
        step('分子を引く', '分母が同じなので、分子だけ引きます。', '4/8−1/8＝3/8'),
        step('たし算で確かめる', '答えに引いた1/8を足すと、1/2に戻ります。', '3/8＋1/8＝1/2')],
    'R23K-30': [
        step('分数を2つの分数の差に分ける', '分母が「連続する2つの整数の積」の分数は、1/2＝1/(1×2)＝1−1/2 のように、差の形に書き直せます。', '1/2＝1−1/2',
             ('1−1/2を計算すると、分母2の分数の分子はいくつになりますか。', 1)),
        step('ほかの項も同じように分ける', '6＝2×3、12＝3×4、20＝4×5、30＝5×6、42＝6×7 なので、すべて差の形にできます。',
             '1/2＋1/6＋1/12＋1/20＋1/30＋1/42＝(1−1/2)＋(1/2−1/3)＋(1/3−1/4)＋(1/4−1/5)＋(1/5−1/6)＋(1/6−1/7)'),
        step('となり合う分数が消える', '−1/2と＋1/2、−1/3と＋1/3、…がたがいに消えて、最初と最後だけが残ります。',
             '(1−1/2)＋(1/2−1/3)＋(1/3−1/4)＋(1/4−1/5)＋(1/5−1/6)＋(1/6−1/7)＝1−1/7'),
        step('通分する', '1を分母7の分数にします。', '1−1/7＝7/7−1/7', ('1を分母7の分数にすると、分子はいくつですか。', 7)),
        step('分子を引く', '分母が同じなので、分子だけ引きます。', '7/7−1/7＝6/7'),
        step('たし算で確かめる', '答えに引いた1/7を足すと、1に戻ります。', '6/7＋1/7＝1')],
}
MANUAL = {pid: (lambda p=pid: distrib_common(p)) for pid in ['R23K-17', 'R23K-47', 'R20K-19', 'R20K-49', 'R21K-22', 'R21K-52']}
MANUAL.update({pid: (lambda p=pid: SERIES[p]) for pid in SERIES})

# ---------- dispatch ----------
def is_decint(tok): return bool(re.fullmatch(r'\d+(\.\d+)?', tok))

def explain(pid, text, answer_text):
    ans = exact(re.sub(r'(\d+)と(\d+)/(\d+)', lambda m: f'{int(m[1])*int(m[3])+int(m[2])}/{m[3]}', answer_text))
    style = answer_style(answer_text); s = clean_text(text)
    if pid in MANUAL: return MANUAL[pid](), 'manual'
    terms = parse_terms(s)
    if len(terms) == 1:
        factors = terms[0][1]
        if re.fullmatch(r'\d+×\d+×3\.14×\d+/\d+', s): return t_sector(s, ans), 'sector'
        if len(factors) == 2 and all(is_decint(t) for _, t in factors):
            (_, a), (op, b) = factors
            if op == '×':
                if '.' not in a and '.' not in b and a.endswith('0') and b.endswith('0'): return t_zeros(a, b, ans, style), 'zeros'
                return t_dec_mul(a, b, ans, style), 'dec_mul'
            if '.' in a or '.' in b: return t_dec_div(a, b, ans, style), 'dec_div'
            return t_int_div(a, b, ans, style), 'int_div'
        return t_chain(factors, ans, style), 'chain'
    if re.fullmatch(r'\d+×\d+×3\.14×\d+/\d+−\d+×\d+×3\.14×\d+/\d+', s): return t_sector_diff(s, ans), 'sector_diff'
    if len(terms) == 2 and all(len(f) == 1 for _, f in terms):
        a = terms[0][1][0][1]; b = terms[1][1][0][1]; op = terms[1][0]
        if is_decint(a) and is_decint(b): return t_dec_addsub(a, b, op, ans, style), 'dec_addsub'
        if op == '−' and re.fullmatch(r'\d+', a) and re.fullmatch(r'\d+と\d+/\d+', b): return t_borrow(a, b, ans, style), 'borrow'
        return t_frac_addsub(a, b, op, ans, style), 'frac_addsub'
    if len(terms) == 2: return t_mixed_ops(terms, ans, style), 'mixed_ops'
    raise ValueError('No template for ' + pid + ' ' + text)

# ---------- build ----------
def build():
    problems = []; units = []; kinds = {}
    order = sorted(EVIDENCE, key=lambda e: (int(re.match(r'R(\d+)K-(\d+)', e['id']).group(1)), int(re.match(r'R(\d+)K-(\d+)', e['id']).group(2))))
    for ev in order:
        pid = ev['id']; r, n = map(int, re.match(r'R(\d+)K-(\d+)', pid).groups())
        ex = EXPR[pid]; text = ev['problemText']
        expression = ex['expr']; actual = exact(expression)
        notion_answer = exact(re.sub(r'(\d+)と(\d+)/(\d+)', lambda m: f'{int(m[1])*int(m[3])+int(m[2])}/{m[3]}', ev['answerText']))
        assert actual == notion_answer, (pid, actual, notion_answer)
        assert normalize(clean_text(text)) == normalize(clean_text(ex['localText'])), (pid, text, ex['localText'])
        steps, kind = explain(pid, text, ev['answerText']); kinds[pid] = kind
        assert 4 <= len(steps) <= 8, (pid, kind, len(steps))
        assert any(s.get('checkpoint') for s in steps), (pid, kind)
        for i, s in enumerate(steps): s['id'] = f'step-{i+1}'
        uid = f'calc.r{r}.k{n}'; page_id = ev['url'].rsplit('/', 1)[-1]
        problems.append({
            'id': pid, 'unitId': uid, 'category': 'calc', 'text': text, 'sourceText': text,
            'source': {'title': f'R{r} 計算マスター K-{n}', 'path': ev['url'], 'url': ev['url'],
                       'locator': f'Notion 問題DB > {pid} > 問題/答えブロック', 'sourceText': text, 'sourceAnswer': ev['answerText'],
                       'notionPageId': page_id, 'notionProperties': ev['properties'], 'notionVerification': ev['verification'],
                       'notionLastEditedAt': ev['page_last_edited_at'],
                       'localReferencePath': LOCAL_PATH, 'localReferenceLocator': f'R{r} > K 計算マスター > K-{n}', 'localReferenceText': ex['localText'],
                       'localComparison': {'exactTextMatch': text == ex['localText'], 'normalizedExpressionMatch': True,
                                           'difference': '完全一致' if text == ex['localText'] else '全角・半角の演算子や「＝□」の有無だけが異なる。数値・演算・正答は一致。'},
                       'verification': '2026-10-13 Notion問題DBのスキーマ取得→SQLで計算マスターのIDを確認→ページ本文をfetchして問題/答えブロックと属性を取得。URLとIDの組をSQLで再照合。Dropbox本文（照合用）と問題文・答えが一致。独立Fraction検算とcore.calcScore/core.gradeで照合。Notion native verificationはunverified。原教材PDFの再照合は未実施。',
                       'pairId': f'R{r}K-{n+30 if n <= 30 else n-30}'},
            'answer': spec(actual), 'figureRequired': False, 'scopeUnits': [f'R{r}'], 'homeStudy': False, 'revision': 1,
            'expression': expression, 'explanation': {'steps': steps}})
        units.append({'id': uid, 'name': f'R{r}計算 K-{n}', 'domain': 'calculation',
                      'definition': '原資料の計算1問を独立した出題単位として保持する。型で集約しない。', 'representativeId': pid,
                      'decision': '計算は原式単位で採用。表裏の実在する数値替えも独立問題として保持。', 'prerequisites': []})
    scoring = subprocess.run(['node', '-e', "const C=require('./src/core.js');let b='';process.stdin.on('data',x=>b+=x);process.stdin.on('end',()=>console.log(JSON.stringify(JSON.parse(b).map(p=>({id:p.id,...C.calcScore(p.expression)})))));"],
                             input=json.dumps(problems), text=True, capture_output=True, cwd=ROOT, check=True)
    scores = {s['id']: s for s in json.loads(scoring.stdout)}
    for p in problems:
        sc = scores[p['id']]; assert sc['supported']; assert sc['answer'] == {'n': p['answer']['n'], 'd': p['answer']['d']}
        p['score'] = sc['score']; p['star'] = sc['star']; p['difficulty'] = {1: 2, 2: 5, 3: 7}[p['star']]
    analyses = [
        {'kind': 'selection', 'detail': 'Notion問題DB（区分＝計算マスター・5年授業・5年後期）のR20〜R23から、問題文が1つの数式で、現在のparserが評価できる計算を選定。重複する式（R23K-40＝R22K-12）と、すでにアプリにある問題は除いた。難易度の帯はcalcScoreの算出値（★1〜3）のまま。'},
        {'kind': 'excluded', 'detail': '分数↔小数の変換、逆算（□を求める）、比、角度・図形、単位換算、等差数列、一の位などは、数式として評価できないため今回は除外。勝手な改題はしない。'},
        {'kind': 'limit', 'detail': 'difficultyはUIの帯用に★1→2/★2→5/★3→7と写像した暫定値で、Notionの基礎難度の検証値ではない。'},
        {'kind': 'explanation', 'detail': '解き筋は種類ごとのテンプレート（小数の乗除・加減、帯分数の引き算、通分、約分のかけ算、円の一部、くくり出し、部分分数）で作り、各ステップの等式をFractionで検算した。児童での難度・理解度の検証は未実施。'}]
    out = {'problems': problems, 'units': units, 'links': [], 'analysis': analyses}
    (ROOT/'content/selected-calc-2.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return out, kinds

def report(out, kinds):
    from collections import Counter
    stars = Counter(p['star'] for p in out['problems']); byk = Counter(kinds.values())
    lines = ['# 計算問題の追加（Notion 計算マスター R20〜R23）', '',
             f'Notion問題DB `collection://531d42cc-9767-4652-ac87-5fd5cef74df7` の「計算マスター」から{len(out["problems"])}問を追加。',
             f'★1（標準）{stars[1]}問・★2（応用）{stars[2]}問・★3（難問）{stars[3]}問。',
             '', '## 解き筋の種類', '', '|種類|問題数|', '|---|---:|']
    lines += [f'|{k}|{v}|' for k, v in sorted(byk.items())]
    lines += ['', '## 一覧', '', '|ID|問題|答え|S/★|', '|---|---|---|---|']
    for p in out['problems']:
        lines.append(f'|[{p["id"]}]({p["source"]["url"]})|{p["text"]}|{p["source"]["sourceAnswer"]}|{p["score"]}/★{p["star"]}|')
    lines += ['', '## 検算と限界', '',
              '- 問題文・答え・URLはNotionの各ページ本文から取得（`references/calc-extra-notion-evidence.json`）。URLとIDの組はSQLで再照合済み。',
              '- Dropbox本文（照合用）と問題文・答えは全問一致。式は`references/calc-extra-expressions.json`。',
              '- 答え、式、解き筋の全ステップの等式をFractionで厳密に検算し、core.calcScore・core.gradeとも照合した。',
              '- Notion native verificationはunverified。原教材PDFとの再照合、児童での難度校正は未実施。',
              '- 分数↔小数の変換・逆算・比・角度など数式で評価できない計算は含めていない。', '']
    (ROOT/'reports/calc-extra-selection.md').write_text('\n'.join(lines), encoding='utf-8')

if __name__ == '__main__':
    out, kinds = build(); report(out, kinds)
    from collections import Counter
    print(json.dumps({'problems': len(out['problems']), 'stars': dict(Counter(p['star'] for p in out['problems'])), 'kinds': dict(Counter(kinds.values()))}, ensure_ascii=False))
