# ontologics ERP — UI v2.6

Work에서 만든 React / TypeScript / Vite 프론트엔드의 검토용 기준 소스입니다. 앱은 [`ontologics-prototype/`](ontologics-prototype/)에 있으며 브라우저 Mock과 별도 로컬 그래프 서버를 사용합니다. 실제 ERP 서버·인증·DB·LLM 연결이 완료된 상태는 아닙니다.

v1.7 설계 패키지는 별도로 전달될 예정이며 이 저장소에 포함되어 있지 않습니다. 앱의 `package.json` 버전 `1.0.0`과 납품 버전 `UI v2.6`은 서로 다른 표기입니다.

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
