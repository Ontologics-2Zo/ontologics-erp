import {ChangeImpactPanel} from './change-impact';
import {useState,useEffect,useRef} from 'react';
import {ShieldCheck} from 'lucide-react';
import {useApp} from './context';
import {Badge,Button,Notice,Panel,Field,Modal,useStored} from './ui';
import {type Draft,type State,type Actor} from './domain';
import {useEntity} from './entity';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,QuantityCell,WorkflowBasis} from './workflow-tables';
import type {ActionCommand,ActionOperation,ActionResult} from './ports';

const statusTone=(s:string)=>s==='반영 완료'?'green':s==='승인'?'blue':s==='반려'?'red':'amber';
function requireCompleted(result:ActionResult){if(result.status!=='completed')throw new Error(result.status==='unknown'?'요청 결과 미확인: 새 쓰기를 보내지 말고 기존 요청 상태를 확인하세요.':result.error??'요청을 처리하지 못했습니다.');}
function Req({ids}:{ids:string}){return <div className="req"><ShieldCheck size={13}/>{ids}</div>}

function targetReference(d:Draft,s:State):{id?:string;reference:string}{
 const p=d.payload;
 // Only explicit references and the pre-existing fixed BOM/trace contracts identify a target.
 if(p.kind==='bom'&&String(p.evidence).includes('SRC-L1-ods'))return {id:'CFG-POE-L1',reference:'L1 원본 등록 검토'};
 if(p.kind==='trace'&&d.before&&Object.hasOwn(d.before,'U104제거'))return {id:'U104',reference:'U104 제거·확인 범위 보완'};
 for(const key of ['board','part','configurationId','jobId'])if(typeof p[key]==='string'&&p[key])return {id:String(p[key]),reference:String(p[key])};
 if(p.kind==='supply'){
  const order=s.docs.flatMap(doc=>{try{const o=JSON.parse(doc.body);return o.type==='purchase-order'&&o.orderId===p.orderId?[o]:[]}catch{return []}})[0];
  if(typeof order?.part==='string')return {id:order.part,reference:String(p.orderId)+' · 내부 발주 품목'};
 }
 return {reference:String(p.orderId??p.shipment??'대상 연결 미확인')};
}
function quantitySummary(d:Draft){
 const p=d.payload;const number=(key:string)=>typeof p[key]==='number'&&Number.isFinite(p[key])?Number(p[key]):null;
 switch(p.kind){
  case 'production':return {value:number('good'),unit:'대',note:`정상 완료 누계 · 총 ${p.total} / 불량 ${p.defects} / 대기 ${p.pending??0}`};
  case 'stock':return {value:number('qty'),unit:'대',note:'완성품 입고 누계'};
  case 'shipment':return {value:number('qty'),unit:'대',note:'이번 분할 출하'};
  case 'arrival':return {value:number('qty'),unit:'대',note:'이번 부분 도착'};
  case 'material_receipt':return {value:number('total'),unit:'개',note:`이번 입고 · 합격 ${p.pass} / 불합격 ${p.fail} / 대기 ${p.pending}`};
  case 'purchase_order':return {value:number('qty'),unit:String(p.unit??'개'),note:'내부 주문 수량 · 미송신'};
  case 'supply':return {value:number('qty'),unit:'개',note:'이번 회신 확인 · 입고 아님'};
  case 'contract':return {value:number('qty'),unit:'대',note:'회차 약속 검토량'};
  default:return null;
 }
}
function nextReview(d:Draft,actor:Actor,version:number){
 if(d.status==='반영 완료')return '동일 요청 상태 확인';
 if(d.base!==version)return '기준 변경 · 새 버전 검토';
 if(d.status==='초안')return actor===d.author?'작성자 검토 요청 가능':'작성자 요청 대기';
 if(d.status==='검토 요청')return actor===d.author?'자기 승인 불가':actor==='Bob'?'별도 승인 검토 가능':'조회 전용 · 승인 권한 없음';
 if(d.status==='승인')return actor==='Viewer'?'조회 전용 · 반영 권한 없음':'정확 승인 버전 반영 검토';
 return actor===d.author?'새 버전으로 재검토':'작성자 보완 대기';
}
function historyRows(s:State){
 const counts=new Map<string,number>();
 return [...s.events].reverse().map(event=>{const key=JSON.stringify([event.time,event.action,event.detail]);const occurrence=counts.get(key)??0;counts.set(key,occurrence+1);return {...event,id:key+'#'+occurrence}}).reverse();
}

export function Reviews(){
 const {s,actor,run,busy,go,toast,evidence,action,setReviewContext}=useApp();
 const {resolve,select:selectObject,selectedId}=useEntity();
 const [selected,select]=useState<string|null>(null),[comment,setComment]=useState('');
 const [openRequest,setOpenRequest]=useStored('workflow-view-review-open','');
 const [filter,setFilter]=useStored('workflow-view-review-filter','전체'),[active,setActive]=useStored('workflow-view-review-context','');
 const d=s.drafts.find(x=>x.id===selected);
 const target=(draft:Draft)=>{const ref=targetReference(draft,s);return {...ref,id:ref.id&&resolve(ref.id)?ref.id:undefined}};
 const activeDraft=s.drafts.find(x=>x.id===active);const activeTarget=activeDraft?target(activeDraft).id:undefined;
 const reviewContextRef=useRef(setReviewContext);reviewContextRef.current=setReviewContext;
 useEffect(()=>{reviewContextRef.current(activeDraft&&activeTarget&&activeTarget===selectedId?activeDraft.id:null);},[activeDraft?.id,activeDraft?.version,activeTarget,selectedId]);
 useEffect(()=>()=>reviewContextRef.current(null),[]);
 const activate=(draft:Draft)=>{setActive(draft.id);setReviewContext(target(draft).id?draft.id:null)};
 const openReview=(draft:Draft)=>{const id=target(draft).id;if(id)selectObject(id,false);activate(draft);select(draft.id);setComment('')};
 // One-time navigation intent. Opening an exact draft does not alter the list filter or execute an action.
 useEffect(()=>{if(!openRequest)return;const requested=s.drafts.find(x=>x.id===openRequest);setOpenRequest('');if(requested)openReview(requested);},[openRequest,s.drafts]);
 const perform=(operation:ActionOperation,message:string,extra:Partial<ActionCommand>={})=>run(async()=>{if(!d)return;const result=await action({operation,draftId:d.id,...extra},operation==='draft.apply'?d.requestKey:undefined);requireCompleted(result);if(operation==='draft.revise'&&result.draft)openReview(result.draft);toast(message);});
 return <>
 <div className="page-title"><div><span className="eyebrow">UI05 / MANUFACTURING OPERATIONS</span><h1>검토·승인</h1><p>초안 작성, 사람 승인, 승인된 버전 반영은 서로 다른 상태입니다.</p></div></div>
 <Notice>UI 권한 시뮬레이션 · 작성자 분리와 정확 버전·해시는 공통 ActionPort에서 확인합니다. 실제 서버 권한 통제는 미연결입니다.</Notice>
 <Panel title="등록·정정 검토 목록" subtitle="목록 선택은 승인이나 반영이 아닙니다. 정확한 초안 내용과 근거는 검토 열기에서 확인합니다." action={<select data-view-state="true" aria-label="검토 상태 필터" value={filter} onChange={e=>setFilter(e.target.value)}>{['전체','초안','검토 요청','승인','반영 완료','보완 요청','반려'].map(x=><option key={x}>{x}</option>)}</select>}>
 <WorkflowTable tableKey="reviews" data={s.drafts.filter(x=>filter==='전체'||x.status===filter)} getRowId={row=>row.id} contextId={row=>target(row).id} activeId={!activeTarget||activeTarget===selectedId?active:undefined} onActivate={activate} pageSizes={[5,15,30]} searchLabel="검토명·초안 ID·작성자 검색" empty="현재 조건의 초안이 없습니다." columns={[
  {id:'photo',header:'대상 사진',enableHiding:false,cell:c=><WorkflowPhoto id={target(c.row.original).id}/>},
  {id:'object',header:'검토 대상 · 객체',enableHiding:false,accessorFn:r=>r.title+' '+r.id+' '+target(r).reference,cell:c=><div className="workflow-object"><button className="text-btn" onClick={()=>openReview(c.row.original)}>{c.row.original.title}</button><small className="mono">{c.row.original.id} · 초안 v{c.row.original.version}</small><WorkflowObject id={target(c.row.original).id} detail={target(c.row.original).reference}/></div>},
  {id:'quantity',header:'검토 수량 / 의미',accessorFn:r=>quantitySummary(r)?.value??undefined,sortUndefined:'last',sortingFn:(a,b)=>{const x=quantitySummary(a.original),y=quantitySummary(b.original);return (x?.unit??'').localeCompare(y?.unit??'')||(x?.note??'').localeCompare(y?.note??'')||(x?.value??0)-(y?.value??0)},cell:c=>{const q=quantitySummary(c.row.original);return q?<QuantityCell {...q}/>:<div className="workflow-cell"><span>해당 없음</span><small>{c.row.original.payload.kind==='bom'?'구성 등록':c.row.original.payload.kind==='trace'?'제거·기간 보완':'식별자 등록'}</small></div>}},
  {id:'status',header:'검토 상태',accessorKey:'status',cell:c=><div className="workflow-cell"><Badge tone={statusTone(c.getValue())}>{c.getValue()}</Badge><small>{c.row.original.base!==s.version&&c.getValue()!=='반영 완료'?'기준 변경 · 재검토 필요':c.getValue()==='승인'?'승인됨 · 아직 미반영':c.getValue()==='반영 완료'?'정확 승인 버전 반영':'아직 미반영'}</small></div>},
  {id:'author',header:'작성 / 승인',accessorFn:r=>r.author+' '+(r.approvedBy??''),cell:c=><div className="workflow-cell"><span>{c.row.original.author}</span><small>승인 {c.row.original.approvedBy??'미승인'}</small></div>},
  {id:'version',header:'초안 / 기준 버전',accessorFn:r=>r.version,cell:c=><div className="workflow-cell"><span>초안 v{c.row.original.version} · 기준 v{c.row.original.base}</span><small>현재 데이터 v{s.version}</small></div>},
  {id:'basis',header:'시각 · 근거',accessorFn:r=>String(r.payload.evidence),cell:c=><WorkflowBasis version={c.row.original.base} at={typeof c.row.original.payload.at==='string'?c.row.original.payload.at:typeof c.row.original.payload.needBy==='string'?'필요일 '+c.row.original.payload.needBy:'사건 시각 미기록'} evidence={String(c.row.original.payload.evidence)}/>},
  {id:'next',header:'다음 조치 · 권한',cell:c=><div className="workflow-cell"><Button data-focus-key={c.row.original.id} onClick={()=>openReview(c.row.original)}>검토 열기</Button><small>{nextReview(c.row.original,actor,s.version)}</small></div>}
 ]}/>
 <div className="list-footnote">누계·이번 사건 수량·약속량은 합산하지 않습니다. 대상 연결 미확인 초안은 이전 객체와 묶어 AI에 전달하지 않습니다. 생산·입고·발주 등의 초안 수량은 확정 실적으로 집계하지 않습니다.</div>
 </Panel>
 <Panel title="검토·반영 이력" subtitle="반려·승인·정정 시 이전 기록을 지우지 않습니다. 원문 기록에 없는 객체·버전은 추정하지 않습니다.">
 <WorkflowTable tableKey="review-history" data={historyRows(s)} getRowId={row=>row.id} contextId={()=>undefined} onActivate={()=>{setActive('');setReviewContext(null)}} pageSizes={[5,15,30]} searchLabel="이력 검색" empty="기록한 업무·검토 이력이 없습니다." columns={[
  {accessorKey:'action',header:'행동',enableHiding:false},{accessorKey:'detail',header:'대상 / 결과',cell:c=><span style={{whiteSpace:'normal',overflowWrap:'anywhere'}}>{c.getValue()}</span>},
  {accessorKey:'time',header:'기록 시각',cell:c=>new Date(c.getValue()).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})},
  {id:'scope',header:'기준 / 범위',cell:()=> <div className="workflow-cell"><Badge>로컬 감사 기록</Badge><small>객체·버전 구조화 연결 미등록</small></div>}
 ]}/>
 </Panel>
 <Modal open={!!d} onClose={()=>select(null)} title={d?.title??'검토'} description="내용과 원본을 확인한 뒤 정확한 버전을 검토하세요.">{d&&<><div className="review-summary"><Badge tone={statusTone(d.status)}>{d.status}</Badge><span>{d.id} · v{d.version} · 작성자 {d.author}</span></div><dl className="details"><dt>기준 / 현재 데이터</dt><dd>v{d.base} / v{s.version}</dd><dt>내용 SHA-256</dt><dd className="mono">{d.hash}</dd><dt>승인자 / 승인 해시</dt><dd>{d.approvedBy??'승인 전'} · {d.approvedHash??'없음'}</dd><dt>동일 요청 식별자</dt><dd className="mono">{d.requestKey}</dd><dt>변경 전</dt><dd>데이터 v{d.base} · {Object.entries(d.before??{}).map(([k,v])=>`${k}: ${typeof v==='object'?JSON.stringify(v):v}`).join(' / ')}</dd></dl><h3>변경 후 후보</h3><table><tbody>{Object.entries(d.payload).map(([k,v])=><tr key={k}><th>{({kind:'업무 종류',evidence:'근거',good:'정상 완료',qty:'수량',at:'기록 시각',coverage:'확인 범위',removed:'제거 시각',mapping:'원본 매핑',reviewed:'원문 검토',defects:'불량 누계',pending:'판정·검사 대기',total:'총수량',shipment:'출하 ID',sourceHash:'원본 해시',unknown:'미확인',board:'보드 ID',pass:'합격',fail:'불합격'} as Record<string,string>)[k]??k}</th><td>{typeof v==='boolean'?(v?'확인':'미확인'):String(v)}</td></tr>)}</tbody></table>{(d.payload.kind==='bom'||d.payload.kind==='material_receipt')&&<ChangeImpactPanel draft={d}/>}<div className="actions"><Button onClick={()=>evidence(String(d.payload.evidence).startsWith('SRC')?'SRC-L1-ods':String(d.payload.evidence).split(' · ')[0])}>원본 근거 확인</Button><Button onClick={()=>{go(d.origin);select(null)}}>원래 업무로 돌아가기</Button></div><Field label="검토 의견 · 보완/반려 시 필수"><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="확인할 항목과 필요한 근거를 적어주세요."/></Field>{d.comment&&<Notice>{d.comment}</Notice>}
 <div className="actions">{d.status==='초안'&&<Button primary disabled={busy||actor!==d.author} title={actor!==d.author?'작성자만 검토 요청 가능':''} onClick={()=>perform('draft.request_review','검토 요청되었습니다. 별도 신원으로 검토하세요.')}>등록안 검토 요청</Button>}{d.status==='검토 요청'&&<><Button primary disabled={busy||actor!=='Bob'||actor===d.author||d.base!==s.version} title={actor===d.author?'자기 승인 금지':actor!=='Bob'?'검토 계정 Bob만 승인 가능':d.base!==s.version?'기준 버전 변경 · 재검토 필요':''} onClick={()=>perform('draft.approve','승인되었습니다. 아직 반영되지 않았습니다.')}>이 버전 승인</Button>{(['보완 요청','반려'] as const).map(status=><Button key={status} disabled={busy||actor!=='Bob'||actor===d.author} title={actor!=='Bob'?'검토 계정 Bob만 보완·반려 가능':actor===d.author?'자기 검토 금지':''} onClick={()=>perform('draft.review_decision',status+' 기록 저장',{reviewStatus:status,comment})}>{status}</Button>)}</>}{(d.status==='승인'||d.status==='반영 완료')&&<Button primary disabled={busy||actor==='Viewer'} onClick={()=>perform('draft.apply',d.status==='반영 완료'?'동일 요청 확인: 추가 반영 없음':'승인 버전이 로컬 저장소에 반영되었습니다.')}>{d.status==='승인'?'승인된 버전 반영':'같은 요청으로 재확인'}</Button>}<Button disabled={busy||actor!==d.author} onClick={()=>perform('draft.revise','새 초안 버전이 생성되었습니다.')}>새 버전으로 재검토</Button></div>{actor===d.author&&d.status==='검토 요청'&&<Notice tone="warning">자기 승인은 허용되지 않습니다. 다른 검토 신원으로 전환하세요.</Notice>}{actor!==d.author&&actor!=='Bob'&&d.status==='검토 요청'&&<Notice tone="warning">현재 계정에는 검토·승인 권한이 없습니다. 개발 검토 계정 Bob만 승인·보완·반려할 수 있습니다.</Notice>}{d.base!==s.version&&d.status!=='반영 완료'&&<Notice tone="warning">기준 데이터 버전이 변경되었습니다. 새 초안으로 재검토해야 합니다.</Notice>}<small className="muted">승인 후 수정은 새 초안입니다. 이전 승인으로 반영할 수 없습니다.</small></>}</Modal><Req ids="RV01~03 · CM02/04 · AT03 · T15-02/04 (서버 검증 별도)"/></>;
}
