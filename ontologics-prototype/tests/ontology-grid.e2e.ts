import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const grid=(page:Page,key:string)=>page.locator(`[data-workflow-grid="${key}"]`);
const ledger=(page:Page)=>page.evaluate(()=>localStorage.getItem('ontologics-v1'));
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.goto('/#MAP');await page.reload()});

test('온톨로지 객체 표: 점진 확장·전체 검색·사진·선택·목록 상태는 같은 객체를 유지',async({page})=>{
 const table=grid(page,'ontology-objects'),before=await ledger(page);
 await expect(table.locator('tbody tr')).toHaveCount(12);
 await expect(page.locator('.ext-statline')).toContainText('전체 고유 업무 객체미집계');
 await page.getByLabel('전체 지도 객체 검색',{exact:true}).fill('MODEL-IO');
 const row=table.locator('tr[data-row-id="MODEL-IO"]');await expect(row).toBeVisible();
 const prior=await page.locator('.ai-context code').textContent(),photo=row.locator('[data-column-id="photo"] button');
 await photo.click();await expect(page.getByRole('dialog',{name:'사진·출처'})).toContainText('외형 이해용 참고 이미지');await page.keyboard.press('Escape');await expect(photo).toBeFocused();await expect(page.locator('.ai-context code')).toHaveText(prior!);
 await row.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('MODEL-IO');
 await row.getByRole('button',{name:'IO-24 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('MODEL-IO');await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await table.getByRole('button',{name:'열 선택',exact:true}).click();await table.locator('.column-picker').getByRole('checkbox',{name:'원문 근거',exact:true}).uncheck();await table.getByRole('combobox',{name:'페이지당 행'}).selectOption('24');
 await page.reload();await expect(page.getByLabel('전체 지도 객체 검색',{exact:true})).toHaveValue('MODEL-IO');await expect(row.getByRole('checkbox')).toBeChecked();await expect(table.locator('th[data-column-id="evidence"]')).toHaveCount(0);await expect(table.getByRole('combobox',{name:'페이지당 행'})).toHaveValue('24');await expect(page.locator('.ai-context code')).toHaveText('MODEL-IO');
 const pendingDownload=page.waitForEvent('download');await page.getByRole('button',{name:'조회 결과 다운로드',exact:true}).click();const file=await pendingDownload;const exported=JSON.parse(await readFile((await file.path())!,'utf8'));expect(exported.objects.map((r:{id:string})=>r.id)).toEqual(['MODEL-IO']);expect(exported.company).toBe('A');
 await page.getByLabel('전체 지도 객체 검색',{exact:true}).fill('');await expect(page.locator('.ext-filter')).toContainText('확장 대상 12');await page.getByRole('button',{name:'다음 12개 펼치기',exact:true}).click();await expect(page.locator('.ext-filter')).toContainText('확장 대상 24');await expect(table.locator('tbody tr')).toHaveCount(24);
 await table.getByRole('columnheader',{name:'유형 / 회사',exact:true}).getByRole('button').click();await expect(table.locator('tr[data-row-id="MODEL-IO"] input[type=checkbox]')).toBeChecked();
 expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('온톨로지 정책·버전 표: 업무 객체와 분리하고 미연결·초안·권한을 유지',async({page})=>{
 const before=await ledger(page),prior=await page.locator('.ai-context code').textContent();
 await page.getByRole('tab',{name:'TBox · 관리자 초안',exact:true}).click();
 const policies=grid(page,'ontology-policies');await expect(policies.locator('tbody tr')).toHaveCount(3);await expect(policies.locator('.media-trigger,.entity-chip')).toHaveCount(0);
 await policies.locator('tr[data-row-id="event-trigger"]').getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText(prior!);await expect(policies).toContainText('업무 객체·AI 대상 유지');await expect(page.getByRole('button',{name:'초안 저장',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'운영 적용',exact:true})).toBeDisabled();
 await policies.getByRole('searchbox').fill('트리거');await expect(policies.locator('tbody tr')).toHaveCount(1);
 await page.getByRole('tab',{name:'버전 · 조회 기준',exact:true}).click();const versions=grid(page,'ontology-versions');await expect(versions.locator('tbody tr')).toHaveCount(5);
 await expect(versions.locator('tr[data-row-id="ledger"]')).toContainText('미연결');await expect(versions.locator('tr[data-row-id="ledger"]')).toContainText('조회 불가');await expect(versions.locator('tr[data-row-id="tbox"]')).toContainText('저장 없음');await versions.locator('tr[data-row-id="rdf"]').getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText(prior!);
 await versions.getByRole('searchbox').fill('미연결');await versions.getByRole('button',{name:'열 선택',exact:true}).click();await versions.locator('.column-picker').getByRole('checkbox',{name:'기준 / 범위',exact:true}).uncheck();await page.reload();
 await expect(page.getByRole('tab',{name:'버전 · 조회 기준',exact:true})).toHaveAttribute('aria-selected','true');await expect(versions.getByRole('searchbox')).toHaveValue('미연결');await expect(versions.locator('tr[data-row-id="rdf"] input[type=checkbox]')).toBeChecked();await expect(versions.locator('th[data-column-id="scope"]')).toHaveCount(0);
 await page.getByRole('tab',{name:'TBox · 관리자 초안',exact:true}).click();await expect(policies.getByRole('searchbox')).toHaveValue('트리거');await expect(policies.locator('tr[data-row-id="event-trigger"] input[type=checkbox]')).toBeChecked();
 expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('클래스 탐색: 기본6개·관계5개 읽기, 업무 객체 정확 유형과 사진·AI 연결',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));const before=await ledger(page),prior=await page.locator('.ai-context code').textContent();
 await page.getByRole('tab',{name:'클래스·관계 탐색',exact:true}).click();const browser=page.getByRole('region',{name:'읽기 전용 클래스·관계 탐색'});
 await expect(browser.locator('.class-definition-node')).toHaveCount(6);await expect(browser.locator('.class-definition-edge')).toHaveCount(5);await expect(browser.locator('.class-browser-summary')).toContainText('기본 정의 v1');await expect(browser.locator('.class-object-count')).toContainText('유형 일치 8개');
 await browser.getByRole('button',{name:'사내 품목 클래스 보기',exact:true}).focus();await page.keyboard.press('Enter');await expect(browser.getByRole('complementary',{name:'선택 클래스 정의'})).toContainText('part_id');await expect(page.locator('.ai-context code')).toHaveText(prior!);
 const parts=grid(page,'class-objects-Part');await expect(browser.locator('.class-object-count')).toContainText('유형 일치 27개');await expect(parts.locator('.table-pagination')).toContainText('로드 27건');await parts.getByRole('searchbox').fill('PART-POE');await expect(parts).toContainText('검색 조건에 맞는 객체가 없습니다.');await parts.getByRole('searchbox').fill('PART-TPS');
 const row=parts.locator('tr[data-row-id="PART-TPS"]'),photo=row.locator('[data-column-id="photo"] button');await photo.click();await expect(page.getByRole('dialog',{name:'사진·출처'})).toContainText('외형 이해용 참고 이미지');await expect(page.locator('.ai-context code')).toHaveText(prior!);await page.keyboard.press('Escape');await expect(photo).toBeFocused();
 await row.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('PART-TPS');await browser.getByRole('checkbox',{name:'선택 주변만',exact:true}).check();await expect(browser.locator('.class-definition-node')).toHaveCount(3);await expect(browser.locator('.class-definition-edge')).toHaveCount(2);await browser.getByRole('button',{name:'관계 목록',exact:true}).click();await expect(browser.locator('.class-relation-list')).toContainText('hasBOMLine');await expect(browser.locator('.class-relation-list')).toContainText('lotOf');
 await browser.getByRole('searchbox',{name:'클래스 이름·ID 검색',exact:true}).fill('없는클래스');await expect(browser.locator('.class-empty')).toBeVisible();await page.reload();await expect(browser.getByRole('searchbox',{name:'클래스 이름·ID 검색',exact:true})).toHaveValue('없는클래스');await expect(parts.getByRole('searchbox')).toHaveValue('PART-TPS');await expect(row.getByRole('checkbox')).toBeChecked();await expect(page.locator('.ai-context code')).toHaveText('PART-TPS');expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);expect(errors).toEqual([]);
});

test('클래스 탐색: 관리자 초안과 읽기 정의 격리, 런타임 보드·조회 권한 범위',async({page})=>{
 const {initial,makeDraft,approve,apply}=await import('../src/domain');let seeded=initial();const draft=await makeDraft(seeded,{kind:'board',board:'U999',evidence:'DEMO-CLASS-BOARD'},'Alice','새 보드 식별','UI03'),approved=await approve(seeded,{...draft,status:'검토 요청'},'Bob');seeded=await apply({...seeded,drafts:[approved]},approved);await page.evaluate(value=>localStorage.setItem('ontologics-v1',JSON.stringify(value)),seeded);await page.reload();
 const switchUser=async(name:string)=>{await page.getByLabel('시연 신원',{exact:true}).selectOption(name);const dialog=page.getByRole('dialog',{name:'개발 계정 전환'});await dialog.getByRole('button',{name:/^(계정 전환|현재 계정에 입력 보관 후 전환|입력 버리고 전환)$/}).click();await expect(dialog).not.toBeVisible();if(name!=='OtherCompany')await page.goto('/#MAP')};
 await switchUser('Bob');await page.getByRole('tab',{name:'TBox · 관리자 초안',exact:true}).click();await page.getByLabel('SHACL 제약 초안').fill('관리자 검토용 설명 · 운영 적용 아님');await page.getByRole('button',{name:'클래스 초안 추가',exact:true}).click();await page.getByLabel('클래스 식별자 · 영문').fill('InspectionExample');await page.getByRole('button',{name:'초안에 추가',exact:true}).click();await page.getByRole('button',{name:'초안 저장',exact:true}).click();await expect(page.locator('.toast')).toContainText('격리 초안 저장');
 await page.getByRole('tab',{name:'클래스·관계 탐색',exact:true}).click();const browser=page.getByRole('region',{name:'읽기 전용 클래스·관계 탐색'});await expect(browser.locator('.class-definition-node')).toHaveCount(6);await expect(browser).not.toContainText('InspectionExample');await expect(browser.locator('.class-constraint')).toHaveText('configuration_id 최소 1 / 최대 1');
 await browser.getByRole('button',{name:'개별 보드 클래스 보기',exact:true}).click();await expect(browser.locator('.class-object-count')).toContainText('유형 일치 5개');const boards=grid(page,'class-objects-BoardUnit');await boards.getByRole('searchbox').fill('U999');await expect(boards.locator('tr[data-row-id="U999"]')).toContainText('식별 등록');await expect(boards.locator('tr[data-row-id="U999"]')).toContainText('실물 사진 미등록');
 const afterDraft=await ledger(page);await switchUser('Viewer');await page.getByRole('tab',{name:'클래스·관계 탐색',exact:true}).click();await expect(browser.locator('.class-definition-node')).toHaveCount(6);await expect(browser.getByRole('button',{name:'초안 저장',exact:true})).toHaveCount(0);await browser.getByRole('button',{name:'부품 로트 클래스 보기',exact:true}).click();await expect(browser.locator('.class-object-count')).toContainText('유형 일치 2개');expect(await ledger(page)).toBe(afterDraft);
 await switchUser('OtherCompany');await expect(page.getByRole('heading',{name:'회사 B의 업무 공간'})).toBeVisible();await expect(browser).toHaveCount(0);await expect(page.locator('main')).not.toContainText('ProductConfiguration');await expect(page.locator('main')).not.toContainText('LOT-L07');
});

test('클래스 탐색: 라이트·다크·390px와 목록 대안, 초점·보기 상태',async({page})=>{
 await page.getByRole('tab',{name:'클래스·관계 탐색',exact:true}).click();const browser=page.getByRole('region',{name:'읽기 전용 클래스·관계 탐색'});await expect(browser.locator('.class-object-count')).toContainText('유형 일치 8개');
 await expect(browser.locator('[data-media-state="loading"]')).toHaveCount(0);await expect(page.locator('body')).toHaveJSProperty('scrollWidth',1600);await page.locator('main h1').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'output/playwright/class-browser-light-v2.6.png'});await page.screenshot({path:'output/playwright/class-browser-light-full-v2.6.png',fullPage:true});
 await page.getByRole('button',{name:'다크 테마',exact:true}).click();if(!await page.locator('.ai-context').isVisible())await page.getByRole('button',{name:'AI 패널 열기',exact:true}).click();await page.locator('main h1').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'output/playwright/class-browser-dark-v2.6.png'});
 await page.setViewportSize({width:390,height:844});await page.reload();await expect(browser).toBeVisible();await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await browser.getByRole('button',{name:'관계 목록',exact:true}).click();await expect(browser.locator('.class-relation-list>div')).toHaveCount(5);await browser.locator('.class-relation-list button').first().focus();await page.keyboard.press('Enter');await expect(browser.locator('.class-inspector-title')).toContainText('제품 구성');await page.locator('main h1').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'output/playwright/class-browser-mobile-v2.6.png',fullPage:true});await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);
});

test('클래스 탐색: 격리 조회 응답의 로딩·실패·부분·오래된 기준·빈 결과와 늦은 응답',async({page})=>{
 // Inject failures into this isolated browser's served Mock module; production sources and ports are unchanged.
 await page.route('**/src/ports.ts*',async route=>{
  const url=new URL(route.request().url());url.searchParams.set('validation',String(Date.now()));const headers={...route.request().headers()};delete headers['if-none-match'];delete headers['if-modified-since'];// Read only the local Vite module directly; the graph-isolation proxy intentionally rejects Node CONNECT.
  const response=await fetch(url.href,{headers}),body=await response.text(),anchor=/async search\(query,\s*context,\s*options = \{\}\) \{/;
  expect(body).toMatch(anchor);
  const injected=`const testMode = localStorage.getItem('__class_query_test');
   if (query === '제품 구성' && testMode) {
    if(testMode === 'delay') { await new Promise(resolve=>setTimeout(resolve,1200));localStorage.setItem('__class_delay_returned','yes'); }
    if(testMode === 'failure') throw new Error('격리 시험 조회 실패');
    if(['empty','partial','stale'].includes(testMode)) return {data:[],meta:{mode:'mock',asOf:context.asOf,dataVersion:context.dataVersion,state:testMode==='empty'?'ready':testMode,total:testMode==='empty'?0:null,loaded:0,displayed:0,exact:testMode==='empty'}};
   }`;
  await route.fulfill({status:response.status,contentType:'text/javascript',body:body.replace(anchor,match=>match+injected)});
 });
 await page.evaluate(()=>localStorage.setItem('__class_query_test','delay'));await page.reload();await page.getByRole('tab',{name:'클래스·관계 탐색',exact:true}).click();
 const browser=page.getByRole('region',{name:'읽기 전용 클래스·관계 탐색'}),before=await ledger(page);
 await expect(browser.getByRole('status')).toContainText('허용된 유형 객체 조회 중');await browser.getByRole('button',{name:'사내 품목 클래스 보기',exact:true}).click();await expect(browser.locator('.class-object-count')).toContainText('유형 일치 27개');
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('__class_delay_returned'))).toBe('yes');await expect(browser.locator('.class-inspector-title')).toContainText('사내 품목');await expect(browser.locator('.class-object-count')).toContainText('유형 일치 27개');
 await page.evaluate(()=>localStorage.setItem('__class_query_test','failure'));await browser.getByRole('button',{name:'제품 구성 클래스 보기',exact:true}).click();await expect(browser.getByRole('alert')).toContainText('객체 조회 실패');await expect(browser.locator('.class-object-count')).toHaveCount(0);
 await page.evaluate(()=>localStorage.setItem('__class_query_test','ready'));await browser.getByRole('button',{name:'같은 조건으로 재조회',exact:true}).click();await expect(browser.locator('.class-object-count')).toContainText('유형 일치 8개');await expect(browser.getByRole('alert')).toHaveCount(0);
 for(const mode of ['partial','stale','empty']){
  await browser.getByRole('button',{name:'사내 품목 클래스 보기',exact:true}).click();await page.evaluate(value=>localStorage.setItem('__class_query_test',value),mode);await browser.getByRole('button',{name:'제품 구성 클래스 보기',exact:true}).click();
  if(mode==='empty'){await expect(browser.locator('.class-object-count')).toContainText('유형 일치 0개 · 조회 범위 내 정확 집계');await expect(browser).toContainText('현재 회사·조회 범위에 이 유형의 객체가 없습니다.');await expect(browser.getByRole('button',{name:'다음 검색 결과 100개 조회',exact:true})).toHaveCount(0)}
  else {await expect(browser.locator('.class-object-count')).toContainText('부분 결과');await expect(browser.locator('.class-object-count')).toContainText('원 검색 미집계');await expect(browser).toContainText('전체 0개를 의미하지 않습니다.');if(mode==='stale')await expect(browser.locator('.class-object-count')).toContainText('오래된 기준');}
 }
 expect(await ledger(page)).toBe(before);
});

test('ABox: 현재 보드·수량과 실제 BOM 객체, 필터 다운로드의 참조 완전성',async({page})=>{
 const {initial,reserve,receive,allocateMaterial,makeDraft,approve,apply}=await import('../src/domain');
 let seeded=allocateMaterial(receive(reserve({...initial(),demandConfirmed:true},60),50,40,5,5),30);
 const draft=await makeDraft(seeded,{kind:'board',board:'U998',evidence:'DEMO-ABOX-BOARD'},'Alice','ABox 새 보드','UI03');
 const approved=await approve(seeded,{...draft,status:'검토 요청'},'Bob');seeded=await apply({...seeded,drafts:[approved]},approved);
 await page.evaluate(value=>localStorage.setItem('ontologics-v1',JSON.stringify(value)),seeded);await page.reload();
 const before=await ledger(page),table=grid(page,'ontology-objects');
 await page.getByLabel('전체 지도 객체 검색',{exact:true}).fill('U998');await expect(table.locator('tr[data-row-id="U998"]')).toContainText('식별 등록');
 await page.getByLabel('전체 지도 객체 검색',{exact:true}).fill('PART-TPS');await table.locator('tr[data-row-id="PART-TPS"]').getByRole('checkbox').check();
 await expect(page.locator('.ai-context code')).toHaveText('PART-TPS');await expect(page.locator('details').filter({hasText:'선택 객체의 ABox 내용'})).toContainText('0 EA · 원품 가용 고려');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'조회 결과 다운로드',exact:true}).click();const file=await pending;const exported=JSON.parse(await readFile((await file.path())!,'utf8'));
 expect(exported.objects.map((object:{id:string})=>object.id)).toEqual(['PART-TPS']);expect(exported.objects[0].properties['계획 미확보']).toBe('10 EA');expect(exported.relations).toHaveLength(0);expect(exported.complete).toBe(true);
 await page.getByLabel('전체 지도 객체 검색',{exact:true}).fill('CFG-EVB-C');const row=table.locator('tr[data-row-id="CFG-EVB-C"]');await expect(row).toContainText('실제 공개 원본');await row.focus();await page.keyboard.press('Enter');await expect(page.locator('.ai-context code')).toHaveText('CFG-EVB-C');
 await page.getByRole('textbox',{name:'업무 AI 요청',exact:true}).fill('수량과 납품은?');await page.getByRole('button',{name:'AI 요청 전송',exact:true}).click();await expect(page.locator('.message.assistant')).toContainText('71행');await expect(page.locator('.message.assistant')).not.toContainText('약속 100대');
 await row.getByRole('button',{name:'SRC-EVB-C-csv',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('단위/실장/MPN 미확인');await page.keyboard.press('Escape');
 await page.locator('main h1').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'output/playwright/v17-abox-light.png',fullPage:true});
 await page.getByRole('button',{name:'다크 테마',exact:true}).click();await page.screenshot({path:'output/playwright/v17-abox-dark.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.reload();await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'output/playwright/v17-abox-mobile.png',fullPage:true});
 expect(await ledger(page)).toBe(before);
});
