# 작업 인계 메모

마지막 갱신: 2026-06-10

## 현재 상태

- 브랜치: `main`
- 원격: `origin` (`https://github.com/ShaCourage/italy-trip-control-map.git`)
- 기준 커밋: `257fbe9` 이후 변경분
- 검증: `npm run build` 통과

## 이번 미커밋 변경 내용

- `src/App.tsx`
  - 더보기에 `문서함` 섹션 추가
  - 예약/티켓 링크, 예약번호 메모 저장/삭제
  - 장소 상세 카드에 `내 메모` textarea 추가
  - 메모와 문서함을 localStorage 및 JSON 백업/복원에 포함
  - 오늘 화면에 일몰 계산값 표시
  - 이전 날짜에서 완료하지 못한 장소를 `못 간 곳 회수` 후보로 표시
  - 루트 추가/추천 추가 시 숙소 복귀 앞에 끼워넣는 규칙을 `insertBeforeHotelReturn`으로 공통화
  - 개발 모드 데이터 검증 경고 추가: 좌표 범위, `pairWith` 깨진 참조, 출처 누락
  - 장소 검색 범위 확대: 메뉴 힌트와 하이라이트도 검색 대상
- `src/styles.css`
  - 장소 메모, 문서함 카드, 못 간 곳 리스트 스타일 추가

## 이미 완료된 큰 작업

- 앱 기본값을 빈 일정으로 변경
- 기존 로마/피렌체 10일 플랜은 템플릿으로 전환
- 날짜, 장소, 코스 커스텀 가능
- 숙소 좌표 설정과 백업/복원 추가
- 장소 탭 개명 및 더보기 메뉴 정리
- 로마/피렌체 명소와 맛집 추가
- 장소 특징 배지 추가

## 이어서 할 일

- A3 배포
  - iPhone 실사용을 위해 Vercel/Netlify/GitHub Pages 중 하나로 HTTPS 배포
  - PWA 홈 화면 추가와 오프라인 동작 확인
- F4 저장소 통합
  - 현재는 `routes`, `done`, `checks`, `settings`, `days`, `customPlaces`, `notes`, `docs`가 여러 localStorage 키로 분산
  - 목표: `italy-trip-state-v3` 단일 키 + 기존 키 마이그레이션
- F1 구조 분리
  - `src/App.tsx`가 여전히 큼
  - 우선 `screens/MoreScreen.tsx`, `screens/TodayScreen.tsx`, `lib/routes.ts`, `lib/storage.ts`부터 분리 추천
- F6 데이터 검증 강화
  - 현재는 개발 콘솔 경고 수준
  - 빌드 단계에서 실패시키는 검증 스크립트로 승격 가능
- 문서함 UX 추가 개선
  - 문서 수정 기능
  - 문서 타입(항공권/기차/미술관/숙소) 필터
  - URL 형식 검증

## 다음 PC에서 바로 확인할 명령

```bash
npm install
npm run build
npm run dev
```

