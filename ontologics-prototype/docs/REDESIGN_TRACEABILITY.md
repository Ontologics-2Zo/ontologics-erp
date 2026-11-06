# 객체 중심 재설계 요구사항 대응표

기준일: 2026-11-06 / v2.6. 기준 자료: ONT-REQ-1.5 / ONT-UI-1.5 / ONT-DEV-1.5 및 이번 사용자 요청. 첨부 문서의 고정 MK-R2 배치·탭·동선 지시는 이번 요청으로 대체되며 업무 의미와 기존 ID는 보존한다. 원본 문서는 수정하지 않았다.

이 표의 `부분`은 **실행 가능한 프론트엔드 중 대표 업무 또는 읽기/초안 경로가 구현되어 있으나 원문 요구 전체의 운영 완료는 아닌 상태**다. 화면과 버튼이 존재하는 사실을 데이터·서버·사용자 인수 완료로 읽지 않는다. 운영 원장·인증·RDF/OWL 등 실제 서비스 연결은 미연결이다. 2026-11-05 별도 그래프 서버 후속으로 브라우저 Mock 읽기 복제만 로컬 서버에 연결하며, 아래 후속 대응표에서 범위를 구분한다. 검증 수행 증거와 캡처는 [VALIDATION.md](VALIDATION.md) 및 이번 검증 보고를 따른다. 과거 로그를 이번 실행 결과로 승격하지 않는다.

## 2026-11-06 추가 대응 — 실제 BOM v1.7·ABox

아래는 이번 데이터 정합화로 갱신한 대응이다. 후속 절이 현재 데이터 범위에 우선하고, 이어지는 원래 화면/요구사항 표의 ID와 미구현 요구는 모두 유지한다. 이전 표의 실제2스냅샷/미확보3모델 수치는 해당 작업 시점 기록이다. 현재 실제4모델·5스냅샷·356행, 기존 독립 합성3스냅샷 보존이다.

| 보존 요구·화면 ID | 현재 화면·컴포넌트 | 이번 동작·데이터 대응 | 상태 / 남은 범위 |
|---|---|---|---|
| SD-002/003, REG-01~04, UI02 | `actual-boms.ts`, `actual-bom-data.json`, `entity-data.ts`; ProductSourceTable/ProductBomTable/BomTreeGrid | 실제5스냅샷74/74/75/71/62행을 원본7파일·출처/해시·원문행 ID로 연결. 기존 PoE ID 유지, 신규 원문 ID는 모델/개정/행으로 분리 | 읽기 구현. 단위·실장·정확 MPN·공학 검수 미완료 |
| SD-004/005, CM01, UI02 | Product/BomReviewPanel/BomComponentGraph | ODS·CSV·PDF 포함 원본 해시 확인, 모델별 원문 표·정합성 경고·사진 구성도. PoE L/L1만 같은 모델 개정 비교 | 읽기/구조 검사 구현. 범용 추출·다른 모델 개정쌍 비교 미연결 |
| REG-01~04, RV01~03, AT01 | ProductRegistrationTable/기존 검토함 | 현재 명령이 지원하는 L1 ODS 등록만 접수 해시·대상을 확인해 진행. 다른 선택은 해당 구성 읽기/검토를 유지하고 L1 대리 등록 차단 | 기존 승인 시연 유지. 일반 구성 등록 명령/서버 계약 미연결 |
| SD-009·011·013·014 / PLN-02·03·06, UI01/MATERIAL/UI07 | `demo-bom-links.ts`, MaterialRequirementsTable, WorkQueueTable | PoE L1 원문행56/U2→PART-TPS 합성 매핑. 공통 계산으로 필요·원품 가용·합격분 할당·비교 부족을 일치시키고 PART-CAND 미확인 유지 | 대표1품목 계산. 전체 BOM 자재 수요/재고 계산 미구현 |
| SD-006~008 / R12-PUR-01~04 / PURCHASE | Procurement/Purchase*Table/SupplierQuoteCards | EVB C 원문행21 C18,C26→IM-EVB-C-C18-C26, 합성40대×2=80EA. 새 견적ID/명시 출처. 기존 IM-0008 문서/견적은 별도 범위 유지 | 대표 구매 시연 구현. 실제 발주 전송·EVB 실물 입고 연결 미구현 |
| G-01~08, CM01, MAP | ABoxBrowser/OntologyObjectTable/TraceGraph | 현재 QueryPort의 객체를 유형·자료로 조회,100개씩 추가 로드·표 점진 확장. 선택 속성·근거·주변 관계·AI 맥락 공유. 다운로드 관계 양끝의 객체 참조 보장 | 로컬 ABox 읽기 구현. 운영 RDF/OWL 추론·10만 객체 검증 미수행 |
| G-01~08, MAP 관리자 범위 | OntologyClassBrowser/기존 TBox 편집 | 기존6클래스·5관계 기준과 격리 관리자 초안·버전·별도 그래프 유지 | 실제 SHACL/정책 배포/운영 적용 미연결 유지 |
| AI-01~03 / UX·권한·시점 기준 | 공통 선택·AgentPort 맥락·객체 탐색 | 선택 구성에 PoE 전용 사건·등록 상태를 확장하지 않음. EVB 구매의 구성ID는 CFG-EVB-C. 서로 다른 구성의 합성 수량을 섞지 않음 | 실제 Agent 미연결; 이번 맥락 회귀 결과는 VALIDATION에 별도 기록 |

현재 변경은 프론트엔드·Mock 데이터 정합화이며 공개 API 의미·회사 접근·작성/승인 분리·정확 버전/멱등성 정책을 바꾸지 않는다. 원문 Quantity를 실장 수·부품 고유 수·구매 수요로 바로 사용하지 않는다. `NA/NS/Opened/Closed`, 빈 값, `Ref**`, 시트명 충돌은 원문 상태/검수 필요로 남긴다.

이번 검증 연결: `tests/workflow-consistency.unit.test.ts`(원문 매핑·구형범위 분리·현재 수량), `tests/v17-purchase.e2e.ts`(새 구매/기존 문서·사진·AI·계획 수량), 기존 `workflow-grid.e2e.ts`(구매/생산·납품), 제품·ABox 검사와 최종 통합 결과는 [VALIDATION.md](VALIDATION.md)의 신규 절을 따른다. 과거 검사 결과를 이번 신규 구현의 통과 근거로 사용하지 않는다.

## 화면 ID → 작업공간·컴포넌트·행동

기존 36개 SD는 설계 식별 단위로 유지한다. 새 라우트가 여러 SD를 합쳐도 원래 필드·예외를 삭제한 것으로 간주하지 않는다. 아래 남은 범위는 후속 구현 목록으로 유지한다.

| 기존 ID / 화면 | 기존 UI | 새 작업공간 / 컴포넌트 | 대응 동작 | UI 범위 | 남은 범위 |
|---|---|---|---|---|---|
| SD-001 제조 운영 현황 | UI01 | `UI01` / WorkbenchHome / WorkQueueTable | 업무5행 비교·동일 조건 필터·객체 선택·다음 조치 | 부분 | 서버 집계·사용자별 업무 큐 미연결. |
| SD-002 보드·개정 관리 | UI02 | `UI01 / EXPLORE / UI02` / ConfigurationTable / ObjectExplorer / ProductSourceTable | 모델7 ID·구성8행의 비교 및 등록 원본4건의 개정·접수 상태·구성 선택 | 부분 | 실제 수집은 POE L/L1 2개. IO-24·SENSE-4·PWR-12 3개는 합성 전체 구성 예시. 원문 지정 POE-ISO·EVB·GATEWAY 전체 BOM 확보/검수 필요. |
| SD-003 전체 BOM·사용 위치 | UI02 | `EXPLORE / UI02` / BomTreeGrid / ProductBomTable / BomReviewPanel / 부품 구성도 | L/L1 각74행·128참조 표기, 원본 개정+행 ID·사진/객체·원문·읽기 전용 정합성 표·기존 설계 관계·부품 이미지 구성도 | 부분 | 참조 표기 ≠ 실제 장착. 회로도/데이터시트 대조·사진 부품 좌표 미연결. 다단계 구조는 확인된 부모·자식 또는 명시된 합성 예시에 한정. |
| SD-004 원본 접수·추출·매핑 | UI02 | `UI02` / Product / ProductSourceTable / ProductRegistrationTable / auditBom | 대표 원본 접수·해시·보기 개정/입력 변형 검사, 현재 등록 입력 요약·검토 초안 | 부분 | 대표4개 해시 식별. 범용 PDF/CSV/ODS 파서·격리 분석 미연결. 접수 해시와 L1 고정 등록 근거 불일치 가능성을 표시하고 기존 payload/승인 정책과 미결 계약 유지. |
| SD-005 개정별 BOM 비교 | UI02 | `UI02` / ProductBomTable | L/L1 원문 비교·변경 필터·개정별 보기 상태 보존 | 부분 | 같은 위치 비교는 개정 간 동일품/호환성 승인 아님. L/L1 비교 외 실제 개정쌍 미확보. |
| SD-006 구매 요청 | UI07 | `PURCHASE / UI07` / Procurement / PurchaseRequestTable / Planning | 구매 요청 초안·품목/수량/필요일/근거 비교 | 부분 | 실제 구매 서비스·수신 모듈 인수 미연결. |
| SD-007 공급사 견적 비교 | UI07 | `PURCHASE` / PurchaseQuoteTable / SupplierQuoteCards | 공급사 A/B 카드에서 MOQ/배수 계산 주문량·비용·공급량·납기 가정·미확인 비교 | 부분 | 기존 합성 견적2건. 실제 가격·납기·외부 공급 확인 없음. |
| SD-008 내부 발주·공급 확인 | UI07 | `PURCHASE` / PurchaseOrderTable / SupplyConfirmationTable | 내부 발주·확인 누계/잔량·이번 회신과 근거 비교 | 부분 | 브라우저 내부 문서 단계. 외부 송신·상대 접수 없음. |
| SD-009 품목·로트 재고 | UI07 | `MATERIAL / EXPLORE` / SupplyOverview / MaterialComparisonTable / MaterialInventoryTables / ObjectExplorer | 수급 기본 보기, 품목·로트·예약·합격분 할당 구분·기준시각 | 부분 | L1 BOM74행 중 U2/PART-TPS 1품목 합성 매핑·재고 계산. 실제 재고원장 조회/동시 예약·나머지 품목 계산 미연결. |
| SD-010 부분 입고·검사·완성품 입고 | UI07/UI08 | `UI07 / UI08` / MaterialReceiptTable / ProductionWorkTable / Planning / Fulfillment | 부분 입고·검사 / 완성품 입고 목록과 기존 입력 | 부분 | 대표 입력·합성 반영. 실제 창고·검사 서비스 없음. |
| SD-011 예약·불출·소비·반납 이력 | UI07 | `MATERIAL / UI07 / EXPLORE` / MaterialInventoryTables / Planning / ObjectExplorer | 예약·해제·원문 이력 조회 | 부분 | 예약/해제 외 모든 종류의 임의 수불 사건 등록·정정은 후속 연결. |
| SD-012 생산작업·일정·부분 실적 | UI07/UI08 | `UI07 / UI08` / PlanningWorkTable / ProductionWorkTable / Planning / Fulfillment | 계획·자재 준비 / 부분 생산 누계 비교와 입력 | 부분 | 대표 실적·고정 일정 예시. 실제 설비·인원 일정 계산 없음. |
| SD-013 자재 소요·부족 분석 | UI07 | `MATERIAL / UI07` / SupplyOverview / MaterialComparisonTable / MaterialRequirementsTable / Planning | 비교 부족·계획 미확보·미할당 합격분, 원품·대체·조달 미확인 비교 | 부분 | SYN-MAP-01 대표1품목/수요 계산. 모든 실제 BOM 행의 소요 검수·PART-TPS 공급/견적/필요일 연결 미완료. |
| SD-014 대체소자 검토 | UI07 | `MATERIAL` / MaterialComparisonTable / Materials | 승인 범위·미승인 후보·수량·미확인 비교와 기존 검토 문서 | 부분 | 합성 범위 승인 예시. 실제 기술 승인·사양 검증 없음. |
| SD-015 수요 확인·인계 초안 | UI07 | `UI07` / Planning | 수요 확인·인계 후보 | 부분 | 초안/후보 저장. 실제 H02/H07 수신자의 ACCEPTED 계약 미연결. |
| SD-016 계약 회차·배분 | UI08 | `UI08` / DeliveryRoundTable / Fulfillment | 계약 회차·배정/미출하/출하/도착/운송/잔여약속 비교 | 부분 | 대표 100대 계약과 회차. 임의 계약 라인/다회차 변경은 부분 범위. |
| SD-017 분할 출하·부분 도착 | UI08 | `UI08` / ShipmentTable / ArrivalTable / Fulfillment | 분할 출하·부분 도착 사건과 근거·잔량 비교 | 부분 | 프론트엔드 수량·중복 검증. 서버 원자 트랜잭션·다중 사용자 경합 미검증. |
| SD-018 이행 연결 문서·조건부 전망 | UI08 | `UI08 / UI06` / FulfillmentComparisonTable / Fulfillment / Evidence | 같은 기준 전후 비교·조건부 전망·연결 문서 | 부분 | 조건·관측 부족은 미확인. 실 ETA 엔진 미연결. |
| SD-019 부품 로트 사용처·장착 이력 조사 | UI04 | `UI04 / EXPLORE` / TraceResultTable / TraceEvidenceTable / ObjectExplorer | 시점·기간 결과와 장착 근거 표·관계 경로 | 부분 | AT02 대표 A/B와 별도 TRACE-* 합성 경로. TRACE-*는 운영 수량 집계에 미포함. 실 DB 전체 영향 조사는 미연결. |
| SD-020 개별 보드·부품 로트·운영 등록 | UI03 | `UI03 / EXPLORE` / Boards / ObjectExplorer | 등록 보드·등록 초안 2표, 식별·근거·구성 미확인·정확 초안 확인→검토함 | 부분 | 대표 식별자 등록. 새 보드에 구성/장착을 자동 생성하지 않음. 임의 장착/제거·로트 등록 전체는 부분. |
| SD-021 이력 보완·검토·전후 비교 | UI04/UI05 | `UI04 / UI05` / Trace / TraceResultTable / Reviews | 보완안·승인·저장 조회와 현재 조건/버전 구분·같은 조건 비교 | 부분 | 대표 U104 보완 사례. 임의 정정 모델 전체는 부분. |
| SD-022 클레임 접수·영향 조사 | UI09 | `UI09` / ClaimCaseTable / QualityImpactTable / Claims | 접수 원문·대상/입력 구분·영향 범위/미확인 표 | 부분 | 대표 신고와 직접 입력. 메일/CSV/Excel 수신 파서 없음. |
| SD-023 시험 의뢰·결과 | UI09 | `UI09` / QualityRequestTable / QualityResultsTable / Claims | 저장 의뢰·제공 결과/미검사 표·입력/접수 대상 불일치 UI 가드 | 부분 | 합성 시험팀 자료 연결. 실제 업로드·시험 충돌/정정 검증은 부분. |
| SD-024 구성별 대응·재생산 검토 | UI09 | `UI09 / UI07` / QualityReproductionTable / Claims / Planning | 독립 구성별 수량 비교·재생산 검토 인계 후보 | 부분 | 구성별 독립 검증 예시. 인수된 재생산 수요·실제 작업 지시 없음. |
| SD-025 검토·반영 대기 | UI05 | `UI05` / Reviews / WorkflowTable | 대상·수량 의미·상태·권한·버전 비교 → 정확 버전 검토·승인·반영 | 부분 | UI 권한 시뮬레이션. 서버 identity·원자 반영·정책 검증 없음. |
| SD-026 작성 중 초안 | UI05 | `UI05` / Reviews / WorkflowTable | 작성 중 초안 상태 필터·수량/대상/근거 확인·새 버전 | 부분 | 브라우저 상태. 실 다중 사용자 편집 충돌 없음. |
| SD-027 검토·반영 전체 이력·근거 | UI05/UI06 | `UI05 / UI06 / OPS` / Reviews / WorkflowTable / Evidence / Operations | 이력·원문 근거11건·저장 문서 표, 명시 참조/사진·전체 해시·원문·중복·다운로드 | 부분 | 자유 문서 대상/승인 버전 미등록. 브라우저 근거/감사이며 실제 보관·권한 회수·서버 복구 없음. |
| SD-028 보드·부품 탐색 — 기본 탭 | UI10(통합 추가) | `UI01 / EXPLORE` / ConfigurationTable / ObjectExplorer / TraceGraph / Inspector | 보드·부품 중심 비교·동일 객체 탐색 | 부분 | 소량 합성 관계와 실제 원본 참조. 실 RDF/Neo4j 없음. |
| SD-029 업무 객체·관계 — 전체 지도·경로 | UI10(통합 추가) | `MAP` / Ontology / OntologyObjectTable / OntologyClassBrowser | 기존 업무 군집·허용 객체 비교·점진 확장 유지. 읽기6클래스/5관계와 정확 유형의 현재 객체 목록·사진/상세/AI 연결 | 부분 | 전체 집계 미집계. 10만 원천 생성/적재/부하 검증 미수행. |
| SD-030 버전·조회 기준 | UI10(통합 추가) | `MAP / OPS` / OntologyVersionTable / Operations | 계층별 버전·미연결/조회불가·기준시각과 범위 | 부분 | 버전 표시·모의 상태. 실제 투영 동기화/재구축 없음. |
| SD-031 업무 운영 리포트 | UI11(통합 추가) | `OPS / UI01` / Operations / WorkbenchHome | 수량 상태5행·계산 기준·명시 작업/회차·사진/AI 연결 | 부분 | 합성 운영 집계. 시간 절감·정확도 측정 없음. |
| SD-032 개인 AI 품질·비용 — 로컬 전용 | UI11(개발 전용) | `OPS` / Operations | 개인 모델 평가 미연결·로컬 전용 경계 | 미구현·경계 표시 | 개인 평가 실행·원자료 관리 UI 미구현; 공유 앱에 원자료 포함하지 않음. |
| SD-033 변경·실행 감사 | UI11(통합 추가) | `OPS` / Operations / operations-audit | 감사 원문·중복 표시 ID·상세·검색 조건 전체 JSON | 부분 | 브라우저 감사. 서버 영속 감사·권한 회수 미연결. |
| SD-034 화면·시연 데이터 설정 | UI12(통합 추가) | `공통 헤더 / OPS` / App / Operations | 테마·행 밀도·계정 전환·시연 설정 | 부분 | 프론트엔드 설정. 실 인증·운영 초기화 없음. |
| SD-035 연결·구현 상태 | UI12(통합 추가) | `OPS / TRACE` / Operations / RequirementsWorkspace | 연결 구현9행과 요구45·결정7·수용8·연동경계6의 정의 목록 | 부분 | 구현 상태 설명. 실제 서비스 수용/사용자 인수 미수행. |
| SD-036 공통 개발·Agent 연결 안내 | UI12(개발 전용) | `OPS` / Operations / operations-ports | 공통 포트6행·실제 어댑터 미연결·공통/Agent 책임 경계 | 부분 | 논리 포트/연결 안내. 동료 Agent·실 Host 미연결. |

## 상세 패널 ID → 재사용 동작

새 디자인에서는 패널 번호를 별도 페이지로 강제하지 않는다. 작업공간 폼·ActionDialog·Inspector·근거 모달로 합친다. 모든 확정 사실은 작성자/승인자 분리와 정확 버전 경로를 사용해야 하며, 예약·해제에 무조건 별도 2인 승인을 추가하지 않는다.

| 기존 ID / 기능 | 새 위치 / 동작 | 보존해야 하는 입력·검증 | 구현 범위 |
|---|---|---|---|
| PNL-01 생산 수요 확인·초안 | `UI07` / Planning 수요 입력 | 원문서/버전, 구성, 정상수요/투입수량 구분, 단위, 필요일, 사유·근거, 담당자 / 모호한 구성·누락수량 보완. 저장만으로 계약/예약/job 확정 아님. | 부분; 실 서버 미연결 |
| PNL-02 원문과 추출값 대조 | `UI02 / UI06` / Product 추출 대조 / Evidence | 원본 미리보기·시트/행/페이지, 원문/추출/수정값, 수량·단위·위치·DNP·unknown, source_hash / 손상/미지원/OCR 미구현을 분리. 미확인 값을 합성으로 채우지 않음. | 부분; 실 서버 미연결 |
| PNL-03 품목 식별·매핑 후보 | `UI02` / Product 매핑 검토 | 원문 MPN·제조사, 공급사 상품코드, 사내품목 후보·분류·기준 버전·근거 / 유사도나 같은 외형은 동일품 확정 근거 아님. 대체 후보 별도. | 부분; 실 서버 미연결 |
| PNL-04 변경안·기술검토 초안 | `UI02 / MATERIAL / UI05` / 초안 준비 → Reviews | 원대상 버전, 변경 전후, 적용 위치·조건·기간, 근거, 작성자, 검증 오류·경고 / 자기승인 불가. 의존 변경은 같은 승인 묶음. 전체 통과와 경고 허용 구분. | 부분; 실 서버 미연결 |
| PNL-05 구매 요청 문서 | `PURCHASE / UI07` / 구매 요청 문서 | 원수요·부족라인·품목·수량·필요일·대체상태·근거·담당자·수신범위 / 문서 다운로드≠전송/공급확약. 다른 요청의 부족분 복사 금지. | 부분; 실 서버 미연결 |
| PNL-06 내부 발주 초안 | `PURCHASE` / 내부 발주 초안 | 요청/견적/구성·품목 버전, MOQ/배수 주문량, 통화·단가·비용 미확인, 납기전제 / 실외부 발주 권한 자동 활성화 금지. 승인 뒤 수량/공급사 변경이면 재검토. | 부분; 실 서버 미연결 |
| PNL-07 공급 확인 기록 | `PURCHASE` / 공급 확인 기록 | 발주라인, 공급사 회신·원문, 확인수량·납기·조건·실제/모의·발생/기록시각 / 회신없는 공급량 생성 금지. 중복 회신 사건키 검사. | 부분; 실 서버 미연결 |
| PNL-08 재고 예약·해제·할당 | `UI07 / MATERIAL` / 예약·해제·할당 | 수요·job·품목/로트·위치·가용·자기예약·타예약·선택수량·version / 일괄 2인승인 추가하지 않음. 대체 유효범위 밖 금지. 동시/중복 초과 차단. | 부분; 실 서버 미연결 |
| PNL-09 부품 부분 입고·검사 | `UI07` / 부분 입고·검사 | 발주라인·도착수량·합격/불합격/대기·검사근거·시각·event key / 도착=세 상태 합. 대기·불합격 가용 증가 금지. 원주문/실도착 상한. | 부분; 실 서버 미연결 |
| PNL-10 불출·소비·반납·폐기·이동 | `EXPLORE / UI07` / 수불 사건 조회; 임의 기록 부분 | 사건유형·원사건·lot·출발/도착 위치·수량·단위·job·근거·version / 물리 수량 보존·예약 중복차감·타job 소비 금지. 반납/정정은 이전 사건 참조. | 부분; 실 서버 미연결 |
| PNL-11 부분 생산실적 | `UI08` / 부분 생산실적 초안 | job·관측/발생시각·증분 실적수량·양품·불량·판정대기·output lot·근거 / 증분 입력과 누계 표시 명시. 누계 파일 수입은 변환 검증. 미래실적·중복·음수 금지. | 부분; 실 서버 미연결 |
| PNL-12 완성품 입고 | `UI08` / 완성품 입고 초안 | job/report/output lot·품질확인·이번 입고수량·기존 입고·미입고·근거 / 입고≤원양품 잔량. 생산완료가 자동입고 아님. 부품입고와 다른 문서유형. | 부분; 실 서버 미연결 |
| PNL-13 계약 회차 배분 | `UI08` / 명시적 회차 배정 | 원job/입고로트, 현재/미래 물량 구분, 회차별 배분·잔량·구성·version / 전체 회차 배분≤원천. 임의 FIFO 금지. 미래 배분을 현재출하 재고로 사용 금지. | 부분; 실 서버 미연결 |
| PNL-14 분할 출하 초안 | `UI08` / 분할 출하 초안 | 회차·배분·원천로트·이번수량·목적지·예정/실제출발·근거 / 배분·출하가능 상한/중복/미래 실제시각 검사. 출하≠납품완료. | 부분; 실 서버 미연결 |
| PNL-15 부분 도착 초안 | `UI08` / 부분 도착 초안 | shipment·기존도착·미도착·이번수량·실제시각·근거·event key / 예정시각 지나도 자동 도착 없음. shipment15에12+4 거부. 기존12 보존. | 부분; 실 서버 미연결 |
| PNL-16 문서·근거 검색/상세 | `UI06 / 공통` / Evidence / 근거 모달 | 검색조건·문서종류·실제/합성·허용scope·대상·버전·source_hash·locator / 유사도≠신뢰도, 권한없는 원문/사진/경로 비노출. 해시불일치 검증 완료 금지. | 부분; 실 서버 미연결 |
| PNL-17 실물 사진·출처·위치 주석 | `공통` / Media 상태·확대·출처 | asset_id/hash·photo/cad/drawing·출처·rights·model/revision/part binding·검수·면·좌표 / 비율 유지·미등록 허용. 최신 사용자 지시에 한해 AI 외형 참고 허용(배지·확대 고지 필수); 실제 사진으로 표현 금지. 사진만으로 동일품/장착/승인 판정 금지. | 부분; 실 서버 미연결 |
| PNL-18 업무 인계 확인 | `UI07 / UI09` / 인계 후보와 결과 구분 | source ID/version·target type·구성·quantity/unit·근거·받는 역할·idempotency / 페이지 이동=ACCEPTED 금지. 부분 accepted+remaining=원수량. 새 의도는 새 검토. | 부분; 실 서버 미연결 |
| PNL-19 실행 결과·접수 대사 | `UI05 / 공통` / 반영 결과·같은 요청 재조회 | action/request/idempotency·payload hash·현재상태·원장/모의접수 ID·시각 / 무조건 새 POST 재전송 금지. 같은키 다른내용 충돌. UI 취소≠트랜잭션 롤백. | 부분; 실 서버 미연결 |
| PNL-20 생산 일정·계획서 | `UI07` / 조건부 일정·계획서 | 유효 표준시간·라인·인원·교대·휴무·휴게·점유·자재조건·근거·plan_version / 자료없음은 가정/미확인. 일정안≠장비예약/생산승인. 저장 직전 stale 재검사. | 부분; 실 서버 미연결 |
| PNL-21 최초 보드·로트·장착 운영 등록 | `UI03` / 실물 식별 등록 초안 | 회사·scoped ID·구성·board/lot·시각·위치·장착/제거·근거·확인범위 / 존재하지 않는 참조·중복ID 거부. 실제 장착은 설계 BOM만으로 채우지 않음. | 부분; 실 서버 미연결 |
| PNL-22 이력 보완안 | `UI04` / 이력 보완안 | 기존기록·새 자료·제거시각·재장착없음 확인범위·query signature / 제거일≠coverage 종료. 조건 고정 없이 전후 비교 금지. | 부분; 실 서버 미연결 |
| PNL-23 신고 접수·중단 요청 문서 | `UI09` / 신고·중단/보류 검토 요청서 | 원신고·보드 후보·라인/구성·사유·시각·대상·근거·수신자 / 실제 중단/현장제어/외부송신 완료 아님. 증상만으로 원인단정 금지. | 부분; 실 서버 미연결 |
| PNL-24 시험 의뢰·제공 결과 등록 | `UI09` / 시험 의뢰·제공 결과 | claim·시료·시험기준·조건·단위·result·조치판정·원문·execution/version / 시험팀 근거밖 결과 생성 금지. 의뢰대상밖 결과·다른사건·누락출처 차단. | 부분; 실 서버 미연결 |

## 원본 요구사항 ID 보존

원본 45개 요구사항은 다음에 연결된다. 원본 v1.3의 `D05 미결` 표현은 부분 도착 채택을 반영하여 사용하지 않는다. 이 표는 ID를 재번호화하지 않으며 v1.5 R12 요구는 다음 표에서 추가로 연결한다.

| 요구 ID | 기능 | 새 작업공간·동작 | 기존 수용 ID |
|---|---|---|---|
| UX01 | 업무 목적을 읽을 수 있는 화면 | 공통 shell / Inspector / Action | AT07 |
| UX02 | 현황에서 재개 | UI01 / WorkbenchHome; 공통 shell / Inspector / Action | AT07 |
| UX03 | 업무별 안내 | UI01 / WorkbenchHome; 공통 shell / Inspector / Action | AT07 |
| EV01 | 찾고 확인 | UI06 / Evidence + OPS | AT01 |
| EV02 | 업무에 연결 | UI06 / Evidence + OPS | AT01 |
| REG-01 | 원본 접수 | UI02 / Product + EXPLORE; UI05 / Reviews | AT01 |
| REG-02 | 추출 확인 | UI02 / Product + EXPLORE; UI05 / Reviews | AT01 |
| REG-03 | 초안과 검토 | UI02 / Product + EXPLORE; UI05 / Reviews | AT01 |
| REG-04 | 결과 재사용 | UI02 / Product + EXPLORE; UI05 / Reviews | AT01 |
| TRC-04 | 운영 등록 | UI03 / Boards + EXPLORE; UI04 / Trace + EXPLORE; UI05 / Reviews | AT02 |
| TRC-01 | 식별과 조건 | UI03 / Boards + EXPLORE; UI04 / Trace + EXPLORE; UI05 / Reviews | AT02 |
| TRC-02 | 판정과 근거 | UI03 / Boards + EXPLORE; UI04 / Trace + EXPLORE; UI05 / Reviews | AT02 |
| TRC-03 | 보완과 비교 | UI03 / Boards + EXPLORE; UI04 / Trace + EXPLORE; UI05 / Reviews | AT02 |
| RV01 | 변경 검토 | UI05 / Reviews | AT03 |
| RV02 | 버전과 반영 | UI05 / Reviews | AT03 |
| RV03 | 재시도와 기록 | UI05 / Reviews | AT03 |
| PLN-01 | 수요 확인 | MATERIAL + PURCHASE + UI07 / Planning | AT04 |
| PLN-02 | 소요와 부족 | MATERIAL + PURCHASE + UI07 / Planning | AT04 |
| PLN-03 | 예약과 해제 | MATERIAL + PURCHASE + UI07 / Planning | AT04 |
| PLN-04 | 구매 요청 | MATERIAL + PURCHASE + UI07 / Planning | AT04 |
| PLN-05 | 입고와 검수 | MATERIAL + PURCHASE + UI07 / Planning | AT04 |
| PLN-06 | 계획별 할당 | MATERIAL + PURCHASE + UI07 / Planning | AT04 |
| PLN-07 | 일정과 문서 | MATERIAL + PURCHASE + UI07 / Planning | AT04 |
| FUL-01 | 약속과 회차 | UI08 / Fulfillment; UI05 / Reviews | AT05 |
| FUL-02 | 부분 생산 | UI08 / Fulfillment; UI05 / Reviews | AT05 |
| FUL-03 | 입고와 배정 | UI08 / Fulfillment; UI05 / Reviews | AT05 |
| FUL-04 | 여러 출하 | UI08 / Fulfillment; UI05 / Reviews | AT05 |
| FUL-05 | 도착 등록 | UI08 / Fulfillment; UI05 / Reviews | AT05 |
| FUL-06 | 예상과 대응 | UI08 / Fulfillment; UI05 / Reviews | AT05 |
| FUL-07 | 변경 전후 | UI08 / Fulfillment; UI05 / Reviews | AT05 |
| CLM-01 | 신고 확인 | UI09 / Claims | AT06 |
| CLM-02 | 영향 조사 | UI09 / Claims | AT06 |
| CLM-03 | 중단 요청서 | UI09 / Claims | AT06 |
| CLM-04 | 시험 의뢰 | UI09 / Claims | AT06 |
| CLM-05 | 결과 집계 | UI09 / Claims | AT06 |
| CLM-06 | 재생산 검토 | UI09 / Claims | AT06 |
| AI01 | 조건과 행동 | 공통 AgentPort / 업무 AI | AT07 |
| AI02 | 공통 실행 | 공통 AgentPort / 업무 AI | AT07 |
| AI03 | 결과 확인 | 공통 AgentPort / 업무 AI | AT07 |
| CM01 | 근거와 자료 | 공통 shell / Inspector / Action; UI06 / Evidence + OPS | AT08 |
| CM02 | 권한과 보안 | 공통 shell / Inspector / Action; UI06 / Evidence + OPS | AT08 |
| CM03 | 누적 한도 | 공통 shell / Inspector / Action; UI06 / Evidence + OPS | AT08 |
| CM04 | 복구와 영속성 | 공통 shell / Inspector / Action; UI06 / Evidence + OPS | AT08 |
| CM05 | 호환성과 그래프 | 공통 shell / Inspector / Action; UI06 / Evidence + OPS | AT08 |
| CM06 | 운영 준비 | 공통 shell / Inspector / Action; UI06 / Evidence + OPS | AT08 |

## 통합 요구·인계·공통 UI 등록부

공통 요구의 각 ID에 대응 경로를 남긴다. 수용 ID는 구현 목표/시험 식별자이며 이 표만으로 통과를 의미하지 않는다.

| ID | 보존 내용 | 대응 작업공간·컴포넌트 / 검사 |
|---|---|---|
| R12-INV-01 | 사업장·창고·위치·로트·품질별 보유/가용/예약을 조회 | MATERIAL / Materials; UI07 / Planning; EXPLORE / Inspector |
| R12-INV-02 | BOM 전개·실장 상태·단위·여유 정책으로 필요량 계산 | MATERIAL / Materials; UI07 / Planning; EXPLORE / Inspector |
| R12-INV-03 | 공유 재고의 원자적 예약·해제 | MATERIAL / Materials; UI07 / Planning; EXPLORE / Inspector |
| R12-INV-04 | 불출·소비·반납·폐기·이동을 사건별로 기록 | MATERIAL / Materials; UI07 / Planning; EXPLORE / Inspector |
| R12-INV-05 | 사내 대체 후보·승인 범위를 확인 | MATERIAL / Materials; UI07 / Planning; EXPLORE / Inspector |
| R12-PUR-01 | 견적 후보를 품번·수량·MOQ·주문배수·통화·단가·운송비·납기·유효기간으로 비교 | PURCHASE / Procurement / SupplierQuoteCards 공급사별 카드; UI07 입고·검사; UI05 정확 버전 검토 |
| R12-PUR-02 | 구매 요청→검토→내부발주→공급사 확인 문서 연결 | PURCHASE / Procurement; UI07 입고·검사; UI05 정확 버전 검토 |
| R12-PUR-03 | 발주 라인별 부분 입고·검사 결과 반영 | PURCHASE / Procurement; UI07 입고·검사; UI05 정확 버전 검토 |
| R12-PUR-04 | 취소·수량변경·중복 회신·응답유실 처리 | PURCHASE / Procurement; UI07 입고·검사; UI05 정확 버전 검토 |
| R12-PLN-01 | 생산 수요를 configuration/version과 고정 job에 연결 | UI07 계획·수요 / UI08 부분 실적·입고 |
| R12-PLN-02 | 자재·설비/인원/교대 입력에 근거한 부분 계획 | UI07 계획·수요 / UI08 부분 실적·입고 |
| R12-PLN-03 | 부분 생산실적의 양품·불량·판정대기 기록 | UI07 계획·수요 / UI08 부분 실적·입고 |
| R12-PLN-04 | 양품을 작업·출력 로트와 연결해 완성품 입고로 인계 | UI07 계획·수요 / UI08 부분 실적·입고 |
| R12-FUL-01 | 계약 라인·회차의 약속 수량·도착기한을 버전 관리 | UI08 / Fulfillment; UI01 같은 회차 수량 |
| R12-FUL-02 | 완성품 입고 후 회차별 수량·로트 배분 | UI08 / Fulfillment; UI01 같은 회차 수량 |
| R12-FUL-03 | 한 회차에 여러 shipment 생성 | UI08 / Fulfillment; UI01 같은 회차 수량 |
| R12-FUL-04 | 한 shipment에 여러 부분 arrival 기록 | UI08 / Fulfillment; UI01 같은 회차 수량 |
| R12-FUL-05 | 잔량·미확인·정정·반품을 구분 | UI08 / Fulfillment; UI01 같은 회차 수량 |
| R12-TRC-01 | 개별 board_instance를 승인 구성·실물/로트 범위에 연결 | UI03 / Boards; UI04 / Trace; EXPLORE / TraceGraph |
| R12-TRC-02 | 장착/제거를 위치·로트·시각·근거로 저장 | UI03 / Boards; UI04 / Trace; EXPLORE / TraceGraph |
| R12-TRC-03 | 특정 시점 A와 조사기간 B의 [start,end) 겹침을 조회 | UI03 / Boards; UI04 / Trace; EXPLORE / TraceGraph |
| R12-TRC-04 | 이력 보완→다른 검토자→반영→동일 조건 재조회 | UI03 / Boards; UI04 / Trace; EXPLORE / TraceGraph |
| R12-CLM-01 | 클레임을 계약/출하/도착/개별 보드·로트에 가능한 범위로 연결 | UI09 / Claims; UI07 인계 후보; UI05 검토 |
| R12-CLM-02 | 시험 스키마·기준·단위·시료·범위·실행 결과 등록 | UI09 / Claims; UI07 인계 후보; UI05 검토 |
| R12-CLM-03 | 구성별 영향·확인/미확인/충돌과 대응 초안 | UI09 / Claims; UI07 인계 후보; UI05 검토 |
| R12-CLM-04 | 승인 응답에서 재생산 수요 초안 생성 | UI09 / Claims; UI07 인계 후보; UI05 검토 |
| H01 | 기준정보 모듈 → 계획·이행 모듈 | 공통 ActionPort·인계 문서; 해당 원업무/수신 문서 링크; 실제 ACCEPTED 수신 계약 미연결 |
| H02 | 이행 모듈 → 계획 모듈 | 공통 ActionPort·인계 문서; 해당 원업무/수신 문서 링크; 실제 ACCEPTED 수신 계약 미연결 |
| H03 | 계획·재고 모듈 → 구매 모듈 | 공통 ActionPort·인계 문서; 해당 원업무/수신 문서 링크; 실제 ACCEPTED 수신 계약 미연결 |
| H04 | 구매 모듈 → 입고·재고 모듈 | 공통 ActionPort·인계 문서; 해당 원업무/수신 문서 링크; 실제 ACCEPTED 수신 계약 미연결 |
| H05 | 생산 모듈 → 입고·이행 모듈 | 공통 ActionPort·인계 문서; 해당 원업무/수신 문서 링크; 실제 ACCEPTED 수신 계약 미연결 |
| H06 | 이행 모듈 → 추적·품질 모듈 | 공통 ActionPort·인계 문서; 해당 원업무/수신 문서 링크; 실제 ACCEPTED 수신 계약 미연결 |
| H07 | 추적·품질 모듈 → 계획 모듈 | 공통 ActionPort·인계 문서; 해당 원업무/수신 문서 링크; 실제 ACCEPTED 수신 계약 미연결 |
| H08 | 모든 모듈 → 공통 담당 | 공통 ActionPort·인계 문서; 해당 원업무/수신 문서 링크; 실제 ACCEPTED 수신 계약 미연결 |
| DEV-ID-01 | 로컬 개발에서만 `dev_switch` 제공. 회원가입·비밀번호·실 OIDC는 이번 착수 대상에서 제외 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| DEV-ID-02 | 브라우저는 서버 allowlist의 `dev_profile_id`만 선택. actor·tenant/site·권한은 서버가 조회 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| DEV-ID-03 | 개발 계정은 불변 내부 `actor_id`를 갖고 권한 프로필과 분리 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| DEV-ID-04 | 계정마다 회사·사업장·업무 행위 범위를 서버에서 검사, 기본 거부 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| DEV-ID-05 | 계정 선택/전환은 서버 세션 단위이며 전역 current_user를 사용하지 않음 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| DEV-ID-06 | 전환 시 이전 세션을 무효화하고 신원 문맥 버전을 새로 발급 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| DEV-ID-07 | 실행·초안·승인·반영에는 요청 시작 당시 신원과 현재 허용 범위를 함께 검증 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| DEV-ID-08 | 미저장 입력과 실행 중 작업을 알리고, 이전 계정의 UI 캐시·AI 스트림·선택·다운로드 준비를 정리 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| DEV-ID-09 | 개발 선택/전환/종료와 업무 행위를 구분한 감사 기록 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| DEV-ID-10 | `local/test` 이외 환경은 개발 선택기 활성화를 거부. 인증 설정이 없으면 안전하게 시작/요청 거부 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| R12-UI-01 | 사업장·담당자·도착기한·검색으로 조회 | UI01 / WorkbenchHome; 공통 EntityChip·Inspector·AI·Media |
| R12-UI-02 | 계약 라인·회차별 이행 목록과 선택 상세 | UI01 / WorkbenchHome; 공통 EntityChip·Inspector·AI·Media |
| R12-UI-03 | 선택 회차의 수량 분해와 근거 | UI01 / WorkbenchHome; 공통 EntityChip·Inspector·AI·Media |
| R12-UI-04 | 내 검토·자재·입고 업무로 상세 이동 | UI01 / WorkbenchHome; 공통 EntityChip·Inspector·AI·Media |
| R12-UI-05 | 선택 문서·버전 기반 우측 업무 AI | UI01 / WorkbenchHome; 공통 EntityChip·Inspector·AI·Media |
| R12-UI-06 | 실제사진/참고사진/CAD/미등록 표시 | UI01 / WorkbenchHome; 공통 EntityChip·Inspector·AI·Media |
| G-01 | 온톨로지의 세 탭 | EXPLORE / ObjectExplorer·BomTreeGrid·TraceGraph; MAP / Ontology |
| G-02 | 보드 모델 → 개정 → 조립 구성 → BOM 항목 → 사내 품목 | EXPLORE / ObjectExplorer·BomTreeGrid·TraceGraph; MAP / Ontology |
| G-03 | 검색·분류 필터·범위 표시 | EXPLORE / ObjectExplorer·BomTreeGrid·TraceGraph; MAP / Ontology |
| G-04 | 노드·관계선 선택과 상세 | EXPLORE / ObjectExplorer·BomTreeGrid·TraceGraph; MAP / Ontology |
| G-05 | 확대·축소·이동·맞춤·선택 관계 보기 | EXPLORE / ObjectExplorer·BomTreeGrid·TraceGraph; MAP / Ontology |
| G-06 | 재고·대체 관계 확장 | EXPLORE / ObjectExplorer·BomTreeGrid·TraceGraph; MAP / Ontology |
| G-07 | 사용처 역탐색과 BOM 이동 | EXPLORE / ObjectExplorer·BomTreeGrid·TraceGraph; MAP / Ontology |
| G-08 | 구성별 원천·빈 상태·미확인 | EXPLORE / ObjectExplorer·BomTreeGrid·TraceGraph; MAP / Ontology |
| G-09 | 원장/투영 버전과 조회 모드 | EXPLORE / ObjectExplorer·BomTreeGrid·TraceGraph; MAP / Ontology |
| AI-01 | 데스크톱 업무 화면에서 기본 열림 | AgentPort / 고정 선택 맥락·늦은 응답 배제·명시 전송; 실제 모델 미연결 |
| AI-02 | 접기·펼치기와 메뉴별 상태 | AgentPort / 고정 선택 맥락·늦은 응답 배제·명시 전송; 실제 모델 미연결 |
| AI-03 | 좁은 화면·설정·평가의 기본값 | AgentPort / 고정 선택 맥락·늦은 응답 배제·명시 전송; 실제 모델 미연결 |
| AI-04 | 업무 대상·권한·버전 고정 | AgentPort / 고정 선택 맥락·늦은 응답 배제·명시 전송; 실제 모델 미연결 |
| AI-05 | 질문 초안과 대화의 분리 | AgentPort / 고정 선택 맥락·늦은 응답 배제·명시 전송; 실제 모델 미연결 |
| AI-06 | 그래프·BOM·문서와 연결 | AgentPort / 고정 선택 맥락·늦은 응답 배제·명시 전송; 실제 모델 미연결 |
| AI-07 | 읽기·제안·승인·실행 분리 | AgentPort / 고정 선택 맥락·늦은 응답 배제·명시 전송; 실제 모델 미연결 |
| MK-01 | 메뉴 이동 후 같은 회차·구성·작업·문서 유지 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-02 | DRAFT/IN_REVIEW/APPROVED/POSTED 분리 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-03 | 작성자·검토자·읽기 역할의 시연 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-04 | 모든 화면의 같은 수량 원천 사용 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-05 | 부분 실적·입고·출하·도착 상한 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-06 | 버전·멱등성·충돌 처리 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-07 | 시연 상태 보관·초기화 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-08 | 로컬 사진·수동 RefDes 시험 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-09 | 고정 AI 설명·평가 미측정 표시 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-10 | 합성 8행·미등록 구성 구분 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-11 | fixture 기준시각·실제 조작시각 분리 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| MK-12 | 모의 쓰기 실패 시 상태 복원 | 공통 shell·ports·domain; UI01~09 / EXPLORE / MATERIAL / PURCHASE / MAP / OPS |
| X01 | 네 모델 전체 BOM·근거 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X02 | 실제 개정/구성 비교 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X03 | 네 모델 동시 수요·공유 재고 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X04 | 대체 범위 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X05 | 구매 조건 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X06 | 부분 입고·검사 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X07 | 부분 생산·복수 출하 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X08 | 부분 도착 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X09 | 보드·시간·완전성 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X10 | 클레임·시험·응답 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X11 | 버전·승인·중복·동시성 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| X12 | UI/AI/RDF/Neo4j 동등성 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-01 | 카드·필터·행 선택 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-02 | 한 job을 두 회차로 배분 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-03 | 동일 arrival 외부 키 반복 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-04 | shipment15에 arrival12+4 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-05 | 예약 후 불출/소비/반납 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-06 | review 후 초안 수정 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-07 | 접수 성공 후 응답유실 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-08 | 다른 회사 동일 로트 문자열 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-09 | source_hash·정책·구성 변경 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-10 | 사진 개정 미확인·로드 실패 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-11 | 일반 사용자 direct API/미디어 접근 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-12 | claim 수량만 있고 보드 ID 없음 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-13 | graph127/ledger128 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-14 | 자동 계획→구매/재생산 초안 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T12-15 | 사진 또는 문서의 지시문 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-01 | 온톨로지 최초/명시 경로 진입 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-02 | 모델·개정·구성·BOM 행·품목 선택 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-03 | 매핑 5행/전체 8행 fixture 검색·필터 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-04 | 미등록 구성/필터0/권한 없음/조회 오류 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-05 | 동일 사내 품목의 여러 BOM 행 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-06 | C7 한정 대체 승인·C8 사용 시도 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-07 | 같은 구성을 두 회차가 참조한 사용처 검색 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-08 | 그래프→BOM→그래프 왕복 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-09 | 원장128/투영127 및 부분 조회 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-10 | 확대·이동·접기·관계 선택·필터 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-11 | 1,366/1,680px 업무 화면, 개인 선택 없음 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-12 | 접기→같은 메뉴 재진입→다른 메뉴 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-13 | 1,099/1,100px 및 settings/evaluation | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-14 | U3→C7,C8 선택·관계 질문 버튼 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-15 | A 질문 중 B 선택, A 응답 지연 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-16 | ledger 불변, draft_version만 변경 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-17 | 동일 맥락 질문 초안 복원·권한 회수 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-18 | 키보드 선택·사진 없음·패널 접힘 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-19 | BOM 순서 변경·노드 재배치 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| T13-20 | UI/AI/그래프 같은 대상·시각·버전 질의 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| AT01 | L1 WROOM 원본→L 비교→초안→다른 검토자→동일 확정 구성 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| AT02 | U104 보완 후 시점 A 제외/기간 B 포함, U106 추가 확인 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| AT03 | 자기 승인·구버전·같은 키 다른 내용·부분반영 차단 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| AT04 | 수요→부족→예약→검사 합격분 할당→조건부 일정 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| AT05 | 부분 생산·입고·20/15 분할 출하·도착 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| AT06 | 신고→이력→요청서→시험팀 결과→구성별 재생산 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| AT07 | 직접/AI 동일 조건·누락·오류·권한·근거 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| AT08 | PostgreSQL/RDF/Neo4j 동일 조건·버전의 구조화 판정 | 공통 fixture·도메인/포트 검사 + 관련 SD/PNL의 브라우저 경로; 수행 여부는 검증 보고 확인 |
| SCALE-01 | 4종/5 전체 BOM manifest와 public/synthetic 구분. 10만 하한은 core 업무 객체만 충족 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| SCALE-02 | 같은 seed/버전 재생성의 논리 ID/내용 동일. 재적재 중복 없음 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| SCALE-03 | 원장/RDF/Neo4j의 같은 snapshot 업무 ID·유형·판정·근거 일치 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| SCALE-04 | stats 합계·종류별 분포·origin·scope·완전성이 일치. 지원/추론/투영복사본 제외 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| SCALE-05 | 이웃/고연결 대상 제한이 실제 서버 탐색에 적용. 부분 응답을 전체 판단으로 사용하지 않음 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| SCALE-06 | 소량 렌더에서도 전체 데이터 검색·페이지·다운로드 접근 가능. 불변 ID와 맥락 유지 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| SCALE-07 | 부분 입고·부분 생산·분할 출하·부분 도착 수량과 시점 A/기간 B 판단 불변 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| SCALE-08 | 투영 실패·취소·만료 cursor·권한 회수·응답 유실의 상태가 명확하며 안전한 재시작 가능 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| T15-01 | dev on/off, 잘못된 env, 미선택/만료, 알 수 없는/비활성 계정, 부적절 Origin | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| T15-02 | actor/role/회사 위조, 읽기전용 쓰기, 같은 actor의 역할 변경, A초안→B승인 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| T15-03 | 객체 직접조회·RAG·그래프·통계·사진·원문, 다른 tenant 프로필 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| T15-04 | 독립 세션, 같은 브라우저 오래된 탭, 전환과 write/UNKNOWN, 세션 재사용 | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| T15-05 | 늦은 stream, 부모 회수 후 Tool 호출, checkpoint 재개, commit 후 outbox | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| T15-06 | 전환 감사, 같은 키로 다른 actor 접근, 재시작 seed, provider adapter | IdentityPort / 계정 전환·회사 범위·UI 시뮬레이션; 실제 서버 검증 미연결 |
| LOAD-01 | 검수 원본→합성 업무 원천 생성+로컬 불변식 검증 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| LOAD-02 | 원장→RDF/Neo4j/구조화 조회 색인 준비, 정확 집계 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| LOAD-03 | 입력 유효성 검사→scope/권한→조회→직렬화까지 HTTP 요청 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| LOAD-04 | bounded 이웃 조회 및 업무 추적 template | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| LOAD-05 | 수신 완료→레이아웃·선택 가능, 실제 사용자 진입 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |
| LOAD-06 | 권한/버전/시간/수량/동시성 및 회복 | MAP / GraphPort·QueryMeta·표시 가드레일·목록 대안; 10만 생성/적재/부하 검증 미수행 |

## 이번 요청에서 추가된 표현·상호작용

| 추가 요구 | 대응 | 완료 판단의 경계 |
|---|---|---|
| 객체 칩과 250ms 미리보기 | EntityChip / PreviewCard / Inspector | 포커스·클릭·Esc·포인터 유지 확인 필요. 권한없는 이름/사진/개수 노출 금지 |
| 표·트리·그래프·AI 같은 객체 | SelectionContext의 불변 ID / ObjectExplorer | 정렬·탐색 후에도 동일 회사·ID·버전. 탐색 이력은 분류 계층이 아님 |
| 라이트 기본·다크·밀도 | 공통 토큰 / App | 사용자 선택 저장; 변경만으로 원장 버전·모델 호출 없음 |
| 관리자 TBox 초안 | MAP / Ontology | 격리된 초안·diff·모의 검증·검토 요청. 운영 적용은 계약 미연결로 비활성 |
| TBox/SHACL/정책/트리거 구분 | Ontology 클래스·관계 편집 유형 | 캔버스 좌표와 의미 변경 구분. 실제 OWL/SHACL 엔진이 아님 |
| 참조 이미지 정직성 | MediaPort / 미등록 상태 | 첨부 media_manifest 제품 이미지 0개. 추가 요청으로 공식 모델 참고 사진과 명시적 AI 참고 자산 등록; MEDIA_ASSET_AUDIT.md/CSV에 실제 수 집계. UI 스크린샷을 실물 사진으로 사용하지 않음 |
| 상태별 액션 | ActionBar / ActionDialog / ActionPort | 권한·대상·선행조건·정확 버전. UI 성공과 서버/물리 실행을 구별 |
| 원문 부재·0·오류·권한·부분·stale | 공통 조회 상태와 QueryMeta | 자료 없음이나 실패를 0·정상으로 표시하지 않음 |

## 결정·인계 계약 ID

| 기존 ID | 재설계 적용 | 현재 범위 |
|---|---|---|
| DEC-SCOPE | 구매·내부발주·공급확인·부분입고·검사·부분도착을 PURCHASE/UI07/UI08에 유지 | 프론트엔드·모의 문서, 실제 외부 송신 없음 |
| DEC-GRAPH | 기본은 보드·부품 객체 탐색, 전체 지도·버전 경로 별도 유지 | MK-R2 고정 배치만 현재 사용자 요청으로 대체 |
| DEC-SCALE / PERF-100K | MAP의 집계·범위·가드레일과 전체 목록 | 10만은 목표, 현재 집계 미집계 |
| DEC-OWNER | 공통 담당의 데이터·SDK·계산·DB·UI·인프라·통합 책임 | 화면에서 동료에게 DB/합성 데이터 구축 요구 없음 |
| DEC-AGENT | AgentPort 경계를 통한 구조화 요청/결과 | Agent 내부 import 없음; 실제 Agent 미연결 |
| DEC-EVAL | OPS에 운영 현황·감사 유지, 개인 평가 원자료 분리 | 개인 원자료 포함·공유 없음 |
| DEC-TEST | 공통 fixture/테이블 기반 핵심 경계 검사 | 서버/부하 시험은 별도 미검증 |
| DEC-IDENTITY | local/test 개발 계정과 전환·범위 경계 | UI 시뮬레이션; OIDC 후속 |
| DEC-FPGA | 네 전자보드 모델·최소 5 전체 BOM 목표 유지 | FPGA 없음; 실제 수집 범위 별도 표시 |
| D01 | 출처·대상·버전·수량·근거·인수자 계약 보존 | 화면 이동/후보 저장은 ACCEPTED 아님 |
| D02 | 고정 production_job_id와 plan_version 분리 | 기존 작업/예약/실적 링크를 계획 변경으로 지우지 않음 |
| D03 | 실물 보드·장착 이력의 명시적 완전성 | 집계 수량에서 serial/장착 사건을 만들지 않음 |
| D04 | job/report/output lot→완성품 입고→회차 배분 | 양품=창고 재고로 자동 처리하지 않음 |
| D05 | shipment별 복수 부분 arrival | 채택된 기능. 15에 12+4 거부, 기존12 유지 |
| D06 | 시험 스키마·범위·구성별 응답·재생산 초안 | 새 시험/정정·미검사/충돌 보존 |
| D07 | 인증·권한·보관·복구·동시성·성능 운영 수용 | 개발 UI가 운영 인수를 대체하지 않음 |

## 공통으로 남은 운영 범위

서버 신원/권한/회사 격리, PostgreSQL 확정 원장, RDF/OWL·SHACL·Neo4j 투영, 서버 트랜잭션·동시성·복구, 실 Agent Host와 모델, 실제 공급/물류/시험 연동, 4종 전체 BOM 5스냅샷 검수, 실물 사진 권리·개정 검수, 10만 객체 생성·적재·부하와 사용자 인수는 화면 구현의 완료와 별도다. 이 범위를 삭제하거나 UI 시뮬레이션으로 수용 완료 처리하지 않는다.

## 통합 후 추가된 검토 입력

PNL-10은 `MATERIAL`의 재고·예약 이력에 불출/소비/반납/폐기/이동 검토 입력으로 연결했다. PNL-21은 `UI03`의 로트 등록/장착/제거 검토 입력으로 연결했다. PNL-24는 `UI09`의 의뢰/제공 결과/정정 입력으로 연결했다. 재사용 구현은 `request-forms.tsx / RecordRequests / ReviewRequestForm`이다.

이들 도구가 지원하지 않는 사실 등록을 성공 처리하지 않는다. 공통 ActionPort로 구조화된 검토 문서만 저장하며 `factApplied:false`, `externalExecuted:false`를 함께 보존한다. 회사 범위, 객체 유형, 양의 정수·단위, 시각, 근거, 원사건, 중복 사건을 검사한다. 원사건 존재·실제 잔량·제공 결과 진위는 검토 전 미확인으로 유지한다. 따라서 관련 SD/PNL의 **사실 반영은 여전히 부분/미연결**이다.

## v2.2 이미지 보완 이후 고밀도 목록 후속 작업 — 보존 기록

이 후속 작업은 기존 UI의 비교 밀도를 높이는 변경이다. 이미지 보완 v2.1에서 등록한 자산 32개 및 모델/품목 ID를 유지하며, 기존 SD/PNL/수용 ID를 새 번호로 대체하지 않는다. 새 사양 문서를 만들지 않고 이 대응표에 기록한다.

| 유지 요구 / 화면 ID | 현재 화면·컴포넌트·동작 | 수용 범위와 한계 |
|---|---|---|
| SD-001 / UX01·02·03 / R12-UI-01~04 | `UI01 / WorkQueueTable` · 업무5행의 사진·모델/개정/구성·수량/단위·필요일·검토·자재/이력·미확인·담당·다음 조치·기준 비교 | 기존 합성 업무 기한/담당을 실제 약속·배정으로 승격하지 않음. 수량마다 다른 의미 보존 |
| SD-002·003·028 / PNL-02·03 | `UI01 / ConfigurationTable` → `EXPLORE / ObjectExplorer` · 스냅샷5+미확보모델3의8행 비교와 객체 이동 | 모델7 ID와8행 구별. 전체 BOM 확보 목표는 여전히 미완료. BOM행 수≠생산/필요수량 |
| PNL-17 / R12-UI-06 / MK-08 | `PhotoCell / EntityThumbnail / MediaDialog` · 사진 확대/출처, 이름으로 상세/관계, 다음 조치로 업무 이동 | 사진 종류·배지·권리·개정 미검수·미등록/실패 구분 유지. 사진만으로 객체/AI 맥락이나 원장을 변경하지 않음 |
| G-02~08 / SelectionContext / AI-01~07 | 행 선택·객체 칩·표/그래프/Inspector/AI의 불변 ID 공유, 키보드 접근 | 명시적 AI 요청 전 호출 없음. 회사 범위·계정 전환·늦은 응답 차단 및 기존 승인 규칙 유지 |
| 02 §2.3 / UX01·02 | `DataTable` 선택적 계정/회사별 view state: 검색·정렬·열·체크·페이지/크기. 홈 두 목록에 적용 | 사진 확대·상세 복귀 시 목록 맥락 유지. 선택 ID를 회사/계정별 복원하고 필터로 가려진 체크도 보존. 체크는 목록 선택이고 승인·예약 아님. 결과 축소 시 유효 페이지 보정 |
| SD-009·013·016~019 / D04·05 / PNL-08·09·14·15 | `work-items.ts / buildWorkItems / buildConfigurationItems`의 읽기 전용 표시 모델 | IM-0008/회차의 구성 연결 미확인 보존, L1 자재는 대표 품목만. 공급확인·재고·예약·생산·입고·출하·도착 합병 금지 |

상세 기준 모달은 수량 정의·단위·검토/자재 상태의 이유·합성 기한/담당·미확인·데이터 버전·근거 참조를 제공한다. 원문 데이터와 이미지 원본은 재작성하지 않는다. 기존 구매·생산·납품·승인·클레임·온톨로지 기능 및 위 표의 모든 부분/미구현/미연결 범위는 유지한다. 실제 수행 시험과 캡처는 [VALIDATION.md](VALIDATION.md)를 확인하며, 목록 개선만으로 서버나 전체 업무 수용 완료를 선언하지 않는다.


## v2.3 구매·생산·납품·검토 목록 확장 대응

| 유지 요구 / 화면 ID | 새 표·컴포넌트·행동 | 수용 범위와 남은 제한 |
|---|---|---|
| SD-006·007·008 | `PURCHASE / PurchaseRequestTable / PurchaseQuoteTable / PurchaseOrderTable / SupplyConfirmationTable` | 요청/견적/발주/회신 각각 검색·정렬·열·페이지·선택 보존. 요청량·MOQ 계산량·내부 주문량·회신 누계·이번 회신량은 별도. 실제 공급·송신·입고 서비스 미연결 |
| SD-010·011·012·013·015 / D02·D04 | `UI07 / PlanningWorkTable / MaterialRequirementsTable / MaterialReceiptTable` → 기존 단계 입력 | 고정 합성 작업·대표 부품 범위. 수요·예약·할당·미확보·입고 판정별 수량을 구별. 모든 실제 BOM 소요·임의 수불·캘린더 목표는 삭제하지 않음 |
| SD-010·012·016~018 / D04·D05 | `UI08 / ProductionWorkTable / DeliveryRoundTable / ShipmentTable / ArrivalTable / FulfillmentComparisonTable` → 기존 입력/근거 | 누계·이번 사건·현재 위치를 구별. 출하별 부분 도착과 상한/중복 규칙 유지. 일반 다회차 계약·실 ETA·보드별 출하 명세는 여전히 부분/미연결 |
| SD-025~027 / PNL-19 / RV01~03 / AT03 | `UI05 / reviews.tsx` · 검토 목록/이력 → 원래 검토 모달 | 상태·수량 의미·작성/승인·초안/기준/현재 버전과 불가 사유 표시. 별도 승인·정확 해시·UNKNOWN 대사는 기존 공통 포트. 프론트 역할은 운영 인증 근거 아님 |
| G-02~08 / AI-01~07 / UX01·02 | `WorkflowTable / DataTable` · 회사/계정별 보기 상태와 명시된 객체 선택 | 필터에 가려진 체크·정렬·페이지/크기·열 보존. 대상 미확인 행은 이전 객체와 새 초안을 묶지 않음. 행 선택·탐색은 AI 호출·쓰기 아님 |
| PNL-17 / MK-08 / R12-UI-06 | `WorkflowPhoto / WorkflowObject / EntityThumbnail / EntityChip` | 사진은 확대/출처, 객체 이름은 상세/관계. 기존 이미지 ID·배지 유지. 대상 연결이 없으면 관련 보드 사진을 임의 대입하지 않음 |
| 01 시간·근거 / SD-015·016·018 | 계획/이행 요청 기한 `09.25 18:00 KST`와 회차 객체 `09.30`을 미확인 불일치로 표시 | 약속일·지연·전망을 임의 확정하지 않음. 원문 요청/회차 의미와 버전·근거 대조 후 통합 판단 필요 |

행 식별은 기존 요청/발주/작업/회차/출하/도착/초안 ID를 사용한다. ID가 없는 공급 회신은 기존 중복 방지 근거인 발주+회신 근거 조합, 자재 입고는 고유 근거, 감사는 원문 사건 조합과 중복 구분으로 보기 상태를 식별하며 새 업무 객체를 생성하지 않는다. 제품 연결이 없는 IM-0008, 품목·로트 연결이 없는 입고, 개별 보드 명세가 없는 납품은 미확인을 유지한다.

확장된 목록은 기존 입력/승인 동작의 진입점이며 새 실행 권한·승인 정책·외부 송신·공개 계약을 추가하지 않는다. v2.1 이미지와 v2.2 홈 목록의 기록은 위에 보존한다. 이번 실제 검사·캡처와 미검증 범위는 [VALIDATION.md](VALIDATION.md)에 별도 기록하며, 검증용 합성 자료를 운영 구축 실적으로 합산하지 않는다. 위의 모든 부분/미구현/미연결 요구는 그대로 남는다.

원장 기록의 행 ID와 등록된 탐색 객체 ID는 구별한다. 아직 객체 레지스트리에 없는 실제 출하·도착·입고 ID는 원문 행/근거로 유지하며, 목록에서 현재 등록된 회차·계획·품목 맥락으로 탐색한다. 해당 원장 객체 자체의 상세/관계 어댑터는 후속 통합 범위로 남기고 가짜 상세 객체를 생성하지 않는다.


## v2.4 자재·재고·로트 조사·품질 목록 확장 대응

| 유지 요구 / 화면 ID | 새 표·컴포넌트·행동 | 수용 범위와 남은 제한 |
|---|---|---|
| SD-009·011·013·014 / PLN-02·03·06 / PNL-10 | `MATERIAL / MaterialComparisonTable / MaterialInventoryTables` · 비교·로트·예약·원문 이력 4표 | 가용·타 계획 예약·자기 예약·별도 입고 할당·계획 미확보를 구별. 0/미확인 보존. 실제 기술 승인·수불 원장·모든 BOM 소요 검수는 부분/미연결 |
| SD-019·021 / TRC-01~03 / AT02 / PNL-22 | `UI04 / TraceResultTable / TraceEvidenceTable` · 조사 결과·장착/제거 근거 2표와 기존 보완안 | A/B 경계·제외·확인 범위·정확 승인·같은 조건 비교 유지. 관계 행을 장착 사건으로 만들지 않음. 조건상 제외는 안전 보장이 아님 |
| G-02~08 / AI-01~07 / TRC-01·03 | 행 선택은 객체만 공유, ‘이 조회 조건 적용’에서 저장 조건을 명시 적용 | 편집 중인 조건 보존. 조회 스냅샷 버전과 현재 입력/최신 AI 데이터 기준 구별. 조건 적용이 과거 원장 버전 복원은 아님 |
| SD-022 / CLM-01·02 / PNL-23 / D03 | `UI09 / ClaimCaseTable / QualityImpactTable` · 접수 원문/대상과 영향 범위 | 폼 편집은 신고 정정 아님. C-001과 정적 CLAIM-01을 임의 병합하지 않음. 신고 대상 수 ≠ 확인 불량 수량, 전체 영향은 미집계 |
| SD-023 / CLM-03~05 / PNL-24 / D06 | `QualityRequestTable / QualityResultsTable` · 저장 의뢰 원문·가상 제공 결과·미검사 | 문서 저장 ≠ 송부/접수/시험. 입력과 접수 대상이 다르거나 접수 대상 미등록이면 예시 연결 UI 비활성. 기존 명령 유지, 서버 대상 검증·실제 결과 업로드/충돌 정정은 후속 |
| SD-024 / CLM-06 / R12-CLM-03·04 / D01·D06 | `QualityReproductionTable` → 기존 인계 후보 저장·계획 이동 | X/Y 독립 수량 예시를 실제 제품 구성·보드 결과·기존 100대 계약과 합산하지 않음. 같은 구성 가용만 사용하며 미검사/미결 유지 |
| PNL-17 / MK-08 / R12-UI-06 / UX01·02 | 기존 `WorkflowPhoto / WorkflowObject / WorkflowTable` 재사용 | 사진 확대/출처·객체 상세/관계·행 선택 AI 맥락 구분. 같은 대상의 이미지 매핑·AI 배지 유지. 보기 상태는 회사/계정 범위이며 선택이 승인/쓰기/LLM 실행은 아님 |

로트 스냅샷의 기존 LOT-L07·RES-01과 현재 시연 계획 예약은 별도 행으로 표현하며, 표시용 현재 계획 행을 새 예약 사건/객체로 등록하지 않는다. 사건 ID 없는 재고 감사와 문서 ID 없는 의뢰는 원문 조합·중복 순번의 표시 ID만 사용한다. 구조화되지 않은 수량/대상/버전/원문 사건을 화면에서 생성하지 않는다.

v2.3 시작 자료 205개를 작업폴더와 실행본에 대조한 결과가 일치한 기준에서 확장했다. 기존 데이터·공개 스키마·수량 계산·승인 정책과 위 표의 모든 미구현/미연결 범위는 유지한다. 이전 v2.3·v2.2·v2.1 기록은 보존하며, 이번 실제 검사·캡처·미검증 항목은 [VALIDATION.md](VALIDATION.md)에 구분한다.

## v2.5 제품·BOM 등록·개별 보드·문서 목록 확장 대응

| 유지 요구 / 화면 ID | 새 표·컴포넌트·행동 | 수용 범위와 남은 제한 |
|---|---|---|
| SD-002·004 / REG-01 / PNL-02·03 | `UI02 / ProductSourceTable / product-sources` · 원본4건의 파일·개정·구성·접수 해시·출처 확인 | 실제 공개 원본·참고 사진·검토 상태 구별. 원본 선택은 접수/매핑 변경 아님. 범용 업로드 파서/OCR·격리 분석 미연결 |
| SD-003·005 / REG-02 / PNL-02·03 | `ProductBomTable / product-bom-L / product-bom-L1` · 개정별74행과 같은 위치 원문 비교·불변 행 선택 | BOM 원문 수량·NA/NS/Opened·중복 위치 보존. 단일단계 원본이며 계층·장착·사내 동일품·호환성을 추정하지 않음 |
| REG-03·04 / RV01~03 / SD-025·026 / PNL-04 | `ProductRegistrationTable / product-registration` · 현재 입력1행→기존 초안 저장→검토·승인 | 입력 요약은 저장 초안/승인 아님. 원본 접수 해시와 L1 고정 등록 근거 불일치 안내. 기존 등록 명령 유지, 원본/대상/sourceHash 통합 계약·범용 매핑 미결 |
| SD-020 / TRC-04 / D02·D03 | `UI03 / Boards / board-registry` · 등록 보드·확인 속성·근거·다음 조치 | 등록 보드1대는 생산·재고·출하·불량 수량이 아님. 식별만 등록한 보드는 구성·장착 위치 미확인. 기존 일괄 L1/U2 표현만 근거별 표시로 정정 |
| SD-020·025~027 / TRC-04 / RV01~03 / PNL-19 | `board-registration-drafts` → 초안 ID/버전/해시 조회→`UI05 / Reviews`의 정확 초안 | 미등록 후보1건은 보드 확정 대수 아님. 미등록 대상에 기존 객체 AI 맥락을 결합하지 않음. 한 번의 명시 이동으로 초안 모달을 열고 목록 필터·승인 본문·권한 유지 |
| SD-027 / EV01~02 / PNL-02·17 / CM01·CM05 | `UI06 / Evidence / evidence-sources` · 실제4/가상7 근거와 전체 해시·명시 참조 목록 | SourceDocument/Evidence ID와 객체 ID 구별. 현재 허용 객체의 기존 근거 참조만 연결·집계. 객체 사진은 문서·검사·실장 증거 아님. 색인 미완료/장애/빈 결과·같은 조건 재시도 유지 |
| EV01~02 / SD-018·027 / CM01·CM05 | `Evidence / evidence-documents` · 저장 문서 검색·정렬·선택·전체 본문/다운로드 | 동명·동내용 중복 보존. 원문 조합/중복 순번은 표시 ID이며 업무 문서 ID가 아님. 자유 본문에서 대상·작성자·승인 버전·수량을 추정하지 않음 |
| UX01·02 / G-02~08 / AI-01~07 / MK-08 / R12-UI-06 | `WorkflowTable / WorkflowPhoto / WorkflowObject` · 사진/객체 분리와 같은 객체 AI 맥락 | 회사/계정별 보기 상태 재사용. 등록 입력 요약은 검색 없이 표시. 사진 확대·정렬·체크만으로 승인·원장 쓰기·Agent 호출 없음 |

이번 범위는 제품3·보드2·문서2의7개 표 패턴이다. L/L1 BOM은 같은 패턴에 개정별 키를 사용한다. 기존 데이터·권한·승인·정확 버전·수량 의미·공개 포트 계약은 바꾸지 않았으며 전체 요구의 부분/미구현/미연결 상태는 유지한다. 원본·등록 대상 일관성과 일반 보드 관계/문서 원장 연결은 후속 통합 미결이다.

시작 시 v2.4 ZIP의277개 추적 파일이 작업폴더와 Downloads 실행본에 일치했다. 데이터/계약7개·미디어32개·근거5개, 총44개 파일을 v2.4 그대로 보존했다. 이전 v2.4·v2.3·v2.2·v2.1 기록을 삭제하지 않으며 이번 실제 검사·캡처·미검증 결과는 [VALIDATION.md](VALIDATION.md)에서 구분한다.


## v2.6 온톨로지·운영 연결·요구사항 목록 확장 대응

| 유지 요구 / 화면 ID | 새 표·컴포넌트·행동 | 보존 의미와 남은 제한 |
|---|---|---|
| SD-028·029 / G-01~09 / PNL-17 / MK-08 | `MAP / OntologyObjectTable / ontology-objects` · 허용 객체·유형/회사·원문 상태/자료·명시 관계·근거·개정·다음 행동 | 사진 확대/출처와 객체 상세/AI 선택 분리. 전체 미집계·목표10만과 로컬 정확 수·검색/로드/표시 범위 구별. 점진 확장과 전체 조회 결과 다운로드 유지. 실제 대규모 조사/적재/부하 미완료 |
| SD-029 / G-02~08 / CM05 | `OntologyPolicyTable / ontology-policies` · 기존 업무 정책·이벤트 트리거 조회 | TBox/SHACL·정책/트리거를 같은 관계로 합치지 않음. 기존 클래스 편집·배치·diff·모의검증·초안 저장/검토 요청 유지. 실제 검증·영향검사·배포/운영 적용 미연결 |
| SD-030 / AT08 / CM04·CM05 | `OntologyVersionTable / ontology-versions` · 브라우저·운영 원장·RDF/OWL·검색·격리 초안5계층 | 로컬 데이터 버전은 투영 동기화 성공 아님. 미연결·조회 불가·미확인과 저장 초안 상태 구별. 최종 성공/실패/대사 계약 연결은 후속 |
| SD-027·033 / CM01·CM02·CM04 | `OPS / operations-audit` → 원문 상세·검색 조건 전체 JSON 내보내기 | 원문·중복 보존, 표시 ID는 시간/행동/상세+순번. 원문 문자열에서 객체·승인 버전·업무 수량 추정 금지. 서버 감사 영속/복구·권한 회수 미연결 |
| SD-031 / FUL-02~07 / D04·D05 | `operations-quantities` · 기존 totals 수량5행과 명시 작업/회차·계산 기준 | 정상 누계·창고·운송·도착·잔여 약속 구별, 합산 금지. 설계 구성 사진은 실제 생산/운송 개별 보드 증거 아님. 범용 다작업/다계약 집계 미구현 |
| SD-032·035·036 / CM05·CM06 / AI-01~07 | `operations-status / operations-ports` · 구현9행·공통 포트6행·연결 경계 상세 | 상태 설명은 실시간 점검·실서버 인수 아님. 4종 확보 미완료·10만 목표 유지. 실제 Agent/LLM·어댑터 미연결, 개인 평가 원자료 로컬 전용 |
| SD-035 / UX01·02 / CM06 / AT01~08 | `TRACE / RequirementsWorkspace / requirements-definitions / requirements-decisions / requirements-acceptance / requirements-integration` | 원래 요구45·D01~07·AT01~08·경계6 정의·상태·고정 예시 보존. 전체 flow/accept 원문 모달·검증된 화면 이동. 원문 정의를 이번 시험 통과나 운영 수용으로 표시하지 않음 |
| G-02~08 / AI-01~07 / MK-01 / UX01·02 | `WorkflowTable.contextMode`의 객체/참조 목록 선택 구별 | 객체 모드는 기존 사진·상세·AI, 참조 모드는 업무 객체/AI 변경 차단. 요구/정책/포트/버전 ID를 업무 객체로 만들지 않음. 회사/계정별 필터·정렬·페이지·열·체크·탭 유지 |

이번 목록 확장은 온톨로지3·운영4·검증센터4의11개 표 패턴이다. 기존 권한·승인·정확 버전·수량 의미·공개 포트 및 지도/TBox 편집 경계는 유지한다. 참조 ID와 업무 객체 ID를 구분하며 모든 부분·미구현·미연결 요구를 보존한다.

v2.5 ZIP의368개 추적 파일과 작업폴더·Downloads 실행본이 동일한 기준에서 진행했다. 기존 데이터/계약7개·미디어32개·근거5개 및 요구 정의 파일을 포함한45개 파일의 보존 여부와 실제 검사·캡처는 [VALIDATION.md](VALIDATION.md)에 기록한다. 이전 v2.5 이하 결과는 이번 수행 기록과 구분해 유지한다.


## v2.6 후속 — 공급사별 견적 비교 카드 대응

| 유지 요구 / 화면 ID | 새 화면·컴포넌트·행동 | 보존 의미와 남은 제한 |
|---|---|---|
| SD-007 / R12-PUR-01 | `PURCHASE / PurchaseQuoteTable / SupplierQuoteCards` · 공급사 A/B 2카드, 같은 항목 순서와 수량/비용 기준으로 비교 | QUOTE-A-v1 / QUOTE-B-v1과 모든 원래 견적 값 유지. 운송비 미확인은 총비용 미확인. 공급량·납기는 합성 견적/가정이며 확약 아님. 자동 업체 추천 없음 |
| SD-006·008 / R12-PUR-02~04 / PNL-05~07 / RV01~03 | 기존 구매 요청·내부 발주·공급 확인 표와 초안→별도 승인→정확 버전 반영 유지 | 카드의 비교안 선택은 기존 내부 발주 초안 입력만 결정. 요청량/계산량/주문량/회신량 구별, 권한·버전·멱등성·공개 계약 변경 없음 |
| G-02~08 / AI-01~07 / PNL-17 / MK-08 | `WorkflowPhoto / WorkflowObject / SupplierQuoteCards` · 사진 확대·객체 상세·선택 AI 맥락 분리 | `IM-0008`과 기존 이미지 매핑 유지. 공급사 이름으로 새 객체/관계를 생성하지 않음. 사진/보기/선택은 LLM 호출·승인·원장 쓰기 아님 |
| UX01·02 / MK-01 / R12-UI-06 | `DataTable.renderRows` · 기존 목록 상태를 카드 본문에도 재사용 | 검색·정렬·항목 표시·페이지·체크·활성 대상 및 회사/계정 범위 저장 키 유지. 다른 목록의 기본 표 동작과 v2.0 UI 보존 |

이번 후속은 v2.6의 견적 표현 변경이다. 기존 v2.3 표 확장 기록과 모든 요구 ID·부분/미구현 상태는 유지하며, 실제 견적·서버 승인·공급확약·외부 송신은 연결되지 않았다. v2.0/5174와 v2.6/5175의 시연 초기화는 별도 사용자 요청에 따른 로컬 복구로, 기업 기록 복구 기능이나 새로운 승인 정책이 아니다. 실제 확인한 검사·캡처는 [VALIDATION.md](VALIDATION.md)에 이전 결과와 구분해 기록한다.


## v2.6 후속 — 승인 전후 영향과 그래프 상태 조회

| 기존 요구 / 화면 ID | 화면·컴포넌트·동작 | 구현 경계 |
|---|---|---|
| REG-01~04 / RV01~03 / UI02·UI05 | `ChangeImpactPanel` · 현재 상태/선택 초안/반영 가정/다음 확인 행동 | 승인 ≠ 반영. 초안과 가정 입력 구분. 실제 승인/반영은 기존 ActionPort만 사용 |
| PLN-01~07 / D01·D02 / UI07 | 필요100·원품 가용80·자기 예약·입고 합격·별도 할당·계획 미확보를 기존 domain 계산으로 표시 | 원품 가용을 이미 확보한 수량으로 표현하지 않음. 반영한 입고를 후보에 재합산하지 않음 |
| G-02~08 / AI-01~07 | `TraceGraph`가 현재 회사 범위의 객체를 resolve하여 로컬 등록/계획 미확보 속성을 표시. 가정의 안내는 명시적 로컬 계산 | 기존 관계 ID·방향·근거 불변. 새로운 입고→LOT-L07 관계 생성 없음. LLM 호출/실시간 자동 추천 아님 |
| CM02·04 / 03 AgentPort·GraphPort·Identity | 현재 초안 기준이 달라지면 기존 재검토 요구를 보여주고 후보 확정을 차단 | 서버 동시 작성, 초안 대체/승인 취소 정책, 이벤트 구독·RDF 투영·외부 그래프 동기화는 미구현·계약 협의 필요 |

실행 결과·화면 캡처는 VALIDATION.md의 이번 후속 기록과 과거 v2.6 전체 검사 기록을 구별한다. 실시간 서버 협업이나 온톨로지 엔진의 완성을 주장하지 않는다.


## 2026-11-05 별도 그래프 서버 후속 대응

| 기존 요구 / 화면 ID | 새 화면·컴포넌트·동작 | 구현 범위 / 남은 제한 |
|---|---|---|
| SD-028·029 / G-01~09 / PNL-17 | 업무 화면의 명시 ‘그래프 서버 연결’ → 별도 localhost5176의 객체·관계 조회 | 같은 회사·불변 객체 ID·개정·근거를 사용. 기존202개 fixture 객체·191개 관계와 추가 식별 등록 객체를 읽기 복제. 관계 생성/온톨로지 엔진 구현 아님 |
| SD-030 / CM02·04 / AT08 | 업무 버전·그래프 완료 버전, 수신 순번·완료 순번과 대기/완료/실패를 분리 | 같은 업무 버전 안에서도 검토 상태 게시 순번은 달라질 수 있음. 그래프 대기를 업무 반영 실패로 표시하거나 업무 반영만으로 그래프 완료를 표시하지 않음 |
| REG-01~04 / RV01~03 / UI02·UI05 | 저장 초안 ID·버전·해시·작성/승인자·상태의 읽기 정보와 반영 후 등록 상태 확인 | Bob 승인만으로 확정 수량/업무 버전 변경 없음. 기존 ActionPort만 승인·정확 반영. 새 승인 정책·초안 대체·자동 승인 취소 없음 |
| PLN-01~07 / D01·D02 / UI07 | 예약·입고 합격·별도 할당·계획 미확보 전후와 다음 확인 안내를 별도 그래프 조회에 표시 | 기존 공통 수량 계산 재사용. 원품 가용 ≠ 예약, 입고 합격 ≠ 할당, 규칙 안내 ≠ LLM 호출. 입고→LOT-L07 연결 미생성, RES-01 다른 계획20EA 유지 |
| SD-035·036 / CM05·CM06 / 03 Graph·Identity | 로컬 서버 연결·분리, 동일 회사 범위, 메모리 임시 토큰, 계정 전환/다른 탭 잠금 때 연결 폐기 | 로컬 읽기 복제 구현. 운영 인증·권한·영속 원장/그래프·분산 동시성·실 Agent 미연결. 기존 공개 서비스 API 확정 아님 |
| G-02~08 / AI-01~07 / UX01·02 | 별도 그래프의 동일 객체 선택·속성·관계 근거와 업무 화면 맥락 연결 | 객체 선택/조회/사진 확대만으로 업무 쓰기·승인·Agent 호출 없음. 새 데이터 버전을 이전 대상의 AI 응답과 섞지 않음 |

이번 기록은 이전 ‘승인 전후 영향과 그래프 상태 조회’ 단계 이후 추가된 로컬 연결이다. 이전의 서버 미연결 기록·검사 결과를 삭제하거나 이번 검사로 취급하지 않는다. 약400ms 큐 지연은 모의 투영 지연이고 약700ms 폴링은 화면 갱신 방식이다. 실제 실행 검사·예외·캡처의 완료 여부는 [VALIDATION.md](VALIDATION.md)의 별도 서버 후속 기록으로 확인한다. 10만 객체·실 운영 그래프·실시간 다중 사용자 협업·승인 계보·운영 배포는 계속 부분/미구현/미연결 요구로 남긴다.

이번 구현 파일: `src/graph-projection.ts`(개발 읽기 DTO/포트), `src/graph-connection.tsx`(업무 연결·상태), `server/graph-service.mjs`(범위/순서/읽기 모델), `server/graph-server.mjs`(별도 프로세스), `src/graph-view.tsx`(객체·관계·검토 관찰). 공통 `impactNextStep`을 재사용하며 관계·업무 수량 정책은 기존 정의를 유지한다. 실행 확인은 VALIDATION의 이번 기록으로 분리한다.

## 2026-11-05 이미지 안정성 후속 대응

G-02~08 / UX01·02 / 공통 미디어·GraphPort: `sameGraphStatus`와 `useGraphConnection`은 동일 응답에서 기존 화면 참조를 유지한다. `GraphView`는 완료 순번 변경 시에만 전체 읽기 모델을 교체한다. 사진 확대·선택·AI 맥락·갱신 오류·계정 폐기와 전체 기존 기능은 유지한다. `tests/media.e2e.ts`의 반복 조회 검사는 이미지 DOM 유지·재요청0·확대창 유지·업무 기록 불변을 확인하며, 기존 지연 응답/회사 범위 검사도 함께 통과했다. 정책·공개 계약·데이터 의미 변경 없음.

## 2026-11-06 v2.6 후속 대응 — BOM 정합성·수급 현황

| 기존 요구 / 화면 ID | 새 화면·컴포넌트·동작 | 구현 범위 / 남은 제한 |
|---|---|---|
| REG-01~04 / SD-002~005 / UI02 | `Product`의 정합성 단계 → `BomReviewPanel` / `auditBom` / `analyzeBomRows` | 실제 원문74행·128참조 표기, 파일명/시트명·변형·접수 해시·수량/참조 수·중복·패키지·NA/NS/Opened 검토. 형식 검사는 회로/호환성/품질 검증이 아님 |
| REG-01~04 / RV01~03 / CM01 / AT01 | 확인 필요 필터·근거 비교·원문 행 이동 → 기존 등록 검토 단계 | 기본 L1 불일치1+미확인12행, L 불일치1+미확인11행. 미접수·미검증 별도. 기존 보존 확인·L1 등록 payload·작성/승인 분리·정확 버전·멱등성 보존. 새 승인 차단 없음 |
| G-02~08 / AI-01~07 / PNL-17 / SD-028 | `BomReviewRelations`의 GraphPort 미니 지도 ↔ 조회 범위 전체 관계 목록 ↔ 공통 객체/AI 선택 | 같은 객체 ID·회사 범위·설계 관계·방향·범위·근거 유지. 전체/로드/표시 수 구별. 기존 전체 지도·별도 그래프 유지. 실 RDF/OWL·운영 투영으로 표현하지 않음 |
| MK-08 / R12-UI-06 / PNL-17 | 기존 `MediaPanel`로 보드 사진 확대·출처, 품목/구성 이름은 상세·관계 | 기존 자산·매핑 재사용. 개정 일치 미검수·부품 좌표 미등록. AI/참고 사진을 실장·검사·회로 대조의 증거로 사용하지 않음 |
| SD-009·013 / PLN-01~07 / MATERIAL·UI07 | `SupplyOverview` / `supply-demand` 기본 표와 계획 수량 영역 → 기존 계획·재고 보기 | SYN-MAP-01의 U2/PART-TPS 1품목만 합성 계산. 원품100−타 예약20=80, 비교 부족 `max(0,100−80−합격분 할당)`. 자기 예약은 비교 가용에서 중복 차감하지 않음. 나머지73행 미계산 |
| SD-010·011·013 / UI07 / 기존 수량 계약 | 현재 계획 예약·합격 미할당·계획 확보·계획 미확보를 별도 표시 | 계획 확보=자기 예약+합격분 할당. 입고 합격만으로 확보 증가 없음. 미할당 합격분·대체품·후보 미가산. 승인·반영·할당을 합치지 않음 |
| SD-014 / MATERIAL | 기존 승인 대체품45 EA·미승인 후보 비교 → 적용/기술 검토 초안 | 기존 L1/U2/JOB 범위 승인과 미확인 유지. 검토가 예약·소비·호환성 확정이 아님. 실제 기술 승인 미연결 |
| SD-006~008 / PURCHASE | PART-TPS 조달 미연결 안내 → 별도 IM-0008 구매 예시 명시 이동 | 공급·견적·필요일을 추정하거나 다른 품목 견적을 붙이지 않음. 실제 외부 송신 미구현. 기존 구매 표·공급사 카드·승인 경로 유지 |

등록의 접수 해시·보기 개정·현재 매핑과 고정 L1 등록 명령 간 일관성은 기존 통합 미결로 유지한다. 회로도/데이터시트 대조, 사진 개정/좌표 검수, 전체 BOM 사내 품목 매핑·수요·재고·조달 연결, 운영 서버의 권한/동시성·실 Agent·10만 객체 수용은 삭제하지 않은 후속 범위다. 이번 단위78개·빌드·실주소5175 브라우저22개 통과와 캡처 범위는 `VALIDATION.md`의 2026-11-06 기록을 따르며, 이전 결과와 구분한다.


## 2026-11-06 v2.6 추가 대응 — 클래스 탐색·BOM 부품 구성도

같은 날 앞선 BOM 정합성·수급 현황 후속 이후 추가된 요청이다. 현재 정의와 업무 데이터 범위를 유지하며 읽기 탐색·이미지 표현을 보완한다.

| 기존 요구 / 화면 ID | 새 화면·컴포넌트·동작 | 구현 범위 / 남은 제한 |
|---|---|---|
| SD-029 / G-01~09 / MAP | `OntologyClassBrowser` / 기존6클래스·5관계의 읽기 전용 목록·관계도·상세 | 클래스 목록은 업무 영역 묶음이며 상속 아님. 기존 ID·이름·관계 방향·속성·제약 설명만 사용. 실제 운영 온톨로지 전체 정의 아님 |
| SD-029·030 / 03 관리자 초안 | `ontology-definitions.ts` 공통 초기 정의 / 기존 `TBox · 관리자 초안` 및 버전 보기 유지 | 읽기 기준 v1과 관리자 저장 초안을 분리. 초안 추가·배치·의미 변경이 읽기 기준에 자동 반영되지 않음. 실 SHACL 검증/배포/영향검사 미연결 |
| SD-028·029 / CM01·CM05 / QueryPort | 선택 클래스 → 정확 `Entity.type`에 해당하는 회사 범위의 현재 업무 객체 목록 | 초기 제품구성5·사내품목26·로트2·보드4·출하1·회차2, 합40/전체202. 현재 QueryPort의 신규 식별 보드 포함. RDF 소속·상속 추론 아님. BOM 원문 품목148개 미병합 |
| G-02~08 / AI-01~07 / PNL-17 | 클래스 선택은 정의 상태만 변경, 실제 객체 목록은 공통 WorkflowTable·사진·객체·AI 맥락 연결 | 클래스 선택/사진 확대/필터만으로 Agent·예약·승인·원장 쓰기 없음. 미연결·실패·부분 결과·빈 결과·오래된 기준 구별 |
| SD-003·005·028 / REG-01~04 / UI02 | 기존3노드 설계 관계에 이미지 추가 / 부품 구성도 확장창 / 검색·패키지 필터·6개 페이지 | GraphPort에서 확인한 구성→원문74행만 사용. 원문 행·참조 위치·수량·개정 ID 유지. 128참조 표기를128개 장착 사실로 확장하지 않음 |
| MK-08 / R12-UI-06 / MediaPort | 구성도 노드의 기존 EntityThumbnail 확대·출처·AI 생성 배지, 같은 객체는 같은 자산 | 각 개정73원문행 기존AI자산 매핑·1행미등록. 신규 생성0, 고유 미디어32파일 유지. 원문 패키지35문자열은 정규화·호환성 검증 아님 |
| RV01~03 / CM01 / AT01 / 기존 ActionPort | 기존 정합성·원문 근거·등록 초안·별도 승인·정확 버전 반영 연결 유지 | 읽기 관계도는 실제 장착/실물 좌표/품질 확정이 아님. NA·NS·Opened 보존. 새로운 승인 조건·공개 계약 없음 |

남은 요구: 정식 클래스 URI·멤버십·상속·domain/range·구조화 제약/검증, 운영 배포·권한·영향검사, 실물 좌표와 실제 장착 사건, 전체 BOM의 사내 품목/수급 연결, 실 Agent·10만 객체 수용은 계속 미연결/미구현/미검증으로 보존한다. 이번 빌드 성공·기존 단위78개·실주소5175 Chrome27개 통과와 캡처의 실제 범위는 `VALIDATION.md`의 추가 후속 절에 별도로 기록했다.
