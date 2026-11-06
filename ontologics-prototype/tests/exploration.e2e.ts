import {test,expect,type Page} from '@playwright/test';

async function go(page:Page,id:string){await page.goto('/#'+id);await expect(page.locator('main')).toBeVisible();}
async function shot(page:Page,name:string){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'output/playwright/'+name+'.png',fullPage:true});}
async function switchAccount(page:Page,profile:string){await page.getByLabel('시연 신원',{exact:true}).selectOption(profile);const dialog=page.getByRole('dialog',{name:'개발 계정 전환'});await dialog.getByRole('button',{name:/^(계정 전환|입력 버리고 전환)$/}).click();await expect(dialog).not.toBeVisible();}
async function assertNoPageOverflow(page:Page){expect(await page.evaluate(()=>({scroll:document.body.scrollWidth,viewport:innerWidth}))).toEqual({scroll:page.viewportSize()!.width,viewport:page.viewportSize()!.width});}
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload()});

test('동일 객체: 칩 선택 → Inspector → AI와 실제 구성 맥락',async({page})=>{
 await go(page,'MATERIAL');
 const chip=page.locator('.material-context').getByRole('button',{name:'TPS2375D 객체 선택',exact:true});
 await chip.click();
 await expect(page.locator('.inspector-header code')).toHaveText('PART-TPS');
 await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await expect(page.locator('.ai-context code')).toHaveText('PART-TPS');
 await page.getByLabel('업무 AI 요청').fill('현재 객체의 근거를 확인해 줘');
 await page.getByRole('button',{name:'AI 요청 전송',exact:true}).click();
 await expect(page.locator('.message.assistant')).toContainText('PART-TPS');
 await go(page,'EXPLORE');
 await page.locator('.catalog-item').filter({hasText:'CFG-SENSE-A'}).click();
 await expect(page.locator('.object-banner')).toContainText('CFG-SENSE-A');
 await expect(page.locator('.ai-context code')).toHaveText('CFG-SENSE-A');
 await page.getByLabel('업무 AI 요청').fill('현재 구성 확인');
 await page.getByRole('button',{name:'AI 요청 전송',exact:true}).click();
 await expect(page.locator('.message.assistant')).toContainText('CFG-SENSE-A');
 await expect(page.locator('.message.assistant')).not.toContainText('PART-TPS');
});

test('객체 프리뷰: 지연 열림·포인터 유지·Escape 닫기·초점 복원·재열림 방지',async({page})=>{
 await go(page,'MATERIAL');
 const chip=page.locator('.material-context').getByRole('button',{name:'TPS2375D 객체 선택',exact:true});
 await chip.focus();
 const preview=page.getByRole('dialog',{name:'TPS2375D 미리보기',exact:true});
 await expect(preview).toBeVisible();
 await expect(preview).toContainText('실물 사진 미등록');
 await preview.hover();
 await page.waitForTimeout(300);
 await expect(preview).toBeVisible();
 await preview.getByRole('button',{name:'미리보기 닫기',exact:true}).focus();
 await page.keyboard.press('Escape');
 await expect(preview).not.toBeVisible();
 await expect(chip).toBeFocused();
 await page.waitForTimeout(350);
 await expect(preview).not.toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ontologics-v1')!).events)).toEqual([]);
 await expect(page.locator('.message')).toHaveCount(0);
});

test('표 정렬·페이지 이동 후 불변 행 ID와 선택 객체 유지, 그래프 선택 연결',async({page})=>{
 await go(page,'EXPLORE');
 await page.getByLabel('페이지당 행',{exact:true}).selectOption('100');
 const table=page.locator('.object-work table');
 const before=await table.locator('tbody tr').evaluateAll(rows=>Object.fromEntries(rows.map(row=>[row.getAttribute('data-row-id'),row.querySelector('.entity-chip')?.getAttribute('aria-label')])));
 const row=table.locator('tbody tr').first();const rowId=(await row.getAttribute('data-row-id'))!;const entityId=rowId.replace('BOM-','PART-');
 await row.getByRole('checkbox').check();
 await row.locator('.entity-chip').click();
 await expect(page.locator('.inspector-header code')).toHaveText(entityId);
 await table.getByRole('button',{name:'사용 위치',exact:true}).click();
 const after=await table.locator('tbody tr').evaluateAll(rows=>Object.fromEntries(rows.map(row=>[row.getAttribute('data-row-id'),row.querySelector('.entity-chip')?.getAttribute('aria-label')])));
 expect(after).toEqual(before);
 await expect(table.locator('[data-row-id="'+rowId+'"]').getByRole('checkbox')).toBeChecked();
 await expect(page.locator('.inspector-header code')).toHaveText(entityId);
 await page.getByLabel('페이지당 행',{exact:true}).selectOption('15');
 await page.locator('.table-pagination').getByRole('button',{name:'다음',exact:true}).click();
 await expect(page.locator('.inspector-header code')).toHaveText(entityId);
 await expect(page.locator('.table-pagination')).toContainText('1건 선택');
 await page.getByRole('button',{name:'관계 탐색',exact:true}).click();
 await page.getByRole('button',{name:'실제 장착 이력',exact:true}).click();
 await page.locator('.graph-node').filter({has:page.locator('code').filter({hasText:/^U104$/})}).click();
 await expect(page.locator('.inspector-header code')).toHaveText('U104');
 await expect(page.locator('.graph-node.selected')).toContainText('U104');
 await shot(page,'explore-v2');
 await page.getByRole('button',{name:'관계 목록',exact:true}).click();
 await expect(page.getByRole('button',{name:'U104 객체 선택',exact:true})).toBeVisible();
});

test('이전 대상의 늦은 AI 응답 격리, 다른 회사의 검색·관계·메타데이터 미노출',async({page})=>{
 await go(page,'MATERIAL');
 await page.locator('.material-context').getByRole('button',{name:'TPS2375D 객체 선택',exact:true}).click();
 await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await page.getByLabel('업무 AI 요청').fill('이전 대상 PART-TPS 질문');
 await page.getByRole('button',{name:'AI 요청 전송',exact:true}).click();
 await page.getByRole('button',{name:'TPS2375DR 객체 선택',exact:true}).click();
 await page.getByRole('button',{name:'이 객체로 AI에 질문',exact:true}).click();
 await expect(page.locator('.ai-context code')).toHaveText('PART-ALT');
 await page.waitForTimeout(850);
 await expect(page.locator('.message.assistant')).toHaveCount(0);
 await expect(page.locator('.message.user')).toHaveCount(0);
 await page.getByLabel('업무 AI 요청').fill('새 대상 질문');
 await page.getByRole('button',{name:'AI 요청 전송',exact:true}).click();
 await expect(page.locator('.message.assistant')).toContainText('PART-ALT');
 await expect(page.locator('.message.assistant')).not.toContainText('PART-TPS');
 await switchAccount(page,'OtherCompany');
 await expect(page.locator('main')).toContainText('회사 B의 업무 공간');
 await expect(page.locator('.entity-chip')).toHaveCount(0);
 await expect(page.locator('.exploration-trail')).toHaveCount(0);
 await expect(page.locator('.message')).toHaveCount(0);
 await page.getByLabel('전체 객체 검색').fill('TPS');
 await expect(page.locator('.global-search-results')).toContainText('검색 0');
 await expect(page.locator('.global-search-results')).not.toContainText('TPS2375D');
 await expect(page.locator('.global-search-results button')).toHaveCount(0);
});

test('라이트 기본·다크 설정 재조회 보존 및 대표 데스크톱 캡처',async({page})=>{
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.getByRole('heading',{name:'제조 운영 워크스페이스',exact:true})).toBeVisible();
 await shot(page,'home-v2');
 await page.getByRole('button',{name:'다크 테마',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await shot(page,'dark-v2');
});

test('390px와 200% 환산 800px 화면의 문서 가로 넘침 없음·접이식 맥락 패널',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.reload();
 await assertNoPageOverflow(page);
 await shot(page,'mobile-v2');
 await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
 await page.getByRole('link',{name:'제품·객체 탐색',exact:true}).click();
 await expect(page.getByRole('heading',{name:'제품·BOM·연결된 대상',exact:true,level:1})).toBeVisible();
 await assertNoPageOverflow(page);
 await page.getByRole('button',{name:'속성·근거',exact:true}).click();
 await expect(page.locator('.inspector-header')).toBeVisible();
 await assertNoPageOverflow(page);
 await page.getByRole('button',{name:'객체 정보 닫기',exact:true}).click();
 await page.setViewportSize({width:800,height:500});await page.reload();
 await assertNoPageOverflow(page);
 await expect(page.locator('.object-work')).toBeVisible();
 await page.getByRole('button',{name:'관계 탐색',exact:true}).click();
 await assertNoPageOverflow(page);
});
