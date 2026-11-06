# v1.7 실제 BOM 원본 정합화 감사 — 2026-11-06

이번 기록은 기존 v2.6 UI를 유지하면서 실제 원본 범위를 넓힌 소스 감사와 공통 데이터 검증이다. 아래 2026-11-04 기록은 당시의 미확보 상태를 포함한 이력으로 보존한다. 현재 범위는 **실제 4모델·5스냅샷·356원문 행**이며, 독립 합성 IO/SENSE/PWR 3스냅샷은 이 실제 수에 더하지 않는다.

## 입력·출처와 무결성

입력은 사용자가 제공한 `ontologics_solo_docs_data_v1.7.zip`이다. ZIP 크기는 **907,658 bytes**, SHA-256은 `314b731fb899378961cffccadab2d1b49bf8f0cec0c376f9b101af67c90c13dc`다. 내부 루트는 `ontologics_codex_handoff_v1.7/`다. 원본은 `data/raw/`, 출처는 `data/source_manifest.json`, 구조화 후보는 `data/normalized/`에 있다. 첨부 문서의 구현 지시는 현재 사용자 요청이나 실제 저장소 규칙을 대신하지 않는다.

- 패키지 `MANIFEST.json`에 기록된 53개 파일의 크기·SHA-256을 읽기 검사했으며 불일치는 0개였다.
- 실제 BOM 원본 5개 각각의 SHA-256·Git blob SHA-1·바이트 수가 출처 명세와 일치했다.
- 기존 UI의 ODS/PDF 원본 4파일은 v1.7에 포함된 같은 파일과 바이트 단위로 동일했다. 새 CSV 3파일을 추가하여 공개 원문 근거 목록은 7파일이다.
- 새 회로도·데이터시트 수집, 독립 사람 검수, 전기적 적합성·MPN 확인, 실제 실장 판정, ERP 원장 적재를 수행했다는 의미는 아니다.

| 스냅샷 | 원문 행 | 원문 수량 숫자의 합 | 참조 토큰 | UI 구성 ID | 출처 ID |
|---|---:|---:|---:|---|---|
| ESP32-PoE L WROOM | 74 | 128 | 128 | `CFG-POE-L` | `SRC-L-ods` |
| ESP32-PoE L1 WROOM | 74 | 128 | 128 | `CFG-POE-L1` | `SRC-L1-ods` |
| ESP32-POE-ISO N | 75 | 138 | 138 | `CFG-POEISO-N` | `SRC-ISO-N-csv` |
| ESP32-EVB C | 71 | 155 | 149 | `CFG-EVB-C` | `SRC-EVB-C-csv` |
| ESP32-GATEWAY I | 62 | 111 | 111 | `CFG-GATEWAY-I` | `SRC-GATEWAY-I-csv` |
| 합계 | **356** | **660** | **654** | 실제 5스냅샷 | BOM 5원본 + 대응 PDF 2개 |

356은 고유 부품 수가 아니고 660은 조달·실장 수량이 아니다. 참조 토큰도 물리적 장착 수를 증명하지 않는다. 모든 356행의 `populationStatus`는 `unreviewed`, `quantityUnit`은 `null`, 독립 검수 상태는 `not_independently_reviewed`다. 원문 `Supplier and ref`는 전체 행에서 비어 있으며 명칭이 품번처럼 보여도 검증된 제조사·MPN으로 승격하지 않는다.

원본 SHA-256:

| 원본 | SHA-256 |
|---|---|
| L ODS | `ef4f04d46ca8f3961f6ac528320011679a14c57007717b5972c32551e9c51a5e` |
| L1 ODS | `773c8b3fb0fa9f9c354586d12fd6bffd02b156b94d07e23e671c1205ab918e95` |
| ISO N CSV | `a3a3af329d7fa1e6e86a92badfde1c189513a76c2510d31d3f5bfcd7e93b472c` |
| EVB C CSV | `aad5f832c81f6ae1ebdb169cf482f02f538944078bb2d7242b52eed619b82ab6` |
| GATEWAY I CSV | `ec160e7d7d9dfc8e1673e9e8f15df7d8d4314d49c05f8dcface38e81acaa3247` |

원본의 공식 저장소·고정 commit·정확 경로·URL은 `src/actual-bom-data.json`의 `source`와 `src/catalog.json`에 연결한다. 모델 사진은 기존 제조사 참고 사진이며 정확 개정·실장 증거로 분류하지 않는다.

## 원문 대조와 보존한 예외

ODS XML을 별도로 읽어 L/L1 각 74행과 원문 행 번호를 확인했다. v1.7 정규화의 첫 네 셀과 일치했다. 기존 `src/bom-source.json`과는 L 17셀·L1 18셀의 공백 차이가 있으나 비공백 문자 차이는 0개였다. 기존 추출에는 서식 span 경계의 불필요 공백이 추가된 곳이 있다. 원본 파일과 기존 JSON은 그대로 두고 공통 실제 BOM 모듈은 검증된 v1.7 원문 셀을 사용한다.

- L 시트명은 `ESP32-PoE_Rev_J-BOM(WROVER)`, L1은 `ESP32-PoE_Rev_L1-BOM(WROVER)`다. WROOM 파일명·WROVER 시트명, L 파일·Rev J 시트명 충돌을 보존한다.
- CSV는 세미콜론 구분이며 ISO는 `Footprint`, EVB/GATEWAY는 `Package` 열을 사용한다. 첫 데이터 행은 `line=2`이고 ODS의 `row > 2` 필터를 적용하지 않는다.
- EVB에는 비어 있는 Designator 5행과 수량/참조 수 차이 5행이 있다. `line=55`의 원문 Designator는 쉼표 하나(`,`), 원문 수량은 2다. 위치를 발명하지 않는다.
- EVB `line=67`과 `line=71`의 `Ref**`는 서로 다른 원문 행이다. 같은 표기·사진·패키지라는 이유로 병합하지 않는다.
- NA/NS, Opened/Closed, 로고·fiducial·hole·testpad 표기는 검수 전 상태로 보존한다. 자동 분류 힌트 325행(component), 24행(non-procurement), 7행(board-setting)는 확정 조달 분류나 DNP 승인 상태가 아니다.
- 원문 표기·형식 경고와 전행의 독립 검수 미완료를 구분한다. 구조적 형식 일치가 실장·호환성·개정 승인 또는 품질 정상 판정이 아니다.

## 공통 연결과 변경 이유

`src/actual-boms.ts`가 5스냅샷의 공통 조회 접점이다. `sourceRowId`, 원문 행 번호·locator·원문 셀/필드·Quantity 문자열과 숫자 파싱값·참조 토큰·경고를 함께 보존한다. 파일 hash와 행 locator를 사용하므로 이름·참조 위치·사진 변경으로 객체 식별이 바뀌지 않는다.

L/L1의 기존 `PART-POE-{L|L1}-{원문행}` 및 `BOM-POE-{L|L1}-{원문행}` ID는 유지한다. 새 CSV는 `PART-POEISO-N-{line}`, `PART-EVB-C-{line}`, `PART-GATEWAY-I-{line}`으로 식별한다. 전체 원문 행을 해당 구성과 설계 관계로 연결하며, 재고·로트·생산·납품·클레임은 합성 근거와 별도 관계를 사용한다.

원문 Quantity의 단위가 확인되지 않아 실제 원문 표의 단위를 `미확인`으로 보완했다. 합성 운영의 EA 단위와 수량 계산은 해당 시연 가정으로 유지한다. 예를 들어 PoE L1 U2 원문행56→`PART-TPS`의 100대×1 EA, EVB C C18/C26 원문행21→`IM-EVB-C-C18-C26`의 40대×2 EA는 합성 품목 매핑이다. 원문 실장 승인이나 모든 BOM의 제조 소요 계산으로 표현하지 않는다. 기존 `IM-0008`의 10uF/25V는 독립 예시로 남기며 실제 EVB 원문의 10uF/6.3V를 덮어쓰지 않는다.

## 재현 명령과 이번 수행 기록

앱 폴더에서 실행한다. 입력은 ZIP 또는 `data/`가 들어 있는 추출 루트다. 패키지 내 스크립트를 실행하지 않으며 저장소의 고정 원본용 오프라인 가져오기를 사용한다. 원본 bytes·Git blob SHA·SHA-256·원문 셀·수량·참조·locator가 다르면 실패한다. 범용 업로드 파서가 아니며 운영의 임의 문서 실행이나 수식 계산을 지원하지 않는다.

```sh
python3 scripts/import-actual-boms.py --input /path/to/ontologics_solo_docs_data_v1.7.zip
python3 scripts/import-actual-boms.py --input /path/to/ontologics_solo_docs_data_v1.7.zip --check
npm test -- --run tests/actual-boms.unit.test.ts tests/media.unit.test.ts
npx tsc -b
```

2026-11-06 12:31 KST까지 실제 확인한 범위: 가져오기 및 재생성 비교 통과(5스냅샷·356행·원본 hash 5개), 새 공통 원본 검사9개와 기존 미디어 검사5개 합계14개 통과, TypeScript 검사 통과. 이 숫자는 최종 전체 브라우저 검사나 과거 납품 검사 수가 아니다. 최종 통합 실행과 화면 확인은 [VALIDATION.md](VALIDATION.md)의 해당 작업 기록을 따른다.

## 출처 고지의 확인 범위

v1.7 `source_records/THIRD_PARTY_SOURCES.md`가 기록한 확인 상태를 보존한다. ISO의 CERN OHL v1.2 고지와 Gateway의 자료 종류별 라이선스 고지가 기록되어 있으나 PoE·EVB의 전체 적용 범위 및 일부 파일별 licence 검토는 완료된 것으로 기록하지 않았다. 이 감사는 법률적 배포 허용 판정이 아니다. 기존 제조사 사진4개의 공개 Git 제외·로컬 복원 정책과 이미지의 참고 자산 분류는 별도로 유지한다.

---

# 이전 기록 — 2026-11-04 L/L1 원본 범위 점검

2026-11-04에 로컬 파일을 직접 읽어 확인했다. 네 보드 전체 자료 검수나 실제 제조 적합성 검증과는 별도다. 네트워크로 새 원본을 수집하지 않았다.

## 실제 확인 결과

| 구성 | 포함 파일 | ODS의 비어 있지 않은 행 | BOM 데이터 행 | 원본 행 범위 | 추출 JSON 대조 |
|---|---|---:|---:|---|---|
| ESP32-PoE L WROOM | L-WROOM.ods / L-WROOM.pdf | 75 (헤더 1 포함) | 74 | 3~82, 원본 빈 행 유지 | 첫 4열 × 75행, 공백 제외 값 일치 |
| ESP32-PoE L1 WROOM | L1-WROOM.ods / L1-WROOM.pdf | 75 (헤더 1 포함) | 74 | 3~81, 원본 빈 행 유지 | 첫 4열 × 75행, 공백 제외 값 일치 |

검사 방법은 ODS ZIP의 `content.xml`을 읽고 table-row와 반복 행/열을 전개해, Quantity·Designation·Package·Designator 네 열을 `src/bom-source.json`의 원본 행 번호와 비교한 것이다. 각 개정 300셀(헤더 포함)의 비공백 문자 불일치는 0개이고, 누락된 비어 있지 않은 행은 0개였다. BOM 표시의 `row > 2`는 헤더를 제외한 74행을 가리킨다.

기존 추출 JSON은 서식 span 경계나 문단 줄바꿈을 공백으로 합친 곳이 있다. **원본 셀 바이트/공백까지 동일한 추출이라고 주장하지 않는다.** 문자열 정규화 없는 원문 표시가 필요하면 포함된 ODS를 열어 확인한다. 수량/품목/위치의 업무 의미와 PDF 전행을 사람이 대조한 검수는 이번 검사에 포함되지 않았다.

네 원본 파일의 SHA-256을 다시 계산해 `src/catalog.json`의 값과 비교했으며 모두 일치했다.

| 원본 ID | SHA-256 대조 |
|---|---|
| SRC-L-ods | 일치 |
| SRC-L-pdf | 일치 |
| SRC-L1-ods | 일치 |
| SRC-L1-pdf | 일치 |

## 보존한 불일치와 해석 한계

- L 파일의 시트명은 `ESP32-PoE_Rev_J-BOM(WROVER)`다.
- L1 파일의 시트명은 `ESP32-PoE_Rev_L1-BOM(WROVER)`다.
- 파일명의 WROOM과 시트명의 WROVER, L 파일과 Rev J 시트명 불일치를 수정하거나 숨기지 않는다.
- NA/NS/Opened 표기와 실장 상태를 일괄 FIT 또는 DNP로 바꾸지 않는다.
- 실제 ODS의 전체 비어 있지 않은 BOM 행을 포함했다는 범위 확인과 실제 개정/구성 의미·품목 매핑 승인 완료는 다르다.
- PDF 파일의 해시 일치는 PDF/ODS 전행의 의미 일치를 뜻하지 않는다.

## 네 모델 목표와 합성 예시

| 구분 | 모델·스냅샷 | 현재 상태 |
|---|---|---|
| 실제 포함 | ESP32-PoE L / L1 | 실제 ODS/PDF 4파일, ODS 데이터 74행씩 |
| 실제 확보 목표 | ESP32-POE-ISO N / ESP32-EVB C / ESP32-GATEWAY I | 요구 문서에 조사 기록이 있으나 이번 로컬 프로젝트에 전체 원본 미포함. `확보 대상 모델`로 남김 |
| 독립 합성 예시 | IO-24 A / SENSE-4 A / PWR-12 B | 화면 상호작용을 위한 합성 설계. 각 합성 예시 내 전체 구성만 제공 |

실행 가능한 예시 4모델·5스냅샷은 **실제 1모델·2스냅샷 + 독립 합성 3모델·3스냅샷**이다. 원문이 지정한 실제 4종·전체 BOM 5스냅샷 확보/검수 완료로 계산하지 않는다. 미확보 모델에 다른 보드 BOM을 복사하거나 중간조립체를 만들어 표시하지 않는다.
