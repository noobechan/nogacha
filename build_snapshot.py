import zipfile,xml.etree.ElementTree as ET,re,json,datetime,collections
from pathlib import Path
P=Path(__file__).parent
SOURCE=P/'source.xlsx'
NS='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
with zipfile.ZipFile(SOURCE) as z:
 ss=[]
 if 'xl/sharedStrings.xml' in z.namelist():
  root=ET.fromstring(z.read('xl/sharedStrings.xml'))
  ss=[''.join(t.text or '' for t in si.iter(NS+'t')) for si in root.findall(NS+'si')]
 def sheet(idx):
  root=ET.fromstring(z.read(f'xl/worksheets/sheet{idx}.xml'))
  out=[]
  for row in root.iter(NS+'row'):
   vals={}
   for c in row.findall(NS+'c'):
    ref=c.attrib.get('r','');m=re.match(r'([A-Z]+)',ref)
    if not m:continue
    col=0
    for char in m.group(1):col=col*26+ord(char)-64
    v=c.find(NS+'v');t=c.attrib.get('t')
    if t=='inlineStr':val=''.join(x.text or '' for x in c.iter(NS+'t'))
    elif v is None:continue
    elif t=='s':val=ss[int(v.text)]
    else:val=v.text or ''
    vals[col-1]=str(val)
   if vals:
    r=['']*(max(vals)+1)
    for k,v in vals.items():r[k]=v
    out.append((int(row.attrib.get('r','0')),r))
  return out
 tabs=['説明書','目次','旧レ','真レ','零レ','塔','降臨','強襲','超獣','開眼','コラボ','他','統計']
 records=[];stats={}
 for idx,tab in enumerate(tabs,1):
  if tab not in tabs[2:-1]:continue
  rows=sheet(idx);h=rows[0][1];blocks=[]
  for j in range(len(h)-2):
   if h[j]=='冠' and h[j+1] in ('ステージ','マップ') and h[j+2]=='枠' and j>0 and h[j-1]=='マップ':
    blocks.append(dict(base=j-1,crown=j,stage=j+1,slots=j+2,url=j+3,unit=j+4,date=j+9,player=j+10))
  lang=-1
  for j in range(len(h)-2):
   if h[j:j+3]==['Chinese','English','Korean']:lang=j
  maps={};seen=set();count=0
  for rowno,row in rows[1:]:
   def val(j):return row[j].strip() if j<len(row) else ''
   for bi,b in enumerate(blocks):
    stage,slots=val(b['stage']),val(b['slots'])
    if not stage or not re.fullmatch(r'\d+(?:\.0+)?',slots):continue
    if val(b['base']):maps[bi]=val(b['base'])
    mapname=maps.get(bi,'')
    if not mapname:continue
    units=[val(j) for j in range(b['unit'],b['unit']+5) if val(j)]
    names={'jp':stage}
    if lang>=0:
     if val(lang+1):names['en']=val(lang+1)
     if val(lang+2):names['kr']=val(lang+2)
    rec=dict(id=f'{tab}-{rowno}-{bi}',category=tab,map=mapname,stage=stage,crown=val(b['crown']) or '1',slots=int(float(slots)),url=val(b['url']),units=units,date=val(b['date']),player=val(b['player']),names=names,subCategory=val(0) if tab in ('コラボ','他') else '',sourceRow=rowno,sourceBlock=bi)
    records.append(rec);count+=1
  stats[tab]={'records':count,'blocks':len(blocks),'sheetRows':len(rows)}
  print(tab,stats[tab])
 data={'updated':datetime.datetime.now(datetime.timezone.utc).isoformat(),'records':records,'source':'Google Sheets exported snapshot','stats':stats}
 (P/'data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf8')
 print('TOTAL',len(records),'JSON', (P/'data.json').stat().st_size)
 print('SAMPLES',records[:2])
