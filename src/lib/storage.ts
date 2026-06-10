// localStorage 통합 저장소 — 분산돼 있던 키 8개를 단일 키(italy-trip-state-v3)로 합친다.
// 화면 코드는 슬라이스 단위 API(loadSlice/saveSlice)만 쓰고, 직렬화·레거시 마이그레이션은 여기서 끝낸다.
const STATE_KEY = "italy-trip-state-v3";
const STATE_VERSION = 3;

export type SliceKey =
  | "settings"
  | "days"
  | "routes"
  | "customPlaces"
  | "done"
  | "checks"
  | "notes"
  | "docs";

// v3 이전에 쓰던 개별 키 — 첫 실행 시 한 번 읽어와 합치고 제거한다
const LEGACY_KEYS: Record<SliceKey, string> = {
  settings: "italy-trip-settings-v1",
  days: "italy-trip-days-v1",
  routes: "italy-trip-custom-routes-v2",
  customPlaces: "italy-trip-custom-places-v1",
  done: "italy-trip-done-v1",
  checks: "italy-trip-checks-v1",
  notes: "italy-trip-notes-v1",
  docs: "italy-trip-docs-v1",
};

type StoredState = { version: number } & Partial<Record<SliceKey, unknown>>;

let cache: StoredState | undefined;

function hasWindow() {
  return typeof window !== "undefined";
}

function writeState(state: StoredState) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // 저장공간 초과 등 — 다음 쓰기에서 다시 시도된다
  }
}

function migrateLegacy(): StoredState {
  const state: StoredState = { version: STATE_VERSION };
  if (!hasWindow()) return state;
  let found = false;
  for (const slice of Object.keys(LEGACY_KEYS) as SliceKey[]) {
    try {
      const raw = window.localStorage.getItem(LEGACY_KEYS[slice]);
      if (raw === null) continue;
      state[slice] = JSON.parse(raw);
      found = true;
    } catch {
      // 깨진 슬라이스는 버리고 나머지를 살린다
    }
  }
  if (found) {
    writeState(state);
    for (const legacyKey of Object.values(LEGACY_KEYS)) window.localStorage.removeItem(legacyKey);
  }
  return state;
}

function readState(): StoredState {
  if (cache) return cache;
  if (hasWindow()) {
    try {
      const raw = window.localStorage.getItem(STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState;
        if (parsed && typeof parsed === "object") {
          cache = { ...parsed, version: STATE_VERSION };
          // 통합 키가 자리 잡았으면 레거시 잔재 정리 — 구버전 코드가 다시 만들었어도 v3가 기준
          for (const legacyKey of Object.values(LEGACY_KEYS)) window.localStorage.removeItem(legacyKey);
          return cache;
        }
      }
    } catch {
      // 깨진 통합 상태 → 레거시/빈 상태에서 다시 시작
    }
  }
  cache = migrateLegacy();
  return cache;
}

/** 슬라이스가 저장된 적 없으면(undefined/null) fallback. 값 검증은 호출부 책임. */
export function loadSlice<T>(slice: SliceKey, fallback: T): T {
  const value = readState()[slice];
  return value === undefined || value === null ? fallback : (value as T);
}

export function saveSlice(slice: SliceKey, value: unknown) {
  const state = readState();
  state[slice] = value;
  writeState(state);
}
