import {actualBoms,type ActualBom,type ActualBomKey} from './actual-boms';
import type {Actor,Draft,Payload,State} from './domain';

/** Browser Mock registration provenance. Approval preserves unreviewed source
 * values; it does not certify a unit, MPN, population, or production demand. */
export type BomRegistrationRecord={
 snapshotKey:ActualBomKey;modelId:string;configurationId:string;sourceId:string;
 sourceHash:string;snapshotId:string;revision:string;rowCount:number;
 draftId:string;draftVersion:number;draftHash:string;author:Actor;approvedBy:Actor;
 companyId:string;baseVersion:number;appliedDataVersion:number;appliedAt:string;requestKey:string;
};
export type BomRegistrations=Partial<Record<ActualBomKey,BomRegistrationRecord>>;
function assert(ok:unknown,message:string):asserts ok {if(!ok)throw new Error(message)}
export const expectedBomMapping=(key:ActualBomKey)=>key==='L'||key==='L1'?'WROOM':actualBoms[key].configurationId;
export function buildBomRegistrationPayload(key:ActualBomKey,input:{mapping?:string;reviewed:boolean;receivedSourceHash:string}):Payload{
 const bom=actualBoms[key];
 return {kind:'bom',snapshotKey:key,configurationId:bom.configurationId,modelId:bom.modelId,
  snapshotId:bom.source.snapshotId,revision:bom.revision,sourceId:bom.sourceId,sourceHash:input.receivedSourceHash,
  rowCount:bom.lines.length,mapping:input.mapping??expectedBomMapping(key),reviewed:input.reviewed,
  unknownPolicy:'preserve-unreviewed',unknown:'원문 값·실장·단위·정확 품번의 미검수 상태 보존',
  evidence:bom.sourceId+(key==='L'||key==='L1'?` · SRC-${key}-pdf`:'')};
}
/** Old L1 payloads retain their original content/hash. They can be interpreted
 * only when their original evidence and SHA-256 identify the actual L1 source. */
export function resolveBomRegistration(payload:Payload):ActualBom{
 assert(payload.kind==='bom','BOM 등록 명령이 아닙니다.');
 const explicit=payload.snapshotKey!==undefined;
 if(!explicit){
  assert(payload.configurationId===undefined&&payload.modelId===undefined&&payload.sourceId===undefined&&payload.snapshotId===undefined&&payload.revision===undefined&&payload.rowCount===undefined,'등록 대상 식별이 불완전합니다. 원본과 구성을 다시 선택한 새 초안이 필요합니다.');
  const legacy=actualBoms.L1;
  assert(payload.sourceHash===legacy.source.sha256&&typeof payload.evidence==='string'&&payload.evidence.split(' · ').includes(legacy.sourceId),'이전 L1 초안의 정확한 원본·해시를 확인할 수 없습니다. 원본을 다시 접수해 새 초안을 작성하세요.');
  return legacy;
 }
 assert(typeof payload.snapshotKey==='string'&&Object.prototype.hasOwnProperty.call(actualBoms,payload.snapshotKey),'지원하는 실제 BOM 스냅샷을 선택해 주세요.');
 const bom=actualBoms[payload.snapshotKey as ActualBomKey];
 assert(payload.configurationId===bom.configurationId&&payload.modelId===bom.modelId&&payload.snapshotId===bom.source.snapshotId&&payload.revision===bom.revision,'BOM 스냅샷·제품·구성·개정 매핑이 일치하지 않습니다.');
 assert(payload.sourceId===bom.sourceId&&payload.sourceHash===bom.source.sha256,'접수 원본·해시가 선택한 BOM 스냅샷과 일치하지 않습니다.');
 assert(payload.rowCount===bom.lines.length,'BOM 원문 행 수가 확보한 스냅샷과 일치하지 않습니다.');
 assert(payload.unknownPolicy==='preserve-unreviewed','원문의 미검수 상태를 보존하는 등록안이 필요합니다.');
 assert(typeof payload.evidence==='string'&&payload.evidence.split(' · ').includes(bom.sourceId),'선택한 BOM의 원본 근거가 필요합니다.');
 return bom;
}
export const getBomRegistration=(state:State,key:ActualBomKey,companyId='A')=>{
 const record=state.bomRegistrations?.[key];return record?.companyId===companyId?record:undefined;
};
/** The old boolean is deliberately not converted into source/approval metadata. */
export const isBomRegistered=(state:State,key:ActualBomKey)=>!!getBomRegistration(state,key)||(key==='L1'&&state.bomApplied);
export function validateBomRegistration(state:State,payload:Payload):ActualBom{
 const bom=resolveBomRegistration(payload);
 assert(payload.mapping===expectedBomMapping(bom.key),'대상 매핑이 선택한 원본 구성과 일치하지 않습니다.');
 assert(payload.reviewed===true,'시트명·원문 경고와 미확인 실장·단위·품번 항목을 검토해 주세요.');
 assert(!getBomRegistration(state,bom.key),'같은 BOM 스냅샷은 이미 반영되었습니다. 기존 정확 버전 반영 기록을 확인하세요.');
 return bom;
}
export function bomRegistrationRecord(draft:Draft,appliedDataVersion:number,appliedAt:string):BomRegistrationRecord{
 const bom=resolveBomRegistration(draft.payload);
 assert(draft.approvedBy,'별도 신원의 승인이 필요합니다.');
 return {snapshotKey:bom.key,modelId:bom.modelId,configurationId:bom.configurationId,sourceId:bom.sourceId,
  sourceHash:bom.source.sha256,snapshotId:bom.source.snapshotId,revision:bom.revision,rowCount:bom.lines.length,
  draftId:draft.id,draftVersion:draft.version,draftHash:draft.hash,author:draft.author,approvedBy:draft.approvedBy,
  companyId:draft.companyId??'A',baseVersion:draft.base,appliedDataVersion,appliedAt,requestKey:draft.requestKey};
}
