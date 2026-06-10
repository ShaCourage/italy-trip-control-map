# 작업 인계 메모

마지막 갱신: 2026-06-10 (루트 조작 순수 함수화 + 자동 검사)

## 현재 상태

- 브랜치: `main`
- 원격: `origin` (`https://github.com/ShaCourage/italy-trip-control-map.git`) — **비공개 저장소**
- 검증: `npm run build`가 데이터 무결성·루트 규칙 검사부터 실행. 프리뷰에서 저장소 v3 마이그레이션·데이터 보존·콘솔 에러 0 확인

## ⚠️ 사용자 결정 필요 — 배포(A3)

GitHub Pages 활성화가 **무료 플랜 + 비공개 저장소 조합이라 거부됨(422)**. 셋 중 하나가 필요:

1. **저장소 공개 전환** (GitHub Settings → General → Danger Zone) — 비용 0. 단, 코드와 여행 일정 데이터가 공개됨 (민감정보는 localStorage에만 있어 공개돼도 노출 안 됨)
2. **GitHub Pro 업그레이드** — 비공개 유지한 채 Pages 사용
3. **Vercel/Netlify 등 다른 호스팅** — 해당 서비스 계정 연결 필요

해결 후 할 일 (2분): `.github/workflows/deploy.yml`의 `on:`에 `push: {branches: [main]}` 추가 → Actions 탭에서 Deploy to GitHub Pages 수동 실행 1회. 베이스 경로·PWA·오프라인 캐시는 전부 준비돼 있음.

## 이번 세션에서 한 일 (배포 준비 + 저장소 통합)

### A3 배포 준비 — Pages 활성화만 막힘
- `.github/workflows/deploy.yml` 작성 (현재 workflow_dispatch 전용 — push마다 실패 알림 쌓이는 것 방지)
- PWA 하위경로 안전화: `sw.js`가 자기 URL에서 BASE 유도, manifest는 상대경로(`./`), SW 등록은 `import.meta.env.BASE_URL` — `/italy-trip-control-map/` 하위에서도 동작
- `sw.js` v2 재작성:
  - 내비게이션 **network-first** — 기존 cache-first는 새 배포가 영영 안 보이는 버그였음
  - 위키미디어 사진 + jsdelivr 폰트 런타임 캐시 — **오프라인에서 장소 사진 뜸** (한 번 본 것)
  - 지도 타일(OSM)은 캐시 제외 — 용량 폭주 방지, 지도는 온라인 전용
- `npm run build -- --base=/italy-trip-control-map/` 검증 완료

### F4 저장소 통합 (완료) + F1 첫 조각
- `src/lib/storage.ts` 신설: 단일 키 **`italy-trip-state-v3`** + `loadSlice`/`saveSlice` API
- 레거시 키 8개(settings/days/routes/customPlaces/done/checks/notes/docs) 자동 마이그레이션 + 제거, v3 존재 시 잔재도 정리
- App.tsx에서 localStorage 직접 참조 제거 — 현재 백업 내보내기/복원 파일 포맷 version 6

## 직전 세션 (템플릿 + 대량 수집)

### 여행 템플릿 4종 (`src/templates.ts`)
- `classic`(기존 tripDays 재사용) / `foodie` 미식 로드 / `relaxed` 여유 만끽(하루 4곳 이하+한낮 시에스타) / `photo` 인생샷 헌터(골든아워 동선)
- 날짜 골격(로마 5 + 6/24 이동 + 피렌체 4)과 예약 앵커(콜로세움·바티칸·우피치·아카데미아·두오모·기차)는 4종 공통
- **진입점 문제 해결**: 일정 탭에 상시 "여행 템플릿" 섹션(미니카드 4개) + 빈 일정 시작 화면도 4카드로 — 기존엔 일정 적용 후 재진입 불가였음
- `applyTemplate(templateId)`: 기존 코스 있으면 confirm 후 교체, `settings.appliedTemplateId` 저장
- "추천 코스"(지도 추천안·일정 추천코스)가 적용된 템플릿을 따라감 — `activeTemplateRoutes()` (App.tsx 모듈 레벨)

### 장소 38곳 대량 추가 (`src/morePlaces.ts`, 로마 18 + 피렌체 20)
- 가격(price)·메뉴(menuHints)·특징·팁·주의사항 전부 포함, App.tsx에서 `basePlaces+extraPlaces+morePlaces` 병합
- enhancement 38건 추가 (highlights/reviewSignals/bestFor, 주요 명소엔 story) → 커버리지 175곳 전체
- 위키 사진 7곳 추가 굽기(코페데·산루이지·비토리아·아피아·산마르코·오르산미켈레·산토스피리토) → 실사진 70곳
- 좌표는 도보 내비 수준 근사값(±100m) — 정밀 이동은 카드의 Maps 링크 전제
- Google 평점 미확인 상태라 전부 내부 추천점수(rank)로 표시됨 (점수 정책 유지)

### 검증 스크립트
- `scripts/check-data.mjs` — TypeScript AST 기반으로 장소·출처·보강 데이터·템플릿을 분리해 검증
- `npm run check:data`가 중복 ID, 좌표 범위, placeId/pairWith/sourceIds 참조, 출처 누락, 고아 보강 데이터, 이미지 출처, Google 확인일을 검사
- `scripts/check-route-ops.mjs` — 중복 추가, 잠금 삭제·이동, 숙소 복귀 앞 삽입, 교체, 저장 루트 정제 규칙 검사
- `npm run build`의 첫 단계로 연결되어 데이터나 루트 규칙 오류가 있으면 번들링 전에 실패

## 직전 세션에서 한 일

### UI/UX 전면 개편
- `src/styles.css`에 디자인 토큰 도입: 폰트 7단계(`--fs-2xs`~`--fs-xl`), 웜 팔레트(크림 배경 + 테라코타 강조), 라운드 3단계 — 기존 26종 제각각이던 font-size 전부 토큰으로 치환
- Pretendard Variable 폰트 적용 (`index.html` CDN, 시스템 폴백 포함)
- 액티브 상태·주요 버튼을 테라코타로 통일, 하단 네비는 소프트 틴트 방식
- 지도 마커 이원화: 도시 줌에서는 카테고리색 점·루트 숫자 원, 확대(줌 15+)·선택 시에만 텍스트 라벨 — 라벨 136개 겹침 문제 해소 (`ZoomWatcher`)
- 탭 순서 재구성: 오늘 → 지도 → 장소 → 일정 → 더보기 (기본 시작 탭 = 오늘)

### 장소 탭 재설계 (인기 랭킹)
- `RankingScreen`: 사진형 카드 목록 (`PlacePhotoCard`) — 순위 플래그, 점수 칩(Google 검증 시 ★평점 / 아니면 내부 추천점수), 2줄 설명, 특징 배지 3개
- 정렬 컨트롤: 인기순 / 평점순 / 소요시간순
- 카드 탭 → 바텀 시트 상세 (`PlaceInsightCard` 재사용, 풀 설명·평가 포인트·메모까지)

### 데이터 보강 (한국 블로그/여행 콘텐츠 리서치 기반)
- enhancement 커버리지 57곳 → **137곳 전체** (highlights/reviewSignals/bestFor)
- 상세 설명 `story` 필드 신설, 상위 인기 장소 약 45곳에 풀 설명 작성
- 사진: Wikipedia REST 썸네일 URL을 빌드타임에 구움 — **63곳 실사진**, 나머지는 카테고리 그래픽 폴백 (`scripts/fetch-images.mjs`)
  - 주의: 위키미디어가 320/640/800px 등 표준 버킷 핫링크를 400으로 차단함 — REST가 주는 URL(330px)을 그대로 써야 함
- 신규 장소 5곳: 달오스테(티본), 파씨·올드브릿지(3대 젤라또), 쿨데삭(와인바), 라 타베르나 데이 포리 임페리알리
- 인기점수(rank) 12곳 보정 (졸리티·네르보네·올안티코비나이오 상향 등)
- 깨진 pairWith 참조 2건 수정 (`pompi-vatican`, `la-taverna-dei-fori-imperiali`)

### 스크립트 (`scripts/`)
- `inventory.mjs` — 데이터 커버리지 점검
- `fetch-images.mjs` — 위키 썸네일 굽기 (`--apply`로 주입, 드라이런 기본)
- `inject-stories.mjs`, `rerank.mjs`, `strip-images.mjs` — 일회성 보강 도구 (재실행 안전)

## 이어서 할 일

- **A3 배포 마무리** — 위 "사용자 결정 필요" 해결 → deploy.yml push 트리거 복원 → Actions 1회 실행 → iPhone 홈 화면 추가 + 비행기 모드로 오프라인 확인
- **F1 구조 분리(완료)** — `App.tsx` 약 3,200줄 → 약 800줄. `appCore.ts`, 공용 UI, `MapScreen`, `RankingScreen`, `TodayScreen`, `PlanScreen`, `MoreScreen` 분리 및 lazy loading 적용. vendor 청크 분리로 500kB 경고 제거
- **F3 루트 조작 규칙(완료)** — `src/lib/routes.ts`에 추가·교체·삭제·이동·정제 규칙 통합, 잠금/중복/숙소 복귀 규칙 자동 검사
- **F6 데이터 빌드 검증(완료)** — 실제 179개 장소 기준 AST 검사, `npm run build` 선행 게이트 적용
- **사진 미해결 6곳** — 위키 문서가 없는 식당들(roscioli, armando-al-pantheon, sant-eustachio, tazza-doro, buca-lapi, forno-campo-de-fiori). 직접 찍은 사진이나 무료 이미지 수동 지정 가능 (`placeEnhancements.ts`의 `imageUrl`)
- **문서함 UX(완료)** — 유형 선택·필터, 문서 수정, HTTP(S) URL 검증 및 기존 문서 `기타` 유형 마이그레이션

## 다음 PC에서 바로 확인할 명령

```bash
npm install
npm run build
npm run dev
```

## 2026-06-10 F1 구조 분리 완료

- `src/appCore.ts`: 장소 병합·검증, 템플릿 루트, 점수·거리·URL·사용자 장소 등록 로직 분리
- `src/components/place.tsx`: 장소 미디어, 상세 카드, 추천 코스, 공용 위젯 분리
- `src/screens/MapScreen.tsx`, `src/screens/RankingScreen.tsx`: 화면 단위 분리 및 `React.lazy` 적용
- `src/screens/TodayScreen.tsx`, `src/screens/PlanScreen.tsx`, `src/screens/MoreScreen.tsx`: 나머지 주요 화면도 분리
- 모바일 템플릿 진입점 강화: 하단 `일정` 메뉴를 `템플릿`으로 변경, 오늘 화면에 `템플릿 변경` 버튼 추가
- `vite.config.ts`: Rolldown vendor 그룹 분리
- 빌드 결과: 메인 287.98kB, vendor 352.03kB, 화면 청크 3.81-11.48kB
- 검증: `npm run build`, `npm run check:data`, 390px 모바일 템플릿 진입·4카드·More 화면, 콘솔 오류 0

## 2026-06-10 F6 데이터 빌드 검증 완료

- 기존 정규식 검사가 일정·출처 ID까지 장소로 집계해 217개로 잘못 보고하던 문제 수정
- TypeScript AST로 `places`, `extraPlaces`, `morePlaces`, 출처, 보강 데이터, 템플릿을 구조적으로 분리
- 현재 기준: 장소 179개, 출처 29개, 보강 데이터 175개, 템플릿 4개
- `npm run check:data` 추가, `npm run build` 시작 전에 자동 실행

## 2026-06-10 F3 루트 조작 규칙 완료

- `src/lib/routes.ts`로 RouteItem 타입과 루트 조작 순수 함수 분리
- 장소 추가는 중복을 막고 마지막 잠금 숙소 복귀 바로 앞에 삽입
- 완료·잠금·숙소·역을 제외한 현장 교체, 잠금 항목 삭제·이동 차단 규칙 통합
- 사용자 장소 삭제 시 전 일정에서 제거, 백업/저장 루트의 깨진 장소 정제
- `npm run check:routes` 추가, `npm run build` 선행 단계로 연결
- 390px 모바일에서 템플릿 5개 루트 → 추천 장소 추가 후 숙소 복귀가 마지막 6번으로 유지됨, 콘솔 오류 0
