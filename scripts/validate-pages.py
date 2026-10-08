"""Validate the exact static Pages payload; stdlib-only and safe on CI."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote,urljoin
import hashlib,json,re

ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
manifest=json.loads((ROOT/'publication-manifest.json').read_text(encoding='utf8'))
files={p.relative_to(SITE).as_posix():p for p in SITE.rglob('*') if p.is_file()}
assert set(files)==set(manifest['files']),'Unexpected or missing public payload file'
for name,p in files.items():assert hashlib.sha256(p.read_bytes()).hexdigest()==manifest['files'][name],name
class Links(HTMLParser):
    def __init__(self,text):
        super().__init__();self.links=[];self.base=None;self.feed(text)
    def handle_starttag(self,tag,attrs):
        for k,v in attrs:
            if tag=='base' and k=='href':
                if self.base is None:self.base=v
                continue
            if k in ['src','href'] and v:self.links.append(v)
checked=0
for name,p in files.items():
    if p.suffix=='.html':
        doc=Links(p.read_text(encoding='utf8'))
        base=urljoin('https://example.invalid/GTOC/'+name,doc.base or '')
        for href in doc.links:
            u=urlsplit(href)
            if u.scheme or u.netloc or not u.path:continue
            assert not u.path.startswith('/'),f'Root-relative link breaks project Pages: {name}: {href}'
            resolved=urlsplit(urljoin(base,href))
            assert resolved.netloc=='example.invalid' and resolved.path.startswith('/GTOC/'),f'Link leaves Pages base: {name}: {href}'
            q=(SITE/unquote(resolved.path[len('/GTOC/'):])).resolve()
            assert q.is_relative_to(SITE.resolve()),f'Link leaves Pages payload: {name}: {href}'
            if q.is_dir():q=q/'index.html'
            assert q.is_file(),f'Broken link: {name}: {href}'
            checked+=1
    if p.suffix in ['.html','.js','.json','.md','.txt']:
        text=p.read_text(encoding='utf8',errors='replace')
        for pattern in [r'\b(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)\b',r'C:[/\\]+Users[/\\]+',r'gh[pousr]_[A-Za-z0-9]{30,}',r'-----BEGIN .*PRIVATE KEY-----']:
            assert not re.search(pattern,text),f'Private deployment content found in {name}'
audit=json.loads((SITE/'en/translation-audit.json').read_text(encoding='utf8'));assert audit['pendingSourceStrings']==0;assert audit['scientificFieldsUnchanged']
print(json.dumps(dict(passed=True,files=len(files),localLinks=checked,englishPages=len(list((SITE/'en').glob('*.html'))),translatedStrings=audit['translatedSourceStrings'],lessons=audit['lessons'],states=audit['states'])))
