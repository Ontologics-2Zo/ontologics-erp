import {useState} from 'react';
import {ArrowUpRight,ShieldCheck} from 'lucide-react';
import {useApp} from './context';
import {Badge,Button,Modal,Notice,Panel,useStored} from './ui';
import {WorkflowTable} from './workflow-tables';
import requirements from './requirements.json';

type Requirement=typeof requirements[number];
const pageLabels:Record<string,string>={UI01:'운영 홈',UI02:'제품·BOM 등록',UI03:'개별 보드 등록',UI04:'로트·장착 조사',UI05:'검토·승인',UI06:'문서·근거',UI07:'생산 계획·입고',UI08:'생산 실적·납품',UI09:'클레임·품질'};
const acceptance=[
 ['AT01','원본 → 추출 → 차이 → 초안 → 별도 승인 → 재조회','대표 원본·클라이언트 승인 시연'],
 ['AT02','L07 조사 → U104 보완 → 동일 A/B 비교','A 제외 / B 포함, U106 미확인'],
 ['AT03','자기 승인 → 다른 신원 → 정확 버전 → 재시도','브라우저 검증. 서버 권한 미연동'],
 ['AT04','수요 → 예약 → 검수 합격 → 할당 → 일정','고정 조건부 일정. 실제 일정 엔진 미연동'],
 ['AT05','100/60/50 → 20/15 출하 → 첫 20 도착','40/10/15/20/15/80 보존'],
 ['AT06','신고 → 조사 → 의뢰 → 시험 자료 → 재생산','범위가 제한된 합성 시험 결과 · 실제 원문 연결 부분'],
 ['AT07','직접 조회 ↔ AI 패널 / 장애·승인 요구','규칙 기반 응답. LLM·공통 Host 미연동'],
 ['AT08','PostgreSQL/RDF/Neo4j 동일 결과·버전','관계 UI 구현 · 실제 RDF/Neo4j 비교 미구현']
].map(([id,flow,status])=>({id,flow,status}));
const boundaries=[
 ['구현','React/TypeScript · UI01~09 · Radix Dialog · TanStack Table · Recharts · Lucide · 브라우저 상태 저장 · 공통 도메인 계산'],
 ['원본','고정 커밋 L/L1 ODS·PDF 4개, 원문 행과 SHA-256. 일반 파서·OCR 미연동'],
 ['미연동','HTTP API · IdentityProvider · 서버 승인/원자 반영 · 실제 DB/그래프 · LLM/검색 · ERP · 자동 송부 · 현장 제어 · AWS'],
 ['저장','이 브라우저의 localStorage만 사용. 다중 사용자·다중 탭 동시성, 서버 복구·백업은 지원하지 않음'],
 ['시연 신원','Alice 작성 / Bob 별도 검토 / Viewer 조회. 실제 사용자·권한 체계 아님'],
 ['운영 한도','D07 미결. 실제 비용·시간·토큰 한도를 임의 확정하지 않음']
].map(([id,note])=>({id,note}));
const metadataFooter='요구·결정·수용 ID는 업무 객체가 아닙니다. 체크는 이 목록의 선택만 보존하고 현재 객체·AI 대상·원장·승인 상태를 바꾸지 않습니다. 실행 검사 결과는 배포 문서 VALIDATION.md에서 별도로 확인합니다.';
function DefinitionBasis(){return <span className="workflow-basis"><span>v1.5 참조 정의 · 로컬 구현 설명</span><small>시연 상태 ≠ 운영 수용 완료</small><small>이번 실행 검사는 별도 기록</small></span>}

export function RequirementsWorkspace({decisions}:{decisions:string[][]}){
 const {go}=useApp();
 const [tab,T]=useStored('workflow-view-requirements-tab','요구사항'),[status,S]=useStored('workflow-view-requirements-status','전체');
 const [opened,O]=useState<Requirement|null>(null),[scenario,A]=useState<typeof acceptance[number]|null>(null);
 const route=(page:string)=>pageLabels[page]?<Button key={page} onClick={()=>go(page)}>{page} · {pageLabels[page]} <ArrowUpRight size={12}/></Button>:<Badge key={page}>{page}</Badge>;
 const requirementRows=requirements.filter(r=>status==='전체'||r.status===status);
 return <>
 <div className="page-title"><div><span className="eyebrow">검증 센터 / MANUFACTURING OPERATIONS</span><h1>요구사항·수용 검증</h1><p>요구사항의 존재, 프론트엔드 시연, 실제 서비스 수용 완료를 구분합니다.</p></div></div>
 <div className="segmented wide">{['요구사항','D01~D07 구현 경계','수용 시나리오','연동 범위'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>T(x)}>{x}</button>)}</div>
 <Notice>이 목록은 요구·계약·구현 범위의 정의입니다. 업무 객체나 실제 검사 결과가 아니며 사진·객체 관계를 임의로 연결하지 않습니다. 기존 객체와 AI 맥락은 유지됩니다.</Notice>
 {tab==='요구사항'&&<Panel title="요구사항 → 화면·액션·수용 테스트" subtitle="정의서에서 추출한 45개 요구 ID. 상세 수행 범위는 배포 산출물의 추적표와 테스트 결과를 참조하세요." action={<select aria-label="요구 구현 상태" data-view-state="true" value={status} onChange={e=>S(e.target.value)}>{['전체',...new Set(requirements.map(r=>r.status))].map(value=><option key={value}>{value}</option>)}</select>}>
 <WorkflowTable contextMode="reference" tableKey="requirements-definitions" data={requirementRows} getRowId={r=>r.id} contextId={()=>undefined} pageSizes={[5,15,45]} searchLabel="요구 ID·기능·화면 검색" footer={metadataFooter} columns={[
  {id:'requirement',header:'요구 ID · 기능',enableHiding:false,accessorFn:r=>r.id+' '+r.title,cell:c=><div className="workflow-cell"><button className="text-btn" onClick={()=>O(c.row.original)}>{c.row.original.title}</button><code>{c.row.original.id}</code><small>{c.row.original.section}</small></div>},
  {id:'pages',header:'적용 화면',accessorFn:r=>r.pages.join(' '),cell:c=><div className="workflow-actions">{c.row.original.pages.map(route)}</div>},
  {id:'implementation',header:'액션·상태와 구현 범위',accessorKey:'implementation',cell:c=><span>{c.getValue()}</span>},
  {id:'status',header:'구현 경계',accessorKey:'status',cell:c=><div className="workflow-cell"><Badge tone="amber">{c.getValue()}</Badge><small>원문 구현 설명 · 운영 완료 아님</small></div>},
  {id:'test',header:'수용 ID',accessorKey:'test',cell:c=><button className="text-btn" onClick={()=>A(acceptance.find(x=>x.id===c.getValue())??null)}>{c.getValue()}</button>},
  {id:'next',header:'다음 확인',cell:c=><Button onClick={()=>O(c.row.original)}>요구 원문·수용 기준</Button>},
  {id:'basis',header:'정의 / 검증 기준',cell:()=> <DefinitionBasis/>}
 ]}/></Panel>}
 {tab==='D01~D07 구현 경계'&&<Panel title="v1.5 공통 계약과 현재 구현" subtitle="업무 의미가 정의된 것과 운영 서버가 구현된 것은 다릅니다.">
 <WorkflowTable contextMode="reference" tableKey="requirements-decisions" data={decisions.map(([id,title,note])=>({id,title,note}))} getRowId={r=>r.id} contextId={()=>undefined} pageSizes={[5,15,30]} searchLabel="결정 ID·항목·구현 경계 검색" footer={metadataFooter} columns={[
  {id:'decision',header:'결정 ID · 항목',enableHiding:false,accessorFn:r=>r.id+' '+r.title,cell:c=><div className="workflow-cell"><strong>{c.row.original.title}</strong><code>{c.row.original.id}</code></div>},
  {id:'note',accessorKey:'note',header:'현재 UI의 제한'},
  {id:'status',header:'상태',cell:()=> <div className="workflow-cell"><Badge tone="amber">로컬 / 운영 미연결</Badge><small>정의 채택과 구현/운영 수용 구별</small></div>},
  {id:'basis',header:'정의 / 검증 기준',cell:()=> <DefinitionBasis/>}
 ]}/></Panel>}
 {tab==='수용 시나리오'&&<Panel title="수용 시연과 실제 수용의 경계" subtitle="기존 AT01~08의 정의와 구현 경계를 보존합니다. 이 표는 이번 시험의 통과/실패 기록이 아닙니다.">
 <WorkflowTable contextMode="reference" tableKey="requirements-acceptance" data={acceptance} getRowId={r=>r.id} contextId={()=>undefined} pageSizes={[5,15,30]} searchLabel="수용 ID·흐름·남은 검증 검색" footer={metadataFooter} columns={[
  {id:'id',accessorKey:'id',header:'수용 ID',enableHiding:false,cell:c=><button className="text-btn" onClick={()=>A(c.row.original)}>{c.getValue()}</button>},
  {id:'flow',accessorKey:'flow',header:'수행 흐름'},
  {id:'status',accessorKey:'status',header:'시연 / 남은 검증'},
  {id:'scope',header:'검사와 구분',cell:()=> <Badge>시나리오 정의</Badge>},
  {id:'next',header:'다음 확인',cell:c=><Button onClick={()=>A(c.row.original)}>수용 정의 전체 보기</Button>},
  {id:'basis',header:'정의 / 검증 기준',cell:()=> <DefinitionBasis/>}
 ]}/></Panel>}
 {tab==='연동 범위'&&<Panel title="프로토타입 경계"><div className="inset"><Notice tone="warning">프론트엔드 프로토타입입니다. 실제 서비스 구현 완료, 운영 인증·복구 완료, 업무 효율 개선을 주장하지 않습니다.</Notice></div>
 <WorkflowTable contextMode="reference" tableKey="requirements-integration" data={boundaries} getRowId={r=>r.id} contextId={()=>undefined} pageSizes={[5,15,30]} searchLabel="연동 영역·지원 범위 검색" footer={metadataFooter} columns={[
  {id:'area',header:'영역',accessorKey:'id',enableHiding:false},
  {id:'note',header:'구현·미연결 범위',accessorKey:'note'},
  {id:'scope',header:'실행 범위',cell:()=> <div className="workflow-cell"><Badge>로컬 / 테스트</Badge><small>실제 운영·외부 실행 아님</small></div>},
  {id:'basis',header:'정의 / 검증 기준',cell:()=> <DefinitionBasis/>}
 ]}/></Panel>}
 <Modal open={!!opened} onClose={()=>O(null)} title="요구 원문·수용 기준" description="요구 정의의 전체 문장입니다. 이 모달은 업무 객체 상세나 실행 시험 판정이 아닙니다.">{opened&&<><div className="review-summary"><code>{opened.id}</code><Badge tone="amber">{opened.status}</Badge><strong>{opened.title}</strong></div><dl className="details"><dt>원문 절</dt><dd>{opened.section}</dd><dt>업무 흐름</dt><dd>{opened.flow}</dd><dt>수용 기준</dt><dd>{opened.accept}</dd><dt>현재 구현 설명</dt><dd>{opened.implementation}</dd><dt>적용 화면</dt><dd><div className="workflow-actions">{opened.pages.map(route)}</div></dd><dt>수용 시나리오</dt><dd>{opened.test}</dd></dl><Notice>현재 운영 수용 또는 최신 시험 통과를 의미하지 않습니다. 최신 실행 기록과 미검증 항목은 VALIDATION.md에서 확인합니다.</Notice></>}</Modal>
 <Modal open={!!scenario} onClose={()=>A(null)} title="수용 시나리오 정의" description="기존 수용 흐름과 시연 한계를 조회합니다. 실행 결과가 아닙니다.">{scenario&&<><code>{scenario.id}</code><h3>{scenario.flow}</h3><p>{scenario.status}</p><Notice>AT05 등 고정 예시 수량은 정의된 시연 순서입니다. 다른 스냅샷의 최신 업무 수량이나 이번 실행 결과로 바꾸지 않습니다.</Notice></>}</Modal>
 <div className="req"><ShieldCheck size={13}/>기존 요구 45개 · D01~D07 · AT01~AT08 · 운영 수용과 구별</div>
 </>;
}
