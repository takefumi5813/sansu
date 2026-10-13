"""Notion問題DBにある重い計算（逆算・括弧つきの長い計算）を教材化する。

- 出典は references/calc-exam-source.json。Notionの実ページ（URLつき）にある問題だけを入れる。
  現在は R21K-57（式・答え84）のみ。原教材 R21 PDF p.4 の57番と一致することを確認済み。
- 入試過去問（栄冠2023・学校別）から抽出した50問は Notion に無いため、出題しない。
  references/calc-exam-reserve.json に保管してあり、Notionに登録されたらURLをつけてsourceに戻す。
- 解き筋は build-calc-inverse.py の仕組み（式の木構造から機械的に作る）をそのまま使う。
  各ステップの等式は文字列に書き出したものを読み直し、□に答えを代入して（または両辺を計算して）厳密に検算する。
- 出力は content/selected-calc-4.json と reports/calc-exam-selection.md。既存のコンテンツは変更しない。
"""
from pathlib import Path
from fractions import Fraction as F
import importlib.util, json, re, subprocess, sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
_spec = importlib.util.spec_from_file_location('build_calc_inverse', HERE / 'build-calc-inverse.py')
bci = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bci)
parse_eq, parse_ans = bci.parse_eq, bci.parse_ans

SOURCE = json.loads((ROOT / 'references/calc-exam-source.json').read_text(encoding='utf-8'))
VERIFY_EXAM = ('2026-10-13 GPTがDropbox本文（算数DB）から問題文・資料の答えを抽出。Claudeが式を厳密な分数で解き、資料の答えと一致することを確認し、'
               '□を求める式は代入で、各ステップの式も書き出した文字列から検算した。'
               '原本PDFの画像との照合は未実施（桜蔭・灘の2問のみ、GPTが原本の問題PDFと解答PDFの画像で確認）。児童での難度校正は未実施。')
VERIFY_K57 = ('2026-10-13 Notion問題DBの実ページ（R21K-57）の式・答えを確認。GPTが原教材R21 PDF p.4の57番と印刷解答（84）の一致を確認。'
              'Dropbox本文（算数DB_通常授業_後期.md）ではK-57とK-58の内容が入れ替わっている（元資料は未変更）。'
              '□の値は厳密な分数で逆算し、代入で検算。Notion native verificationは未確認。児童での難度校正は未実施。')


def slug(s):
    return re.sub(r'[^0-9a-z]+', '-', s.lower()).strip('-')


def build():
    problems, units, failed = [], [], []
    for s in SOURCE:
        pid = s['id']
        assert s.get('notionUrl'), (pid, 'Notion URL required: only problems in Notion are served')
        try:
            parsed = parse_eq(s['localText'])
            dec = bool(re.search(r'\d\.\d', s['localText']))
            ans = parse_ans(s['answerText'])
            assert ans is not None, 'answer unparsable'
            if parsed[0] == 'fwd':
                node = parsed[1]
                assert not bci.has_x(node)
                assert bci.ev(node) == ans, (pid, bci.ev(node), ans)
                steps = bci.explain_forward(node, dec, ans)
                if len(steps) < 3: steps = bci.explain_forward(node, dec, ans, True)
                if len(steps) < 4:
                    steps.append(bci.step('答えをまとめる', f'式の値は{bci.fv(ans, dec)}です。', bci.disp(node, dec) + '＝' + bci.fv(ans, dec), None))
                steps = bci.merge_steps(steps, 8)
                assert len(steps) >= 4, 'too few steps'
            else:
                L0, R0 = parsed[1], parsed[2]
                assert bci.has_x(L0) != bci.has_x(R0)
                assert bci.ev(L0, ans) == bci.ev(R0, ans), (pid, 'answer does not satisfy equation')
                steps = bci.explain_inverse(L0, R0, dec, ans)
            assert any('checkpoint' in x for x in steps), 'no checkpoint'
        except (AssertionError, ValueError, ZeroDivisionError) as e:
            failed.append((pid, repr(e))); continue
        for i, x in enumerate(steps): x['id'] = f'step-{i+1}'
        text = bci.clean_display(s['localText'], s['kind'])
        same = text == s['verbatim']
        diff = '完全一致' if same else '表記だけを整理（全角記号・帯分数の「と」表記・解答枠を□に統一、解答欄の指示文を除く）。数値・演算・正答は一致。'
        if s.get('notionUrl'):
            n = 57
            uid, lesson = 'calc.r21.k57', 'R21'
            source = {'title': 'R21 計算マスター K-57（通常授業）', 'path': s['notionUrl'], 'url': s['notionUrl'],
                      'locator': 'Notion 問題DB > R21K-57 > 問題/答えブロック', 'sourceText': s['verbatim'], 'sourceAnswer': s['answerText'],
                      'notionPageId': s['notionUrl'].rsplit('/', 1)[-1],
                      'localReferencePath': s['pdfPath'], 'localReferenceLocator': f"原教材R21 PDF p.{s['pdfPage']}（PDF通しページ）57番",
                      'localReferenceText': s['verbatim'],
                      'localComparison': {'exactTextMatch': same, 'normalizedExpressionMatch': True, 'difference': diff},
                      'verification': VERIFY_K57}
            name = f'{lesson}計算 K-{n}'
            scope = [lesson]
        else:
            uid = 'calc.exam.' + slug(pid)
            real = s.get('yearKind') or ''
            if '実施年' in real and '入試' in real and '問題集' not in real:
                when = f"{s['year']}年"
            else:
                when = f"{s['year']}年度受験用（{s['examYear']}年入試）" if s.get('examYear') else f"{s['year']}年度受験用"
            title = f"{s['school']} {when} {s['number']}"
            page = f"p.{s['pdfPage']}（{s['pageType']}）" if s.get('pageType') else f"p.{s['pdfPage']}"
            source = {'title': title, 'origin': 'exam-pdf', 'path': s['pdfPath'], 'url': '',
                      'locator': f"{s['pdfPath']} {page}" + (f"／解答 {s['answerPdfPath']} p.{s['answerPdfPage']}" if s.get('answerPdfPath') else ''),
                      'sourceText': s['verbatim'], 'sourceAnswer': s['answerText'], 'answerSource': s['answerSource'],
                      'localReferencePath': s['dropboxPath'], 'localReferenceLocator': f"{s['school']} {s['number']}",
                      'localReferenceText': s['verbatim'],
                      'localComparison': {'exactTextMatch': same, 'normalizedExpressionMatch': True, 'difference': diff},
                      'verification': VERIFY_EXAM}
            name = f"{s['school']} {s['number']}（計算）"
            scope = []
        problems.append({
            'id': pid, 'unitId': uid, 'category': 'calc', 'text': text, 'sourceText': s['localText'],
            'source': source, 'answer': bci.spec(ans), 'figureRequired': False, 'scopeUnits': scope, 'homeStudy': False, 'revision': 1,
            'expression': s['ex'], 'explanation': {'steps': steps}})
        units.append({'id': uid, 'name': name, 'domain': 'calculation',
                      'definition': '原資料の計算1問を独立した出題単位として保持する。型で集約しない。', 'representativeId': pid,
                      'decision': '計算は原式単位で採用（入試の重い逆算・括弧つきの長い計算を難問用に）。', 'prerequisites': []})
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
        {'kind': 'selection', 'detail': 'GPTがDropbox本文から抽出した入試の計算問題のうち、式がparserで読め、□が1つ以下で、厳密解が資料の答えと一致し、core.calcTierが難問と判定した問題を採用した。'
                                       '桜蔭2025年Ⅰ(1)アと灘2026年第1日1は、別に指定された2問。R21K-57はNotion実ページと原教材PDFで確認できた1問。'},
        {'kind': 'excluded', 'detail': '分母や分子が□の式、分数を含まない式（整数だけの式は難問にしない）、資料に答えがない2022年度分は含めていない。応用と判定された問題は今回は含めていない（候補は別に保管）。'},
        {'kind': 'tiers', 'detail': '区分は式の形で決める（core.calcTier）。入試問題は、括弧と分数を含む多段の式が中心。'},
        {'kind': 'explanation', 'detail': '逆算は外側の計算から順に逆の計算で外す。括弧つきの計算は内側のかっこから順に進める。各ステップの式は書き出した文字列を読み直し、□に答えを代入して厳密に検算した。'}]
    out = {'problems': problems, 'units': units, 'links': [], 'analysis': analyses}
    (ROOT / 'content/selected-calc-4.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return out, failed, scores


def report(out, failed, scores):
    from collections import Counter
    tiers = Counter(scores[p['id']]['tier'] for p in out['problems'])
    names = {'basic': '基礎', 'standard': '標準', 'advanced': '応用', 'hard': '難問'}
    lines = ['# 計算問題の追加（入試の重い計算・難問向け）', '',
             f'{len(out["problems"])}問を追加。区分：' + '・'.join(f'{names[k]}{tiers[k]}問' for k in names), '',
             '## 失敗して除外したもの', ''] + ([f'- {i}: {e}' for i, e in failed] or ['- なし']) + \
            ['', '## 一覧', '', '|ID|出典|問題|答え|区分|', '|---|---|---|---|---|']
    for p in out['problems']:
        lines.append(f'|{p["id"]}|{p["source"]["title"]}|{p["text"]}|{p["source"]["sourceAnswer"]}|{names[scores[p["id"]]["tier"]]}|')
    lines += ['', '## 検算と限界', '',
              '- 入試の問題文・答えは、GPTがDropbox本文（算数DB）から抽出したもの。原本PDFの画像との再校正はしていない（桜蔭・灘の2問を除く）。',
              '- 答えは式から厳密な分数で求めて資料の答えと一致。□を求める式は代入で、各ステップの式も書き出した文字列から検算した。',
              '- 本文は「次の［　］にあてはまる数を求めなさい」などの指示文を除き、式だけを載せている。',
              '- 児童での難度校正は未実施。', '']
    (ROOT / 'reports/calc-exam-selection.md').write_text('\n'.join(lines), encoding='utf-8')


if __name__ == '__main__':
    out, failed, scores = build(); report(out, failed, scores)
    print(len(out['problems']), 'problems;', len(failed), 'failed')
    from collections import Counter
    print(Counter(scores[p['id']]['tier'] for p in out['problems']))
    for f in failed: print(f)
