/** Home-table projections of the existing local fixture.
 * These records are presentation data, not an API, assignment, or new ledger.
 * They never change State and never infer a configuration from an unrelated demo.
 */
import {NOW,materialQuantities,totals,type Draft,type State} from './domain';
import {entities,snapshots,SNAPSHOT_AT,type Entity} from './entity-data';

export type WorkItemId='TASK-MAT'|'TASK-REV'|'TASK-IN'|'TASK-DL'|'TASK-QA';
export type WorkGroup='부족 자재'|'검토 요청'|'입고 대기'|'납품'|'클레임';
export type WorkTone='gray'|'blue'|'amber'|'green'|'cyan'|'red';
export type WorkStatus={label:string;tone:WorkTone;detail:string};
export type WorkQuantity={value:number|null;unit:'EA'|'대'|'건';label:string;basis:string};
export type WorkItem={
 id:WorkItemId;group:WorkGroup;title:string;detail:string;
 objectId:string;contextObjectId:string;
 /** An individual board only when explicitly identified; not a guessed model. */
 boardId?:string;modelId?:string;modelName?:string;revision?:string;configId?:string;configLabel:string;
 quantity:WorkQuantity;
 /** Existing home fixture dates, not promised operational deadlines. */
 needDate:{value:string;label:string;basis:string;isSynthetic:true};
 reviewStatus:WorkStatus;materialStatus:WorkStatus;unknowns:string[];
 owner:{label:string;basis:string;isSynthetic:true};
 nextLabel:string;route:string;
 dataBasis:{asOf:string;version:number;origin:'합성 운영 예시';evidenceRefs:string[];notes:string[]};
};

type PurchaseRequest={id:string;part:string;qty:number;type:'purchase-request';evidence?:string};
type PurchaseOrder={orderId:string;part:string;qty:number;type:'purchase-order';evidence?:string};
function readDocuments<T extends {type:string}>(s:State,type:T['type']):T[]{
 return s.docs.flatMap(document=>{
  try{const value:unknown=JSON.parse(document.body);return value&&typeof value==='object'&&'type' in value&&value.type===type?[value as T]:[];}catch{return [];}
 });
}
const quantityKnown=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
const status=(label:string,tone:WorkTone,detail:string):WorkStatus=>({label,tone,detail});
const inScope=(draft:Draft)=>draft.companyId===undefined||draft.companyId==='A';
function bomLinkedTo(draft:Draft,configurationId:string,evidenceIds:string[]){
 if(draft.payload.kind!=='bom')return false;
 // An explicit target takes precedence over a source reference; never borrow a
 // state from a different configuration just because its evidence is mentioned.
 if(typeof draft.payload.configurationId==='string')return draft.payload.configurationId===configurationId;
 const evidence=String(draft.payload.evidence??'').split(/[\s·,;|]+/);
 return evidenceIds.some(id=>evidence.includes(id));
}
const isPoeL1Bom=(draft:Draft)=>bomLinkedTo(draft,'CFG-POE-L1',['SRC-L1-ods','SRC-L1-pdf']);
function reviewState(drafts:Draft[],applied=false,emptyLabel='검토 전'):WorkStatus{
 const counts=(value:Draft['status'])=>drafts.filter(d=>d.status===value).length;
 const waiting=counts('검토 요청'),approved=counts('승인'),supplement=counts('보완 요청'),rejected=counts('반려'),editing=counts('초안');
 if(waiting)return status(`검토 요청 ${waiting}건`,'amber','작성자와 다른 검토 계정이 정확한 초안 버전을 확인해야 합니다.');
 if(approved)return status(`승인·미반영 ${approved}건`,'blue','승인은 원장 반영이 아닙니다. 승인된 정확 버전의 반영 결과를 확인합니다.');
 if(supplement)return status(`보완 요청 ${supplement}건`,'amber','원본 근거와 검토 의견을 확인하고 새 초안 버전으로 검토합니다.');
 if(editing)return status(`초안 ${editing}건`,'gray','저장한 초안이며 검토 요청·승인·반영 전입니다.');
 if(rejected)return status(`반려 ${rejected}건`,'red','반려 이유와 원문을 확인합니다. 반려된 사실은 반영하지 않습니다.');
 if(applied||counts('반영 완료'))return status('반영 완료','green','로컬 시연 저장소에 승인 버전이 반영되었습니다. 실제 서버 원장과는 별개입니다.');
 return status(emptyLabel,'gray','해당 대상과 연결된 검토 요청이 없습니다.');
}
const due=(label:string):WorkItem['needDate']=>({value:'2026-'+label.replace('.','-'),label,basis:'기존 운영 홈의 합성 업무 기한 · 실제 납기 약속이나 현재 날짜 기준 지연 판정 아님',isSynthetic:true});
const owner=(label:string):WorkItem['owner']=>({label,basis:'기존 홈의 합성 담당 팀 표기 · 실제 사용자 배정이나 승인 권한 아님',isSynthetic:true});
const product={modelId:'MODEL-POE',modelName:'ESP32-PoE',revision:'L1',configId:'CFG-POE-L1',configLabel:'L1 WROOM'};

export function buildWorkItems(s:State):WorkItem[]{
 const m=materialQuantities(s),t=totals(s),drafts=s.drafts.filter(inScope),bomDrafts=drafts.filter(isPoeL1Bom);
 const bomWaiting=bomDrafts.filter(d=>d.status==='검토 요청').length;
 const purchaseRequests=readDocuments<PurchaseRequest>(s,'purchase-request').filter(d=>d.part==='IM-0008'&&typeof d.id==='string'&&quantityKnown(d.qty));
 const orders=readDocuments<PurchaseOrder>(s,'purchase-order').filter(d=>d.part==='IM-0008'&&typeof d.orderId==='string'&&quantityKnown(d.qty));
 const orderIds=new Set(orders.map(order=>order.orderId));
 const linkedSupplies=(s.supplyConfirmations??[]).filter(event=>orderIds.has(event.orderId));
 const supplyConfirmed=linkedSupplies.reduce((sum,event)=>sum+(quantityKnown(event.qty)?event.qty:0),0);
 const requested=purchaseRequests.length?purchaseRequests.reduce((sum,request)=>sum+request.qty,0):80;
 const purchaseDrafts=drafts.filter(d=>(d.payload.kind==='purchase_order'&&d.payload.part==='IM-0008')||(d.payload.kind==='supply'&&orderIds.has(String(d.payload.orderId))));
 const fulfillmentDrafts=drafts.filter(d=>['production','stock','shipment','arrival','contract'].includes(d.payload.kind));
 const fulfillmentReview=reviewState(fulfillmentDrafts,false,'이행 기록 검토');
 const traceDrafts=drafts.filter(d=>d.payload.kind==='trace');
 const traceReview=reviewState(traceDrafts,s.traceCorrected,'이력 검토 전');
 const materialStatus=m.comparisonShortage>0?status(`비교 부족 ${m.comparisonShortage} EA`,'amber',`확인 품목 필요 ${m.required} − 원품 가용 ${m.originalAvailable} − 입고 합격 할당 ${m.receiptAllocated}. 예약 후 미확보 ${m.unsecured} EA와 구분합니다.`):m.unsecured>0?status(`미확보 ${m.unsecured} EA`,'amber',`비교 부족은 0 EA이지만 예약·할당으로 확보한 수량은 ${m.secured} EA입니다.`):status('확인 품목 확보','green',`예약 ${s.reserved} + 합격 할당 ${m.receiptAllocated} = ${m.secured} EA. BOM 전체 실장 확인 또는 실제 소비를 뜻하지 않습니다.`);
 const basis=(evidenceRefs:string[],notes:string[]=[]):WorkItem['dataBasis']=>({asOf:NOW,version:s.version,origin:'합성 운영 예시',evidenceRefs:Array.from(new Set(evidenceRefs.filter(Boolean))),notes:['회사 A 로컬 fixture · 실제 현장 이벤트 미연결',...notes]});
 return [
  {id:'TASK-MAT',group:'부족 자재',objectId:'PART-TPS',contextObjectId:'PART-TPS',...product,
   title:m.comparisonShortage?'PoE L1 생산의 자재 부족을 검토하세요':'자재 확보와 예약 범위를 확인하세요',
   detail:`필요 ${m.required} EA · 비교 가용 ${m.comparisonAvailable} EA · 예약·할당 확보 ${m.secured} EA`,
   quantity:{value:m.required,unit:'EA',label:'확인 품목 필요량',basis:'합성 작업 JOB-2609-01의 정상 수요 100대 × PART-TPS 사용량 1 EA. 전체 BOM 소요가 아닙니다.'},
   needDate:due('09.21'),reviewStatus:s.demandConfirmed?reviewState(bomDrafts,s.bomApplied,'수요 확인'):status('수요 확인 전','gray','수요 확인은 승인 또는 자재 예약과 다른 단계입니다.'),materialStatus,
   unknowns:[...(!s.demandConfirmed?['생산 수요 미확인']:[]),'NA·NS·Opened 실장 미확인','BOM 전체 소요·실제 투입 별도 확인'],
   owner:owner('자재'),nextLabel:'자재·대체 검토',route:'MATERIAL',
   dataBasis:basis(['DEMO-DEMAND-01','DEMO-MATERIAL-01','SYN-MAP-01'],['비교 부족량과 예약·할당 후 미확보 수량을 별도로 표시합니다.'])},
  {id:'TASK-REV',group:'검토 요청',objectId:'CFG-POE-L1',contextObjectId:'CFG-POE-L1',...product,
   title:bomWaiting?'별도 승인자를 기다리는 L1 등록안':'L1 원본과 개정 차이를 확인하세요',
   detail:`L1 BOM 검토 요청 ${bomWaiting}건 · 원문과 정확 버전 대조`,
   quantity:{value:bomWaiting,unit:'건',label:'L1 BOM 검토 요청',basis:'현재 회사의 검토 요청 중 CFG-POE-L1 또는 SRC-L1 원본 근거로 명시 연결된 BOM 초안. 회사 전체 검토 건수와 다릅니다.'},
   needDate:due('09.21'),reviewStatus:reviewState(bomDrafts,s.bomApplied),
   materialStatus:status('실장·소요 미확인','gray','BOM 등록 승인이 실장 확인이나 자재 가용 확정을 뜻하지 않습니다.'),
   unknowns:['WROOM 파일명·WROVER 시트명 불일치','NA·NS·Opened 상태 보존'],
   owner:owner('기술'),nextLabel:bomDrafts.length?'등록안 검토':'원본·개정 검토',route:bomDrafts.length?'UI05':'UI02',
   dataBasis:basis(['SRC-L1-ods','SRC-L1-pdf',...bomDrafts.map(d=>d.id)],['실제 공개 원본과 합성 운영의 검토 상태를 구분합니다.'])},
  {id:'TASK-IN',group:'입고 대기',objectId:'IM-0008',contextObjectId:'IM-0008',configLabel:'구성 연결 미확인',
   title:'공급 확인과 부분 입고 근거를 연결하세요',
   detail:`MLCC 구매 수요 ${requested} EA · 연결된 공급 확인 ${supplyConfirmed} EA · 입고 연결 미확인`,
   quantity:{value:requested,unit:'EA',label:purchaseRequests.length?'구매 요청 수량':'합성 구매 필요량',basis:purchaseRequests.length?'IM-0008을 명시한 구매 요청 문서의 수량 합계. MOQ를 반영한 발주 수량과 구분합니다.':'기존 IM-0008 합성 구매 fixture의 필요 수량 80 EA. PoE 생산 수요와 연결하지 않습니다.'},
   needDate:due('09.23'),reviewStatus:reviewState(purchaseDrafts,orders.length>0,'구매 검토 전'),
   materialStatus:status(supplyConfirmed?`공급 확인 ${supplyConfirmed} EA`:'입고 연결 미확인',supplyConfirmed?'blue':'gray','공급 확인은 입고·검사 합격·사용 가능한 재고가 아닙니다. 현재 입고 원장에 품목·발주라인 연결이 없습니다.'),
   unknowns:['제품·개정·구성 연결 미확인','부분 입고의 품목·발주라인 연결 미확인'],
   owner:owner('구매'),nextLabel:'공급·입고 근거 검토',route:'PURCHASE',
   dataBasis:basis(['SYN-DEMAND-IM0008-001',...purchaseRequests.map(d=>d.id),...orders.map(d=>d.orderId),...linkedSupplies.map(event=>event.evidence)],['State.receipt는 다른 합성 자재 시나리오의 수량이므로 IM-0008에 귀속하지 않습니다.','홈 기한은 구매 요청 문서의 개별 필요일과 별도인 기존 합성 표시값입니다.'])},
  {id:'TASK-DL',group:'납품',objectId:'ROUND-01',contextObjectId:'ROUND-01',configLabel:'구성 연결 미확인',
   title:'1차 회차의 출하·도착 잔량을 확인하세요',
   detail:`약속 100대 · 도착 ${t.arrived}대 · 운송 중 ${t.transit}대 · 창고 ${t.warehouse}대`,
   quantity:{value:t.promiseRemaining,unit:'대',label:'잔여 납품 약속',basis:`합성 회차 약속 100 − 로컬 반영 도착 사건 누계 ${t.arrived}. 추가 생산 필요량이 아니며 생산·입고·출하 누계를 합산하지 않습니다.`},
   needDate:due('09.30'),reviewStatus:{...fulfillmentReview,label:'시연 전체 · '+fulfillmentReview.label,detail:'회사 A 로컬 생산·입고·출하·도착·계약 초안 전체의 검토 상태입니다. ROUND-01에 명시 귀속된 검토 결과로 확정하지 않습니다. '+fulfillmentReview.detail},
   materialStatus:status('자재 연결 미확인','gray','이 회차와 제품 구성·생산작업의 명시 연결 문서가 없어 자재 상태를 추정하지 않습니다.'),
   unknowns:['회차의 제품·구성 연결 미확인','개별 보드·출하 명세 연결 미확인','조건부 도착 전망 미확인'],
   owner:owner('생산'),nextLabel:'출하·도착 잔량 확인',route:'UI08',
   dataBasis:basis(['DEMO-CONTRACT-01','DEMO-FUL-01',...s.shipments.map(sh=>sh.evidence),...s.shipments.flatMap(sh=>(sh.arrivals??[]).map(arrival=>arrival.evidence))],['같은 데모에 PoE가 등장한다는 이유만으로 회차에 구성 또는 사진을 연결하지 않습니다.'])},
  {id:'TASK-QA',group:'클레임',objectId:'U104',contextObjectId:'U104',boardId:'U104',...product,
   title:'신고 대상의 장착 이력과 확인 범위를 조사하세요',
   detail:`L07 → U104 / U2 · ${s.traceCorrected?'제거·확인 범위 보완 반영':'제거·확인 범위 미확인'} · 원인 미확인`,
   quantity:{value:1,unit:'대',label:'선택 조사 대상',basis:'명시된 개별 합성 보드 U104 1대. 결함 수량·전체 영향 범위·재생산 수요가 아닙니다.'},
   needDate:due('09.20'),reviewStatus:{...traceReview,detail:'현재 trace 도구는 U104 이력 보완 시연 전용입니다. U106 등 다른 보드의 검토·이력 상태를 집계하지 않습니다. '+traceReview.detail},
   materialStatus:s.traceCorrected?status('장착 이력 보완','blue','U104 제거와 재장착 없음의 확인 범위가 보완됨. 조건상 제외는 안전 보장이 아닙니다.'):status('장착 범위 미확인','gray','제거 미기록을 계속 장착으로 해석하지 않습니다.'),
   unknowns:[...(!s.traceCorrected?['제거 시각·확인 범위 미확인']:[]),'원인·결함 미확인','개별 보드·출하 연결 미확인'],
   owner:owner('품질'),nextLabel:'장착 이력 조사',route:'UI04',
   dataBasis:basis([s.traceCorrected?'DEMO-TRACE-02':'DEMO-TRACE-01'],['PoE L1 구성은 U104에 명시된 합성 운영 시드입니다. 원문 BOM만으로 장착 사실을 생성하지 않습니다.'])}
 ];
}

export type ConfigurationItem={
 /** Existing configuration ID, or model ID when no configuration is registered. */
 id:string;contextObjectId:string;modelId:string;name:string;modelName:string;revision:string;configLabel:string;
 /** Source rows only, never a production quantity. null means unregistered. */
 bomRows:number|null;bomUnit:'행';source:Entity['source'];
 reviewStatus:WorkStatus;materialStatus:WorkStatus;unknowns:string[];
 dataBasis:{asOf:string;version:number;origin:Entity['source'];evidenceRefs:string[];notes:string[]};
};

export function buildConfigurationItems(s:State):ConfigurationItem[]{
 const drafts=s.drafts.filter(inScope),representative=buildWorkItems(s).find(item=>item.id==='TASK-MAT')!;
 const registered=snapshots.map((snapshot):ConfigurationItem=>{
  const model=entities.find(entity=>entity.id===snapshot.modelId&&entity.company==='A');
  const sourceIds=[snapshot.evidence,...(snapshot.source==='실제 공개 원본'?['SRC-'+snapshot.revision+'-pdf']:[])];
  const linkedDrafts=drafts.filter(draft=>bomLinkedTo(draft,snapshot.id,sourceIds));
  const isL1=snapshot.id==='CFG-POE-L1',actual=snapshot.source==='실제 공개 원본';
  const unknownLines=snapshot.lines.filter(line=>line.qty===null||/미확인/.test(line.note));
  return {
   id:snapshot.id,contextObjectId:snapshot.id,modelId:snapshot.modelId,name:snapshot.name,
   modelName:model?.name??snapshot.modelId,revision:snapshot.revision,configLabel:snapshot.name,
   bomRows:snapshot.lines.length,bomUnit:'행',source:snapshot.source,
   reviewStatus:reviewState(linkedDrafts,isL1&&s.bomApplied,actual?'원본 검토 전':'합성 스냅샷'),
   materialStatus:isL1?{
    ...representative.materialStatus,label:'대표 품목 · '+representative.materialStatus.label,
    detail:'PART-TPS / U2의 합성 자재 검토만 표시합니다. 전체 BOM의 자재 확보 상태가 아닙니다. '+representative.materialStatus.detail,
   }:status('자재 미확인','gray','이 구성에 연결된 정상 수요·재고·예약·할당 근거가 없습니다. 다른 개정의 자재 상태를 적용하지 않습니다.'),
   unknowns:actual?[
    'WROOM 파일명·WROVER 시트명 불일치',
    ...(snapshot.revision==='L'?['L 파일·Rev J 시트명 불일치']:[]),
    ...(unknownLines.length?[`NA·NS·Opened 또는 수량 미확인 ${unknownLines.length}행`]:[]),
    'BOM 전체 소요·실제 실장 미확인',
   ]:['합성 설계 · 실제 제조 검증 없음','생산 수요·재고·실제 실장 미확인'],
   dataBasis:{asOf:SNAPSHOT_AT,version:s.version,origin:snapshot.source,evidenceRefs:[...sourceIds,...linkedDrafts.map(draft=>draft.id)],notes:[
    'BOM 행 수는 전체 스냅샷 행 수이며 제품 수량이나 부품 총수량이 아닙니다.',
    '표시 버전은 로컬 업무 데이터 버전 · 원본 개정과 별개',
    ...(isL1?['자재 상태는 대표 PART-TPS 한 품목의 합성 운영 예시로 제한됩니다.']:[]),
   ]},
  };
 });
 const unregistered=entities.filter(entity=>entity.company==='A'&&entity.type==='확보 대상 모델'&&entity.source==='원본 미확보').map((model):ConfigurationItem=>({
  id:model.id,contextObjectId:model.id,modelId:model.id,name:model.name,modelName:model.name,
  revision:model.revision,configLabel:`목표 개정 ${model.revision} · 구성 미등록`,bomRows:null,bomUnit:'행',source:model.source,
  reviewStatus:status('미등록','gray','원본 전체 BOM을 확보하지 않아 등록·승인 상태를 만들지 않습니다.'),
  materialStatus:status('자재 미확인','gray','BOM·생산 수요·재고 연결이 미등록입니다. 0으로 표시하지 않습니다.'),
  unknowns:['전체 원본 BOM 미확보','개정·구성 등록 미완료','생산 수요·자재 상태 미확인'],
  dataBasis:{asOf:SNAPSHOT_AT,version:s.version,origin:model.source,evidenceRefs:[...model.evidence],notes:[
   '요구사항의 확보 대상 모델입니다. 다른 제품 BOM 또는 합성 설계로 대체하지 않습니다.',
   '목표 개정 표기는 확보 요청이며 확인된 등록 구성이 아닙니다.',
  ]},
 }));
 return [...registered,...unregistered];
}
