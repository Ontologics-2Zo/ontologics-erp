import {initial,makeDraft,approve,apply,NOW,type Payload,type Actor} from '../src/domain';
import {createMockActionPort,type PortContext} from '../src/ports';
import catalog from '../src/catalog.json';

/** Isolated capture data; never imported by the application or written to user storage. */
export async function registrationEvidenceFixture(){
 let state=initial();
 const registered=await makeDraft(state,{kind:'board',board:'U107',evidence:'DEMO-BOARD-NEW · 가상 등록 요청'},'Alice','U107 최초 운영 등록','UI03');
 registered.id='DEMO-V25-BOARD-APPLIED';registered.requestKey='v25-capture-board-applied';registered.companyId='A';
 const approved=await approve(state,{...registered,status:'검토 요청'},'Bob');
 state=await apply({...state,drafts:[approved]},approved);
 const context=():PortContext=>({companyId:'A',actor:'Alice',identityRevision:1,contextRevision:1,entityId:'CFG-POE-L1',configurationId:'CFG-POE-L1',dataVersion:state.version,asOf:NOW});
 const port=createMockActionPort({getState:()=>state,setState:s=>{state=s},getContext:context});
 for(const [index,document] of [
  {name:'등록 검토 인계 초안',body:'L1 원본과 내부 시트명 불일치, NA·NS·Opened를 검토합니다.\n이 문서는 설명용 합성 초안이며 본문 문자열로 업무 객체 연결을 확정하지 않습니다.',status:'초안 저장'},
  {name:'보드 이력 확인 요청',body:'U107의 식별 등록 이후 구성과 장착 근거를 별도로 확인해야 합니다.\n실제 조사·현장 실행·외부 송신 완료가 아닙니다.',status:'초안 저장'},
  {name:'공급 조건 검토 메모',body:'가용 재고, 예약, 소비는 서로 다른 의미입니다.\n수량을 임의 합산하지 않습니다.',status:'초안 저장'}
 ].entries()){
  const result=await port.execute({operation:'document.save',document,context:context(),expectedVersion:state.version,idempotencyKey:'v25-capture-doc-'+index});
  if(result.status!=='completed')throw new Error(result.error??'Document fixture failed');
 }
 const rows:[Payload,string,string,Actor,string][]=[
  [{kind:'bom',mapping:'WROOM',reviewed:true,sourceHash:catalog.find(c=>c.id==='SRC-L1-ods')!.sha256,evidence:'SRC-L1-ods · SRC-L1-pdf'},'L1 BOM 등록 검토','UI02','Alice','DEMO-V25-BOM'],
  [{kind:'board',board:'U108',evidence:'DEMO-BOARD-NEW · 가상 등록 요청'},'U108 최초 운영 등록','UI03','Alice','DEMO-V25-BOARD-REVIEW'],
  [{kind:'board',board:'U109',evidence:'DEMO-BOARD-NEW · 가상 등록 요청'},'U109 최초 운영 등록','UI03','Bob','DEMO-V25-BOARD-BOB']
 ];
 for(const [payload,title,origin,actor,id] of rows){const draft=await makeDraft(state,payload,actor,title,origin);state.drafts.unshift({...draft,id,requestKey:'v25-capture-'+id,companyId:'A',status:'검토 요청'});}
 return state;
}
