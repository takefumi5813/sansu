import re
from fractions import Fraction as F
# ---- tokenizer/parser -> AST. nodes: ('n',Fraction,srcstr) ('x',) ('op',o,l,r) ('par',node,kind)
def norm(s):
    s=s.strip()
    s=re.sub(r'\s*の□\s*$','',s)
    s=s.replace('＋','+').replace('−','-').replace('－','-').replace('ー','-').replace('×','*').replace('＝','=').replace('（','(').replace('）',')').replace('｛','{').replace('｝','}')
    s=s.translate(str.maketrans('０１２３４５６７８９．','0123456789.'))
    s=s.replace('□','□').replace('［','[').replace('］',']').replace('　',' ')
    s=re.sub(r'\s+','',s)
    return s
TOK=re.compile(r'(\d+)と(\d+)/(\d+)|(\d+)/(\d+)|(\d+\.\d+|\d+)|([+\-*÷()\[\]{}=□])')
def tokenize(s):
    out=[];i=0
    while i<len(s):
        m=TOK.match(s,i)
        if not m or m.end()==i:raise ValueError('tok '+s[i:])
        if m[1]:out.append(('n',F(int(m[1]))+F(int(m[2]),int(m[3])),m[0]))
        elif m[4]:out.append(('n',F(int(m[4]),int(m[5])),m[0]))
        elif m[6]:out.append(('n',F(m[6]),m[0]))
        else:out.append((m[7],))
        i=m.end()
    return out
def parse_expr(toks):
    i=0
    def atom():
        nonlocal i
        t=toks[i]
        if t[0]=='n':i+=1;return t
        if t[0]=='□':i+=1;return ('x',)
        if t[0] in '([{':
            close={'(':')','[':']','{':'}'}[t[0]];i+=1;v=add()
            if toks[i][0]!=close:raise ValueError('close')
            i+=1;return ('par',v,t[0])
        raise ValueError('atom '+str(t))
    def prod():
        nonlocal i
        v=atom()
        while i<len(toks) and toks[i][0] in('*','÷'):
            o=toks[i][0];i+=1;r=atom();v=('op',o,v,r)
        return v
    def add():
        nonlocal i
        v=prod()
        while i<len(toks) and toks[i][0] in('+','-'):
            o=toks[i][0];i+=1;r=prod();v=('op',o,v,r)
        return v
    v=add()
    return v,i
def parse_eq(text):
    s=norm(text)
    toks=tokenize(s)
    eqs=[k for k,t in enumerate(toks) if t[0]=='=']
    if len(eqs)>1:raise ValueError('multi =')
    if eqs:
        k=eqs[0];L=toks[:k];R=toks[k+1:]
        if not R:  # trailing "=" only -> forward
            lt,i=parse_expr(L);assert i==len(L);return ('fwd',lt,None)
        if len(R)==1 and R[0][0]=='□':
            lt,i=parse_expr(L);assert i==len(L);return ('fwd',lt,None)
        lt,i=parse_expr(L);assert i==len(L)
        rt,j=parse_expr(R);assert j==len(R)
        return ('eq',lt,rt)
    lt,i=parse_expr(toks);assert i==len(toks);return ('fwd',lt,None)
def count_x(n):
    if n[0]=='x':return 1
    if n[0]=='op':return count_x(n[2])+count_x(n[3])
    if n[0]=='par':return count_x(n[1])
    return 0
def ev(n,x=None):
    if n[0]=='n':return n[1]
    if n[0]=='x':
        if x is None:raise ZeroDivisionError
        return x
    if n[0]=='par':return ev(n[1],x)
    a=ev(n[2],x);b=ev(n[3],x);o=n[1]
    if o=='+':return a+b
    if o=='-':return a-b
    if o=='*':return a*b
    return a/b
def parse_ans(a):
    a=a.strip()
    a=re.split(r'[（(\s]',a)[0] if re.match(r'^\d',a) else a
    a=a.replace(' ','')
    m=re.fullmatch(r'(\d+)と(\d+)/(\d+)',a)
    if m:return F(int(m[1]))+F(int(m[2]),int(m[3]))
    m=re.fullmatch(r'(\d+)/(\d+)',a)
    if m:return F(int(m[1]),int(m[2]))
    if re.fullmatch(r'\d+(\.\d+)?',a):return F(a)
    return None
def ops_of(n):
    if n[0]=='op':return 1+ops_of(n[2])+ops_of(n[3])
    if n[0]=='par':return ops_of(n[1])
    return 0
def to_ascii(n):
    if n[0]=='n':
        s=n[2];m=re.fullmatch(r'(\d+)と(\d+)/(\d+)',s)
        if m:return f"{int(m[1])*int(m[3])+int(m[2])}/{m[3]}"
        return s
    if n[0]=='x':return '□'
    if n[0]=='par':
        o=n[2];c={'(':')','[':']','{':'}'}[o];return o+to_ascii(n[1])+c
    return to_ascii(n[2])+n[1]+to_ascii(n[3])
