# 작업 로그 — 템플릿 시스템 + 장소 대량 수집

마지막 갱신: 2026-06-10
이 문서는 진행 중 작업의 단일 기준점이다. 세션이 끊기면 여기서부터 재개한다.

## 요청 사항 (2026-06-10, 사용자)

1. **템플릿 진입점 문제**: 템플릿 선택(SetupScreen)이 일정 비어 있을 때만 떠서, 적용 후엔 다시 들어갈 방법이 없음 → 일정 탭에 상시 노출
2. **멀티 템플릿**: 수집된 장소 위주로 인기·동선·필수 관광지 고려해 여러 버전 작성
3. **장소 대량 수집**: 여러 사이트 기준으로 최대한 수집, 특징·가격·메뉴 포함

## 진행 상태

- [x] 1단계: 이 문서 작성 (계획 박제)
- [x] 2단계: 신규 장소 38곳 추가 (`src/morePlaces.ts`) + App.tsx 병합 (`basePlaces+extraPlaces+morePlaces`)
- [x] 3단계: 신규 장소 enhancement 38건 작성 (`placeEnhancements.ts` 끝부분) — 사진 fetch 실행 대기
- [x] 4단계: 템플릿 4종 작성 (`src/templates.ts` 신설, classic은 data.ts tripDays 재사용)
- [x] 5단계: UI — SetupScreen 4카드 / PlanScreen "여행 템플릿" 섹션 / applyTemplate(templateId) + 교체 confirm + settings.appliedTemplateId 저장 / 추천코스는 activeTemplateRoutes()로 적용 템플릿 추종
- [x] 6단계: 사진 fetch(7건 적용) → 참조 검증(check-refs.mjs 신설, porta-portese 1건 수정) → 빌드 통과 → 프리뷰 검증 → 커밋 → push → HANDOFF.md 갱신

### 6단계 결과 (2026-06-10 완료)
- `node scripts/fetch-images.mjs --apply`: 신규 7건 전부 OK (코페데는 it.wiki) + 누락이던 bargello도 회수 → 사진 70곳
- `node scripts/check-refs.mjs` 신설·통과 (217 ids) — seu-pizza의 pairWith `porta-portese` → `ai-marmi` 수정
- `npm run build` 통과 (tsc + vite)
- 프리뷰 DOM 검증: 일정 탭 템플릿 4카드 노출, foodie 적용 → 10일 교체 + `appliedTemplateId: "foodie"` 저장 + 6/20 루트가 미식 구성과 일치, 장소 탭 175카드·이미지 70개
- 참고: preview_screenshot 도구가 타임아웃(페이지는 정상, eval 응답) — 스크린샷 대신 DOM 검증으로 대체

## 설계 결정

### 템플릿 구조 (`src/templates.ts`)

```ts
type TripTemplate = {
  id: string;            // "classic" | "foodie" | "relaxed" | "photo"
  name: string;          // 카드 제목
  tagline: string;       // 한 줄 콘셉트
  description: string;
  highlights: string[];  // 칩 3개
  days: TripDay[];       // 10일 골격 (날짜 id는 2026-06-19 ~ 28 공통)
};
```

- 날짜 골격(로마 5 + 6/24 이동 + 피렌체 4)과 day id는 모든 템플릿 공통 — 기차/항공 고정이므로
- 예약 고정 장소(콜로세움, 바티칸, 우피치, 아카데미아, 두오모)는 모든 템플릿에 유지하되 배치 밀도만 다름
- `App.tsx`의 `applyTemplate()` → `applyTemplate(templateId)`로 일반화
- 적용된 템플릿 id를 `AppSettings.appliedTemplateId`에 저장 → "추천안"(RecommendedRouteCard)이 적용 템플릿 기준으로 표시
- 기존 `data.ts`의 `tripDays`는 classic 템플릿의 원본으로 재사용

### 템플릿 4종 콘셉트

| id | 이름 | 콘셉트 |
|----|------|--------|
| classic | 클래식 필수 코스 | 기존 템플릿. Must 명소 균형 배치 |
| foodie | 미식 로드 | 시장·트라토리아·젤라또 중심. 명소는 동선상 핵심만. 점심·저녁 예약 슬롯 명시 |
| relaxed | 여유 만끽 | 하루 4곳 이하, 공원·전망·카페 비중↑, 한낮 휴식 전제 |
| photo | 인생샷 헌터 | 골든아워 동선(아침 트레비/해질녘 전망대), 사진점수 3 위주 |

### 신규 장소 수집 목록 (2026-06 리서치 + 기존 지식)

**로마 (15곳)**
| id | 이름 | 분류 | 핵심 |
|----|------|------|------|
| seu-pizza-illuminati | Seu Pizza Illuminati | food | 50 Top Pizza 세계 상위, 창작 피자 |
| ai-marmi | Ai Marmi | food | 트라스테베레 바삭 로마식 피자, 늦은 밤 |
| pizzeria-da-remo | Da Remo | food | 테스타치오 로마식 피자 끝판, 현금 |
| da-cesare-al-casaletto | Da Cesare al Casaletto | food | 트램 8 종점 현지인 명가, 프리티 |
| antica-birreria-peroni | Antica Birreria Peroni | food | 1906 비어홀, 가성비 |
| pane-e-salame | Pane e Salame | food | 트레비 옆 파니니 줄집 |
| la-prosciutteria-trevi | La Prosciutteria | food | 살루미 보드, 한국인 인기 |
| aroma-rooftop | Aroma | food/view | 콜로세움 뷰 미슐랭 루프탑, 기념일 |
| terrazza-borromini | Terrazza Borromini | view | 나보나 위 아페리티보 루프탑 |
| ginger-spagna | Ginger | cafe | 스파냐 브런치·주스 |
| coromandel | Coromandel | cafe | 나보나 뒤 아침/브런치 명소 |
| barnum-cafe | Barnum Cafe | cafe | 캄포 근처 스페셜티+작업 카페 |
| gelato-san-crispino | Il Gelato di San Crispino | cafe | 트레비 옆 정통 젤라또(뚜껑 보관) |
| castroni | Castroni | shopping | 프라티 식료품 백화점, 선물 |
| quartiere-coppede | 코페데 지구 | attraction | 동화풍 건축 골목, 한산 |
| san-luigi-dei-francesi | 산 루이지 데이 프란체시 | attraction | 카라바조 3점 무료 |
| santa-maria-della-vittoria | 산타 마리아 델라 비토리아 | attraction | 베르니니 '성녀 테레사의 환희' 무료 |
| appia-antica | 아피아 안티카 | attraction | 옛 가도 자전거/산책 반나절 |

**피렌체 (18곳)**
| id | 이름 | 분류 | 핵심 |
|----|------|------|------|
| trattoria-sabatino | Trattoria Sabatino | food | 산 프레디아노 초저가 가정식, 현금 |
| il-latini | Il Latini | food | 천장 프로슈토, 푸짐한 전통 코스 |
| regina-bistecca | Regina Bistecca | food | 두오모 옆 티본 격식파, 예약 |
| all-antico-ristoro-di-cambi | Di' Cambi | food | 산 프레디아노 티본 로컬 명가 |
| osteria-dell-enoteca | Osteria dell'Enoteca | food | 로마나 거리 모던 스테이크 |
| simbiosi-pizza | SimBIOsi | food | 유기농 피자, 산 로렌초 |
| berbere-firenze | Berberè | food | 사워도우 피자, 산 프레디아노 |
| cibreo-caffe | Cibrèo Caffè | cafe | 산탐브로조 전설 식당가 카페 |
| le-vespe-cafe | Le Vespe | cafe | 브런치/팬케이크, 산타 크로체 |
| melaleuca-bakery | Melaleuca | cafe | 강변 베이커리 브런치 인기 |
| amble-firenze | Amblé | cafe | 폰테베키오 뒤 빈티지 안뜰 아페리티보 |
| santarosa-bistrot | Santarosa Bistrot | cafe | 성벽 정원 비스트로 |
| pitti-gola-e-cantina | Pitti Gola e Cantina | food | 피티 앞 와인바 |
| le-volpi-e-luva | Le Volpi e l'Uva | food | 폰테베키오 남단 와인바, 치즈 |
| signorvino-firenze | Signorvino | food | 폰테베키오 뷰 와인+식사 |
| gelateria-santa-trinita | Santa Trinita | cafe | 다리 옆 젤라또, 강변 일몰 조합 |
| my-sugar | My Sugar | cafe | 산 로렌초 수제 젤라또 소량생산 |
| san-marco-museum | 산 마르코 미술관 | attraction | 프라 안젤리코 수태고지, 한산 |
| orsanmichele | 오르산미켈레 | attraction | 길드 조각 교회, 경유 5분 |
| santo-spirito-basilica | 산토 스피리토 성당 | attraction | 미켈란젤로 십자가, 광장 |

- 가격(`price`), 메뉴(`menuHints`), 특징(enhancement highlights/reviewSignals/bestFor), 팁 전부 포함해서 작성
- 좌표는 도보 내비 수준 근사값(±100m) — 정밀 이동은 카드의 Maps 링크 사용 전제. HANDOFF에 명시

### 재사용 규칙 (이전 세션에서 확립)

- 사진: `scripts/fetch-images.mjs` — REST가 주는 URL 그대로(330px). 320/640/800px 버킷은 위키미디어가 400 차단
- Google 평점은 직접 확인한 것만 `google:` 필드에 — 아니면 내부 추천점수(rank)로 표시됨
- 데이터 정합성: dev 콘솔 경고(pairWith 깨진 참조, 좌표 범위) + `scripts/inventory.mjs`
- 커밋 후 origin/main push + HANDOFF.md 갱신이 세션 마무리 조건

## 사용량 절약 방침 (사용자 지시)

- 웹검색 추가 호출 중단 — 기확보 리서치 + 모델 지식으로 데이터 작성
- 프리뷰 스크린샷은 단계당 1-2회로 제한
- 파일 수정은 배치로, 재읽기 최소화

---

## 2026-06-10 후속 세션 — A3 배포 준비 + F4 저장소 통합

### A3 배포 (인프라 완성, 활성화는 사용자 결정 대기)
- GitHub Pages 활성화 시도 → **422: 무료 플랜 + 비공개 저장소는 Pages 불가**
- 사용자 결정 필요: ① 저장소 공개 전환 ② GitHub Pro ③ 다른 호스팅 계정 — HANDOFF.md에 정리
- 준비 완료:
  - `.github/workflows/deploy.yml` (workflow_dispatch 전용 — 실패 스팸 방지, 활성화 후 push 트리거 추가)
  - PWA 배포경로 안전화: sw.js가 자기 URL에서 BASE 유도, manifest 상대경로, SW 등록은 `import.meta.env.BASE_URL`
  - sw.js v2: 내비게이션 network-first(기존 cache-first는 새 배포가 영영 안 보이는 버그였음), 위키미디어 사진·jsdelivr 폰트 런타임 캐시(오프라인 사진 해결), 지도 타일은 캐시 제외(용량 폭주 방지)
  - `npm run build -- --base=/italy-trip-control-map/` 로컬 검증 — dist URL 리베이스 확인

### F4 저장소 통합 (완료) — F1의 첫 분리 조각
- `src/lib/storage.ts` 신설: 단일 키 `italy-trip-state-v3`, loadSlice/saveSlice, 모듈 캐시
- 레거시 키 8개 자동 마이그레이션 + 제거, v3 존재 시 잔재도 정리(self-healing — HMR 과도기에 레거시 키 재생성되는 것 실측 후 추가)
- App.tsx의 localStorage 직접 참조 0 — 전부 슬라이스 API 경유
- 프리뷰 검증: 레거시→v3 이전, 데이터 보존(foodie 일정·루트·설정), 최종 키 1개, 콘솔 에러 0

### 다음 세션 시작점
- 사용자가 공개 전환/플랜 결정 시: deploy.yml 트리거 복원 → Actions 1회 실행 → iPhone 홈 화면 + 오프라인 확인
- F1은 아래 후속 세션에서 완료

---

## 2026-06-10 후속 세션 — F1 구조 분리 완료

- `App.tsx` 약 3,200줄 → 약 1,700줄로 축소
- `src/appCore.ts`로 장소/템플릿/점수/거리/URL/사용자 장소 로직 분리
- `src/components/place.tsx`로 장소 공용 UI 분리
- `src/screens/MapScreen.tsx`, `src/screens/RankingScreen.tsx` 분리 및 lazy loading 적용
- Rolldown vendor 그룹 분리로 500kB 청크 경고 제거
- 최종 빌드: main 307.22kB, vendor 352.03kB, MapScreen 9.94kB, RankingScreen 7.13kB
- 검증: build 통과, placeId/pairWith 217 ids 정상, 브라우저 장소 상세·지도 렌더링, 콘솔 오류 0

---

## 2026-06-10 후속 세션 — 모바일 템플릿 진입점 + F1 마무리

- 사용자 피드백: 모바일에서 템플릿 선택 메뉴를 찾기 어려움
- 하단 네비 `일정` → `템플릿`, 오늘 화면 상단에 `템플릿 변경` 바로가기 추가
- Plan 제목을 `일정 · 템플릿`으로 변경해 기능 범위 명확화
- `TodayScreen`, `PlanScreen`, `MoreScreen`, 공용 `DayAddForm`까지 분리
- `App.tsx` 약 1,700줄 → 약 800줄, 메인 청크 307.22kB → 287.98kB
- 390px 모바일에서 두 진입점, 템플릿 4카드, More 6탭 확인. 콘솔 오류 0

---

## 2026-06-10 후속 세션 — 문서함 UX 완성

- 문서 유형 5종(항공·기차·숙소·입장권·기타)과 유형별 필터/개수 표시 추가
- 저장 문서 인라인 수정, 수정 취소, 유형 변경 지원
- URL에 스킴이 없으면 `https://`를 보완하고 HTTP(S) 이외 주소는 저장 차단
- 기존 백업·저장 문서는 `기타` 유형으로 자동 호환, 백업 버전 6으로 갱신
- 390px 모바일에서 잘못된 URL 차단, 링크 정규화, 필터, 유형 변경 흐름 확인

---

## 2026-06-10 후속 세션 — F6 데이터 빌드 검증

- `scripts/check-refs.mjs`를 TypeScript AST 기반 `scripts/check-data.mjs`로 교체
- 장소·출처·보강 데이터·템플릿 컬렉션을 분리해 정확히 집계
- 중복 ID, 좌표 범위, placeId/pairWith/sourceIds 참조, 필수 출처, 이미지 원출처, Google 확인일 검증
- 기존 217 ids 표기는 일정·출처 ID가 섞인 오집계였으며 실제 장소는 179개로 확인
- `npm run check:data`를 추가하고 `npm run build` 선행 단계로 연결
