import rawBom from './bom-source.json';
import type {EntityMedia} from './media-data';
export type Entity={id:string;type:string;name:string;company:'A'|'B';revision:string;status:string;source:'실제 공개 원본'|'합성 예시'|'원본 미확보';properties:Record<string,string>;evidence:string[];photo?:EntityMedia};
export type Relation={id:string;from:string;to:string;type:'design'|'mount'|'flow'|'substitution'|'reservation';label:string;scope:string;evidence:string;validFrom?:string;validTo?:string};
export type BomLine={id:string;partId:string;position:string;qty:number|null;unit:string;raw:string;parent?:string;note:string;sourceRow?:number};
export type Snapshot={id:string;modelId:string;name:string;revision:string;source:Entity['source'];evidence:string;lines:BomLine[]};
export const SNAPSHOT_AT='2026-09-20T12:00:00+09:00';
const e=(id:string,type:string,name:string,status:string,props:Record<string,string>={},revision='1',source:Entity['source']='합성 예시',evidence=['SYN-LOCAL-01']):Entity=>({id,type,name,company:'A',revision,status,source,properties:props,evidence});
export const entities:Entity[]=[
 e('MODEL-POE','제품 모델','ESP32-PoE','원본 확보',{'제조사':'OLIMEX','용도':'Ethernet / PoE 개발 보드','원본 범위':'L · L1 WROOM BOM'},'L1','실제 공개 원본',['SRC-L1-ods','SRC-L1-pdf']),
 e('MODEL-POEISO','확보 대상 모델','ESP32-POE-ISO','원본 미등록',{'제조사':'OLIMEX','목표 원본':'Rev N CSV','자료 상태':'제공 요구사항에 조사 기록만 있음 · 로컬 전체 원본 미확보','BOM':'미등록 · 다른 모델의 예시로 대체하지 않음','근거':'ONT-REQ-1.5 §02.1'},'N','원본 미확보',[]),
 e('MODEL-EVB','확보 대상 모델','ESP32-EVB','원본 미등록',{'제조사':'OLIMEX','목표 원본':'Rev C CSV','자료 상태':'제공 요구사항에 일부 행 조사 기록만 있음 · 로컬 전체 원본 미확보','BOM':'미등록 · 다른 모델의 예시로 대체하지 않음','근거':'ONT-REQ-1.5 §02.1'},'C','원본 미확보',[]),
 e('MODEL-GATEWAY','확보 대상 모델','ESP32-GATEWAY','원본 미등록',{'제조사':'OLIMEX','목표 원본':'Rev I CSV / ODS / PDF','자료 상태':'제공 요구사항에 일부 행 조사 기록만 있음 · 로컬 전체 원본 미확보','BOM':'미등록 · 다른 모델의 예시로 대체하지 않음','근거':'ONT-REQ-1.5 §02.1'},'I','원본 미확보',[]),
 e('TRACE-LOT-02','부품 로트','TRACE-LOT-02 · 독립 추적 예시','합성 연결 확인',{'데이터셋':'독립 합성 추적 fixture · 생산/납품 원장 수량에 포함하지 않음','사내 품목':'합성 추적용 제어 부품','장착 범위':'TRACE-U201 / U1','주의':'U104·LOT-L07 조사와 별도 사례'},'1','합성 예시',['SYN-TRACE-CONFIRMED-01']),
 e('TRACE-MOUNT-201','장착 사건','TRACE-U201 / U1 장착','장착 이력 확인',{'데이터셋':'독립 합성 추적 fixture','발생시각':'2026-09-10T09:00:00+09:00','기록시각':'2026-09-10T09:15:00+09:00','확인 범위':'2026-09-10 09:00 ~ 2026-09-19 18:00 KST','확인 내용':'위 기간 장착 확인 · 이후 상태는 미확인','결함':'판정하지 않음'},'1','합성 예시',['SYN-TRACE-CONFIRMED-01']),
 e('TRACE-U201','개별 보드','TRACE-U201 · 독립 합성 보드','출하 연결 확인',{'데이터셋':'독립 합성 추적 fixture · 생산/납품 원장 수량과 별도','구성':'IO-24 / A · 합성 설계','장착 위치':'U1','확인 출하':'TRACE-SHP-01 · 합성 명세의 보드 ID 직접 참조','주의':'원장 집계에서 역으로 생성한 serial이 아님'},'1','합성 예시',['SYN-TRACE-CONFIRMED-01']),
 e('TRACE-SHP-01','출하','TRACE-SHP-01 · 합성 출하','출하 기록 확인',{'데이터셋':'독립 합성 추적 fixture · s.shipments 미포함','포함 보드':'TRACE-U201 1대 · 이 예시의 명시 목록','출발시각':'2026-09-19T14:00:00+09:00','납품회차':'TRACE-ROUND-01','도착':'확인 근거 없음 · 납품 완료 아님'},'1','합성 예시',['SYN-TRACE-CONFIRMED-01']),
 e('TRACE-ROUND-01','납품회차','TRACE-ROUND-01 · 추적 전용 회차','도착 미확인',{'데이터셋':'독립 합성 추적 fixture · 계약 ROUND-01과 별개','연결 출하':'TRACE-SHP-01','약속 수량':'1 대 · 독립 예시','실제 도착':'미확인','집계 경계':'운영 홈의 약속100대·생산·입고·출하·도착에 합산하지 않음'},'1','합성 예시',['SYN-TRACE-CONFIRMED-01']),
 e('MODEL-IO','제품 모델','IO-24','합성 설계',{'용도':'24V 디지털 I/O','구성':'8채널 입출력'}),
 e('MODEL-SENSE','제품 모델','SENSE-4','합성 설계',{'용도':'4채널 센서 인터페이스','구성':'ADC · 절연 통신'}),
 e('MODEL-PWR','제품 모델','PWR-12','합성 설계',{'용도':'12V 전원 분배','구성':'과전류 감시'}),
 e('IM-0008','사내 품목','MLCC 10uF / 25V','구매 검토',{'필요 수량':'80 EA','단위':'EA','사양':'합성 구매 fixture'}),
 e('PART-TPS','사내 품목','TPS2375D','부족',{'품목 코드':'IC-00042','패키지':'SOIC-8','수요 기준':'PoE L1 · 100대 × 1 EA','원품 재고':'100 EA','타 계획 예약':'20 EA','이번 계획 가용':'80 EA','부족':'20 EA'}),
 e('PART-ALT','사내 품목','TPS2375DR','범위 승인',{'패키지':'SOIC-8 · Reel','대체 범위':'PoE L1 / U2 / JOB-2609-01','승인 근거':'SYN-ALT-01 · 정확 버전 1','가용':'45 EA'}),
 e('PART-CAND','사내 품목','TPS2376D','미승인 후보',{'패키지':'SOIC-8','주의':'회로·열·핀 호환성 검토 필요','가용':'미확인'}),
 e('ALT-01','대체 승인','U2 적용 승인','범위 승인',{'원품':'PART-TPS','후보':'PART-ALT','적용 범위':'PoE L1 / U2 / JOB-2609-01','적용 기간':'2026-09-01 ~ 2026-09-30','승인자':'합성 검토자 B'}),
 e('LOT-L07','부품 로트','L07 · TPS2375D','이력 조사',{'공급처':'합성 공급처 S','제조사 로트':'L07','사내 로트':'LOT-L07','재고':'100 EA','장착 이력':'설계 BOM과 별도 사건 근거'}),
 e('RES-01','예약','타 계획 예약','예약',{'대상':'LOT-L07','수량':'20 EA','소비':'미발생','계획':'합성 타 계획'}),
 e('JOB-2609-01','생산작업','9월 PoE 생산','자재 준비',{'고정 구성':'ESP32-PoE / L1 WROOM','계획':'100 대','정상 완료':'별도 실적 원장 조회','기준':'합성 계획 / 실제 현장 관측 아님'}),
 e('CONTRACT-01','계약','9월 공급 계약','진행',{'고객':'합성 고객 A','약속 수량':'100 대','근거':'DEMO-CONTRACT-01'}),
 e('ROUND-01','납품회차','9월 1차 납품','계획',{'약속':'100 대','납품 완료':'실제 도착 원장 기준','기한':'2026-09-30'}),
 e('U101','개별 보드','U101','장착 이력 확인',{'구성':'PoE L1 · 합성 운영 시드','장착 위치':'U2','장착':'2026-09-01 09:00 KST','제거':'2026-09-20 11:00 KST','결함':'판정하지 않음'},'1','합성 예시',['DEMO-TRACE-01']),
 e('U104','개별 보드','U104','추가 확인',{'구성':'PoE L1 · 합성 운영 시드','장착 위치':'U2','제거':'미기록 / 보완 검토 대상','확인 범위':'미확인','출하 연결':'미확인'},'1','합성 예시',['DEMO-TRACE-01']),
 e('U106','개별 보드','U106','추가 확인',{'구성':'PoE L1 · 합성 운영 시드','제거':'미기록','확인 범위':'미확인','결함':'판정하지 않음'},'1','합성 예시',['DEMO-TRACE-01']),
 e('MOUNT-104','장착 사건','U104 / U2 장착','장착 이력 확인',{'장착':'2026-09-01 09:00 KST','제거':'미기록','기간 완전성':'미확인'},'1','합성 예시',['DEMO-TRACE-01']),
 e('CLAIM-01','클레임','U104 동작 중단 신고','신고',{'대상':'U104','원인':'미확인','판정':'시험 결과 필요'},'1','합성 예시',['DEMO-CLAIM-01'])
];
const synthParts=[['MCU','제어 MCU'],['ADC','4채널 ADC'],['REG','3.3V 레귤레이터'],['R','10kΩ 저항'],['C','100nF 커패시터'],['CON','터미널 커넥터'],['D','보호 다이오드'],['PCB','인쇄 회로 기판']];
export const snapshots:Snapshot[]=(['L','L1'] as const).map(rev=>({id:'CFG-POE-'+rev,modelId:'MODEL-POE',name:'ESP32-PoE / '+rev+' WROOM',revision:rev,source:'실제 공개 원본',evidence:'SRC-'+rev+'-ods',lines:rawBom[rev].filter(r=>r.row>2).map(r=>{const id=`BOM-POE-${rev}-${r.row}`,partId=`PART-POE-${rev}-${r.row}`;const n=Number(r.cells[0]);entities.push(e(partId,'BOM 원문 품목',r.cells[1]||'원문 미확인',/^(NA|NS|Opened)/.test(r.cells[1])?'미확인':'원문 표기',{'참조 위치':r.cells[3]||'미기재','원문 수량':r.cells[0]||'미기재','실제 장착':'별도 사건 근거 필요'},rev,'실제 공개 원본',['SRC-'+rev+'-ods']));return {id,partId,position:r.cells[3]||'미기재',qty:Number.isFinite(n)&&r.cells[0]!==''?n:null,unit:'EA',raw:r.cells[1],note:/^(NA|NS|Opened)/.test(r.cells[1])?'실장 미확인':'원문 수량 표기 · 장착 증거 아님',sourceRow:r.row};})}));
for(const [model,name,rev] of [['IO','IO-24','A'],['SENSE','SENSE-4','A'],['PWR','PWR-12','B']]){
 const parts=synthParts.filter(([p])=>model==='SENSE'||p!=='ADC');
 const lines:BomLine[]=parts.map(([p,label],i)=>{const id=`BOM-${model}-${p}`,partId=`PART-${model}-${p}`;entities.push(e(partId,'사내 품목',`${name} · ${label}`,'합성 설계',{'대상 모델':name,'설계':'데모용 전체 BOM · 실물 제조 검증 없음'},rev));return {id,partId,position:p==='PCB'?'PCB1':p+(i+1),qty:p==='C'?8:p==='R'?4:1,unit:'EA',raw:label,note:'합성 설계 스냅샷의 전체 구성'};});
 snapshots.push({id:'CFG-'+model+'-'+rev,modelId:'MODEL-'+model,name:name+' / '+rev,revision:rev,source:'합성 예시',evidence:'SYN-BOM-'+model,lines});
}
for(const snapshot of snapshots)entities.push(e(snapshot.id,'제품 구성',snapshot.name,snapshot.source==='실제 공개 원본'?'원본 검토':'합성 설계',{'BOM 항목':`${snapshot.lines.length} 행`,'계층':'단일단계 원본 · 가상 중간조립체 없음','모델':snapshot.modelId,'스냅샷':'전체 행 포함'},snapshot.revision,snapshot.source,[snapshot.evidence]));
export const relations:Relation[]=[
 {id:'trace-confirmed-1',from:'TRACE-LOT-02',to:'TRACE-MOUNT-201',type:'mount',label:'장착 로트',scope:'독립 합성 사례 / TRACE-U201 U1 / 운영 수량 집계 제외',evidence:'SYN-TRACE-CONFIRMED-01',validFrom:'2026-09-10T09:00:00+09:00',validTo:'2026-09-19T18:00:00+09:00'},
 {id:'trace-confirmed-2',from:'TRACE-MOUNT-201',to:'TRACE-U201',type:'mount',label:'장착 대상',scope:'2026-09-19 18:00까지 장착 확인 / 확인 종료는 제거 사건 아님',evidence:'SYN-TRACE-CONFIRMED-01',validFrom:'2026-09-10T09:00:00+09:00',validTo:'2026-09-19T18:00:00+09:00'},
 {id:'trace-confirmed-3',from:'TRACE-U201',to:'TRACE-SHP-01',type:'flow',label:'출하 명세에 포함',scope:'합성 명세의 보드 ID 직접 참조 / 실제 고객 납품 사실 아님',evidence:'SYN-TRACE-CONFIRMED-01',validFrom:'2026-09-19T14:00:00+09:00'},
 {id:'trace-confirmed-4',from:'TRACE-SHP-01',to:'TRACE-ROUND-01',type:'flow',label:'납품회차 연결',scope:'독립 추적용 1대 / 도착 확인 없음 / 운영 회차 집계 제외',evidence:'SYN-TRACE-CONFIRMED-01'},
 ...snapshots.flatMap(s=>[{id:'rel-model-'+s.id,from:s.modelId,to:s.id,type:'design' as const,label:'개정 구성',scope:s.revision,evidence:s.evidence},...s.lines.map(l=>({id:'rel-'+l.id,from:s.id,to:l.partId,type:'design' as const,label:'BOM 사용 위치',scope:l.position+' · '+(l.qty??'미확인')+' EA',evidence:s.evidence+(l.sourceRow?' / 행 '+l.sourceRow:'')}))]),
 {id:'r1',from:'CFG-POE-L1',to:'PART-TPS',type:'design',label:'품목 매핑 예시',scope:'U2 · 매핑 검토 별도',evidence:'SYN-MAP-01'},
 {id:'r2',from:'PART-TPS',to:'LOT-L07',type:'flow',label:'재고 로트',scope:'회사 A / 공급처 S',evidence:'SYN-STOCK-01'},
 {id:'r3',from:'LOT-L07',to:'RES-01',type:'reservation',label:'예약됨',scope:'20 EA · 소비 아님',evidence:'SYN-RES-01'},
 {id:'r4',from:'PART-TPS',to:'ALT-01',type:'substitution',label:'대체 적용 승인',scope:'L1 / U2 / JOB-2609-01',evidence:'SYN-ALT-01'},
 {id:'r5',from:'ALT-01',to:'PART-ALT',type:'substitution',label:'승인 후보',scope:'정확 버전 1',evidence:'SYN-ALT-01'},
 {id:'r6',from:'LOT-L07',to:'MOUNT-104',type:'mount',label:'장착 로트',scope:'U2',evidence:'DEMO-TRACE-01',validFrom:'2026-09-01 09:00 KST'},
 {id:'r7',from:'MOUNT-104',to:'U104',type:'mount',label:'장착 대상',scope:'제거/기간 완전성 미확인',evidence:'DEMO-TRACE-01'},
 {id:'r8',from:'LOT-L07',to:'U101',type:'mount',label:'장착·제거 확인',scope:'U2 · 결함 판정 아님',evidence:'DEMO-TRACE-01',validFrom:'2026-09-01 09:00 KST',validTo:'2026-09-20 11:00 KST'},
 {id:'r9',from:'LOT-L07',to:'U106',type:'mount',label:'장착 사건',scope:'제거·기간 완전성 미확인',evidence:'DEMO-TRACE-01'},
 {id:'r10',from:'JOB-2609-01',to:'CFG-POE-L1',type:'flow',label:'고정 구성',scope:'100대 계획',evidence:'DEMO-PLAN-01'},
 {id:'r11',from:'CONTRACT-01',to:'ROUND-01',type:'flow',label:'납품 약속',scope:'100대 · 출하·도착 아님',evidence:'DEMO-CONTRACT-01'},
 {id:'r12',from:'CLAIM-01',to:'U104',type:'flow',label:'신고 대상',scope:'원인·결함 미확인',evidence:'DEMO-CLAIM-01'}
];
export const entityById=(id:string,company='A')=>entities.find(e=>e.id===id&&e.company===company);
export const GRAPH_LIMITS={initialNodes:300,initialEdges:800,maxNodes:1000,maxEdges:2500};
