# 작업 인계 메모

마지막 갱신: 2026-06-14 (F2 카탈로그 통합 + 장소 개수 표기)

> 이 문서는 **현재 상태**와 **다음 할 일**만 담는다. 백로그 ID(A/B/C/F…)의 정의는 `DESIGN.md` §6~7,
> 완료된 기능의 상세 작업 기록은 `WORKLOG.md`(아카이브)를 본다.

---

## 현재 상태

- 브랜치: `main` · 원격: `origin` (`https://github.com/ShaCourage/italy-trip-control-map.git`) — **공개 저장소**
- **배포됨**: https://shacourage.github.io/italy-trip-control-map/ (main 푸시마다 자동 배포)
- 작업 트리 깨끗, `origin/main`과 동기화됨
- 검증 게이트: `npm run build` = `check:data` → `check:routes` → `tsc -b` → `vite build`
  (데이터/루트 규칙 오류가 있으면 번들링 전에 실패)
- 데이터 규모: 장소 248 · 출처 33 · 보강 175 · 템플릿 4 · 실사진 70곳
- 장소 집계 기준: `src/data/catalog.ts`가 기존 데이터 파일들을 한곳에서 모으고, `appCore.placeStats`가
  화면 표기용 전체/목록/도시/카테고리/보강/사진/출처 개수를 제공
- 동작 확인됨: 빈 셋업 → 템플릿 4종 적용, 루트 편집(잠금/숙소 복귀 규칙), 백업(v7)·복원,
  문서함, 예산, 공식 링크/현지명 병기, 저장소 v3 마이그레이션, 서비스워커 자동 갱신, 콘솔 에러 0
- UI 표기 원칙: 사용자가 보는 라벨은 한국어 우선. 장소명은 `원문명(발음, 뜻/성격)` 한 줄로 통일,
  구글 평점 미검증 장소는 임의 평점 대신 내부 `인기 {rank}`만 표시.
- 메뉴 구조: 하단은 `오늘/지도/일정/장소/도구`, 도구 안쪽은 `현장(안전·음식·회화)` ·
  `관리(준비물·문서·예산)` · `설정(숙소·업데이트·백업·지도 파일·출처)`으로 분리.
- 오늘 화면: 빈 루트에서는 `지도에서 고르기`/`장소 둘러보기`로 바로 이동하고, 상황별 후보는
  `구글지도` 확인과 `코스 추가`를 분리해 현장에서 바로 루트에 넣을 수 있음.
- 장소 화면: 도시·카테고리·빠른 조건·검색어가 걸린 상태를 한 줄로 보여주고, 결과 0개 상태와
  조건 초기화 버튼으로 바로 원복 가능.

---

## ✅ A3 배포 완료 (2026-06-11)

저장소 공개 전환 → GitHub Pages(Actions 빌드) 배포. **main 푸시마다 자동 재배포**.
- 사이트: https://shacourage.github.io/italy-trip-control-map/ (200, 하위경로 `/italy-trip-control-map/` base 정상)
- 활성화 과정에서 고친 것: ① 저장소 기본 워크플로 권한이 `read`라 `pages: write` 무력화 → `write`로 상향
  ② `npm ci`가 lock 불일치(`@emnapi` optional deps 누락)로 실패 → `package-lock.json` sync
  ③ `deploy.yml`에 `configure-pages@v5`(enablement) + `push: [main]` 트리거 추가
- **남은 iPhone 실기 확인**(사용자): Safari로 사이트 열기 → 공유 → 홈 화면에 추가 → 비행기 모드로
  오프라인 진입 확인(`sw.js` v2: navigation network-first, 위키 사진·폰트 런타임 캐시, 지도 타일 캐시 제외)

---

## 다음 할 일 (우선순위)

### 1. F2 — 데이터 파일 통합 (마지막 구조 리팩터, `DESIGN.md` §4/§6, 1차 완료)
"기본/추가"라는 현재 구분은 작업 이력일 뿐 의미 없음. 카탈로그 진입점은 통합했고, 물리적 도시별 분리가 남았다.

- 완료: `src/data/catalog.ts`에서 `data.ts`/`extraData.ts`/`morePlaces.ts`/`sitePlaces.ts`를 한 번에 모음.
  `appCore.ts`는 이 카탈로그만 읽고, `placeStats`로 실제 병합 결과의 개수를 계산
- 현 상태(물리 파일은 아직 분산): `src/data.ts`(`places`+`sources`) ·
  `src/extraData.ts`(`extraPlaces`+`extraSources`) · `src/morePlaces.ts`(`morePlaces`) ·
  `src/sitePlaces.ts`(`sitePlaces`, 사이트 확장 수집분)
- 남은 목표: `src/data/places/rome.ts`, `src/data/places/florence.ts`로 도시별 물리 분리
  (또는 최소한 단일 `places` 컬렉션으로 병합)
- **반드시 같이 고칠 것**: `scripts/check-data.mjs`가 파일 경로/컬렉션명을 하드코딩함
  (`placeFiles`/`sourceFiles`/`routeFiles` 배열, 5~14행). 데이터 파일을 옮기면 이 배열을 갱신해야
  `npm run check:data`가 통과
- 검증: `npm run build`(검사 통과) + 장소 248개 수 유지 + 프리뷰 장소 탭/지도 렌더 + 콘솔 0

### 2. 사진 미해결 6곳 (`src/placeEnhancements.ts`의 `imageUrl`)
위키 문서가 없어 자동 굽기가 안 되는 식당들:
`roscioli`, `armando-al-pantheon`, `sant-eustachio`, `tazza-doro`, `buca-lapi`, `forno-campo-de-fiori`
→ 직접 찍은 사진이나 라이선스 명확한 무료 이미지 URL을 `imageUrl`에 수동 지정. (안 하면 카테고리 그래픽 폴백 유지)

### 3. 남은 P2 / 비고
- **C2** 일몰 시간 — 오늘 화면 계산값 노출 완료. 추후 해질녘 추천 모드와 더 연동 가능

---

## 완료 (2026-06-14, Opus 세션 이어서)
- **F2 1차: 데이터 카탈로그 통합 + 개수 표기 정리** — `src/data/catalog.ts`를 추가해 장소/출처 데이터의
  런타임 진입점을 하나로 묶음. 장소 화면은 총 248곳·목록 244곳·도시별/카테고리별 개수를 표시하고,
  도구 화면은 전체/목록/중요 핀/보강/실사진/출처 개수를 같은 집계 기준으로 표시. `check:data`도
  목록·도시·카테고리 요약을 출력
- **오늘 화면 행동 흐름 개선** — 코스가 비어 있을 때 지도/장소 탭으로 바로 이동하는 CTA를 추가.
  상황별 선택 카드는 외부 지도로 즉시 빠지지 않게 바꾸고, `구글지도` 열기와 `코스 추가`를 분리해
  248개 장소 중 근처 후보를 오늘 루트에 바로 넣을 수 있게 함
- **장소 필터 복귀 UX** — 도시/카테고리/빠른 조건/검색어가 활성화되면 현재 조건 바와 `조건 초기화`
  버튼을 노출. 결과가 0개일 때도 같은 초기화 동선을 제공해 검색 상태에서 길을 잃지 않게 함
- **UI/UX 메뉴 정리** — 하단 `홈`→`오늘`, `더보기`→`도구`로 기능명을 명확화.
  도구 메뉴는 현장/관리/설정 그룹으로 분리하고, 장소 탭에는 `필수/예약/무료·저가/한국인/사진/실내`
  빠른 조건 필터를 추가해 248개 장소를 훨씬 좁혀 볼 수 있게 함
- **UI 한국어 통일 + 장소 확장** — 사용자 노출 문구에서 Must/Good/Maps/Google 혼용을 정리.
  `src/sitePlaces.ts`에 사이트 기반 로마·피렌체 후보 69곳을 추가해 전체 248곳.
  출처: Time Out, Eater 38/35, Condé Nast Traveler, Girl in Florence, Curious Appetite, Livingetc 등.
  인기점수는 구글 평점 추정 없이 출처 중복·첫 방문 실용성·동선 적합도·예약 난이도 기준으로 내부 rank만 사용
- **B4** 공식 영업시간/예약 링크 — `appCore.getOfficialSource()`가 `-official` 접미사 출처(콜로세움/판테온/
  바티칸/두오모/우피치/아카데미아)를 카드의 `.official-box`에 노출. 예약 필수·권장인데 공식 출처가 없으면
  구글 영업시간 검색 링크로 폴백. **추정 라벨 없음**(P1 준수)
- **C3** 현지명 병기 — 토글 대신 항상 병기로 단순화. `koName ≠ name`일 때 상세 카드(`.local-name`)와
  지도 팝업(`.popup-local-name`)에 현지명 노출. 식당 간판·구글맵 검색 대조용
- **C1** 예산 기록 — `lib/budget.ts`(EUR/KRW, 환율 합산 금지·통화별 따로), 더보기 `예산` 섹션에서 날짜별
  그룹·통화별 합계·추가/삭제. storage 슬라이스 `budget` + 백업 v7 포함

---

## 완료 요약 (2026-06-10 ~)

**구조 리팩터 (W1)**
- **F1** `App.tsx` 3,200 → 810줄. `appCore.ts`(병합·검증·점수·거리·URL·사용자 장소),
  `components/{place,schedule}.tsx`, `screens/{Map,Ranking,Today,Plan,More}.tsx` 분리 +
  `React.lazy` + vendor 청크 분리(500kB 경고 제거)
- **F3** `lib/routes.ts` — 루트 조작 순수 함수(추가·교체·삭제·이동·정제), 잠금/중복/숙소 복귀 규칙.
  `scripts/check-route-ops.mjs`로 자동 검증
- **F4** `lib/storage.ts` — 단일 키 `italy-trip-state-v3`, `loadSlice`/`saveSlice`,
  레거시 8키 마이그레이션 + self-healing. `App.tsx`의 localStorage 직접 참조 0. 백업 포맷 v6
- **F6** `scripts/check-data.mjs` — TS AST 기반 검사(중복 ID·좌표 범위·`placeId`/`pairWith`/`sourceIds`
  참조·출처 누락·이미지 출처·Google 확인일). `npm run build` 선행 게이트

**콘텐츠/UX (W2~W3)**
- 여행 템플릿 4종(`templates.ts`): classic/foodie/relaxed/photo. 일정 탭 상시 노출 +
  모바일 진입점(하단 `템플릿`, 오늘 화면 `템플릿 변경`). `applyTemplate(id)` + `appliedTemplateId` 저장
- 장소 대량 수집: `morePlaces.ts` 38곳(로마 18 + 피렌체 20), 가격·메뉴·팁 포함 → 커버리지 175곳, 실사진 70곳
- UI 개편: `styles.css` 디자인 토큰(폰트 7단계, 웜 팔레트), Pretendard, 마커 이원화(`ZoomWatcher`), 탭 순서 재구성
- 장소 탭: `RankingScreen` 사진형 카드 + 정렬(인기/평점/소요시간) + 바텀시트 상세
- **A1** 설정(숙소 좌표·시작 탭·기본 모드) · **A2** JSON 백업·복원 · **A4** 문서함(유형 5·필터·수정·URL 검증)
  · **B1** 내 장소 · **B2** 메모 · **B3** 못 간 곳 회수
- **F5** `lastChecked` 확인일 표시 · **F7** 랭킹 → 장소 개명 · **F8** 더보기 7 → 5섹션 통합
- **A3 인프라**(활성화만 대기): `deploy.yml`(workflow_dispatch 전용 — 실패 스팸 방지),
  PWA 하위경로 안전화, `sw.js` v2(navigation network-first, 위키 사진·jsdelivr 폰트 런타임 캐시, OSM 타일 캐시 제외)

---

## 다음 PC에서 바로 확인할 명령

```bash
npm install
npm run build   # check:data → check:routes → tsc → vite build
npm run dev
```

세션 마무리 관례: 의미 있는 작업 단위가 끝나면 이 문서의 **현재 상태 / 다음 할 일**을 갱신해 커밋하고
`origin/main`에 push된 상태로 끝낸다. (여러 PC를 오가는 작업)
