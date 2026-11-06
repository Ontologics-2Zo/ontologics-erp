import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {initial} from '../src/domain';
const catalog=JSON.parse(readFileSync(new URL('../src/catalog.json',import.meta.url),'utf8')) as {id:string;filename:string;sha256:string;commit:string}[];
const grid=(page:Page,key:string)=>page.locator(`[data-workflow-grid="${key}"]`);
const ledger=(page:Page)=>page.evaluate(()=>localStorage.getItem('ontologics-v1'));
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.goto('/#UI06');await page.reload()});

test('근거 표: 실제 원문·명시 참조의 사진/객체/AI 분리와 검색 장애·보기 보존',async({page})=>{
 const table=grid(page,'evidence-sources');await table.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');await expect(table.locator('tbody tr')).toHaveCount(11);
 const before=await ledger(page),row=table.locator('tr[data-row-id="SRC-L1-ods"]');
 await expect(row.locator('[data-column-id="kind"]')).toContainText('실제 공개 원본');
 await expect(row.locator('[data-column-id="basis"]')).not.toContainText('로컬 합성');
 const prior=await page.locator('.ai-context code').textContent(),photo=row.locator('[data-column-id="photo"] button');
 await photo.click();await expect(page.getByRole('dialog',{name:'사진·출처'})).toBeVisible();await expect(page.locator('.ai-context code')).toHaveText(prior!);await page.keyboard.press('Escape');await expect(photo).toBeFocused();
 await row.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('CFG-POE-L1');
 await row.getByRole('button',{name:'ESP32-PoE / L1 WROOM 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('CFG-POE-L1');await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await row.getByRole('button',{name:/^연결 \d+개 보기$/}).click();await expect(page.getByRole('dialog',{name:'원문을 참조하는 객체'})).toContainText('BOM 원문 품목');await page.keyboard.press('Escape');
 const file=catalog.find(c=>c.id==='SRC-L1-ods')!;await row.getByRole('button',{name:file.filename,exact:true}).click();const modal=page.getByRole('dialog',{name:file.filename,exact:true});await expect(modal).toContainText(file.sha256);await expect(modal).toContainText(file.commit);await page.keyboard.press('Escape');
 const unlinked=table.locator('tr[data-row-id="SRC-L-pdf"]');await expect(unlinked.locator('.media-trigger')).toHaveCount(0);await unlinked.focus();await page.keyboard.press('Enter');await expect(table).toContainText('선택 행의 객체 연결 미확인 · 현재 AI 대상 유지');await expect(page.locator('.ai-context code')).toHaveText('CFG-POE-L1');
 await page.getByLabel('자료 구분',{exact:true}).selectOption('실제 공개 원본');await table.getByRole('searchbox').fill('SRC-L1');await table.getByRole('columnheader',{name:'개정 / 원문 버전',exact:true}).getByRole('button').click();
 await table.getByRole('button',{name:'열 선택',exact:true}).click();await table.locator('.column-picker').getByRole('checkbox',{name:'미확인 / 적용 범위',exact:true}).uncheck();
 await page.getByLabel('검색 시연 상태',{exact:true}).selectOption('색인 미완료');await expect(page.getByText('색인이 준비되지 않았습니다.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'같은 조건으로 재시도',exact:true}).click();await expect(table.getByRole('searchbox')).toHaveValue('SRC-L1');await expect(table.locator('tbody tr')).toHaveCount(2);
 await page.getByLabel('검색 시연 상태',{exact:true}).selectOption('검색 장애');await page.getByRole('button',{name:'같은 조건으로 재시도',exact:true}).click();await page.reload();
 await expect(page.getByLabel('자료 구분',{exact:true})).toHaveValue('실제 공개 원본');await expect(table.getByRole('searchbox')).toHaveValue('SRC-L1');await expect(row.getByRole('checkbox')).toBeChecked();await expect(table.locator('th[data-column-id="unknowns"]')).toHaveCount(0);await expect(table.locator('th[data-column-id="revision"]')).toHaveAttribute('aria-sort','ascending');
 expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('저장 문서 표: 중복·원문·다운로드 유지, 본문 객체 추정 금지와 선택 복원',async({page})=>{
 const state=initial(),body='U104 · PART-TPS 이름이 있는 자유 검토 문서\n구조화 대상이나 승인 사실이 아님\n'+('원문 보존 확인 '.repeat(20))+'끝 문장';
 state.docs=[{name:'검토 A',body,status:'초안'},{name:'검토 A',body,status:'초안'},{name:'검토 A',body:'다른 원문 · U106',status:'검토 필요'},...['B','C','D','E'].map(x=>({name:'검토 '+x,body:'저장 원문 '+x,status:'초안'}))];
 await page.evaluate(s=>{localStorage.setItem('ontologics-v1',JSON.stringify(s))},state);await page.reload();
 const table=grid(page,'evidence-documents'),before=await ledger(page);await expect(table.locator('tbody tr')).toHaveCount(5);await expect(table).toContainText('로드 7건');
 await table.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');const ids=await table.locator('tbody tr').evaluateAll(rows=>rows.map(r=>r.getAttribute('data-row-id')));expect(new Set(ids).size).toBe(7);
 const row=table.locator('tbody tr').nth(1),id=await row.getAttribute('data-row-id'),prior=await page.locator('.ai-context code').textContent();
 await row.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText(prior!);await expect(table.locator('.media-trigger')).toHaveCount(0);await expect(table.locator('.entity-chip')).toHaveCount(0);await expect(table).toContainText('선택 행의 객체 연결 미확인 · 현재 AI 대상 유지');
 await row.getByRole('button',{name:'저장 원문 보기',exact:true}).click();const modal=page.getByRole('dialog',{name:'저장 업무 문서 원문',exact:true});await expect(modal.locator('pre')).toHaveText(body);await page.keyboard.press('Escape');
 const downloaded=page.waitForEvent('download');await row.getByRole('button',{name:'다운로드',exact:true}).click();const file=await downloaded;expect(file.suggestedFilename()).toBe('검토 A.txt');expect((await readFile((await file.path())!,'utf8')).replace(/^\uFEFF/,'')).toBe(body);
 await table.getByRole('columnheader',{name:'문서 / 대상 연결',exact:true}).getByRole('button').click();await table.getByRole('searchbox').fill('검토 A');await page.reload();await expect(table.getByRole('searchbox')).toHaveValue('검토 A');await expect(table.locator('tbody tr')).toHaveCount(3);
 const checkedIds=await table.locator('tbody tr').evaluateAll(rows=>rows.filter(r=>r.querySelector<HTMLInputElement>('input[type=checkbox]')?.checked).map(r=>r.getAttribute('data-row-id')));expect(checkedIds).toEqual([id]);
 expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});
