import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {workflowFixture} from './workflow-fixture';
const grid=(page:Page,key:string)=>page.locator(`[data-workflow-grid="${key}"]`);
const ledger=(page:Page)=>page.evaluate(()=>localStorage.getItem('ontologics-v1'));
test.beforeEach(async({page})=>{const state=await workflowFixture();await page.goto('/');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('ontologics-v1',JSON.stringify(s))},state);await page.goto('/#OPS');await page.reload()});

test('운영 감사 표: 중복 원문·내보내기 보존, 객체 추정 없는 보기 복원',async({page})=>{
 const detail='U104 PART-TPS 이름만 포함한 원문\n관계·수량·승인 버전이 구조화되지 않음',event={time:'2026-09-20T03:00:00.000Z',action:'동일 원문 검토',detail};
 await page.evaluate(event=>{const s=JSON.parse(localStorage.getItem('ontologics-v1')!);s.events=[event,event,...s.events];localStorage.setItem('ontologics-v1',JSON.stringify(s))},event);await page.reload();
 const table=grid(page,'operations-audit'),before=await ledger(page),prior=await page.locator('.ai-context code').textContent();
 await page.getByRole('searchbox',{name:'감사 사건 검색',exact:true}).fill('동일 원문');await expect(table.locator('tbody tr')).toHaveCount(2);
 const ids=await table.locator('tbody tr').evaluateAll(rows=>rows.map(r=>r.getAttribute('data-row-id')));expect(new Set(ids).size).toBe(2);
 const row=table.locator('tbody tr').nth(1),id=await row.getAttribute('data-row-id');await row.getByRole('checkbox').check();
 await expect(table.locator('.entity-chip')).toHaveCount(0);await expect(table.locator('.media-trigger')).toHaveCount(0);await expect(page.locator('.ai-context code')).toHaveText(prior!);
 await row.getByRole('button',{name:'감사 원문 확인',exact:true}).click();const modal=page.getByRole('dialog',{name:'감사 원문',exact:true});await expect(modal).toContainText(event.time);await expect(modal).toContainText(detail);await page.keyboard.press('Escape');
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'내보내기',exact:true}).click();const file=await downloaded;const exported=JSON.parse(await readFile((await file.path())!,'utf8'));expect(exported).toEqual({company:'A',origin:'local-simulation',events:[event,event]});
 await table.getByRole('columnheader',{name:'행동',exact:true}).getByRole('button').click();await table.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');await table.getByRole('button',{name:'열 선택',exact:true}).click();await table.locator('.column-picker').getByRole('checkbox',{name:'회사 / 객체 연결',exact:true}).uncheck();
 await page.getByRole('searchbox',{name:'감사 사건 검색',exact:true}).fill('검색 결과 없음');await expect(table.locator('tbody tr')).toHaveCount(0);await expect(table.locator('.table-pagination')).toContainText('전체 1건 선택 · 조건 내 0건');await page.getByRole('searchbox',{name:'감사 사건 검색',exact:true}).fill('동일 원문');await page.reload();
 await expect(page.getByRole('searchbox',{name:'감사 사건 검색',exact:true})).toHaveValue('동일 원문');await expect(table.getByRole('combobox',{name:'페이지당 행'})).toHaveValue('15');await expect(table.locator('th[data-column-id="scope"]')).toHaveCount(0);await expect(table.locator('th[data-column-id="action"]')).toHaveAttribute('aria-sort','ascending');
 const checked=await table.locator('tbody tr').evaluateAll(rows=>rows.filter(r=>r.querySelector<HTMLInputElement>('input[type=checkbox]')?.checked).map(r=>r.getAttribute('data-row-id')));expect(checked).toEqual([id]);expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('운영 리포트·연결 상태: 수량 의미·사진/AI 구분과 미연결 참조 유지',async({page})=>{
 const before=await ledger(page);await page.getByRole('tab',{name:'운영 리포트',exact:true}).click();const table=grid(page,'operations-quantities');
 for(const [id,qty] of [['normal-production','60'],['warehouse-remaining','15'],['in-transit','3'],['arrived','32'],['promise-remaining','68']])await expect(table.locator(`tr[data-row-id="${id}"] [data-column-id="quantity"] strong`)).toHaveText(qty+' 대');
 await expect(table.locator('tr[data-row-id="promise-remaining"]')).toContainText('추가 생산 필요량 아님');await expect(table.locator('.media-trigger')).toHaveCount(1);
 const row=table.locator('tr[data-row-id="normal-production"]'),prior=await page.locator('.ai-context code').textContent();await row.locator('[data-column-id="photo"] button').click();await expect(page.getByRole('dialog',{name:'사진·출처'})).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText(prior!);await page.keyboard.press('Escape');
 await row.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('JOB-2609-01');await row.getByRole('button',{name:'9월 PoE 생산 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('JOB-2609-01');await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await table.locator('tr[data-row-id="in-transit"]').getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('JOB-2609-01');await table.locator('tr[data-row-id="in-transit"]').focus();await page.keyboard.press('Enter');await expect(page.locator('.ai-context code')).toHaveText('ROUND-01');
 await page.getByRole('tab',{name:'연결 · 구현 상태',exact:true}).click();const statuses=grid(page,'operations-status');await statuses.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');await expect(statuses.locator('tbody tr')).toHaveCount(10);await expect(statuses.locator('tr[data-row-id="local-graph"]')).toContainText('로컬 Mock 조회 사본');await expect(statuses.locator('tr[data-row-id="scale-target"]')).toContainText('실제 100,000개 적재·부하 시험 미수행');
 await statuses.locator('tr[data-row-id="agent"]').getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('ROUND-01');await expect(statuses.locator('.entity-chip')).toHaveCount(0);await expect(statuses.locator('.media-trigger')).toHaveCount(0);await statuses.locator('tr[data-row-id="agent"]').getByRole('button',{name:'연결 범위 확인',exact:true}).click();await expect(page.getByRole('dialog',{name:'연결 범위 상세'})).toContainText('실제 Agent·LLM 미연결');await page.keyboard.press('Escape');
 await statuses.getByRole('searchbox').fill('AgentPort');await page.reload();await expect(statuses).toBeVisible();await expect(statuses.getByRole('searchbox')).toHaveValue('AgentPort');await expect(statuses.locator('tbody input[type=checkbox]')).toBeChecked();
 await page.getByRole('tab',{name:'개발 · Agent 연결',exact:true}).click();const ports=grid(page,'operations-ports');await ports.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');await expect(ports.locator('tbody tr')).toHaveCount(6);await ports.locator('tr[data-row-id="ActionPort"]').getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('ROUND-01');await ports.locator('tr[data-row-id="AgentPort"]').getByRole('button',{name:'연결 경계 확인',exact:true}).click();await expect(page.getByRole('dialog',{name:'공통 포트 연결 경계'})).toContainText('실제 어댑터 미연결');await page.keyboard.press('Escape');
 expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});
