import {describe,it,expect} from 'vitest';
import {initial,receive,reserve,allocateMaterial,type Draft,type Payload} from '../src/domain';
import {buildWorkItems,buildConfigurationItems,type WorkItemId} from '../src/work-items';
import {snapshots} from '../src/entity-data';

const find=(id:WorkItemId,state=initial())=>buildWorkItems(state).find(item=>item.id===id)!;
const draft=(payload:Payload,overrides:Partial<Draft>={}):Draft=>({
 id:'D-TEST',title:'검토 fixture',author:'Alice',companyId:'A',version:1,base:1,
 hash:'test-hash',requestKey:'test-request',origin:'UI02',status:'검토 요청',payload,...overrides,
});

describe('제품 구성 표: 등록 범위와 수량 단위',()=>{
 it('실제 BOM 5개와 독립 합성 3개를 구분하고 새 모델의 근거·미검수를 보존한다',()=>{
  const items=buildConfigurationItems(initial());
  expect(items).toHaveLength(8);
  expect(new Set(items.map(item=>item.id)).size).toBe(8);
  for(const snapshot of snapshots){
   const item=items.find(item=>item.id===snapshot.id)!;
   expect(item.contextObjectId).toBe(snapshot.id);
   expect(item.bomRows).toBe(snapshot.lines.length);
   expect(item.bomUnit).toBe('행');
   expect(item.dataBasis.notes.join(' ')).toContain('제품 수량이나 부품 총수량이 아닙니다');
  }
  expect(items.filter(item=>item.source==='실제 공개 원본')).toHaveLength(5);
  expect(items.filter(item=>item.source==='합성 예시')).toHaveLength(3);
  expect(items.filter(item=>item.source==='원본 미확보')).toHaveLength(0);
  for(const id of ['CFG-POEISO-N','CFG-EVB-C','CFG-GATEWAY-I']){
   const item=items.find(item=>item.id===id)!;
   expect(item.dataBasis.evidenceRefs).toHaveLength(1);
   expect(item.dataBasis.evidenceRefs[0]).toMatch(/-csv$/);
   expect(item.unknowns.join(' ')).not.toContain('WROVER');
   expect(item.reviewStatus.label).toBe('원본 검토 전');
  }
  for(const item of items){expect(item).not.toHaveProperty('owner');expect(item).not.toHaveProperty('needDate');}
 });

 it('L1 대표 품목의 확보를 전체 BOM·다른 개정·합성 모델에 확장하지 않는다',()=>{
  const s=allocateMaterial(receive(reserve({...initial(),demandConfirmed:true},60),50,40,5,5),40);
  const items=buildConfigurationItems(s),l1=items.find(item=>item.id==='CFG-POE-L1')!;
  expect(l1.materialStatus.label).toBe('대표 품목 · 확인 품목 확보');
  expect(l1.materialStatus.detail).toContain('전체 BOM의 자재 확보 상태가 아닙니다');
  expect(l1.unknowns).toContain('BOM 전체 소요·실제 실장 미확인');
  for(const item of items.filter(item=>item.id!=='CFG-POE-L1'))expect(item.materialStatus.label).toBe('자재 미확인');
 });

 it('명시한 구성과 원본 연결로 검토를 나누고 L1 반영 플래그를 L에 적용하지 않는다',()=>{
  const s={...initial(),bomApplied:true,drafts:[
   draft({kind:'bom',configurationId:'CFG-POE-L',evidence:'SRC-L1-ods'},{id:'D-L',status:'승인'}),
   draft({kind:'bom',evidence:'SRC-L1-ods'},{id:'D-L1',companyId:'B'}),
  ]};
  const items=buildConfigurationItems(s),l=items.find(item=>item.id==='CFG-POE-L')!,l1=items.find(item=>item.id==='CFG-POE-L1')!;
  expect(l.reviewStatus.label).toBe('승인·미반영 1건');
  expect(l1.reviewStatus.label).toBe('반영 완료');
  expect(l1.dataBasis.evidenceRefs).not.toContain('D-L');
  expect(l1.dataBasis.evidenceRefs).not.toContain('D-L1');
  expect(find('TASK-REV',s).quantity.value).toBe(0);
  const noDrafts=buildConfigurationItems({...s,drafts:[]});
  expect(noDrafts.find(item=>item.id==='CFG-POE-L')?.reviewStatus.label).toBe('원본 검토 전');
  expect(noDrafts.find(item=>item.id==='CFG-IO-A')?.reviewStatus.label).toBe('합성 스냅샷');
 });
});
const document=(value:object)=>({name:'합성 문서',body:JSON.stringify(value),status:'초안'});

describe('운영 홈 업무 투영: 대상·근거·수량 의미',()=>{
 it('기존 업무와 선택 대상을 보존하고 합성 기한·담당을 실제 배정으로 표현하지 않는다',()=>{
  const s=initial(),before=structuredClone(s),items=buildWorkItems(s);
  expect(items.map(item=>[item.id,item.objectId,item.contextObjectId])).toEqual([
   ['TASK-MAT','PART-TPS','PART-TPS'],['TASK-REV','CFG-POE-L1','CFG-POE-L1'],
   ['TASK-IN','IM-EVB-C-C18-C26','IM-EVB-C-C18-C26'],['TASK-DL','ROUND-01','ROUND-01'],['TASK-QA','U104','U104'],
  ]);
  expect(items.map(item=>item.needDate.label)).toEqual(['09.21','09.21','09.25','09.30','09.20']);
  for(const item of items){
   expect(item.needDate.isSynthetic).toBe(true);
   expect(item.owner.isSynthetic).toBe(true);
   expect(item.owner.basis).toContain('실제 사용자 배정');
   expect(item.dataBasis.version).toBe(s.version);
   expect(item.dataBasis.origin).toBe('합성 운영 예시');
  }
  expect(s).toEqual(before);
 });

 it('다른 합성 입고를 구매 품목에 귀속하거나 제품·구성·사진 연결을 추정하지 않는다',()=>{
  const s=receive(initial(),50,40,5,5),purchase=find('TASK-IN',s),delivery=find('TASK-DL',s);
  expect(purchase.configId).toBe('CFG-EVB-C');expect(purchase.boardId).toBeUndefined();
  for(const item of [delivery]){
   expect(item.boardId).toBeUndefined();expect(item.modelId).toBeUndefined();expect(item.configId).toBeUndefined();
   expect(item.configLabel).toContain('미확인');
  }
  expect(purchase.quantity.value).toBe(80);
  expect(purchase.materialStatus.label).toBe('입고 연결 미확인');
  expect(purchase.detail).not.toContain('합격 40');
  expect(purchase.dataBasis.notes.join(' ')).toContain('EVB 구매 입고에 귀속하지 않습니다');
  expect(find('TASK-MAT').configId).toBe('CFG-POE-L1');
  expect(find('TASK-QA').boardId).toBe('U104');
 });

 it('가용 비교 부족 0과 예약·할당 후 미확보 10 EA를 구분한다',()=>{
  const s=allocateMaterial(receive(reserve({...initial(),demandConfirmed:true},60),50,40,5,5),30);
  const item=find('TASK-MAT',s);
  expect(item.quantity).toMatchObject({value:100,unit:'EA',label:'확인 품목 필요량'});
  expect(item.materialStatus.label).toBe('미확보 10 EA');
  expect(item.materialStatus.detail).toContain('비교 부족은 0 EA');
  expect(item.materialStatus.detail).toContain('90 EA');
  expect(item.unknowns.join(' ')).toContain('실장 미확인');
 });

 it('부분 도착만 납품 약속에서 차감하고 생산·창고·운송을 중복 합산하지 않는다',()=>{
  const s={...initial(),production:60,stock:50,allocated:50,shipments:[
   {id:'SHP-01',qty:20,departure:'2026-09-19T13:00:00+09:00',evidence:'SHIP-1',arrivals:[{id:'ARR-1',qty:20,at:'2026-09-20T10:00:00+09:00',evidence:'ARRIVE-1'}]},
   {id:'SHP-02',qty:15,departure:'2026-09-19T14:00:00+09:00',evidence:'SHIP-2',arrivals:[{id:'ARR-2',qty:12,at:'2026-09-20T11:00:00+09:00',evidence:'ARRIVE-2'}]},
  ]};
  const item=find('TASK-DL',s);
  expect(item.quantity).toMatchObject({value:68,unit:'대',label:'잔여 납품 약속'});
  expect(item.quantity.basis).toContain('추가 생산 필요량이 아니며');
  expect(item.detail).toContain('도착 32대 · 운송 중 3대 · 창고 15대');
  expect(item.dataBasis.evidenceRefs).toEqual(expect.arrayContaining(['SHIP-1','SHIP-2','ARRIVE-1','ARRIVE-2']));
 });

 it('L1 검토 수량에 다른 회사·구성·업무를 섞지 않고 승인과 반영을 구분한다',()=>{
  const s={...initial(),drafts:[
   draft({kind:'bom',evidence:'SRC-L1-ods · SRC-L1-pdf'}),
   draft({kind:'bom',configurationId:'CFG-POE-L1'},{id:'D-APPROVED',status:'승인'}),
   draft({kind:'bom',evidence:'SRC-L1-ods'},{id:'D-OTHER-COMPANY',companyId:'B'}),
   draft({kind:'bom',configurationId:'CFG-OTHER',evidence:'SRC-OTHER'},{id:'D-OTHER-CONFIG'}),
   draft({kind:'production',evidence:'DEMO-FUL-01'},{id:'D-PROD'}),
  ]};
  expect(find('TASK-REV',s).quantity.value).toBe(1);
  expect(find('TASK-REV',s).quantity.basis).toContain('회사 전체 검토 건수와 다릅니다');
  expect(find('TASK-REV',s).dataBasis.evidenceRefs).not.toContain('D-OTHER-COMPANY');
  const approved=find('TASK-REV',{...s,drafts:[s.drafts[1]]});
  expect(approved.quantity.value).toBe(0);
  expect(approved.reviewStatus.label).toBe('승인·미반영 1건');
 });

 it('구매 요청·공급 확인은 명시된 품목과 발주만 집계하고 입고로 변환하지 않는다',()=>{
  const s={...initial(),docs:[
   document({type:'purchase-request',id:'PR-1',part:'IM-EVB-C-C18-C26',qty:35}),
   document({type:'purchase-request',id:'PR-OTHER',part:'OTHER',qty:90}),
   document({type:'purchase-order',orderId:'PO-1',part:'IM-EVB-C-C18-C26',qty:40}),
   {name:'깨진 문서',body:'{invalid',status:'초안'},
  ],supplyConfirmations:[
   {orderId:'PO-1',qty:20,at:'2026-09-20T10:00:00+09:00',evidence:'SUPPLY-1'},
   {orderId:'PO-UNLINKED',qty:100,at:'2026-09-20T10:00:00+09:00',evidence:'SUPPLY-OTHER'},
  ]};
  const item=find('TASK-IN',s);
  expect(item.quantity).toMatchObject({value:35,label:'구매 요청 수량'});
  expect(item.materialStatus.label).toBe('공급 확인 20 EA');
  expect(item.materialStatus.detail).toContain('입고·검사 합격·사용 가능한 재고가 아닙니다');
  expect(item.dataBasis.evidenceRefs).not.toContain('PR-OTHER');
 });

 it('이력 보완 후에도 결함·원인 미확인과 조사 수량의 의미를 보존한다',()=>{
  const item=find('TASK-QA',{...initial(),traceCorrected:true});
  expect(item.quantity).toMatchObject({value:1,unit:'대',label:'선택 조사 대상'});
  expect(item.quantity.basis).toContain('결함 수량·전체 영향 범위·재생산 수요가 아닙니다');
  expect(item.unknowns).toContain('원인·결함 미확인');
  expect(item.materialStatus.detail).toContain('조건상 제외는 안전 보장이 아닙니다');
 });
});
