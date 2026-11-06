import {useApp} from './context';
import {useEntity} from './entity';
import {Badge,Button,Panel} from './ui';
import {arrivedQuantity,materialQuantities,NOW,totals} from './domain';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,QuantityCell,WorkflowBasis} from './workflow-tables';

const job='JOB-2609-01',configuration='CFG-POE-L1',round='ROUND-01';
const knownText=(value:unknown)=>typeof value==='string'?value:'미등록';

/** Read-only projections of the existing single-plan fixture. No new plan or ledger. */
export function PlanningWorkTable({onStep}:{onStep:(step:number)=>void}){
 const {s}=useApp(),{select}=useEntity(),m=materialQuantities(s);
 const rows=[{id:job,quantity:100,reserved:s.reserved,allocated:s.materialAllocated,unsecured:m.unsecured}];
 return <Panel title="생산 수요·자재 준비 목록" subtitle="합성 계획 1건 · 설계 구성 참고 사진이며 실제 생산 보드 사진이 아닙니다."><WorkflowTable tableKey="planning-work" data={rows} getRowId={r=>r.id} contextId={r=>r.id} searchLabel="생산 작업·구성 검색" columns={[
  {id:'photo',header:'구성 사진',enableHiding:false,cell:()=> <WorkflowPhoto id={configuration}/>},
  {id:'object',header:'작업 · 고정 구성',enableHiding:false,accessorFn:r=>r.id+' ESP32-PoE L1 WROOM',cell:()=> <div className="workflow-stack"><WorkflowObject id={job}/><WorkflowObject id={configuration} detail="L1 WROOM · 100대 계획 관계"/></div>},
  {id:'demand',header:'정상 제품 수요',accessorKey:'quantity',cell:c=><QuantityCell value={c.row.original.quantity} unit="대" note={s.demandConfirmed?'사람 확인 · 투입량 별도':'원문 요청 · 사람 확인 전'}/>},
  {id:'reserved',header:'자기 예약',accessorKey:'reserved',cell:c=><QuantityCell value={c.getValue()} unit="개" note="예약 ≠ 소비"/>},
  {id:'allocated',header:'합격분 할당량',accessorKey:'allocated',cell:c=><QuantityCell value={c.getValue()} unit="개" note="검수 합격분만"/>},
  {id:'unsecured',header:'계획 미확보',accessorKey:'unsecured',cell:c=><QuantityCell value={c.getValue()} unit="개" note="대표 부품 100 − 예약 − 할당"/>},
  {id:'review',header:'계획 상태',accessorFn:()=>s.planSaved?'조건부 계획 저장':s.demandConfirmed?'수요 확인':'수요 확인 전',cell:c=><Badge tone={s.planSaved?'blue':'gray'}>{c.getValue()}</Badge>},
  {id:'unknowns',header:'기한 · 미확인',cell:()=> <span className="workflow-cell-note">요청 09.25 18:00 KST<br/>회차 객체 09.30과 불일치<br/>실장·실제 담당 미확인</span>},
  {id:'next',header:'다음 조치',cell:()=> <Button onClick={()=>{select(job,false);onStep(!s.demandConfirmed?0:3)}}>{!s.demandConfirmed?'수요 확인 입력 열기':'입고·할당 입력 열기'}</Button>},
  {id:'basis',header:'데이터 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="DEMO-DEMAND-01 · DEMO-PLAN-01"/>}
 ]}/><div className="list-footnote">계획 미확보량은 원품 가용까지 고려한 비교 부족량과 다릅니다. 날짜 불일치는 표시만 하며 약속을 변경하지 않습니다.</div></Panel>;
}

export function MaterialRequirementsTable(){
 const {s,go,evidence}=useApp(),{select}=useEntity();
 const rows=[
  {id:'PLAN-MATERIAL-M',objectId:'PART-TPS',part:'시연 부품 M',need:s.demandConfirmed?'100':'수요 미확인',stock:'100',other:'20',available:'80',short:'20',evidence:'DEMO-MATERIAL-01',note:'대표 부품 합성 매핑 · 전체 BOM 아님'},
  {id:'PLAN-MATERIAL-UNRESOLVED',objectId:undefined,part:'NA / NS / Opened 실장 항목',need:'미확인',stock:'미확인',other:'미확인',available:'미확인',short:'미확인',evidence:'SRC-L1-ods',note:'행별 실장·품목 연결 확인 필요'},
  {id:'PLAN-MATERIAL-CANDIDATE',objectId:undefined,part:'대체 부품 후보',need:'호환 근거 필요',stock:'0 (확인된 값)',other:'0',available:'0',short:'산출 보류',evidence:'미제공',note:'이 시연 수요의 후보 품목 ID 미등록'}
 ];
 return <WorkflowTable tableKey="planning-materials" data={rows} getRowId={r=>r.id} contextId={r=>r.objectId} searchLabel="계획 자재·미확인 검색" columns={[
  {id:'photo',header:'품목 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.objectId}/>},
  {id:'object',header:'부품 · 대상',accessorKey:'part',enableHiding:false,cell:c=><div className="workflow-stack"><strong>{c.row.original.part}</strong><WorkflowObject id={c.row.original.objectId} detail={c.row.original.note}/></div>},
  ...(['need','stock','other','available','short'] as const).map((key,i)=>({id:key,accessorKey:key,header:['필요량 / 개','재고 / 개','타 계획 예약 / 개','가용량 / 개','비교 부족 / 개'][i],cell:(c:any)=><span className="workflow-numeric">{c.getValue()}</span>})),
  {id:'next',header:'다음 조치',cell:c=>c.row.original.objectId?<Button onClick={()=>{select('PART-TPS',false);go('MATERIAL')}}>대표 품목·대체 검토</Button>:<Button disabled={c.row.original.evidence==='미제공'} onClick={()=>evidence(c.row.original.evidence)}>{c.row.original.evidence==='미제공'?'후보 근거 미제공':'원본 실장 조건 확인'}</Button>},
  {id:'basis',header:'데이터 기준',cell:c=><WorkflowBasis version={s.version} at={NOW} evidence={c.row.original.evidence}/>}
 ]}/>;
}

export function MaterialReceiptTable(){
 const {s,evidence}=useApp();
 // Evidence is unique under the existing receive() contract; there is no event ID to invent.
 const rows=(s.materialReceipts??[]).map(r=>({...r,id:r.evidence}));
 return <Panel title="반영된 자재 부분 입고·검사 목록" subtitle="각 행은 승인·반영된 한 입고 근거입니다. 입고 합계와 스냅샷 재고를 중복 합산하지 않습니다."><WorkflowTable tableKey="planning-receipts" data={rows} getRowId={r=>r.id} contextId={()=>job} searchLabel="자재 입고 근거 검색" empty="승인·반영된 부분 입고 근거가 없습니다." columns={[
  {id:'photo',header:'품목 사진',enableHiding:false,cell:()=> <WorkflowPhoto/>},
  {id:'object',header:'입고 근거 · 계획',accessorKey:'evidence',enableHiding:false,cell:c=><div className="workflow-stack"><code>{c.row.original.evidence}</code><WorkflowObject id={job} detail="현재 시연 계획 맥락 · 입고 품목·로트 ID 연결 미확인"/></div>},
  {id:'total',header:'도착 수량',accessorKey:'total',cell:c=><QuantityCell value={c.getValue()} unit="개" note="합격 + 불합격 + 대기"/>},
  {id:'pass',header:'합격',accessorKey:'pass',cell:c=><QuantityCell value={c.getValue()} unit="개" note="할당 가능 후보"/>},
  {id:'fail',header:'불합격',accessorKey:'fail',cell:c=><QuantityCell value={c.getValue()} unit="개" note="확보량 제외"/>},
  {id:'pending',header:'검사 대기',accessorKey:'pending',cell:c=><QuantityCell value={c.getValue()} unit="개" note="확보량 제외"/>},
  {id:'review',header:'검토 상태',cell:()=> <Badge tone="blue">승인 버전 반영</Badge>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>evidence(c.row.original.evidence)}>입고 근거 확인</Button>},
  {id:'basis',header:'데이터 기준',cell:c=><WorkflowBasis version={s.version} at={NOW} evidence={c.row.original.evidence}/>}
 ]}/></Panel>;
}

export function ProductionWorkTable({onTab}:{onTab:(tab:string)=>void}){
 const {s}=useApp(),{select}=useEntity();
 const rows=[{id:job,good:s.production,defects:s.defects,pending:s.pendingProduction??0,stock:s.stock}];
 const reviewed=s.drafts.filter(d=>d.payload.kind==='production'&&d.status==='반영 완료'&&d.payload.jobId===job).sort((a,b)=>b.base-a.base)[0];
 return <Panel title="생산 작업·완성품 입고 목록" subtitle="합성 작업 현재 누계 · 생산 실적과 완성품 입고를 서로 더하지 않습니다."><WorkflowTable tableKey="production-work" data={rows} getRowId={r=>r.id} contextId={r=>r.id} searchLabel="생산 작업·구성 검색" columns={[
  {id:'photo',header:'설계 구성 사진',enableHiding:false,cell:()=> <WorkflowPhoto id={configuration}/>},
  {id:'object',header:'작업 · 고정 구성',accessorFn:r=>r.id+' L1 WROOM FG-2609-01',enableHiding:false,cell:()=> <div className="workflow-stack"><WorkflowObject id={job}/><WorkflowObject id={configuration} detail="설계 참고 · 생산 보드 사진 아님"/><code>출력 로트 FG-2609-01 · 객체 미등록</code></div>},
  {id:'good',header:'정상 완료 누계',accessorKey:'good',cell:c=><QuantityCell value={c.getValue()} unit="대" note="불량 재차감 금지"/>},
  {id:'defects',header:'불량 누계',accessorKey:'defects',cell:c=><QuantityCell value={c.getValue()} unit="대" note="생산 판정 수량"/>},
  {id:'pending',header:'판정 대기 누계',accessorKey:'pending',cell:c=><QuantityCell value={c.getValue()} unit="대" note="정상 완료 제외"/>},
  {id:'stock',header:'완성품 입고 누계',accessorKey:'stock',cell:c=><QuantityCell value={c.getValue()} unit="대" note="현재 창고 잔량과 별개"/>},
  {id:'review',header:'생산 실적 상태',cell:()=> <Badge tone={s.observed?'blue':'gray'}>{s.observed?'관측 근거 반영':'관측 미등록 · 초기 0'}</Badge>},
  {id:'owner',header:'작성 / 승인',cell:()=> <span className="workflow-cell-note">{reviewed?reviewed.author+' / '+(reviewed.approvedBy??'미확인'):'미등록'}<br/>실제 작업 담당 미등록</span>},
  {id:'next',header:'다음 조치',cell:()=> <div className="workflow-actions"><Button onClick={()=>{select(job,false);onTab('부분 생산')}}>생산 실적 입력 열기</Button><Button onClick={()=>{select(job,false);onTab('입고·회차 배정')}}>완성품 입고 입력 열기</Button></div>},
  {id:'basis',header:'데이터 기준',cell:()=> <WorkflowBasis version={s.version} at={s.observed||NOW} evidence={reviewed?knownText(reviewed.payload.evidence):'관측 원문 미등록 · 로컬 초기값'}/>}
 ]}/></Panel>;
}

export function DeliveryRoundTable({onTab}:{onTab:(tab:string)=>void}){
 const {s}=useApp(),{select}=useEntity(),t=totals(s);const rows=[{id:round,allocated:s.allocated,available:t.available,shipped:t.shipped,arrived:t.arrived,transit:t.transit,promiseRemaining:t.promiseRemaining}];
 return <Panel title="납품회차 수량 비교" subtitle="약속100대 · 배정·출하·운송·도착은 서로 다른 위치와 누계입니다."><WorkflowTable tableKey="delivery-rounds" data={rows} getRowId={r=>r.id} contextId={r=>r.id} searchLabel="납품회차 검색" columns={[
  {id:'photo',header:'제품 사진',enableHiding:false,cell:()=> <WorkflowPhoto/>},
  {id:'object',header:'납품회차 · 계약',accessorFn:r=>r.id+' CONTRACT-01 DEMO-C01',enableHiding:false,cell:()=> <div className="workflow-stack"><WorkflowObject id={round} detail="제품·구성 관계 미확인"/><WorkflowObject id="CONTRACT-01"/></div>},
  ...(['allocated','available','shipped','arrived','transit','promiseRemaining'] as const).map((key,i)=>({id:key,accessorKey:key,header:['회차 배정','배정 미출하','실제 출하 누계','실제 도착 누계','운송 중','잔여 약속'][i],cell:(c:any)=><QuantityCell value={c.getValue()} unit="대" note={['입고분 명시 배정','배정 − 출하','출발 사건 합계','도착 사건 합계','출하 − 도착','100 − 도착 · 추가 생산 아님'][i]}/>})),
  {id:'unknowns',header:'기한 · 미확인',cell:()=> <span className="workflow-cell-note">화면 요청 09.25 18:00<br/>회차 객체 09.30과 불일치<br/>실제 담당·도착 전망 미확인</span>},
  {id:'next',header:'다음 조치',cell:()=> <Button onClick={()=>{select(round,false);onTab(s.shipments.length?'도착·잔량':'분할 출하')}}>{s.shipments.length?'부분 도착 입력 열기':'출하 입력 열기'}</Button>},
  {id:'basis',header:'데이터 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="DEMO-FUL-01 · 합성 운영 원장"/>}
 ]}/></Panel>;
}

export function ShipmentTable({onArrival}:{onArrival:(id:string)=>void}){
 const {s,evidence}=useApp(),{select}=useEntity();
 return <WorkflowTable tableKey="delivery-shipments" data={s.shipments} getRowId={r=>r.id} contextId={()=>round} searchLabel="출하 ID·근거 검색" empty="아직 반영된 출하가 없습니다." columns={[
  {id:'photo',header:'제품 사진',enableHiding:false,cell:()=> <WorkflowPhoto/>},
  {id:'object',header:'출하 · 연결 회차',accessorFn:r=>r.id+' '+r.evidence,enableHiding:false,cell:c=><div className="workflow-stack"><code>{c.row.original.id}</code><WorkflowObject id={round} detail="출하 객체·보드 목록 미등록"/></div>},
  {id:'qty',header:'이번 출하',accessorKey:'qty',cell:c=><QuantityCell value={c.getValue()} unit="대" note="실제 출발 수량"/>},
  {id:'arrivedQty',header:'도착 누계',accessorFn:r=>arrivedQuantity(r),cell:c=><QuantityCell value={c.getValue()} unit="대" note="이 출하의 부분 도착 합계"/>},
  {id:'remainingQty',header:'미도착',accessorFn:r=>r.qty-arrivedQuantity(r),cell:c=><QuantityCell value={c.getValue()} unit="대" note="출하 − 도착"/>},
  {id:'departure',header:'실제 출발',accessorKey:'departure',cell:c=><time className="workflow-cell-note">{c.getValue()}</time>},
  {id:'arrival',header:'전량 도착 시각',accessorKey:'arrival',cell:c=><span className="workflow-cell-note">{c.getValue()??'전량 도착 미확인'}</span>},
  {id:'review',header:'상태',accessorFn:r=>r.arrival?'납품 완료':arrivedQuantity(r)>0?'부분 도착':'운송 중',cell:c=><Badge tone={c.row.original.arrival?'green':'blue'}>{c.getValue()}</Badge>},
  {id:'next',header:'다음 조치',cell:c=><div className="workflow-actions"><Button disabled={arrivedQuantity(c.row.original)>=c.row.original.qty} onClick={()=>{select(round,false);onArrival(c.row.original.id)}}>{arrivedQuantity(c.row.original)>=c.row.original.qty?'도착 전량 반영됨':'이 출하 도착 입력'}</Button><Button onClick={()=>evidence(c.row.original.evidence)}>출발 근거 확인</Button></div>},
  {id:'basis',header:'데이터 기준',cell:c=><WorkflowBasis version={s.version} at={NOW} evidence={c.row.original.evidence}/>}
 ]}/>;
}

export function ArrivalTable(){
 const {s,evidence}=useApp();const rows=s.shipments.flatMap(sh=>(sh.arrivals??[]).map(r=>({...r,shipment:sh.id})));
 return <WorkflowTable tableKey="delivery-arrivals" data={rows} getRowId={r=>r.id} contextId={()=>round} searchLabel="도착 사건·출하·근거 검색" empty="등록된 부분 도착 사건이 없습니다." columns={[
  {id:'photo',header:'제품 사진',enableHiding:false,cell:()=> <WorkflowPhoto/>},
  {id:'object',header:'도착 사건 · 출하',accessorFn:r=>r.id+' '+r.shipment,enableHiding:false,cell:c=><div className="workflow-stack"><code>{c.row.original.id}</code><strong>{c.row.original.shipment}</strong><WorkflowObject id={round} detail="개별 보드 연결 미확인"/></div>},
  {id:'qty',header:'이번 도착',accessorKey:'qty',cell:c=><QuantityCell value={c.getValue()} unit="대" note="고유 근거별 사건 수량"/>},
  {id:'at',header:'도착 시각',accessorKey:'at',cell:c=><time className="workflow-cell-note">{c.getValue()}</time>},
  {id:'review',header:'검토 상태',cell:()=> <Badge tone="blue">승인 버전 반영</Badge>},
  {id:'evidence',header:'원문 근거',accessorKey:'evidence',cell:c=><button className="text-btn" onClick={()=>evidence(c.getValue())}>{c.getValue()}</button>},
  {id:'basis',header:'조회 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="동일 회차 · 합성 부분 도착 원장"/>}
 ]}/>;
}

export function FulfillmentComparisonTable({snapshot}:{snapshot:{version:number;totals:ReturnType<typeof totals>}}){
 const {s}=useApp(),current=totals(s);const labels:Record<string,string>={warehouse:'창고 잔량',arrived:'납품 완료',transit:'운송 중',promiseRemaining:'잔여 약속',targetRemaining:'정상 목표 잔량',unstocked:'미입고',shipped:'출하 누계',available:'배정 미출하'};
 const rows=Object.keys(current).map(key=>({id:key,name:labels[key],before:snapshot.totals[key as keyof typeof current],after:current[key as keyof typeof current]}));
 return <WorkflowTable tableKey="delivery-comparison" data={rows} getRowId={r=>r.id} contextId={()=>round} searchLabel="납품 수량 의미 검색" columns={[
  {id:'object',header:'같은 계약·회차·약속·계획',accessorKey:'name',enableHiding:false,cell:c=><div className="workflow-stack"><strong>{c.getValue()}</strong><WorkflowObject id={round}/></div>},
  {id:'before',header:`이전 v${snapshot.version}`,accessorKey:'before',cell:c=><QuantityCell value={c.getValue()} unit="대" note="저장한 비교 기준"/>},
  {id:'after',header:`현재 v${s.version}`,accessorKey:'after',cell:c=><QuantityCell value={c.getValue()} unit="대" note="현재 승인 자료"/>},
  {id:'basis',header:'데이터 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="같은 회차 · 서로 다른 수량 행은 합산 금지"/>}
 ]}/>;
}
