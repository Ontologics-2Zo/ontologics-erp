import {test,expect,type Page} from '@playwright/test';
import {workflowFixture} from './workflow-fixture';

const grid=(page:Page,key:string)=>page.locator(`[data-workflow-grid="${key}"]`);
const ledger=(page:Page)=>page.evaluate(()=>localStorage.getItem('ontologics-v1'));
test.beforeEach(async({page})=>{const state=await workflowFixture();await page.goto('/');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('ontologics-v1',JSON.stringify(s))},state);await page.reload()});

test('구매 표: 요청·발주·공급 수량 분리, 사진·객체·필터·선택 복원',async({page})=>{
 await page.goto('/#PURCHASE');const before=await ledger(page);const requests=grid(page,'purchase-requests');
 await expect(requests.locator('tbody tr')).toHaveCount(1);
 await expect(requests.locator('tbody [data-column-id="quantity"] strong')).toContainText('80');
 await expect(requests.locator('tbody [data-column-id="quantity"]')).toContainText('원수요 요청 · 발주량 아님');
 const original=await page.locator('.ai-context code').textContent();
 await requests.locator('[data-column-id="photo"] button').click();await expect(page.getByRole('dialog',{name:'사진·출처'})).toBeVisible();
 await expect(page.getByRole('dialog')).toContainText('외형 이해용 참고 이미지이며 실제 제품·배치와 다를 수 있습니다.');
 await expect(page.locator('.ai-context code')).toHaveText(original!);await page.keyboard.press('Escape');
 await requests.locator('tbody input[type=checkbox]').check();await expect(page.locator('.ai-context code')).toHaveText('IM-0008');
 await requests.getByRole('columnheader',{name:'필요일',exact:true}).getByRole('button').click();
 await requests.getByRole('button',{name:'열 선택',exact:true}).click();await requests.locator('.column-picker').getByRole('checkbox',{name:'작성자',exact:true}).uncheck();
 await requests.getByRole('searchbox').fill('일치없음');await expect(requests.locator('tbody tr')).toHaveCount(0);await expect(requests.locator('.table-pagination')).toContainText('전체 1건 선택 · 조건 내 0건');
 await requests.getByRole('searchbox').fill('PR-GRID');await page.reload();
 await expect(requests.getByRole('searchbox')).toHaveValue('PR-GRID');await expect(requests.locator('tbody input[type=checkbox]')).toBeChecked();
 await expect(requests.locator('th[data-column-id="needDate"]')).toHaveAttribute('aria-sort','ascending');await expect(requests.locator('th[data-column-id="owner"]')).toHaveCount(0);
 await expect(page.locator('.ai-context code')).toHaveText('IM-0008');
 await page.getByRole('tab',{name:/내부 발주 · 공급 확인/}).click();const orders=grid(page,'purchase-orders');
 for(const [column,value] of [['quantity','100'],['confirmed','40'],['remaining','60']])await expect(orders.locator(`tbody [data-column-id="${column}"] strong`)).toContainText(value);
 await expect(grid(page,'purchase-supplies')).toContainText('입고·사용 가용량 아님');
 await page.reload();await expect(orders).toBeVisible();
 await page.goto('/#UI08');await grid(page,'production-work').locator('tbody input[type=checkbox]').check();await expect(page.locator('.ai-context code')).toHaveText('JOB-2609-01');
 await page.goto('/#PURCHASE');await orders.getByRole('button',{name:'공급 확인 초안',exact:true}).click();await expect(page.getByRole('dialog',{name:'공급 확인 사실 초안'})).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText('IM-0008');await page.keyboard.press('Escape');
 expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('생산·납품 표: 누계와 사건 수량, 명시 구성 사진, 회차 선택과 입력 연결',async({page})=>{
 const before=await ledger(page);await page.goto('/#UI08');const production=grid(page,'production-work');
 for(const [column,value] of [['good','60'],['defects','2'],['pending','2'],['stock','50']])await expect(production.locator(`tbody [data-column-id="${column}"] strong`)).toContainText(value);
 await expect(production).toContainText('설계 참고 · 생산 보드 사진 아님');
 const original=await page.locator('.ai-context code').textContent();await production.locator('[data-column-id="photo"] button').click();await expect(page.getByRole('dialog',{name:'사진·출처'})).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText(original!);await page.keyboard.press('Escape');
 const round=grid(page,'delivery-rounds');await expect(round.locator('.media-trigger')).toHaveCount(0);
 for(const [column,value] of [['allocated','50'],['available','15'],['shipped','35'],['arrived','32'],['transit','3'],['promiseRemaining','68']])await expect(round.locator(`tbody [data-column-id="${column}"] strong`)).toContainText(value);
 await expect(round).toContainText('회차 객체 09.30과 불일치');
 const shipments=grid(page,'delivery-shipments'),ship=shipments.locator('tr[data-row-id="SHP-02"]');
 await ship.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('ROUND-01');
 await shipments.getByRole('columnheader',{name:'이번 출하',exact:true}).getByRole('button').click();
 await shipments.getByRole('columnheader',{name:'이번 출하',exact:true}).getByRole('button').click();
 await expect(shipments.locator('tbody tr').first()).toHaveAttribute('data-row-id','SHP-02');
 await expect(ship.getByRole('checkbox')).toBeChecked();await expect(ship.locator('[data-column-id="remainingQty"] strong')).toContainText('3');
 await ship.getByRole('button',{name:'이 출하 도착 입력',exact:true}).click();await expect(page.getByLabel('도착한 출하')).toHaveValue('SHP-02');
 await expect(page.locator('.ai-context code')).toHaveText('ROUND-01');
 await page.reload();await expect(ship.getByRole('checkbox')).toBeChecked();await expect(shipments.locator('th[data-column-id="qty"]')).toHaveAttribute('aria-sort','ascending');
 await expect(grid(page,'delivery-arrivals').locator('tbody tr')).toHaveCount(2);
 await page.goto('/#UI07');await page.getByRole('button',{name:'4 입고·할당',exact:true}).click();
 const receipt=grid(page,'planning-receipts');for(const [column,value] of [['total','50'],['pass','40'],['fail','5'],['pending','5']])await expect(receipt.locator(`tbody [data-column-id="${column}"] strong`)).toContainText(value);
 await expect(receipt).toContainText('입고 품목·로트 ID 연결 미확인');
 expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});
