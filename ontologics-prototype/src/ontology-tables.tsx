import {Box} from 'lucide-react';
import {useApp} from './context';
import {useEntity} from './entity';
import {Badge,Button} from './ui';
import {WorkflowTable,WorkflowPhoto,WorkflowObject} from './workflow-tables';
import {NOW} from './domain';
import type {Entity,Relation} from './entity-data';

const photoTarget=(e:Entity)=>/제품 모델|제품 구성|확보 대상 모델|개별 보드|사내 품목|BOM 원문 품목|부품 로트/.test(e.type);
/** The same authorized fixture scope used by the map; current runtime objects from the shared QueryPort. */
export function OntologyObjectTable({rows,relations}:{rows:Entity[];relations:Relation[]}){
 const {go,evidence}=useApp(),{select}=useEntity();
 return <WorkflowTable tableKey="ontology-objects" data={rows} getRowId={row=>row.id} contextId={row=>row.id} pageSizes={[12,24,60]} searchLabel="확장한 객체의 유형·상태·근거 검색" footer="행 선택은 같은 객체를 AI에 공유하고 객체 이름은 상세를 엽니다. 현재 표는 확장한 로컬 fixture 범위입니다. 전체 검색 결과는 위 검색·점진 확장·다운로드로 확인하며 표시 제한을 조사 완료로 취급하지 않습니다." columns={[
  {id:'photo',header:'객체 참고',enableHiding:false,cell:c=>photoTarget(c.row.original)?<WorkflowPhoto id={c.row.original.id}/>:<span className="work-photo-unknown"><Box size={18}/><small>사진 대상 아님</small></span>},
  {id:'object',header:'객체 · 불변 ID',enableHiding:false,accessorFn:r=>r.name+' '+r.id,cell:c=><WorkflowObject id={c.row.original.id} detail={c.row.original.id}/>},
  {id:'type',header:'유형 / 회사',accessorFn:r=>r.type+' '+r.company,cell:c=><div className="workflow-cell"><span>{c.row.original.type}</span><small>회사 {c.row.original.company}</small></div>},
  {id:'status',header:'원문 상태 / 자료',accessorFn:r=>r.status+' '+r.source,cell:c=><div className="workflow-cell"><Badge>{c.row.original.status}</Badge><small>{c.row.original.source}</small></div>},
  {id:'relations',header:'허용 관계 수',accessorFn:r=>relations.filter(l=>l.from===r.id||l.to===r.id).length,cell:c=><span className="work-quantity"><strong>{c.getValue()} <small>개</small></strong><span>로컬 명시 관계 · 사실 판정 아님</span></span>},
  {id:'evidence',header:'원문 근거',accessorFn:r=>r.evidence.join(' '),cell:c=><div className="workflow-cell">{c.row.original.evidence.length?c.row.original.evidence.map(id=><button className="text-btn" key={id} onClick={()=>evidence(id)}>{id}</button>):<span className="muted">근거 미등록</span>}</div>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>{select(c.row.original.id,false);go('EXPLORE')}}>객체·관계 탐색</Button>},
  {id:'basis',header:'개정 / 데이터 기준',accessorKey:'revision',cell:c=><span className="workflow-basis"><span>개정/버전 {c.row.original.revision}</span><small>{NOW.replace('T',' ').replace('+09:00',' KST')}</small><small>현재 QueryPort 속성 · {c.row.original.source}</small></span>}
 ]}/>;
}

const policies=[
 {id:'author-approver',name:'작성자와 승인자 분리',kind:'업무 정책',status:'기존 정책 조회',scope:'등록·정정 사실의 작성/승인 분리',note:'예약·초안 저장에 새 2인 승인 정책을 추가하지 않음'},
 {id:'approved-version',name:'승인한 버전만 원장 반영',kind:'업무 정책',status:'기존 정책 조회',scope:'정확 초안 버전·해시·기준 확인',note:'실제 서버 권한·원자 반영은 미연결'},
 {id:'event-trigger',name:'자동 이벤트 트리거',kind:'이벤트 트리거',status:'미연결',scope:'운영 트리거 엔진 미연결',note:'자동 정책 배포·현장 제어를 수행하지 않음'}
];
export function OntologyPolicyTable(){
 return <WorkflowTable contextMode="reference" tableKey="ontology-policies" data={policies} getRowId={row=>row.id} contextId={()=>undefined} searchLabel="정책·트리거·상태 검색" footer="정책/트리거 조회 행은 TBox 관계선이나 개별 업무 객체가 아닙니다. 행 선택은 현재 업무 AI 대상을 유지하며 정책 편집·배포·실행을 수행하지 않습니다." columns={[
  {id:'policy',header:'정책 / 트리거',enableHiding:false,accessorKey:'name'},
  {id:'kind',header:'정의 종류',accessorKey:'kind'},
  {id:'status',header:'지원 상태',accessorKey:'status',cell:c=><Badge>{c.getValue()}</Badge>},
  {id:'scope',header:'적용 범위',accessorKey:'scope'},
  {id:'unknown',header:'구현 경계 / 다음 조치',accessorKey:'note'},
  {id:'basis',header:'조회 기준',cell:()=> <span className="workflow-basis"><span>기존 로컬 정책 조회</span><small>TBox 초안과 별개 · 운영 정책 버전 미연결</small></span>}
 ]}/>;
}

type SavedVersion={version:number;base:number;author:string;status:string};
export function OntologyVersionTable({saved}:{saved:SavedVersion|null}){
 const {s}=useApp();
 const rows=[
  {id:'browser',layer:'브라우저 업무 시뮬레이션',version:'v'+s.version,status:'로컬 상태',at:NOW,scope:'현재 브라우저 업무 상태',next:'서버 원장 버전으로 해석하지 않음'},
  {id:'ledger',layer:'운영 원장',version:'미연결',status:'조회 불가',at:'미확인',scope:'서버 원장 조회 미연결',next:'버전·최종 성공·실패·대사 계약 연결 필요'},
  {id:'rdf',layer:'RDF / OWL 투영',version:'미연결',status:'조회 불가',at:'미확인',scope:'실제 RDF/OWL 엔진 미연결',next:'투영 버전·지연·검증 결과 연결 필요'},
  {id:'search',layer:'Neo4j / 검색 색인',version:'미연결',status:'조회 불가',at:'미확인',scope:'그래프·검색 색인 미연결',next:'원장과의 대사 결과 확인 필요'},
  {id:'tbox',layer:'TBox 격리 초안',version:saved?'v'+saved.version:'저장 없음',status:saved?.status??'미등록',at:'로컬 브라우저',scope:saved?'작성 '+saved.author+' · 기준 데이터 v'+saved.base:'저장한 격리 초안 없음',next:'운영 적용은 비활성 · 배포/영향 검사 계약 미연결'}
 ];
 return <WorkflowTable contextMode="reference" tableKey="ontology-versions" data={rows} getRowId={row=>row.id} contextId={()=>undefined} searchLabel="계층·버전·연결 상태 검색" footer="각 계층의 버전과 확인 범위는 서로 다릅니다. 미연결·조회 불가·미확인을 동기화 완료나 0으로 처리하지 않으며, 행 선택은 현재 업무 객체/AI를 유지합니다." columns={[
  {id:'layer',header:'계층 / 대상',enableHiding:false,accessorKey:'layer'},
  {id:'version',header:'버전 / 빌드',accessorKey:'version'},
  {id:'status',header:'연결 / 조회 상태',accessorKey:'status',cell:c=><Badge>{c.getValue()}</Badge>},
  {id:'scope',header:'기준 / 범위',accessorKey:'scope'},
  {id:'next',header:'다음 조치 / 미확인',accessorKey:'next'},
  {id:'basis',header:'기준시각 / 위치',accessorKey:'at',cell:c=><span className="workflow-basis">{c.row.original.at.replace('T',' ').replace('+09:00',' KST')}</span>}
 ]}/>;
}
