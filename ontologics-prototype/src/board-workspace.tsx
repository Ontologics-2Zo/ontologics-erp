import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ArrowRight,ShieldCheck} from 'lucide-react';
import {useApp} from './context';
import {Badge,Button,Notice,Panel,Field,Modal,useStored} from './ui';
import {useEntity} from './entity';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,QuantityCell,WorkflowBasis} from './workflow-tables';
import {RecordRequests} from './request-forms';
import type {Draft} from './domain';

function PageTitle({id,title,sub,action}:{id:string;title:string;sub:string;action?:ReactNode}){return <div className="page-title"><div><span className="eyebrow">{id} / MANUFACTURING OPERATIONS</span><h1>{title}</h1><p>{sub}</p></div>{action}</div>}
function Req({ids}:{ids:string}){return <div className="req"><ShieldCheck size={13}/>{ids}</div>}
const statusTone=(value:string)=>value==='반영 완료'?'green':value==='승인'?'blue':value==='반려'?'red':'amber';

export function Boards(){
 const {s,go,submit,busy,evidence,setReviewContext}=useApp();
 const {resolve,select,selectedId}=useEntity();
 const [id,setId]=useStored('newBoard','U107');
 const [activeDraft,setActiveDraft]=useStored('workflow-view-board-draft','');
 const [,setReviewActive]=useStored('workflow-view-review-context','');
 const [,setReviewOpen]=useStored('workflow-view-review-open','');
 const [opened,setOpened]=useState<string|null>(null);
 const drafts=s.drafts.filter(d=>d.payload.kind==='board');
 const boardTarget=(d:Draft)=>typeof d.payload.board==='string'&&s.boardIds.includes(d.payload.board)&&resolve(d.payload.board)?.type==='개별 보드'?d.payload.board:undefined;
 const currentDraft=drafts.find(d=>d.id===activeDraft);
 const target=currentDraft?boardTarget(currentDraft):undefined;
 const reviewRef=useRef(setReviewContext);reviewRef.current=setReviewContext;
 useEffect(()=>{reviewRef.current(currentDraft&&target===selectedId?currentDraft.id:null)},[currentDraft?.id,currentDraft?.version,target,selectedId]);
 useEffect(()=>()=>reviewRef.current(null),[]);
 const activateDraft=(d:Draft)=>{setActiveDraft(d.id);setReviewContext(boardTarget(d)?d.id:null)};
 const inspectDraft=(d:Draft)=>{const target=boardTarget(d);if(target)select(target,false);activateDraft(d);setOpened(d.id)};
 const openReview=(d:Draft)=>{const target=boardTarget(d);if(target)select(target,false);setReviewActive(d.id);setReviewOpen(d.id);setReviewContext(target?d.id:null);go('UI05')};
 const shown=drafts.find(d=>d.id===opened);
 const rows=s.boardIds.map(board=>{const object=resolve(board);const registered=object?.type==='개별 보드';const applied=drafts.find(d=>d.status==='반영 완료'&&d.payload.board===board);return {id:board,object:registered?object:undefined,applied,configuration:registered?String(object.properties['구성']??'구성 연결 미확인'):'구성 연결 미확인',position:registered?String(object.properties['장착 위치']??'미확인'):'미확인',sources:registered?object.evidence:[],representative:['U101','U104','U106'].includes(board)}});
 return <>
 <PageTitle id="UI03" title="보드·로트 이력" sub="설계 구성과 실물 보드를 구별하고, 확인된 사건만 기록합니다." action={<Badge tone="purple">가상 운영 기록</Badge>}/>
 <div className="context-strip"><span>회사: 시연 제조사 A</span><span>대표 조사: 가상 공급처 S / 부품 M / L07</span><strong>등록만으로 로트·장착·출하 연결을 확정하지 않음</strong></div>
 <Panel title="개별 보드" subtitle="L07 문자열만으로 식별하지 않습니다. 생산·출하 집계에서 보드 목록을 추론하지 않습니다.">
 <WorkflowTable tableKey="board-registry" data={rows} getRowId={row=>row.id} contextId={row=>row.object?.id} onActivate={()=>{setActiveDraft('');setReviewContext(null)}} searchLabel="보드 ID·구성·등록 근거 검색" empty="등록한 개별 보드가 없습니다." footer="각 행은 식별된 보드 1대입니다. 생산·재고·출하·불량 수량이 아니며, 같은 로트에 연결되었다는 이유로 실장·호환성·결함·납품을 확정하지 않습니다." columns={[
  {id:'photo',header:'보드 참고',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.object?.id}/>},
  {id:'object',header:'보드 · 불변 ID',enableHiding:false,accessorFn:r=>r.id,cell:c=><WorkflowObject id={c.row.original.object?.id} detail={'회사 A · '+c.row.original.id}/>},
  {id:'configuration',header:'구성 / 장착 위치',accessorFn:r=>r.configuration+' '+r.position,cell:c=><div className="workflow-cell"><span>{c.row.original.configuration}</span><small>장착 위치 {c.row.original.position}</small><small>구성 개정은 원문 표기 기준</small></div>},
  {id:'quantity',header:'식별 대상 수',accessorFn:r=>r.object?1:undefined,sortUndefined:'last',cell:c=><QuantityCell value={c.row.original.object?1:null} unit="대" note="객체 1행 · 생산/불량 수량 아님"/>},
  {id:'status',header:'등록 / 원문 상태',accessorFn:r=>r.object?.status??'객체 미확인',cell:c=><div className="workflow-cell"><Badge tone={c.row.original.applied?'green':'gray'}>{c.row.original.applied?'승인 식별 반영':c.row.original.object?.status??'객체 미확인'}</Badge><small>{c.row.original.applied?'장착·제거 사실은 별도':'기존 합성 시드 · 기간 판정은 별도 조사'}</small></div>},
  {id:'author',header:'등록 작성 / 승인',accessorFn:r=>(r.applied?.author??'')+' '+(r.applied?.approvedBy??''),cell:c=><div className="workflow-cell"><span>{c.row.original.applied?.author??'작성자 미등록'}</span><small>{c.row.original.applied?'승인 '+(c.row.original.applied.approvedBy??'미기록'):'승인 기록 미등록 · 기존 시드'}</small></div>},
  {id:'basis',header:'데이터 기준 · 근거',accessorFn:r=>r.sources.join(' '),cell:c=><div className="workflow-cell"><WorkflowBasis version={s.version}/><small>객체 버전 {c.row.original.object?.revision??'미확인'}</small>{c.row.original.sources.map(source=><button key={source} className="text-btn" onClick={()=>evidence(source)}>{source}</button>)}{!c.row.original.sources.length&&<small>등록 근거 미연결</small>}</div>},
  {id:'next',header:'다음 조치',cell:c=><div className="workflow-cell">{c.row.original.representative?<Button onClick={()=>{select(c.row.original.id,false);setActiveDraft('');setReviewContext(null);go('UI04')}}>장착 이력 조사</Button>:<Button disabled={!c.row.original.object} onClick={()=>select(c.row.original.id)}>식별 객체 상세</Button>}{c.row.original.applied&&<Button onClick={()=>inspectDraft(c.row.original.applied!)}>반영 초안 확인</Button>}<small>{c.row.original.representative?'현재 시점/기간 조건 유지':'로트·장착·출하 연결 미확인'}</small></div>}
 ]}/>
 <div className="inset"><Button primary onClick={()=>go('UI04')}>부품 로트 사용처·장착 이력 조사 <ArrowRight size={16}/></Button></div>
 </Panel>
 <Panel title="최초 운영 등록 초안" subtitle="기존 이력 보완과 구별되는 새 보드 등록입니다."><div className="inset"><div className="form-grid"><Field label="새 보드 식별자"><input value={id} onChange={e=>setId(e.target.value)}/></Field><Field label="적용 구성"><input readOnly value="L1 WROOM · 가상 운영 시드"/></Field></div><Notice>최초 식별 등록만 시연합니다. 이 보드의 장착·제거 사실은 별도 근거가 없으므로 생성하지 않습니다. 위 구성은 시연 입력 기준이며 등록 명령에 구성 관계가 포함되지는 않습니다.</Notice><Button disabled={busy} onClick={()=>submit({kind:'board',board:id,evidence:'DEMO-BOARD-NEW · 가상 등록 요청'},`${id} 최초 운영 등록`,'UI03')}>등록 검토 초안 작성</Button></div></Panel>
 <Panel title="보드 식별 등록 검토 목록" subtitle="작성 중 후보·별도 승인·정확 버전 반영을 구분합니다. 승인과 반영은 기존 검토함에서 수행합니다.">
 <WorkflowTable tableKey="board-registration-drafts" data={drafts} getRowId={row=>row.id} contextId={boardTarget} onActivate={activateDraft} activeId={target===selectedId?activeDraft:undefined} searchLabel="등록 초안·보드 ID·작성자 검색" empty="보드 식별 등록 초안이 없습니다." footer="미등록 대상의 초안은 기존 객체와 묶어 AI에 전달하지 않습니다. 후보 식별자 1건을 등록 보드·생산·불량 수량에 더하지 않습니다." columns={[
  {id:'photo',header:'대상 참고',enableHiding:false,cell:c=><WorkflowPhoto id={boardTarget(c.row.original)}/>},
  {id:'object',header:'초안 / 대상 식별자',enableHiding:false,accessorFn:r=>r.id+' '+r.title+' '+String(r.payload.board),cell:c=><div className="workflow-cell"><button className="text-btn" onClick={()=>inspectDraft(c.row.original)}>{c.row.original.title}</button><small className="mono">{c.row.original.id}</small>{boardTarget(c.row.original)?<WorkflowObject id={boardTarget(c.row.original)}/>:<><strong className="mono">{String(c.row.original.payload.board)}</strong><small>미등록 대상 · 객체 연결 미확인</small></>}</div>},
  {id:'quantity',header:'검토 대상 수',accessorFn:()=>1,cell:()=> <QuantityCell value={1} unit="건" note="식별자 등록 후보 · 확정 대수 아님"/>},
  {id:'status',header:'검토 / 반영 상태',accessorKey:'status',cell:c=><div className="workflow-cell"><Badge tone={statusTone(c.getValue())}>{c.getValue()}</Badge><small>{c.getValue()==='반영 완료'?'정확 승인 버전 반영':c.row.original.base!==s.version?'기준 변경 · 재검토 필요':c.getValue()==='승인'?'승인됨 · 아직 미반영':'아직 미반영'}</small></div>},
  {id:'author',header:'작성 / 승인',accessorFn:r=>r.author+' '+(r.approvedBy??''),cell:c=><div className="workflow-cell"><span>{c.row.original.author}</span><small>승인 {c.row.original.approvedBy??'미승인'}</small></div>},
  {id:'version',header:'초안 / 기준 버전',accessorFn:r=>r.version,cell:c=><div className="workflow-cell"><span>초안 v{c.row.original.version} · 기준 v{c.row.original.base}</span><small>현재 데이터 v{s.version}</small></div>},
  {id:'basis',header:'시각 · 근거',accessorFn:r=>String(r.payload.evidence),cell:c=><WorkflowBasis version={c.row.original.base} at="등록 사건 시각 미기록" evidence={String(c.row.original.payload.evidence)}/>},
  {id:'next',header:'다음 조치',cell:c=><div className="workflow-cell"><Button onClick={()=>inspectDraft(c.row.original)}>초안·버전 확인</Button><small>조회만 수행 · 승인/반영은 검토함</small></div>}
 ]}/>
 </Panel>
 <Modal open={!!shown} onClose={()=>setOpened(null)} title="보드 식별 등록 초안" description="원본 초안의 대상·작성자·정확 버전과 상태를 확인합니다. 이 창에서 승인하거나 반영하지 않습니다.">{shown&&<><div className="review-summary"><Badge tone={statusTone(shown.status)}>{shown.status}</Badge><span>{shown.id} · 초안 v{shown.version}</span></div><dl className="details"><dt>대상 식별자</dt><dd>{String(shown.payload.board)}</dd><dt>작성 / 승인</dt><dd>{shown.author} / {shown.approvedBy??'미승인'}</dd><dt>초안 기준 / 현재 데이터</dt><dd>v{shown.base} / v{s.version}</dd><dt>내용 해시</dt><dd className="mono">{shown.hash}</dd><dt>승인 해시</dt><dd className="mono">{shown.approvedHash??'미승인'}</dd><dt>등록 근거</dt><dd>{String(shown.payload.evidence)}</dd><dt>등록 범위</dt><dd>식별자만 등록 · 구성·장착·제거·출하 관계 확정 아님</dd></dl><Notice>검토함에서 이 초안 ID와 버전을 확인하세요. 작성자 분리·권한·최신 기준·멱등성 검사는 기존 공통 ActionPort를 사용합니다.</Notice><Button onClick={()=>openReview(shown)}>검토함에서 계속</Button></>}</Modal>
 <RecordRequests mode="trace"/>
 <Req ids="TRC-04 · TRC-01 · D02/D03 · 개별 이력 근거 확인"/>
 </>;
}
