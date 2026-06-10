# 작업 인계 메모

마지막 갱신: 2026-06-10 (UI 전면 개편 + 데이터 보강)

## 현재 상태

- 브랜치: `main`
- 원격: `origin` (`https://github.com/ShaCourage/italy-trip-control-map.git`)
- 검증: `npm run build` 통과, 모바일 뷰포트 전 화면 스크린샷 확인 완료

## 이번 세션에서 한 일

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

- **A3 배포** — iPhone 실사용을 위해 Vercel/Netlify/GitHub Pages HTTPS 배포 + PWA 홈 화면/오프라인 확인
  - 사진이 핫링크(upload.wikimedia.org)라 오프라인에선 안 뜸 — 서비스워커 런타임 캐시 고려
- **F4 저장소 통합** — localStorage 키 8개 → `italy-trip-state-v3` 단일 키 + 마이그레이션
- **F1 구조 분리** — `App.tsx` 약 3,000줄. `screens/RankingScreen.tsx`, `lib/storage.ts`부터 분리 추천. 빌드 청크 500kB 경고도 이때 같이 (코드 스플리팅)
- **사진 미해결 6곳** — 위키 문서가 없는 식당들(roscioli, armando-al-pantheon, sant-eustachio, tazza-doro, buca-lapi, forno-campo-de-fiori). 직접 찍은 사진이나 무료 이미지 수동 지정 가능 (`placeEnhancements.ts`의 `imageUrl`)
- **문서함 UX** — 문서 수정, 타입 필터, URL 검증 (기존 백로그 유지)

## 다음 PC에서 바로 확인할 명령

```bash
npm install
npm run build
npm run dev
```
