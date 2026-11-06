# 디자인 토큰과 재사용 컴포넌트

기준일: 2026-11-04. 아래 값은 `src/redesign.css`의 실제 선언을 읽어 기록했다. `style.css`의 기존 공통 컴포넌트 위에 적용하고, `extended.css`는 같은 토큰을 사용한다. 요구서의 시작값과 실제 구현값을 구분한다.

## 색상

라이트가 기본이며 `data-theme="dark"`에서 아래 다크 토큰으로 전환한다. 사용자 선택은 브라우저 설정에 보존된다. 상태색은 문구와 함께 사용한다. `조건상 제외`는 안전 보장 색/의미로 바꾸지 않고 장착 이력은 결함으로 바꾸지 않는다.

| 용도 | CSS 토큰 | Light | Dark |
|---|---|---|---|
| 앱 배경 | `--app-bg` | `#f4f7fc` | `#0f172a` |
| 표·카드 표면 | `--surface` | `#fff` | `#1e293b` |
| 보조 표면 | `--surface-2` | `#f8fafc` | `#172235` |
| 본문 | `--text` | `#152a47` | `#e2e8f0` |
| 보조 글자 | `--muted` | `#475569` | `#94a3b8` |
| 작은 메타데이터 | `--subtle` | `#64748b` | `#a8b5c8` |
| 구분선 | `--border` | `#dce7f5` | `#334155` |
| 링크·포커스 | `--link` | `#2563eb` | `#60a5fa` |
| 강조 별칭 | `--blue` | `#2563eb` | `#60a5fa` |
| 내비게이션 | `--navy` | `#13263e` | `#0b1220` |
| 선택 배경 | `--selection` | `#edf4ff` | `#253a56` |
| 관계선 | `--graph-line` | `#9fb5d2` | `#647b98` |
| 정상 글자 | `--success` | `#047857` | `#34d399` |
| 정상 배경 | `--success-bg` | `#ecfdf5` | `#064e3b` |
| 주의 글자 | `--warning` | `#92400e` | `#fbbf24` |
| 주의 배경 | `--warning-bg` | `#fffbeb` | `#451a03` |
| 오류 글자 | `--error` | `#be123c` | `#fda4af` |
| 오류 배경 | `--error-bg` | `#fff1f2` | `#4c0519` |
| 진행 글자 | `--progress` | `#0e7490` | `#67e8f9` |
| 진행 배경 | `--progress-bg` | `#ecfeff` | `#164e63` |
| 미확인 글자 | `--unknown` | `#475569` | `#cbd5e1` |
| 미확인 배경 | `--unknown-bg` | `#f1f5f9` | `#334155` |

주 버튼은 두 테마 모두 흰 글자 / `#2563eb` 배경이며 hover는 `#1d4ed8`다. 테두리·미등록 사진 영역·관계선은 상태색을 대신하지 않는다. 배지의 purple 별칭은 현재 중립 미확인 토큰을 사용한다.

## 타이포그래피와 밀도

| 대상 | 실제 선언 | 사용 원칙 |
|---|---|---|
| 본문 기본 | 13px / line-height 1.55 | Inter, 시스템 sans-serif, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic fallback |
| 문단 | line-height 1.65 | 긴 근거·설명 줄바꿈 |
| 페이지 제목 | 24px, 좁은 화면 22px | 업무 대상·목적 중심 |
| 섹션 제목 | h2 16px; panel heading 15px | 밀도에 맞춘 단계 구분 |
| 하위 제목 | h3 14px | Inspector 제목은 19px |
| 표 | table 13px, td 12px, th 11px | 표 본문 실제 렌더는 td 규칙을 사용 |
| 폼 | input/select 13px, textarea 14px | 긴 검토 문장은 14px |
| 코드·ID·해시 | SFMono-Regular / Consolas / Liberation Mono, 기본 11px | 일반 한국어 본문에는 monospace를 적용하지 않음 |
| 숫자 | tabular-nums, 우측 정렬 | `.numeric`, `.ext-num` |
| 보조 문구 | 기본 small 12px; 세부 메타데이터 9~11px | 원문·수량 의미는 생략하지 않음. 작은 레이블의 실제 사용자 가독성 검수는 별도 |
| 기본 행 | `--row: 32px` | Compact |
| 넓은 행 | `data-density=comfortable`, `--row: 40px` | Comfortable |
| 업무 큐 행 | 70px | 제목+대상/근거 두 줄을 위한 별도 높이 |
| 기본 버튼 | 최소 32px 높이 | 페이지 이동·그래프 보조 조작 중 일부는 24~25px |
| 포커스 | 2px `--link`, offset 3px | 버튼·링크·입력·선택·textarea의 focus-visible |
| 표 스크롤 | 최대 높이 550px, 고정 헤더 | 전체 페이지를 가로로 밀지 않고 표 내부에서 스크롤 |

간격의 기본 단위는 4/8/12/16px이며 조밀한 표/칩에 3/5/6px, 패널과 큰 구조에 18/20/22/24px를 함께 쓴다. 현재 간격은 개별 CSS 선언이며 모든 간격이 CSS 변수로 추출된 것은 아니다. 모서리는 칩 3~4px, 버튼 5px, 패널 7px다.

## 레이아웃

| CSS 구간 | 실제 배치 |
|---|---|
| 기본 데스크톱 | 내비 208px + 중앙 minmax(0,1fr) + 보조 영역 292px |
| ≥1700px | 내비 220px + 중앙 + 보조 영역 320px |
| ≤1370px | 내비 190px + 중앙 + 보조 영역 276px |
| ≤1150px | 내비 190px + 중앙; 보조 영역은 우측 310px 패널 |
| ≤800px | 내비 접힘/모바일 메뉴; 중앙 단일 열 |
| reduced motion | animation·transition 비활성 |

우측 AI와 Inspector는 한 보조 영역의 모드다. 둘을 동시에 고정하지 않는다. 테마·밀도·보조 영역 전환·사진 확대는 업무 원장 변경이나 모델 호출이 아니다.

## 토큰 대비 계산

다음은 CSS의 전경/배경 sRGB 값으로 계산한 명암비다. 일반 크기 텍스트 AA 기준 4.5:1과 비교했다. 계산은 색상 토큰 쌍에 대한 확인이며 브라우저의 모든 중첩/disabled/hover 상태, 보조기술, 실제 사용자 가독성 인증은 아니다.

| 조합 | Light | Dark |
|---|---:|---:|
| 본문 / 표면 | 14.44:1 | 11.87:1 |
| 보조 글자 / 표면 | 7.58:1 | 5.71:1 |
| 링크 / 표면 | 5.17:1 | 5.75:1 |
| 정상 | 5.21:1 | 5.06:1 |
| 주의 | 6.84:1 | 8.97:1 |
| 오류 | 5.72:1 | 8.27:1 |
| 진행 | 5.15:1 | 6.29:1 |
| 미확인 | 6.92:1 | 6.97:1 |

## 재사용 컴포넌트·파일

| 파일 | 컴포넌트 / 책임 |
|---|---|
| `src/ui.tsx` | Badge, Button, Notice, Panel, Field, Modal, DataTable, LinkOut, 계정별 임시 입력 저장 |
| `src/entity.tsx` | EntityChip와 PreviewCard 표현, EntityInspector, MediaPanel, TraceGraph, BomTreeGrid |
| `src/entity-data.ts` | 불변 객체/관계/스냅샷, 실제 원본/합성 예시/미확보 대상 구분 |
| `src/main.tsx` | 공통 shell, 객체 선택·탐색 기록, AI/Inspector 전환, 테마·밀도, 계정 전환 |
| `src/ports.ts` | QueryPort, GraphPort, ActionPort, IdentityPort, AgentPort, MediaPort; 모의 구현과 실 어댑터 경계 |
| `src/domain.ts` | 공통 수량·시간·초안·정확 버전 승인·멱등 반영 계산 |
| `src/explorer.tsx` | WorkbenchHome, ObjectExplorer, Materials |
| `src/extended.tsx` | Procurement, Ontology, Operations |
| `src/screens.tsx` | Product, Boards, Trace, Reviews, Planning, Fulfillment, Claims, Evidence, Traceability |

DataTable은 TanStack Table 기반 검색·정렬·페이지·열 선택·행 선택을 제공한다. Modal은 Radix Dialog를 사용해 포커스와 Esc 경로를 유지한다. EntityChip은 객체 참조와 미리보기/Inspector 이동을 공유한다. 원문 없는 사진은 미등록 상태로 둔다.

이 문서는 코드 선언을 기록한 것이다. 실제 데스크톱·좁은 화면·키보드·테마·200% 확대의 수행 결과는 검증 보고와 캡처를 참조한다.
