import {test,expect,type Page} from '@playwright/test';
import {initial,makeDraft,approve,apply,investigation,defaultConditions} from '../src/domain';
const resultGrid=(page:Page)=>page.locator('[data-workflow-grid="trace-results"]');
const ledger=(page:Page)=>page.evaluate(()=>localStorage.getItem('ontologics-v1'));
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await page.goto('/#UI04')});

test('장착 조사 표: 사진·객체·저장 조회조건과 현재 입력·AI 분리 및 보기 복원',async({page})=>{
 await page.getByRole('button',{name:'장착 이력 조회',exact:true}).click();const table=resultGrid(page),row=table.locator('tr[data-row-id="U104"]');
 await expect(table.locator('tbody tr')).toHaveCount(3);const before=await ledger(page);const object=await page.locator('.ai-context code').textContent();
 const photo=row.locator('[data-column-id="photo"] button');await photo.click();await expect(page.getByRole('dialog',{name:'사진·출처',exact:true})).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText(object!);await page.keyboard.press('Escape');await expect(photo).toBeFocused();
 await row.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('U104');
 await page.getByRole('button',{name:'기간 B',exact:true}).click();await expect(page.getByLabel('기간 시작 · 포함')).toHaveValue(defaultConditions.start);
 await row.focus();await page.keyboard.press('Space');await expect(page.getByLabel('기간 시작 · 포함')).toBeVisible();await expect(page.locator('.ai-context')).toContainText(defaultConditions.start+' ~ '+defaultConditions.end);
 await page.getByRole('button',{name:'보완 전후 결과 비교',exact:true}).click();await expect(page.locator('.error-float')).toContainText('조회 조건이 바뀌어');
 await row.getByRole('button',{name:'이 조회 조건 적용',exact:true}).click();await expect(page.getByLabel('기준 시점 A · 시간대 필수')).toHaveValue(defaultConditions.at);await expect(page.locator('.ai-context code')).toHaveText('U104');
 await table.getByRole('columnheader',{name:'보드 · 로트',exact:true}).getByRole('button').click();
 await table.getByRole('button',{name:'열 선택',exact:true}).click();await table.locator('.column-picker').getByRole('checkbox',{name:'확인 범위 / 미확인',exact:true}).uncheck();
 await table.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');await table.getByRole('searchbox').fill('U104');await page.reload();
 await expect(table.getByRole('searchbox')).toHaveValue('U104');await expect(table.getByRole('combobox',{name:'페이지당 행'})).toHaveValue('15');await expect(row.getByRole('checkbox')).toBeChecked();await expect(table.locator('th[data-column-id="scope"]')).toHaveCount(0);await expect(table.locator('th[data-column-id="object"]')).toHaveAttribute('aria-sort','ascending');
 await expect(page.locator('.ai-context code')).toHaveText('U104');await row.getByRole('button',{name:'U104 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('U104');
 await expect(page.locator('[data-workflow-grid="trace-evidence"] tr[data-row-id="r9"]')).toContainText('장착 시각 원문 미등록');expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('장착 조사 스냅샷·현재 비교와 원문 사건/관계·미등록 연결 구분',async({page})=>{
 const original=initial();original.boardIds.push('U999');const snapshot={rows:investigation(original,defaultConditions),conditions:defaultConditions,version:original.version};
 const draft=await makeDraft(original,{kind:'trace',removed:'2026-09-12T09:00:00+09:00',coverage:true,evidence:'DEMO-TRACE-02'},'Alice','U104 보완','UI04');const approved=await approve(original,{...draft,status:'검토 요청'},'Bob');const current=await apply({...original,drafts:[approved]},approved);
 await page.evaluate(({state,result})=>{localStorage.clear();localStorage.setItem('ontologics-v1',JSON.stringify(state));localStorage.setItem('onto-form-A-Alice-traceResult',JSON.stringify(result))},{state:current,result:snapshot});await page.reload();const before=await ledger(page);
 await expect(page.getByText(/조회 v1과 현재 데이터 v2의 기준이 다릅니다/)).toBeVisible();await page.getByRole('button',{name:'보완 전후 결과 비교',exact:true}).click();
 const row=resultGrid(page).locator('tr[data-row-id="U104"]');await expect(row.locator('[data-column-id="result"]')).toContainText('추가 이력 확인 필요');await expect(row.locator('[data-column-id="after"]')).toContainText('조건상 제외');await expect(row.locator('[data-column-id="evidence"]')).toContainText('현재 DEMO-TRACE-02');
 const source=page.locator('[data-workflow-grid="trace-evidence"] tr[data-row-id="MOUNT-104"]');await expect(source.locator('[data-column-id="removed"]')).toContainText('미기록');
 await expect(source.getByRole('button',{name:'U104 / U2 장착 객체 선택',exact:true})).toBeVisible();
 const missing=resultGrid(page).locator('tr[data-row-id="U999"]');await expect(missing).toContainText('이 보드의 L07 관계 미확인');await expect(missing.getByRole('button',{name:'L07 · TPS2375D 객체 선택',exact:true})).toHaveCount(0);
 const unresolved=page.locator('[data-workflow-grid="trace-evidence"] tr[data-row-id="unlinked:U999"]');await expect(unresolved).toContainText('원문 객체 미등록');await expect(unresolved).toContainText('장착 시각 원문 미등록');expect(await ledger(page)).toBe(before);
});
