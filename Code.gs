// Google Apps Script: Google 시트 > 확장 프로그램 > Apps Script에 붙여넣기
// 배포 > 새 배포 > 웹 앱 > 실행: 나 / 액세스: 모든 사용자
const SHEET_ID='12bhVk1tfC9N-U2eU9xie-XoW2gw85acQAukR-W2k3KY';
const TABS=['旧レ','真レ','零レ','塔','降臨','強襲','超獣','開眼','コラボ','他'];
function doGet(e){
  const callback=String((e.parameter||{}).callback||'receiveSheetData');
  if(!/^[a-zA-Z_$][\w$]*$/.test(callback))return ContentService.createTextOutput('Invalid callback');
  const cache=CacheService.getScriptCache();
  let data=cache.get('records_v1');
  if(!data){data=JSON.stringify(buildPayload());if(data.length<90000)cache.put('records_v1',data,60)}
  return ContentService.createTextOutput(callback+'('+data+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function buildPayload(){
 const book=SpreadsheetApp.openById(SHEET_ID),records=[];
 TABS.forEach(tab=>{
  const sheet=book.getSheetByName(tab);if(!sheet)return;
  const vals=sheet.getDataRange().getDisplayValues();
  if(vals.length<2)return;
  const header=vals[0],blocks=[];
  // 각 블록의 시작 위치는 '冠' 다음 'ステージ'(零レ 첫 블록만 マップ)
  for(let j=0;j<header.length-3;j++){
    if(header[j]==='冠'&&(header[j+1]==='ステージ'||header[j+1]==='マップ')&&header[j+2]==='枠'){
      const base=j-1;
      if(base>=0&&header[base]==='マップ')blocks.push({base:base,crown:j,stage:j+1,slots:j+2,url:j+3,unit:j+4,date:j+9,player:j+10});
    }
  }
  // コラボ/他: B열부터 맵, A열은 하위 분류
  const subCategory=(tab==='コラボ'||tab==='他');
  let maps={};
  for(let i=1;i<vals.length;i++){
   const row=vals[i],nameInfo={};
   const langStart=header.findIndex((h,j)=>h==='Chinese'&&header[j+1]==='English'&&header[j+2]==='Korean');
   if(langStart>=0){nameInfo.en=row[langStart+1]||'';nameInfo.kr=row[langStart+2]||''}
   blocks.forEach((b,bi)=>{
    const stage=row[b.stage],slots=row[b.slots];
    if(!stage||!slots||!/^\d+$/.test(String(slots).trim()))return;
    if(row[b.base])maps[bi]=row[b.base];
    const map=maps[bi]||'',crown=row[b.crown]||'1';
    const units=row.slice(b.unit,b.unit+5).filter(Boolean);
    records.push({category:tab,map:map,stage:stage,crown:crown,slots:Number(slots),
      url:row[b.url]||'',units:units,date:row[b.date]||'',player:row[b.player]||'',
      names:nameInfo,subCategory:subCategory?(row[0]||''):''});
   });
  }
 });
 return {updated:new Date().toISOString(),records:records};
}
// 캐시 갱신은 60초 이내. 즉각 반영이 필수면 Google Apps Script의 onEdit 설치형
// 트리거에서 아래 함수를 호출하도록 설정할 수 있음(외부 API 변경은 별도).
function clearRecordCache(){CacheService.getScriptCache().remove('records_v1')}
