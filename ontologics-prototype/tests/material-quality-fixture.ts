import {workflowFixture} from './workflow-fixture';
import {investigation,defaultConditions,NOW,makeDraft,approve,apply} from '../src/domain';
import {createMockActionPort,type ActionCommand,type PortContext} from '../src/ports';

/** Capture fixture for an isolated browser only. No application imports this module. */
export async function materialQualityFixture(){
 let state=await workflowFixture();
 const context=():PortContext=>({companyId:'A',actor:'Alice',identityRevision:1,contextRevision:1,entityId:'U104',configurationId:'CFG-POE-L1',dataVersion:state.version,asOf:NOW});
 const port=createMockActionPort({getState:()=>state,setState:next=>{state=next},getContext:context});
 let sequence=0;
 const execute=async(command:Omit<ActionCommand,'context'|'expectedVersion'|'idempotencyKey'>)=>{
  const result=await port.execute({...command,context:context(),expectedVersion:state.version,idempotencyKey:'v24-capture-'+(++sequence)});
  if(result.status!=='completed')throw Error(result.error??'Capture fixture operation did not complete');
 };
 const claim={board:'U104',body:'고객 신고 C-001: U104 전원 동작이 불안정하다는 신고. 원인은 확인되지 않음.',evidence:'DEMO-CLAIM-01'};
 await execute({operation:'claim.register',claim});
 await execute({operation:'document.save',document:{name:'중단·출고 보류 검토 요청',body:'사건 C-001 · U104\n작업 보류 필요 여부와 이력 보완을 검토합니다.\n근거 DEMO-CLAIM-01 · 요청 문서이며 실제 현장 실행·송신·수신은 미확인입니다.',status:'초안 저장'}});
 await execute({operation:'document.save',document:{name:'시험 의뢰 검토 초안',body:'사건 C-001 · U104\n시험 범위와 조건을 검토합니다.\n근거 DEMO-CLAIM-01 · 실제 시험 수행·수신은 미확인입니다.',status:'초안 저장'}});
 await execute({operation:'claim.link_example',claim:{...claim,evidence:'DEMO-TEST-01'}});
 const traceBefore={rows:investigation(state,defaultConditions),conditions:structuredClone(defaultConditions),version:state.version};
 const draft=await makeDraft(state,{kind:'trace',removed:'2026-09-12T09:00:00+09:00',coverage:true,evidence:'DEMO-TRACE-02'},'Alice','U104 제거·확인 범위 보완','UI04');
 draft.id='DEMO-V24-TRACE';draft.requestKey='v24-capture-trace';draft.companyId='A';
 const approved=await approve(state,{...draft,status:'검토 요청'},'Bob');
 state=await apply({...state,drafts:[approved,...state.drafts]},approved);
 return {state,traceBefore};
}
