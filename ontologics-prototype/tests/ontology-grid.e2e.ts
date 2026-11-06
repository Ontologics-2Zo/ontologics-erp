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
