/** Browser-local integration contracts. These are adapter boundaries, not deployed APIs.
 * The mock checks UX invariants only. A real host must independently authenticate,
 * authorize scope, validate exact versions and commit its ledger atomically.
 */
import {allocateMaterial, allocation, apply, approve, content, digest, log, makeDraft, receive, reserve, type Actor, type Draft, type Payload, type State, type LocalActionResult} from './domain';

export type PortContext = {
  companyId:string; actor:Actor; identityRevision:number; contextRevision:number;
  entityId:string|null; dataVersion:number; configurationId?:string|null; asOf?:string;
  [extra:string]:unknown;
};
export const contextKey=(context:PortContext)=>stableStringify(context);
export function stableStringify(value:unknown):string {
  if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';
  if(Array.isArray(value))return '['+value.map(stableStringify).join(',')+']';
  return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+stableStringify(v)).join(',')+'}';
}
export class PortError extends Error {
  constructor(public code:'FORBIDDEN'|'STALE_CONTEXT'|'STALE_VERSION'|'NOT_FOUND'|'NOT_CONNECTED'|'IDEMPOTENCY_CONFLICT'|'SWITCH_BLOCKED'|'ABORTED',message:string){super(message);this.name='PortError';}
}
export type QueryMeta={mode:'mock'|'server';asOf:string;dataVersion:number;state:'ready'|'partial'|'stale'|'failed';total:number|null;loaded:number;displayed:number;exact:boolean};
export type QueryResult<T>={data:T[];meta:QueryMeta};
export type EntityAccessor<T>={id:(value:T)=>string;company:(value:T)=>string;searchText:(value:T)=>string};
export interface QueryPort<T>{get(id:string,context:PortContext):Promise<T|null>;search(query:string,context:PortContext,options?:{page?:number;pageSize?:number}):Promise<QueryResult<T>>;}
export type GraphLimits={detailNodes:number;detailRelations:number;cumulativeNodes:number;cumulativeRelations:number};
export const DEFAULT_GRAPH_LIMITS:GraphLimits={detailNodes:300,detailRelations:800,cumulativeNodes:1000,cumulativeRelations:2500};
export interface GraphPort<T,R>{neighborhood(id:string,context:PortContext,options?:{nodeLimit?:number;relationLimit?:number}):Promise<QueryResult<T>&{relations:R[];relationTotal:number;complete:boolean}>;relations(id:string,context:PortContext):Promise<R[]>;}
export interface MediaPort<T>{get(entityId:string,context:PortContext):Promise<{state:'registered';media:T}|{state:'unregistered'}>;}
export type AgentRequest={requestId:string;message:string;context:PortContext};
export type AgentResult={requestId:string;context:PortContext;status:'completed'|'needs_review'|'failed';summary:string;evidenceRefs:string[];issues:string[];nextActions:string[];mode:'example'|'server'};
export interface AgentPort{run(request:AgentRequest,signal?:AbortSignal):Promise<AgentResult>;}
export const isCurrentResult=(result:Pick<AgentResult,'context'>,context:PortContext)=>contextKey(result.context)===contextKey(context);
/** Selection, account, company, conditions and version changes invalidate late output.
 * Camera/hover/theme changes intentionally do not change contextRevision. */
export class ContextRequestGate {
  private sequence=0;
  begin(context:PortContext){return {sequence:++this.sequence,key:contextKey(context)};}
  accept(ticket:{sequence:number;key:string},context:PortContext){return ticket.sequence===this.sequence&&ticket.key===contextKey(context);}
  invalidate(){this.sequence++;}
}
export function createMockAgentPort(answer:(request:AgentRequest)=>string|AgentResult|Promise<string|AgentResult>,delayMs=350):AgentPort{
 return {async run(request,signal){
   const fixed=structuredClone(request);
   await new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(new PortError('ABORTED','요청이 취소되었습니다.'));return;}const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},delayMs);const abort=()=>{clearTimeout(timer);reject(new PortError('ABORTED','요청이 취소되었습니다.'));};signal?.addEventListener('abort',abort,{once:true});});
   const result=await answer(fixed);
   return typeof result==='string'?{requestId:fixed.requestId,context:fixed.context,status:'needs_review',summary:result,evidenceRefs:[],issues:['규칙 기반 예시 응답 · 실제 Agent 미연결'],nextActions:[],mode:'example'}:{...result,requestId:fixed.requestId,context:fixed.context,mode:'example'};
 }};
}
function scope(context:PortContext,current:PortContext){
 if(context.companyId!==current.companyId||context.actor!==current.actor)throw new PortError('FORBIDDEN','현재 회사·계정 범위에서 접근할 수 없습니다.');
 if(context.identityRevision!==current.identityRevision)throw new PortError('STALE_CONTEXT','개발 계정이 변경되었습니다. 현재 맥락으로 다시 조회하세요.');
}
export function createMockQueryPort<T>(records:()=>T[],access:EntityAccessor<T>,current:()=>PortContext):QueryPort<T>{
 return {async get(id,context){scope(context,current());const record=records().find(value=>access.id(value)===id);if(record&&access.company(record)!==context.companyId)throw new PortError('FORBIDDEN','객체에 접근할 권한이 없습니다.');return record?structuredClone(record):null;},async search(query,context,options={}){scope(context,current());const matches=records().filter(value=>access.company(value)===context.companyId&&access.searchText(value).toLocaleLowerCase().includes(query.toLocaleLowerCase()));const size=Math.max(1,Math.min(100,options.pageSize??20)),page=Math.max(0,options.page??0),data=matches.slice(page*size,(page+1)*size);return {data:structuredClone(data),meta:{mode:'mock',asOf:context.asOf??'',dataVersion:context.dataVersion,state:'ready',total:matches.length,loaded:data.length,displayed:data.length,exact:true}};}};
}
export function createMockGraphPort<T,R>(options:{records:()=>T[];relations:()=>R[];entity:EntityAccessor<T>;relation:{from:(r:R)=>string;to:(r:R)=>string};current:()=>PortContext;limits?:GraphLimits}):GraphPort<T,R>{
 const {records,relations,entity,relation,current}=options;const limits=options.limits??DEFAULT_GRAPH_LIMITS;
 const permitted=(id:string,context:PortContext)=>{scope(context,current());const objects=records().filter(x=>entity.company(x)===context.companyId);const ids=new Set(objects.map(entity.id));if(!ids.has(id))throw new PortError('FORBIDDEN','객체에 접근할 권한이 없습니다.');return {objects,edges:relations().filter(r=>ids.has(relation.from(r))&&ids.has(relation.to(r))&&(relation.from(r)===id||relation.to(r)===id))};};
 return {async relations(id,context){return structuredClone(permitted(id,context).edges);},async neighborhood(id,context,requested={}){const {objects,edges}=permitted(id,context);const ids=new Set([id,...edges.flatMap(r=>[relation.from(r),relation.to(r)])]);const matches=objects.filter(o=>ids.has(entity.id(o))).sort((a,b)=>Number(entity.id(b)===id)-Number(entity.id(a)===id));const nodeLimit=Math.max(1,Math.min(limits.cumulativeNodes,requested.nodeLimit??limits.detailNodes));const edgeLimit=Math.max(0,Math.min(limits.cumulativeRelations,requested.relationLimit??limits.detailRelations));const data=matches.slice(0,nodeLimit);const shown=new Set(data.map(entity.id));const visible=edges.filter(r=>shown.has(relation.from(r))&&shown.has(relation.to(r))).slice(0,edgeLimit);return {data:structuredClone(data),relations:structuredClone(visible),relationTotal:edges.length,complete:data.length===matches.length&&visible.length===edges.length,meta:{mode:'mock',asOf:context.asOf??'',dataVersion:context.dataVersion,state:data.length<matches.length||visible.length<edges.length?'partial':'ready',total:matches.length,loaded:data.length,displayed:data.length,exact:true}};}};
}
export function createMockMediaPort<T,M>(records:()=>T[],access:EntityAccessor<T>,media:(record:T)=>M|undefined,current:()=>PortContext):MediaPort<M>{return {async get(entityId,context){scope(context,current());const record=records().find(x=>access.id(x)===entityId);if(!record||access.company(record)!==context.companyId)throw new PortError('FORBIDDEN','사진에 접근할 권한이 없습니다.');const value=media(record);return value?{state:'registered',media:structuredClone(value)}:{state:'unregistered'};}};}

export type DevIdentity={profileId:string;actor:Actor;companyId:string;label:string};
export interface IdentityPort{list():DevIdentity[];current():{identity:DevIdentity;revision:number;mode:'ui-simulation'};switch(profileId:string,expectedRevision:number):Promise<ReturnType<IdentityPort['current']>>;}
export function createMockIdentityPort(profiles:DevIdentity[],initialId:string,hasPendingWrite:()=>boolean=()=>false):IdentityPort{
 let active=profiles.find(p=>p.profileId===initialId);if(!active)throw new Error('알 수 없는 개발 계정');let revision=1;
 const current=()=>({identity:structuredClone(active!),revision,mode:'ui-simulation' as const});
 return {list:()=>structuredClone(profiles),current,async switch(id,expected){if(expected!==revision)throw new PortError('STALE_CONTEXT','계정 전환 기준이 오래되었습니다.');if(hasPendingWrite())throw new PortError('SWITCH_BLOCKED','진행 중 또는 결과 미확인 쓰기를 먼저 대사하세요.');const next=profiles.find(p=>p.profileId===id);if(!next)throw new PortError('FORBIDDEN','선택 가능한 개발 계정이 아닙니다.');active=next;revision++;return current();}};
}

export type ActionOperation='draft.create'|'draft.request_review'|'draft.approve'|'draft.apply'|'inventory.reserve'|'inventory.release'|'inventory.allocate'|'fulfillment.allocate'|'document.save'|'draft.review_decision'|'draft.revise'|'demand.confirm'|'plan.save'|'claim.register'|'claim.link_example'|'handoff.save';
export type ActionCommand={operation:ActionOperation;context:PortContext;expectedVersion:number;idempotencyKey:string;payload?:Payload;draftId?:string;title?:string;origin?:string;quantity?:number;receipt?:{total:number;pass:number;fail:number;pending:number;evidence:string};document?:{name:string;body:string;status:string};reviewStatus?:'보완 요청'|'반려';comment?:string;claim?:{board:string;body:string;evidence:string};handoff?:State['handoff']};
export type ActionResult=LocalActionResult;
/** Local recovery metadata only; not a server receipt or proof of physical execution. */
export const pendingActionIds=(state:State,companyId:string)=>(state.unresolvedActionKeys??[]).flatMap(key=>{const receipt=state.actionReceipts?.[key];return receipt?.result.companyId===companyId?[receipt.result.requestId]:[];});
export interface ActionPort{execute(command:ActionCommand):Promise<ActionResult>;status(idempotencyKey:string,context:PortContext):Promise<ActionResult|null>;hasPending():boolean;}
export function createMockActionPort(options:{getState:()=>State;setState:(state:State)=>void;getContext:()=>PortContext;simulateLostResponse?:()=>boolean}):ActionPort{
 const records=new Map<string,{hash:string;result:ActionResult}>(Object.entries(options.getState().actionReceipts??{}));let pending=false;const unresolved=new Set<string>(options.getState().unresolvedActionKeys??[]);
 const withReceipts=(state:State):State=>({...state,actionReceipts:Object.fromEntries(records),unresolvedActionKeys:Array.from(unresolved)});
 return {hasPending:()=>pending||unresolved.size>0,async status(key,context){scope(context,options.getContext());const scopedKey=context.companyId+':'+key;const record=records.get(scopedKey);if(!record||record.result.companyId!==context.companyId)return null;if(record.result.status!=='unknown'&&unresolved.delete(scopedKey))options.setState(withReceipts(options.getState()));return structuredClone(record.result);},async execute(command){
   scope(command.context,options.getContext());
   if(command.context.actor==='Viewer')throw new PortError('FORBIDDEN','조회 전용 계정은 업무를 변경할 수 없습니다.');
   if(!command.idempotencyKey.trim())throw new PortError('IDEMPOTENCY_CONFLICT','동일 요청 식별자가 필요합니다.');
   const key=command.context.companyId+':'+command.idempotencyKey;
   const hash=await digest(stableStringify({...command,expectedVersion:command.operation==='draft.apply'?null:command.expectedVersion,context:{companyId:command.context.companyId}}));
   const existing=records.get(key);if(existing){if(existing.result.companyId!==command.context.companyId)throw new PortError('FORBIDDEN','현재 회사의 요청 결과가 아닙니다.');if(existing.hash!==hash)throw new PortError('IDEMPOTENCY_CONFLICT','동일 요청 키에 다른 내용이 있습니다.');return structuredClone(existing.result);}
   if(pending||unresolved.size>0)throw new PortError('SWITCH_BLOCKED','진행 중 쓰기 결과를 먼저 확인하세요.');
   const state=options.getState();if(command.expectedVersion!==state.version)throw new PortError('STALE_VERSION','기준 데이터 버전이 변경되었습니다. 다시 조회하세요.');
   pending=true;let next=state;let draft:Draft|undefined;
   try{
     const d=command.draftId?state.drafts.find(x=>x.id===command.draftId):undefined;
     if(d?.companyId&&d.companyId!==command.context.companyId)throw new PortError('FORBIDDEN','현재 회사의 검토 대상이 아닙니다.');
     switch(command.operation){
       case'draft.create':if(!command.payload)throw new Error('초안 내용이 필요합니다.');draft={...await makeDraft(state,command.payload,command.context.actor,command.title??'업무 초안',command.origin??'UI05'),companyId:command.context.companyId};next=log({...state,drafts:[draft,...state.drafts]},'초안 저장',draft.id);break;
       case'draft.request_review':if(!d||d.status!=='초안'||d.author!==command.context.actor)throw new Error('초안 작성자만 검토를 요청할 수 있습니다.');draft={...d,status:'검토 요청'};next={...state,drafts:state.drafts.map(x=>x.id===d.id?draft!:x)};break;
       case'draft.approve':if(!d)throw new Error('검토 대상을 찾을 수 없습니다.');draft=await approve(state,d,command.context.actor);next=log({...state,drafts:state.drafts.map(x=>x.id===d.id?draft!:x)},'승인',d.id);break;
       case'draft.review_decision':if(d?.author===command.context.actor)throw new Error('자기 검토 금지: 작성자와 별도 신원이 필요합니다.');if(command.context.actor!=='Bob')throw new Error('검토 권한이 없습니다. 개발 검토 계정 Bob이 필요합니다.');if(!d||d.status!=='검토 요청'||!command.comment?.trim()||!command.reviewStatus)throw new Error('검토 요청 상태와 검토 의견이 필요합니다.');draft={...d,status:command.reviewStatus,comment:command.comment};next=log({...state,drafts:state.drafts.map(x=>x.id===d.id?draft!:x)},command.reviewStatus,d.id);break;
       case'draft.revise':if(!d||d.author!==command.context.actor)throw new Error('초안 작성자만 새 버전을 만들 수 있습니다.');draft={...await makeDraft(state,d.payload,command.context.actor,d.title+' · 수정본',d.origin),companyId:command.context.companyId,version:d.version+1};draft.hash=await digest(content(draft));next=log({...state,drafts:[draft,...state.drafts]},'새 초안 버전',draft.id);break;
       case'draft.apply':if(!d)throw new Error('반영 대상을 찾을 수 없습니다.');next=await apply(state,d);draft=next.drafts.find(x=>x.id===d.id);break;
       case'inventory.reserve':next=reserve(state,command.quantity??-1);break;
       case'inventory.release':next=reserve(state,0);break;
       case'inventory.allocate':next=allocateMaterial(state,command.quantity??-1);break;
       case'fulfillment.allocate':next=allocation(state,command.quantity??-1);break;
       case'demand.confirm':next=log({...state,demandConfirmed:true},'수요 확인','100대 · DEMO-DEMAND-01');break;
       case'plan.save':if(!state.demandConfirmed)throw new Error('수요 확인이 필요합니다.');next=log({...state,planSaved:true},'조건부 일정안 저장','설비 예약·생산 실행 아님');break;
       case'claim.register':{const claim=command.claim;if(!claim||!state.boardIds.includes(claim.board)||!claim.body.trim()||!claim.evidence.trim())throw new Error('등록된 보드와 신고 원문·근거가 필요합니다.');if(state.claim)throw new Error('신고 C-001이 이미 접수되었습니다. 정정 검토가 필요합니다.');next=log({...state,claim:true,claimRecord:{...claim,author:command.context.actor}},'신고 접수','C-001 · '+claim.board+' · 결함 미확정');break;}
       case'claim.link_example':if(!state.claim||command.claim?.board!=='U104'||!state.docs.some(d=>d.name==='시험 의뢰 검토 초안'))throw new Error('U104 신고 접수와 시험 의뢰 초안 확인이 먼저 필요합니다.');next=log({...state,testLinked:true},'가상 시험 자료 연결','DEMO-TEST-01 · C-001 · U104');break;
       case'handoff.save':if(!command.handoff||!Number.isInteger(command.handoff.quantity)||command.handoff.quantity<0||!command.handoff.evidence)throw new Error('인계할 구성·수량·근거가 필요합니다.');next=log({...state,handoff:structuredClone(command.handoff),docs:command.document?[...state.docs,command.document]:state.docs},'인계 후보 저장','C-001 · 미접수');break;
       case'document.save':if(!command.document?.name.trim()||!command.document.body.trim())throw new Error('문서 이름과 내용이 필요합니다.');next=log({...state,docs:[...state.docs,structuredClone(command.document)]},'문서 초안 저장',command.document.name);break;
       default:throw new Error('지원하지 않는 업무 명령입니다.');
     }
     // Draft metadata does not change its ledger base; committed quantity writes do.
     if(!command.operation.startsWith('draft.')&&command.operation!=='document.save')next={...next,version:state.version+1};
     scope(command.context,options.getContext());
     if(options.getState().version!==state.version)throw new PortError('STALE_VERSION','처리 중 기준 버전이 바뀌어 반영하지 않았습니다.');
     const result:ActionResult={requestId:command.idempotencyKey,status:'completed',actor:command.context.actor,companyId:command.context.companyId,version:next.version,draft,mode:'mock'};records.set(key,{hash,result});
     const lost=options.simulateLostResponse?.()??false;if(lost)unresolved.add(key);
     options.setState(withReceipts(next));
     if(lost)return {...result,status:'unknown',draft:undefined};return structuredClone(result);
   }catch(error){const result:ActionResult={requestId:command.idempotencyKey,status:'failed',actor:command.context.actor,companyId:command.context.companyId,version:state.version,error:error instanceof Error?error.message:String(error),mode:'mock'};records.set(key,{hash,result});options.setState(withReceipts(options.getState()));return structuredClone(result);}finally{pending=false;}
 }};
}
/** Inject an implementation only after its server contract has been verified.
 * No guessed endpoint, role header or fabricated successful fallback is used. */
export function requireRealAdapter<T>(adapter:T|undefined):T{if(!adapter)throw new PortError('NOT_CONNECTED','실제 서버 어댑터가 연결되지 않았습니다. 모의 결과를 실제 반영으로 표시하지 않습니다.');return adapter;}
