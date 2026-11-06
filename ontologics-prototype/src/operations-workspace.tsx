import {useState} from 'react';
import {ArrowDownToLine,Search} from 'lucide-react';
import {useApp} from './context';
import {useEntity} from './entity';
import {Badge,Button,Modal,Notice,Panel,useStored} from './ui';
import {totals,NOW,type State} from './domain';
import {WorkflowTable,WorkflowPhoto,WorkflowObject,QuantityCell,WorkflowBasis} from './workflow-tables';
import './extended.css';

type AuditEvent=State['events'][number];
type StatusRow={id:string;name:string;status:string;scope:string};
const statuses:StatusRow[]=[
 {id:'local-graph',name:'GraphProjectionPort · 개발 전용',status:'선택 연결 · 5176',scope:'상단 별도 그래프 연결 상태 참조 · 로컬 Mock 조회 사본 · 운영 인증 아님'},
 {id:'query-graph',name:'Query / Graph',status:'로컬 fixture',scope:'회사 범위 필터와 제한 표시 · 운영 서버 미연결'},
 {id:'action-identity',name:'Action / Identity',status:'UI 시뮬레이션',scope:'별도 승인·버전·멱등성 로컬 검증 · 서버 보안 아님'},
 {id:'agent',name:'AgentPort',status:'예시 응답',scope:'실제 Agent·LLM 미연결 · 지연 응답 격리'},
 {id:'media',name:'MediaPort',status:'제공 자료 / 미등록',scope:'사진의 대상·출처·개정 일치 별도 표시'},
 {id:'source-coverage',name:'4종 실제 보드 원본',status:'확보 미완료',scope:'실제 공개 자료는 ESP32-PoE L/L1 · 다른 확보 대상은 원본 미등록 / 합성 예시는 별도'},
 {id:'bom-parser',name:'BOM 파서',status:'대표 원본 추출',scope:'L/L1 원본 · 범용 OCR/파서 미연결'},
 {id:'ontology-engine',name:'RDF / OWL / SHACL',status:'운영 엔진 미연결',scope:'TBox 편집은 격리 초안 · 검증은 모의'},
 {id:'external-execution',name:'ERP · 메일 · 현장 제어',status:'연결 없음',scope:'실제 발주·메일·설비·결제 실행하지 않음'},
 {id:'scale-target',name:'10만 객체 검증',status:'구축 목표',scope:'실제 100,000개 적재·부하 시험 미수행'}
];
const ports=['QueryPort','GraphPort','ActionPort','IdentityPort','AgentPort','MediaPort'];
// The ledger prepends events. Count identical records from oldest to newest so
// a later duplicate does not change existing display identities.
function auditRows(events:AuditEvent[]){const counts=new Map<string,number>();return [...events].reverse().map(event=>{const key=JSON.stringify([event.time,event.action,event.detail]),ordinal=counts.get(key)??0;counts.set(key,ordinal+1);return {...event,id:key+'#'+ordinal}}).reverse()}
function download(name:string,value:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

export function Operations(){
 const {s,go}=useApp(),{company,select}=useEntity();
 const [tab,T]=useStored('workflow-view-operations-tab','audit'),[query,Q]=useStored('workflow-view-operations-audit-query','');
 const [audit,A]=useState<AuditEvent|null>(null),[status,S]=useState<StatusRow|null>(null),[port,P]=useState<string|null>(null);
 const t=totals(s),rows=company==='A'?auditRows(s.events).filter(x=>(x.action+' '+x.detail).includes(query)):[];
 const report=[
  {id:'normal-production',state:'정상 생산 완료',qty:s.production,basis:'생산 목표 100대 기준 누계',context:'JOB-2609-01',photo:'CFG-POE-L1',note:'누계 · 입고/출하와 합산 금지'},
  {id:'warehouse-remaining',state:'창고 잔량',qty:t.warehouse,basis:'완성품 입고 − 출하',context:'JOB-2609-01',photo:undefined,note:'현재 위치 수량 · 추가 생산량 아님'},
  {id:'in-transit',state:'운송 중',qty:t.transit,basis:'출하 − 도착',context:'ROUND-01',photo:undefined,note:'현재 위치 수량 · 도착과 구별'},
  {id:'arrived',state:'실제 도착',qty:t.arrived,basis:'도착 사건 합계',context:'ROUND-01',photo:undefined,note:'납품 완료 · 출하 누계와 합산 금지'},
  {id:'promise-remaining',state:'잔여 납품 약속',qty:t.promiseRemaining,basis:'약속 100 − 실제 도착 / 추가 생산 필요량과 별개',context:'ROUND-01',photo:undefined,note:'약속 잔량 · 추가 생산 필요량 아님'}
 ];
 return <div className="ext-workspace">
 <div className="ext-title"><div><span className="ext-eyebrow">OPERATIONS / 운영 근거</span><h1>운영 감사 · 연결 상태</h1><p>업무의 변경 근거와 실제 구현 경계를 확인합니다.</p></div></div>
 <div className="ext-tabs" role="tablist" data-view-state="true">{[{id:'audit',label:'변경 · 실행 감사',count:rows.length},{id:'report',label:'운영 리포트'},{id:'status',label:'연결 · 구현 상태'},{id:'handoff',label:'개발 · Agent 연결'}].map(x=><button key={x.id} type="button" role="tab" aria-selected={tab===x.id} onClick={()=>T(x.id)}>{x.label}{x.count!==undefined&&<span>{x.count}</span>}</button>)}</div>
 {tab==='audit'&&<Panel title="로컬 업무 사건" subtitle="이 브라우저에서 발생한 시연 이력 · 운영 감사 원장 미연결" action={<Button onClick={()=>download('ontologics-audit-local.json',{company,origin:'local-simulation',events:rows.map(({id,...event})=>event)})}><ArrowDownToLine size={14}/>내보내기</Button>}>
 <div className="ext-filter" data-view-state="true"><label><Search size={15}/><input type="search" aria-label="감사 사건 검색" value={query} onChange={e=>Q(e.target.value)} placeholder="행동 · 대상 · 근거 검색"/></label></div>
 <WorkflowTable tableKey="operations-audit" contextMode="reference" data={rows} getRowId={r=>r.id} contextId={()=>undefined} searchable={false} empty="현재 범위에 기록된 업무 사건이 없습니다." footer="원문 감사의 대상·근거 문자열로 객체·승인 버전·수량을 추정하지 않습니다. 표시 행 ID는 원문 조합과 중복 순번이며 업무 사건 ID가 아닙니다. 내보내기는 검색 조건의 원문 전체를 보존합니다." columns={[
  {id:'time',accessorKey:'time',header:'기록 시각',cell:c=><span className="workflow-basis">{new Date(c.getValue()).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}<small>KST · 원문 시각 보존</small></span>},
  {id:'action',accessorKey:'action',header:'행동',enableHiding:false,cell:c=><button className="text-btn" onClick={()=>A(c.row.original)}>{c.getValue()}</button>},
  {id:'detail',accessorKey:'detail',header:'대상 · 근거 원문',cell:c=><span style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{c.getValue()}</span>},
  {id:'scope',header:'회사 / 객체 연결',cell:()=> <div className="workflow-cell"><Badge>회사 {company} · 합성</Badge><small>구조화 객체·버전 미등록</small></div>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>A(c.row.original)}>감사 원문 확인</Button>},
  {id:'basis',header:'조회 기준',cell:()=> <WorkflowBasis version={s.version} evidence="실제 운영 감사 원장 미연결"/>}
 ]}/></Panel>}
 {tab==='report'&&(company==='A'?<>
 <div className="ext-statline"><button onClick={()=>go('UI05')}><small>검토 요청</small><strong>{s.drafts.filter(d=>d.status==='검토 요청').length}<em>건</em></strong><span>현재 초안 상태 기준</span></button><button onClick={()=>go('UI08')}><small>실제 도착 / 약속</small><strong>{t.arrived}<em> / 100대</em></strong><span>완성품 · 합성 회차 1건</span></button><button onClick={()=>go('UI08')}><small>운송 중</small><strong>{t.transit}<em>대</em></strong><span>출하 − 도착</span></button><button onClick={()=>go('UI04')}><small>이력 추가 확인</small><strong>{s.traceCorrected?'1':'2'}<em>개 보드</em></strong><span>확인 범위가 불충분한 대상</span></button></div>
 <Notice>합성 업무의 현재 상태입니다. 시간 절감·모델 정확도·현업 성과는 측정하지 않았습니다. 정상 생산·입고·출하 누계를 합산하지 않습니다.</Notice>
 <Panel title="수량 상태와 분모" subtitle="기존 단일 작업·회차 시연 원장의 같은 계산입니다. 실제 개별 보드 소속을 추정하지 않습니다.">
 <WorkflowTable tableKey="operations-quantities" data={report} getRowId={r=>r.id} contextId={r=>r.context} searchLabel="수량 의미·계산 기준 검색" footer="생산 누계·현재 위치·잔여 약속은 서로 다른 수량입니다. 표 행을 더하지 않습니다. 설계 구성 사진은 실제 생산·창고·운송 중인 보드의 사진이 아닙니다." columns={[
  {id:'photo',header:'설계 참고',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.photo}/>},
  {id:'state',accessorKey:'state',header:'수량의 의미',enableHiding:false},
  {id:'object',header:'단일 시연 범위',accessorFn:r=>r.context,cell:c=><WorkflowObject id={c.row.original.context} detail={c.row.original.context==='JOB-2609-01'?'고정 작업 원장 · 개별 보드 연결 미확인':'고정 납품회차 · 제품/개별 보드 연결 미확인'}/>},
  {id:'quantity',header:'수량 / 단위',accessorKey:'qty',cell:c=><QuantityCell value={c.getValue()} unit="대" note={c.row.original.note}/>},
  {id:'calculation',accessorKey:'basis',header:'계산 기준'},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>{select(c.row.original.context,false);go('UI08')}}>생산·납품 근거 확인</Button>},
  {id:'basis',header:'데이터 기준',cell:()=> <WorkflowBasis version={s.version} at={NOW} evidence="기존 totals 계산 · 합성 운영 원장"/>}
 ]}/></Panel></>:<Notice>현재 회사 범위에 집계 가능한 운영 자료가 없습니다.</Notice>)}
 {tab==='status'&&<><Panel title="실제 연결 범위" subtitle="구현 경계 목록이며 실시간 서버 상태나 운영 인수 결과가 아닙니다.">
 <WorkflowTable tableKey="operations-status" contextMode="reference" data={statuses} getRowId={r=>r.id} contextId={()=>undefined} searchLabel="기능·연결 상태·제한 검색" footer="포트·엔진·구축 목표는 업무 객체가 아닙니다. 사진/객체 관계를 만들지 않으며 행 선택은 현재 AI 대상을 유지합니다. 실제 상태 점검·배포·권한 변경을 실행하지 않습니다." columns={[
  {id:'name',accessorKey:'name',header:'기능 / 포트',enableHiding:false,cell:c=><button className="text-btn" onClick={()=>S(c.row.original)}>{c.getValue()}</button>},
  {id:'status',accessorKey:'status',header:'현재 구현 상태',cell:c=><Badge>{c.getValue()}</Badge>},
  {id:'scope',accessorKey:'scope',header:'범위와 제한'},
  {id:'verification',header:'운영 검증',cell:()=> <span className="workflow-cell-note">실시간 점검·운영 인수 미수행</span>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>S(c.row.original)}>연결 범위 확인</Button>},
  {id:'basis',header:'표시 기준',cell:()=> <span className="workflow-basis"><span>로컬 구현 경계</span><small>현재 데이터 v{s.version}와 별개</small><small>실서버 점검 시각 미등록</small></span>}
 ]}/></Panel><Notice>버튼·파일·폴더의 존재가 운영 인수 완료를 뜻하지 않습니다. 실제 서버 권한·동시성·대사·부하 검증은 별도 통합 단계입니다.</Notice></>}
 {tab==='handoff'&&<><div className="ext-review-grid"><Panel title="공통 담당 범위"><div className="ext-panel-pad"><p>데이터 · 공통 SDK · 계산 · 도구 · DB · 권한 · 화면 · 인프라 · 통합</p><p>공개 포트에서 회사 범위·버전·근거·승인 정책을 검증합니다.</p></div></Panel><Panel title="동료 Agent 범위"><div className="ext-panel-pad"><p>제공된 AgentPort 입력을 받아 구조화된 결과·근거·미확인·다음 행동을 반환합니다.</p><p>프론트엔드는 Agent 내부 코드를 import하지 않습니다.</p></div></Panel></div>
 <Panel title="연결해야 할 공통 접점">
 <WorkflowTable tableKey="operations-ports" contextMode="reference" data={ports.map(id=>({id}))} getRowId={r=>r.id} contextId={()=>undefined} searchLabel="공통 포트 이름 검색" footer="프론트엔드는 공통 포트를 사용합니다. 포트 이름을 업무 객체나 실제 어댑터 연결 성공으로 취급하지 않으며 운영 호출을 실행하지 않습니다." columns={[
  {id:'port',accessorKey:'id',header:'공통 포트',enableHiding:false,cell:c=><button className="text-btn mono" onClick={()=>P(c.row.original.id)}>{c.getValue()}</button>},
  {id:'boundary',header:'연결 경계',cell:()=> <span>로컬 Mock ↔ 실제 어댑터 경계</span>},
  {id:'status',header:'연결 상태',cell:()=> <Badge>실제 어댑터 미연결</Badge>},
  {id:'owner',header:'공통 / Agent 역할',cell:c=><span className="workflow-cell-note">{c.row.original.id==='AgentPort'?'공통 인터페이스 · 동료는 Agent 내부 구현':'공통 담당 · SDK/도구/데이터/권한/화면/통합'}</span>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>P(c.row.original.id)}>연결 경계 확인</Button>},
  {id:'basis',header:'확인 범위',cell:()=> <span className="workflow-cell-note">포트 정의·로컬 Mock과 실서버 인수를 구별</span>}
 ]}/></Panel><Notice>개인 모델·정답·비용 평가는 로컬 전용이며 업무 메뉴에서 원자료를 공개하지 않습니다. 실험 미실행 상태를 가상 정확도나 0원 비용으로 채우지 않습니다.</Notice></>}
 <Modal open={!!audit} onClose={()=>A(null)} title="감사 원문" description="등록된 시연 감사 원문을 그대로 확인합니다. 객체·승인 사실을 추정하지 않습니다.">{audit&&<dl className="details"><dt>기록 시각 원문</dt><dd className="mono">{audit.time}</dd><dt>행동</dt><dd>{audit.action}</dd><dt>대상·근거 원문</dt><dd style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{audit.detail}</dd><dt>범위</dt><dd>회사 {company} · 로컬 합성 · 구조화 객체/버전 미등록</dd></dl>}</Modal>
 <Modal open={!!status} onClose={()=>S(null)} title="연결 범위 상세" description="현재 구현 경계를 읽습니다. 실제 점검·배포·설정 변경을 실행하지 않습니다.">{status&&<><h3>{status.name}</h3><Badge>{status.status}</Badge><p>{status.scope}</p><Notice>실제 서버 권한·동시성·대사·부하 검증과 운영 인수는 미완료입니다.</Notice></>}</Modal>
 <Modal open={!!port} onClose={()=>P(null)} title="공통 포트 연결 경계" description="등록된 로컬 인터페이스와 실제 어댑터 연결은 별개입니다.">{port&&<><h3>{port}</h3><p>로컬 Mock ↔ 실제 어댑터 경계</p><Badge>실제 어댑터 미연결</Badge><Notice>공통 담당이 데이터·SDK·계산·도구·DB·권한·화면·인프라·통합을 관리합니다. 동료는 제공된 인터페이스를 사용하는 Agent 내부만 구현하며 프론트엔드는 Agent 내부 코드를 import하지 않습니다.</Notice></>}</Modal>
 </div>;
}
