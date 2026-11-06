import {test,expect,type Page} from '@playwright/test';

async function material(page:Page){await page.goto('/#MATERIAL');await expect(page.getByRole('heading',{name:'부족 자재·대체품 검토',level:1})).toBeVisible();}
async function selectPart(page:Page){await page.locator('.material-context').getByRole('button',{name:'TPS2375D 객체 선택',exact:true}).click();await expect(page.locator('.inspector-header code')).toHaveText('PART-TPS');}
async function ledger(page:Page){return page.evaluate(()=>{const stored=JSON.parse(localStorage.getItem('ontologics-v1')!);return {version:stored.version,events:stored.events,applied:stored.applied,drafts:stored.drafts}});}
const partMedia=(page:Page,container='.inspector')=>page.locator(container+' [data-entity-id="PART-TPS"][data-media-state]').first();

test.setTimeout(45000);

test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload()});

test('이미지 일관성: 칩·프리뷰·Inspector·확대, AI 출처와 업무 무변경',async({page})=>{
 await material(page);const before=await ledger(page);
 const chip=page.locator('.material-context').getByRole('button',{name:'TPS2375D 객체 선택',exact:true});
 const thumbnail=page.locator('.material-context [data-entity-id="PART-TPS"][data-asset-id]').first();
 await expect(thumbnail).toHaveAttribute('data-media-state','ready');
 const asset=await thumbnail.getAttribute('data-asset-id');const url=await thumbnail.locator('img').getAttribute('src');
 expect(asset).toBeTruthy();expect(url).toBeTruthy();
 await chip.focus();const preview=page.getByRole('dialog',{name:'TPS2375D 미리보기',exact:true});
 await expect(preview).toBeVisible();await preview.hover();
 await expect(preview.locator('[data-asset-id="'+asset+'"]').first()).toHaveAttribute('data-media-state','ready');
 await expect(preview).toContainText('실물 사진 미등록');
 await expect(preview).toContainText(/AI|생성/);
 await preview.screenshot({path:'output/playwright/media-preview.png'});
 await page.keyboard.press('Escape');await expect(preview).not.toBeVisible();await expect(chip).toBeFocused();
 await chip.click();await expect(page.locator('.inspector-header code')).toHaveText('PART-TPS');
 const panel=partMedia(page);await expect(panel).toHaveAttribute('data-asset-id',asset!);await expect(panel.locator('img')).toHaveAttribute('src',url!);
 await page.getByRole('button',{name:'사진 및 출처 확인',exact:true}).click();
 const modal=page.getByRole('dialog',{name:'사진·출처',exact:true});await expect(modal).toBeVisible();
 await expect(modal).toContainText(/AI|생성/);await expect(modal).toContainText(/근거|실물/);
 await expect(modal.locator('img').first()).toHaveAttribute('src',url!);
 await modal.getByRole('button',{name:'선택 객체로 복귀',exact:true}).click();
 await expect(modal).not.toBeVisible();await expect(page.locator('.inspector-header code')).toHaveText('PART-TPS');
 await expect(page.getByRole('button',{name:'사진 및 출처 확인',exact:true})).toBeFocused();
 expect(await ledger(page)).toEqual(before);await expect(page.locator('.message')).toHaveCount(0);
 await page.screenshot({path:'output/playwright/media-provenance.png',fullPage:true});
});

test('미디어 로딩은 미등록과 구별되고 응답 후 같은 객체에서 완료',async({page})=>{
 let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/media/**',async route=>{await held;await route.continue();});
 await page.goto('/#MATERIAL',{waitUntil:'domcontentloaded'});
 await selectPart(page);const panel=partMedia(page);
 await expect(panel).toHaveAttribute('data-media-state','loading');
 await expect(panel).not.toContainText('이미지 불러오기 실패');
 release();await expect(panel).toHaveAttribute('data-media-state','ready');
 await expect(page.locator('.inspector-header code')).toHaveText('PART-TPS');
});

test('이미지 실패와 미등록을 구분하고 다른 객체 확대에 이전 실패를 남기지 않음',async({page})=>{
 await page.route('**/media/**',route=>route.fulfill({status:404,contentType:'text/plain',body:'media unavailable'}));
 await material(page);await selectPart(page);
 await expect(partMedia(page)).toHaveAttribute('data-media-state','error');
 await expect(partMedia(page)).toContainText('이미지 불러오기 실패');
 await page.getByLabel('전체 객체 검색',{exact:true}).fill('CONTRACT-01');
 await page.locator('.global-search-results button').filter({hasText:'CONTRACT-01'}).click();
 await expect(page.locator('.inspector-header code')).toHaveText('CONTRACT-01');
 const unregistered=page.locator('.inspector [data-entity-id="CONTRACT-01"][data-media-state]').first();
 await expect(unregistered).toHaveAttribute('data-media-state','unregistered');
 await expect(unregistered).toContainText('실물 사진 미등록');
 await expect(unregistered).not.toContainText('이미지 불러오기 실패');
});

test('다른 회사 전환 후 이전 객체 사진·출처·미디어 요청 미노출',async({page})=>{
 await material(page);await selectPart(page);await expect(partMedia(page)).toHaveAttribute('data-media-state','ready');
 await page.getByLabel('시연 신원',{exact:true}).selectOption('OtherCompany');
 const dialog=page.getByRole('dialog',{name:'개발 계정 전환',exact:true});
 await dialog.getByRole('button',{name:/^(계정 전환|현재 계정에 입력 보관 후 전환)$/}).click();
 await expect(dialog).not.toBeVisible();await expect(page.locator('main')).toContainText('회사 B의 업무 공간');
 await expect(page.locator('[data-asset-id]')).toHaveCount(0);
 await expect(page.getByRole('dialog',{name:'사진·출처',exact:true})).toHaveCount(0);
 await expect(page.locator('.inspector-header code')).toHaveCount(0);
 const leaked:string[]=[];page.on('request',request=>{if(request.url().includes('/media/'))leaked.push(request.url())});
 await page.getByLabel('전체 객체 검색',{exact:true}).fill('TPS');
 await expect(page.locator('.global-search-results')).toContainText('검색 0');
 expect(leaked).toEqual([]);
});

test('이미지 확대와 화면 맞춤·선택 객체 복귀',async({page})=>{
 await material(page);await selectPart(page);await expect(partMedia(page)).toHaveAttribute('data-media-state','ready');
 await page.getByRole('button',{name:'사진 및 출처 확인',exact:true}).click();
 const modal=page.getByRole('dialog',{name:'사진·출처',exact:true});await expect(modal.locator('img')).toBeVisible();
 await modal.getByRole('button',{name:'이미지 확대',exact:true}).click();await expect(modal.locator('.media-viewer')).toHaveClass(/zoomed/);
 await modal.getByRole('button',{name:'화면에 맞추기',exact:true}).click();await expect(modal.locator('.media-viewer')).not.toHaveClass(/zoomed/);
 await modal.screenshot({path:'output/playwright/media-detail.png'});
 await modal.getByRole('button',{name:'선택 객체로 복귀',exact:true}).click();await expect(modal).not.toBeVisible();
 await expect(page.locator('.inspector-header code')).toHaveText('PART-TPS');
 await expect(page.getByRole('button',{name:'사진 및 출처 확인',exact:true})).toBeFocused();
});

test('그래프 연결의 반복 조회는 같은 사진을 재생성하거나 재요청하지 않음',async({page})=>{
 await material(page);
 const connection=page.locator('.graph-connection.compact');await connection.getByRole('button',{name:'그래프 서버 연결',exact:true}).click();await expect(connection).toContainText('갱신 완료');
 const popup=page.waitForEvent('popup');await connection.getByRole('button',{name:'별도 그래프 열기'}).click();const graph=await popup;await expect(graph.getByTestId('graph-projected-version')).toHaveText('v1');
 const businessPhoto=page.locator('main table img').first(),graphPhoto=graph.locator('.gv-photo img');await expect(businessPhoto).toBeVisible();await expect(graphPhoto).toHaveJSProperty('complete',true);
 const businessNode=await businessPhoto.elementHandle(),graphNode=await graphPhoto.elementHandle();expect(businessNode).toBeTruthy();expect(graphNode).toBeTruthy();
 let checks=0,graphChecks=0,imageRequests=0,snapshotRequests=0;
 page.on('response',response=>{if(response.url().endsWith('/local-graph/status'))checks++});graph.on('response',response=>{if(response.url().endsWith('/local-graph/status'))graphChecks++});
 page.on('request',request=>{if(request.url().includes('/media/'))imageRequests++});graph.on('request',request=>{if(request.url().includes('/media/'))imageRequests++;if(request.url().endsWith('/local-graph/snapshot'))snapshotRequests++});
 const before=await ledger(page);await expect.poll(()=>checks,{timeout:7000}).toBeGreaterThanOrEqual(5);
 const observations={businessImageRetained:await businessNode!.evaluate(el=>el.isConnected),graphImageRetained:await graphNode!.evaluate(el=>el.isConnected),imageRequests,snapshotRequests,graphChecks};
 await test.info().attach('image-poll-observations',{body:JSON.stringify(observations,null,2),contentType:'application/json'});
 expect(observations.businessImageRetained).toBe(true);expect(observations.graphImageRetained).toBe(true);expect(imageRequests).toBe(0);expect(snapshotRequests).toBe(0);expect(graphChecks).toBeGreaterThanOrEqual(4);
 await graph.locator('.gv-photo').click();await expect(graph.getByRole('dialog',{name:'사진·출처',exact:true})).toBeVisible();const modalNode=await graph.getByRole('dialog').locator('img').elementHandle();const count=checks;await expect.poll(()=>checks,{timeout:4000}).toBeGreaterThanOrEqual(count+3);expect(await modalNode!.evaluate(el=>el.isConnected)).toBe(true);await graph.keyboard.press('Escape');await expect(graph.getByRole('dialog')).toHaveCount(0);expect(await ledger(page)).toEqual(before);
 await page.screenshot({path:'output/playwright/image-stable-business-v2.6.png',fullPage:true});await graph.screenshot({path:'output/playwright/image-stable-graph-v2.6.png',fullPage:true});await connection.getByRole('button',{name:'그래프 연결 해제'}).click();
});
