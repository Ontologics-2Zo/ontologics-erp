import {test,expect,type Page} from '@playwright/test';
const grid=(page:Page,key:string)=>page.locator(`[data-workflow-grid="${key}"]`);
const ledger=(page:Page)=>page.evaluate(()=>localStorage.getItem('ontologics-v1'));
const tab=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.goto('/#UI09');await page.reload()});

async function register(page:Page,board:string){
 await page.getByLabel('등록된 보드 식별자',{exact:true}).fill(board);
 await page.getByRole('textbox',{name:'고객 신고 원문',exact:true}).fill(`${board} 동작 불안정 신고 · 원인 미확인`);
 await tab(page,'신고 확인·접수').click();await expect(grid(page,'quality-claims').locator('tbody tr')).toHaveCount(1);
}
async function request(page:Page,board:string){
 await tab(page,'요청서·시험 의뢰').click();await page.getByRole('textbox',{name:'요청 대상·사유·근거',exact:true}).fill(`${board} · C-001 이력·시험 의뢰 검토 / DEMO-CLAIM-01 / 외부 송신 아님`);
 await tab(page,'시험 의뢰 초안 저장').click();await expect(grid(page,'quality-requests').locator('tbody tr')).toHaveCount(1);
}

test('품질 목록: 접수 대상은 입력 수정과 분리, 시험 예시의 대상 불일치 차단',async({page})=>{
 await page.getByLabel('등록된 보드 식별자',{exact:true}).fill('PART-TPS');const wrongKind=grid(page,'quality-impact').locator('tr[data-row-id="quality-target-PART-TPS"]');await expect(wrongKind).toContainText('등록 대상 확인 필요');await expect(wrongKind.locator('[data-column-id="quantity"] strong')).toContainText('미확인');await expect(wrongKind.locator('.media-trigger')).toHaveCount(0);
 await register(page,'U106');await request(page,'U106');
 const before=await ledger(page);await tab(page,'신고·영향 조사').click();await page.getByLabel('등록된 보드 식별자',{exact:true}).fill('U104');
 const claims=grid(page,'quality-claims');await expect(claims.locator('tbody [data-column-id="object"]')).toContainText('U106');await expect(claims.locator('tbody [data-column-id="object"]')).not.toContainText('U104');
 await expect(page.getByText('현재 입력 대상 U104와 접수 기록 대상 U106이 다릅니다.',{exact:false})).toBeVisible();
 await tab(page,'결과·재생산 검토').click();await expect(tab(page,'가상 시험팀 결과 예시 연결')).toBeDisabled();
 await expect(page.getByText('접수 대상 U106와 현재 입력 U104의 일치 확인이 필요합니다.',{exact:false})).toBeVisible();
 await expect(grid(page,'quality-results').locator('tbody tr')).toHaveCount(0);expect(await ledger(page)).toBe(before);
 const state=JSON.parse((await ledger(page))!);expect(state.claimRecord.board).toBe('U106');expect(state.testLinked).toBe(false);
 await claims.locator('tbody input[type=checkbox]').check();await expect(page.locator('.ai-context code')).toHaveText('U106');await expect(page.locator('.message')).toHaveCount(0);
});

test('품질 표: 사진·객체·AI 선택, 미검사와 독립 재생산 수량·보기 상태 보존',async({page})=>{
 await register(page,'U104');await request(page,'U104');await tab(page,'결과·재생산 검토').click();await tab(page,'가상 시험팀 결과 예시 연결').click();
 const results=grid(page,'quality-results');await expect(results.locator('tbody tr')).toHaveCount(2);const before=await ledger(page);
 const untested=results.locator('tr[data-row-id="U106"]'),tested=results.locator('tr[data-row-id="U104"]');
 await expect(untested).toContainText('미검사 · 의뢰 범위 밖');await expect(untested).toContainText('정상/수요 0 판정 불가');await untested.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('U106');
 const photo=tested.locator('[data-column-id="photo"] button');await photo.click();await expect(page.getByRole('dialog',{name:'사진·출처'})).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText('U106');await page.keyboard.press('Escape');await expect(photo).toBeFocused();
 await tested.getByRole('button',{name:'U104 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('U104');await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await results.getByRole('columnheader',{name:'제공 결과 / 미결',exact:true}).getByRole('button').click();await results.getByRole('button',{name:'열 선택',exact:true}).click();await results.locator('.column-picker').getByRole('checkbox',{name:'미확인',exact:true}).uncheck();
 await results.getByRole('searchbox').fill('U106');await page.reload();await expect(results.getByRole('searchbox')).toHaveValue('U106');await expect(untested.getByRole('checkbox')).toBeChecked();await expect(results.locator('th[data-column-id="unknowns"]')).toHaveCount(0);await expect(results.locator('th[data-column-id="result"]')).toHaveAttribute('aria-sort','ascending');
 const repro=grid(page,'quality-reproduction'),x=repro.locator('tr[data-row-id="X (가상 구성)"]'),y=repro.locator('tr[data-row-id="Y (가상 구성)"]');
 await expect(x.locator('[data-column-id="result"]')).toHaveText('8');await expect(y.locator('[data-column-id="result"]')).toHaveText('0');await expect(y).toContainText('X에 상계 금지');await expect(repro.locator('.media-trigger')).toHaveCount(0);
 const context=await page.locator('.ai-context code').textContent();await x.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText(context!);await expect(repro).toContainText('선택 행의 객체 연결 미확인 · 현재 AI 대상 유지');
 expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
 await tab(page,'요청서·시험 의뢰').click();const docs=grid(page,'quality-requests');await docs.getByRole('button',{name:'저장 원문 보기',exact:true}).click();await expect(page.getByRole('dialog',{name:'요청·시험 의뢰 저장 원문'})).toContainText('외부 송신 아님');await page.keyboard.press('Escape');expect(await ledger(page)).toBe(before);
});
