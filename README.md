# ontologics ERP — UI v2.6

Work에서 만든 React / TypeScript / Vite 프론트엔드의 검토용 기준 소스입니다. 앱은 [`ontologics-prototype/`](ontologics-prototype/)에 있으며 브라우저 Mock과 별도 로컬 그래프 서버를 사용합니다. 실제 ERP 서버·인증·DB·LLM 연결이 완료된 상태는 아닙니다.

v1.7 패키지의 실제 BOM 원본·출처를 화면과 Mock에 반영했습니다. 실제4모델·5스냅샷·356원문 행이며, 실장·단위·정확 MPN과 독립 검수는 미완료입니다. 패키지 전체 실행 계획이나 ERP DB/Agent 백엔드를 구현한 변경은 아닙니다. 앱의 `package.json` 버전 `1.0.0`과 납품 버전 `UI v2.6`은 서로 다른 표기입니다.

## 실행

Node.js 22.13.0 / npm 10.9.2로 검증했습니다. `nvm`을 사용한다면 앱 폴더에서 `nvm use`로 `.nvmrc` 버전을 선택할 수 있습니다.

```sh
cd ontologics-prototype
npm ci
npm run assets:fetch
npm run dev -- --port 5175 --strictPort
```

다른 터미널에서 같은 앱 폴더로 이동해 `npm run graph`를 실행합니다. 업무 화면은 `http://127.0.0.1:5175/`, 그래프 서버는 `http://127.0.0.1:5176/`를 사용합니다. 그래프 창은 업무 화면의 연결 버튼을 통해 엽니다. 이미 포트가 사용 중이면 기존 프로세스를 임의 종료하지 마세요.

제조사 참고 사진 4장은 원본에 재배포 라이선스 미확인으로 기록되어 있어 공개 Git 이력에 포함하지 않았습니다. `assets:fetch`는 공식 출처에서 내려받아 크기와 SHA-256을 확인하고 로컬에 복원합니다. 같은 파일은 보존하며 다른 파일을 덮어쓰지 않습니다. 외부 접속을 사용할 수 없다면 원본 소스의 해당 파일을 로컬 경로에 복사한 뒤 같은 명령으로 검증할 수 있습니다. 사진 없이도 빌드는 가능하지만 전체 화면 검증에는 복원이 필요합니다. 복원은 재배포 권리를 부여하지 않습니다.

## 검증

```sh
npm run build
npm test
npm run test:graph
ONTO_PREVIEW_URL=http://127.0.0.1:5175 npm run test:e2e
```

브라우저 검증에는 Google Chrome과 위 두 서버가 필요합니다. 의존성, 빌드 결과, 테스트 결과와 캡처는 Git에서 제외합니다. 이번 가져오기 결과와 결정 근거는 [ADR-0001](docs/adr/ADR-0001-ui-v26-source-import.md), 파일별 원본·반입 해시는 [반입 명세](docs/UI_V2.6_IMPORT.json)를 확인하세요. 앱 안의 `DELIVERY.json`, `SOURCE_MANIFEST.json`, 과거 검증 문서는 원래 납품 기록으로 보존했습니다.

## 개발 기준

Codex Cloud에서 이 PR 브랜치 또는 병합 후 검증된 커밋을 선택하고 시작 시 브랜치와 커밋 SHA를 확인합니다. 설치는 `ontologics-prototype/`에서 수행합니다. 사진 복원이 필요하면 `www.olimex.com` 접근이 필요합니다. 자동 배포·유료 모델 호출은 구성하지 않았습니다.

변경은 별도 브랜치와 PR로 검토합니다. 기존 UI를 임의 재작성하지 않고, 중요한 기술 선택은 문제·대안·근거·트레이드오프·검증 결과와 함께 `docs/adr/`에 기록합니다.

## 실제 BOM과 ABox 탐색

제품·BOM 등록에서 L/L1·POE-ISO N·EVB C·GATEWAY I를 선택해 원문 표·정합성·부품 구성도를 탐색합니다. 원문7파일과 고정 커밋/해시는 같은 객체 ID로 연결됩니다. 등록 명령은 기존 L1 정확 버전 시연만 지원하며 다른 구성은 읽기·검토 상태로 남습니다.

온톨로지 지도의 업무 전체 지도는 ABox 개별 객체를 공통 QueryPort에서 100개씩 읽고, 12행씩 펼칩니다. 현재 보드·수량·원문/합성 자료 필터와 선택 객체 주변 관계를 제공합니다. 클래스·관계 탐색과 관리자 초안은 유지합니다. 원문 행을 실제 장착 사건으로 추론하지 않습니다.

새 구매 기본 예시는 EVB C의 C18/C26에 연결한 합성 품목입니다. 기존 IM-0008 구매와 독립 IO/추적/재생산 예시는 별도 범위로 보존했습니다. PoE 입고를 EVB 구매 입고로 합산하지 않습니다.

근거·중요한 선택·복구 절차는 [ADR-0002](docs/adr/ADR-0002-v17-bom-alignment-abox.md), 원본 대조는 [BOM 감사](ontologics-prototype/docs/BOM_SOURCE_AUDIT.md), 이번 검사와 이전 기록 구분은 [검증 기록](ontologics-prototype/docs/VALIDATION.md)을 참조하세요. 소스 카탈로그와 재현 스크립트는 포함하며 전체 v1.7 ZIP은 Git에 추가하지 않습니다.
