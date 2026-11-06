import {useId,useRef,useState} from 'react';
import {ArrowRight,ChevronDown,GitCompareArrows,Network} from 'lucide-react';
import {useApp} from './context';
import {EntityChip,TraceGraph,useEntity} from './entity';
import {Badge,Button,Field,Notice} from './ui';
import {type Draft,type Payload} from './domain';
import {impactMetrics,impactNextStep,projectChangeImpact,type ImpactKind,type ImpactMetrics} from './change-impact-model';
import './change-impact.css';
import {GraphConnectionPanel} from './graph-connection';

const receiptKeys=['total','pass','fail','pending'] as const;
const receiptLabels={total:'가정 도착 수량',pass:'가정 합격 수량',fail:'가정 불합격 수량',pending:'가정 검수 대기 수량'};
type ReceiptValues=Record<(typeof receiptKeys)[number],string>;
const receiptValues=(draft?:Draft):ReceiptValues=>Object.fromEntries(receiptKeys.map(key=>[key,String(draft?.payload[key]??({total:50,pass:40,fail:5,pending:5}[key]))])) as ReceiptValues;
const number=(value:number|null)=>value===null?'미등록':value.toLocaleString('ko-KR')+'개';

export function ChangeImpactPanel({kind,draft}:{kind?:ImpactKind;draft?:Draft}){
 const {s}=useApp(),{company}=useEntity();
 const [open,setOpen]=useState(false),id=useId();
 const current=draft?((draft.companyId??'A')===company?draft:undefined):s.drafts.find(item=>(item.companyId??'A')===company&&item.payload.kind===kind);
 const effectiveKind=current?.payload.kind??kind;
 if(company!=='A'||(draft&&(draft.companyId??'A')!==company))return null;
 return <section className="change-impact" data-change-impact={effectiveKind??'other'}>
  <button type="button" className="impact-toggle" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><span><GitCompareArrows size={17}/>변경 영향·연결 보기</span><span className="impact-toggle-meta">로컬 조회 · 데이터 v{s.version}<ChevronDown size={16}/></span></button>
  {open&&<div id={id}><ImpactBody key={(current?.id??'unsaved')+':'+(current?.hash??effectiveKind)} kind={effectiveKind} draft={current}/></div>}
 </section>;
}

function ImpactBody({kind,draft}:{kind?:string;draft?:Draft}){
 const {s,evidence}=useApp(),{resolve}=useEntity();
 const baseline=useRef({version:s.version,metrics:impactMetrics(s)});
 const [values,setValues]=useState<ReceiptValues>(()=>receiptValues(draft)),[experiment,setExperiment]=useState(!draft&&kind==='material_receipt'),[graph,setGraph]=useState(false);
 const applied=!!draft&&(draft.status==='반영 완료'||!!s.applied[draft.requestKey]);
 const stale=!!draft&&!applied&&draft.base!==s.version;
 const hypothesis:Payload|undefined=kind==='material_receipt'&&experiment?{kind:'material_receipt',...Object.fromEntries(receiptKeys.map(key=>[key,values[key].trim()===''?Number.NaN:Number(values[key])])),evidence:draft?.payload.evidence??'LOCAL-WHATIF-RECEIPT-'+s.version}:undefined;
 const projection=projectChangeImpact(s,draft,hypothesis);
 const current=projection.current,projected=projection.projected;
 const rows:{label:string;value:(m:ImpactMetrics)=>string}[]=kind==='bom'?
  [{label:'사용자 승인 구성',value:m=>m.bomApplied?'로컬 반영됨':'미반영'},{label:'계획 예약',value:m=>number(m.secured-m.receiptAllocated)},{label:'계획 미확보',value:m=>number(m.unsecured)}]:
  [{label:'입고 누계',value:m=>number(m.receiptTotal)},{label:'합격 누계',value:m=>number(m.receiptPass)},{label:'합격 미할당',value:m=>number(m.unallocatedPass)},{label:'이 계획 예약',value:m=>number(m.secured-m.receiptAllocated)},{label:'이 계획 합격 할당',value:m=>number(m.receiptAllocated)},{label:'이 계획 미확보',value:m=>number(m.unsecured)}];
 const changed=baseline.current.version!==s.version;
 const canPreview=(kind==='bom'||kind==='material_receipt')&&!stale&&!applied;
 return <div className="impact-body">
  <div className="impact-badges"><Badge tone="blue">로컬 상태에 따라 재계산</Badge><Badge>{experiment?'격리된 가정 입력':draft?'저장 초안 기준':'초안 없음'}</Badge><span>원장 v{s.version} · 초안 {draft?'v'+draft.version+' / '+draft.status:'미등록'}</span></div>
  <p className="impact-explanation">승인은 정확한 초안에 대한 검토 기록입니다. <strong>확정 상태와 수량은 별도 반영 후에 바뀝니다.</strong> 아래 가정은 초안·원장·권한을 변경하지 않습니다.</p>
  {draft&&<div className="impact-draft"><code>{draft.id}</code><span>작성 {draft.author} → 승인 {draft.approvedBy??'대기'}</span><span>기준 v{draft.base} · 초안 v{draft.version}</span><button type="button" className="text-btn" onClick={()=>evidence(String(draft.payload.evidence).split(' · ')[0])}>저장 초안 근거 확인</button></div>}
  {(projection.status==='stale'||projection.status==='invalid'||projection.status==='unsupported')&&<Notice tone="warning"><span role="status">{projection.reason}</span></Notice>}
  {applied&&<Notice tone="success">정확 승인 버전의 로컬 반영 상태입니다. 입고 후보를 현재 누계에 중복 합산하지 않습니다.</Notice>}
  {projection.status==='none'&&<Notice>{projection.reason}</Notice>}
  <div className="impact-stage-strip" aria-label="승인과 반영 상태 구분">
   <div><span>1 · 저장 초안</span><strong>{draft?'v'+draft.version+' · '+draft.author:'미등록'}</strong><small>작성 중 입력과 별개</small></div><ArrowRight size={15}/>
   <div><span>2 · 별도 승인</span><strong>{draft?.approvedBy??'승인 대기'}</strong><small>승인만으로 원장 변경 없음</small></div><ArrowRight size={15}/>
   <div><span>3 · 로컬 반영</span><strong>{applied?'반영 완료':'미반영 후보'}</strong><small>현재 데이터 v{s.version}</small></div>
  </div>
  <div className="impact-comparison-scroll"><table className="impact-comparison"><caption>현재 반영 상태와 변경 가정 비교</caption><thead><tr><th scope="col">확인 항목</th><th scope="col">패널 열 때 · v{baseline.current.version}</th><th scope="col">현재 반영 · v{s.version}</th><th scope="col">{applied?'반영 후 확인':'가정 반영 후 · 미확정'}</th></tr></thead><tbody>{rows.map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.value(baseline.current.metrics)}</td><td className={changed&&row.value(baseline.current.metrics)!==row.value(current)?'impact-delta':undefined}>{row.value(current)}</td><td className="impact-candidate">{applied?row.value(current):projected?row.value(projected):'예측 없음'}</td></tr>)}</tbody></table></div>
  <small className="impact-basis">비교 기준은 이 패널을 열었을 때의 조회 값입니다. 같은 데이터 버전에서도 승인 상태는 따로 바뀔 수 있습니다. {projection.status==='candidate'&&projection.reason}</small>
  {kind==='material_receipt'&&!applied&&<div className="impact-experiment" data-view-state="true">
   <div className="impact-experiment-heading"><label className="check"><input type="checkbox" checked={experiment} disabled={stale} onChange={event=>setExperiment(event.target.checked)}/>가정 입력 · 초안/원장 변경 없음</label><Button disabled={!draft} onClick={()=>{setValues(receiptValues(draft));setExperiment(false)}}>저장 초안 값으로 복원</Button></div>
   {experiment&&<><p>예: 도착50·합격40·불합격5·대기5에서, 합격30·대기15로 바꾸면 할당 가능한 합격분의 차이를 볼 수 있습니다. 저장된 Alice의 초안은 그대로입니다.</p><div className="impact-input-grid">{receiptKeys.map(key=><Field key={key} label={receiptLabels[key]}><input type="number" min="0" step="1" disabled={stale} value={values[key]} onChange={event=>setValues({...values,[key]:event.target.value})}/></Field>)}</div>{draft&&<p className="impact-saved-values">저장 초안: 도착 {String(draft.payload.total)} · 합격 {String(draft.payload.pass)} · 불합격 {String(draft.payload.fail)} · 대기 {String(draft.payload.pending)}개</p>}</>}
  </div>}
  <div className="impact-next" aria-live="polite"><strong>현재 상태에서 다음 확인</strong><p>{kind==='bom'?current.bomApplied?'승인 구성의 원문·미확인 항목을 재조회하고 생산 계획의 적용 구성을 별도로 확인하세요.':'원본과 미확인 항목 검토 → 초안 저장 → 별도 승인 → 정확 버전 반영을 확인하세요.':impactNextStep(current,s.demandConfirmed)}</p>{projected&&canPreview&&kind==='material_receipt'&&<><strong>이 가정이 별도 승인·반영된다면</strong><p>{impactNextStep(projected,s.demandConfirmed)}</p></>}<small>규칙 기반 계산 안내 · LLM 자동 추천 아님 · 선택이나 입력만으로 실행하지 않음</small></div>
  <div className="impact-links"><span>기존 연결 탐색</span>{resolve('CFG-POE-L1')&&<EntityChip id="CFG-POE-L1"/>}{kind==='material_receipt'&&resolve('PART-TPS')&&<EntityChip id="PART-TPS"/>}<Button onClick={()=>setGraph(!graph)} aria-expanded={graph}><Network size={15}/>{graph?'관계 그래프 접기':'기존 관계 그래프 보기'}</Button></div>
  {graph&&<div className="impact-graph"><Notice>실제 공개 BOM의 설계 연결과 합성 품목 매핑을 구분합니다. 현재 조회는 기존 연결이며 승인으로 새 선이 추가된 것은 아닙니다.</Notice><TraceGraph mode="design" rootId={kind==='material_receipt'?'PART-TPS':'CFG-POE-L1'}/></div>}
  <GraphConnectionPanel/><p className="impact-limit">입고 후보에는 품목·로트 ID 연결이 없어 LOT-L07의 실물 입고로 연결하지 않습니다. RES-01은 다른 계획의20개 예약이며 이 계획 예약과 별개입니다. 별도 로컬 그래프 서버는 조회 사본을 갱신합니다. 다른 사용자 동시 편집·운영 서버 알림·RDF/OWL 엔진은 미연결입니다.</p>
 </div>;
}
