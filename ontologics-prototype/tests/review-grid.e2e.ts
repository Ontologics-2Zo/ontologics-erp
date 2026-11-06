import {test,expect,type Page} from '@playwright/test';
import {initial,makeDraft,type State,type Payload} from '../src/domain';

async function reviewFixture(){
 const s=initial();
 const cases:[Payload,string,string][]=[
  [{kind:'production',total:66,good:60,defects:4,pending:2,jobId:'JOB-2609-01',at:'2026-09-20T09:00:00+09:00',evidence:'DEMO-REVIEW-PRODUCTION'},'생산 후보 60대','UI08'],
  [{kind:'material_receipt',total:40,pass:30,fail:5,pending:5,evidence:'DEMO-REVIEW-RECEIPT'},'입고 후보 40개','UI07'],
  [{kind:'trace',removed:'2026-09-12T09:00:00+09:00',coverage:true,evidence:'DEMO-TRACE-02'},'U104 이력 검토','UI04'],
  [{kind:'bom',mapping:'WROOM',reviewed:true,evidence:'SRC-L1-ods · SRC-L1-pdf'},'L1 원본 검토','UI02'],
  [{kind:'board',board:'U999',evidence:'DEMO-NEW-BOARD'},'미등록 보드 식별 검토','UI03'],
  [{kind:'bom',mapping:'WROOM',reviewed:true,evidence:'SRC-L1-ods · SRC-L1-pdf'},'L1 추가 검토','UI02'],
  [{kind:'trace',removed:'2026-09-12T09:00:00+09:00',coverage:true,evidence:'DEMO-TRACE-02'},'U104 추가 검토','UI04']
 ];
 for(const [payload,title,origin] of cases)s.drafts.push({...await makeDraft(s,payload,'Alice',title,origin),companyId:'A'});
 return s;
}
async function seed(page:Page,state:State){await page.goto('/');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('ontologics-v1',JSON.stringify(s))},state);await page.goto('/#UI05');await page.reload()}
const ledger=(page:Page)=>page.evaluate(()=>localStorage.getItem('ontologics-v1'));

test('검토 표의 수량 의미·사진·초안 AI 맥락과 미등록 대상 분리',async({page})=>{
 const fixture=await reviewFixture();await seed(page,fixture);
 const grid=page.locator('[data-workflow-grid="reviews"]');await expect(grid.locator('tbody tr')).toHaveCount(5);
 const before=await ledger(page);
 await expect(grid.locator('tr[data-row-id="'+fixture.drafts[0].id+'"] [data-column-id="quantity"]')).toContainText('60');
 await expect(grid.locator('tr[data-row-id="'+fixture.drafts[0].id+'"] [data-column-id="quantity"]')).toContainText('정상 완료 누계 · 총 66 / 불량 4 / 대기 2');
 await expect(grid.locator('tr[data-row-id="'+fixture.drafts[1].id+'"] [data-column-id="quantity"]')).toContainText('이번 입고 · 합격 30 / 불합격 5 / 대기 5');
 const trace=grid.locator('tr[data-row-id="'+fixture.drafts[2].id+'"]');
 const initialObject=await page.locator('.ai-context code').textContent();
 const photo=trace.locator('[data-column-id="photo"] button');await photo.click();
 const modal=page.getByRole('dialog',{name:'사진·출처',exact:true});await expect(modal).toBeVisible();
 await expect(page.locator('.ai-context code')).toHaveText(initialObject!);await expect(page.locator('.ai-context')).not.toContainText('초안 '+fixture.drafts[2].id);
 await page.keyboard.press('Escape');await expect(photo).toBeFocused();
 await trace.getByRole('checkbox').check();await expect(page.locator('.ai-context code')).toHaveText('U104');await expect(page.locator('.ai-context')).toContainText('초안 '+fixture.drafts[2].id+' v1');
 // Re-selecting the same object must keep the exact draft context after the selection invalidation.
 await trace.focus();await page.keyboard.press('Enter');await expect(page.locator('.ai-context')).toContainText('초안 '+fixture.drafts[2].id+' v1');
 const unknown=grid.locator('tr[data-row-id="'+fixture.drafts[4].id+'"]');await unknown.focus();await page.keyboard.press('Enter');
 await expect(unknown).toContainText('객체 연결 미확인');await expect(page.locator('.ai-context code')).toHaveText('U104');await expect(page.locator('.ai-context')).not.toContainText('초안 DR-');
 await trace.getByRole('button',{name:'검토 열기',exact:true}).click();const review=page.getByRole('dialog',{name:'U104 이력 검토',exact:true});await expect(review).toContainText(fixture.drafts[2].hash);await page.keyboard.press('Escape');
 await expect(page.locator('.ai-context')).toContainText('초안 '+fixture.drafts[2].id+' v1');
 await trace.getByRole('button',{name:'U104 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('U104');
 expect(await ledger(page)).toBe(before);await expect(page.locator('.message')).toHaveCount(0);
});

test('검토 표 필터·정렬·열·페이지·체크 복원은 승인/업무 입력과 분리',async({page})=>{
 const fixture=await reviewFixture();await seed(page,fixture);const before=await ledger(page);
 const grid=page.locator('[data-workflow-grid="reviews"]');const trace=grid.locator('tr[data-row-id="'+fixture.drafts[2].id+'"]');
 await trace.getByRole('checkbox').check();
 await page.getByLabel('검토 상태 필터',{exact:true}).selectOption('검토 요청');await expect(grid.locator('tbody tr')).toHaveCount(0);await expect(grid.locator('.table-pagination')).toContainText('전체 1건 선택 · 조건 내 0건');
 await page.getByLabel('검토 상태 필터',{exact:true}).selectOption('전체');
 await grid.locator('th[data-column-id="object"] button').click();await expect(grid.locator('th[data-column-id="object"]')).toHaveAttribute('aria-sort','ascending');
 await grid.getByRole('button',{name:'열 선택',exact:true}).click();await grid.locator('.column-picker').getByRole('checkbox',{name:'작성 / 승인',exact:true}).uncheck();
 await grid.getByRole('button',{name:'다음',exact:true}).click();await expect(grid.locator('.table-pagination')).toContainText('2 / 2');
 await page.reload();await expect(grid.locator('.table-pagination')).toContainText('2 / 2');await expect(grid.locator('tbody tr')).toHaveCount(2);await expect(grid.locator('th[data-column-id="author"]')).toHaveCount(0);await expect(grid.locator('th[data-column-id="object"]')).toHaveAttribute('aria-sort','ascending');
 await expect(page.locator('.ai-context code')).toHaveText('U104');await expect(page.locator('.ai-context')).toContainText('초안 '+fixture.drafts[2].id+' v1');
 await page.getByLabel('검토명·초안 ID·작성자 검색',{exact:true}).fill('U104 이력 검토');await expect(trace.getByRole('checkbox')).toBeChecked();await expect(grid.locator('.table-pagination')).toContainText('1 / 1');
 await page.getByLabel('시연 신원',{exact:true}).selectOption('Bob');const switcher=page.getByRole('dialog',{name:'개발 계정 전환',exact:true});await expect(switcher.getByRole('button',{name:'입력 버리고 전환',exact:true})).toHaveCount(0);await switcher.getByRole('button',{name:'계정 전환',exact:true}).click();await page.goto('/#UI05');await expect(page.getByLabel('검토명·초안 ID·작성자 검색',{exact:true})).toHaveValue('');await expect(grid.locator('th[data-column-id="author"]')).toHaveCount(1);await expect(grid.locator('tbody input:checked')).toHaveCount(0);
 expect(await ledger(page)).toBe(before);
});
