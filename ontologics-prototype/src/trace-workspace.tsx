import {useState,type ReactNode} from 'react';
import {ShieldCheck} from 'lucide-react';
import {useApp} from './context';
import {Badge,Button,Notice,Panel,Field,useStored} from './ui';
import {investigation,defaultConditions,NOW,type Conditions} from './domain';
import {useEntity} from './entity';
import {entityById,relations} from './entity-data';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,WorkflowBasis} from './workflow-tables';

type Snapshot={rows:ReturnType<typeof investigation>;conditions:Conditions;version:number};
type TraceRow=Snapshot['rows'][number];
const synthetic=<Badge tone="purple">가상 운영 기록</Badge>;
function PageTitle({id,title,sub,action}:{id:string;title:string;sub:string;action?:ReactNode}){return <div className="page-title"><div><span className="eyebrow">{id} / MANUFACTURING OPERATIONS</span><h1>{title}</h1><p>{sub}</p></div>{action}</div>}
function Req({ids}:{ids:string}){return <div className="req"><ShieldCheck size={13}/>{ids}</div>}
function conditionLabel(c:Conditions){return c.mode==='A'?'시점 A · '+c.at:'기간 B · '+c.start+' ≤ t < '+c.end}
function lotLinked(id:string){return ['U101','U104','U106'].includes(id)}
function stateTone(value:string){return value==='추가 이력 확인 필요'?'amber':'blue'}

function TraceResultTable({snapshot,compare,onCorrection}:{snapshot:Snapshot;compare:boolean;onCorrection:()=>void}){
 const {s,evidence,conditions,setConditions}=useApp(),{select}=useEntity();
 const current=compare?investigation(s,snapshot.conditions):[];
 const different=JSON.stringify(conditions)!==JSON.stringify(snapshot.conditions);
 const applyConditions=(row:TraceRow)=>{setConditions(structuredClone(snapshot.conditions));select(row.id,false)};
 return <WorkflowTable tableKey="trace-results" data={snapshot.rows} getRowId={row=>row.id} contextId={row=>row.id} searchLabel="조사 보드·확인 범위·근거 검색" empty="조회 조건에 포함된 보드가 없습니다." footer="행 선택은 객체만 공유합니다. AI는 현재 입력 조건·최신 데이터 기준입니다. 이전 조회 조건으로 질문하려면 ‘이 조회 조건 적용’을 먼저 선택하세요. 장착 이력은 결함 판정이 아니며 조건상 제외는 안전 보장이 아닙니다." columns={[
  {id:'photo',header:'보드 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.id}/>},
  {id:'object',header:'보드 · 로트',enableHiding:false,accessorFn:r=>r.id+(lotLinked(r.id)?' LOT-L07':''),cell:c=><div className="workflow-stack"><WorkflowObject id={c.row.original.id}/>{lotLinked(c.row.original.id)?<WorkflowObject id="LOT-L07" detail="명시된 조사 연결 · 결함 확정 아님"/>:<small>이 보드의 L07 관계 미확인</small>}</div>},
  {id:'condition',header:'조회 조건',accessorFn:()=>conditionLabel(snapshot.conditions),cell:()=> <div className="workflow-cell"><span>{snapshot.conditions.mode==='A'?'시점 A':'기간 B'}</span><small>{snapshot.conditions.mode==='A'?snapshot.conditions.at:snapshot.conditions.start+' ~ '+snapshot.conditions.end}</small><small>{snapshot.conditions.mode==='B'?'시작 포함 / 종료 제외':'제거 시각은 제외'}</small></div>},
  {id:'result',accessorKey:'result',header:compare?'보완 전 판정':'판정',cell:c=><div className="workflow-cell"><Badge tone={stateTone(c.getValue())}>{c.getValue()}</Badge><small>조회 v{snapshot.version} · 결함/안전 판정 아님</small></div>},
  ...(compare?[{id:'after',header:`현재 v${s.version}`,accessorFn:(row:TraceRow)=>current.find(x=>x.id===row.id)?.result??'현재 조회 대상 없음',cell:({row}:{row:{original:TraceRow}})=>{const after=current.find(x=>x.id===row.original.id);return <div className="workflow-cell"><Badge tone={stateTone(after?.result??'추가 이력 확인 필요')}>{after?.result??'현재 조회 대상 없음'}</Badge><small>{after?.reason??'조건·대상 확인 필요'}</small></div>}}]:[]),
  {id:'scope',accessorKey:'reason',header:'확인 범위 / 미확인',cell:c=><div className="workflow-cell"><span>{c.getValue()}</span><small>제거: {c.row.original.removed}</small></div>},
  {id:'evidence',accessorKey:'evidence',header:'원본 근거',cell:c=><div className="workflow-cell"><button className="text-btn" onClick={()=>evidence(c.getValue())}>{c.getValue()}</button>{compare&&current.find(x=>x.id===c.row.original.id)?.evidence!==c.getValue()&&<small>현재 {current.find(x=>x.id===c.row.original.id)?.evidence??'근거 미등록'}</small>}</div>},
  {id:'next',header:'다음 조치',cell:c=><div className="workflow-actions"><Button onClick={()=>applyConditions(c.row.original)} title={different?'저장된 조회 조건을 현재 입력과 AI 맥락에 적용합니다.':'같은 조회 조건과 이 보드를 AI 맥락으로 선택합니다.'}>이 조회 조건 적용</Button>{c.row.original.id==='U104'&&<Button onClick={()=>{select('U104',false);onCorrection()}}>보완 입력 확인</Button>}</div>},
  {id:'basis',header:'데이터 기준',cell:()=> <div className="workflow-cell"><WorkflowBasis version={snapshot.version} at={NOW}/><small>현재 데이터 v{s.version}{different?' · 입력 조건 변경':''}</small></div>}
 ]}/>;
}

function TraceEvidenceTable({snapshot}:{snapshot:Snapshot}){
 const {evidence,s}=useApp();
 // These are existing relation/event references, not invented mounting events.
 const rows=snapshot.rows.map(row=>{
  const relation=relations.find(r=>r.id===(row.id==='U101'?'r8':row.id==='U106'?'r9':''));
  const event=row.id==='U104'?entityById('MOUNT-104'):undefined;
  return {...row,viewId:row.id==='U104'?'MOUNT-104':relation?.id??'unlinked:'+row.id,eventId:event?.id,relationId:relation?.id,registered:!!event||!!relation,mount:event?String(event.properties['장착']??'미기록'):relation?.validFrom??'장착 시각 원문 미등록',kind:event?'장착 사건':relation?'원문 장착 관계':'원문 연결 미확인'};
 });
 return <Panel title="조회한 장착·제거 근거 목록" subtitle="같은 조회 스냅샷의 원문 사건/관계 요약입니다. 관계 행을 새 장착 사건으로 생성하지 않습니다."><WorkflowTable tableKey="trace-evidence" data={rows} getRowId={row=>row.viewId} contextId={row=>row.id} searchLabel="장착 근거·보드·사건 검색" empty="조회한 장착 근거가 없습니다." columns={[
  {id:'photo',header:'보드 참고',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.id}/>},
  {id:'object',header:'보드 · 원문 참조',enableHiding:false,accessorFn:r=>r.id+' '+(r.eventId??r.relationId??''),cell:c=><div className="workflow-stack"><WorkflowObject id={c.row.original.id}/>{c.row.original.eventId?<WorkflowObject id={c.row.original.eventId}/>:<small>{c.row.original.relationId?'관계 '+c.row.original.relationId:'원문 객체 미등록'}</small>}</div>},
  {id:'kind',accessorKey:'kind',header:'근거 종류',cell:c=><div className="workflow-cell"><Badge>{c.getValue()}</Badge><small>{c.row.original.registered?'LOT-L07 · 확인된 참조':'로트·장착 관계 확인 필요'}</small></div>},
  {id:'mount',accessorKey:'mount',header:'장착 기록 시각',cell:c=><span className="workflow-cell-note">{c.getValue()}</span>},
  {id:'removed',accessorKey:'removed',header:'제거 조회값',cell:c=><div className="workflow-cell"><span>{c.getValue()}</span><small>{c.row.original.evidence==='DEMO-TRACE-02'?'승인 보완 근거 포함 · 원문 객체 보존':'제거 미기록은 계속 장착을 의미하지 않음'}</small></div>},
  {id:'scope',accessorKey:'reason',header:'확인 범위',cell:c=><div className="workflow-cell"><span>{c.getValue()}</span><small>이력 없음·제거 미기록으로 미장착/계속 장착을 확정하지 않음</small></div>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>evidence(c.row.original.evidence)}>장착 원문 근거 확인</Button>},
  {id:'basis',header:'조회 기준 / 근거',cell:c=><div className="workflow-cell"><WorkflowBasis version={snapshot.version} at={NOW} evidence={c.row.original.evidence}/><small>현재 v{s.version} · {snapshot.conditions.mode} 조회</small></div>}
 ]}/></Panel>;
}

export function Trace(){
 const {s,conditions:c,setConditions,run,submit,busy,go,evidence}=useApp();
 const [result,setResult]=useStored<Snapshot|null>('traceResult',null),[compare,setCompare]=useState(false),[coverage,setCoverage]=useStored('coverage',false);
 const query=()=>run(()=>{setResult({rows:investigation(s,c),conditions:structuredClone(c),version:s.version});setCompare(false)});
 const different=!!result&&JSON.stringify(c)!==JSON.stringify(result.conditions);
 const focusCorrection=()=>{const panel=document.getElementById('trace-correction');panel?.scrollIntoView({block:'center',behavior:'smooth'});panel?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus({preventScroll:true})};
 return <>
 <PageTitle id="UI04" title="부품 로트 사용처·장착 이력 조사" sub="장착 이력 확인은 결함 판정이 아니며, 조건상 제외는 안전 보장이 아닙니다." action={synthetic}/>
 <Panel title="조사 조건 설정" subtitle="회사 A / 공급처 S / 부품 M / L07 · 보드 U101, U104, U106"><div className="inset"><div className="segmented"><button className={c.mode==='A'?'active':''} onClick={()=>setConditions({...c,mode:'A'})}>시점 A</button><button className={c.mode==='B'?'active':''} onClick={()=>setConditions({...c,mode:'B'})}>기간 B</button></div><div className="form-grid">{c.mode==='A'?<Field label="기준 시점 A · 시간대 필수"><input value={c.at} onChange={e=>setConditions({...c,at:e.target.value})}/></Field>:<><Field label="기간 시작 · 포함"><input value={c.start} onChange={e=>setConditions({...c,start:e.target.value})}/></Field><Field label="기간 종료 · 제외"><input value={c.end} onChange={e=>setConditions({...c,end:e.target.value})}/></Field></>}</div><div className="toolbar"><label className="check"><input type="checkbox" checked={c.excluded.includes('U106')} onChange={e=>setConditions({...c,excluded:e.target.checked?['U106']:[]})}/>U106을 조사 대상에서 제외</label><Button onClick={()=>setConditions(defaultConditions)}>대표 조건 복원</Button><Button primary disabled={busy} onClick={query}>장착 이력 조회</Button></div><p className="rule">A: 장착 ≤ 시점 &lt; 제거　 /　 B: 장착 &lt; 종료 그리고 제거 &gt; 시작</p></div></Panel>
 {result&&<><Panel title="조사 결과" subtitle={`데이터 v${result.version} · ${result.conditions.mode} · 제외 ${result.conditions.excluded.join(', ')||'없음'}`} action={<Button onClick={()=>run(()=>{if(JSON.stringify(c)!==JSON.stringify(result.conditions))throw new Error('조회 조건이 바뀌어 동일 조사 전후 비교가 아닙니다. 원래 조건을 복원하세요.');setCompare(true);})}>보완 전후 결과 비교</Button>}>
 {(different||result.version!==s.version)&&<div className="inset"><Notice tone="warning">{different?'현재 입력 조건과 저장된 조회 조건이 다릅니다. ':''}{result.version!==s.version?`조회 v${result.version}과 현재 데이터 v${s.version}의 기준이 다릅니다. `:''}목록은 조회 스냅샷이며 AI는 현재 입력·최신 데이터 기준입니다. 단순 선택은 입력 조건을 덮어쓰지 않습니다.</Notice></div>}
 <TraceResultTable snapshot={result} compare={compare} onCorrection={focusCorrection}/></Panel><TraceEvidenceTable snapshot={result}/></>}
 <div id="trace-correction"><Panel title="U104 이력 보완안" subtitle="제거 시각만으로 판단하지 않고 재장착 없음의 확인 범위를 함께 제출합니다."><div className="inset"><div className="form-grid"><Field label="제거 시각"><input readOnly value="2026-09-12T09:00:00+09:00"/></Field><Field label="추가 근거"><input readOnly value="DEMO-TRACE-02 · 가상 보완 기록"/></Field></div><label className="check"><input type="checkbox" checked={coverage} onChange={e=>setCoverage(e.target.checked)}/>9/12 제거 후 9/21 00:00까지 재장착 없음의 충분한 확인 범위를 제출합니다.</label><div className="actions"><Button primary disabled={busy||s.traceCorrected} onClick={()=>submit({kind:'trace',removed:'2026-09-12T09:00:00+09:00',coverage,evidence:'DEMO-TRACE-02'},'U104 제거·확인 범위 보완','UI04')}>이력 보완안 작성</Button><Button onClick={()=>go('UI09')}>이 조사로 클레임 검토</Button></div><Notice>보완 후 U104는 대표 A에서 제외, 대표 B에서 포함됩니다. U106은 제거·확인 범위가 부족하여 추가 확인을 유지합니다.</Notice></div></Panel></div>
 <Req ids="TRC-01~03 · AT02 · CM01"/>
 </>;
}
