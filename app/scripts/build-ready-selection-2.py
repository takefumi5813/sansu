"""Build expedition-ready-2.json from authored + independently verified candidate rows.

Inputs (outside the repo build):
  work/authored/batch-*.json   authored rows (status ready/hold, text, answer, steps, checkpoint)
  work/verified/batch-*.json   blind re-solve results ({id, verdict: "pass"|"fail", ...})
Outputs:
  app/content/expedition-ready-2.json      problems served in the normal free expedition
  app/content/expedition-prepared-hold.json authored rows that are not yet servable (figure, format, mismatch)
  work/figured/out-*.json      rows completed with a cropped original figure (figureOk/textOk/answerOk)
  work/figverified/out-*.json  blind re-solve of figure rows using the text and the figure image
Only rows that are authored as ready AND pass the independent check are served.
A figure row overrides its authored row when cropping and its own independent check both pass.
"""
import json, sys, glob, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
WORK = Path(sys.argv[1] if len(sys.argv) > 1 else '/home/claude/work')
bank = {e['id']: e for e in json.loads((ROOT/'content/expedition-selected-bank.json').read_text(encoding='utf-8'))['entries']}
excluded = set(json.loads((ROOT/'content/scope-plan.json').read_text(encoding='utf-8'))['nextAssessment']['excludedUnlearnedUnits'])
authored = [r for f in sorted(glob.glob(str(WORK/'authored/batch-*.json'))) for r in json.loads(Path(f).read_text(encoding='utf-8'))]
verified = {}
for f in sorted(glob.glob(str(WORK/'verified/*.json'))):
    for v in json.loads(Path(f).read_text(encoding='utf-8')):
        verified[v['id']] = v
for f in sorted(glob.glob(str(WORK/'figured/out-*.json'))):
    figrows = {x['id']: x for x in json.loads(Path(f).read_text(encoding='utf-8'))}
    for i, a in enumerate(authored):
        x = figrows.get(a['id'])
        if x and x.get('figureOk') and x.get('textOk') and x.get('answerOk'):
            authored[i] = {**a, 'status': 'ready', 'figureRequired': True, 'figure': x['figure'], 'text': x['text'],
                           'answer': x['answer'], 'steps': x['steps'], 'checkpoint': x['checkpoint'], 'figureRow': True}
            authored[i].pop('holdReason', None)
        elif x:
            authored[i] = {**a, 'figureAttempt': x.get('reason') or '図の切り出し不可'}
figverified = {}
for f in sorted(glob.glob(str(WORK/'figverified/*.json'))):
    for v in json.loads(Path(f).read_text(encoding='utf-8')):
        figverified[v['id']] = v
Q = r'(ですか|ますか|でしょうか|なさい|ましょう|か。|か？|　　|□|答え|[はがを]　[^\s　]|には　)'
def memo_like(text):
    """True when the stored text is a note-style summary rather than textbook wording (e.g. "…B電車の速さ")."""
    t = re.sub(r'【[^】]*】', '', text)
    t = re.sub(r'（[^（）]*答えなさい[^（）]*）', '', t)
    lead, *subs = re.split(r'\(\d+\)|（\d+）', t)
    if re.search(r'(求めなさい|答えなさい|あてはまる|書きなさい)', lead): return False
    return any(not re.search(Q, p.strip()) for p in (subs or [lead]) if p.strip())
DIMS = {'scalar', 'length', 'area', 'volume', 'time', 'speed', 'percent', 'ratio', 'clock'}

def check_spec(s):
    if 'parts' in s:
        assert len(s['parts']) >= 2, 'parts needs 2+'
        for p in s['parts']:
            assert p.get('label'), 'part label'
            check_spec(p)
        return
    assert s.get('dimension', 'scalar') in DIMS, s
    if s.get('dimension') == 'ratio':
        assert len(s['terms']) >= 2 and all(str(t).isdigit() and int(t) > 0 for t in s['terms'])
    elif s.get('dimension') == 'clock':
        assert 0 <= int(s['h']) <= 23 and 0 <= int(s['m']) <= 59; s.setdefault('unit', '')
    else:
        assert str(s['n']).lstrip('-').isdigit() and str(s['d']).isdigit() and int(s['d']) > 0, s
        s.setdefault('unit', '')

problems, units, hold, problems_ids = [], [], [], set()
for r in authored:
    e = bank[r['id']]
    v = figverified.get(r['id']) if r.get('figureRow') else verified.get(r['id'])
    reason = None
    if r.get('status') != 'ready':
        reason = r.get('holdReason') or 'hold'
    elif not v:
        reason = '独立検算が未実施'
    elif v.get('verdict') != 'pass':
        reason = '独立検算で不一致：' + (v.get('note') or '')
    elif any(u in excluded for u in e['source']['scopeUnits']):
        reason = '未習範囲'
    elif r.get('figureRequired') and not (r.get('figure') and (ROOT/'dist'/r['figure']).exists()):
        reason = '原図が必要'
    elif memo_like(r.get('text') or ''):
        reason = '本文が要約メモ形式（原本の文面が必要）'
    if reason is None:
        try:
            check_spec(r['answer'])
            assert 4 <= len(r['steps']) <= 8
            cp = r['checkpoint']; check_spec(cp['answer']); assert 'parts' not in cp['answer'] and cp['answer'].get('dimension') != 'ratio'
            assert r['text'].strip() and '［図' not in r['text'] and '図版p' not in r['text'].replace(' ', '')
        except Exception as ex:  # malformed authored data stays out of the served pool
            reason = '形式エラー：' + repr(ex)
    if reason:
        hold.append({**r, 'holdReason': reason, 'selectionKey': e['selectionKey'], 'sourceTitle': e['source']['title']})
        continue
    key = r['id'].removeprefix('selected-')
    pid = 'ready-' + key; uid = 'selection.' + e['selectionKey'].replace('/', '.')
    targets = e['targetSubquestions']
    steps = [{'id': 's' + str(i + 1), 'title': s['title'], 'body': s['body'], 'equation': s.get('equation', '')} for i, s in enumerate(r['steps'])]
    cp = dict(r['checkpoint']); cp['answer'] = {**cp['answer'], 'd': str(cp['answer'].get('d', '1'))}
    steps[-1]['checkpoint'] = cp
    loc = ','.join(targets)
    problems.append({'id': pid, 'unitId': uid, 'category': e['category'], 'domain': e['domain'], 'text': re.sub(r'ふきだし[：:]\s*(「[^」]*」)', r'\1', re.sub(r'[（(]ふきだし[：:]\s*(「[^」]*」)\s*[)）]', r'\n\1', r['text'])).strip(),
        'source': {'title': e['source']['title'] + ('' if targets == ['all'] else ' ' + loc), 'url': e['source']['url'],
                   'locator': 'Notion ' + ('全体' if targets == ['all'] else '指定小問 ' + loc), 'sourceText': e['problemText'],
                   'sourceAnswer': e['sourceAnswerText'], 'verification': ('原本図版から図を切り出し、本文と図から作成者と検算者が別々に解いて資料の答えと一致を確認。' if r.get('figureRow') else '本文条件から作成者と検算者が別々に解き、資料の答えと一致を確認。')},
        'answer': r['answer'], 'difficulty': max(1, min(10, e['baseDifficulty'] + e['uplift'])), 'figureRequired': bool(r.get('figureRow')), **({'figure': r['figure']} if r.get('figureRow') else {}),
        'scopeUnits': e['source']['scopeUnits'], 'homeStudy': False, 'reviewEligible': False, 'expeditionOnly': True, 'revision': 1,
        'explanation': {'steps': steps}, 'selectionKey': e['selectionKey']})
    units.append({'id': uid, 'name': e['learningDecision'], 'domain': e['domain'], 'definition': e['learningDecision'],
                  'representativeId': pid, 'decision': e['learningDecision'], 'prerequisites': []})

out = {'problems': problems, 'units': units, 'links': [], 'analysis': []}
(ROOT/'content/expedition-ready-2.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(ROOT/'content/expedition-prepared-hold.json').write_text(json.dumps({'note': '教材化作業済みだが未配信の候補。holdReasonを解消すれば配信可能。', 'entries': hold}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
from collections import Counter
print('served', len(problems), Counter(p['category'] for p in problems))
print('hold', len(hold), Counter(h['holdReason'][:14] for h in hold).most_common(12))
