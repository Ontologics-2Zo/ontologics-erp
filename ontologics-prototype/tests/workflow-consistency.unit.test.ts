import {describe,it,expect} from 'vitest';
import {initial,receive,reserve,allocateMaterial,materialQuantities} from '../src/domain';
import {buildWorkItems} from '../src/work-items';
import {snapshots,entityById,relations} from '../src/entity-data';
import {BOM_PURCHASE_DEMO,LEGACY_PURCHASE_PART,documentsForPurchasePart,purchaseQuotes,planningMaterialRows} from '../src/demo-bom-links';

describe('실제 BOM에 명시 연결한 합성 업무 범위',()=>{
 it('EVB 원문 사용 위치·수량을 보존하고 사내 매핑·EA·40대 수요는 합성 가정으로 분리한다',()=>{
  const fixture=BOM_PURCHASE_DEMO,source=snapshots.find(s=>s.id===fixture.configurationId)!.lines.find(l=>l.partId===fixture.sourcePartId)!;
  expect(source.qty).toBe(fixture.sourceQuantity);
  expect(source.sourceRow).toBe(fixture.sourceRow);
  expect(source.raw).toBe(fixture.designation);
  expect(source.position.split(/\s*,\s*/).sort()).toEqual([...fixture.positions].sort());
  expect(fixture.plannedBoards*fixture.sourceQuantity).toBe(fixture.requiredQuantity);
  expect(fixture.sourceUnit).toBe('미확인');expect(fixture.mountStatus).toBe('미검수');
  expect(entityById(fixture.partId)?.source).toBe('합성 예시');
  expect(entityById(LEGACY_PURCHASE_PART)?.name).toBe('MLCC 10uF / 25V');
  expect(relations.some(r=>r.from===fixture.sourcePartId&&r.to===fixture.partId)).toBe(true);
 });
 it('구형 요청·견적과 새 시연을 별도 식별자로 나누고 저장 기록을 변경하지 않는다',()=>{
  const documents=[{id:'PR-OLD',part:LEGACY_PURCHASE_PART,qty:13},{id:'PR-NEW',part:BOM_PURCHASE_DEMO.partId,qty:35}],before=structuredClone(documents);
  expect(documentsForPurchasePart(documents,BOM_PURCHASE_DEMO.partId)).toEqual([documents[1]]);
  expect(documentsForPurchasePart(documents,LEGACY_PURCHASE_PART)).toEqual([documents[0]]);
  const oldIds=new Set(purchaseQuotes(LEGACY_PURCHASE_PART).map(q=>q.id));
  expect(purchaseQuotes(BOM_PURCHASE_DEMO.partId).every(q=>!oldIds.has(q.id))).toBe(true);
  const state=initial();state.docs=documents.map(value=>({name:value.id,body:JSON.stringify({...value,type:'purchase-request'}),status:'초안'}));
  const purchase=buildWorkItems(state).find(item=>item.id==='TASK-IN')!;
  expect(purchase.quantity.value).toBe(35);expect(purchase.configId).toBe('CFG-EVB-C');
  expect(purchase.dataBasis.evidenceRefs).not.toContain('PR-OLD');
  expect(documents).toEqual(before);
 });
 it.each([0,20,30])('합격분 %i 할당 후 생산 표와 자재 계산이 같은 부족량을 쓰고 후보 미확인을 보존한다',allocated=>{
  let state=receive(reserve({...initial(),demandConfirmed:true},60),50,40,5,5);
  if(allocated)state=allocateMaterial(state,allocated);
  const before=structuredClone(state),m=materialQuantities(state),rows=planningMaterialRows(state);
  expect(rows[0]).toMatchObject({objectId:'PART-TPS',available:String(m.originalAvailable),allocated:String(m.receiptAllocated),short:String(m.comparisonShortage)});
  expect(rows[2]).toMatchObject({objectId:'PART-CAND',stock:'미확인',available:'미확인',short:'산출 보류'});
  expect(state).toEqual(before);
 });
});
