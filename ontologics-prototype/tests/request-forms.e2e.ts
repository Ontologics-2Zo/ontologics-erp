import {test,expect} from '@playwright/test';

test('검토 입력 3종: 오류 입력 보존·회사 범위·문서만 저장·응답 유실 재조회',async({page})=>{
 await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();
 const factState=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ontologics-v1')!);return {version:s.version,production:s.production,stock:s.stock,allocated:s.allocated,reserved:s.reserved,receipt:s.receipt,shipments:s.shipments,boardIds:s.boardIds,bomApplied:s.bomApplied,traceCorrected:s.traceCorrected,claim:s.claim,testLinked:s.testLinked,applied:s.applied};});
 const before=await factState();
 const cases=[
  {page:'MATERIAL',heading:'재고 사건 검토 문서',operation:'issue',fields:[['출발 위치 · 근거 원문 표기','합성 창고 A-01'],['도착 위치 · 근거 원문 표기','합성 생산라인 L-01']],invalid:'quantity'},
  {page:'UI03',heading:'로트·장착·제거 기록 검토 문서',operation:'lot_register',fields:[['새 사내 로트 ID','LOT-REVIEW-TEST-001'],['공급처·제조사 로트 · 원문 표기','합성 공급사 S / 제조 로트 TEST-LOT-001']],invalid:'scope'},
  {page:'UI09',heading:'시험 의뢰·제공 결과 검토 문서',operation:'test_result',fields:[['시험 실행 ID · execution','TEST-EXEC-REVIEW-001'],['시험 기준 · 단위','제공 기준 V1 / V'],['시험 조건 · 제공 범위','시료 U104 1대 · 25°C · 시험팀 제공 범위'],['시험 의뢰 사건 ID','TEST-REQUEST-REVIEW-001']],invalid:'time'}
 ] as const;
 for(const [index,item] of cases.entries()){
  await page.goto('/#'+item.page);
  if(item.page==='MATERIAL')await page.getByRole('button',{name:'재고·예약 이력',exact:true}).click();
  const panel=page.locator('section.panel').filter({has:page.getByRole('heading',{name:item.heading,exact:true})});
  await expect(panel).toBeVisible();
  if(item.operation==='test_result')await panel.getByRole('tab',{name:'제공 결과',exact:true}).click();
  for(const [label,value] of item.fields)await panel.getByLabel(new RegExp('^'+label)).fill(value);
  await panel.getByLabel(/^이번 근거 사건 ID/).fill('REVIEW-SOURCE-'+index);
  await panel.getByLabel(/^원문 근거 ID/).fill('SYN-EVIDENCE-REVIEW-'+index);
  await panel.getByLabel(/^작성 이유/).fill('합성 원문에 기록된 사건의 입력 검토입니다. 사실·현장 실행을 요청하지 않습니다.');
  await panel.getByLabel(/^검토자 전달 사항/).fill('원사건 존재와 실제 수량·시험 범위는 서버 연결 후 검증해야 합니다.');
  const save=panel.getByRole('button',{name:'검토 문서 초안 저장',exact:true});
  if(item.invalid==='quantity'){
   await panel.getByLabel(/^이번 사건 수량/).fill('-2');await save.click();
   await expect(panel.getByRole('alert')).toContainText('0보다 큰');
   await expect(panel.getByLabel(/^이번 사건 수량/)).toHaveValue('-2');
   await panel.getByLabel(/^이번 사건 수량/).fill('1');
  }else if(item.invalid==='scope'){
   await panel.getByLabel(/^사내 품목 ID/).fill('OTHER-COMPANY:UNKNOWN');await save.click();
   await expect(panel.getByRole('alert')).toContainText('현재 회사 범위에서 확인할 수 없는');
   await expect(panel.getByLabel(/^사내 품목 ID/)).toHaveValue('OTHER-COMPANY:UNKNOWN');
   await panel.getByLabel(/^사내 품목 ID/).fill('PART-TPS');
  }else{
   await panel.getByLabel(/^발생 시각/).fill('2027-01-01T00:00:00+09:00');await save.click();
   await expect(panel.getByRole('alert')).toContainText('미래일 수 없습니다');
   await expect(panel.getByLabel(/^발생 시각/)).toHaveValue('2027-01-01T00:00:00+09:00');
   await panel.getByLabel(/^발생 시각/).fill('2026-09-20T12:00:00+09:00');
   await page.getByRole('button',{name:'오류 상태 시뮬레이션',exact:true}).click();
  }
  await expect(panel.getByLabel(/^이번 근거 사건 ID/)).toHaveValue('REVIEW-SOURCE-'+index);
  await save.click();
  if(item.invalid==='time'){
   await expect(panel).toContainText('접수 결과 미확인');
   await expect(save).toBeDisabled();
   await expect(panel.getByLabel(/^이번 근거 사건 ID/)).toHaveValue('REVIEW-SOURCE-'+index);
   await expect(page.getByLabel('시연 신원',{exact:true})).toBeDisabled();
   await page.reload();
   await expect(page.getByRole('button',{name:'기존 요청 상태 확인',exact:true})).toBeVisible();
   await expect(page.getByLabel('시연 신원',{exact:true})).toBeDisabled();
   await page.getByRole('button',{name:'기존 요청 상태 확인',exact:true}).click();
   await expect(page.getByLabel('시연 신원',{exact:true})).toBeEnabled();
  }else{
   await expect(panel.getByRole('button',{name:'이 내용 저장됨',exact:true})).toBeDisabled();
   await expect(panel).toContainText('원장·재고·장착·시험 판정은 반영하지 않았습니다.');
  }
  expect(await factState()).toEqual(before);
 }
 const documents=await page.evaluate(()=>JSON.parse(localStorage.getItem('ontologics-v1')!).docs.flatMap((d:{body:string})=>{try{const body=JSON.parse(d.body);return body.type==='review-request'?[body]:[]}catch{return []}}));
 expect(documents).toHaveLength(3);
 expect(documents.map((d:{operation:string})=>d.operation)).toEqual(['issue','lot_register','test_result']);
 for(const document of documents){expect(document.factApplied).toBe(false);expect(document.externalExecuted).toBe(false);expect(document.companyId).toBe('A');expect(document.fields.quantity).toBe(1);expect(document.status).toContain('미반영');}
});
