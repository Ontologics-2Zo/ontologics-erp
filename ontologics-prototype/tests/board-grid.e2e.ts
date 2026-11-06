import {test,expect,type Page} from '@playwright/test';
import {initial,makeDraft,approve,apply,type State} from '../src/domain';

async function boardFixture(){
 let s=initial();
 const created={...await makeDraft(s,{kind:'board',board:'U999',evidence:'DEMO-BOARD-NEW · 가상 등록 요청'},'Alice','U999 최초 운영 등록','UI03'),id:'BOARD-GRID-APPLIED'};
 const approved=await approve(s,{...created,status:'검토 요청'},'Bob');
 s=await apply({...s,drafts:[approved]},approved);
 const pending={...await makeDraft(s,{kind:'board',board:'U998',evidence:'DEMO-BOARD-NEW · 가상 등록 요청'},'Alice','U998 최초 운영 등록','UI03'),id:'BOARD-GRID-PENDING'};
 s.drafts.push(pending);return s;
}
async function seed(page:Page,state:State){await page.goto('/');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('ontologics-v1',JSON.stringify(s))},state);await page.goto('/#UI03');await page.reload()}
const ledger=(page:Page)=>page.evaluate(()=>localStorage.getItem('ontologics-v1'));

test('개별 보드 목록: 사진·객체·AI·보기 복원과 신규 식별의 미확인 관계',async({page})=>{
 await seed(page,await boardFixture());const before=await ledger(page);
 const grid=page.locator('[data-workflow-grid="board-registry"]'),row=grid.locator('tr[data-row-id="U104"]'),newBoard=grid.locator('tr[data-row-id="U999"]');
 await expect(grid.locator('tbody tr')).toHaveCount(4);
 await expect(newBoard.locator('[data-column-id="configuration"]')).toContainText('별도 구성 확인 필요');await expect(newBoard.locator('[data-column-id="configuration"]')).toContainText('장착 위치 미확인');await expect(newBoard.locator('[data-column-id="configuration"]')).not.toContainText('U2');
 await expect(newBoard.locator('[data-column-id="photo"]')).toContainText('실물 사진 미등록');await expect(newBoard.locator('[data-column-id="photo"] img')).toHaveCount(0);
 await expect(newBoard).toContainText('승인 식별 반영');await expect(newBoard.locator('[data-column-id="quantity"]')).toContainText('객체 1행 · 생산/불량 수량 아님');await expect(newBoard.locator('[data-column-id="basis"]')).toContainText('DEMO-BOARD-NEW');
 await expect(grid.locator('tr[data-row-id="U106"] [data-column-id="configuration"]')).toContainText('장착 위치 미확인');
 const selected=await page.locator('.ai-context code').textContent();const photo=row.locator('[data-column-id="photo"] button');await photo.click();await expect(page.getByRole('dialog',{name:'사진·출처',exact:true})).toBeVisible();await expect(page.getByRole('dialog',{name:'사진·출처',exact:true})).toContainText('이 개별 보드의 실물·장착 증거 아님');await expect(page.locator('.ai-context code')).toHaveText(selected!);await page.keyboard.press('Escape');await expect(photo).toBeFocused();
 await row.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('U104');
 await grid.locator('th[data-column-id="object"] button').click();await grid.getByRole('button',{name:'열 선택',exact:true}).click();await grid.locator('.column-picker').getByRole('checkbox',{name:'등록 작성 / 승인',exact:true}).uncheck();await grid.getByRole('combobox',{name:'페이지당 행'}).selectOption('15');await grid.getByRole('searchbox').fill('U104');await page.reload();
 await expect(row.getByRole('checkbox')).toBeChecked();await expect(grid.getByRole('searchbox')).toHaveValue('U104');await expect(grid.getByRole('combobox',{name:'페이지당 행'})).toHaveValue('15');await expect(grid.locator('th[data-column-id="object"]')).toHaveAttribute('aria-sort','ascending');await expect(grid.locator('th[data-column-id="author"]')).toHaveCount(0);await expect(page.locator('.ai-context code')).toHaveText('U104');
 await row.getByRole('button',{name:'U104 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('U104');expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('보드 등록 후보·반영 목록의 정확 버전과 미등록 대상 AI 분리',async({page})=>{
 const state=await boardFixture();await seed(page,state);const before=await ledger(page);
 const registry=page.locator('[data-workflow-grid="board-registry"]');await registry.locator('tr[data-row-id="U104"] input[type="checkbox"]').check();
 const grid=page.locator('[data-workflow-grid="board-registration-drafts"]'),pending=grid.locator('tr[data-row-id="BOARD-GRID-PENDING"]'),applied=grid.locator('tr[data-row-id="BOARD-GRID-APPLIED"]');
 await expect(grid.locator('tbody tr')).toHaveCount(2);await expect(registry.locator('tr[data-row-id="U998"]')).toHaveCount(0);await expect(pending).toContainText('미등록 대상 · 객체 연결 미확인');await expect(pending.locator('[data-column-id="photo"] img')).toHaveCount(0);await expect(pending.locator('[data-column-id="quantity"]')).toContainText('식별자 등록 후보 · 확정 대수 아님');await expect(pending.locator('[data-column-id="status"]')).toContainText('아직 미반영');
 await pending.focus();await page.keyboard.press('Enter');await expect(page.locator('.ai-context code')).toHaveText('U104');await expect(page.locator('.ai-context')).not.toContainText('초안 BOARD-GRID-PENDING');
 await pending.getByRole('button',{name:'초안·버전 확인',exact:true}).click();const dialog=page.getByRole('dialog',{name:'보드 식별 등록 초안',exact:true});await expect(dialog).toContainText(state.drafts[1].hash);await expect(dialog).toContainText('BOARD-GRID-PENDING · 초안 v1');await expect(dialog).toContainText('v2 / v2');await expect(dialog.getByRole('button',{name:'이 버전 승인',exact:true})).toHaveCount(0);
 // A saved review filter may hide this draft; explicit continuation must open this exact draft without changing the filter.
 await page.evaluate(()=>localStorage.setItem('onto-form-A-Alice-workflow-view-review-filter',JSON.stringify('승인')));await dialog.getByRole('button',{name:'검토함에서 계속',exact:true}).click();const review=page.getByRole('dialog',{name:'U998 최초 운영 등록',exact:true});await expect(review).toContainText('BOARD-GRID-PENDING · v1');await expect(review).toContainText(state.drafts[1].hash);await expect(page.getByLabel('검토 상태 필터',{exact:true})).toHaveValue('승인');await page.keyboard.press('Escape');await page.goto('/#UI03');
 await applied.focus();await page.keyboard.press('Enter');await expect(page.locator('.ai-context code')).toHaveText('U999');await expect(page.locator('.ai-context')).toContainText('초안 BOARD-GRID-APPLIED v1');await page.reload();await expect(page.locator('.ai-context code')).toHaveText('U999');await expect(page.locator('.ai-context')).toContainText('초안 BOARD-GRID-APPLIED v1');
 await registry.locator('tr[data-row-id="U104"]').focus();await page.keyboard.press('Enter');await expect(page.locator('.ai-context')).not.toContainText('초안 BOARD-GRID-APPLIED');
 expect(await ledger(page)).toBe(before);
 await page.getByLabel('새 보드 식별자',{exact:true}).fill('U104');await page.getByRole('button',{name:'등록 검토 초안 작성',exact:true}).click();await expect(page.locator('.error-float')).toContainText('보드 ID가 중복되거나');await expect(page.getByLabel('새 보드 식별자',{exact:true})).toHaveValue('U104');
 const {actionReceipts,unresolvedActionKeys,...after}=JSON.parse((await ledger(page))!);expect(after).toEqual(JSON.parse(before!));expect(Object.values(actionReceipts).map((r:any)=>r.result.status)).toEqual(['failed']);expect(unresolvedActionKeys).toEqual([]);
});
