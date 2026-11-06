import {actualBoms} from '../src/actual-boms';
import {buildBomRegistrationPayload} from '../src/bom-registration';
import {describe,it,expect} from 'vitest';
import {initial,makeDraft,approve,apply,digest,content,totals,investigation,matchInterval,defaultConditions,validate,reserve,receive,allocateMaterial,allocation,reproduction,aiAnswer,A,B0,B1,type State,type Payload} from '../src/domain';
async function commit(s:State,p:Payload){let d=await makeDraft(s,p,'Alice','test','UI08');d.status='검토 요청';d=await approve(s,d,'Bob');return apply({...s,drafts:[d,...s.drafts]},d)}
const production:Payload={kind:'production',good:60,total:62,defects:2,at:'2026-09-19T09:00:00+09:00',evidence:'DEMO-FUL-01'};
describe('AT01 / AT03 승인 버전과 분리',()=>{
 it('작성자 자기 승인과 Viewer 승인 차단',async()=>{const s=initial(),d=await makeDraft(s,production,'Alice','test','UI08');d.status='검토 요청';await expect(approve(s,d,'Alice')).rejects.toThrow('자기 승인');await expect(approve(s,d,'Viewer')).rejects.toThrow('권한');});
 it('승인만으로 확정 값은 바뀌지 않음',async()=>{const s=initial(),d=await makeDraft(s,production,'Alice','test','UI08');d.status='검토 요청';expect((await approve(s,d,'Bob')).status).toBe('승인');expect(s.production).toBe(0)});
 it('승인 후 내용 변조는 전부 미반영',async()=>{const s=initial(),d=await makeDraft(s,production,'Alice','test','UI08');d.status='검토 요청';const approved=await approve(s,d,'Bob');approved.payload.good=59;await expect(apply(s,approved)).rejects.toThrow('해시');expect(s.production).toBe(0);expect(s.stock).toBe(0)});
 it('오래된 기준 거부',async()=>{const s=initial(),d=await makeDraft(s,production,'Alice','test','UI08');d.status='검토 요청';const approved=await approve(s,d,'Bob');await expect(apply({...s,version:2},approved)).rejects.toThrow('오래된');});
 it('같은 키와 내용은 멱등, 다른 내용은 충돌',async()=>{const s=initial(),d=await makeDraft(s,production,'Alice','test','UI08');d.status='검토 요청';const approved=await approve(s,d,'Bob'),next=await apply(s,approved);expect(await apply(next,approved)).toEqual(next);await expect(apply(next,{...approved,hash:'different'})).rejects.toThrow('다른 내용')});
 it('BOM 잘못된 매핑·미검토 차단, 미확인 보존',async()=>{const s=initial(),p=buildBomRegistrationPayload('L1',{reviewed:true,receivedSourceHash:actualBoms.L1.source.sha256});expect(()=>validate(s,{...p,mapping:'WROVER'})).toThrow('매핑');expect(()=>validate(s,{...p,reviewed:false})).toThrow('미확인');const n=await commit(s,{...p,unknown:'NA/NS/Opened'});expect(n.bomApplied).toBe(true);expect(n.drafts[0].payload.unknown).toBe('NA/NS/Opened')});
 it('최초 보드 중복과 빈 근거 차단',()=>{expect(()=>validate(initial(),{kind:'board',board:'U104',evidence:'demo'})).toThrow('중복');expect(()=>validate(initial(),{...production,evidence:''})).toThrow('근거')});
});
describe('AT02 시간 경계와 미확인',()=>{
 it('대표 U104 보완 후 A 제외/B 포함, U106 미확인',()=>{const s={...initial(),traceCorrected:true};expect(investigation(s,defaultConditions).find(x=>x.id==='U104')?.result).toBe('조건상 제외');expect(investigation(s,{...defaultConditions,mode:'B'}).find(x=>x.id==='U104')?.result).toBe('장착 이력 확인');expect(investigation(s,defaultConditions).find(x=>x.id==='U106')?.result).toBe('추가 이력 확인 필요')});
 it('A 장착 포함·제거 제외',()=>{expect(matchInterval(A,B1,true,defaultConditions)).toBe('장착 이력 확인');expect(matchInterval(B0,A,true,defaultConditions)).toBe('조건상 제외')});
 it('B 시작과 같은 제거 / 종료와 같은 장착은 제외',()=>{const c={...defaultConditions,mode:'B' as const};expect(matchInterval('2026-08-01T00:00:00+09:00',B0,true,c)).toBe('조건상 제외');expect(matchInterval(B1,'2026-09-22T00:00:00+09:00',true,c)).toBe('조건상 제외')});
 it('제거 미기록을 무한 장착으로 바꾸지 않음',()=>expect(matchInterval(B0,null,true,defaultConditions)).toBe('추가 이력 확인 필요'));
 it('시간대 누락과 뒤집힌 기간 거부',()=>{expect(()=>investigation(initial(),{...defaultConditions,at:'2026-09-20T10:00:00'})).toThrow('시간대');expect(()=>investigation(initial(),{...defaultConditions,mode:'B',start:B1,end:B0})).toThrow('기간')});
 it('확인 범위 없는 보완 거부',()=>expect(()=>validate(initial(),{kind:'trace',removed:'2026-09-12T09:00:00+09:00',coverage:false,evidence:'DEMO'})).toThrow('확인 범위'));
});
describe('AT04 자재 보존',()=>{
 it('자기 예약 이중 차감·중복 증가 없음, 타 예약 반영',()=>{const s={...initial(),demandConfirmed:true};expect(reserve(reserve(s,60),60).reserved).toBe(60);expect(()=>reserve(s,81)).toThrow('80');expect(reserve(reserve(s,60),0).reserved).toBe(0)});
 it('입고 항등식·중복 기록·합격 초과·필요 초과 차단',()=>{const s={...initial(),demandConfirmed:true,reserved:60};expect(()=>receive(s,50,40,5,6)).toThrow('도착');const n=receive(s,50,40,5,5);expect(()=>receive(n,50,40,5,5)).toThrow('이미');const m=allocateMaterial(n,30);expect(m.materialAllocated).toBe(30);expect(()=>allocateMaterial(m,11)).toThrow('초과')});
});
describe('AT05 생산·입고·출하·도착',()=>{
 it('100/60/50/20/15/20의 보존 수량',async()=>{let s=await commit(initial(),production);s=await commit(s,{kind:'stock',qty:50,evidence:'D'});s=allocation(s,50);s=await commit(s,{kind:'shipment',qty:20,at:'2026-09-19T13:00:00+09:00',evidence:'D'});s=await commit(s,{kind:'shipment',qty:15,at:'2026-09-19T14:00:00+09:00',evidence:'D'});s=await commit(s,{kind:'arrival',shipment:'SHP-01',qty:20,at:'2026-09-20T10:00:00+09:00',evidence:'D'});expect(totals(s)).toEqual({targetRemaining:40,unstocked:10,warehouse:15,shipped:35,arrived:20,transit:15,promiseRemaining:80,available:15});});
 it('미래 실적·총생산 모순·누계 감소 차단',()=>{expect(()=>validate(initial(),{...production,at:'2026-09-21T09:00:00+09:00'})).toThrow('미래');expect(()=>validate(initial(),{...production,total:60})).toThrow('총생산');expect(()=>validate({...initial(),production:70},production)).toThrow('누계 감소')});
 it('정상 완료만으로 출하할 수 없음',()=>expect(()=>validate({...initial(),production:60},{kind:'shipment',qty:1,at:'2026-09-19T13:00:00+09:00',evidence:'D'})).toThrow('창고'));
 it('배정·창고 초과 차단',()=>{const s={...initial(),stock:50,allocated:50,observed:'2026-09-19T09:00:00+09:00'};expect(()=>allocation(s,1)).toThrow('상한');expect(()=>validate(s,{kind:'shipment',qty:51,at:'2026-09-19T13:00:00+09:00',evidence:'D'})).toThrow('초과')});
 it('부분 도착 허용·잔량 초과·출발 전 도착·미래 도착 차단',()=>{const s={...initial(),shipments:[{id:'SHP-01',qty:20,departure:'2026-09-19T13:00:00+09:00',evidence:'D'}]};const p:Payload={kind:'arrival',shipment:'SHP-01',qty:20,at:'2026-09-20T10:00:00+09:00',evidence:'D'};expect(()=>validate(s,{...p,qty:15})).not.toThrow();expect(()=>validate(s,{...p,qty:21})).toThrow('잔량');expect(()=>validate(s,{...p,at:'2026-09-18T10:00:00+09:00'})).toThrow('출발');expect(()=>validate(s,{...p,at:'2026-09-21T10:00:00+09:00'})).toThrow('기준')});
});
describe('AT06 / AT07',()=>{
 it('구성 X 교체 10 - 같은 구성 가용 2 = 8',()=>expect(reproduction(10,0,2)).toBe(8));
 it('AI는 직접 계산의 같은 수치·버전 사용',()=>{const s={...initial(),production:60,stock:50,allocated:50};const answer=aiAnswer(s,'UI08','잔량',defaultConditions);expect(answer).toContain(`창고 ${totals(s).warehouse}대`);expect(answer).toContain('데이터 v1')});
 it('AI 승인 요구는 권한 부여가 아님',()=>expect(aiAnswer(initial(),'UI05','승인해',defaultConditions)).toContain('승인 권한'));
 it('AI 이력은 직접 판정과 같음',()=>{const s={...initial(),traceCorrected:true};expect(aiAnswer(s,'UI04','U104',defaultConditions)).toContain('U104: 조건상 제외')});
});
