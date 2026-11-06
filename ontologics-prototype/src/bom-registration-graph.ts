import {actualBomList,actualBoms,type ActualBomKey} from './actual-boms';
import {getBomRegistration,type BomRegistrationRecord} from './bom-registration';
import type {State} from './domain';
import {entities,relations,type Entity,type Relation} from './entity-data';

export const registrationObjectId=(record:BomRegistrationRecord)=>'BOM-REG-'+record.draftId;
/** Read-model projection only. Existing source rows/design links are never rewritten. */
export function registrationGraph(record:BomRegistrationRecord):{objects:Entity[];links:Relation[]}{
 const bom=actualBoms[record.snapshotKey],id=registrationObjectId(record);
 const objects:Entity[]=[{
  id,type:'BOM 등록 반영',name:`${bom.modelName} / ${bom.revision} 등록 반영`,company:'A',revision:String(record.draftVersion),status:'정확 승인 버전 반영',source:'합성 예시',
  properties:{'구성 ID':record.configurationId,'원본 ID':record.sourceId,'원본 SHA-256':record.sourceHash,'등록 초안':record.draftId,'승인 초안 버전':'v'+record.draftVersion,'승인 내용 SHA-256':record.draftHash,'작성자':record.author,'승인자':record.approvedBy,'반영 데이터 버전':'v'+record.appliedDataVersion,'반영 전 데이터 버전':'v'+record.baseVersion,'로컬 반영 시각':record.appliedAt,'원문 행 수':String(record.rowCount),'검수 범위':'원문·미확인 보존을 승인한 Mock 등록 · 단위/실장/MPN 검수 아님','수량 영향':'재고·예약·생산·납품 변화 없음'},evidence:[record.sourceId]
 },{
  id:record.sourceId,type:'원본 문서',name:bom.source.repositoryPath.split('/').at(-1)??record.sourceId,company:'A',revision:bom.revision,status:'원본 확보 · 독립 검수 전',source:'실제 공개 원본',
  properties:{'구성 ID':record.configurationId,'원본 SHA-256':record.sourceHash,'원본 스냅샷':record.snapshotId,'고정 커밋':bom.source.commit,'출처':bom.source.url,'근거 범위':'BOM 원문 · 실제 장착·검사 근거 아님'},evidence:[record.sourceId]
 }];
 const scope=`${record.configurationId} · ${record.draftId} v${record.draftVersion} · 데이터 v${record.appliedDataVersion} · 브라우저 Mock 등록`;
 const links:Relation[]=[
  {id:id+'-configuration',from:id,to:record.configurationId,type:'flow',label:'등록 반영 대상',scope,evidence:record.sourceId},
  {id:id+'-source',from:id,to:record.sourceId,type:'flow',label:'정확 원본 근거',scope:scope+' · SHA-256 '+record.sourceHash,evidence:record.sourceId},
  {id:id+'-source-configuration',from:record.sourceId,to:record.configurationId,type:'flow',label:'등록 구성의 원본',scope:scope+' · 실장 승인 아님',evidence:record.sourceId}
 ];
 return {objects,links};
}
export function registrationStatus(state:State,key:ActualBomKey){
 const record=getBomRegistration(state,key);
 return record?'정확 승인 버전 반영':key==='L1'&&state.bomApplied?'이전 L1 반영 기록 · 상세 근거 연결 전':'아직 미반영';
}
/** One current collection feeds QueryPort, GraphPort, Inspector and separate graph. */
export function projectBomRegistrations(state:State,baseObjects:Entity[]=entities,baseLinks:Relation[]=relations){
 const graphs=actualBomList.flatMap(bom=>{const record=getBomRegistration(state,bom.key);return record&&record.companyId==='A'?[registrationGraph(record)]:[]});
 const objects=baseObjects.map(object=>{
  const bom=actualBomList.find(item=>item.configurationId===object.id);if(!bom)return object;
  const record=getBomRegistration(state,bom.key);
  return {...object,properties:{...object.properties,'로컬 등록 상태':registrationStatus(state,bom.key),'원문 검수':'단위·실장·정확 품번 미확인 유지','운영 그래프 동기화':'운영 RDF 미연결 · 별도 로컬 투영과 구분',...(record&&record.companyId==='A'?{'등록 반영 객체':registrationObjectId(record),'승인 초안':`${record.draftId} v${record.draftVersion}`,'승인 내용 SHA-256':record.draftHash,'반영 데이터 버전':'v'+record.appliedDataVersion}:{})}};
 });
 return {objects:[...objects,...graphs.flatMap(graph=>graph.objects)],links:[...baseLinks,...graphs.flatMap(graph=>graph.links)]};
}
