import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
const catalog:Array<{id:string;sha256:string}>=JSON.parse(readFileSync(new URL('../src/catalog.json',import.meta.url),'utf8')); 
const table=(page:Page,key:string)=>page.locator(`[data-workflow-grid="${key}"]`);
const state=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('ontologics-v1')!));
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await page.goto('/#UI02')});

test('제품 원본 목록: 개정 객체·사진 분리, 근거ID 보존과 보기 상태 복원은 접수가 아님',async({page})=>{
 const grid=table(page,'product-sources'),before=await state(page),initial=await page.locator('.ai-context code').textContent();
 await expect(grid.locator('tbody tr')).toHaveCount(4);
 const pdf=grid.locator('tr[data-row-id="SRC-L-pdf"]');await expect(pdf.locator('[data-column-id="basis"]')).toContainText('SRC-L-pdf');await expect(pdf.locator('[data-column-id="basis"]')).not.toContainText('로컬 합성');
 await pdf.locator('[data-column-id="photo"] button').click();await expect(page.getByRole('dialog',{name:'사진·출처',exact:true})).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText(initial!);await page.keyboard.press('Escape');
 await pdf.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('CFG-POE-L');
 await pdf.locator('[data-column-id="object"] button.entity-chip').click();await expect(page.locator('.inspector-header code')).toHaveText('CFG-POE-L');await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await pdf.getByRole('button',{name:'원본 근거 확인',exact:true}).click();await expect(page.getByRole('dialog')).toContainText(catalog.find(c=>c.id==='SRC-L-pdf')!.sha256);await page.keyboard.press('Escape');
 await grid.getByRole('searchbox').fill('SRC-L-pdf');await grid.getByRole('button',{name:'열 선택',exact:true}).click();await grid.locator('.column-picker').getByLabel('미확인 · 검토').uncheck();await grid.getByRole('columnheader',{name:'원본 파일 · ID',exact:true}).getByRole('button').click();
 await page.reload();await expect(grid.getByRole('searchbox')).toHaveValue('SRC-L-pdf');await expect(pdf.getByRole('checkbox')).toBeChecked();await expect(grid.locator('thead [data-column-id="unknown"]')).toHaveCount(0);await expect(page.locator('.ai-context code')).toHaveText('CFG-POE-L');
 expect(await page.evaluate(()=>localStorage.getItem('onto-form-A-Alice-upload'))).toBeNull();expect(await state(page)).toEqual(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('BOM 원본행: 개정별 ID·74행·미확인 유지, 사진/선택과 정확한 기존 등록payload',async({page})=>{
 await page.getByRole('button',{name:'포함된 L1 원본으로 시작',exact:true}).click();const l1=table(page,'product-bom-L1');
 await expect(l1.locator('.table-pagination')).toContainText('로드 74건');await l1.getByRole('searchbox').fill('TPS2375D');const tps=l1.locator('tr[data-row-id="BOM-POE-L1-56"]');await expect(tps).toBeVisible();
 const before=await state(page),initial=await page.locator('.ai-context code').textContent();await tps.locator('[data-column-id="photo"] button').click();await expect(page.getByRole('dialog',{name:'사진·출처',exact:true})).toContainText('외형 이해용 참고 이미지이며 실제 제품·배치와 다를 수 있습니다.');await expect(page.locator('.ai-context code')).toHaveText(initial!);await page.keyboard.press('Escape');
 await tps.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('PART-POE-L1-56');await tps.locator('[data-column-id="object"] button.entity-chip').click();await expect(page.locator('.inspector-header code')).toHaveText('PART-POE-L1-56');await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await l1.getByRole('searchbox').fill('NA(130k');await expect(l1.locator('tr[data-row-id="BOM-POE-L1-69"] [data-column-id="mount"]')).toContainText('미확인');await expect(l1.locator('tr[data-row-id="BOM-POE-L1-69"] [data-column-id="quantity"]')).toContainText('1 EA');
 await l1.getByRole('searchbox').fill('');await l1.getByRole('columnheader',{name:'원본 행',exact:true}).getByRole('button').click();await expect(l1.getByRole('columnheader',{name:'원본 행',exact:true})).toHaveAttribute('aria-sort','descending');await l1.getByRole('combobox',{name:'페이지당 행',exact:true}).selectOption('30');await l1.getByRole('button',{name:'다음',exact:true}).click();
 await expect(l1.locator('.table-pagination')).toContainText('2 / 3');await expect(tps).toHaveCount(0);await page.getByRole('button',{name:'L 구성',exact:true}).click();const l=table(page,'product-bom-L');await expect(l.locator('.table-pagination')).toContainText('로드 74건');await l.getByRole('searchbox').fill('TPS2376D');await expect(l.locator('tr[data-row-id="BOM-POE-L-57"]')).toBeVisible();await page.getByRole('button',{name:'L1 구성',exact:true}).click();await expect(l1.getByRole('combobox',{name:'페이지당 행',exact:true})).toHaveValue('30');await expect(l1.locator('.table-pagination')).toContainText('2 / 3');
 await page.reload();await expect(l1.locator('.table-pagination')).toContainText('2 / 3');await l1.getByRole('button',{name:'이전',exact:true}).click();await expect(tps.getByRole('checkbox')).toBeChecked();await expect(page.locator('.ai-context code')).toHaveText('PART-POE-L1-56');expect(await state(page)).toEqual(before);
 await page.getByRole('button',{name:'4 초안 · 검토 요청',exact:true}).click();await expect(table(page,'product-registration')).toContainText('현재 등록 입력의 요약');await expect(table(page,'product-registration')).toContainText('NA / NS / Opened 보존');
 await page.getByRole('checkbox',{name:/시트명 불일치와/}).check();await page.getByRole('button',{name:'등록 초안 저장',exact:true}).click();await expect.poll(async()=>(await state(page)).drafts.length).toBe(1);
 const after=await state(page);expect(after.bomApplied).toBe(false);expect(after.drafts[0].payload).toEqual({kind:'bom',mapping:'WROOM',reviewed:true,evidence:'SRC-L1-ods · SRC-L1-pdf',sourceHash:catalog.find(c=>c.id==='SRC-L1-ods')!.sha256,unknown:'NA / NS / Opened 보존'});expect(after.drafts[0].status).toBe('초안');
});
