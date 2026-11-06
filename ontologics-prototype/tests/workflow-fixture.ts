import {actualBoms} from '../src/actual-boms';
import {initial,makeDraft,approve,apply,reserve,allocateMaterial,allocation,type Payload} from '../src/domain';

/** Isolated browser test/capture data. Never imported by the application. */
export async function workflowFixture(){
 let state=initial();let sequence=0;
 const commit=async(payload:Payload,title:string,origin:string)=>{
  const draft=await makeDraft(state,payload,'Alice',title,origin);
  draft.id='DEMO-GRID-'+String(++sequence).padStart(2,'0');draft.requestKey='demo-grid-request-'+sequence;draft.companyId='A';
  const approved=await approve(state,{...draft,status:'검토 요청'},'Bob');
  state={...state,drafts:[approved,...state.drafts]};state=await apply(state,approved);
 };
 state.docs.push({name:'합성 구매 요청 PR-GRID-01',status:'초안 저장',body:JSON.stringify({type:'purchase-request',id:'PR-GRID-01',part:'IM-0008',qty:80,needBy:'2026-09-25',evidence:'SYN-DEMAND-IM0008-001',author:'Alice',version:1})});
 await commit({kind:'purchase_order',orderId:'PO-GRID-01',requestId:'PR-GRID-01',part:'IM-0008',qty:100,unit:'개',quoteId:'QUOTE-B-v1',price:1050,shipping:3000,currency:'KRW',needBy:'2026-09-25',evidence:'SYN-QUOTE-B-001'},'내부 발주 기록 · 공급사 B','PURCHASE');
 await commit({kind:'supply',orderId:'PO-GRID-01',qty:40,at:'2026-09-20T09:00:00+09:00',evidence:'SYN-SUPPLY-GRID-01'},'부분 공급 확인 · 40개','PURCHASE');
 state=reserve({...state,demandConfirmed:true},60);
 await commit({kind:'material_receipt',total:50,pass:40,fail:5,pending:5,evidence:'DEMO-RECEIPT-GRID-01'},'자재 입고 검수 · 50개','UI07');
 state=allocateMaterial(state,30);
 await commit({kind:'production',total:64,good:60,defects:2,pending:2,jobId:'JOB-2609-01',outputLotId:'FG-2609-01',at:'2026-09-19T09:00:00+09:00',evidence:'DEMO-PRODUCTION-GRID-01'},'부분 생산 실적 · 정상 60대','UI08');
 await commit({kind:'stock',qty:50,jobId:'JOB-2609-01',outputLotId:'FG-2609-01',evidence:'DEMO-STOCK-GRID-01'},'완성품 입고 누계 · 50대','UI08');
 state=allocation(state,50);
 await commit({kind:'shipment',qty:20,jobId:'JOB-2609-01',outputLotId:'FG-2609-01',at:'2026-09-19T13:00:00+09:00',evidence:'DEMO-SHIP-GRID-01'},'1차 분할 출하 · 20대','UI08');
 await commit({kind:'shipment',qty:15,jobId:'JOB-2609-01',outputLotId:'FG-2609-01',at:'2026-09-19T14:00:00+09:00',evidence:'DEMO-SHIP-GRID-02'},'2차 분할 출하 · 15대','UI08');
 await commit({kind:'arrival',shipment:'SHP-01',qty:20,at:'2026-09-20T10:00:00+09:00',evidence:'DEMO-ARRIVAL-GRID-01'},'1차 출하 도착 · 20대','UI08');
 await commit({kind:'arrival',shipment:'SHP-02',qty:12,at:'2026-09-20T11:00:00+09:00',evidence:'DEMO-ARRIVAL-GRID-02'},'2차 출하 부분 도착 · 12대','UI08');
 for(const [payload,title,origin] of [
  [{kind:'trace',removed:'2026-09-12T09:00:00+09:00',coverage:true,evidence:'DEMO-TRACE-02'},'U104 제거·기간 보완','UI04'],
  [{kind:'bom',mapping:'WROOM',reviewed:true,sourceHash:actualBoms.L1.source.sha256,evidence:'SRC-L1-ods · SRC-L1-pdf'},'L1 BOM 등록 검토','UI02']
 ] as [Payload,string,string][]){const draft=await makeDraft(state,payload,'Alice',title,origin);draft.id='DEMO-GRID-'+String(++sequence).padStart(2,'0');draft.requestKey='demo-grid-request-'+sequence;state.drafts.unshift({...draft,companyId:'A',status:'검토 요청'});}
 return state;
}
