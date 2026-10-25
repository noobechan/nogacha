
const SOURCE="https://docs.google.com/spreadsheets/d/12bhVk1tfC9N-U2eU9xie-XoW2gw85acQAukR-W2k3KY/edit";
const categories=["旧レ","真レ","零レ","塔","降臨","強襲","超獣","開眼","コラボ","他"];
const names={kr:{"旧レ":"레전드 스토리","真レ":"신 레전드 스토리","零レ":"레전드 스토리 제로","塔":"탑 스테이지","降臨":"강림 스테이지","強襲":"강습 스테이지","超獣":"초수 스테이지","開眼":"각성·광란 스테이지","コラボ":"콜라보 스테이지","他":"기타"},jp:{"旧レ":"旧レジェンド","真レ":"真レジェンド","零レ":"零レジェンド","塔":"塔","降臨":"降臨","強襲":"強襲","超獣":"超獣","開眼":"開眼","コラボ":"コラボ","他":"その他"},en:{"旧レ":"Stories of Legend","真レ":"Uncanny Legends","零レ":"Zero Legends","塔":"Towers","降臨":"Advent","強襲":"Barons","超獣":"Behemoth","開眼":"Awakening","コラボ":"Collaborations","他":"Other"}};
const labels={kr:{title:"무과금 공략 기록",sub:"스테이지·덱·유닛·플레이어 기록 탐색",search:"스테이지 검색 (한국어·일본어·영어)",rules:"기록 규칙",rule:"치트 및 BCU 공략은 포함되지 않습니다. 기록은 원본 시트에 현재 등록된 내용만 표시합니다.",cats:"스테이지 분류",deck:"스테이지별 덱 수 순위",units:"가장 많이 쓰인 유닛",players:"플레이어",stage:"스테이지",count:"덱 수",date:"기록일",link:"게시물 보기",none:"기록 없음",back:"← 메인으로",unit:"유닛",uses:"사용 횟수",all:"전체",forms:"형태별",combined:"진화 통합 (매핑 필요)",player:"플레이어",record:"기록",searchResult:"검색 결과",notice:"실제 데이터 연결 전입니다. config.js에 Apps Script 주소를 설정하세요.",loading:"시트 데이터 불러오는 중…",error:"데이터를 불러오지 못했습니다. 배포 설정을 확인하세요.",details:"상세 기록",source:"시트 원본 보기",unknown:"정보 없음"},jp:{title:"無課金攻略記録",sub:"ステージ・編成・キャラ・プレイヤーの記録",search:"ステージ検索",rules:"掲載ルール",rule:"チート・BCUの攻略は対象外。現在のシートにある記録のみ掲載します。",cats:"ステージ分類",deck:"ステージ別枠数ランキング",units:"使用キャラランキング",players:"プレイヤー",stage:"ステージ",count:"枠数",date:"記録日",link:"投稿を見る",none:"記録なし",back:"← トップへ",unit:"キャラ",uses:"使用回数",all:"すべて",forms:"形態別",combined:"進化統合（対応表が必要）",player:"プレイヤー",record:"記録",searchResult:"検索結果",notice:"データ未接続。config.jsにApps Script URLを設定してください。",loading:"データを読み込み中…",error:"データの読み込みに失敗しました。",details:"記録詳細",source:"元のシート",unknown:"不明"},en:{title:"No-Gacha Records",sub:"Stages, lineups, units and players",search:"Search stages in Korean, Japanese or English",rules:"Rules",rule:"Cheats and BCU runs are excluded. Only records currently listed in the source sheet are shown.",cats:"Stage categories",deck:"Stage slot ranking",units:"Most-used units",players:"Players",stage:"Stage",count:"Slots",date:"Record date",link:"View post",none:"No records",back:"← Home",unit:"Unit",uses:"Appearances",all:"All",forms:"By form",combined:"Combined evolutions (mapping required)",player:"Player",record:"Record",searchResult:"Search results",notice:"Live data not connected. Add the Apps Script URL in config.js.",loading:"Loading sheet records…",error:"Unable to load data. Check deployment settings.",details:"Record details",source:"Source sheet",unknown:"Unknown"}};
let lang=localStorage.getItem("lang")||"kr",records=[],ready=false,error="",updated="",searchTerm="",unitMode="forms";
let favorites=new Set(JSON.parse(localStorage.getItem("nyankoFavorites")||"[]"));
function toggleFavorite(key){if(favorites.has(key))favorites.delete(key);else favorites.add(key);localStorage.setItem("nyankoFavorites",JSON.stringify([...favorites]));render()}
function favButton(key){return `<button onclick="toggleFavorite(${JSON.stringify(key).replace(/"/g,"&quot;")})">${favorites.has(key)?"★":"☆"}</button>`}
const $=id=>document.getElementById(id),t=k=>labels[lang][k]||k,esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stageName=r=>r.names?.[lang]||r.stage||"",displayStage=r=>stageName(r)+(r.crown?" ★"+r.crown:"");
const validRecords=()=>records.filter(r=>!(r.slots===11&&r.url==="未出"));
const getStages=()=>{const m=new Map();for(const r of records){let key=r.category+"|"+r.map+"|"+r.stage+"|"+r.crown;if(!m.has(key))m.set(key,{...r,key});}return [...m.values()]};
const link=(u,label)=>/^https?:\/\//.test(u||"")?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:`<span class="muted">${esc(t("unknown"))}</span>`;
const btn=(s,action)=>`<button onclick="${action}">${esc(s)}</button>`;
function setLang(x){lang=x;localStorage.setItem("lang",x);render()}
function navigate(view="",key=""){location.hash="#/"+encodeURIComponent(view)+"/"+encodeURIComponent(key);render()}
function parseRoute(){const x=location.hash.slice(2).split("/");return [decodeURIComponent(x[0]||""),decodeURIComponent(x[1]||"")]}
function stageRows(cat){return getStages().filter(r=>!cat||r.category===cat)}
function findRecord(key){return getStages().find(r=>r.key===key)}
function render(){document.documentElement.lang=lang==="kr"?"ko":lang==="jp"?"ja":"en";$("brand").textContent=t("title");for(let l of ["kr","jp","en"])$(l).classList.toggle("active",l===lang);$("sync").textContent=updated;const [view,key]=parseRoute();$("app").innerHTML=!ready?`<section class="notice">${esc(error|| (window.SITE_CONFIG.endpoint?t("loading"):t("notice")))}</section>`:view==="stage"?stagePage(key):view==="category"?categoryPage(key):view==="decks"?rankPage():view==="units"?unitPage():view==="unit"?unitDetail(key):view==="players"?playerPage():view==="player"?playerDetail(key):home();if(ready&&!view)bindSearch();}
function home(){let stages=getStages(),counts=unitCounts();return `<div class="hero"><h1>${t("title")}</h1><p class="muted">${t("sub")}</p><input id="search" class="search" type="text" placeholder="${esc(t("search"))}" value="${esc(searchTerm)}" autocomplete="off"><div id="suggestions" class="suggestions"></div></div><section><h2 class="section-title">${t("rules")}</h2><div class="notice">${t("rule")} ${link(SOURCE,t("source"))}</div></section><section><h2 class="section-title">${lang==="kr"?"즐겨찾는 스테이지":lang==="jp"?"お気に入りステージ":"Favorite stages"}</h2><div class="links">${getStages().filter(r=>favorites.has(r.key)).slice(0,30).map(r=>btn(displayStage(r),`navigate('stage',${JSON.stringify(r.key)})`)).join("")||`<span class="muted">${t("none")}</span>`}</div></section><section><h2 class="section-title">${t("cats")}</h2><div class="grid">${categories.map(c=>`<button class="card" onclick="navigate('category','${c}')">${esc(names[lang][c])}<div class="muted small">${stageRows(c).length}</div></button>`).join("")}</div></section><section class="grid"><div class="card"><h3>${t("deck")}</h3><div class="stat">${validRecords().length}</div>${btn(t("deck"),"navigate('decks')")}</div><div class="card"><h3>${t("units")}</h3><div class="stat">${counts.length}</div>${btn(t("units"),"navigate('units')")}</div><div class="card"><h3>${t("players")}</h3><div class="stat">${new Set(records.map(r=>r.player).filter(Boolean)).size}</div>${btn(t("players"),"navigate('players')")}</div></section>`}
function bindSearch(){const el=$("search");if(!el)return;el.addEventListener("input",()=>{searchTerm=el.value;const q=searchTerm.trim().toLowerCase();$("suggestions").innerHTML=q?getStages().filter(r=>[r.stage,r.map,...Object.values(r.names||{})].some(x=>String(x||"").toLowerCase().includes(q))).slice(0,15).map(r=>`<button onclick="navigate('stage',${JSON.stringify(r.key).replace(/"/g,"&quot;")})">${esc(displayStage(r))} <span class="muted">· ${esc(names[lang][r.category])}</span></button>`).join(""):` `});if(searchTerm)el.dispatchEvent(new Event("input"))}
function table(headers,rows){return `<div class="tablebox"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")||`<tr><td colspan="${headers.length}" class="empty">${t("none")}</td></tr>`}</tbody></table></div>`}
function rowStage(r){return `<tr><td><a class="link" onclick="navigate('stage',${JSON.stringify(r.key).replace(/"/g,"&quot;")})">${esc(displayStage(r))}</a></td><td>${r.slots===11&&r.url==="未出"?"—":esc(r.slots)}</td><td>${esc(r.player||"—")}</td></tr>`}
function categoryPage(c){return `${btn(t("back"),"navigate()")}<h1>${esc(names[lang][c]||c)}</h1>${table([t("stage"),t("count"),t("player")],stageRows(c).map(rowStage))}`}
function stagePage(key){let s=findRecord(key);if(!s)return `${btn(t("back"),"navigate()")}<p>${t("none")}</p>`;let rs=records.filter(r=>r.category+"|"+r.map+"|"+r.stage+"|"+r.crown===key&&!(r.slots===11&&r.url==="未出"));return `${btn(t("back"),"navigate()")}<h1>${esc(displayStage(s))} ${favButton(key)}</h1><p class="muted">${esc(names[lang][s.category])} / ${esc(s.map)}</p><section class="card"><h3>${t("details")}</h3>${table([t("count"),t("unit"),t("player"),t("date"),t("link")],rs.map(r=>`<tr><td>${esc(r.slots)}</td><td>${esc(r.units.join(", ")||"—")}</td><td><a class="link" onclick="navigate('player',${JSON.stringify(r.player).replace(/"/g,"&quot;")})">${esc(r.player||"—")}</a></td><td>${esc(r.date||"—")}</td><td>${link(r.url,t("link"))}</td></tr>`))}</section>`}
function rankPage(){let rows=getStages().filter(r=>!(r.slots===11&&r.url==="未出")).sort((a,b)=>(Number(b.slots)||0)-(Number(a.slots)||0));return `${btn(t("back"),"navigate()")}<h1>${t("deck")}</h1>${table([t("stage"),t("count"),t("player")],rows.map(rowStage))}`}
function unitCounts(){let m=new Map();for(const r of validRecords())for(const u of new Set(r.units.filter(x=>x&&!/^(推定|不明|Not Found)$/i.test(x)))){let k=unitMode==="combined"?(window.UNIT_EVOLUTIONS?.[u]||u):u;m.set(k,(m.get(k)||0)+1)}return [...m].sort((a,b)=>b[1]-a[1])}
function unitPage(){let arr=unitCounts();return `${btn(t("back"),"navigate()")}<h1>${t("units")}</h1><div class="tabs">${btn(t("forms"),"unitMode='forms';render()")}${btn(t("combined"),"unitMode='combined';render()")}</div>${unitMode==="combined"&&!window.UNIT_EVOLUTIONS?`<div class="notice">${esc(t("combined"))}</div>`:""}${table(["# ",t("unit"),t("uses")],arr.map(([u,n],i)=>`<tr><td>${i+1}</td><td><a class="link" onclick="navigate('unit',${JSON.stringify(u).replace(/"/g,"&quot;")})">${esc(u)}</a></td><td>${n}</td></tr>`))}`}
function unitDetail(u){const matched=validRecords().filter(r=>r.units.includes(u));const unique=new Map();for(const r of matched){const key=r.category+"|"+r.map+"|"+r.stage+"|"+r.crown;if(!unique.has(key))unique.set(key,{...r,key})}return `${btn(t("back"),"navigate('units')")}<h1>${esc(u)}</h1><p class="muted">${t("uses")}: ${matched.length} · ${t("stage")}: ${unique.size}</p>${table([t("stage"),t("count"),t("player")],[...unique.values()].map(rowStage))}`}

// 원본 Nogachasheet/index.html의 동일인 병합, 제외 및 동점 순위 규칙을 반영.
const PLAYER_ALIASES={"brack rabbit":"black rabbit","black rabbit":"black rabbit","被神眷顾的小初":"被神眷顧的小初"};
const PLAYER_DISPLAY={"black rabbit":"Black Rabbit","sour":"기플","hmmm":"Hmmm"};
const KOREAN_PLAYERS=new Set(["퓨츄","싱싱한뉴비","black rabbit","ノノ","sour","푸하하","hmmm","윾띵","프츠","light","인사","포적"]);
function playerKey(raw){
 const value=String(raw??"").trim();
 if(!value)return "";
 if(/^noname(?:\b|[\d._-])/i.test(value)||/^deleted\d*$/i.test(value)||value==="不明")return "__unknown__";
 const key=value.toLocaleLowerCase("en-US");
 return PLAYER_ALIASES[key]||PLAYER_ALIASES[value]||key;
}
function playerRanking(){
 const m=new Map();let unknown=0;
 // 원본 순위 사이트와 동일하게 시트 플레이어명 열의 비어 있지 않은 셀을 기준으로 계산.
 for(const r of records){
  const key=playerKey(r.player);
  if(key==="__unknown__"){unknown++;continue}
  if(!key)continue;
  if(!m.has(key))m.set(key,{key,name:PLAYER_DISPLAY[key]||r.player,count:0,cats:{},raws:new Set(),posts:[]});
  const p=m.get(key);p.count++;p.cats[r.category]=(p.cats[r.category]||0)+1;p.raws.add(r.player);p.posts.push(r);
 }
 const result=[...m.values()].sort((a,b)=>b.count-a.count||(Number(KOREAN_PLAYERS.has(b.key))-Number(KOREAN_PLAYERS.has(a.key)))||a.name.localeCompare(b.name));
 let lastCount=null,rank=0;
 result.forEach((p,i)=>{if(p.count!==lastCount){rank=i+1;lastCount=p.count}p.rank=rank});
 return {result,unknown};
}
function playerPage(){
 const {result,unknown}=playerRanking();
 const notice=lang==="kr"?"기존 Nogachasheet 순위 규칙 적용 · 동일 수록 건수는 공동 순위":lang==="jp"?"既存サイトと同じ集計規則 · 同数は同順位":"Same counting rules as Nogachasheet · equal counts share a rank";
 return `${btn(t("back"),"navigate()")}<h1>${t("players")}</h1><p class="muted small">${esc(notice)} · ${lang==="kr"?"제외된 불명 기록":lang==="jp"?"不明の記録":"Unknown records"}: ${unknown}</p>`+
 table(["#",t("player"),t("record")],result.map(p=>`<tr><td>${p.rank}</td><td><a class="link" onclick="navigate('player',${JSON.stringify(p.key).replace(/"/g,"&quot;")})">${esc(p.name)}</a>${KOREAN_PLAYERS.has(p.key)?' <span class="pill small">KR</span>':''}<div class="muted small">${Object.entries(p.cats).sort((a,b)=>b[1]-a[1]).map(([c,n])=>esc(names[lang][c]||c)+" "+n).join(" · ")}</div></td><td>${p.count}</td></tr>`));
}
function playerDetail(key){
 const p=playerRanking().result.find(x=>x.key===key);
 if(!p)return `${btn(t("back"),"navigate('players')")}<p>${t("none")}</p>`;
 const rows=[...p.posts].sort((a,b)=>parsePlayerDate(b.date)-parsePlayerDate(a.date));
 return `${btn(t("back"),"navigate('players')")}<h1>${esc(p.name)}</h1><p class="muted">${lang==="kr"?"전체 순위":lang==="jp"?"総合順位":"Overall rank"} #${p.rank} · ${p.count} ${t("record")}</p>`+
 table([t("stage"),t("count"),t("date"),t("link")],rows.map(r=>`<tr><td><a class="link" onclick="navigate('stage',${JSON.stringify(r.category+"|"+r.map+"|"+r.stage+"|"+r.crown).replace(/"/g,"&quot;")})">${esc(displayStage(r))}</a></td><td>${esc(r.slots)}</td><td>${esc(r.date||"—")}</td><td>${link(r.url,t("link"))}</td></tr>`));
}
function parsePlayerDate(s){const m=String(s||"").match(/^(\d{2})\/(\d{1,2})\/(\d{1,2})$/);return m?new Date(2000+Number(m[1]),Number(m[2])-1,Number(m[3])).getTime():0}
window.receiveSheetData=function(payload){if(!payload||!Array.isArray(payload.records)){error=t("error");render();return}records=payload.records.filter(r=>r&&typeof r==="object"&&r.category&&r.stage&&Array.isArray(r.units));updated=payload.updated?`${lang==="kr"?"데이터 기준":lang==="jp"?"データ更新":"Data updated"}: ${payload.updated.slice(0,10)}`:"";ready=true;render()};
async function load(){
 try{const response=await fetch("data.json",{cache:"no-store"});if(!response.ok)throw new Error("snapshot HTTP "+response.status);const data=await response.json();window.receiveSheetData(data)}
 catch(e){error=t("error");render()}
 const ep=window.SITE_CONFIG.endpoint;
 if(ep){const script=document.createElement("script");script.src=ep+(ep.includes("?")?"&":"?")+"callback=receiveSheetData&_="+Date.now();script.onerror=()=>{if(!ready){error=t("error");render()}};document.head.appendChild(script)}
}
window.addEventListener("hashchange",render);load();
