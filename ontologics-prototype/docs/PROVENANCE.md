# v1.7 실제 BOM 출처 확장 — 2026-11-06

현재 사용자 요청에 따라 확보된 실제 4모델·5스냅샷을 UI의 공통 원문 데이터에 연결했다. 이전 L/L1 원본4파일을 그대로 보존하고 아래 CSV3개를 추가했다. `src/catalog.json`과 다운로드 가능한 `public/evidence/catalog.json`은 같은7개 출처·경로·해시를 가진다. 파생 데이터는 구조적 파싱 후보이며 원문 실장·단위·제조사/MPN·매핑·승인 완료를 의미하지 않는다.

입력 패키지: `ontologics_solo_docs_data_v1.7.zip`,907,658bytes,SHA-256 `314b731fb899378961cffccadab2d1b49bf8f0cec0c376f9b101af67c90c13dc`. 원본 출처는 패키지 `data/source_manifest.json`의 저장소·고정commit·Git blob SHA·SHA-256을 보존했다. 새 CSV3개를 네트워크에서 재수집한 것으로 보고하지 않는다.

| 출처 ID | 고정 원본 URL | commit | SHA-256 |
|---|---|---|---|
| `SRC-ISO-N-csv` | [ESP32-PoE-ISO_Rev_N_BOM.csv](https://github.com/OLIMEX/ESP32-POE-ISO/blob/c19307ecd8a9d8c5703de7a1571cd89945e39c01/HARDWARE/ESP32-PoE-ISO-Rev.N/ESP32-PoE-ISO_Rev_N_BOM.csv) | `c19307ecd8a9d8c5703de7a1571cd89945e39c01` | `a3a3af329d7fa1e6e86a92badfde1c189513a76c2510d31d3f5bfcd7e93b472c` |
| `SRC-EVB-C-csv` | [ESP32-EVB_Rev_C.csv](https://github.com/OLIMEX/ESP32-EVB/blob/a3ec2f448109cb8f35ce7cb21a027bb7c837ab61/HARDWARE/REV-C/ESP32-EVB_Rev_C.csv) | `a3ec2f448109cb8f35ce7cb21a027bb7c837ab61` | `aad5f832c81f6ae1ebdb169cf482f02f538944078bb2d7242b52eed619b82ab6` |
| `SRC-GATEWAY-I-csv` | [ESP32-GATEWAY_Rev_I_BOM.csv](https://github.com/OLIMEX/ESP32-GATEWAY/blob/d45c9bc8120534b130a4f8bb8fa6cd3dc78e4ea0/HARDWARE/Hardware%20revision%20I/ESP32-GATEWAY_Rev_I_BOM.csv) | `d45c9bc8120534b130a4f8bb8fa6cd3dc78e4ea0` | `ec160e7d7d9dfc8e1673e9e8f15df7d8d4314d49c05f8dcface38e81acaa3247` |

## 기준시각의 구분

- **원본 출처 명세 기준:** v1.7 `data/source_manifest.json`의 `as_of`는 `2026-11-05`다. 패키지 검증·UI 연결 작업은2026-11-06에 수행했다. 이는 BOM 파일의 촬영·제조·실장 시각이 아니다.
- **합성 운영 기준:** UI의 재고·예약·생산·납품 예시는 기존 `SNAPSHOT_AT=2026-09-20T12:00:00+09:00`을 유지한다. 합성 원장 기준을 새 원본 수집일이나 실제 현장 관측일로 해석하지 않는다.
- **UI 버전:** `dataVersion`은 로컬 시연 업무 상태의 버전이다. 고정commit의 원본 바이트·소스 해시와 서로 다른 축이다. 승인·반영 이후에도 원본 출처는 덮어쓰지 않는다.

원문356행의 숫자 합660은 조달·실장 수량이 아니다. 합성 EA 단위와 수요 가정은 별도 매핑에 명시한다. 기존 PoE U2 시연과 신규 EVB C C18/C26 구매 시연을 서로 다른 구성·품목·근거 ID로 연결하며 미검수 원문을 실제 ERP 생산명세로 승격하지 않는다.

`python3 scripts/import-actual-boms.py --input /path/to/ontologics_solo_docs_data_v1.7.zip --check`가 공통 파생 데이터·원본 CSV3개·두 카탈로그를 비교한다. 입력 ODS 원본2개도 해시·셀·locator 검사를 거친다. 같은 출력 바이트는 다시 쓰지 않으므로 검증을 위한 반복 실행이 화면 데이터를 임의 변경하지 않는다. 전체 범위·예외·수행 결과는 [BOM_SOURCE_AUDIT.md](BOM_SOURCE_AUDIT.md), 이미지의 출처는 [MEDIA_ASSET_AUDIT.md](MEDIA_ASSET_AUDIT.md)에 기록한다.

원본 출처 고지와 권리 검토 상태를 유지한다. 실제 제조사 사진4장의 공개 Git 제외·로컬 복원 규칙은 BOM 원본 확보와 별개다. 아래는 기존 L/L1만 확보했던 당시의 기록이며 현재 확보 범위를 뜻하지 않는다.

---

# 이전 기록 — L/L1 원본 출처와 시연 자료

요구사항의 단일 기준은 첨부된 「ONTOLOGICS 서비스 요구사항 정의서」입니다. 기능 범위를 외부 자료로 확대하지 않았습니다. 실제 제품 근거만 문서가 지정한 OLIMEX 고정 커밋에서 확보했습니다.

고정 커밋: `deb38a377d50eadb04ddc7118a17a5ae58b1ee53`

| 원본 ID | 파일 | SHA-256 |
|---|---|---|
| SRC-L-ods | [ESP32-PoE_Rev_L-BOM(WROOM) .ods](https://raw.githubusercontent.com/OLIMEX/ESP32-POE/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/HARDWARE/ESP32-PoE-hardware-revision-L/ESP32-PoE_Rev_L-BOM%28WROOM%29%20.ods) | `ef4f04d46ca8f3961f6ac528320011679a14c57007717b5972c32551e9c51a5e` |
| SRC-L-pdf | [ESP32-PoE_Rev_L-BOM(WROOM).pdf](https://raw.githubusercontent.com/OLIMEX/ESP32-POE/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/HARDWARE/ESP32-PoE-hardware-revision-L/ESP32-PoE_Rev_L-BOM%28WROOM%29.pdf) | `e268ebf562c5e6b36dab7bcd377922c7cb5883ad88ba024f8b949d0e9cae89d0` |
| SRC-L1-ods | [ESP32-PoE_Rev_L1-BOM(WROOM) .ods](https://raw.githubusercontent.com/OLIMEX/ESP32-POE/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/HARDWARE/ESP32-PoE-hardware-revision-L1/ESP32-PoE_Rev_L1-BOM%28WROOM%29%20.ods) | `773c8b3fb0fa9f9c354586d12fd6bffd02b156b94d07e23e671c1205ab918e95` |
| SRC-L1-pdf | [ESP32-PoE_Rev_L1-BOM(WROOM) .pdf](https://raw.githubusercontent.com/OLIMEX/ESP32-POE/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/HARDWARE/ESP32-PoE-hardware-revision-L1/ESP32-PoE_Rev_L1-BOM%28WROOM%29%20.pdf) | `30e2e7c881d9a7c74cd95b1a63af4ac2ac7ae623ea05ec16e9faaf5ad19f3e9a` |

## 확인한 범위

4개 파일의 바이트를 내려받아 SHA-256을 계산했습니다. ODS의 `content.xml`에서 비어 있지 않은 표 행을 추출했습니다. 참조 위치·수량·품목 원문은 원본 그대로 보존합니다. L 원본의 내부 시트명은 `ESP32-PoE_Rev_J-BOM(WROVER)`, L1은 `ESP32-PoE_Rev_L1-BOM(WROVER)`입니다. WROOM 파일명과 불일치하며 화면에서 경고합니다.

정의서에서 정규화한 파일명과 실제 GitHub 파일명은 다릅니다. 실제 경로에는 `(WROOM)`과 확장자 앞 공백이 있으므로 `catalog.json`에 원본 경로를 그대로 기록했습니다. 기존 프로젝트 `data/catalog.json`과 `data/sources/`는 제공되지 않았습니다. 이 산출물의 카탈로그는 별도로 계산한 것이며 기존 카탈로그와의 일치를 주장하지 않습니다. PDF와 ODS의 전체 의미 일치·범용 OCR 검증은 수행하지 않았습니다.

## 자료 구분

- **실제 공개 설계**: L/L1 WROOM ODS/PDF, 원본 행, 품목·수량·참조 표기, 파일 해시.
- **요구사항의 가상 수용 사례**: U104 제거 9/12 09:00 및 충분한 확인 범위, A/B 조회 조건, U106 추가 확인, 100/60/50/20/15/20 수량, 구성 X 10−2=8.
- **프로토타입 보조 가상 기록**: 회사 A·공급처 S·부품 M·계약 DEMO-C01·시연 고객 A, 생산 총 62/불량 2, 출하·입고·도착의 보조 시각, 시연 자재 입고 50/40/5/5, U101 장착·제거, 시험팀 U104 예시. 실제 회사나 OLIMEX 생산·납품·고장 성과가 아닙니다.

구성 X/Y의 재생산 수량 사례는 U104/U106 목록에서 유도한 수량이 아닙니다. 목록과 납품 집계량의 완전성 연결이 미결이므로 UI에서도 독립 검증용 사례로 표시합니다.

공개 원본은 OLIMEX/ESP32-POE 프로젝트의 저작권·라이선스를 유지합니다. [원본 저장소 라이선스 안내](https://github.com/OLIMEX/ESP32-POE/blob/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/README.md)를 참조하세요. 원본은 변경하지 않았습니다.
