import {test,expect,type Page} from '@playwright/test';

async function go(page:Page,id:string){await page.goto('/#'+id);await expect(page.locator('main')).toBeVisible();}
async function switchAccount(page:Page,actor:'Alice'|'Bob'|'Viewer'|'OtherCompany'){
 await page.getByLabel('시연 신원',{exact:true}).selectOption(actor);
 const dialog=page.getByRole('dialog',{name:'개발 계정 전환'});
 await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:/^(계정 전환|현재 계정에 입력 보관 후 전환|입력 버리고 전환)$/}).click();
 await expect(dialog).not.toBeVisible();
 await expect(page.getByLabel('시연 신원',{exact:true})).toHaveValue(actor);
}
async function approveLatest(page:Page,title:string){
 await expect(page.getByRole('heading',{name:'검토·승인',exact:true,level:1})).toBeVisible();
 await page.getByRole('row').filter({has:page.getByRole('button',{name:title,exact:true})}).getByRole('button',{name:'검토 열기',exact:true}).click();
 let dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'등록안 검토 요청',exact:true}).click();
 await expect(dialog.getByRole('button',{name:'이 버전 승인',exact:true})).toBeDisabled();
 await expect(dialog).toContainText('자기 승인은 허용되지 않습니다.');
 await dialog.getByRole('button',{name:'닫기',exact:true}).click();
 await switchAccount(page,'Bob');
 await go(page,'UI05');
 await page.getByRole('row').filter({has:page.getByRole('button',{name:title,exact:true})}).getByRole('button',{name:'검토 열기',exact:true}).click();
 dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'이 버전 승인',exact:true}).click();
 await expect(dialog.getByText('승인',{exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'승인된 버전 반영',exact:true}).click();
 await expect(dialog.getByText('반영 완료',{exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'같은 요청으로 재확인',exact:true}).click();
 await expect(page.locator('.toast')).toContainText('추가 반영 없음');
 await dialog.getByRole('button',{name:'닫기',exact:true}).click();
}
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload()});

test('구매 요청 → 견적 비용 → 내부 발주·공급 확인의 별도 승인 및 중복 반영 방지',async({page})=>{
 await go(page,'PURCHASE');
 await page.getByRole('button',{name:'구매 요청 초안',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'초안 저장',exact:true}).click();
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('tab',{name:/견적 비교/}).click();
 await expect(page.locator('[data-workflow-grid="purchase-quotes"] article[data-row-id]').first()).toContainText('운송비 미확인');
 await expect(page.locator('[data-workflow-grid="purchase-quotes"] article[data-row-id]').first()).toContainText('96,000 KRW');
 await expect(page.locator('[data-workflow-grid="purchase-quotes"] article[data-row-id]').last()).toContainText('108,000 KRW');
 await page.locator('[data-workflow-grid="purchase-quotes"] article[data-row-id]').last().getByRole('button',{name:'비교안 선택',exact:true}).click();
 await page.getByRole('button',{name:'내부 발주 초안',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('100개');
 await page.getByRole('dialog').getByRole('button',{name:'검토 초안 저장',exact:true}).click();
 await approveLatest(page,'내부 발주 기록 · 공급사 B');
 await switchAccount(page,'Alice');
 await go(page,'PURCHASE');
 await page.getByRole('tab',{name:/내부 발주 · 공급 확인/}).click();
 await expect(page.getByRole('cell',{name:'내부 기록 · 미송신',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'공급 확인 초안',exact:true})).toHaveCount(1);
 await page.getByRole('button',{name:'공급 확인 초안',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByLabel('이번 회신의 확인 수량 (개)').fill('101');
 await dialog.getByLabel('공급사 회신 근거 · 사건 ID').fill('SYN-SUPPLIER-REPLY-TEST-001');
 await dialog.getByRole('button',{name:'검토 초안 저장',exact:true}).click();
 await expect(dialog.getByRole('alert')).toContainText('100개 이하');
 await expect(dialog.getByLabel('이번 회신의 확인 수량 (개)')).toHaveValue('101');
 await dialog.getByLabel('이번 회신의 확인 수량 (개)').fill('100');
 const title=(await dialog.getByText(/^PO-/).textContent())!.split(' · ')[0];
 await dialog.getByRole('button',{name:'검토 초안 저장',exact:true}).click();
 await approveLatest(page,'공급 확인 기록 · '+title);
 await go(page,'PURCHASE');
 await page.getByRole('tab',{name:/내부 발주 · 공급 확인/}).click();
 await expect(page.getByRole('cell',{name:'SYN-SUPPLIER-REPLY-TEST-001',exact:true})).toHaveCount(1);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('ontologics-v1')!));
 expect(stored.supplyConfirmations).toHaveLength(1);
 expect(stored.supplyConfirmations[0].qty).toBe(100);
 expect(stored.receipt).toBeNull();
 expect(stored.docs.filter((d:{body:string})=>{try{return JSON.parse(d.body).type==='purchase-order'}catch{return false}})).toHaveLength(1);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'output/playwright/purchase-supply-v2.png',fullPage:true});
});

test('관리자 TBox 격리 초안: 권한·배치와 의미 변경·모의 검증·운영 적용 차단',async({page})=>{
 await go(page,'MAP');
 await page.getByRole('tab',{name:'TBox · 관리자 초안',exact:true}).click();
 await expect(page.getByRole('button',{name:'초안 저장',exact:true})).toBeDisabled();
 await switchAccount(page,'Bob');
 await go(page,'MAP');
 await page.getByRole('tab',{name:'TBox · 관리자 초안',exact:true}).click();
 await page.getByRole('button',{name:'제품 구성 클래스',exact:true}).focus();
 await page.keyboard.press('ArrowRight');
 await expect(page.locator('.ext-canvas-foot')).toContainText('배치 변경 1건 / 의미 변경 0건');
 await page.getByLabel('SHACL 제약 초안').fill('configuration_id 최소 1 / 최대 1 · 검토용 변경');
 await expect(page.locator('.ext-canvas-foot')).toContainText('의미 변경 1건');
 await page.getByRole('button',{name:'모의 구조 검증',exact:true}).click();
 await expect(page.locator('.ext-validation')).toContainText('실제 RDF/OWL·SHACL 엔진 미연결');
 await page.getByLabel('변경 이유 · 검토자 전달 사항').fill('합성 fixture의 구성 식별자 제약을 검토합니다.');
 await page.getByRole('button',{name:'초안 저장',exact:true}).click();
 await expect(page.locator('.toast')).toContainText('격리 초안 저장');
 await page.getByRole('button',{name:'검토 요청',exact:true}).click();
 await expect(page.locator('.toast')).toContainText('운영 적용 없음');
 await expect(page.getByRole('button',{name:'운영 적용',exact:true})).toBeDisabled();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('ontologics-v1')!));
 const documents=stored.docs.filter((d:{name:string})=>d.name.startsWith('TBOX-DRAFT-'));
 expect(documents).toHaveLength(2);
 expect(JSON.parse(documents[1].body).status).toBe('검토 요청');
 expect(stored.version).toBe(1);
 expect(stored.applied).toEqual({});
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'output/playwright/ontology-draft-v2.png',fullPage:true});
 await switchAccount(page,'Viewer');
 await go(page,'MAP');
 await page.getByRole('tab',{name:'TBox · 관리자 초안',exact:true}).click();
 await expect(page.getByRole('button',{name:'초안 저장',exact:true})).toBeDisabled();
 await expect(page.getByLabel('SHACL 제약 초안')).toHaveAttribute('readonly','');
});

test('구매 초안 응답 유실: 기존 요청 상태 확인 후 단일 문서 유지',async({page})=>{
 await go(page,'PURCHASE');
 await page.getByRole('button',{name:'오류 상태 시뮬레이션',exact:true}).click();
 await page.getByRole('button',{name:'구매 요청 초안',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'초안 저장',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:'취소',exact:true}).click();
 await expect(page.getByLabel('시연 신원',{exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'기존 요청 상태 확인',exact:true}).click();
 await expect(page.getByLabel('시연 신원',{exact:true})).toBeEnabled();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('ontologics-v1')!));
 expect(stored.docs.filter((d:{body:string})=>{try{return JSON.parse(d.body).type==='purchase-request'}catch{return false}})).toHaveLength(1);
 await expect(page.getByRole('row').filter({has:page.getByRole('cell',{name:'초안 · 미송신',exact:true})})).toHaveCount(1);
});
