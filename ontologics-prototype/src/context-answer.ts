import {actualBomList,actualPartId} from './actual-boms';
import {BOM_PURCHASE_DEMO} from './demo-bom-links';
import {aiAnswer,type State,type Conditions} from './domain';
import type {Entity} from './entity-data';

/** Explicit example responses: a selected source never inherits another configuration's ledger. */
export function contextualExampleAnswer(state:State,page:string,message:string,conditions:Conditions,selected?:Entity){
 if(/승인|반영해|등록해/.test(message))return aiAnswer(state,page,message,conditions);
 if(!selected)return '선택 객체가 없습니다. 대상을 선택하고 원문·회사 범위를 확인하세요. 실제 Agent는 미연결입니다.';
 const bom=actualBomList.find(item=>item.configurationId===selected.id||item.modelId===selected.id||item.lines.some(line=>actualPartId(item,line)===selected.id));
 if(bom&&(bom.configurationId!=='CFG-POE-L1'||selected.type==='BOM 원문 품목'||['UI02','EXPLORE','MAP'].includes(page))){
  const line=bom.lines.find(row=>actualPartId(bom,row)===selected.id);
  return `${bom.modelName} · 개정 ${bom.revision} · ${bom.configurationId}\n`+(line?`원문 행 ${line.row}: ${line.cells[1]} / 수량 표기 ${line.cells[0]} / 참조 ${line.cells[3]||'미기재'}\n`:`전체 BOM 원문 ${bom.lines.length}행 · 고유 부품 수나 실제 장착 수량이 아닙니다.\n`)+`원문 단위·실장·정확 MPN은 미확인, 독립 검수는 미완료입니다.\n근거 ${bom.sourceId} · commit ${bom.source.commit.slice(0,12)}\n이 원문을 선택한 상태에서 다른 구성의 생산·재고·납품 수량을 답변에 적용하지 않습니다. 해당 합성 업무 객체를 선택해 별도로 확인하세요.`;
 }
 if(selected.id===BOM_PURCHASE_DEMO.partId)return `${selected.name} · ${BOM_PURCHASE_DEMO.configurationId}\n합성 구매 수요 40대 × 원문 수량 표기 2 = 80 EA. EA와 가용0은 이 시연의 가정이며 원문의 단위·실장은 미검수입니다.\n근거 SRC-EVB-C-csv / 행 21 · 합성 품목 매핑\n공급 확인·입고·검사 합격은 별도입니다. PoE L1의 입고·납품 수량과 합산하지 않습니다.`;
 if(['CFG-POE-L1','PART-TPS','PART-ALT','PART-CAND','LOT-L07','RES-01','JOB-2609-01','CONTRACT-01','ROUND-01','U101','U104','U106','MOUNT-104','CLAIM-01'].includes(selected.id))return 'PoE L1 합성 업무 범위 · 실제 현장 자료 아님\n'+aiAnswer(state,page,message,conditions);
 return `${selected.type} · ${selected.id}\n${Object.entries(selected.properties).slice(0,6).map(([key,value])=>key+': '+value).join('\n')}\n근거: ${selected.evidence.join(', ')||'미등록'}\n이 대상의 추가 업무 수량·사건 연결은 미확인입니다. 다른 구성의 원장을 대신 표시하지 않습니다.`;
}
