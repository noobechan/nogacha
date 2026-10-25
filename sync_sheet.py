#!/usr/bin/env python3
"""공개 Google Sheets CSV에서 data.json 재생성. 원본 수정 없음."""
import csv, io, json, re, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

SHEET_ID="12bhVk1tfC9N-U2eU9xie-XoW2gw85acQAukR-W2k3KY"
TABS=["旧レ","真レ","零レ","塔","降臨","強襲","超獣","開眼","コラボ","他"]
OUT=Path(__file__).with_name("data.json")

def read_tab(tab):
    q=urllib.parse.urlencode({"tqx":"out:csv","sheet":tab})
    url=f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?{q}"
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; NyankoRecordsBot/1.0)"})
    with urllib.request.urlopen(req,timeout=40) as resp:
        body=resp.read().decode("utf-8-sig")
    if body.lstrip().startswith("<!DOCTYPE") or body.lstrip().startswith("<html"):
        raise ValueError(f"{tab}: Google returned HTML, not CSV")
    rows=list(csv.reader(io.StringIO(body)))
    if not rows:raise ValueError(f"{tab}: empty")
    return rows

def build():
    records=[]
    stats={}
    for tab in TABS:
        rows=read_tab(tab)
        header=rows[0]
        blocks=[]
        for j in range(1,len(header)-2):
            if header[j]=="冠" and header[j+1] in ("ステージ","マップ") and header[j+2]=="枠" and header[j-1]=="マップ":
                blocks.append(dict(base=j-1,crown=j,stage=j+1,slots=j+2,url=j+3,unit=j+4,date=j+9,player=j+10))
        if not blocks:raise ValueError(f"{tab}: no record blocks")
        lang=next((j for j in range(len(header)-2) if header[j:j+3]==["Chinese","English","Korean"]),-1)
        maps={}
        for i,row in enumerate(rows[1:],start=2):
            def val(j):return row[j].strip() if j>=0 and j<len(row) else ""
            for bi,b in enumerate(blocks):
                stage,slots=val(b["stage"]),val(b["slots"])
                if not stage or not re.fullmatch(r"\d+(?:\.0+)?",slots):continue
                if val(b["base"]):maps[bi]=val(b["base"])
                mapname=maps.get(bi,"")
                if not mapname:continue
                n=int(float(slots))
                names={"jp":stage}
                if lang>=0:
                    if val(lang+1):names["en"]=val(lang+1)
                    if val(lang+2):names["kr"]=val(lang+2)
                records.append({
                    "id":f"{tab}-{i}-{bi}","category":tab,"map":mapname,"stage":stage,
                    "crown":val(b["crown"]) or "1","slots":n,"url":val(b["url"]),
                    "units":[val(j) for j in range(b["unit"],b["unit"]+5) if val(j)],
                    "date":val(b["date"]),"player":val(b["player"]),"names":names,
                    "subCategory":val(0) if tab in ("コラボ","他") else "",
                    "sourceRow":i,"sourceBlock":bi
                })
        stats[tab]=sum(r["category"]==tab for r in records)
    if len(records)<1500:raise ValueError(f"Only {len(records)} records, refusing to overwrite snapshot")
    return {"updated":datetime.now(timezone.utc).isoformat(),"records":records,
            "source":f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit","stats":stats}

if __name__=="__main__":
    data=build()
    tmp=OUT.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    tmp.replace(OUT)
    print("Saved",len(data["records"]),"rows to",OUT)
