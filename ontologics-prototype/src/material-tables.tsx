import {useApp} from './context';
import {useEntity} from './entity';
import {Badge,Button,Panel} from './ui';
import {NOW,materialQuantities,type State} from './domain';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,QuantityCell,WorkflowBasis} from './workflow-tables';

type MaterialComparisonRow={id:string;kind:string;stock:number|null;reserved:number|null;available:number|null;scope:string;status:string;reason:string;lead:string};

export function MaterialComparisonTable({rows,onReview}:{rows:MaterialComparisonRow[];onReview:(id:string)=>void}){
 const {s}=useApp(),{resolve}=useEntity();
 return <WorkflowTable tableKey="material-comparison" data={rows} getRowId={r=>r.id} contextId={r=>r.id} searchLabel="품목·대체 구분·적용 범위 검색" columns={[
  {id:'photo',header:'품목 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.id}/>},
  {id:'object',header:'사내 품목 · 구분',enableHiding:false,accessorFn:r=>r.id+' '+(resolve(r.id)?.name??'')+' '+r.kind,cell:c=><div className="workflow-stack"><WorkflowObject id={c.row.original.id}/><Badge>{c.row.original.kind}</Badge></div>},
  {id:'stock',accessorFn:r=>r.stock??undefined,header:'재고 스냅샷',sortUndefined:'last',cell:c=><QuantityCell value={c.row.original.stock} unit="EA" note={c.row.original.stock===null?'조회 근거 미확인':'입고 예정 제외'}/>},
  {id:'reserved',accessorFn:r=>r.reserved??undefined,header:'타 계획 예약',sortUndefined:'last',cell:c=><QuantityCell value={c.row.original.reserved} unit="EA" note="자기 예약 재차감 금지"/>},
  {id:'available',accessorFn:r=>r.available??undefined,header:'비교 가용량',sortUndefined:'last',cell:c=><QuantityCell value={c.row.original.available} unit="EA" note="실제 투입·소비 아님"/>},
  {id:'scope',accessorKey:'scope',header:'적용 범위',cell:c=><span className="workflow-cell-note">{c.getValue()}</span>},
  {id:'review',accessorKey:'status',header:'검토 상태',cell:c=><Badge tone={c.getValue()==='기술 검토 필요'?'amber':'blue'}>{c.getValue()}</Badge>},
  {id:'unknowns',accessorFn:r=>r.lead+' '+(r.stock===null?'재고·가용 미확인':r.id==='PART-ALT'?'범위 밖 호환성·실제 사용 여부 미확인':'실제 사용 여부 미확인'),header:'조달 · 미확인',cell:c=><div className="workflow-cell"><span>{c.row.original.lead}</span><small>{c.row.original.id==='PART-CAND'?'승인 전 배정 불가':'범위 밖 호환성·실제 사용 여부 미확인'}</small></div>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>onReview(c.row.original.id)}>검토하기</Button>},
  {id:'basis',accessorKey:'reason',header:'데이터 기준 · 근거',cell:c=><WorkflowBasis version={s.version} at={NOW} evidence={c.row.original.reason}/>}
 ]} footer="가용량은 지정된 비교 범위의 스냅샷입니다. 대체품 재고를 원품과 자동 합산하거나 후보를 승인품으로 취급하지 않습니다."/>;
}

function inventoryHistory(s:State){
 const seen=new Map<string,number>();
 // Existing log() prepends events. Number duplicate display rows from the oldest end.
 return [...s.events].reverse().map(event=>{const base=JSON.stringify([event.time,event.action,event.detail]);const n=seen.get(base)??0;seen.set(base,n+1);return {...event,id:base+'#'+n}}).reverse().filter(e=>/예약|입고|할당|소비|반납/.test(e.action));
}

export function MaterialInventoryTables(){
 const {s,go}=useApp(),{select,resolve}=useEntity(),m=materialQuantities(s);
 const openPlan=()=>{select('JOB-2609-01',false);go('UI07')};
 const lots=[{id:'LOT-L07',part:'PART-TPS',stock:100,other:20,available:80}];
 const reservations=[
  {id:'RES-01',object:'RES-01',photo:'LOT-L07',quantity:20,scope:'타 계획 · LOT-L07',kind:'타 계획 예약',note:'기존 고정 예약 · 소비 기록과 별개',evidence:'SYN-RES-01 · 고정 스냅샷 v1'},
  {id:'CURRENT-PLAN-RESERVATION',object:'JOB-2609-01',photo:undefined,quantity:s.reserved,scope:'현재 시연 계획 · 로트별 배정 미연결',kind:'자기 계획 예약',note:'원품 비교 가용80 EA에서 예약 · 별도 사건 ID 미등록',evidence:'DEMO-MATERIAL-01 · 계획 수준 기록'}
 ];
 return <>
 <Panel title="로트·예약 현황" subtitle="재고 로트의 고정 스냅샷과 현재 계획 기록을 구분합니다. 입고 할당을 L07 재고로 추정 합산하지 않습니다.">
 <WorkflowTable tableKey="inventory-lots" data={lots} getRowId={r=>r.id} contextId={r=>r.id} searchLabel="재고 로트·품목 검색" columns={[
  {id:'photo',header:'로트 품목 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.id}/>},
  {id:'object',header:'재고 로트 · 품목',enableHiding:false,accessorFn:r=>r.id+' '+r.part+' '+(resolve(r.id)?.name??'')+' '+(resolve(r.part)?.name??''),cell:c=><div className="workflow-stack"><WorkflowObject id={c.row.original.id}/><WorkflowObject id={c.row.original.part}/></div>},
  {id:'stock',accessorKey:'stock',header:'재고 스냅샷',cell:c=><QuantityCell value={c.getValue()} unit="EA" note="LOT-L07 고정 예시"/>},
  {id:'reserved',accessorKey:'other',header:'타 계획 예약',cell:c=><QuantityCell value={c.getValue()} unit="EA" note="RES-01 · 소비 아님"/>},
  {id:'available',accessorKey:'available',header:'비교 가용',cell:c=><QuantityCell value={c.getValue()} unit="EA" note="100 − 20 · 자기 예약 재차감 금지"/>},
  {id:'review',header:'확인 상태',cell:()=> <Badge>합성 재고 스냅샷</Badge>},
  {id:'unknowns',header:'미확인',cell:()=> <span className="workflow-cell-note">실제 재고 이동·소비·장착 근거 미연결</span>},
  {id:'next',header:'다음 조치',cell:()=> <Button onClick={openPlan}>계획 예약·입고 열기</Button>},
  {id:'basis',header:'데이터 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="SYN-STOCK-01 · SYN-RES-01 · 고정 스냅샷 v1"/>}
 ]}/>
 </Panel>
 <Panel title="타 계획 예약·자기 계획 구분" subtitle="입고 합격분 할당은 별도 근거이며, 예약을 실제 소비로 해석하지 않습니다.">
 <WorkflowTable tableKey="inventory-reservations" data={reservations} getRowId={r=>r.id} contextId={r=>r.object} searchLabel="예약·계획·범위 검색" columns={[
  {id:'photo',header:'연결 품목 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.photo}/>},
  {id:'object',header:'예약 · 계획 객체',enableHiding:false,accessorFn:r=>r.object+' '+(resolve(r.object)?.name??'')+' '+r.kind,cell:c=><WorkflowObject id={c.row.original.object} detail={c.row.original.kind}/>},
  {id:'quantity',accessorKey:'quantity',header:'예약 수량',cell:c=><QuantityCell value={c.getValue()} unit="EA" note={c.row.original.note}/>},
  {id:'scope',accessorKey:'scope',header:'적용 범위'},
  {id:'status',header:'상태',cell:c=><Badge>{c.row.original.id==='RES-01'?'예약 · 소비 기록과 별개':c.row.original.quantity===0?'예약0 · 확인된 값':'계획 수준 예약'}</Badge>},
  {id:'next',header:'다음 조치',cell:()=> <Button onClick={openPlan}>예약·해제 입력 열기</Button>},
  {id:'basis',accessorKey:'evidence',header:'데이터 기준',cell:c=><WorkflowBasis version={s.version} at={NOW} evidence={c.getValue()}/>}
 ]} footer={<>현재 계획: 자기 예약 {s.reserved} EA · 별도 합격 입고 할당 {m.receiptAllocated} EA · 계획 미확보 {m.unsecured} EA. 비교 부족 {m.comparisonShortage} EA와 구별하며, 입고 할당의 로트 연결은 미확인입니다.</>}/>
 </Panel>
 <Panel title="예약·입고 관련 원문 이력" subtitle="원문 사건에 없는 품목·로트·단위·상태를 추정하지 않습니다. 실제 수불 원장 연결은 미지원입니다.">
 <WorkflowTable tableKey="inventory-history" data={inventoryHistory(s)} getRowId={r=>r.id} contextId={()=>undefined} searchLabel="재고 관련 사건·원문 검색" empty="현재 조건에 기록된 예약·입고 이력이 없습니다." columns={[
  {id:'eventTime',accessorKey:'time',header:'기록 시각',cell:c=><time>{new Date(c.getValue()).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</time>},
  {id:'action',accessorKey:'action',header:'업무',enableHiding:false},
  {id:'detail',accessorKey:'detail',header:'수량·근거 원문',enableHiding:false},
  {id:'unknowns',header:'미확인',cell:()=> <span className="workflow-cell-note">구조화 품목·로트·사건 ID 미등록</span>},
  {id:'basis',header:'기준 · 범위',cell:()=> <span className="workflow-cell-note">로컬 시연 감사 기록<br/>객체 관계·장착 증거 아님</span>}
 ]}/>
 </Panel>
 </>;
}
