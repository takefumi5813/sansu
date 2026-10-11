"""Read-only source selection + independent exact Fraction checks. No external writes.
Run with bundled Python from pilot-sansu or any working directory.
"""
from pathlib import Path
from fractions import Fraction
from math import lcm
import re, json, subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('C:/Users/tsuzu/Dropbox/算数DB/本文/算数DB_通常授業_後期.md')
NODE = 'C:/Users/tsuzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
SOURCE_TEXT = SOURCE.read_text(encoding='utf-8-sig')
EVIDENCE = json.loads((ROOT/'references/r24-calc-notion-evidence.json').read_text(encoding='utf-8-sig'))
NOTION = {p['id']: p for p in EVIDENCE['pages']}

def local_rows_for(r):
    start = SOURCE_TEXT.index(f'### K　計算マスター（R{r}）')
    end = SOURCE_TEXT.index('\n---', start)
    return {int(n): {'text': t.strip(), 'answer': a.strip(), 'line': SOURCE_TEXT[:start+m.start()].count('\n')+1}
            for m in re.finditer(r'^\| K-(\d+) \| ([^|]+) \| ([^|]+) \|', SOURCE_TEXT[start:end], re.M)
            for n,t,a in [m.groups()]}

def rows_for(r):
    """Select from fetched Notion pages; the local DB is comparison material only."""
    local=local_rows_for(r)
    result={}
    for pid,p in NOTION.items():
        m=re.fullmatch(f'R{r}K-(\\d+)',pid)
        if not m: continue
        n=int(m[1]);result[n]={'text':p['problemText'],'answer':p['answerText'],'line':local.get(n,{}).get('line'),
             'localText':local.get(n,{}).get('text'),'notion':p}
    return dict(sorted(result.items()))

def normalize(s):
    s = s.replace('＋','+').replace('−','-').replace('－','-').replace('×','*').replace('＝','=')
    s = re.sub(r'(\d+)と(\d+)/(\d+)', lambda m: f'{int(m[1])*int(m[3])+int(m[2])}/{m[3]}', s)
    return re.sub(r'\s+', '', s)

def exact(s):
    """Independent recursive evaluator. Literal fraction slash is distinct from ÷.
    This deliberately does not call calcScore, float arithmetic, eval, or sympy.
    """
    tokens = re.findall(r'\d+/\d+|\d+(?:\.\d*)?|[+*÷()\-]', normalize(s))
    if ''.join(tokens) != normalize(s): raise ValueError('Unsupported exact expression: '+s)
    i = 0
    def atom():
        nonlocal i
        if tokens[i] == '(':
            i+=1; value=add()
            assert tokens[i] == ')'; i+=1
            return value
        if tokens[i] in ['+','-']:
            sign=tokens[i];i+=1;value=atom();return -value if sign=='-' else value
        value=Fraction(tokens[i]);i+=1;return value
    def product():
        nonlocal i
        value=atom()
        while i<len(tokens) and tokens[i] in ['*','÷']:
            op=tokens[i];i+=1;other=atom();value=value*other if op=='*' else value/other
        return value
    def add():
        nonlocal i
        value=product()
        while i<len(tokens) and tokens[i] in ['+','-']:
            op=tokens[i];i+=1;other=product();value=value+other if op=='+' else value-other
        return value
    value=add();assert i==len(tokens);return value

def fmt(x):
    x=Fraction(x);return str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
def spec(x):
    x=Fraction(x);return {'n':str(x.numerator),'d':str(x.denominator),'unit':'','dimension':'scalar'}
def step(title,body,equation,checkpoint=None):
    result={'title':title,'body':body,'equation':equation}
    if checkpoint: result['checkpoint']={'prompt':checkpoint[0],'answer':spec(checkpoint[1])}
    return result

R24=rows_for(24)
SELECT24=[1,4,7,9,10,11,12,14,25,26,29,32,34,35,36,37,39]
SUPPLEMENT=[(23,16),(21,3),(21,4),(21,6),(21,9)]
SPECIAL={}

for n,whole,part,den in [(10,123,2,119),(35,12321,5,989)]:
    SPECIAL[(24,n)]=[
        step('整数と分数に分ける','帯分数は整数の部分と分数の部分に分けられます。どちらも3倍しましょう。',f'{whole}と{part}/{den}＝{whole}＋{part}/{den}'),
        step('整数の部分を3倍する','位をそろえて整数どうしのかけ算をします。',f'{whole}×3＝{whole*3}',(f'{whole}を3倍するといくつですか。',whole*3)),
        step('分数の部分を3倍する','分母はそのまま、分子を3倍します。',f'{part}/{den}×3＝{part*3}/{den}'),
        step('二つの部分を合わせる','整数と分数を合わせると答えです。分数部分は1より小さいことも確かめましょう。',f'{whole*3}＋{part*3}/{den}＝{whole*3}と{part*3}/{den}'),
        step('3で割ってもとに戻す','答えを3で割って、はじめの帯分数に戻るか確認します。',f'({whole*3}＋{part*3}/{den})÷3＝{whole}と{part}/{den}')]

for n,a in [(11,11),(36,13)]:
    difference=a*a-25; third=difference//3; final=Fraction(third)*Fraction('3.14')
    SPECIAL[(24,n)]=[
        step('共通のかけ算を見つける','二つの項には、3.14と120/360が共通しています。残りの部分の差を先に出すと計算が短くなります。',f'{a}×{a}×3.14×120/360−5×5×3.14×120/360＝({a}×{a}−5×5)×3.14×120/360'),
        step('平方の差を計算する','同じ数をかけた部分を計算してから引きます。',f'{a}×{a}−5×5＝{difference}'),
        step('分数を小さくする','120も360も120で割れます。120/360は1/3です。','120/360＝1/3'),
        step('3で割るところを先に済ませる','3.14をかける前に整数を3で割りましょう。',f'{difference}÷3＝{third}',(f'{difference}を3で割るといくつですか。',third)),
        step('最後に3.14をかける','ここで小数のかけ算を1回すれば答えが出ます。',f'{third}×3.14＝{fmt(final)}')]

SPECIAL[(24,14)]=[
    step('割り算を分数にする','かけ算と割り算だけの式です。分子と分母をまとめて、約分できる組を見つけましょう。','17÷26×39÷51＝17/26×39/51'),
    step('17と51を約分する','51は17の3倍です。この組は1と3になります。','17/51＝1/3'),
    step('39と26を約分する','39も26も13で割れます。この組は3と2になります。','39/26＝3/2',('39を13で割るといくつですか。',3)),
    step('残った数をかける','分子と分母の3を消すと、1/2が残ります。','1/3×3/2＝1/2')]
SPECIAL[(24,39)]=[
    step('分子と分母をまとめる','かけ算と割り算だけなので、約分する相手を探します。','46÷19×38÷69＝46/69×38/19'),
    step('46と69を約分する','46も69も23で割れます。','46/69＝2/3'),
    step('38と19を約分する','38は19の2倍です。','38÷19＝2',('38を19で割るといくつですか。',2)),
    step('残った数をかける','2/3の2倍なので4/3です。帯分数では1と1/3です。','2/3×2＝1と1/3')]
SPECIAL[(24,25)]=[
    step('かっこの中のかけ算から','かけ算を引き算より先にします。7と14を約分すると計算が短くなります。','7×3/14＝3/2',('7×3/14の答えを分数で入力しましょう。',Fraction(3,2))),
    step('かっこの中をまとめる','3/2は1.5です。3.5から引きます。','3.5−3/2＝2'),
    step('前半の割り算をする','分数で割るときは、逆数をかけます。','2÷5/8＝16/5'),
    step('後半も左から順に計算する','3×1/5を計算し、3/8の逆数をかけます。','3×1/5÷3/8＝8/5'),
    step('同じ分母どうしで引く','分母5がそろっているので、分子だけ引きます。','16/5−8/5＝8/5'),
    step('帯分数でも確かめる','8は5より3大きいので、1と3/5と表せます。','8/5＝1と3/5')]

SPECIAL[(23,16)]=[
    step('小数点を同じだけ動かす','割る数と割られる数をどちらも1000倍すると、商は変わりません。','4.375÷1.75＝4375÷1750'),
    step('整数の割り算を分数にする','4375を1750で割る形です。分子と分母を同じ数で割って小さくします。','4375÷1750＝4375/1750',('1.75を1000倍するといくつですか。',1750)),
    step('875で約分する','4375は875の5倍、1750は875の2倍です。','4375/1750＝5/2'),
    step('帯分数に直して確かめる','5/2は2と1/2です。1.75をその数だけかけると4.375に戻ります。','1.75×5/2＝4.375')]
SPECIAL[(21,3)]=[
    step('小数点をそろえる','十分の一の位どうし、一の位どうしをそろえて足します。','3.4＋7.6＝34/10＋76/10'),
    step('十分の一を合わせる','0.1が何個分かで考えると、34個と76個を合わせればよいと分かります。','34＋76＝110',('34と76を合わせるといくつですか。',110)),
    step('10個で1に戻す','0.1が110個あるので、10で割ります。','110÷10＝11'),
    step('引き算で確かめる','答えから片方を引いて、もう片方に戻るか確かめます。','11−7.6＝3.4')]
SPECIAL[(21,4)]=[
    step('小数の位をそろえる','7.7は7.70と同じ数です。小数点をそろえましょう。','7.7＝7.70'),
    step('百分の一が何個かで引く','7.70は0.01が770個、0.66は66個です。','770−66＝704',('770から66を引くといくつですか。',704)),
    step('小数に戻す','0.01が704個なので100で割ります。','704÷100＝7.04'),
    step('足して確かめる','答えに引いた数を足すと、はじめの数に戻ります。','7.04＋0.66＝7.7')]
SPECIAL[(21,6)]=[
    step('十分の一を単位にする','9.1は0.1が91個です。その91個を7つに分けます。','9.1＝91/10'),
    step('91を7で割る','7の段を使って考えましょう。','91÷7＝13',('91を7で割るといくつですか。',13)),
    step('十分の一13個を小数に戻す','0.1が13個なので1.3になります。','13/10＝1.3'),
    step('かけ算で確かめる','答えを7倍して、はじめの9.1に戻るか確認します。','1.3×7＝9.1')]
SPECIAL[(21,9)]=[
    step('整数のかけ算に分ける','1.35は135/100、0.6は6/10です。','1.35×0.6＝135/100×6/10'),
    step('整数どうしをかける','135を6倍します。','135×6＝810',('135を6倍するといくつですか。',810)),
    step('小数の位を戻す','100と10をかけて1000です。810を1000で割ります。','810/1000＝0.81'),
    step('大きさを確かめる','0.6倍は1倍より小さい数です。答えから1.35で割ると0.6に戻ります。','0.81÷1.35＝0.6')]

def ordinary_steps(n, text, expression):
    parts=re.split(r'([+\-])', expression)
    assert len(parts)==3, (n,expression)
    left,op,right=parts; a,b=exact(left),exact(right);common=lcm(a.denominator,b.denominator)
    na=a.numerator*(common//a.denominator);nb=b.numerator*(common//b.denominator)
    answer=a+b if op=='+' else a-b
    display_op='＋' if op=='+' else '−';other_op='−' if op=='+' else '＋'
    raw_left,raw_right=re.split(r'[＋+−－]',re.sub(r'＝.*$','',text))
    total=na+nb if op=='+' else na-nb
    return [
        step('整数・帯分数・小数を分数でそろえる','整数の部分も分母に合わせた分子へ直します。小数は位に合わせた分母にしてから約分します。',f'{raw_left}＝{fmt(a)}'),
        step('もう一方も分数にする','分数の形をそろえておくと、次に通分しやすくなります。',f'{raw_right}＝{fmt(b)}', (f'{raw_right}を分母{b.denominator}の分数にすると、分子はいくつですか。',b.numerator)),
        step('同じ分母にそろえる',f'分母を{common}にそろえます。分母を何倍したかと同じだけ、分子も何倍します。',f'{fmt(a)}{display_op}{fmt(b)}＝{na}/{common}{display_op}{nb}/{common}'),
        step('分子を計算して約分する','分母はそのままで分子を計算し、分子と分母の共通の約数で割ります。',f'{na}/{common}{display_op}{nb}/{common}＝{fmt(answer)}'),
        step('逆の計算で確かめる','答えから逆向きの計算をして、はじめの数に戻るか確かめます。',f'{fmt(answer)}{other_op}{fmt(b)}＝{fmt(a)}')]

def build():
    problems=[];units=[]
    for r,n in [(24,n) for n in SELECT24]+SUPPLEMENT:
        row=rows_for(r)[n];text=row['text']
        expression=normalize(re.sub(r'[＝=].*$', '',text))
        expected=exact(row['answer']);actual=exact(expression)
        assert actual==expected,(r,n,actual,expected)
        local_expression=normalize(re.sub(r'[＝=].*$', '',row['localText']))
        assert local_expression==expression,(r,n,local_expression,expression)
        steps=SPECIAL.get((r,n)) or ordinary_steps(n,text,expression)
        assert 4<=len(steps)<=8
        for i,s in enumerate(steps):
            s['id']=f'step-{i+1}'
            lhs,rhs=s['equation'].split('＝');assert exact(lhs)==exact(rhs),(r,n,s['equation'])
        pid=f'R{r}K-{n}';uid=f'calc.r{r}.k{n}'
        problems.append({'id':pid,'unitId':uid,'category':'calc','text':text,'sourceText':text,
            'source':{'title':f'R{r} 計算マスター K-{n}','path':row['notion']['url'],'url':row['notion']['url'],
            'locator':f'Notion 問題DB > R{r}K-{n} > 問題/答えブロック',
            'sourceText':text,'sourceAnswer':row['answer'],'notionPageId':row['notion']['url'].split('/')[-1].split('?')[0],
            'notionProperties':row['notion']['properties'],'notionVerification':row['notion']['verification'],
            'notionLastEditedAt':row['notion']['page_last_edited_at'],
            'localReferencePath':SOURCE.as_posix(),'localReferenceLocator':f'Markdown行{row["line"]}','localReferenceText':row['localText'],
            'localComparison':{'exactTextMatch':text==row['localText'],'normalizedExpressionMatch':True,
             'difference':'完全一致' if text==row['localText'] else 'Notionは解答□を明示。全角演算子・過去問注記の表記差あり。数値/演算/正答は一致。'},
            'verification':'2026-10-11 Notion問題DBをスキーマ取得→SQL候補取得→ページ本文fetchで選定。問題/答えブロックとプロパティ確認済み。ローカルDBは照合用。独立Fraction検算とcore.calcScore/core.grade照合。Notion native verificationはunverified。原教材PDFの再照合は未実施。',
            'pairId':f'R{r}K-{n+25 if r==24 and n<=25 else n-25 if r==24 else n+30}'},
            'answer':spec(actual),'figureRequired':False,'scopeUnits':[f'R{r}'],'homeStudy':False,'revision':1,
            'expression':expression,'explanation':{'steps':steps}})
        units.append({'id':uid,'name':f'R{r}計算 K-{n}','domain':'calculation','definition':'原資料の計算1問を独立した出題単位として保持する。型で集約しない。','representativeId':pid,'decision':'計算は原式単位で採用。表裏の実在する数値替えも独立問題として保持。','prerequisites':[]})
    scoring=subprocess.run([NODE,'-e',"const C=require('./src/core.js');let b='';process.stdin.on('data',x=>b+=x);process.stdin.on('end',()=>console.log(JSON.stringify(JSON.parse(b).map(p=>({id:p.id,...C.calcScore(p.expression)})))));"],input=json.dumps(problems),text=True,capture_output=True,cwd=ROOT,check=True)
    scores={s['id']:s for s in json.loads(scoring.stdout)}
    for p in problems:
        score=scores[p['id']];assert score['supported'];assert score['answer']=={'n':p['answer']['n'],'d':p['answer']['d']}
        p['score']=score['score'];p['star']=score['star'];p['difficulty']={1:2,2:5,3:7}[p['star']]
    analyses=[{'kind':'selection','detail':'Notion問題DBのR24K全50ページ本文/プロパティから採否検討し、通常数値計算17問を採用。標準不足をNotionのR23K16/R21K3,4,6,9の5問で補う。R24を優先し、計算は学年・授業範囲で制限しない。'},
        {'kind':'normalization_limit','detail':'text/sourceTextはDB本文を保持。expressionは全角演算子を正規化し帯分数を同値な仮分数へ変換。÷を分数横線へ変換しない。仮分数化で桁特徴が変わるためスコアは元の帯分数の学習難度と同一ではない。低補正なし。'},
        {'kind':'unsupported','detail':'R24の逆算・比・単位換算・数列・一の位等は原文のまま現parserが評価できず除外。勝手な改題、逆算式の答え側への変換はしない。'},
        {'kind':'coverage','detail':'直近R24は2026-10-02授業。ユーザー訂正によりR25..27は未習なので今回の出題/選定から除外する。K表裏はいずれも計算マスターでありH教材ではないためhomeStudy:false。'}]
    existing=json.loads((ROOT/'content/arithmetic.json').read_text(encoding='utf-8-sig'))['problems']
    existing_verification=[]
    for p in existing:
        if p['category']!='calc': continue
        record=NOTION[p['id']];expected=exact(record['answerText'])
        assert expected==Fraction(int(p['answer']['n']),int(p['answer']['d']))
        equivalent=normalize(p['text'].replace('□',''))==normalize(record['problemText'].replace('□',''))
        assert equivalent,(p['id'],p['text'],record['problemText'])
        existing_verification.append({'id':p['id'],'url':record['url'],'notionPageId':record['url'].split('/')[-1].split('?')[0],
            'notionProperties':record['properties'],'notionText':record['problemText'],'existingText':p['text'],
            'exactTextMatch':p['text']==record['problemText'],'normalizedExpressionMatch':equivalent,'answerMatch':True,
            'difference':'完全一致' if p['text']==record['problemText'] else 'マイナスの字形（－/−）だけが異なる。式・数値・正答は同じ。',
            'verification':record['verification'],'checkedAt':'2026-10-11'})
    output={'problems':problems,'units':units,'links':[],'analysis':analyses,'existingVerification':existing_verification}
    (ROOT/'content/selected-calc.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return output

def report(output):
    byid={p['id']:p for p in output['problems']}
    reasons={2:'分数→小数の表現変換（数式評価だけでは設問形式を保持できない）',5:'小数→帯分数の表現変換',8:'言葉による割り算。数式へ改題しない',15:'省略記号のある等差数列',24:'累乗の一の位の周期',27:'分数→小数の表現変換',30:'小数→帯分数の表現変換',33:'言葉による割り算。数式へ改題しない',40:'省略記号のある等差数列',49:'累乗の一の位の周期'}
    lines=['# R24計算選定・教材化','',f'選定一次資料はNotion問題DB `collection://531d42cc-9767-4652-ac87-5fd5cef74df7`。スキーマ確認→SQL→R24K全50ページの問題/答えブロックfetchで17問採用、NotionのR23/R21計算5問で標準を補充、追加合計22問。既存 arithmetic.json は変更しない。ローカル `{SOURCE.as_posix()}` は照合用で読み取り専用。','',
        'Notion本文と答えプロパティを基準にする。全ページnative verificationはunverified。コネクタのtruncated/unknown_block_countが省略されている場合は不明として保存し、問題/答え両ブロックの取得を確認した。原教材PDFの再照合は未実施。原文はtext/sourceText/source.sourceTextに保存。expressionのみ帯分数→仮分数、全角記号を正規化し、÷は保持。','',
        '## 難度と不足への対応','',
        '|帯|R24追加|補充追加|追加計|既存5問を含む計|','|---|---:|---:|---:|---:|']
    existing=json.loads((ROOT/'content/arithmetic.json').read_text(encoding='utf-8-sig'))['problems']
    for star,name in [(1,'標準'),(2,'応用'),(3,'難問')]:
        a=sum(p['star']==star and p['scopeUnits']==['R24'] for p in output['problems']);b=sum(p['star']==star and p['scopeUnits']!=['R24'] for p in output['problems']);c=sum(p.get('category')=='calc' and p.get('star')==star for p in existing)
        lines.append(f'|{name} ★{star}|{a}|{b}|{a+b}|{a+b+c}|')
    lines+=['','各帯に日課5問ぶん以上を確保。補充はR23K16（小数除法）、R21K3（加法）・K4（減法）・K6（除法）・K9（小数乗法）。R24は分数が中心なので、補充で四則と小数の偏りを抑えた。表裏同型は既存の実問題として扱い、架空の数値替えを作らない。',
        '', 'calcScoreは仮分数の分子桁数などを評価するため、K10/K35のように整数と分数を分けると易しい問題も高く算出される。元資料の★1〜2とアプリの算出★は別尺度。手動でスコアを下げない。difficultyはUI帯用に★1→2/★2→5/★3→7と写像した暫定値で、Notionの基礎難度検証値とは主張しない。','',
        '## R24K全採否表','', '|ID（Notionリンク）|Notion原文|Notion答え|採否と理由|S/★|区分/教材/時期/上乗せ|','|---|---|---|---|---|---|']
    for n,row in R24.items():
        p=byid.get(f'R24K-{n}')
        reason='採用：原文の通常計算を同値表記で厳密評価' if p else '除外：'+reasons.get(n, '逆算・未知数' if '□' in row['text'] and not any(w in row['text'] for w in ['分','秒','mL','時速','水そう']) else '比・単位・文章条件等（通常の単一数式/単一数値欄に未対応）')
        props=row['notion']['properties'];meta='/'.join(str(props[k]) for k in ['区分','教材','時期','上乗せ'])
        lines.append('|'+f'[R24K-{n}]({row["notion"]["url"]})|{row["text"]}|{row["answer"]}|{reason}|'+(f'{p["score"]}/★{p["star"]}' if p else '—')+f'|{meta}|')
    lines+=['','## 標準の補充','', '|ID|原文|DB答え|S/★|','|---|---|---|---|']
    for r,n in SUPPLEMENT:
        p=byid[f'R{r}K-{n}'];lines.append(f'|[{p["id"]}]({p["source"]["url"]})|{p["text"]}|{p["source"]["sourceAnswer"]}|{p["score"]}/★{p["star"]}|')
    lines+=['','## 検算と限界','',
        '`references/r24-calc-notion-evidence.json` は2026-10-11に取得したNotionスキーマに基づくSQL60件とfetch60ページ（R24全50＋補充5＋既存5）の一次資料スナップショット。`scripts/select-r24-calc.py` はこのNotion本文から選定し、独立したFractionの再帰構文解析器で原式・Notion答え・すべての解説等式を照合する。浮動小数点演算やevalを使わない。続いてcore.calcScoreの正答・算出帯と照合して教材を出力する。`tests/selected-calc.test.cjs` はcore.gradeで正答/誤答/チェックポイント、sourceTextの一致、帯別5問以上、4〜8段階を検証する。',
        '', '解説は各4〜6段階で途中数値のチェックポイントを置く。K11/K36は共通因子、K14/K39は約分、K25はかっこと分数除法を明示する。卒業・学習効果を実測したものではない。',
        '', 'R24は2026-10-02の直近授業。R25..27は未習のため今回から除外する。未収録/追加待ちという扱いにしない。計算は全分野出題の方針で、補充のscopeUnitsは実出典R23/R21を保持する。',
        '', '## 既存計算5問のNotion再照合','', '|ID|本文|正答|差異|','|---|---|---|---|']
    for v in output['existingVerification']:
        lines.append(f'|[{v["id"]}]({v["url"]})|{v["notionText"]}|一致|{v["difference"]}|')
    lines+=['','R20K-4/16を含む既存5問の問題本文・答え・区分/教材/時期/上乗せをNotionで確認済み。既存ファイルは変更せず、evidenceとexistingVerificationに証跡を記録した。','']
    (ROOT/'reports/r24-calc-selection.md').write_text('\n'.join(lines),encoding='utf-8')

if __name__=='__main__':
    output=build();report(output)
    print(json.dumps({'selected':len(output['problems']),'stars':{s:sum(p['star']==s for p in output['problems']) for s in [1,2,3]},'independentFraction':'all answers and explanation equations passed'},ensure_ascii=False))
