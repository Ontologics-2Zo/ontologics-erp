import {ArrowRight,Check,Download,Plus} from 'lucide-react';
import {Badge,Button} from './ui';
import {NOW,type Draft} from './domain';
import {useEntity} from './entity';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,QuantityCell,WorkflowBasis} from './workflow-tables';
import {SupplierQuoteCards} from './supplier-quotes';
import {purchaseScopeDetail} from './demo-bom-links';

type Request={id:string;part:string;qty:number;needBy:string;evidence:string;author:string;version:number};
type Order={orderId:string;requestId:string;part:string;qty:number;quoteId:string;needBy:string;author?:string};
type Confirmation={orderId:string;qty:number;at:string;evidence:string};
type Quote={id:string;supplier:string;price:number;moq:number;multiple:number;shipping:number|null;lead:number;supply:number;expires:string;evidence:string};
const amount=(value:number)=>value.toLocaleString('ko-KR')+' KRW';
const applied=(drafts:Draft[],kind:'purchase_order'|'supply',orderId:string,evidence?:string)=>drafts.find(d=>
 (d.companyId??'A')==='A'&&d.status==='반영 완료'&&d.payload.kind===kind&&d.payload.orderId===orderId&&
 (evidence===undefined||d.payload.evidence===evidence));
function ReviewRecord({draft}:{draft:Draft|undefined}){return <div className="workflow-stack"><span>{draft?draft.author+' → '+(draft.approvedBy??'승인자 미확인'):'작성·승인자 미확인'}</span><small>{draft?'초안 v'+draft.version+' · 별도 승인 반영':'정확 승인 버전 연결 미확인'}</small></div>}
function PartReference({id}:{id?:string}){return <WorkflowObject id={id} detail={purchaseScopeDetail(id)}/>}

export function PurchaseRequestTable({requests,version,onCompare,onDownload}:{requests:Request[];version:number;onCompare:()=>void;onDownload:(request:Request)=>void}){
 const {select,resolve}=useEntity();
 return <WorkflowTable tableKey="purchase-requests" data={requests} getRowId={r=>r.id} contextId={r=>r.part} searchLabel="구매 요청·품목·근거 검색" empty="이 수요의 구매 요청 초안이 없습니다." columns={[
  {id:'photo',header:'품목 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.part}/>},
  {id:'object',accessorKey:'part',header:'품목 / 연결 범위',enableHiding:false,cell:c=><PartReference id={c.row.original.part}/>},
  {id:'reference',accessorKey:'id',header:'원요청 / 문서 버전',cell:c=><div className="workflow-stack"><code>{c.row.original.id}</code><small>문서 v{c.row.original.version}</small></div>},
  {id:'quantity',accessorKey:'qty',header:'구매 요청량',cell:c=><QuantityCell value={c.row.original.qty} unit="개" note="원수요 요청 · 발주량 아님"/>},
  {id:'needDate',accessorKey:'needBy',header:'필요일',cell:c=><div className="workflow-stack"><time>{c.row.original.needBy}</time><small>합성 요청 기한</small></div>},
  {id:'review',accessorFn:()=> '초안 · 미송신',header:'검토 상태',cell:()=> <Badge>초안 · 미송신</Badge>},
  {id:'owner',accessorKey:'author',header:'작성자',cell:c=><div className="workflow-stack"><span>{c.row.original.author}</span><small>승인 권한과 별개</small></div>},
  {id:'unknowns',header:'미확인',cell:()=> <small>공급확약·입고 연결 미확인</small>},
  {id:'next',header:'다음 조치',cell:c=><div className="workflow-actions"><Button onClick={()=>{if(resolve(c.row.original.part))select(c.row.original.part,false);onCompare()}}>견적 비교<ArrowRight size={13}/></Button><Button onClick={()=>onDownload(c.row.original)}><Download size={13}/>다운로드</Button></div>},
  {id:'basis',accessorKey:'evidence',header:'데이터 기준 / 근거',cell:c=><WorkflowBasis version={version} at={NOW} evidence={c.row.original.evidence}/>}
 ]}/>;
}

export function PurchaseQuoteTable({partId,quotes,needQty,selectedId,version,onSelect,onEvidence}:{partId:string;quotes:Quote[];needQty:number;selectedId:string;version:number;onSelect:(id:string)=>void;onEvidence:(id:string)=>void}){
 const {select,resolve}=useEntity();
 // These are the same MOQ/multiple calculations previously displayed in quote cards.
 const rows=quotes.map(q=>{const count=Math.ceil(Math.max(needQty,q.moq)/q.multiple)*q.multiple;return {...q,count,goods:count*q.price}});
 return <WorkflowTable tableKey="purchase-quotes" data={rows} getRowId={r=>r.id} contextId={()=>partId} searchLabel="견적·공급사·근거 검색" columnPickerLabel="표시 항목" renderRows={props=><SupplierQuoteCards {...props} selectedId={selectedId}/>} columns={[
  {id:'photo',header:'품목 사진',enableHiding:false,cell:()=> <WorkflowPhoto id={partId}/>},
  {id:'object',accessorFn:()=>partId,header:'품목 / 연결 범위',enableHiding:false,cell:()=> <PartReference id={partId}/>},
  {id:'reference',accessorFn:r=>r.supplier+' '+r.id,header:'공급사 / 견적',enableHiding:false,cell:c=><div className="workflow-stack"><strong>{c.row.original.supplier}</strong><code>{c.row.original.id}</code></div>},
  {id:'quantity',accessorKey:'count',header:'계산 주문량',cell:c=><QuantityCell value={c.row.original.count} unit="개" note={'원수요 '+needQty+'개 · 확정 발주 아님'}/>},
  {id:'moq',accessorKey:'moq',header:'MOQ / 배수',cell:c=><div className="workflow-stack workflow-numeric"><span>{c.row.original.moq} / {c.row.original.multiple}개</span><small>최소량 / 주문 배수</small></div>},
  {id:'price',accessorKey:'price',header:'단가 / 상품금액',cell:c=><div className="workflow-stack workflow-numeric"><strong>{amount(c.row.original.price)} / 개</strong><span>{amount(c.row.original.goods)}</span></div>},
  {id:'cost',accessorFn:r=>r.shipping===null?undefined:r.goods+r.shipping,header:'운송비 / 총비용',sortUndefined:'last',cell:({row:{original:r}})=><div className="workflow-stack workflow-numeric"><span>{r.shipping===null?'운송비 미확인':'운송비 '+amount(r.shipping)}</span><strong>{r.shipping===null?'총비용 미확인':amount(r.goods+r.shipping)}</strong></div>},
  {id:'supply',accessorKey:'supply',header:'견적 공급량',cell:c=><QuantityCell value={c.row.original.supply} unit="개" note="견적 기준 · 공급확약 아님"/>},
  {id:'needDate',accessorKey:'lead',header:'납기 / 유효일',cell:c=><div className="workflow-stack"><span>{c.row.original.lead}일 · 가정</span><small>유효 {c.row.original.expires}</small></div>},
  {id:'review',header:'검토 / 미확인',cell:c=><div className="workflow-stack"><Badge tone={c.row.original.shipping===null?'amber':'gray'}>{c.row.original.shipping===null?'운송비 미확인':'비용 조건 있음'}</Badge><small>합성 견적 · 확약 미등록</small></div>},
  {id:'next',header:'비교안 선택',cell:c=><Button primary={selectedId===c.row.original.id} onClick={()=>{if(resolve(partId))select(partId,false);onSelect(c.row.original.id)}}>{selectedId===c.row.original.id?<Check size={13}/>:<Plus size={13}/>} {selectedId===c.row.original.id?'비교안 선택됨':'비교안 선택'}</Button>},
  {id:'basis',accessorKey:'evidence',header:'데이터 기준 / 근거',cell:c=><div className="workflow-stack"><WorkflowBasis version={version} at={NOW}/><button className="ext-link mono" onClick={()=>onEvidence(c.row.original.id)}>{c.row.original.evidence}</button></div>}
 ]}/>;
}

export function PurchaseOrderTable({orders,confirmations,drafts,version,canWrite,onSupply}:{orders:Order[];confirmations:Confirmation[];drafts:Draft[];version:number;canWrite:boolean;onSupply:(orderId:string)=>void}){
 const {select,resolve}=useEntity();
 const rows=orders.map(order=>({...order,confirmed:confirmations.filter(c=>c.orderId===order.orderId).reduce((sum,c)=>sum+c.qty,0),draft:applied(drafts,'purchase_order',order.orderId)}));
 return <WorkflowTable tableKey="purchase-orders" data={rows} getRowId={r=>r.orderId} contextId={r=>r.part} searchLabel="발주·원요청·품목 검색" empty="승인·반영된 내부 발주 기록이 없습니다. 견적에서 초안을 작성하세요." columns={[
  {id:'photo',header:'품목 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.part}/>},
  {id:'object',accessorKey:'part',header:'품목 / 연결 범위',enableHiding:false,cell:c=><PartReference id={c.row.original.part}/>},
  {id:'reference',accessorFn:r=>r.orderId+' '+r.requestId,header:'내부 발주 / 원요청',cell:c=><div className="workflow-stack"><code>{c.row.original.orderId}</code><small>{c.row.original.requestId}</small></div>},
  {id:'quantity',accessorKey:'qty',header:'주문량',cell:c=><QuantityCell value={c.row.original.qty} unit="개" note="내부 발주 기록"/>},
  {id:'confirmed',accessorKey:'confirmed',header:'공급 확인 누계',cell:c=><QuantityCell value={c.row.original.confirmed} unit="개" note="별도 승인된 회신 합계"/>},
  {id:'remaining',accessorFn:r=>r.qty-r.confirmed,header:'확인 전 잔량',cell:c=><QuantityCell value={c.row.original.qty-c.row.original.confirmed} unit="개" note="주문량 − 공급 확인"/>},
  {id:'needDate',accessorKey:'needBy',header:'필요일'},
  {id:'review',header:'기록 상태',cell:()=> <Badge tone="blue">내부 기록 · 미송신</Badge>},
  {id:'owner',accessorFn:r=>r.draft?.author??'미확인',header:'작성 → 승인',cell:c=><ReviewRecord draft={c.row.original.draft}/>},
  {id:'unknowns',header:'미확인',cell:()=> <small>외부 송신·실물 입고 연결 미확인</small>},
  {id:'next',header:'다음 조치',cell:c=><Button disabled={!canWrite} title={!canWrite?'조회 계정은 초안을 저장할 수 없습니다.':undefined} onClick={()=>{if(resolve(c.row.original.part))select(c.row.original.part,false);onSupply(c.row.original.orderId)}}>공급 확인 초안</Button>},
  {id:'basis',accessorKey:'quoteId',header:'데이터 기준 / 근거',cell:c=><WorkflowBasis version={version} at={NOW} evidence={c.row.original.quoteId}/>}
 ]}/>;
}

export function SupplyConfirmationTable({confirmations,orders,drafts,version,onReceipt}:{confirmations:Confirmation[];orders:Order[];drafts:Draft[];version:number;onReceipt:()=>void}){
 const rows=confirmations.map(c=>({...c,id:JSON.stringify([c.orderId,c.evidence]),part:orders.find(o=>o.orderId===c.orderId)?.part,draft:applied(drafts,'supply',c.orderId,c.evidence)}));
 return <WorkflowTable tableKey="purchase-supplies" data={rows} getRowId={r=>r.id} contextId={r=>r.part} searchLabel="공급 확인·발주·회신 근거 검색" empty="별도 승인·반영된 공급 확인이 없습니다." footer="공급 확인은 입고·검사 합격·가용 재고가 아닙니다. 별도 PoE 입고 시연은 다른 품목·계획입니다. 현재 회신의 품목별 입고 처리는 미연결이며 수량을 넘기지 않습니다." columns={[
  {id:'photo',header:'품목 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.part}/>},
  {id:'object',accessorKey:'part',header:'품목 / 연결 범위',enableHiding:false,cell:c=><PartReference id={c.row.original.part}/>},
  {id:'reference',accessorKey:'orderId',header:'내부 발주',cell:c=><code>{c.row.original.orderId}</code>},
  {id:'quantity',accessorKey:'qty',header:'이번 회신 확인량',cell:c=><QuantityCell value={c.row.original.qty} unit="개" note="입고·사용 가용량 아님"/>},
  {id:'eventTime',accessorKey:'at',header:'회신 발생 시각',cell:c=><time>{c.row.original.at}</time>},
  {id:'review',header:'기록 상태',cell:()=> <Badge tone="blue">공급 확인 반영</Badge>},
  {id:'owner',accessorFn:r=>r.draft?.author??'미확인',header:'작성 → 승인',cell:c=><ReviewRecord draft={c.row.original.draft}/>},
  {id:'unknowns',header:'미확인',cell:()=> <small>품목·발주별 실물 입고 연결 미확인</small>},
  {id:'next',header:'다음 조치',cell:()=> <Button onClick={onReceipt}>별도 PoE 입고 시연<ArrowRight size={13}/></Button>},
  {id:'evidence',accessorKey:'evidence',header:'회신 근거'},
  {id:'basis',header:'데이터 기준',cell:()=> <WorkflowBasis version={version} at={NOW}/>}
 ]}/>;
}
