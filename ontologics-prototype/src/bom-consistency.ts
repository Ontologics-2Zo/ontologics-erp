import {actualBoms,actualBomForSource,type ActualBomKey} from './actual-boms';
import catalog from './catalog.json';

export type BomCheck={
 id:string;category:'대상·원본'|'BOM 행'|'비교 범위';
 status:'형식 일치'|'범위 일치'|'불일치'|'미확인'|'미검증'|'미접수';
 target:string;entityId?:string;sourceId:string;row?:number;
 bomValue:string;comparison:string;note:string;action:string;
};
export type BomSourceRow={row:number;sheet:string;cells:readonly string[]};
export type AnalyzedBomRow={
 row:number;quantity:string;item:string;packageName:string;position:string;
 references:string[]|null;unknown:boolean;status:BomCheck['status'];details:string[];
};
const unknownMark=/^(NA|NS|Opened|Closed)(?=$|[\s(/])/i;

/** Checks source notation only. Counts include printed reference occurrences;
 * they are not mounted quantities, procurement requirements, or a DNP policy. */
export function analyzeBomRows(sourceRows:readonly BomSourceRow[]){
 const rows:AnalyzedBomRow[]=sourceRows.map(source=>{
  const [quantity='',item='',packageName='',position='']=source.cells;
  const parts=position.split(',').map(part=>part.trim());
  // No guessed expansion of ranges, missing tokens, or non-list notation.
  const ranges=/\b[A-Za-z]+\d+\s*[-~]\s*(?:[A-Za-z]+)?\d+\b/.test(position);
  const references=position.trim()&&parts.every(Boolean)&&!ranges?parts:null;
  return {row:source.row,quantity,item,packageName,position,references,
   unknown:unknownMark.test(item.trim()),status:'형식 일치',details:[]};
 });
 const occurrences=new Map<string,number[]>();
 for(const row of rows)for(const ref of row.references??[])occurrences.set(ref,[...(occurrences.get(ref)??[]),row.row]);
 for(const row of rows){
  const errors:string[]=[],missing:string[]=[];
  const rawQty=row.quantity.trim(),validQty=/^\d+$/.test(rawQty)&&Number.isSafeInteger(Number(rawQty));
  if(!rawQty)missing.push('수량 미기재');
  else if(!validQty)errors.push('수량이 0 이상의 정수 표기가 아님');
  if(!row.references)missing.push('참조 위치 목록 미기재 또는 해석 범위 밖');
  if(validQty&&row.references){
   if(Number(rawQty)!==row.references.length)errors.push(`원문 수량 ${rawQty} / 참조 위치 표기 ${row.references.length}개로 상이`);
   else row.details.push(`원문 수량 ${rawQty} = 참조 위치 표기 ${row.references.length}개`);
  }
  const duplicates=[...new Set((row.references??[]).filter(ref=>(occurrences.get(ref)?.length??0)>1))];
  if(duplicates.length)errors.push('중복 참조 위치: '+duplicates.map(ref=>`${ref} (행 ${occurrences.get(ref)!.join(', ')})`).join(' · '));
  else if(row.references)row.details.push('참조 위치 중복 없음');
  if(!row.item.trim())missing.push('품목 원문 미기재');
  if(!row.packageName.trim())missing.push('패키지 미기재');
  else row.details.push('패키지 원문 표기 있음 · 적합성 미검증');
  if(row.unknown)missing.push('NA·NS·Opened·Closed 원문 표기: 미확인 보존, DNP·정상 제외로 변환하지 않음');
  row.unknown=row.unknown||missing.length>0;
  row.status=errors.length?'불일치':row.unknown?'미확인':'형식 일치';
  row.details=[...errors,...missing,...row.details];
 }
 return {rows,rowCount:rows.length,
  knownReferenceCount:rows.reduce((sum,row)=>sum+(row.references?.length??0),0),unparsedPositionRows:rows.filter(row=>row.references===null).length,
  referenceCount:rows.every(row=>row.references!==null)?rows.reduce((sum,row)=>sum+row.references!.length,0):null,
  unknownRows:rows.filter(row=>row.unknown).length,
  // Known reference occurrences on unresolved rows; unparsed positions are not invented.
  unknownReferences:rows.filter(row=>row.unknown).reduce((sum,row)=>sum+(row.references?.length??0),0)};
}

export function auditBom({revision,mapping,uploaded}:{revision:ActualBomKey;mapping:string;uploaded:string}){
 const definition=actualBoms[revision],source=catalog.find(item=>item.id===definition.sourceId)!;
 const original=definition.lines,analysis=analyzeBomRows(original);
 const sheet=original[0]?.sheet??'',filenameVariant=/\((WROOM|WROVER)\)/i.exec(source.filename)?.[1],sheetVariant=/\((WROOM|WROVER)\)/i.exec(sheet)?.[1];
 const filenameRevision=/Rev[_\s]+([A-Z0-9]+)/i.exec(source.filename)?.[1],sheetRevision=/Rev[_\s]+([A-Z0-9]+)/i.exec(sheet)?.[1];
 const labelled=!!filenameVariant&&!!sheetVariant&&!!filenameRevision&&!!sheetRevision;
 const matchedLabels=labelled&&filenameVariant===sheetVariant&&filenameRevision===sheetRevision;
 const received=catalog.find(item=>item.sha256===uploaded),entityId=definition.configurationId;
 const checks:BomCheck[]=[
  {id:`source-label-${revision}`,category:'대상·원본',status:labelled?(matchedLabels?'범위 일치':'불일치'):'미확인',target:definition.source.format==='csv'?'파일명 · 개정 범위':'파일명 · 내부 시트명',entityId,sourceId:source.id,
   bomValue:source.filename,comparison:sheet||'CSV 원본 · 내부 시트 없음 · 파일명 개정 의미는 미검수',
   note:'개정·변형 명칭의 대조입니다. 명칭 차이가 실물 오류·품질 결함을 확정하지 않습니다.',action:'원본 근거 확인'},
  {id:`mapping-${revision}`,category:'대상·원본',status:!filenameVariant||!mapping.trim()?'미확인':mapping===filenameVariant?'범위 일치':'불일치',target:'선택 변형 · 파일명 범위',entityId,sourceId:source.id,
   bomValue:filenameVariant?`입력 변형 ${mapping||'미선택'}`:'구성 변형 미확인',comparison:`파일명 변형 ${filenameVariant??'미확인'}`,
   note:'현재 보기의 원본 파일명과 입력 변형을 비교합니다. 구성·실장·호환성 승인은 별도입니다.',action:'대상 변형 확인'},
  {id:`reception-${revision}`,category:'대상·원본',status:!uploaded?'미접수':!!received&&actualBomForSource(received.id)?.key===revision?'범위 일치':'불일치',target:'접수 원본 · 현재 보기',entityId,sourceId:received?.id??source.id,
   bomValue:`현재 보기 ${revision} · ${source.id}`,comparison:!uploaded?'원본 접수 전':received?`접수 ${received.id} · ${received.filename}`:'포함 카탈로그와 일치하는 접수 해시 없음',
   note:'접수 해시로 포함 자료를 식별한 결과입니다. 현재 보기·접수 원본·등록 명령의 대상은 각각 확인하며 승인·등록 완료를 뜻하지 않습니다.',action:'접수 근거 확인'},
  ...analysis.rows.map(row=>({id:`bom-row-${revision}-${row.row}`,category:'BOM 행' as const,status:row.status,target:row.position||`행 ${row.row} · 위치 미기재`,entityId:`${definition.partPrefix}-${row.row}`,sourceId:source.id,row:row.row,
   bomValue:`${row.item||'품목 미기재'} · 수량 ${row.quantity||'미기재'} (단위 미확인) · ${row.packageName||'패키지 미기재'}`,
   comparison:row.details.join(' / '),note:'원문 표기·형식 검사입니다. 전행의 실장·단위·MPN은 미검수입니다. 실제 장착, DNP 적용, 부품 호환성 또는 회로 동작을 검증하지 않습니다.',action:'원문 행 확인'})),
  {id:`cross-document-${revision}`,category:'비교 범위',status:'미검증',target:'회로도 · 데이터시트 교차 검토',entityId,sourceId:source.id,
   bomValue:definition.source.format==='ods'?`${definition.modelName} ${definition.revision} BOM ODS · 대응 BOM PDF 확보`:`${definition.modelName} ${definition.revision} BOM CSV 확보`,comparison:'회로도·데이터시트의 구조화 대조 미연결',
   note:'대응 BOM PDF를 회로도나 데이터시트로 취급하지 않습니다. 자료가 없거나 대조하지 않은 항목은 일치·0건으로 표시하지 않습니다.',action:'확보 원본 확인'},
 ];
 return {checks,rowCount:analysis.rowCount,referenceCount:analysis.referenceCount,knownReferenceCount:analysis.knownReferenceCount,unparsedPositionRows:analysis.unparsedPositionRows,unknownRows:analysis.unknownRows,unknownReferences:analysis.unknownReferences,
  issueCount:checks.filter(check=>check.status==='불일치'||check.status==='미확인').length,
  scopeLabel:`실제 공개 BOM ${revision} · ${source.id} · 원문 표기·형식 검토 / 회로도·데이터시트 대조 미검증`};
}
