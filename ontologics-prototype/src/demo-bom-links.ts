import {materialQuantities,type State} from './domain';

/** Explicit, read-only links for synthetic business examples. Not a source BOM
 * correction, engineering approval, external quote, or authoritative ERP record. */
export const BOM_PURCHASE_DEMO={
 partId:'IM-EVB-C-C18-C26',modelId:'MODEL-EVB',configurationId:'CFG-EVB-C',
 sourcePartId:'PART-EVB-C-21',sourceId:'SRC-EVB-C-csv',sourceRow:21,sourceOrdinal:20,
 designation:'10uF/6.3V/20%/X5R/C0603',package:'C_0603_5MIL_DWS',positions:['C18','C26'],
 sourceQuantity:2,sourceUnit:'미확인',mountStatus:'미검수',
 plannedBoards:40,requiredQuantity:80,assumedUnit:'EA',assumedAvailable:0,
 demandId:'SYN-DEMAND-EVB-C-001',mappingEvidence:'SYN-MAP-EVB-C-C18-C26',
 needBy:'2026-09-25',
} as const;
export const LEGACY_PURCHASE_PART='IM-0008';
export type PurchaseScope=typeof BOM_PURCHASE_DEMO.partId|typeof LEGACY_PURCHASE_PART;
export const purchaseScopeDetail=(partId:string|undefined)=>partId===BOM_PURCHASE_DEMO.partId
 ?'ESP32-EVB / C · C18,C26 · 합성 매핑 · 실장 미검수'
 :partId===LEGACY_PURCHASE_PART?'기존 독립 구매 예시 · 실제 BOM 연결 없음':'구성 연결 미확인';
export const purchaseDemandEvidence=(partId:PurchaseScope)=>partId===BOM_PURCHASE_DEMO.partId?BOM_PURCHASE_DEMO.demandId:'SYN-DEMAND-IM0008-001';
export function purchaseQuotes(partId:PurchaseScope){
 const current=partId===BOM_PURCHASE_DEMO.partId;
 return [{id:current?'QUOTE-EVB-C-A-v1':'QUOTE-A-v1',supplier:'공급사 A',price:1200,moq:50,multiple:10,shipping:null as number|null,lead:5,supply:150,expires:'2026-09-30',evidence:current?'SYN-QUOTE-EVB-C-A-001':'SYN-QUOTE-A-001'},
  {id:current?'QUOTE-EVB-C-B-v1':'QUOTE-B-v1',supplier:'공급사 B',price:1050,moq:100,multiple:25,shipping:3000 as number|null,lead:10,supply:200,expires:'2026-09-30',evidence:current?'SYN-QUOTE-EVB-C-B-001':'SYN-QUOTE-B-001'}];
}
export function documentsForPurchasePart<T extends {part:string}>(records:T[],partId:string):T[]{
 // Existing stored requests/orders retain their original item and interpretation.
 return records.filter(record=>record.part===partId);
}
export function planningMaterialRows(state:State){
 const m=materialQuantities(state);
 return [
  {id:'PLAN-MATERIAL-M',objectId:'PART-TPS',part:'TPS2375D · U2',need:state.demandConfirmed?String(m.required):'수요 미확인',stock:String(m.originalStock),other:String(m.otherReserved),available:String(m.originalAvailable),allocated:String(m.receiptAllocated),short:state.demandConfirmed?String(m.comparisonShortage):'수요 미확인',evidence:'SRC-L1-ods / 행 56 · SYN-MAP-01 · DEMO-MATERIAL-01',note:'원문1 × 합성100대 · EA 가정 / 원품 가용+합격 할당 비교 · 전체 BOM 아님'},
  {id:'PLAN-MATERIAL-UNRESOLVED',objectId:undefined,part:'NA / NS / Opened 실장 항목',need:'미확인',stock:'미확인',other:'미확인',available:'미확인',allocated:'미확인',short:'미확인',evidence:'SRC-L1-ods',note:'행별 실장·품목 연결 확인 필요'},
  {id:'PLAN-MATERIAL-CANDIDATE',objectId:'PART-CAND',part:'TPS2376D · 미승인 후보',need:'호환 근거 필요',stock:'미확인',other:'미확인',available:'미확인',allocated:'미할당',short:'산출 보류',evidence:'SYN-LOCAL-01',note:'동일 후보 ID · 재고·가용 미확인 · 승인 전 확보량 제외'}
 ];
}
