import {test,expect} from '@playwright/test';
import {initial} from '../src/domain';
import {workflowFixture} from './workflow-fixture';
import {BOM_PURCHASE_DEMO,LEGACY_PURCHASE_PART} from '../src/demo-bom-links';

test('v1.7 구매: EVB 원문 매핑·사진·AI와 구형 문서 범위를 분리한다',async({page})=>{
 const state=initial();const legacy={type:'purchase-request',id:'PR-LEGACY',part:LEGACY_PURCHASE_PART,qty:13,needBy:'2026-09-25',evidence:'LEGACY-KEEP',author:'Alice',version:1};
 state.docs.push({name:'기존 요청',body:JSON.stringify(legacy),status:'초안'});
 await page.goto('/');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('ontologics-v1',JSON.stringify(s))},state);await page.goto('/#PURCHASE');await page.reload();
 const scope=page.getByLabel('구매 시연 범위',{exact:true});await expect(scope).toHaveValue(BOM_PURCHASE_DEMO.partId);
 await expect(page.locator('[data-workflow-grid="purchase-requests"] tbody tr')).toHaveCount(0);
 await expect(page.locator('main')).toContainText('원본 단위·실장은 미검수');
 await page.getByRole('button',{name:'구매 요청 초안',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'초안 저장',exact:true}).click();
 const requests=page.locator('[data-workflow-grid="purchase-requests"]');await expect(requests.locator('tbody tr')).toHaveCount(1);
 await requests.locator('tbody input[type=checkbox]').check();await expect(page.locator('.ai-context code')).toHaveText(BOM_PURCHASE_DEMO.partId);
 await requests.locator('[data-column-id="photo"] button').click();await expect(page.getByRole('dialog',{name:'사진·출처'})).toContainText('AI 생성');await page.keyboard.press('Escape');await expect(page.locator('.ai-context code')).toHaveText(BOM_PURCHASE_DEMO.partId);
 await page.getByRole('tab',{name:/견적 비교/}).click();await expect(page.locator('article[data-row-id="QUOTE-EVB-C-A-v1"]')).toBeVisible();
 await scope.selectOption(LEGACY_PURCHASE_PART);await expect(page.locator('article[data-row-id="QUOTE-A-v1"]')).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText(LEGACY_PURCHASE_PART);
 await page.getByRole('tab',{name:/구매 요청/}).click();await expect(requests).toContainText('PR-LEGACY');await expect(requests.locator('[data-column-id="quantity"] strong')).toContainText('13');
 await scope.selectOption(BOM_PURCHASE_DEMO.partId);await expect(requests).not.toContainText('PR-LEGACY');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('ontologics-v1')!));const documents=stored.docs.map((d:{body:string})=>JSON.parse(d.body));
 expect(documents.find((d:{id:string})=>d.id==='PR-LEGACY')).toEqual(legacy);
 expect(documents.find((d:{part:string})=>d.part===BOM_PURCHASE_DEMO.partId)).toMatchObject({qty:80,configurationId:'CFG-EVB-C',sourcePartId:'PART-EVB-C-21',sourceEvidence:'SRC-EVB-C-csv'});
 expect(stored.version).toBe(1);expect(stored.reserved).toBe(0);expect(stored.drafts).toEqual([]);
 await page.getByRole('tab',{name:/견적 비교/}).click();await page.locator('.toast').waitFor({state:'hidden'});if(!await page.locator('.ai-context').isVisible())await page.getByRole('button',{name:'AI 패널 열기',exact:true}).click();await page.screenshot({path:'output/playwright/v17-purchase-source-scope.png',fullPage:true});
});


test('v1.7 계획: 공통 자재 계산과 합격분 할당·후보 미확인을 화면 간 동일하게 표시한다',async({page})=>{
 const state=await workflowFixture();await page.goto('/');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('ontologics-v1',JSON.stringify(s))},state);await page.goto('/#UI07');await page.reload();
 await page.getByRole('button',{name:'2 자재 소요',exact:true}).click();const grid=page.locator('[data-workflow-grid="planning-materials"]'),row=grid.locator('tr[data-row-id="PLAN-MATERIAL-M"]');
 await expect(row).toContainText('TPS2375D');await expect(row.locator('[data-column-id="available"]')).toHaveText('80');await expect(row.locator('[data-column-id="allocated"]')).toHaveText('30');await expect(row.locator('[data-column-id="short"]')).toHaveText('0');
 const candidate=grid.locator('tr[data-row-id="PLAN-MATERIAL-CANDIDATE"]');await expect(candidate.locator('[data-column-id="stock"]')).toHaveText('미확인');await expect(candidate.locator('[data-column-id="available"]')).toHaveText('미확인');
 await page.screenshot({path:'output/playwright/v17-planning-material-consistency.png',fullPage:true});await row.getByRole('button',{name:'대표 품목·대체 검토',exact:true}).click();
 await expect(page.locator('[data-workflow-grid="supply-demand"] [data-column-id="shortage"] strong')).toContainText('0');await expect(page.locator('.ai-context code')).toHaveText('PART-TPS');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ontologics-v1')!))).toEqual(state);
});
