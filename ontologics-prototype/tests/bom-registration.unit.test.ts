import {describe,it,expect} from 'vitest';
import {actualBomList,actualBoms} from '../src/actual-boms';
import {buildBomRegistrationPayload,getBomRegistration,isBomRegistered,resolveBomRegistration} from '../src/bom-registration';
import {initial,makeDraft,approve,apply,content,digest,validate,type State,type Payload} from '../src/domain';
import {projectBomRegistrations,registrationObjectId} from '../src/bom-registration-graph';
import {entities,relations} from '../src/entity-data';

const payload=(key:typeof actualBomList[number]['key'])=>buildBomRegistrationPayload(key,{reviewed:true,receivedSourceHash:actualBoms[key].source.sha256});
async function approvedDraft(state:State,p:Payload){const draft=await makeDraft(state,p,'Alice','실제 BOM 등록','UI02');return approve(state,{...draft,companyId:'A',status:'검토 요청'},'Bob')}
const operational=(s:State)=>({production:s.production,stock:s.stock,allocated:s.allocated,shipments:s.shipments,reserved:s.reserved,receipt:s.receipt,materialAllocated:s.materialAllocated,boardIds:s.boardIds,claim:s.claim});

describe('확보한 실제 BOM 5개 정확 버전 등록',()=>{
 it.each(actualBomList)('$key 원문별 초안·검토·승인·반영과 불변 근거',async bom=>{
  const state=initial(),draft=await makeDraft(state,payload(bom.key),'Alice',bom.modelName,'UI02');
  expect(getBomRegistration(state,bom.key)).toBeUndefined();
  await expect(approve(state,draft,'Bob')).rejects.toThrow('검토 요청');
  const requested={...draft,companyId:'A',status:'검토 요청' as const};
  await expect(approve(state,requested,'Alice')).rejects.toThrow('자기 승인');
  const approved=await approve(state,requested,'Bob');
  expect(getBomRegistration(state,bom.key)).toBeUndefined();
  const next=await apply({...state,drafts:[approved]},approved),record=getBomRegistration(next,bom.key)!;
  expect(record).toMatchObject({snapshotKey:bom.key,configurationId:bom.configurationId,modelId:bom.modelId,sourceId:bom.sourceId,sourceHash:bom.source.sha256,snapshotId:bom.source.snapshotId,revision:bom.revision,rowCount:bom.lines.length,draftId:approved.id,draftHash:approved.hash,draftVersion:1,baseVersion:1,appliedDataVersion:2,author:'Alice',approvedBy:'Bob',companyId:'A',requestKey:approved.requestKey});
  expect(Number.isFinite(Date.parse(record.appliedAt))).toBe(true);
  expect(next.drafts[0].status).toBe('반영 완료');expect(next.version).toBe(2);
  expect(next.bomApplied).toBe(bom.key==='L1');expect(isBomRegistered(next,bom.key)).toBe(true);
  expect(operational(next)).toEqual(operational(state));
  expect(bom.lines.every(row=>row.populationStatus==='unreviewed'&&row.quantityUnit===null&&row.reviewStatus==='not_independently_reviewed')).toBe(true);
  expect(await apply(next,approved)).toBe(next);
  await expect(makeDraft(next,payload(bom.key),'Alice','중복','UI02')).rejects.toThrow('이미 반영');
 });
 it('5개 구성별 기록을 독립 보존하며 1개 반영을 다른 구성 승인으로 간주하지 않음',async()=>{
  let state=initial();
  for(const bom of actualBomList){const d=await approvedDraft(state,payload(bom.key));state=await apply({...state,drafts:[d,...state.drafts]},d)}
  expect(Object.keys(state.bomRegistrations??{})).toHaveLength(5);
  expect(new Set(Object.values(state.bomRegistrations??{}).map(record=>record.draftHash)).size).toBe(5);
  expect(state.version).toBe(6);expect(operational(state)).toEqual(operational(initial()));
 });
 it.each([
  {field:'configurationId',value:'CFG-POE-L1'},
  {field:'modelId',value:'MODEL-POE'},
  {field:'snapshotId',value:'POE-L1-WROOM'},
  {field:'revision',value:'L1'},
  {field:'sourceId',value:'SRC-L1-ods'},
  {field:'sourceHash',value:actualBoms.L1.source.sha256},
  {field:'rowCount',value:74},
  {field:'unknownPolicy',value:'verified'},
  {field:'mapping',value:'WROOM'},
  {field:'reviewed',value:false},
  {field:'evidence',value:'SRC-L1-ods'},
 ])('다른 원본/의미를 섞은 $field 차단',({field,value})=>{
  expect(()=>validate(initial(),{...payload('EVB-C'),[field]:value})).toThrow();
 });
 it('오래된 승인 기준·승인 후 변조·중복 키의 다른 해시 거부',async()=>{
  const state=initial(),draft=await approvedDraft(state,payload('EVB-C'));
  await expect(approve({...state,version:2},{...draft,status:'검토 요청'},'Bob')).rejects.toThrow('기준 데이터');
  await expect(apply({...state,version:2},draft)).rejects.toThrow('오래된');
  await expect(apply(state,{...draft,payload:payload('ISO-N')})).rejects.toThrow('해시');
  const next=await apply(state,draft);
  await expect(apply(next,{...draft,hash:'altered'})).rejects.toThrow('다른 내용');
 });
 it('새 해시를 만들더라도 승인/반영 시 원본 바인딩 재검증',async()=>{
  const state=initial(),valid=await approvedDraft(state,payload('EVB-C'));
  const invalid={...valid,payload:{...valid.payload,sourceHash:actualBoms.L1.source.sha256}};
  invalid.hash=await digest(content(invalid));invalid.approvedHash=invalid.hash;
  await expect(approve(state,{...invalid,status:'검토 요청'},'Bob')).rejects.toThrow('원본·해시');
  await expect(apply(state,invalid)).rejects.toThrow('원본·해시');
 });
 it('이전 L1 정확 원본 초안은 해시/내용 변경 없이 수용하고 boolean 이력에서 근거를 생성하지 않음',async()=>{
  const legacy={kind:'bom' as const,mapping:'WROOM',reviewed:true,sourceHash:actualBoms.L1.source.sha256,evidence:'SRC-L1-ods · SRC-L1-pdf',unknown:'NA / NS / Opened 보존'};
  const state={...initial(),bomApplied:true};expect(isBomRegistered(state,'L1')).toBe(true);expect(getBomRegistration(state,'L1')).toBeUndefined();expect(isBomRegistered(state,'L')).toBe(false);
  expect(resolveBomRegistration(legacy).key).toBe('L1');
  const approved=await approvedDraft(state,legacy),hash=approved.hash,next=await apply(state,approved);
  expect(getBomRegistration(next,'L1')?.draftHash).toBe(hash);expect(approved.payload).toEqual(legacy);
  expect(()=>validate(initial(),{...legacy,sourceHash:undefined})).toThrow('이전 L1');
  expect(()=>validate(initial(),{...legacy,configurationId:'CFG-EVB-C'})).toThrow('불완전');
 });
});

describe('BOM 등록 반영의 ABox 투영',()=>{
 it.each(actualBomList)('$key 승인만으로 ABox를 쓰지 않고 반영 근거 2객체·3관계만 추가',async bom=>{
  const originalObjects=structuredClone(entities),originalLinks=structuredClone(relations),state=initial(),before=projectBomRegistrations(state);
  expect(before.objects).toHaveLength(entities.length);expect(before.links).toEqual(relations);
  const draft=await makeDraft(state,payload(bom.key),'Alice',bom.modelName,'UI02');
  const requested={...draft,companyId:'A',status:'검토 요청' as const};
  const approved=await approve(state,requested,'Bob');
  for(const pending of [draft,requested,approved])expect(projectBomRegistrations({...state,drafts:[pending]})).toEqual(before);
  const applied=await apply({...state,drafts:[approved]},approved),after=projectBomRegistrations(applied),record=getBomRegistration(applied,bom.key)!;
  expect(after.objects).toHaveLength(before.objects.length+2);expect(after.links).toHaveLength(before.links.length+3);
  const originalIds=new Set(entities.map(object=>object.id)),originalLinkIds=new Set(relations.map(link=>link.id));
  const addedObjects=after.objects.filter(object=>!originalIds.has(object.id)),addedLinks=after.links.filter(link=>!originalLinkIds.has(link.id));
  const eventId=registrationObjectId(record),event=addedObjects.find(object=>object.id===eventId)!,source=addedObjects.find(object=>object.id===bom.sourceId)!;
  expect(addedObjects.every(object=>object.company==='A')).toBe(true);
  expect(event).toMatchObject({source:'합성 예시',evidence:[bom.sourceId],properties:{'구성 ID':bom.configurationId,'원본 ID':bom.sourceId,'원본 SHA-256':bom.source.sha256,'승인 내용 SHA-256':approved.hash,'작성자':'Alice','승인자':'Bob','반영 데이터 버전':'v2'}});
  expect(source).toMatchObject({source:'실제 공개 원본',evidence:[bom.sourceId],properties:{'구성 ID':bom.configurationId,'원본 SHA-256':bom.source.sha256,'원본 스냅샷':bom.source.snapshotId,'고정 커밋':bom.source.commit}});
  expect(addedLinks.map(link=>[link.from,link.to,link.type,link.evidence])).toEqual([
   [eventId,bom.configurationId,'flow',bom.sourceId],[eventId,bom.sourceId,'flow',bom.sourceId],[bom.sourceId,bom.configurationId,'flow',bom.sourceId]
  ]);
  expect(addedLinks.every(link=>link.scope.includes(bom.configurationId)&&link.scope.includes(approved.id))).toBe(true);
  const configuration=after.objects.find(object=>object.id===bom.configurationId)!;
  expect(configuration.properties).toMatchObject({'로컬 등록 상태':'정확 승인 버전 반영','등록 반영 객체':eventId,'승인 내용 SHA-256':approved.hash,'반영 데이터 버전':'v2','원문 검수':'단위·실장·정확 품번 미확인 유지'});
  const otherIds=new Set(actualBomList.filter(item=>item.key!==bom.key).map(item=>item.configurationId));
  for(const object of before.objects)if(object.id!==bom.configurationId)expect(after.objects.find(candidate=>candidate.id===object.id)).toEqual(object);
  expect(after.objects.filter(object=>otherIds.has(object.id)).every(object=>object.properties['로컬 등록 상태']==='아직 미반영')).toBe(true);
  expect(after.links.filter(link=>link.type==='design')).toEqual(before.links.filter(link=>link.type==='design'));
  expect(entities).toEqual(originalObjects);expect(relations).toEqual(originalLinks);
  const replay=await apply(applied,approved);expect(projectBomRegistrations(replay)).toEqual(after);
 });
 it('5개 반영 후 객체·관계 ID가 고유하고 모든 관계 끝점이 조회 가능한 동일 집합에 존재',async()=>{
  let state=initial();
  for(const bom of actualBomList){const draft=await approvedDraft(state,payload(bom.key));state=await apply({...state,drafts:[draft,...state.drafts]},draft)}
  const graph=projectBomRegistrations(state),ids=new Set(graph.objects.map(object=>object.id));
  expect(graph.objects).toHaveLength(entities.length+10);expect(graph.links).toHaveLength(relations.length+15);
  expect(ids.size).toBe(graph.objects.length);expect(new Set(graph.links.map(link=>link.id)).size).toBe(graph.links.length);
  expect(graph.links.filter(link=>!ids.has(link.from)||!ids.has(link.to))).toEqual([]);
  expect(projectBomRegistrations(state)).toEqual(graph);
 });
 it('다른 회사의 반영 기록은 객체·관계·구성 상태로도 노출하지 않음',async()=>{
  const state=initial(),approved=await approvedDraft(state,payload('EVB-C')),applied=await apply(state,approved),record=getBomRegistration(applied,'EVB-C')!;
  const foreign={...state,bomRegistrations:{'EVB-C':{...record,companyId:'B'}}};
  expect(getBomRegistration(foreign,'EVB-C')).toBeUndefined();
  expect(getBomRegistration(foreign,'EVB-C','B')).toMatchObject({companyId:'B',draftHash:record.draftHash});
  expect(isBomRegistered(foreign,'EVB-C')).toBe(false);
  expect(projectBomRegistrations(foreign)).toEqual(projectBomRegistrations(state));
 });
});
