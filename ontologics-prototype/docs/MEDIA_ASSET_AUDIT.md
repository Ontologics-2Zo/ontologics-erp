# v1.7 실제 BOM 연결 이후 이미지 인벤토리 — 2026-11-06

실제 4모델·5스냅샷·356원문 행을 공통 데이터에 연결한 뒤 같은 Entity/Media resolver로 이미지 인벤토리를 다시 생성했다. **기존 자산32개를 유지하며 새 이미지는 생성하지 않았다.** 아래 이전2026-11-05 기록의 수치는 당시148원문 행 기준으로 보존하며 현재 집계와 구분한다.

## 현재 파일·객체 연결

| 대상 | 실제 사진(정확 대상 검수) | 제조사 참고 사진 | CAD 렌더 | AI 참고 | 미등록 | 합계 |
|---|---:|---:|---:|---:|---:|---:|
| 보드 모델 ID | 0 | 4 | 0 | 3 | 0 | 7 |
| BOM 원문·사내 부품 객체 ID | 0 | 0 | 0 | 327 | 56 | 383 |
| 저장된 고유 자산 파일 | 0 | 4 | 0 | 28 | — | 32 |

보드7모델은 실제 원본4 + 독립 합성3이다. BOM스냅샷은 실제5 + 합성3 =8개다. 부품383ID는 실제 BOM 원문행356 + 합성 사내품목27이며 고유 제조사 부품 수를 의미하지 않는다. 동일 명칭·패키지·사진을 공유해도 행별 ID는 병합하지 않는다.

전체 이미지 연결은 **347개**다: 모델7 + 구성8 + 부품327 + 개별보드4 + 로트1. 파일누락0, 존재하지 않는 객체로의 연결0, 업무 근거로 사용 가능한 자산0이다. 이전 자산 인벤토리의 SHA-256과 현재32파일의 SHA-256을 대조했으며 전부 동일했다. 사진 매핑은 바뀌었지만 이미지 파일 바이트는 바꾸지 않았다.

| 실제 BOM 스냅샷 | 원문행 ID | AI 참고 매핑 | 미등록 |
|---|---:|---:|---:|
| PoE L | 74 | 73 | 1 |
| PoE L1 | 74 | 73 | 1 |
| POE-ISO N | 75 | 68 | 7 |
| EVB C | 71 | 43 | 28 |
| GATEWAY I | 62 | 43 | 19 |
| 합계 | **356** | **300** | **56** |

위300은 실제 원문행에 참고 이미지를 연결한 수다. 개별 부품 사진300개 또는 확정 실물 형상300개의 확보를 뜻하지 않는다. 나머지 AI 참고27개는 합성 사내품목 ID의 매핑이다.

## 매핑과 미등록의 의미

실제 원문의 Package/Footprint가 기존 자산의 종류 범위를 뒷받침하는 경우에만 재사용했다. QFN32, SOIC-8, 저항/커패시터 규격 문자열 등의 종류별 참고이며 단자 배치·치수·정격·정확 MPN·실장 여부를 보증하지 않는다. 모르는 패키지나 기존 자산과 단자 수가 다른 대상은 미등록으로 남겼다. NA/NS의 이미지가 보여도 실장 상태는 미확인이다.

로고·fiducial·hole·testpad 등의 비조달 후보 및 Opened/Closed/SJ의 보드 설정 후보를 별도 실물 부품 사진으로 임의 채우지 않았다. 후보 분류 자체도 독립 검수 전이다. 전체 미등록56ID와 원문 패키지·사유는 [현재 집계 JSON](media-inventory-summary.json) 및 [품목별 인벤토리](media-part-inventory.csv)에서 확인한다.

기존 제조사 참고 사진4장은 새 `CFG-POEISO-N`, `CFG-EVB-C`, `CFG-GATEWAY-I`에도 같은 모델 범위로 연결한다. N/C/I 개정 일치 여부는 여전히 미검수이며 모델의 BOM 확보가 사진의 개정 검증이나 재배포 허가를 의미하지 않는다. 공개 Git 제외·로컬 복원 정책을 유지한다.

## 현재 재생성 기록

`node scripts/media-inventory.mjs`를 실행해 기존4개 인벤토리 CSV와 집계JSON을 갱신했다. 스크립트는 `actual-boms.ts`의 전체5스냅샷을 사용하며, 실제 UI와 같은불변ID·미디어 해석을 읽는다. 별도 서버나 네트워크 접속을 열지 않는다. 원문 행에는 스냅샷 키·sourceRowId·locator를 함께 기록한다.

서로 다른 원문 Designation 문자열170개(공백 제거시166개, 빈 문자열 포함), Package/Footprint 문자열101개를 확인했다. 문자열 수는 고유 부품·호환품·이미지 자산 수와 다르다. 원본 Quantity의 단위·실장 상태는 이 이미지 작업으로 변경하지 않았다.

파일 존재·해시·객체 연결 검사는 인벤토리 생성으로 확인했다. 실제 화면의 로딩·확대·배지·초점·실패 상태 검증은 [VALIDATION.md](VALIDATION.md)의 이번 실행 기록을 따른다. 아래의 과거 브라우저 결과를 새356행의 화면 검증으로 재사용하지 않는다.

---

# 이전 기록 — 2026-11-05 제품·부품 이미지 출처와 연결 범위

검토일: 2026-11-05 KST. 기준은 `src/entity-data.ts`, `src/bom-source.json`, `src/media-data.ts`, `public/media/`다. 이 문서는 로컬 목업의 이미지 감사이며, 제조 품목 마스터 정합성이나 운영 데이터 적재 완료 보고가 아니다.

## 적용 정책과 원본 문서의 관계

이번 추가 사용자 요청에 따라 **실제 사진 → CAD/검증된 참고 자료 → 사실적인 AI 참고 이미지** 순서로 선택한다. 이전 첨부 문서의 생성 실사 금지 조건은 이번 이미지 작업에 한해 이 사용자 지시로 대체한다. `sources/`와 제공 문서는 변경하지 않았다. 실제 제품 사진 우선, 출처·대상·개정 일치 여부 표시, 미등록/로드 실패 구분, 사진으로 업무 사실을 확정하지 않는 원칙은 유지한다.

AI 자산은 썸네일에 `AI 생성`을 붙이고 확대 화면에 다음 문장을 그대로 표시한다.

> 외형 이해용 참고 이미지이며 실제 제품·배치와 다를 수 있습니다.

생성 이미지는 부품 종류와 외형 이해용이다. 로고·확정 품번·개정·일련번호 표기를 만들어 실제 제품 증명처럼 사용하지 않으며, 검사·장착·호환성·핀 배치·승인·원장 반영의 근거에 포함하지 않는다. 이미지 확대·hover·객체 선택·테마 변경은 이미지 생성이나 LLM 호출을 유발하지 않는다. 이미지를 미리 생성해 저장하고 동일 자산 ID를 재사용한다.

## 집계 단위

| 집계 대상 | 개수 | 의미 |
|---|---:|---|
| 불변 보드 모델 ID | 7 | 실제 원본 포함 1 + 실제 확보 대상 3 + 독립 합성 3 |
| 실행 가능한 BOM 스냅샷 | 5 | 실제 PoE L/L1 2 + 합성 IO/SENSE/PWR 3 |
| 불변 부품 ID | 174 | 실제 BOM 행·개정별 ID 148 + 합성 BOM ID 22 + 별도 사내 품목 4 |
| 실제 BOM 데이터 행 | 148 | L 74행 + L1 74행. 같은 표기를 개정 간 병합하지 않음 |
| 실제 BOM의 서로 다른 Designation 문자열 | 76 | 참고용 문자열 집계. 품목 동일성·대체 승인·실제 제조사 고유 품번 수가 아님 |
| 실제 BOM의 서로 다른 Package 문자열 | 35 | 원문 패키지 키 기준. 이미지 종류 수와 다름 |

실제 BOM 76개 문자열은 공백만 제거한 집계에서도 76개다. 동일 이름이라도 개정·행·객체 ID를 그대로 보존하며, 사진이 같다고 품목을 합치지 않는다. 부품 이미지의 근거는 원문 Package/검증된 종류 정보이며 수량이나 위치 정보는 바꾸지 않는다.

보드와 품목의 `data_source`는 BOM/객체 데이터의 출처다. `media_kind`와 `media_source`는 사진의 출처다. 예를 들어 PoE 부품은 `실제 공개 원본` BOM 객체이면서 `AI 생성` 참고 이미지가 연결될 수 있고, BOM 미확보 모델에 공식 참고 사진이 생겨도 원본 확보 상태가 완료로 바뀌지 않는다.

현재 이미지 유형별 연결 수·미등록 ID·파일 누락 여부는 [재생성 집계](media-inventory-summary.json)를 따른다. 아래 표는 이 집계와 동일한 최종 registry를 기준으로 한다.

<!-- MEDIA_COUNTS_START -->
최종 파일·연결 집계: 2026-11-05 KST. 같은 객체에 대한 여러 화면의 표시를 중복 집계하지 않았다.

| 대상 | 실제 사진(정확 대상 검수) | 제조사 참고 사진 | CAD 렌더 | AI 참고 | 미등록 | 합계 |
|---|---:|---:|---:|---:|---:|---:|
| 보드 모델 ID | 0 | 4 | 0 | 3 | 0 | 7 |
| 부품 ID | 0 | 0 | 0 | 172 | 2 | 174 |
| 저장된 고유 자산 파일 | 0 | 4 | 0 | 28 | — | 32 |

AI 자산 28개는 합성 보드 종류 3개 + 부품 종류 25개다. 전체 객체 연결은 189개(모델 7 + 구성 5 + 부품 172 + 개별 보드 4 + 로트 1)다. 파일 누락 0개, 존재하지 않는 객체 연결 0개, 중복 객체 ID 0개, 업무 근거 사용 허용 자산 0개다.

미등록 2개는 `PART-POE-L-68`, `PART-POE-L1-67`의 `Opened` / `SJ_1_SMALLER` 솔더 점퍼 항목이다. 이는 보드 설정이므로 별도 물리 부품 사진을 만들어 채우지 않는다. D0402는 leadless ESD 종류별 자산으로 연결했다. 172개 부품에 이미지가 있다는 사실은 172개 부품의 개별 실물 사진이나 정확한 형상 검증을 의미하지 않는다.
<!-- MEDIA_COUNTS_END -->

## 공식 보드 사진

네 장 모두 제조사가 공개한 **해당 모델의 실제 제품 사진**이지만, 로컬 BOM의 정확한 개정과 일치하는지 검수하지 않았다. 따라서 UI 데이터 분류는 `reference-photo` / `참고 사진`, `revisionMatch=unverified`다. 개별 보드 serial·부품 로트의 촬영 증거로 사용하지 않는다.

| 자산 ID | 연결 모델 ID / 이름 | 원본 페이지 | 이미지 URL | 개정 적용 범위 |
|---|---|---|---|---|
| olimex-poe | MODEL-POE / ESP32-PoE | [OLIMEX ESP32-PoE](https://www.olimex.com/Products/IoT/ESP32/ESP32-POE/) | [ESP32-POE.jpg](https://www.olimex.com/Products/IoT/ESP32/ESP32-POE/images/ESP32-POE.jpg) | L/L1 일치 미검수. CFG-POE-L/L1과 관련 개별 보드에도 모델 참고로 재사용 |
| olimex-poeiso | MODEL-POEISO / ESP32-POE-ISO | [OLIMEX ESP32-POE-ISO](https://www.olimex.com/Products/IoT/ESP32/ESP32-POE-ISO/) | [ESP32-POE-ISO-1.jpg](https://www.olimex.com/Products/IoT/ESP32/ESP32-POE-ISO/images/ESP32-POE-ISO-1.jpg) | N 일치 미검수. 전체 BOM 미확보 유지 |
| olimex-evb | MODEL-EVB / ESP32-EVB | [OLIMEX ESP32-EVB](https://www.olimex.com/Products/IoT/ESP32/ESP32-EVB/) | [ESP32-EVB-1.jpg](https://www.olimex.com/Products/IoT/ESP32/ESP32-EVB/images/ESP32-EVB-1.jpg) | C 일치 미검수. 전체 BOM 미확보 유지 |
| olimex-gateway | MODEL-GATEWAY / ESP32-GATEWAY | [OLIMEX ESP32-GATEWAY](https://www.olimex.com/Products/IoT/ESP32/ESP32-GATEWAY/open-source-hardware) | [ESP32-GATEWAY-1.jpg](https://www.olimex.com/Products/IoT/ESP32/ESP32-GATEWAY/images/ESP32-GATEWAY-1.jpg) | I 일치 미검수. 전체 BOM 미확보 유지 |

획득일은 2026-11-05이며 촬영일은 확인되지 않았다. 권리 메모는 `제조사 공개 제품 사진 · 재배포 라이선스 미확인 · 로컬 참고용`이다. 공개 페이지에 있다는 사실이나 오픈 하드웨어 설계 라이선스를 사진의 재배포 허가로 해석하지 않는다. 공개 서비스 배포에 앞서 해당 사진의 사용 권리 확인 또는 허가받은 촬영물 교체가 필요하다.

IO-24, SENSE-4, PWR-12는 실제 제품 원본이 없는 독립 합성 모델이다. 해당 보드 참고 이미지는 AI 자산으로만 표시한다. 실제 PoE 모델 사진으로 대체하지 않는다.

## 부품 분류의 근거와 한계

종류별 이미지 연결은 외형 탐색을 돕는 범위다. 다음은 이름만 보고 잘못 연결하기 쉬운 원문 값에 대해 확인한 근거다. 다른 개정의 공식 설계 자료는 **종류 확인용 교차 자료**이며, 현재 L/L1의 정확한 형상·실장 여부를 검수했다는 뜻이 아니다.

| 원문 패키지/값 | 허용되는 외형 범주 | 확인 근거 / 제한 |
|---|---|---|
| DW02S | 2핀·2mm 피치·상부 삽입 SMD 배터리 커넥터 | OLIMEX 기술지원 담당자가 CI0102M1VT0-LF로 설명. 스크루 터미널로 연결하지 않음. [공식 지원 답변](https://www.olimex.com/forum/index.php?topic=7900.0) |
| IT1185AU2 | 소형 택트/푸시 버튼 | 공식 netlist의 BUT1/RST1과 Buttons footprint. 정확한 높이·작동 방향·치수는 미검수. [OLIMEX netlist](https://github.com/OLIMEX/ESP32-POE/blob/master/HARDWARE/ESP32-PoE-hardware-revision-C1/ESP32-PoE_Rev_C.net) |
| GBH-254-SMT-10 | 10핀 UEXT 박스 헤더 종류 | 같은 공식 netlist의 UEXT1 / BH10S / GBH footprint. 참고 이미지가 핀 배열·회로 호환성을 증명하지 않음. [OLIMEX netlist](https://github.com/OLIMEX/ESP32-POE/blob/master/HARDWARE/ESP32-PoE-hardware-revision-C1/ESP32-PoE_Rev_C.net) |
| HN1x10 / NS(HN1x10) | 1×10 헤더 종류 | 공식 netlist의 EXT1/EXT2 / CON10 / HN1x10. NS 원문과 실장 미확인은 그대로 유지. [OLIMEX netlist](https://github.com/OLIMEX/ESP32-POE/blob/master/HARDWARE/ESP32-PoE-hardware-revision-C1/ESP32-PoE_Rev_C.net) |
| uSD(TFC-9P-1.xH) | microSD 소켓 | 공식 netlist의 MICRO_SD1 / TFC-9P-1.7H. 다른 커넥터나 microSD 카드 자체 이미지와 구별. [OLIMEX netlist](https://github.com/OLIMEX/ESP32-POE/blob/master/HARDWARE/ESP32-PoE-hardware-revision-C1/ESP32-PoE_Rev_C.net) |
| D0402 / NA(GG0402052R542P) | 0402 양방향 leadless TVS/ESD 다이오드 | 일반 SMA/SOD형 극성 띠 다이오드 외형과 구별. 제조사 GiGuard 자료에 해당 품번 포함. [KYOCERA AVX 자료](https://datasheets.kyocera-avx.com/AVX-GiGuard.pdf), [시리즈 표](https://www.kyocera-avx.com/docs/literature/giguard-series-flyer.pdf) |
| SJ_1_SMALLER / Opened | 솔더 점퍼·보드 설정 | 별도 조달 부품의 실물 사진 대상으로 만들지 않음. 이미지 미등록을 허용하며 실제 장착/개방 상태를 판정하지 않음 |

저항·커패시터 등 여러 크기에 한 종류별 이미지를 재사용하면 정확한 크기, 리드 수, 패키지 변형, 부품 표면 인쇄까지 일치한다고 표시하지 않는다. SOT-23 3단자와 SOT-23-5, QFN과 SOIC/SSOP, 전해 커패시터와 MLCC, 커넥터의 종류 차이는 별도 자산 또는 미등록으로 다룬다. NA/NS 항목에 참고 이미지가 있어도 장착된 것으로 바뀌지 않는다.

## 재생성 파일과 교체 방법

`node scripts/media-inventory.mjs`로 현재 UI와 같은 Entity/Media resolver를 메모리에서 읽고 아래 파일만 다시 쓴다. 서버를 열거나 외부 API를 호출하거나 업무 원장을 수정하지 않는다. 기존 Vite 설치의 esbuild 변환기를 사용하므로 추가 패키지가 필요 없다.

| 파일 | 내용 |
|---|---|
| [media-board-inventory.csv](media-board-inventory.csv) | 7개 모델 ID별 데이터 출처 / 연결 이미지 종류 / 대상 범위 / 개정 일치 |
| [media-part-inventory.csv](media-part-inventory.csv) | 174개 품목 ID별 원문 행·패키지·위치 / 이미지 / 미등록 사유 |
| [media-package-inventory.csv](media-package-inventory.csv) | 원문 패키지 35키의 ID 수와 연결 자산 |
| [media-asset-inventory.csv](media-asset-inventory.csv) | 자산 ID별 출처·권리·종류·크기·SHA-256·연결 수·파일 존재 |
| [media-inventory-summary.json](media-inventory-summary.json) | 집계 시각, 유형별 수, 누락 파일과 알 수 없는 객체 연결 검사 |
| [MEDIA_GENERATION_PROMPTS.json](MEDIA_GENERATION_PROMPTS.json) | 사전 생성에 사용한 프롬프트 기록. 자산 형태의 공학적 정확성 인증이 아님 |

CSV는 Excel에서도 한글을 읽을 수 있도록 UTF-8 BOM과 인용부호를 사용한다. 이는 로컬 개발 리뷰용 전체 registry 목록이며 사용자별 권한 API 또는 운영 통계가 아니다. 앱에서는 기존 회사 범위 검사를 거쳐 미디어를 조회한다.

공통 `mediaAssets`는 파일/출처를, `mediaBindings`는 불변 객체 ID/적용 범위를 보관한다. `EntityMedia`는 대상·종류·출처·일치 상태를 함께 전달한다. 검수된 사진을 확보하면 같은 대상 ID의 연결과 출처/개정 검수 정보를 교체하면 된다. 새 사진 등록이 BOM·재고·장착 사건·대체 승인·품질 판정의 사실을 바꾸어서는 안 된다.

## 확인 범위

인벤토리 스크립트는 중복 객체 ID, 연결 대상 존재 여부, 등록 파일 존재와 SHA-256을 검사한다. 이미지가 화면에 보이는지, 비율과 확대가 적절한지, 테마와 모바일에서도 배지/설명이 보이는지, 실패·권한 없음·Esc 복귀가 동작하는지는 별도의 브라우저 검증 항목이다. 실행 결과는 [VALIDATION.md](VALIDATION.md)에 기록한다. 파일 해시는 출처나 정확한 제품/개정의 진위 검증을 대체하지 않는다.
