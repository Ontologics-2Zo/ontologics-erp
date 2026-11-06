import {useState} from 'react';
import {FileText,Download,ShieldCheck} from 'lucide-react';
import {useApp} from './context';
import {useEntity} from './entity';
import {entities,type Entity} from './entity-data';
import {NOW,type State} from './domain';
import {Badge,Button,Modal,Notice,Panel,useStored} from './ui';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,WorkflowBasis} from './workflow-tables';
import catalog from './catalog.json';

type EvidenceRow={id:string;title:string;kind:string;version:string;location:string;revision?:string;sha256?:string;related:Entity[]};
type SavedDocument=State['docs'][number];
// These are display identities, not newly issued business document IDs. The
// ordinal distinguishes identical records; the existing ledger appends records.
function savedRows(docs:SavedDocument[]){
 const counts=new Map<string,number>();
 return docs.map(d=>{const key=JSON.stringify([d.name,d.body,d.status]),ordinal=counts.get(key)??0;counts.set(key,ordinal+1);return {...d,id:key+'#'+ordinal};});
}
function download(name:string,body:string){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+body],{type:'text/plain;charset=utf-8'}));a.download=name+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

export function Evidence(){
 const {s,evidence,go}=useApp(),{resolve}=useEntity();
 const [type,T]=useStored('workflow-view-evidence-kind','전체'),[mode,M]=useStored('workflow-view-evidence-mode','정상');
 const [opened,O]=useState<SavedDocument|null>(null),[linked,L]=useState<EvidenceRow|null>(null);
 // Only pre-existing, allowed Entity.evidence references qualify. A document
 // title, free text, or a shared model name never creates a relation.
 const related=(id:string)=>entities.filter(e=>e.evidence.includes(id)&&resolve(e.id)).sort((a,b)=>{
  const rank=(e:Entity)=>e.type==='제품 구성'?0:e.type==='제품 모델'?1:e.type==='개별 보드'?2:3;
  return rank(a)-rank(b)||a.id.localeCompare(b.id);
 });
 const docs:EvidenceRow[]=[...catalog.map(c=>({id:c.id,title:c.filename,kind:c.kind,version:c.commit,location:c.path,revision:c.revision,sha256:c.sha256,related:related(c.id)})),...['TRACE-01','TRACE-02','FUL-01','DEMAND-01','MATERIAL-01','CLAIM-01','TEST-01'].map(x=>({id:'DEMO-'+x,title:'가상 운영 근거 '+x,kind:'가상 운영 기록',version:'시연 v1',location:'요구사항 기반 시연 자료',related:related('DEMO-'+x)}))];
 return <>
  <div className="page-title"><div><span className="eyebrow">UI06 / MANUFACTURING OPERATIONS</span><h1>문서·근거</h1><p>실제 공개 원본과 가상 운영 기록을 구별하고, 행·해시·적용 버전을 확인합니다.</p></div></div>
  <Panel title="근거 검색" subtitle="원문 ID와 명시된 객체의 근거 참조만 연결합니다. 사진은 연결 객체의 외형 참고이며 문서·검사 원문이 아닙니다." action={<div className="toolbar"><select aria-label="자료 구분" value={type} onChange={e=>T(e.target.value)}><option>전체</option><option>실제 공개 원본</option><option>가상 운영 기록</option></select><select aria-label="검색 시연 상태" value={mode} onChange={e=>M(e.target.value)}>{['정상','검색 없음','색인 미완료','검색 장애'].map(x=><option key={x}>{x}</option>)}</select></div>}>
   {mode==='정상'||mode==='검색 없음'?<WorkflowTable tableKey="evidence-sources" data={mode==='검색 없음'?[]:docs.filter(d=>type==='전체'||d.kind===type)} getRowId={r=>r.id} contextId={r=>r.related[0]?.id} searchLabel="문서명·근거 ID·개정 검색" columns={[
    {id:'photo',header:'연결 대상 사진',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.related[0]?.id}/>},
    {id:'document',header:'문서 / 근거 ID',enableHiding:false,accessorFn:r=>r.title+' '+r.id,cell:c=><div className="workflow-stack"><button className="text-btn" data-focus-key={c.row.original.id} onClick={()=>evidence(c.row.original.id)}><FileText size={14}/>{c.row.original.title}</button><code>{c.row.original.id}</code></div>},
    {id:'object',header:'대표 연결 객체',enableHiding:false,accessorFn:r=>r.related.map(e=>e.name+' '+e.id).join(' '),cell:c=><div className="workflow-stack"><WorkflowObject id={c.row.original.related[0]?.id} detail={c.row.original.related.length?'기존 객체의 근거 참조 · 대표 선택':'명시된 객체의 근거 참조 없음'}/>{c.row.original.related.length>0&&<Button onClick={()=>L(c.row.original)}>연결 {c.row.original.related.length}개 보기</Button>}</div>},
    {id:'kind',header:'자료 구분 / 확인',accessorKey:'kind',cell:c=><div className="workflow-stack"><Badge tone={c.row.original.kind==='실제 공개 원본'?'blue':'purple'}>{c.row.original.kind}</Badge><small>{c.row.original.sha256?'원본 파일 보존 · SHA-256 기록':'요구사항 기반 합성 자료'}</small></div>},
    {id:'revision',header:'개정 / 원문 버전',accessorFn:r=>(r.revision??'미기록')+' '+r.version,cell:c=><div className="workflow-stack"><span>{c.row.original.revision?'개정 '+c.row.original.revision:'원문 개정 미기록'}</span><code title={c.row.original.version}>{c.row.original.sha256?c.row.original.version.slice(0,12)+'…':c.row.original.version}</code><small>{c.row.original.sha256?'전체 커밋·해시는 원문에서 확인':'현재 데이터 버전과 구별'}</small></div>},
    {id:'unknowns',header:'미확인 / 적용 범위',accessorFn:r=>r.sha256?'승인 구성·실제 장착 별도':'실제 운영 사실 미확인',cell:c=><span className="workflow-cell-note">{c.row.original.sha256?'승인 구성·실제 장착 별도. ODS/PDF 전체 의미 일치 검증 미완료':'합성 근거이며 실제 검사·결함·납품 완료의 증거가 아님'}</span>},
    {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>evidence(c.row.original.id)}>원문·근거 확인</Button>},
    {id:'basis',header:'조회 기준 / 원문 기준',cell:c=><span className="workflow-basis"><span>{NOW.replace('T',' ').replace('+09:00',' KST')}</span><small>로컬 조회 · 데이터 v{s.version}</small><small>{c.row.original.sha256?'원문: 고정 Git 커밋 · 작성 시각 미기록':'원문: 시연 v1 · 실제 발생 시각 미등록'}</small></span>}
   ]} footer="근거 목록의 선택은 대표 연결 객체를 공유합니다. 원문 ID 자체를 새 업무 객체로 만들지 않으며, 연결 개수는 현재 회사에서 조회 가능한 등록 객체의 명시 참조만 셉니다."/>:<div className="inset"><Notice tone="warning">{mode==='검색 장애'?'검색 서비스 장애 시연입니다. 기존 업무 결과는 유지됩니다.':'색인이 준비되지 않았습니다. 검색 결과 0건과 다릅니다.'}</Notice><Button onClick={()=>M('정상')}>같은 조건으로 재시도</Button></div>}
  </Panel>
  <Panel title="저장한 업무 문서" subtitle="문서 생성·검토와 외부 송부는 다릅니다. 구조화된 대상·작성자·버전은 미등록이며 본문 이름으로 관계를 추정하지 않습니다.">
   <WorkflowTable tableKey="evidence-documents" data={savedRows(s.docs)} getRowId={r=>r.id} contextId={()=>undefined} searchLabel="저장 문서명·내용·상태 검색" empty="저장한 업무 문서가 없습니다." columns={[
    {id:'photo',header:'대상 사진',enableHiding:false,cell:()=> <WorkflowPhoto/>},
    {id:'document',header:'문서 / 대상 연결',enableHiding:false,accessorKey:'name',cell:c=><div className="workflow-stack"><button className="text-btn" onClick={()=>O(c.row.original)}>{c.row.original.name}</button><small>구조화 대상 ID 미등록</small></div>},
    {id:'body',header:'저장 원문 요약',accessorKey:'body',cell:c=><span>{c.row.original.body.slice(0,80)}{c.row.original.body.length>80?'…':''}</span>},
    {id:'status',header:'문서 상태',accessorKey:'status',cell:c=><div className="workflow-stack"><Badge>{c.row.original.status}</Badge><small>외부 송부·상대 접수 미확인</small></div>},
    {id:'owner',header:'작성 / 승인',cell:()=> <span className="workflow-cell-note">작성자·승인 버전 미기록</span>},
    {id:'next',header:'다음 조치',cell:c=><div className="workflow-actions"><Button onClick={()=>O(c.row.original)}>저장 원문 보기</Button><Button onClick={()=>download(c.row.original.name,c.row.original.body)}><Download size={13}/>다운로드</Button></div>},
    {id:'basis',header:'조회 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="문서 고유 ID·생성 시각·버전 미기록"/>}
   ]} footer="원문 전체와 중복 문서를 보존합니다. 행 식별자는 목록 상태 보존용이며 업무 문서 ID가 아닙니다. 문서 선택만으로 AI 대상을 추정하거나 승인·반영·송신하지 않습니다."/>
  </Panel>
  <Notice>원본 4개 파일을 지정 커밋에서 내려받아 SHA-256을 계산했습니다. 기존 프로젝트 data/catalog.json은 제공되지 않아 기존 카탈로그와의 일치 검증은 미완료입니다. PDF와 ODS 전체의 의미 일치 검증도 완료로 주장하지 않습니다.</Notice>
  <Button onClick={()=>go('TRACE')}>요구사항 추적표 · 미결 사항</Button><div className="req"><ShieldCheck size={13}/>EV01~02 · CM01 · CM05</div>
  <Modal open={!!opened} onClose={()=>O(null)} title="저장 업무 문서 원문" description="저장된 원문 전체를 읽습니다. 승인·원장 반영·외부 송부를 수행하지 않습니다.">{opened&&<><h3>{opened.name}</h3><Badge>{opened.status}</Badge><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'inherit',fontSize:14,lineHeight:1.6}}>{opened.body}</pre><Notice>본문에 표시된 ID·수량은 검토 문서의 내용입니다. 구조화된 객체·승인 버전·원장 실적의 근거로 자동 등록하지 않습니다.</Notice><Button onClick={()=>download(opened.name,opened.body)}><Download size={13}/>다운로드</Button></>}</Modal>
  <Modal open={!!linked} onClose={()=>L(null)} title="원문을 참조하는 객체" description="현재 회사의 기존 객체에 명시된 근거 참조입니다. 연결만으로 장착·결함·호환성을 확정하지 않습니다.">{linked&&<><h3>{linked.id}</h3><p>조회 가능한 명시 참조 {linked.related.length}개 · 대표 객체는 표시 순서의 첫 항목</p><div style={{display:'grid',gap:8,maxHeight:'50vh',overflow:'auto'}}>{linked.related.map(e=><div key={e.id}><WorkflowObject id={e.id} detail={e.type+' · 회사 '+e.company+' · 개정 '+e.revision}/></div>)}</div></>}</Modal>
 </>;
}
