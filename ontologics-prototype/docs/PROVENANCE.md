# 원본 출처와 시연 자료

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
