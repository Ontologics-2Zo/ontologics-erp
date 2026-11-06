import {test,expect,type Page} from '@playwright/test';
import {workflowFixture} from './workflow-fixture';

const table=(page:Page,key:string)=>page.locator(`[data-workflow-grid="${key}"]`);
const state=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('ontologics-v1')!));
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await page.goto('/#MATERIAL')});

test('자재 비교: 0·미확인·범위 승인 구분, 사진/선택, 후보 검토 문서만 저장',async({page})=>{
 await page.getByRole('button',{name:'부족·대체 검토',exact:true}).click();
 const grid=table(page,'material-comparison'),candidate=grid.locator('tr[data-row-id="PART-CAND"]'),alternative=grid.locator('tr[data-row-id="PART-ALT"]');
 const before=await state(page),initialObject=await page.locator('.ai-context code').textContent();
 await expect(grid.locator('tbody tr')).toHaveCount(3);
 await expect(alternative.locator('[data-column-id="reserved"] strong')).toContainText('0');
 await expect(candidate.locator('[data-column-id="reserved"] strong')).toContainText('미확인');
 await expect(candidate.locator('[data-column-id="available"] strong')).toContainText('미확인');
 await expect(alternative).toContainText('L1 / U2 / JOB-2609-01');await expect(alternative).toContainText('범위 승인');
 await candidate.locator('[data-column-id="photo"] button').click();const photo=page.getByRole('dialog',{name:'사진·출처',exact:true});await expect(photo).toBeVisible();await expect(photo).toContainText('외형 이해용 참고 이미지이며 실제 제품·배치와 다를 수 있습니다.');await expect(page.locator('.ai-context code')).toHaveText(initialObject!);await page.keyboard.press('Escape');
 await candidate.locator('[data-column-id="object"]').getByRole('button',{name:'TPS2376D 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('PART-CAND');await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();await expect(page.locator('.ai-context code')).toHaveText('PART-CAND');
 await alternative.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('PART-ALT');
 await grid.getByRole('columnheader',{name:'비교 가용량',exact:true}).getByRole('button').click();await grid.getByRole('columnheader',{name:'비교 가용량',exact:true}).getByRole('button').click();
 await expect(grid.locator('tbody tr').first()).toHaveAttribute('data-row-id','PART-ALT');await expect(grid.locator('tbody tr').last()).toHaveAttribute('data-row-id','PART-CAND');await expect(alternative.getByRole('checkbox')).toBeChecked();
 await grid.getByRole('searchbox').fill('TPS2376D');await expect(grid.locator('.table-pagination')).toContainText('전체 1건 선택 · 조건 내 0건');
 await candidate.getByRole('button',{name:'검토하기',exact:true}).click();const review=page.getByRole('dialog',{name:'미승인 후보 기술검토',exact:true});await expect(review).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText('PART-CAND');await expect(review).toContainText('미승인 후보는 배정할 수 없습니다.');
 await review.getByLabel('검토 사유와 근거').fill('합성 검토: 핀·열·회로 조건의 근거 확인 요청');await review.getByRole('button',{name:'검토 초안 저장',exact:true}).click();await expect(review).toContainText('승인이나 소비는 발생하지 않았습니다.');
 const after=await state(page);expect(after.docs).toHaveLength(before.docs.length+1);expect(after.docs.at(-1).body).toContain('대상 PART-CAND');for(const key of ['reserved','materialAllocated','receipt','drafts','applied'])expect(after[key]).toEqual(before[key]);
 await review.getByRole('button',{name:'닫기',exact:true}).last().click();await page.reload();await expect(grid.getByRole('searchbox')).toHaveValue('TPS2376D');await expect(page.locator('.ai-context code')).toHaveText('PART-CAND');await expect(grid.locator('.table-pagination')).toContainText('전체 1건 선택 · 조건 내 0건');await expect(page.locator('.message')).toHaveCount(0);
});

test('수급 현황: 1품목 분석 범위, 사진·객체·AI 분리와 표 상태 유지',async({page})=>{
 const overview=page.locator('[data-supply-overview]'),grid=table(page,'supply-demand'),before=await state(page);
 await expect(overview).toBeVisible();await expect(grid.locator('tbody tr')).toHaveCount(1);
 await expect(overview.locator('.supply-coverage')).toContainText('나머지 품목의 소요·재고·부족은 미계산');
 await expect(grid.locator('[data-column-id="required"] strong')).toContainText('100');
 await expect(grid.locator('[data-column-id="available"] strong')).toContainText('80');
 await expect(grid.locator('[data-column-id="shortage"] strong')).toContainText('20');
 await expect(overview.locator('[data-supply-quantity="unallocated-pass"]')).toContainText('미확인');
 await expect(overview.locator('[data-supply-quantity="secured"]')).toContainText('0');
 await expect(overview.locator('[data-supply-quantity="unsecured"]')).toContainText('100');
 await expect(overview.getByRole('button',{name:'이 품목 견적 요청 · 미연결',exact:true})).toBeDisabled();
 const initialObject=await page.locator('.ai-context code').textContent();
 await grid.locator('[data-column-id="photo"] button').click();await expect(page.getByRole('dialog',{name:'사진·출처',exact:true})).toContainText('외형 이해용 참고 이미지이며 실제 제품·배치와 다를 수 있습니다.');await expect(page.locator('.ai-context code')).toHaveText(initialObject!);await page.keyboard.press('Escape');
 await grid.locator('tbody input[type=checkbox]').check();await expect(page.locator('.ai-context code')).toHaveText('PART-TPS');
 await page.screenshot({path:'output/playwright/supply-overview-light.png',fullPage:true});
 await grid.locator('[data-column-id="object"]').getByRole('button',{name:'TPS2375D 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('PART-TPS');await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await grid.getByRole('searchbox').fill('SOIC-8');await page.getByRole('button',{name:'BOM·토폴로지',exact:true}).click();await page.getByRole('button',{name:'수급 현황',exact:true}).click();await expect(grid.getByRole('searchbox')).toHaveValue('SOIC-8');await expect(grid.locator('tbody input[type=checkbox]')).toBeChecked();await expect(page.locator('.ai-context code')).toHaveText('PART-TPS');
 expect(await state(page)).toEqual(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('수급 현황: 합격 미할당·승인 대체 재고는 계획 확보에 가산하지 않음',async({page})=>{
 const fixture=await workflowFixture();await page.evaluate(s=>localStorage.setItem('ontologics-v1',JSON.stringify(s)),fixture);await page.reload();const overview=page.locator('[data-supply-overview]'),grid=table(page,'supply-demand'),before=await state(page);
 await expect(overview.locator('[data-supply-quantity="reserved"]')).toContainText('60');await expect(overview.locator('[data-supply-quantity="unallocated-pass"]')).toContainText('10');await expect(overview.locator('[data-supply-quantity="secured"]')).toContainText('90');await expect(overview.locator('[data-supply-quantity="unsecured"]')).toContainText('10');
 await expect(grid.locator('[data-column-id="receiptAllocated"] strong')).toContainText('30');await expect(grid.locator('[data-column-id="shortage"] strong')).toContainText('0');
 await expect(overview.locator('[data-supply-alternative="PART-ALT"] .work-quantity strong')).toContainText('45');await expect(overview.locator('[data-supply-alternative="PART-CAND"] .work-quantity strong')).toContainText('미확인');
 await expect(overview.locator('[data-media-state="loading"]')).toHaveCount(0);await page.screenshot({path:'output/playwright/supply-overview-allocated.png',fullPage:true});
 await overview.getByLabel('비교 부족만',{exact:true}).check();await expect(grid).toContainText('전체 BOM의 수급 완료를 뜻하지 않습니다.');await page.reload();await expect(overview.getByLabel('비교 부족만',{exact:true})).toBeChecked();await expect(grid).toContainText('현재 조건에서 비교 부족인 확인 품목은 없습니다.');
 await overview.getByLabel('비교 부족만',{exact:true}).uncheck();await expect(grid.locator('tbody tr')).toHaveCount(1);expect(await state(page)).toEqual(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('재고·예약: 고정 로트100/20/80과 계획60·입고할당30을 구별, 이력은 객체 추론하지 않음',async({page})=>{
 const fixture=await workflowFixture();await page.evaluate(s=>localStorage.setItem('ontologics-v1',JSON.stringify(s)),fixture);await page.reload();const before=await state(page);
 await page.getByRole('button',{name:'재고·예약 이력',exact:true}).click();const lots=table(page,'inventory-lots'),reservations=table(page,'inventory-reservations');
 for(const [column,value] of [['stock','100'],['reserved','20'],['available','80']])await expect(lots.locator(`tbody [data-column-id="${column}"] strong`)).toContainText(value);
 await expect(reservations.locator('tr[data-row-id="RES-01"] [data-column-id="quantity"] strong')).toContainText('20');
 const current=reservations.locator('tr[data-row-id="CURRENT-PLAN-RESERVATION"]');await expect(current.locator('[data-column-id="quantity"] strong')).toContainText('60');await expect(current).toContainText('로트별 배정 미연결');
 await expect(reservations.locator('.list-footnote')).toContainText('별도 합격 입고 할당 30 EA · 계획 미확보 10 EA. 비교 부족 0 EA');
 await lots.locator('tbody input[type=checkbox]').check();await expect(page.locator('.ai-context code')).toHaveText('LOT-L07');await lots.locator('[data-column-id="photo"] button').click();await expect(page.getByRole('dialog',{name:'사진·출처',exact:true})).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText('LOT-L07');await page.keyboard.press('Escape');
 await current.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('JOB-2609-01');
 await current.getByRole('button',{name:'예약·해제 입력 열기',exact:true}).click();await expect(page).toHaveURL(/#UI07$/);await expect(page.locator('.ai-context code')).toHaveText('JOB-2609-01');await page.goto('/#MATERIAL');await expect(lots).toBeVisible();
 await expect(current.getByRole('checkbox')).toBeChecked();const history=table(page,'inventory-history');await history.locator('tbody tr').first().focus();await page.keyboard.press('Enter');await expect(history.locator('.list-context-bar')).toContainText('객체 연결 미확인');await expect(page.locator('.ai-context code')).toHaveText('JOB-2609-01');
 await page.reload();await expect(lots).toBeVisible();await expect(current.getByRole('checkbox')).toBeChecked();expect(await state(page)).toEqual(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('수급 현황: 라이트·다크·390px 캡처와 표의 기준 열 접근',async({page})=>{
 const overview=page.locator('[data-supply-overview]'),grid=table(page,'supply-demand');
 const noOverflow=async()=>expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
 await page.setViewportSize({width:1600,height:1000});await page.reload();await expect(overview).toBeVisible();await expect(overview.locator('[data-media-state="loading"]')).toHaveCount(0);await noOverflow();
 expect(await grid.locator('.table-scroll').evaluate(element=>element.scrollWidth-element.clientWidth)).toBeLessThanOrEqual(1);
 await expect(page.locator('.context-rail')).toBeInViewport();await page.locator('main h1').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'output/playwright/supply-overview-light-v2.6.png',fullPage:false});
 await grid.locator('tbody [data-column-id="basis"]').scrollIntoViewIfNeeded();await expect(grid.locator('tbody [data-column-id="basis"]')).toBeInViewport();await expect(grid.locator('tbody [data-column-id="basis"]')).toContainText('SYN-STOCK-01');
 await page.getByRole('button',{name:'다크 테마',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.locator('main h1').click();await page.evaluate(()=>scrollTo(0,0));await grid.locator('.table-scroll').evaluate(element=>element.scrollLeft=0);await expect(page.locator('.context-rail')).toBeInViewport();await page.screenshot({path:'output/playwright/supply-overview-dark-v2.6.png',fullPage:false});await noOverflow();
 await page.getByRole('button',{name:'라이트 테마',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.reload();await expect(overview).toBeVisible();await expect(page.locator('.context-rail')).toHaveCount(0);await noOverflow();await expect(overview.locator('[data-media-state="loading"]')).toHaveCount(0);await page.screenshot({path:'output/playwright/supply-overview-mobile-v2.6.png',fullPage:true});
 await grid.locator('tbody [data-column-id="basis"]').scrollIntoViewIfNeeded();await expect(grid.locator('tbody [data-column-id="basis"]')).toBeInViewport();await noOverflow();
});
