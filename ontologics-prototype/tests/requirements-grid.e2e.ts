import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
const requirements=JSON.parse(readFileSync(new URL('../src/requirements.json',import.meta.url),'utf8')) as {id:string;title:string;flow:string;accept:string;implementation:string;test:string;status:string}[];
const grid=(page:Page,key:string)=>page.locator(`[data-workflow-grid="${key}"]`);
const ledger=(page:Page)=>page.evaluate(()=>localStorage.getItem('ontologics-v1'));
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.goto('/#TRACE');await page.reload()});

test('요구 목록:45개 ID·원문·구현 상태 보존, 메타데이터 선택과 업무 AI 분리',async({page})=>{
 const table=grid(page,'requirements-definitions');const before=await ledger(page),prior=await page.locator('.ai-context code').textContent();
 await table.getByRole('combobox',{name:'페이지당 행'}).selectOption('45');
 expect((await table.locator('tbody tr').evaluateAll(rows=>rows.map(r=>r.getAttribute('data-row-id')))).sort()).toEqual(requirements.map(r=>r.id).sort());
 await expect(table.locator('.entity-chip,.media-trigger')).toHaveCount(0);
 const requirement=requirements.find(r=>r.id==='REG-02')!,row=table.locator('tr[data-row-id="REG-02"]');
 await row.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText(prior!);await expect(table.locator('.list-context-bar')).toContainText('업무 객체·AI 대상 유지');
 await row.getByRole('button',{name:'요구 원문·수용 기준',exact:true}).click();const modal=page.getByRole('dialog',{name:'요구 원문·수용 기준',exact:true});
 for(const text of [requirement.flow,requirement.accept,requirement.implementation])await expect(modal).toContainText(text);
 await page.keyboard.press('Escape');
 await page.getByLabel('요구 구현 상태',{exact:true}).selectOption('부분');await table.getByRole('searchbox').fill('REG-02');
 await table.getByRole('columnheader',{name:'요구 ID · 기능',exact:true}).getByRole('button').click();
 await table.getByRole('button',{name:'열 선택',exact:true}).click();await table.locator('.column-picker').getByRole('checkbox',{name:'액션·상태와 구현 범위',exact:true}).uncheck();
 await row.getByRole('button',{name:'UI02 · 제품·BOM 등록',exact:true}).click();await expect(page.getByRole('heading',{name:'제품 구성·BOM',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'요구사항·구현 상태',exact:true}).click();await page.reload();
 await expect(page.getByLabel('요구 구현 상태',{exact:true})).toHaveValue('부분');await expect(table.getByRole('searchbox')).toHaveValue('REG-02');await expect(table.getByRole('combobox',{name:'페이지당 행'})).toHaveValue('45');await expect(row.getByRole('checkbox')).toBeChecked();await expect(table.locator('th[data-column-id="implementation"]')).toHaveCount(0);await expect(row.locator('[data-column-id="status"]')).toContainText(requirement.status);
 await row.focus();await page.keyboard.press('Enter');await expect(page.locator('.ai-context code')).toHaveText(prior!);expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('결정·수용·연동 목록: 정의와 시험 결과 구별, 모든 경계 및 계정별 보기 유지',async({page})=>{
 const before=await ledger(page),prior=await page.locator('.ai-context code').textContent();
 await page.getByRole('button',{name:'D01~D07 구현 경계',exact:true}).click();const decisions=grid(page,'requirements-decisions');await decisions.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');expect(await decisions.locator('tbody tr').evaluateAll(rows=>rows.map(r=>r.getAttribute('data-row-id')))).toEqual(['D01','D02','D03','D04','D05','D06','D07']);await expect(decisions).toContainText('인증·권한·보관·성능·복구·한도 미검증');await decisions.locator('tr[data-row-id="D07"]').getByRole('checkbox').check();
 await page.getByRole('button',{name:'수용 시나리오',exact:true}).click();const acceptance=grid(page,'requirements-acceptance');await acceptance.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');expect(await acceptance.locator('tbody tr').evaluateAll(rows=>rows.map(r=>r.getAttribute('data-row-id')))).toEqual(['AT01','AT02','AT03','AT04','AT05','AT06','AT07','AT08']);
 await expect(acceptance.locator('tr[data-row-id="AT08"]')).toContainText('실제 RDF/Neo4j 비교 미구현');const at05=acceptance.locator('tr[data-row-id="AT05"]');await expect(at05).toContainText('40/10/15/20/15/80 보존');await at05.getByRole('button',{name:'수용 정의 전체 보기',exact:true}).click();await expect(page.getByRole('dialog',{name:'수용 시나리오 정의',exact:true})).toContainText('실행 결과가 아닙니다.');await page.keyboard.press('Escape');await at05.getByRole('checkbox').check();
 await page.getByRole('button',{name:'연동 범위',exact:true}).click();const integration=grid(page,'requirements-integration');await integration.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');await expect(integration.locator('tbody tr')).toHaveCount(6);await expect(integration).toContainText('다중 사용자·다중 탭 동시성');await expect(integration).toContainText('실제 사용자·권한 체계 아님');await integration.getByRole('searchbox').fill('없는 범위');await expect(integration).toContainText('조건에 맞는 결과가 없습니다.');await page.reload();await expect(integration.getByRole('searchbox')).toHaveValue('없는 범위');
 await page.getByRole('button',{name:'수용 시나리오',exact:true}).click();await expect(at05.getByRole('checkbox')).toBeChecked();await expect(page.locator('.ai-context code')).toHaveText(prior!);expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
 await page.getByLabel('시연 신원',{exact:true}).selectOption('Bob');await page.getByRole('dialog',{name:'개발 계정 전환'}).getByRole('button',{name:'계정 전환',exact:true}).click();await page.getByRole('button',{name:'요구사항·구현 상태',exact:true}).click();await expect(grid(page,'requirements-definitions')).toBeVisible();
 await page.getByLabel('시연 신원',{exact:true}).selectOption('OtherCompany');await page.getByRole('dialog',{name:'개발 계정 전환'}).getByRole('button',{name:'계정 전환',exact:true}).click();await page.getByRole('button',{name:'요구사항·구현 상태',exact:true}).click();await expect(page.getByRole('heading',{name:'회사 B의 업무 공간',exact:true})).toBeVisible();await expect(page.locator('[data-workflow-grid]')).toHaveCount(0);
});
