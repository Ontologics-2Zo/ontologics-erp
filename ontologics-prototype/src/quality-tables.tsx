import {useState} from 'react';
import {ArrowRight,Download} from 'lucide-react';
import {useApp} from './context';
import {useEntity} from './entity';
import {Badge,Button,Modal,Notice,Panel} from './ui';
import {NOW,reproduction} from './domain';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,QuantityCell,WorkflowBasis} from './workflow-tables';

export function ClaimCaseTable({onRequests}:{onRequests:()=>void}){
 const {s,evidence}=useApp(),{select,resolve}=useEntity();
 const record=s.claimRecord;const [sourceOpen,SourceOpen]=useState(false);
 const rows=s.claim?[{id:'C-001',board:record?.board,body:record?.body,author:record?.author,evidence:record?.evidence}]:[];
 return <Panel title="접수된 클레임 목록" subtitle="저장된 신고 원문과 대상만 표시합니다. 현재 입력 중인 내용은 접수 기록을 바꾸지 않습니다."><WorkflowTable tableKey="quality-claims" data={rows} getRowId={r=>r.id} contextId={r=>r.board} searchLabel="클레임·신고 대상·원문 검색" empty="접수된 신고가 없습니다. 아래 원문과 대상 확인 후 접수하세요." columns={[
  {id:'photo',header:'신고 대상 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.board}/>},
  {id:'object',header:'신고 기록 / 대상',enableHiding:false,accessorFn:r=>r.id+' '+(r.board??'대상 미등록'),cell:c=><div className="workflow-stack"><code>{c.row.original.id}</code><WorkflowObject id={c.row.original.board} detail="개별 보드 식별 · 제품/납품 영향 별도 조사"/></div>},
  {id:'report',header:'신고 원문',accessorFn:r=>r.body??'원문 미등록',cell:c=><div className="workflow-stack"><span>{c.row.original.body?c.row.original.body.slice(0,72)+(c.row.original.body.length>72?'…':''):'원문 미등록'}</span><Button disabled={!c.row.original.body} onClick={()=>SourceOpen(true)}>신고 원문 보기</Button></div>},
  {id:'quantity',header:'신고 대상 수',accessorFn:r=>r.board?1:undefined,cell:c=><QuantityCell value={c.row.original.board?1:null} unit="대" note="식별된 신고 대상 · 불량 수량 아님"/>},
  {id:'review',header:'조사 상태',cell:()=> <div className="workflow-stack"><Badge tone="amber">신고 접수 · 결함 미확정</Badge><small>고장 원인·전체 영향 미확인</small></div>},
  {id:'owner',header:'접수 작성자',accessorFn:r=>r.author??'미등록',cell:c=><div className="workflow-stack"><span>{c.getValue()}</span><small>시험 담당·승인자와 구별</small></div>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>{const id=c.row.original.board;if(id&&resolve(id))select(id,false);onRequests()}}>요청·시험 의뢰 검토<ArrowRight size={13}/></Button>},
  {id:'basis',header:'조회 기준 / 원문',cell:c=><div className="workflow-stack"><WorkflowBasis version={s.version} at={NOW} evidence="접수 발생 시각 미등록"/>{c.row.original.evidence?<button className="text-btn" onClick={()=>evidence(c.row.original.evidence!)}>{c.row.original.evidence}</button>:<small>원문 근거 미등록</small>}</div>}
 ]} footer="C-001은 원문 신고 기록 ID입니다. 정적 CLAIM-01 객체와 임의로 같은 기록으로 합치지 않습니다. 신고나 사진만으로 결함·원인·납품 영향을 판정하지 않습니다."/><Modal open={sourceOpen} onClose={()=>SourceOpen(false)} title="접수 신고 원문" description="접수 시 저장된 원문입니다. 현재 입력 내용이나 대상 정정이 아닙니다."><WorkflowObject id={record?.board}/><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'inherit',fontSize:14,lineHeight:1.6}}>{record?.body??'원문 미등록'}</pre><small>{record?.evidence??'근거 미등록'} · 접수 작성 {record?.author??'미등록'}</small></Modal></Panel>;
}

export function QualityImpactTable({targetId,registered}:{targetId?:string;registered:boolean}){
 const {s,go,evidence}=useApp(),{resolve,select}=useEntity();
 const targetEntity=targetId?resolve(targetId):undefined;
 const target=targetId&&s.boardIds.includes(targetId)&&targetEntity?.type==='개별 보드'?targetId:undefined;
 const rows=[
  {id:'quality-target-'+(targetId??'unregistered'),targetId:target,scope:registered?'접수 대상 식별 범위':'현재 입력 대상 · 접수 전',status:target?'보드 식별 확인':'등록 대상 확인 필요',unknown:'장착 적용 기간·고장 원인·실제 결함 미확인',evidence:'DEMO-CLAIM-01'},
  {id:'quality-unconfirmed-impact',targetId:undefined,scope:'라인·납품 전체 영향',status:'조사 범위 미확인',unknown:'라인 전체 목록·납품 100대와 개별 보드 대응 미확인',evidence:'DEMO-TRACE-01'}
 ];
 return <WorkflowTable tableKey="quality-impact" data={rows} getRowId={r=>r.id} contextId={r=>r.targetId} searchLabel="영향 범위·미확인 검색" columns={[
  {id:'photo',header:'대상 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.targetId}/>},
  {id:'object',header:'확인 범위 / 대상',enableHiding:false,accessorKey:'scope',cell:c=><div className="workflow-stack"><strong>{c.getValue()}</strong><WorkflowObject id={c.row.original.targetId}/></div>},
  {id:'quantity',header:'확인 대상 수',cell:c=><QuantityCell value={c.row.original.targetId?1:null} unit="대" note={c.row.original.targetId?'식별 대상 · 불량 수량 아님':'전체 영향량 미집계'}/>},
  {id:'review',header:'확인 상태',accessorKey:'status',cell:c=><Badge>{c.getValue()}</Badge>},
  {id:'unknowns',header:'미확인 / 제외하지 않은 범위',accessorKey:'unknown'},
  {id:'next',header:'다음 조치',cell:c=>c.row.original.targetId?<Button onClick={()=>{select(c.row.original.targetId!,false);go('UI04')}}>대상 이력 조사<ArrowRight size={13}/></Button>:<Button disabled title="전체 보드·납품 연결 근거가 필요합니다.">전체 영향 근거 미등록</Button>},
  {id:'basis',header:'조회 기준 / 근거',cell:c=><div className="workflow-stack"><WorkflowBasis version={s.version} at={NOW}/><button className="text-btn" onClick={()=>evidence(c.row.original.evidence)}>{c.row.original.evidence}</button></div>}
 ]} footer="같은 라인·로트나 신고 관계는 결함 판정이 아닙니다. 이 목록의 미확인을 정상·안전 또는 영향 0대로 바꾸지 않습니다."/>;
}

type RequestDocument={name:string;body:string;status:string};
function requestRows(docs:RequestDocument[]){
 const counts=new Map<string,number>();
 return docs.filter(d=>d.name==='중단·출고 보류 검토 요청'||d.name==='시험 의뢰 검토 초안').map(d=>{
  const key=JSON.stringify([d.name,d.body,d.status]),ordinal=counts.get(key)??0;counts.set(key,ordinal+1);return {...d,id:key+'#'+ordinal};
 });
}
export function QualityRequestTable({onDownload}:{onDownload:(name:string,body:string)=>void}){
 const {s}=useApp(),[opened,O]=useState<RequestDocument|null>(null);
 return <Panel title="저장된 요청·시험 의뢰 목록" subtitle="원문 문서의 저장 상태를 표시합니다. 구조화된 대상·작성자·버전은 미등록이며 본문 이름으로 객체 관계를 추론하지 않습니다."><WorkflowTable tableKey="quality-requests" data={requestRows(s.docs)} getRowId={r=>r.id} contextId={()=>undefined} searchLabel="요청·시험 의뢰 문서 검색" empty="저장한 요청·시험 의뢰 초안이 없습니다." columns={[
  {id:'object',header:'문서 / 대상 연결',enableHiding:false,accessorKey:'name',cell:c=><div className="workflow-stack"><button className="text-btn" onClick={()=>O(c.row.original)}>{c.getValue()}</button><small>구조화 대상 ID 미등록 · 원문 확인 필요</small></div>},
  {id:'review',header:'기록 상태',accessorKey:'status',cell:c=><div className="workflow-stack"><Badge>{c.getValue()}</Badge><small>별도 송부·상대 접수·현장 실행 미확인</small></div>},
  {id:'owner',header:'작성 / 검토',cell:()=> <span className="workflow-cell-note">작성자·승인 버전 미기록</span>},
  {id:'unknowns',header:'미확인',cell:()=> <span className="workflow-cell-note">의뢰 수신·시험 수행·결과 진위 미확인</span>},
  {id:'next',header:'다음 조치',cell:c=><div className="workflow-actions"><Button onClick={()=>O(c.row.original)}>저장 원문 보기</Button><Button onClick={()=>onDownload(c.row.original.name,c.row.original.body)}><Download size={13}/>다운로드</Button></div>},
  {id:'basis',header:'조회 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="문서 생성 시각·고유 ID 미기록"/>}
 ]}/><Modal open={!!opened} onClose={()=>O(null)} title="요청·시험 의뢰 저장 원문" description="저장한 원문을 읽습니다. 승인·송부·수신·시험 실행은 수행하지 않습니다.">{opened&&<><h3>{opened.name}</h3><Badge>{opened.status}</Badge><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'inherit',fontSize:14,lineHeight:1.6}}>{opened.body}</pre><Notice>본문의 보드·작업 이름을 구조화된 관계로 등록하지 않았습니다.</Notice></>}</Modal></Panel>;
}

export function QualityResultsTable(){
 const {s,go,evidence}=useApp(),{select}=useEntity();
 const rows=s.testLinked?[{board:'U104',result:'시험팀 교체 검토 판정 (가상)',evidence:'DEMO-TEST-01'},{board:'U106',result:'미검사 · 의뢰 범위 밖',evidence:'자료 없음'}]:[];
 return <WorkflowTable tableKey="quality-results" data={rows} getRowId={r=>r.board} contextId={r=>r.board} searchLabel="시험 보드·제공 결과·미결 검색" empty="연결한 시험팀 결과가 없습니다." columns={[
  {id:'photo',header:'보드 참고 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.board}/>},
  {id:'object',header:'대상 보드',enableHiding:false,accessorKey:'board',cell:c=><WorkflowObject id={c.row.original.board} detail="보드 식별 참고 · 검사 사진 아님"/>},
  {id:'result',header:'제공 결과 / 미결',accessorKey:'result',cell:c=><Badge tone={c.row.original.board==='U104'?'blue':'gray'}>{c.getValue()}</Badge>},
  {id:'quantity',header:'표시 대상 수',cell:()=> <QuantityCell value={1} unit="대" note="객체 행 수 · 확인 불량 수량 아님"/>},
  {id:'unknowns',header:'미확인',cell:c=><span className="workflow-cell-note">{c.row.original.board==='U104'?'가상 제공 자료 · 실제 원인·시험 진위 미검증':'미검사 · 정상/수요 0 판정 불가'}</span>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>{select(c.row.original.board,false);go('UI04')}}>보드 이력 조사<ArrowRight size={13}/></Button>},
  {id:'basis',header:'출처 / 조회 기준',accessorKey:'evidence',cell:c=><div className="workflow-stack">{c.row.original.evidence==='자료 없음'?<span>자료 없음</span>:<button className="text-btn" onClick={()=>evidence(c.row.original.evidence)}>{c.row.original.evidence}</button>}<WorkflowBasis version={s.version} at={NOW} evidence="실제 시험 발생 시각 미등록"/></div>}
 ]}/>;
}

export function QualityReproductionTable(){
 const {s}=useApp();
 const rows=[{config:'X (가상 구성)',replace:10,stored:0,available:2,result:reproduction(10,0,2),unknown:'추가 미결 존재'},{config:'Y (가상 구성)',replace:0,stored:0,available:6,result:0,unknown:'X에 상계 금지'}];
 return <WorkflowTable tableKey="quality-reproduction" data={rows} getRowId={r=>r.config} contextId={()=>undefined} searchLabel="독립 예시 구성·미확정 검색" columns={[
  {id:'photo',header:'구성 사진',enableHiding:false,cell:()=> <WorkflowPhoto/>},
  {id:'object',header:'구성',enableHiding:false,accessorKey:'config',cell:c=><div className="workflow-stack"><strong>{c.getValue()}</strong><small>독립 가상 수량 예시 · 제품 ID 미등록</small></div>},
  {id:'replace',header:'교체 수요 / 대',accessorKey:'replace',cell:c=><span className="workflow-numeric">{c.getValue()}</span>},
  {id:'stored',header:'보관 대체 / 대',accessorKey:'stored',cell:c=><span className="workflow-numeric">{c.getValue()}</span>},
  {id:'available',header:'같은 구성 가용 / 대',accessorKey:'available',cell:c=><span className="workflow-numeric">{c.getValue()}</span>},
  {id:'result',header:'확인 범위 검토량 / 대',accessorKey:'result',cell:c=><span className="workflow-numeric">{c.getValue()}</span>},
  {id:'unknowns',header:'미확정 / 조건',accessorKey:'unknown',cell:c=><Badge>{c.getValue()}</Badge>},
  {id:'next',header:'다음 조치',cell:()=> <Button disabled title="실제 제품 구성과 수요 근거의 연결이 필요합니다.">구성·수요 근거 확인 필요</Button>},
  {id:'basis',header:'데이터 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="요구사항 14장 독립 수량 예시"/>}
 ]} footer="X/Y는 실제 제품·BOM과 연결되지 않은 별도 합성 예시입니다. 서로 다른 구성의 가용량을 상계하거나 기존 계약 100대 계획에 합산하지 않습니다."/>;
}
