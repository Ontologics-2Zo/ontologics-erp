import {projectChangeImpact,impactNextStep} from '../src/change-impact-model';
import {describe,it,expect} from 'vitest';
import {initial,type State,type Payload,makeDraft,approve,apply,totals,receive,validate,reserve,allocateMaterial,materialQuantities} from '../src/domain';
import {ContextRequestGate,createMockActionPort,createMockAgentPort,createMockGraphPort,createMockIdentityPort,createMockMediaPort,createMockQueryPort,isCurrentResult,requireRealAdapter,pendingActionIds,type PortContext} from '../src/ports';
const context=():PortContext=>({companyId:'A',actor:'Alice',identityRevision:1,contextRevision:1,entityId:'LOT-01',dataVersion:1,asOf:'2026-09-20T12:00:00+09:00'});
const entities=[{id:'LOT-01',company:'A',name:'공유 이름',photo:'A-photo'},{id:'BOARD-01',company:'A',name:'보드'},{id:'LOT-02',company:'B',name:'비공개 이름',photo:'B-photo'}];
const access={id:(x:typeof entities[number])=>x.id,company:(x:typeof entities[number])=>x.company,searchText:(x:typeof entities[number])=>x.name};
const edges=[{id:'allowed',from:'LOT-01',to:'BOARD-01'},{id:'hidden',from:'LOT-01',to:'LOT-02'}];
describe('company scope shared by read, graph, media and aggregates',()=>{
 it('회사 필터를 집계·페이지보다 먼저 적용',async()=>{const current=context();const query=createMockQueryPort(()=>entities,access,()=>current);expect((await query.search('',current)).meta.total).toBe(2);await expect(query.get('LOT-02',current)).rejects.toThrow('권한');await expect(query.search('',{...current,companyId:'B'})).rejects.toThrow('범위');});
 it('권한 없는 노드와 관계는 개수·결과에 포함하지 않음',async()=>{const current=context();const graph=createMockGraphPort({records:()=>entities,relations:()=>edges,entity:access,relation:{from:x=>x.from,to:x=>x.to},current:()=>current});const result=await graph.neighborhood('LOT-01',current);expect(result.relations.map(x=>x.id)).toEqual(['allowed']);expect(result.relationTotal).toBe(1);expect(result.meta.total).toBe(2);const partial=await graph.neighborhood('LOT-01',current,{nodeLimit:1});expect(partial.complete).toBe(false);expect(partial.meta.total).toBe(2);expect(await graph.relations('LOT-01',current)).toHaveLength(1);});
 it('사진 조회도 동일 scope 적용, 미등록은 구분',async()=>{const current=context();const media=createMockMediaPort(()=>entities,access,x=>x.photo,()=>current);expect(await media.get('BOARD-01',current)).toEqual({state:'unregistered'});await expect(media.get('LOT-02',current)).rejects.toThrow('권한');});
});
describe('AI response context and account switching',()=>{
 it.each(['entityId','actor','companyId','identityRevision','contextRevision','dataVersion'] as const)('%s가 바뀌면 이전 응답 표시 거부',async field=>{const before=context(),gate=new ContextRequestGate(),ticket=gate.begin(before);const agent=createMockAgentPort(()=> '명시적 예시 응답',0);const pending=agent.run({requestId:'R-1',message:'조회',context:before});const after={...before,[field]:typeof before[field]==='number'?Number(before[field])+1:'changed'} as PortContext;const result=await pending;expect(gate.accept(ticket,after)).toBe(false);expect(isCurrentResult(result,after)).toBe(false);expect(result.context.entityId).toBe('LOT-01');});
 it('같은 맥락에서도 나중 요청이 먼저 완료하면 이전 응답 거부',()=>{const gate=new ContextRequestGate(),c=context(),first=gate.begin(c),second=gate.begin(c);expect(gate.accept(first,c)).toBe(false);expect(gate.accept(second,c)).toBe(true);gate.invalidate();expect(gate.accept(second,c)).toBe(false);});
 it('진행 또는 UNKNOWN 쓰기 중 계정 전환 차단',async()=>{let pending=true;const identities=createMockIdentityPort([{profileId:'writer',actor:'Alice',companyId:'A',label:'작성'},{profileId:'reviewer',actor:'Bob',companyId:'A',label:'검토'}],'writer',()=>pending);await expect(identities.switch('reviewer',1)).rejects.toThrow('대사');pending=false;expect((await identities.switch('reviewer',1)).identity.actor).toBe('Bob');await expect(identities.switch('writer',1)).rejects.toThrow('오래');});
});
describe('action boundary and response reconciliation',()=>{
 function fixture(){let state:State={...initial(),demandConfirmed:true};let current=context();const port=createMockActionPort({getState:()=>state,setState:n=>{state=n;},getContext:()=>current,simulateLostResponse:()=>true});return {port,get:()=>state,current:()=>current,setContext:(c:PortContext)=>{current=c;}};}
 it('응답 소실 후 상태 대사, 같은 키 재요청은 추가 쓰기 없음',async()=>{const f=fixture(),c=f.current();const command={operation:'inventory.reserve' as const,context:c,expectedVersion:1,idempotencyKey:'once',quantity:60};expect((await f.port.execute(command)).status).toBe('unknown');expect(f.get().reserved).toBe(60);expect(f.port.hasPending()).toBe(true);await expect(f.port.execute({...command,idempotencyKey:'new',expectedVersion:2,quantity:70})).rejects.toThrow('진행');const reconciled=await f.port.status('once',c);expect(reconciled?.status).toBe('completed');expect(f.port.hasPending()).toBe(false);expect((await f.port.execute(command)).status).toBe('completed');expect(f.get().version).toBe(2);await expect(f.port.execute({...command,quantity:70})).rejects.toThrow('다른 내용');});
 it('회사와 권한은 멱등 원결과 조회 전 검사',async()=>{const f=fixture(),c=f.current();await f.port.execute({operation:'inventory.reserve',context:c,expectedVersion:1,idempotencyKey:'once',quantity:60});await expect(f.port.status('once',{...c,companyId:'B'})).rejects.toThrow('범위');f.setContext({...c,actor:'Viewer',identityRevision:2});await expect(f.port.execute({operation:'inventory.release',context:f.current(),expectedVersion:2,idempotencyKey:'viewer'})).rejects.toThrow('조회 전용');});
 it('실패 결과를 같은 키로 다시 실행하지 않음',async()=>{let state=initial();const c=context();const port=createMockActionPort({getState:()=>state,setState:n=>{state=n;},getContext:()=>c});const command={operation:'inventory.reserve' as const,context:c,expectedVersion:1,idempotencyKey:'failed',quantity:60};expect((await port.execute(command)).status).toBe('failed');state={...state,demandConfirmed:true};expect((await port.execute(command)).status).toBe('failed');expect(state.reserved).toBe(0);});
 it('서버 미연결은 성공 대신 명시 실패',()=>expect(()=>requireRealAdapter(undefined)).toThrow('연결되지'));
});
async function commit(state:State,payload:Payload){let d=await makeDraft(state,payload,'Alice','test','UI08');d.status='검토 요청';d=await approve(state,d,'Bob');return apply({...state,drafts:[d,...state.drafts]},d);}
describe('partial quantities and evidence conservation',()=>{
 it('한 출하의 8+12 부분 도착은 정확히 20이며 잔여 약속과 별도',async()=>{let state:State={...initial(),production:30,stock:30,allocated:30,shipments:[{id:'SHP-01',qty:20,departure:'2026-09-19T13:00:00+09:00',evidence:'S'}]};const p:Payload={kind:'arrival',shipment:'SHP-01',qty:8,at:'2026-09-20T10:00:00+09:00',evidence:'ARR-1'};state=await commit(state,p);expect(totals(state).arrived).toBe(8);expect(totals(state).transit).toBe(12);expect(state.shipments[0].arrival).toBeUndefined();expect(()=>validate(state,{...p,evidence:'ARR-2',qty:13})).toThrow('잔량');expect(()=>validate(state,p)).toThrow('근거');state=await commit(state,{...p,qty:12,evidence:'ARR-2'});expect(totals(state)).toMatchObject({arrived:20,transit:0,warehouse:10,promiseRemaining:80});expect(state.shipments[0].arrivals).toHaveLength(2);});
 it('부분 자재 입고의 검사 항등식과 근거 중복 보존',()=>{let state=receive(initial(),20,15,2,3,'R1');state=receive(state,10,7,1,2,'R2');expect(state.receipt).toEqual({total:30,pass:22,fail:3,pending:5});expect(()=>receive(state,20,15,2,3,'R1')).toThrow('이미');});
});

describe('internal purchase and supplier facts remain distinct',()=>{
 it('발주 승인 반영 후 공급 확인 누계 상한·근거 중복 검사',async()=>{const order:Payload={kind:'purchase_order',orderId:'PO-1',requestId:'REQ-1',qty:20,part:'IM-0008',unit:'개',quoteId:'Q-1',price:100,shipping:null,currency:'KRW',needBy:'2026-09-21',evidence:'QUOTE-1'};let state=await commit({...initial(),docs:[{name:'PR',body:JSON.stringify({type:'purchase-request',id:'REQ-1'}),status:'초안'}]},order);expect(state.docs[1].status).toBe('내부 기록 · 외부 미송신');expect(state.receipt).toBeNull();expect(()=>validate(state,order)).toThrow('이미');const supply:Payload={kind:'supply',orderId:'PO-1',qty:8,at:'2026-09-20T10:00:00+09:00',evidence:'SUP-1'};state=await commit(state,supply);expect(state.supplyConfirmations?.[0].qty).toBe(8);expect(state.receipt).toBeNull();expect(()=>validate(state,supply)).toThrow('이미');expect(()=>validate(state,{...supply,qty:13,evidence:'SUP-2'})).toThrow('초과');expect(()=>validate(state,{...supply,orderId:'PO-MISSING'})).toThrow('찾을 수');});
});

describe('fact drafting and pending production',()=>{
 it('자재 입고는 초안·별도 승인·반영 순서에서만 합격 가용으로 전환',async()=>{const state=initial();const payload:Payload={kind:'material_receipt',total:10,pass:7,fail:1,pending:2,evidence:'MAT-1'};const d=await makeDraft(state,payload,'Alice','입고','UI07');expect(state.receipt).toBeNull();expect(d.status).toBe('초안');const next=await commit(state,payload);expect(next.receipt).toEqual({total:10,pass:7,fail:1,pending:2});expect(()=>validate(next,payload)).toThrow('이미');});
 it('생산 판정대기는 양품·불량과 분리하고 창고재고에 더하지 않음',async()=>{const payload:Payload={kind:'production',good:60,defects:2,pending:3,total:65,at:'2026-09-19T09:00:00+09:00',evidence:'P-1'};const next=await commit(initial(),payload);expect(next.pendingProduction).toBe(3);expect(next.stock).toBe(0);expect(next.production).toBe(60);expect(()=>validate(initial(),{...payload,total:62})).toThrow('판정대기');});
});

describe('v1.5 developer role separation',()=>{
 it.each([
   {author:'Alice',reviewer:'Alice',error:'자기 승인'},
   {author:'Alice',reviewer:'Bob',error:null},
   {author:'Alice',reviewer:'Viewer',error:'권한'},
   {author:'Bob',reviewer:'Alice',error:'권한'},
   {author:'Bob',reviewer:'Bob',error:'자기 승인'},
   {author:'Bob',reviewer:'Viewer',error:'권한'},
 ] as const)('$author 초안 / $reviewer 승인 권한',async({author,reviewer,error})=>{
   const state=initial(),draft=await makeDraft(state,{kind:'board',board:'U900',evidence:'BOARD-SOURCE'},author,'등록','UI03');
   draft.status='검토 요청';
   if(error)await expect(approve(state,draft,reviewer)).rejects.toThrow(error);
   else expect((await approve(state,draft,reviewer)).status).toBe('승인');
 });
 it.each(['보완 요청','반려'] as const)('%s도 승인자 역할만 수행',async reviewStatus=>{
   for(const actor of ['Alice','Bob'] as const){
     const state=initial(),author=actor==='Alice'?'Bob':'Alice',draft=await makeDraft(state,{kind:'board',board:'U901',evidence:'BOARD-SOURCE'},author,'등록','UI03');
     draft.status='검토 요청';state.drafts=[draft];let stored=state;
     const c={...context(),actor};const port=createMockActionPort({getState:()=>stored,setState:n=>{stored=n;},getContext:()=>c});
     const result=await port.execute({operation:'draft.review_decision',context:c,expectedVersion:state.version,idempotencyKey:'decision',draftId:draft.id,reviewStatus,comment:'원문 보완 필요'});
     expect(result.status).toBe(actor==='Bob'?'completed':'failed');
     expect(stored.drafts[0].status).toBe(actor==='Bob'?reviewStatus:'검토 요청');
   }
 });
});

describe('local action recovery across reload',()=>{
 it('응답 유실 receipt·미확인 상태를 복원하고 대사 전 새 쓰기 차단',async()=>{
   let state:State={...initial(),demandConfirmed:true};let current=context();
   const options={getState:()=>state,setState:(next:State)=>{state=next;},getContext:()=>current};
   const first=createMockActionPort({...options,simulateLostResponse:()=>true});
   const command={operation:'inventory.reserve' as const,context:current,expectedVersion:1,idempotencyKey:'persisted-request',quantity:60};
   expect((await first.execute(command)).status).toBe('unknown');
   state=JSON.parse(JSON.stringify(state));
   expect(pendingActionIds(state,'A')).toEqual(['persisted-request']);expect(pendingActionIds(state,'B')).toEqual([]);
   const recovered=createMockActionPort(options);expect(recovered.hasPending()).toBe(true);
   await expect(recovered.execute({...command,idempotencyKey:'new-after-reload',expectedVersion:2,quantity:70})).rejects.toThrow('진행');
   current={...current,actor:'Bob',identityRevision:2};
   const original=await recovered.status('persisted-request',current);expect(original?.status).toBe('completed');expect(original?.actor).toBe('Alice');
   expect(pendingActionIds(state,'A')).toEqual([]);expect(recovered.hasPending()).toBe(false);
   const replay=await recovered.execute({...command,context:current});expect(replay.actor).toBe('Alice');expect(state.reserved).toBe(60);expect(state.version).toBe(2);
   const again=createMockActionPort(options);expect(again.hasPending()).toBe(false);
   current={...current,companyId:'B',actor:'Viewer',identityRevision:3};
   expect(await again.status('persisted-request',current)).toBeNull();
   await expect(again.status('persisted-request',{...current,companyId:'A'})).rejects.toThrow('범위');
 });
 it('입고·할당을 비교 부족량과 실제 미확보 수요로 분리',()=>{
   let state:State={...initial(),demandConfirmed:true};
   expect(materialQuantities(state)).toMatchObject({comparisonShortage:20,secured:0,unsecured:100});
   state=reserve(state,60);expect(materialQuantities(state)).toMatchObject({comparisonShortage:20,secured:60,unsecured:40});
   state=receive(state,50,40,5,5,'RECEIPT-1');expect(materialQuantities(state)).toMatchObject({comparisonShortage:20,secured:60,unsecured:40});
   state=allocateMaterial(state,30);expect(materialQuantities(state)).toMatchObject({originalAvailable:80,receiptAllocated:30,comparisonAvailable:110,comparisonShortage:0,secured:90,unsecured:10,unreservedOriginal:20});
 });
});


describe('읽기 전용 변경 영향 가정',()=>{
 it('합격 후보를 바꿔도 초안·원장·예약·할당은 보존하고 다음 확인만 재계산',async()=>{
  const state={...initial(),demandConfirmed:true,reserved:60};
  const payload:Payload={kind:'material_receipt',total:50,pass:40,fail:5,pending:5,evidence:'IMPACT-1'};
  const draft=await makeDraft(state,payload,'Alice','입고 후보','UI07');
  const before=JSON.stringify({state,draft});
  const first=projectChangeImpact(state,draft),edited=projectChangeImpact(state,draft,{...payload,pass:30,pending:15});
  expect(first.status).toBe('candidate');expect(first.projected?.receiptPass).toBe(40);
  expect(edited.projected?.receiptPass).toBe(30);expect(edited.projected?.unsecured).toBe(40);expect(edited.projected?.receiptAllocated).toBe(0);
  expect(impactNextStep(first.projected!,true)).toContain('최대 40개');expect(impactNextStep(edited.projected!,true)).toContain('최대 30개');
  expect(JSON.stringify({state,draft})).toBe(before);
 });
 it('승인만으로 현재 수량은 변하지 않고, 반영 완료 입고는 후보에 중복 가산하지 않음',async()=>{
  const state={...initial(),demandConfirmed:true,reserved:60};
  const payload:Payload={kind:'material_receipt',total:50,pass:40,fail:5,pending:5,evidence:'IMPACT-2'};
  const draft=await makeDraft(state,payload,'Alice','입고 후보','UI07');
  const approved=await approve(state,{...draft,status:'검토 요청'},'Bob');
  const projection=projectChangeImpact(state,approved);expect(projection.current.receiptPass).toBeNull();expect(projection.projected?.receiptPass).toBe(40);
  const next=await apply({...state,drafts:[approved]},approved);
  const after=projectChangeImpact(next,next.drafts[0]);expect(after.status).toBe('applied');expect(after.current.receiptPass).toBe(40);expect(after.projected).toBeNull();expect(after.current.unsecured).toBe(40);
 });
 it('기준 변경과 불일치 수량의 후보를 확정하지 않음',async()=>{
  const state=initial(),payload:Payload={kind:'material_receipt',total:50,pass:40,fail:5,pending:5,evidence:'IMPACT-3'};
  const draft=await makeDraft(state,payload,'Alice','입고 후보','UI07');
  expect(projectChangeImpact({...state,version:2},draft).status).toBe('stale');
  expect(projectChangeImpact(state,draft,{...payload,pass:30}).status).toBe('invalid');
  expect(projectChangeImpact(state,draft,{...payload,pass:NaN}).status).toBe('invalid');
 });
});
