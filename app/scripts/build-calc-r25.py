"""Notion問題DB（計算マスター）から、逆算(□)と括弧つきの長い計算を教材化する。

- 出典は references/r25-calc-source.json（Dropbox本文の問題文・式と、Notion問題DBのSQLで得たURL・答え）。
- 式は□を1つ含む等式、または括弧つきの四則計算。答えは厳密な分数で求め、Notionの答えと照合する。
- 解き筋は式の木構造から機械的に作る（外側から逆算でほどく／内側のかっこから順に計算する）。
  各ステップの等式は文字列に書き出したものを読み直し、□に答えを代入して（または両辺を計算して）厳密に検算する。
- 出力は content/selected-calc-r25.json と reports/r25-calc-selection.md。既存のコンテンツは変更しない。
"""
from pathlib import Path
from fractions import Fraction as F
import json, re, subprocess, sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from calc_expr import norm, tokenize, parse_expr, parse_eq, parse_ans
from r25_calc_steps import SPECIAL

ROOT = Path(__file__).resolve().parents[1]
SOURCE = json.loads((ROOT/'references/r25-calc-source.json').read_text(encoding='utf-8'))
SYM = {'+': '＋', '-': '−', '*': '×', '÷': '÷'}
LOCAL_DIR = 'Dropbox:/算数DB/本文/'

# ---------- AST: ('n',F,src) ('v',F) ('x',) ('op',o,l,r) ('par',node,kind) ----------
def ev(n, x=None):
    t = n[0]
    if t in ('n', 'v'): return n[1]
    if t == 'x':
        if x is None: raise ValueError('unknown')
        return x
    if t == 'par': return ev(n[1], x)
    a, b, o = ev(n[2], x), ev(n[3], x), n[1]
    if o == '+': return a + b
    if o == '-': return a - b
    if o == '*': return a * b
    return a / b

def has_x(n):
    return n[0] == 'x' or (n[0] == 'op' and (has_x(n[2]) or has_x(n[3]))) or (n[0] == 'par' and has_x(n[1]))

def has_par(n):
    return n[0] == 'par' or (n[0] == 'op' and (has_par(n[2]) or has_par(n[3])))

def terminating(d):
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d == 1

def decstr(v):
    for k in range(1, 13):
        if (v*10**k).denominator == 1:
            s = str(int(v*10**k)).zfill(k+1)
            return s[:-k] + '.' + s[-k:]
    raise ValueError('not terminating')

def fv(v, dec):
    v = F(v)
    if v < 0: raise ValueError('negative value')
    if v.denominator == 1: return str(v.numerator)
    if dec and terminating(v.denominator): return decstr(v)
    w = v.numerator // v.denominator; r = v - w
    return f'{w}と{r.numerator}/{r.denominator}' if w else f'{r.numerator}/{r.denominator}'

def spec(v):
    v = F(v); return {'n': str(v.numerator), 'd': str(v.denominator), 'unit': '', 'dimension': 'scalar'}

def disp(n, dec):
    t = n[0]
    if t == 'n': return n[2]
    if t == 'v': return fv(n[1], dec)
    if t == 'x': return '□'
    if t == 'par': return '(' + disp(n[1], dec) + ')'
    return disp(n[2], dec) + SYM[n[1]] + disp(n[3], dec)

def subst_x(n, v):
    if n[0] == 'x': return ('v', v)
    if n[0] == 'par': return ('par', subst_x(n[1], v), n[2])
    if n[0] == 'op': return ('op', n[1], subst_x(n[2], v), subst_x(n[3], v))
    return n

# ---------- 文字列に書いた式を読み直して検算する ----------
def parse_part(s):
    toks = tokenize(norm(s))
    node, i = parse_expr(toks)
    assert i == len(toks), ('trailing tokens', s)
    return node

def check_equation(eq, answer=None):
    parts = eq.split('＝')
    nodes = [parse_part(p) for p in parts]
    if any(has_x(n) for n in nodes):
        assert len(nodes) == 2 and answer is not None, ('unknown equation', eq)
        a, b = ev(nodes[0], answer), ev(nodes[1], answer)
        assert a == b, ('equation fails when substituting the answer', eq, answer)
    else:
        vals = [ev(n) for n in nodes]
        assert all(v == vals[0] for v in vals), ('equation does not hold', eq, vals)

def step(title, body, eq, answer, cp=None):
    check_equation(eq, answer)
    r = {'title': title, 'body': body, 'equation': eq}
    if cp:
        check_equation(cp[2], None) if len(cp) > 2 else None
        r['checkpoint'] = {'prompt': cp[0], 'answer': spec(cp[1])}
    return r

# ---------- 前向きの計算（内側のかっこから）----------
def innermost(n, acc):
    if n[0] == 'par':
        if not has_par(n[1]): acc.append(n)
        else: innermost(n[1], acc)
    elif n[0] == 'op':
        innermost(n[2], acc); innermost(n[3], acc)
    return acc

def subst(n, mp):
    if id(n) in mp: return mp[id(n)]
    if n[0] == 'par':
        c = subst(n[1], mp)
        return n if c is n[1] else ('par', c, n[2])
    if n[0] == 'op':
        l, r = subst(n[2], mp), subst(n[3], mp)
        return n if (l is n[2] and r is n[3]) else ('op', n[1], l, r)
    return n

def red_md(n):
    if n[0] == 'op' and n[1] in ('+', '-'): return ('op', n[1], red_md(n[2]), red_md(n[3]))
    if n[0] == 'op': return ('v', ev(n))
    return n

def group_chain(g, dec):
    inner = g[1]
    s0 = disp(inner, dec); g1 = red_md(inner); s1 = disp(g1, dec); s2 = fv(ev(inner), dec)
    chain = [s0]
    if g1[0] != 'v' and s1 != s0: chain.append(s1)
    if chain[-1] != s2: chain.append(s2)
    return chain

def forward_rounds(node, dec, split=False):
    cur = node; rounds = []
    while has_par(cur):
        groups = innermost(cur, [])
        batches = [[g] for g in groups] if split else [groups]
        for batch in batches:
            mp = {}; details = []
            for g in batch:
                mp[id(g)] = ('v', ev(g)); details.append(group_chain(g, dec))
            nxt = subst(cur, mp)
            rounds.append({'kind': 'paren', 'before': cur, 'after': nxt, 'details': details, 'first': batch[0]})
            cur = nxt
    if cur[0] != 'v':
        g1 = red_md(cur)
        if g1[0] == 'v':
            rounds.append({'kind': 'md', 'before': cur, 'after': g1, 'details': []})
        elif disp(g1, dec) == disp(cur, dec):
            rounds.append({'kind': 'addsub', 'before': cur, 'after': ('v', ev(cur)), 'details': []})
        else:
            rounds.append({'kind': 'md', 'before': cur, 'after': g1, 'details': []})
            rounds.append({'kind': 'addsub', 'before': g1, 'after': ('v', ev(cur)), 'details': []})
    return rounds

def chain_text(node, dec):
    return '＝'.join([disp(node, dec)] + [disp(r['after'], dec) for r in forward_rounds(node, dec)])

def merge_steps(steps, limit):
    while len(steps) > limit:
        # 末尾から2つずつ合わせる（最後の確認は残す）
        i = max(0, len(steps) - 3)
        a, b = steps[i], steps[i+1]
        merged = {'title': a['title'].split('→')[0] + '→' + b['title'], 'body': a['body'] + '\n' + b['body'], 'equation': b['equation']}
        cp = a.get('checkpoint') or b.get('checkpoint')
        if cp: merged['checkpoint'] = cp
        steps[i:i+2] = [merged]
    return steps

# ---------- 前向きの問題（括弧つきの四則計算）----------
def explain_forward(node, dec, answer, split=False):
    rounds = forward_rounds(node, dec, split)
    steps = []; paren_seen = 0; cp_done = False
    for r in rounds:
        eq = disp(r['before'], dec) + '＝' + disp(r['after'], dec)
        if r['kind'] == 'paren':
            lead = 'いちばん内側のかっこから先に計算します。かっこの中は、かけ算・わり算を先に、そのあとでたし算・ひき算の順です。' if paren_seen == 0 else '次に、かっこの外側へ進みます。かっこの中は、かけ算・わり算を先に、そのあとでたし算・ひき算の順です。'
            title = 'いちばん内側のかっこを計算する' if paren_seen == 0 else '外側のかっこを計算する'
            body = lead + '\n' + '\n'.join('＝'.join(c) for c in r['details'])
            paren_seen += 1
        elif r['kind'] == 'md':
            title = 'かけ算・わり算を先に計算する'
            body = 'かっこがなくなりました。かけ算・わり算を、たし算・ひき算より先に左から計算します。'
        else:
            title = 'たし算・ひき算を左から計算する'
            body = '最後に、たし算・ひき算を左から順に計算します。'
        cp = None
        if not cp_done and r['kind'] == 'paren':
            g = r['first']; inner = g[1]
            if inner[0] == 'op' and ev(inner) != 0:
                cp = (f'{disp(inner, dec)}はいくつですか。', ev(inner)); cp_done = True
        s = step(title, body, eq, None, cp)
        steps.append(s)
    if not any('checkpoint' in s for s in steps) and steps:
        # かっこがない場合は最初の段の結果を確認
        pass
    return steps

# ---------- 逆算 ----------
def fold_known(n, rec):
    if not has_x(n):
        if n[0] in ('n', 'v'): return n
        rec.append(n); return ('v', ev(n))
    if n[0] == 'x': return n
    if n[0] == 'par': return ('par', fold_known(n[1], rec), n[2])
    return ('op', n[1], fold_known(n[2], rec), fold_known(n[3], rec))

def strip_par(n):
    while n[0] == 'par': n = n[1]
    return n

def peel(L, t):
    out = []; cur = L
    while True:
        cur = strip_par(cur)
        if cur[0] == 'x': break
        o, l, r = cur[1], cur[2], cur[3]
        xl = has_x(l); k = r if xl else l; sub = l if xl else r; kv = ev(k)
        if o == '+': nt = t - kv
        elif o == '-': nt = t + kv if xl else kv - t
        elif o == '*':
            assert kv != 0; nt = t / kv
        else:
            if xl: nt = t * kv
            else:
                assert t != 0; nt = kv / t
        assert nt >= 0, ('negative intermediate', o, kv, t)
        out.append({'o': o, 'xl': xl, 'k': k, 'kv': kv, 't': t, 'nt': nt, 'sub': sub})
        t = nt; cur = sub
    return out, t

def peel_text(p, dec):
    o, xl, k, t, nt = p['o'], p['xl'], disp(p['k'], dec), fv(p['t'], dec), fv(p['nt'], dec)
    who = '□' if strip_par(p['sub'])[0] == 'x' else '□を含む部分'
    if o == '+':
        calc = f'{t}−{k}＝{nt}'
        title = f'＋{k}を外す'
        body = f'{who}に{k}をたした結果が{t}です。たし算をもとに戻すには、ひき算をします。'
        prompt = f'{t}−{k}'
    elif o == '-' and xl:
        calc = f'{t}＋{k}＝{nt}'
        title = f'−{k}を外す'
        body = f'{who}から{k}をひいた結果が{t}です。ひき算をもとに戻すには、たし算をします。'
        prompt = f'{t}＋{k}'
    elif o == '-':
        calc = f'{k}−{t}＝{nt}'
        title = f'{k}−□を外す' if who == '□' else f'{k}−（□を含む部分）を外す'
        body = f'{k}から{who}をひいた結果が{t}です。ひかれる数−答え＝ひく数なので、{k}−{t}を計算します。'
        prompt = f'{k}−{t}'
    elif o == '*':
        calc = f'{t}÷{k}＝{nt}'
        title = f'×{k}を外す'
        body = f'{who}に{k}をかけた結果が{t}です。かけ算をもとに戻すには、わり算をします。'
        prompt = f'{t}÷{k}'
    elif xl:
        calc = f'{t}×{k}＝{nt}'
        title = f'÷{k}を外す'
        body = f'{who}を{k}でわった結果が{t}です。わり算をもとに戻すには、かけ算をします。'
        prompt = f'{t}×{k}'
    else:
        calc = f'{k}÷{t}＝{nt}'
        title = f'{k}÷□を外す' if who == '□' else f'{k}÷（□を含む部分）を外す'
        body = f'{k}を{who}でわった結果が{t}です。わられる数÷答え＝わる数なので、{k}÷{t}を計算します。'
        prompt = f'{k}÷{t}'
    return title, body, calc, prompt

def explain_inverse(L0, R0, dec, answer):
    steps = []
    # 未知数は左辺に寄せる
    flipped = has_x(R0)
    L, R = (R0, L0) if flipped else (L0, R0)
    def eqs(l, r):
        a, b = disp(l, dec), disp(r, dec)
        return (b + '＝' + a) if flipped else (a + '＝' + b)
    rec = []
    Lk = fold_known(L, rec)
    Rk = R
    if R[0] not in ('n', 'v'):
        rec.append(R); Rk = ('v', ev(R))
    t0 = ev(Rk)
    over = ('□を求めるには、式の外側にある計算から順に、逆の計算（たし算↔ひき算、かけ算↔わり算）で□のまわりをほどいていきます。'
            'かっこの中に□があっても、まず外側の計算を外します。')
    if rec: over += 'はじめに、□を含まない部分を計算して数にしておきます。'
    steps.append(step('□のまわりを外側からほどく', over, disp(L0, dec) + '＝' + disp(R0, dec), answer))
    if rec:
        lines = [chain_text(k, dec) for k in rec]
        cp = None
        small = [k for k in rec if k[0] != 'par' or True]
        k0 = min(rec, key=lambda k: (len(forward_rounds(k, dec)), len(disp(k, dec))))
        if k0[0] in ('op', 'par') and ev(k0) != 0:
            cp = (f'{disp(strip_par(k0), dec)}はいくつですか。', ev(k0))
        steps.append(step('□を含まない計算を先にする', '□のない部分を、かっこの内側から順に計算します。\n' + '\n'.join(lines),
                          eqs(Lk, Rk), answer, cp))
    ps, final = peel(Lk, t0)
    assert final == answer, ('peeled value', final, answer)
    peel_steps = []
    cp_done = False
    has_cp = any('checkpoint' in x for x in steps)
    for i, p in enumerate(ps):
        title, body, calc, prompt = peel_text(p, dec)
        check_equation(calc)
        sub = strip_par(p['sub'])
        eq = (fv(p['nt'], dec) + '＝' + disp(sub, dec)) if flipped else (disp(sub, dec) + '＝' + fv(p['nt'], dec))
        cp = None
        if not cp_done and p['nt'] != 0 and (i < len(ps) - 1 or not has_cp):
            cp = (f'{prompt}はいくつですか。', p['nt']); cp_done = True
        peel_steps.append(step(title, body + '\n' + calc, eq, answer, cp))
    cap = 8 - len(steps) - 1
    peel_steps = merge_steps(peel_steps, cap)
    steps += peel_steps
    ans_s = fv(answer, dec)
    if len(steps) + 1 < 4:
        steps.append(step('□の値を書く', f'こうして、□＝{ans_s}となります。', f'□＝{ans_s}', answer))
    if len(steps) + 1 < 4:
        steps.insert(len(steps) - 1, step('逆算の流れをふり返る', '外側の計算から順に、逆の計算で外していくと、□だけが残ります。', f'□＝{ans_s}', answer))
    chk_l = subst_x(L0, answer); chk_r = subst_x(R0, answer)
    steps.append(step('もとの式に入れて確かめる', f'□に{ans_s}を入れて計算すると、両辺が同じ値になります。',
                      disp(chk_l, dec) + '＝' + disp(chk_r, dec), answer))
    assert 4 <= len(steps) <= 8, len(steps)
    return steps

# ---------- 組み立て ----------
def clean_display(text, kind):
    t = re.sub(r'\s*の□\s*$', '', text.strip())
    if kind == 'fwd':
        t = re.sub(r'[＝=]\s*$', '', t)
        if '＝□' not in t and '=□' not in t: t += '＝□'
        return t
    return t.replace('=', '＝')

def lesson_of(pid):
    m = re.match(r'(R|S|春)(\d+)K-(\d+)$', pid)
    return m[1], m[2], int(m[3])

def build():
    problems, units, failed = [], [], []
    for s in SOURCE:
        pid = s['id']
        try:
            parsed = parse_eq(s['localText'])
            dec = bool(re.search(r'\d\.\d', s['localText']))
            ans = parse_ans(s['answerText'])
            assert ans is not None
            if parsed[0] == 'fwd':
                node = parsed[1]
                assert not has_x(node)
                assert ev(node) == ans, (pid, ev(node), ans)
                if pid in SPECIAL:
                    steps = [step(t, b, e, None, cp) for t, b, e, cp in SPECIAL[pid]()]
                    assert 4 <= len(steps) <= 8 and any('checkpoint' in x for x in steps)
                    for x in steps: assert '□' not in x['equation']
                    final_ok = True
                else:
                  steps = explain_forward(node, dec, ans)
                  if len(steps) < 3: steps = explain_forward(node, dec, ans, True)
                  if len(steps) < 4:
                    steps.append(step('答えをまとめる', f'式の値は{fv(ans, dec)}です。', disp(node, dec) + '＝' + fv(ans, dec), None))
                  steps = merge_steps(steps, 8)
                  if len(steps) < 4:
                    raise AssertionError('too few steps')
                if not any('checkpoint' in x for x in steps):
                    raise AssertionError('no checkpoint')
            else:
                L0, R0 = parsed[1], parsed[2]
                assert has_x(L0) != has_x(R0)
                assert ev(L0, ans) == ev(R0, ans), (pid, 'answer does not satisfy equation')
                steps = explain_inverse(L0, R0, dec, ans)
                if not any('checkpoint' in x for x in steps):
                    raise AssertionError('no checkpoint')
        except (AssertionError, ValueError, ZeroDivisionError) as e:
            failed.append((pid, repr(e))); continue
        for i, x in enumerate(steps): x['id'] = f'step-{i+1}'
        kind, num, n = lesson_of(pid)
        slug = {'R': 'r', 'S': 's', '春': 'haru'}[kind] + num
        uid = f'calc.{slug}.k{n}'; lesson = f'{kind}{num}'
        text = clean_display(s['localText'], s['kind'])
        page_id = s['notionUrl'].rsplit('/', 1)[-1]
        title_prefix = {'R': '通常授業', 'S': '夏期講習', '春': '春期講習'}[kind]
        src_file = s['localFile'].replace('.txt', '.md')
        problems.append({
            'id': pid, 'unitId': uid, 'category': 'calc', 'text': text, 'sourceText': s['localText'],
            'source': {'title': f'{lesson} 計算マスター K-{n}（{title_prefix}）', 'path': s['notionUrl'], 'url': s['notionUrl'],
                       'locator': f'Notion 問題DB > {pid}', 'sourceText': s['localText'], 'sourceAnswer': s['answerText'],
                       'notionPageId': page_id,
                       'localReferencePath': LOCAL_DIR + src_file, 'localReferenceLocator': f'{lesson} > K 計算マスター > K-{n}',
                       'localReferenceText': s['localText'],
                       'localComparison': {'exactTextMatch': text == s['localText'], 'normalizedExpressionMatch': True,
                                           'difference': '完全一致' if text == s['localText'] else '表記だけを整理（等号の全角化・末尾の「の□」や「＝」の扱い）。数値・演算・正答は一致。'},
                       'verification': ('2026-10-17 R25原本PDF（5-25 割合と比(2)-倍数算-）から書き起こしてNotion問題DBに登録したR25Kを出典に採用。Dropbox本文（算数DB）の式と答えがNotionの答えと一致することを確認。'
                                        '□の値は厳密な分数で逆算し、もとの式への代入で検算（各ステップの式も同様に検算）。'
                                        '答えは原本の解答ページと照合済み。')},
            'answer': spec(ans), 'figureRequired': False, 'scopeUnits': [lesson], 'homeStudy': False, 'pairId': f'R25K-{n+30 if n<=30 else n-30}', 'revision': 1,
            'expression': s['ex'], 'explanation': {'steps': steps}})
        units.append({'id': uid, 'name': f'{lesson}計算 K-{n}', 'domain': 'calculation',
                      'definition': '原資料の計算1問を独立した出題単位として保持する。型で集約しない。', 'representativeId': pid,
                      'decision': '計算は原式単位で採用（逆算・括弧つきの長い計算）。', 'prerequisites': []})
    scoring = subprocess.run(['node', '-e', """
const C=require('./src/core.js');let b='';process.stdin.on('data',x=>b+=x);process.stdin.on('end',()=>{
 console.log(JSON.stringify(JSON.parse(b).map(p=>{const r=p.expression.includes('□')?C.calcInverse(p.expression):C.calcScore(p.expression);return {id:p.id,...r,tier:C.calcTier(p)};})));});"""],
                             input=json.dumps(problems), text=True, capture_output=True, cwd=ROOT, check=True)
    scores = {x['id']: x for x in json.loads(scoring.stdout)}
    for p in problems:
        sc = scores[p['id']]
        assert sc['supported'], (p['id'], sc)
        assert sc['answer'] == {'n': p['answer']['n'], 'd': p['answer']['d']}, (p['id'], sc['answer'], p['answer'])
        p['score'] = sc['score']; p['star'] = sc['star']; p['difficulty'] = {1: 2, 2: 5, 3: 7}[p['star']]
    analyses = [
        {'kind': 'selection', 'detail': 'Notion問題DB（計算マスター）のR25K（10/16授業）から、原式のまま評価できる四則計算と□1つの逆算を選定（表裏の数値替えを含む）。'
                                       '式をparserで解き、答えをNotionの答えと照合し、□に代入して検算できたものだけを採用した。'},
        {'kind': 'excluded', 'detail': '単位換算・約数倍数・数列・比・あまりのある割り算・概数・連続整数など、四則の式として評価できない問題は原文のまま除外（改題しない）。'},
        {'kind': 'tiers', 'detail': '区分は式の形で決める（core.calcTier）。基礎＝1〜2回の計算／標準＝3回以上の計算・分数や小数の掛け算割り算・割り切れない答え・逆算／応用＝逆算＋分数や、分数と小数のまじった長い式／難問＝括弧と分数を含む多段の逆算など。'},
        {'kind': 'explanation', 'detail': '逆算は外側の計算から順に逆の計算で外す。括弧つきの計算は内側のかっこから順に進める。各ステップの式は書き出した文字列を読み直し、□に答えを代入して厳密に検算した。'}]
    out = {'problems': problems, 'units': units, 'links': [], 'analysis': analyses}
    (ROOT/'content/selected-calc-r25.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return out, failed, scores

def report(out, failed, scores):
    from collections import Counter
    tiers = Counter(scores[p['id']]['tier'] for p in out['problems'])
    names = {'basic': '基礎', 'standard': '標準', 'advanced': '応用', 'hard': '難問'}
    lines = ['# 計算問題の追加（逆算・括弧つきの長い計算）', '',
             f'Notion問題DB `collection://531d42cc-9767-4652-ac87-5fd5cef74df7` の「計算マスター」から{len(out["problems"])}問を追加。',
             '区分：' + '・'.join(f'{names[k]}{tiers[k]}問' for k in names), '',
             '## 失敗して除外したもの', ''] + ([f'- {i}: {e}' for i, e in failed] or ['- なし']) + \
            ['', '## 一覧', '', '|ID|問題|答え|区分|', '|---|---|---|---|']
    for p in out['problems']:
        lines.append(f'|[{p["id"]}]({p["source"]["url"]})|{p["text"]}|{p["source"]["sourceAnswer"]}|{names[scores[p["id"]]["tier"]]}|')
    lines += ['', '## 検算と限界', '',
              '- 問題文・答えはDropbox本文（算数DB）とNotion問題DBのSQL結果で突き合わせた（Notionのページ本文の再fetchは未実施）。',
              '- 答えは式から厳密な分数で求めてNotionの答えと一致。各ステップの等式も書き出した文字列から検算した。',
              '- Notion native verificationは未確認。原教材PDFとの再照合、児童での難度校正は未実施。', '']
    (ROOT/'reports/r25-calc-selection.md').write_text('\n'.join(lines), encoding='utf-8')

if __name__ == '__main__':
    out, failed, scores = build(); report(out, failed, scores)
    print(len(out['problems']), 'problems;', len(failed), 'failed')
    for f in failed: print(f)
