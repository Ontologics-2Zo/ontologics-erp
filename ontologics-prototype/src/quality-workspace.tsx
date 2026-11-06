import type {ReactNode} from 'react';
import {Download,ShieldCheck} from 'lucide-react';
import {useApp} from './context';
import {useEntity} from './entity';
import {Badge,Button,Notice,Panel,Field,useStored} from './ui';
import {RecordRequests} from './request-forms';
import {ClaimCaseTable,QualityImpactTable,QualityRequestTable,QualityResultsTable,QualityReproductionTable} from './quality-tables';
import type {ActionResult} from './ports';
function requireCompleted(result:ActionResult){if(result.status!=='completed')throw new Error(result.status==='unknown'?'요청 결과 미확인: 새 쓰기를 보내지 말고 기존 요청 상태를 확인하세요.':result.error??'요청을 처리하지 못했습니다.');}
function download(name:string,body:string){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+body],{type:'text/plain;charset=utf-8'}));a.download=name+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function PageTitle({id,title,sub,action}:{id:string;title:string;sub:string;action?:ReactNode}){return <div className="page-title"><div><span className="eyebrow">{id} / MANUFACTURING OPERATIONS</span><h1>{title}</h1><p>{sub}</p></div>{action}</div>}
function Req({ids}:{ids:string}){return <div className="req"><ShieldCheck size={13}/>{ids}</div>}
const synthetic=<Badge tone="purple">가상 운영 기록</Badge>;
export function Claims(){const {s,set,run,go,evidence,toast,action}=useApp();const {select}=useEntity();const [board,B]=useStored('claimBoard','U104'),[body,T]=useStored('claimBody','고객 신고 C-001: U104 전원 동작이 불안정하다는 신고. 원인은 확인되지 않음.'),[request,R]=useStored('claimRequest','사건 C-001 · U104\n요청: 관련 이력 보완과 시험 의뢰 검토\n생산 중단 / 출고 보류 필요 여부는 책임자가 검토\n근거: DEMO-CLAIM-01, DEMO-TRACE-01\nD02 작업 참조는 고정 ID 사용 · D03 개별 보드의 출하 연결 근거 미확인\n요청 문서이며 현장 중단 실행이나 수신 확인이 아님.'),[tab,S]=useStored('claimTab','신고·영향 조사');const save=async(name:string)=>{requireCompleted(await action({operation:'document.save',document:{name,body:request,status:'초안 저장'}}));toast('검토 초안 저장 · 송부·수신·현장 실행 미확인');};const registeredBoard=s.claimRecord?.board;return <>
<PageTitle id="UI09" title="클레임·대응" sub="고객 신고, 조사 범위, 시험팀 판정을 구별하여 대응안을 검토합니다." action={synthetic}/>
<ClaimCaseTable onRequests={()=>S('요청서·시험 의뢰')}/><div className="segmented wide" data-view-state="true">{['신고·영향 조사','요청서·시험 의뢰','결과·재생산 검토'].map(x=>
<button className={tab===x?'active':''} key={x} onClick={()=>S(x)}>{x}</button>)}</div>{tab==='신고·영향 조사'&&<>
<Panel title="신고 원문 확인" subtitle="시연은 본문 직접 입력을 지원합니다. 메일·엑셀·CSV 자동 추출은 미연동입니다.">
<div className="inset">
{s.claim&&board!==registeredBoard&&<Notice tone="warning">현재 입력 대상 {board}와 접수 기록 대상 {registeredBoard??'미등록'}이 다릅니다. 입력 변경은 접수 원문·대상 정정이 아닙니다.</Notice>}
<Field label="고객 신고 원문">
<textarea value={body} onChange={e=>T(e.target.value)}/>
</Field>
<Field label="등록된 보드 식별자">
<input value={board} onChange={e=>B(e.target.value)}/>
</Field>
<div className="actions">
<Button primary onClick={()=>run(async()=>{if(!s.boardIds.includes(board))throw new Error('등록되지 않은 보드입니다. UI03에서 식별 정보를 보완하세요.');if(!body.trim())throw new Error('신고 원문을 입력하세요.');if(s.claim){toast('동일 신고 C-001이 이미 접수되었습니다. 중복 생성하지 않습니다.');return;}requireCompleted(await action({operation:'claim.register',claim:{board,body,evidence:'DEMO-CLAIM-01'}}));})}>신고 확인·접수</Button>
<Button onClick={()=>go('UI03')}>식별 정보 보완</Button>
</div>
</div>
</Panel>
<Panel title="영향 범위와 근거" subtitle="동일 라인·로트라는 관계는 불량 또는 원인 판정이 아닙니다.">
<div className="inset">
<Notice tone="warning">고정 작업 참조 계약은 정의되어 있습니다. 이 fixture에는 개별 보드와 출하의 연결 근거가 없으므로 라인·납품 전체 보드 목록으로 확장하지 않습니다.</Notice>
</div><QualityImpactTable targetId={s.claim?registeredBoard:board} registered={s.claim}/><div className="inset"><Button onClick={()=>{select('LOT-L07',false);go('UI04')}}>L07 장착 조사</Button><Notice>이 버튼은 별도 로트 조사 맥락을 엽니다. 현재 입력·신고 대상과 로트의 장착 관계를 새로 확정하지 않습니다.</Notice></div></Panel>
</>}{tab==='요청서·시험 의뢰'&&<><Panel title="검토할 요청 문서" subtitle="중단·출고 보류 요청과 실제 현장 실행을 구별합니다.">
<div className="inset">
{s.claim&&board!==registeredBoard&&<Notice tone="warning">현재 입력 대상 {board}와 접수 대상 {registeredBoard??'미등록'}이 다릅니다. 아래 문서는 구조화 대상이 검증되지 않은 초안이며 기존 접수의 정정·현장 의뢰·상대 수신을 의미하지 않습니다.</Notice>}
<Field label="요청 대상·사유·근거">
<textarea rows={9} value={request} onChange={e=>R(e.target.value)}/>
</Field>
<Notice>생성 → 사람 검토 → 사람 별도 송부 → 수신 확인 → 현장 반영은 각각 다른 상태입니다. 현재는 브라우저 문서 초안만 저장합니다.</Notice>
<div className="actions">
<Button primary onClick={()=>run(async()=>{if(!s.claim)throw new Error('신고 확인·접수를 먼저 진행하세요.');if(!request.includes(board))throw new Error('요청 대상 보드가 사건과 일치하지 않습니다.');await save('중단·출고 보류 검토 요청');})}>요청서 초안 저장</Button>
<Button onClick={()=>run(async()=>{if(!s.claim)throw new Error('신고 확인·접수를 먼저 진행하세요.');await save('시험 의뢰 검토 초안');})}>시험 의뢰 초안 저장</Button>
<Button onClick={()=>download('대응 검토 요청',request)}>
<Download size={16}/>다운로드</Button>
</div>
</div>
</Panel><QualityRequestTable onDownload={download}/></>}{tab==='결과·재생산 검토'&&<>
<Panel title="시험팀 제공 자료" subtitle="D06 시험 결과 계약은 정의됨 · 아래는 가상 시험팀 결과 예시이며 실제 시험 자료가 아닙니다.">
<div className="inset">
<Button primary disabled={!s.claim||!registeredBoard||registeredBoard!==board} title={!s.claim?'신고 접수와 대상 확인이 필요합니다.':!registeredBoard?'접수 기록의 대상 ID가 미등록입니다.':registeredBoard!==board?'현재 입력 대상과 접수 대상이 다릅니다.':''} onClick={()=>run(async()=>{if(!s.claim)throw new Error('신고 접수와 의뢰 대상 확인이 먼저 필요합니다.');if(board!=='U104')throw new Error('가상 시험 자료의 대상 U104가 현재 사건 대상과 다릅니다.');if(!s.docs.some(d=>d.name==='시험 의뢰 검토 초안'))throw new Error('시험 의뢰 초안을 먼저 확인·저장하세요.');requireCompleted(await action({operation:'claim.link_example',claim:{board,body,evidence:'DEMO-TEST-01'}}));})}>가상 시험팀 결과 예시 연결</Button>
</div>
{s.claim&&(!registeredBoard||registeredBoard!==board)&&<div className="inset"><Notice tone="warning">접수 대상 {registeredBoard??'미등록'}와 현재 입력 {board}의 일치 확인이 필요합니다. 원문 정정·대상 검토 전 시험 예시를 새로 연결할 수 없습니다. 기존 자료는 삭제하지 않습니다.</Notice></div>}{s.testLinked&&registeredBoard!=='U104'&&<div className="inset"><Notice tone="warning">기존 시험 예시의 대상은 U104이며 접수 기록 대상 {registeredBoard??'미등록'}과 일치가 확인되지 않았습니다. 예시 자료는 보존하지만 이 신고의 시험 결과로 확정하지 않습니다.</Notice></div>}<QualityResultsTable/>
<div className="inset">
<Notice>상충 결과는 최신 하나로 덮어쓰지 않으며 미검사·미결을 정상이나 수요 0으로 처리하지 않습니다. 실제 결과 업로드·충돌 병합은 미연동입니다.</Notice>
</div>
</Panel>
<Panel title="구성별 재생산 검토" subtitle="요구사항의 독립적인 검증용 수량 예시 · 위 보드 목록에서 추론한 수요가 아닙니다.">
<QualityReproductionTable/>
<div className="inset">
<Notice tone="warning">미검사·확인 범위 부족을 유지하므로 8대를 전체 최종 수요나 실제 생산 지시로 확정하지 않습니다. 계획 화면의 기존 계약 수요는 이 예시로 덮어쓰지 않습니다.</Notice>
<Button onClick={()=>run(async()=>{requireCompleted(await action({operation:'handoff.save',handoff:{incident:'C-001',configuration:'X (독립 검증용 가상 구성)',quantity:8,unresolved:'미검사 대상 존재 · 실제 시험·영향 범위 근거 대기',version:s.version,evidence:'요구사항 14장 가상 수량 예시'},document:{name:'재생산 검토 인계 후보',body:'사건 C-001 / X 교체 10, 같은 구성 가용 2, 확인 범위 수요 8 / 미결 존재 / 가상 사례',status:'인계 후보 저장'}}));go('UI07')})}>재생산 검토 요청 후보 저장·계획 화면 열기</Button>
</div>
</Panel>
</>}<RecordRequests mode="test"/>
<Req ids="CLM-01~06 · AT06 · D01/D02/D03/D06 · 실제 원장 연결 미구현"/>
</>}
