import {BOM_PURCHASE_DEMO} from './demo-bom-links';
import {ArrowRight,Boxes,ClipboardCheck,FileSearch,GitCompareArrows,Layers,PackageCheck,ShoppingCart,TriangleAlert} from 'lucide-react';
import {useApp} from './context';
import {useEntity} from './entity';
import {snapshots} from './entity-data';
import {materialQuantities,NOW} from './domain';
import {Badge,Button,Panel,useStored} from './ui';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,QuantityCell,WorkflowBasis} from './workflow-tables';
import type {MaterialComparisonRow} from './material-tables';
import './supply-overview.css';

type SupplyOverviewProps={rows:MaterialComparisonRow[];onReview:(id:string)=>void;onComparison:()=>void;onInventory:()=>void;onBom:()=>void};

/** A read-only projection of the existing material example. It does not infer supply for the full BOM. */
export function SupplyOverview({rows,onReview,onComparison,onInventory,onBom}:SupplyOverviewProps){
 const {s,go}=useApp(),{select,resolve}=useEntity(),[shortOnly,ShortOnly]=useStored('workflow-view-supply-shortage-only',false),m=materialQuantities(s);
 const original=rows.find(row=>row.id==='PART-TPS')!,approved=rows.filter(row=>row.kind==='승인 대체품'),candidates=rows.filter(row=>row.kind==='미승인 후보');
 const demandRows=shortOnly&&m.comparisonShortage===0?[]:[original],bomCount=snapshots.find(snapshot=>snapshot.id==='CFG-POE-L1')!.lines.length;
 const unallocatedPass=s.receipt?s.receipt.pass-m.receiptAllocated:null;
 const openPlan=()=>{select('JOB-2609-01',false);go('UI07')};
 const openDemand=()=>{select(original.id,false);document.getElementById('supply-demand-analysis')?.scrollIntoView({block:'start',behavior:'smooth'})};
 return <div className="supply-overview" data-supply-overview="true">
  <div className="supply-basis-line"><span><i/>합성 수급 스냅샷 · 회사 A · 원장 v{s.version}</span><span>기준 2026.09.20 12:00 KST · 필요일 미연결</span></div>
  <div className="supply-summary" aria-label="확인된 품목의 수급 요약">
   <button onClick={openDemand}><span className="supply-summary-icon blue"><Layers size={20}/></span><span><small>수요 연결 품목</small><strong>1 <em>품목</em></strong><p>100대 × 1 EA · 전체 BOM 아님</p></span></button>
   <button onClick={onInventory}><span className={'supply-summary-icon '+(m.comparisonShortage?'amber':'blue')}><TriangleAlert size={20}/></span><span><small>원품 비교 부족</small><strong>{m.comparisonShortage} <em>EA</em></strong><p>원품 가용 + 합격분 할당 기준</p></span></button>
   <button onClick={onComparison}><span className="supply-summary-icon cyan"><GitCompareArrows size={20}/></span><span><small>범위 승인 대체품</small><strong>{approved.length} <em>품목</em></strong><p>비교 가용 {approved[0]?.available??'미확인'} EA · 미예약</p></span></button>
   <button onClick={openPlan}><span className="supply-summary-icon amber"><ClipboardCheck size={20}/></span><span><small>계획 미확보</small><strong>{m.unsecured} <em>EA</em></strong><p>예약 {s.reserved} + 합격분 할당 {m.receiptAllocated} 제외</p></span></button>
  </div>
  <div className="supply-coverage"><span><FileSearch size={15}/><strong>분석 범위</strong> 공개 L1 BOM {bomCount}행 중 사내 품목 매핑·재고 계산은 U2의 합성 예시 1품목입니다. 나머지 품목의 소요·재고·부족은 미계산입니다.</span><Button onClick={onBom}>전체 BOM 확인 <ArrowRight size={13}/></Button></div>
  <section id="supply-demand-analysis" className="panel supply-demand-panel">
   <div className="panel-heading"><div><h2>BOM 기준 소요·재고 분석</h2><p>비교 부족은 구매 확정량이나 계획 미확보량과 다릅니다.</p></div><label className="supply-short-filter" data-view-state="true"><input type="checkbox" checked={shortOnly} onChange={event=>ShortOnly(event.target.checked)}/>비교 부족만</label></div>
   <WorkflowTable tableKey="supply-demand" data={demandRows} getRowId={row=>row.id} contextId={row=>row.id} searchLabel="확인 품목·사용 위치 검색" empty="현재 조건에서 비교 부족인 확인 품목은 없습니다. 전체 BOM의 수급 완료를 뜻하지 않습니다." columns={[
    {id:'photo',header:'사진',enableHiding:false,cell:cell=><WorkflowPhoto id={cell.row.original.id}/>},
    {id:'object',header:'품목 · 사용 위치',enableHiding:false,accessorFn:row=>row.id+' '+(resolve(row.id)?.name??'')+' U2 SOIC-8',cell:cell=><WorkflowObject id={cell.row.original.id} detail="U2 · SOIC-8 · 매핑 예시"/>},
    {id:'required',header:'필요 수량',accessorFn:()=>m.required,cell:()=> <QuantityCell value={m.required} unit="EA" note="100대 × 보드당 1 EA"/>},
    {id:'available',header:'원품 가용',accessorFn:()=>m.originalAvailable,cell:()=> <div className="supply-stock-cell"><QuantityCell value={m.originalAvailable} unit="EA" note={`재고 ${m.originalStock} − 타 예약 ${m.otherReserved}`}/><div className="supply-stock-bar" aria-label={`재고 ${m.originalStock} EA 중 원품 가용 ${m.originalAvailable} EA, 타 계획 예약 ${m.otherReserved} EA`}><span style={{width:(m.originalAvailable/m.originalStock*100)+'%'}}/></div></div>},
    {id:'receiptAllocated',header:'합격분 할당',accessorFn:()=>m.receiptAllocated,cell:()=> <QuantityCell value={m.receiptAllocated} unit="EA" note="계획 수준 · 로트 미연결"/>},
    {id:'shortage',header:'비교 부족',accessorFn:()=>m.comparisonShortage,cell:()=> <span className={m.comparisonShortage?'supply-shortage':''}><QuantityCell value={m.comparisonShortage} unit="EA" note={`max(0, ${m.required} − ${m.originalAvailable} − ${m.receiptAllocated})`}/></span>},
    {id:'alternative',header:'대체 검토',accessorFn:()=>`범위 승인 ${approved.length}종 · 미승인 후보 ${candidates.length}종`,cell:()=> <div className="workflow-stack"><Badge tone="blue">범위 승인 {approved.length}종</Badge><span className="workflow-cell-note">후보 {candidates.length}종 · 확보에 미포함</span></div>},
    {id:'next',header:'다음 조치',cell:()=> <Button onClick={onComparison}>대체품 비교</Button>},
    {id:'basis',header:'데이터 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="SYN-MAP-01 · SYN-STOCK-01"/>}
   ]} footer={<>원품 비교 가용 {m.originalAvailable} EA에서 자기 계획 예약을 다시 차감하지 않습니다. 대체품·미승인 후보·입고 예정은 합산하지 않습니다.</>}/>
   <div className="supply-plan-strip" aria-label="계획 확보와 입고 합격분 구분">
    <div><small>현재 계획 예약</small><strong data-supply-quantity="reserved">{s.reserved} <em>EA</em></strong><span>원품 가용 안의 예약</span></div>
    <div><small>입고 합격 · 미할당</small><strong data-supply-quantity="unallocated-pass">{unallocatedPass===null?'미확인':unallocatedPass} <em>EA</em></strong><span>{s.receipt?`합격 ${s.receipt.pass} − 할당 ${m.receiptAllocated}`:'입고 반영 기록 없음'}</span></div>
    <div><small>현재 계획 확보</small><strong data-supply-quantity="secured">{m.secured} <em>EA</em></strong><span>예약 + 합격분 할당</span></div>
    <div><small>현재 계획 미확보</small><strong data-supply-quantity="unsecured">{m.unsecured} <em>EA</em></strong><span>필요 − 계획 확보</span></div>
   </div>
   <div className="supply-plan-note"><PackageCheck size={14}/><span>입고 합격만으로 계획 확보가 늘지 않습니다. 승인·반영된 합격분을 할당해야 반영되며, 품목·로트 연결은 별도 확인이 필요합니다.</span></div>
  </section>
  <div className="supply-bottom-grid">
   <Panel title="사내 대체품 검토" action={<Button onClick={onComparison}>상세 비교 <ArrowRight size={13}/></Button>}>
    <div className="supply-alternatives">{[...approved,...candidates].map(row=><article className="supply-alternative" key={row.id} data-supply-alternative={row.id}>
     <div className="supply-alternative-title"><WorkflowPhoto id={row.id}/><WorkflowObject id={row.id} detail={resolve(row.id)?.properties['패키지']}/><Badge tone={row.kind==='승인 대체품'?'blue':'amber'}>{row.kind==='승인 대체품'?'범위 승인':'미승인 후보'}</Badge></div>
     <div className="supply-alternative-detail"><div><small>비교 가용</small><QuantityCell value={row.available} unit="EA"/></div><p>{row.kind==='승인 대체품'?<>L1 / U2 / JOB-2609-01<br/>2026.09.01–09.30 · 승인 v1</>:<>회로·열·핀 호환성 미확인<br/>재고·가용 미확인 · 배정 불가</>}</p><Button onClick={()=>onReview(row.id)}>{row.kind==='승인 대체품'?'적용 검토':'기술 검토'}</Button></div>
    </article>)}</div>
    <div className="supply-guard"><TriangleAlert size={15}/><span>승인 대체품도 검토만으로 예약·소비되지 않습니다. 미승인 후보는 확보 수량에 포함하지 않습니다.</span></div>
   </Panel>
   <Panel title="외부 조달 검토" action={<Badge>공급·견적 미연결</Badge>}>
    <div className="supply-procurement">
     <div className="supply-procurement-heading"><ShoppingCart size={21}/><div><strong>원품 비교 부족 {m.comparisonShortage} EA</strong><p>대체품 적용·예약·입고 할당 검토 후 구매 필요량 판단</p></div></div>
     <dl className="supply-unknowns"><div><dt>이 품목 공급사</dt><dd>미연결</dd></div><div><dt>납기·공급 가능량</dt><dd>미확인</dd></div><div><dt>견적·단가·MOQ</dt><dd>미확인</dd></div><div><dt>외부 요청·수신</dt><dd>연결 없음</dd></div></dl>
     <Button disabled title="PART-TPS와 구매 요청·공급사 견적을 잇는 계약이 없습니다.">이 품목 견적 요청 · 미연결</Button>
     <div className="supply-procurement-other"><strong>구매·공급 업무 살펴보기</strong><p>현재 구매 화면은 EVB C / C18,C26의 별도 합성 수요입니다. PoE U2의 공급사·견적으로 연결하지 않습니다. 기존 IM-0008 예시는 별도 범위로 보존합니다.</p><Button onClick={()=>{select(BOM_PURCHASE_DEMO.partId,false);go('PURCHASE')}}>별도 구매 예시 열기 <ArrowRight size={13}/></Button></div>
    </div>
   </Panel>
  </div>
  <div className="supply-next-bar"><div><Boxes size={19}/><span><strong>계획 미확보 {m.unsecured} EA</strong><small>원품 비교 부족 {m.comparisonShortage} EA와 별도 · 실제 재고·전기적 호환성 시뮬레이터 아님</small></span></div><div><Button onClick={()=>select('ALT-01')}>대체 승인 근거</Button><Button primary onClick={openPlan}>수요·예약·입고 검토 <ArrowRight size={14}/></Button></div></div>
 </div>;
}
