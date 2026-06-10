// 앱 코어 — 장소 데이터 병합·검증, 점수/배지 파생, 템플릿 추천루트, 공용 라벨·URL 헬퍼.
// React에 의존하지 않는 모듈 레벨 로직만 둔다. 화면(App/screens)은 여기서 import만 한다.
import {
  categoryLabels,
  cityLabels,
  Place,
  PlaceCategory,
  places as basePlaces,
  sources as baseSources,
  TripDay,
} from "./data";
import { extraPlaces, extraSources } from "./extraData";
import { morePlaces } from "./morePlaces";
import { tripTemplates } from "./templates";
import { placeEnhancements, PlaceEnhancement } from "./placeEnhancements";
import type { RouteItem } from "./lib/routes";
import { loadSlice } from "./lib/storage";

export type { RouteItem } from "./lib/routes";

export type TabKey = "map" | "today" | "plan" | "ranking" | "more";

export type FilterKey =
  | "today"
  | "all"
  | "must"
  | "attraction"
  | "food"
  | "cafe"
  | "view"
  | "shopping"
  | "photo"
  | "safety"
  | "reservation"
  | "korean";

export type ModeKey =
  | "default"
  | "low"
  | "photo"
  | "rain"
  | "night"
  | "shopping"
  | "food"
  | "korean"
  | "reservation"
  | "budget";

export type AppSettings = {
  romeHotel?: { lat: number; lng: number; label?: string };
  florenceHotel?: { lat: number; lng: number; label?: string };
  startTab?: TabKey;
  defaultMode?: ModeKey;
  appliedTemplateId?: string;
};

export type GooglePlaceMeta = NonNullable<PlaceEnhancement["google"]>;
export type GooglePriceLevel = NonNullable<GooglePlaceMeta["priceLevel"]>;
export type GoogleCrowdLevel = NonNullable<GooglePlaceMeta["crowdLevel"]>;
export type GoogleConfidence = NonNullable<GooglePlaceMeta["visitConfidence"]>;

export type PlaceScore = {
  rating?: number;
  ratingText: string;
  reviewCountLabel?: string;
  lastChecked?: string;
  priceLevel: GooglePriceLevel;
  crowdLevel: GoogleCrowdLevel;
  visitConfidence: GoogleConfidence;
  isVerified: boolean;
};

export const modeLabels: Record<ModeKey, string> = {
  default: "기본",
  low: "체력 아낌",
  photo: "사진",
  rain: "비",
  night: "밤 안전",
  shopping: "쇼핑",
  food: "맛집",
  korean: "K-취향",
  reservation: "예약 우선",
  budget: "가성비",
};

export const filterLabels: Record<FilterKey, string> = {
  today: "오늘 루트",
  all: "전체",
  must: "Must",
  attraction: "명소",
  food: "맛집",
  cafe: "카페",
  view: "전망",
  shopping: "쇼핑",
  photo: "사진",
  safety: "주의",
  reservation: "예약",
  korean: "한국인",
};

export const categoryColors: Record<PlaceCategory, string> = {
  stay: "#2b241c",
  station: "#7a7164",
  attraction: "#c2502e",
  food: "#2f7d6d",
  cafe: "#b07d2a",
  shopping: "#8a5bb5",
  view: "#3a6ea8",
  rest: "#76814e",
};

// id 중복 시 나중 항목이 이긴다 — 중복은 React key 충돌로 화면이 꼬이므로 개발 중 경고
export const places = (() => {
  const merged = new Map<string, Place>();
  for (const place of [...basePlaces, ...extraPlaces, ...morePlaces]) {
    if (merged.has(place.id) && import.meta.env.DEV) {
      console.warn(`[data] 중복 장소 id: ${place.id} — 나중 항목으로 대체됨`);
    }
    merged.set(place.id, place);
  }
  return [...merged.values()];
})();
export const sources = [...baseSources, ...extraSources];

// 로마·피렌체 6/19-28 기본 플랜은 "템플릿"이다.
// 앱은 빈 일정으로 시작하고, 사용자가 콘셉트 템플릿(4종)을 적용하거나 날짜를 직접 만든다.
const buildTemplateRoutes = (days: TripDay[]) =>
  Object.fromEntries(
    days.map((day) => [
      day.id,
      day.route.map((stop, index) => ({
        uid: `${day.id}-recommended-${index}-${stop.placeId}`,
        placeId: stop.placeId,
        locked: stop.locked,
        time: stop.time,
        note: stop.note,
      })),
    ])
  ) as Record<string, RouteItem[]>;

export const templateRoutesById: Record<string, Record<string, RouteItem[]>> = Object.fromEntries(
  tripTemplates.map((template) => [template.id, buildTemplateRoutes(template.days)])
);

// "추천 코스"는 마지막으로 적용한 템플릿을 따른다. 모듈 변수로 추적해도 안전한 이유:
// 템플릿 적용 시 days/routes 상태가 같이 바뀌어 재렌더가 항상 따라오기 때문.
let appliedTemplateId: string | undefined;

export function setAppliedTemplateId(id: string) {
  appliedTemplateId = id;
}

export function activeTemplateRoutes(): Record<string, RouteItem[]> {
  const id = appliedTemplateId ?? initialSettings.appliedTemplateId ?? "classic";
  return templateRoutesById[id] ?? templateRoutesById.classic;
}

export const placesById = new Map(places.map((place) => [place.id, place]));

// 데이터 무결성 검증 — 깨진 참조/누락이 화면 버그로 번지기 전에 개발 콘솔에서 잡는다
if (import.meta.env.DEV) {
  for (const place of places) {
    if (place.lat < 35 || place.lat > 47 || place.lng < 6 || place.lng > 19) {
      console.warn(`[data] ${place.id} 좌표가 이탈리아 범위를 벗어남: ${place.lat}, ${place.lng}`);
    }
    for (const pairId of place.pairWith) {
      if (!placesById.has(pairId)) console.warn(`[data] ${place.id} pairWith 깨진 참조: ${pairId}`);
    }
    if (!place.sourceIds.length && place.category !== "stay" && !place.id.startsWith("custom-")) {
      console.warn(`[data] ${place.id} 출처(sourceIds) 없음`);
    }
  }
}

export function getEnhancement(place: Place) {
  return placeEnhancements[place.id] ?? {};
}

const priceLevelByPlacePrice: Record<Place["price"], GooglePriceLevel> = {
  무료: "무료",
  낮음: "€",
  중간: "€€",
  높음: "€€€",
  확인: "€€",
};

function inferCrowdLevel(place: Place): GoogleCrowdLevel {
  if (place.category === "stay") return "보통";
  if (place.priority === 1 && (place.category === "attraction" || place.category === "view")) return "매우 높음";
  if (place.reservation === "필수" || place.safety !== "보통") return "높음";
  if ((place.category === "food" || place.category === "cafe") && place.priority <= 2) return "높음";
  return "보통";
}

function inferConfidence(place: Place): GoogleConfidence {
  if (place.priority === 1) return "검증 강함";
  if (place.priority === 2 || place.rank >= 84 || place.tags.includes("한국인선호")) return "검증 보통";
  return "취향 탐";
}

// 평점은 수동으로 확인해 넣은 값만 "Google"로 표기한다.
// 확인 안 된 곳은 내부 추천 점수(rank)만 보여주고, Google 수치를 지어내지 않는다.
export function getPlaceScore(place: Place, enhancement: PlaceEnhancement = getEnhancement(place)): PlaceScore {
  const google = enhancement.google;
  return {
    rating: google?.rating,
    ratingText: google ? `Google ${google.rating.toFixed(1)}` : `추천 ${place.rank}`,
    reviewCountLabel: google?.reviewCountLabel,
    lastChecked: google?.lastChecked,
    priceLevel: google?.priceLevel ?? priceLevelByPlacePrice[place.price],
    crowdLevel: google?.crowdLevel ?? inferCrowdLevel(place),
    visitConfidence: google?.visitConfidence ?? inferConfidence(place),
    isVerified: Boolean(google),
  };
}

// 장소 성격을 한눈에 — 전부 내부 데이터에서 기계적으로 파생 (추측 라벨 아님)
export function traitBadges(place: Place): string[] {
  const badges: string[] = [];
  if (place.priority === 1) badges.push("⭐ Must");
  if (place.reservation === "필수") badges.push("🎫 예약 필수");
  else if (place.reservation === "권장") badges.push("🎫 예약 권장");
  if (place.photo === 3) badges.push("📸 인생샷");
  if (place.bestTime.includes("해질녘") || place.tags.includes("야경")) badges.push("🌅 해질녘");
  if (place.tags.includes("실내")) badges.push("🏛️ 실내");
  if (place.price === "무료") badges.push("🆓 무료");
  else if (place.price === "낮음") badges.push("💶 가성비");
  if (place.tags.includes("한국인선호")) badges.push("🇰🇷 한국인픽");
  if (place.durationMin <= 30 && place.category !== "stay" && place.category !== "station") badges.push("⏱️ 30분컷");
  if (place.tags.includes("웨이팅")) badges.push("⏳ 웨이팅");
  if (place.safety === "밤주의") badges.push("🌙 밤 주의");
  else if (place.safety === "주의") badges.push("⚠️ 소지품");
  return badges;
}

function loadSettings(): AppSettings {
  return loadSlice<AppSettings>("settings", {});
}

// 숙소 placeholder 좌표를 설정값으로 덮어쓴다 — 모든 루트/거리 계산의 기준점
export function applyHotelSettings(settings: AppSettings) {
  const targets = [
    { id: "rome-hotel", value: settings.romeHotel },
    { id: "florence-hotel", value: settings.florenceHotel },
  ] as const;
  for (const { id, value } of targets) {
    const place = placesById.get(id);
    if (!place || !value) continue;
    place.lat = value.lat;
    place.lng = value.lng;
    if (value.label) {
      place.koName = value.label;
      place.name = value.label;
    }
  }
}

export const initialSettings = loadSettings();
applyHotelSettings(initialSettings);

export function getShortLabel(place: Place) {
  return getEnhancement(place).shortLabel ?? place.koName.replace(/\s+/g, "").slice(0, 7);
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

export function getPlace(id: string) {
  const place = placesById.get(id);
  if (!place) throw new Error(`Unknown place: ${id}`);
  return place;
}

export function haversineKm(a: Place, b: Place) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const value =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function makeGooglePlaceUrl(place: Place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${cityLabels[place.city]}`)}`;
}

export function makeDirectionsUrl(route: RouteItem[]) {
  const routePlaces = route.map((item) => getPlace(item.placeId));
  if (routePlaces.length === 0) return "https://www.google.com/maps";
  if (routePlaces.length === 1) return makeGooglePlaceUrl(routePlaces[0]);
  const origin = routePlaces[0];
  const destination = routePlaces[routePlaces.length - 1];
  const waypoints = routePlaces
    .slice(1, -1)
    .slice(0, 8)
    .map((place) => `${place.lat},${place.lng}`)
    .join("|");

  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: "walking",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function routeStats(route: RouteItem[]) {
  const routePlaces = route.map((item) => getPlace(item.placeId));
  const km = routePlaces.slice(1).reduce((sum, place, index) => sum + haversineKm(routePlaces[index], place), 0);
  const walkMin = Math.round((km / 4.5) * 60);
  const caution = routePlaces.filter((place) => place.safety !== "보통").length;
  const must = routePlaces.filter((place) => place.priority === 1).length;
  return { km, walkMin, caution, must };
}

export type RouteStats = ReturnType<typeof routeStats>;

// 사용자 장소를 전역 풀에 등록 — places/placesById는 화면 전체가 읽는 단일 소스
export function registerPlace(place: Place) {
  if (placesById.has(place.id)) return;
  places.push(place);
  placesById.set(place.id, place);
}

export function unregisterPlace(placeId: string) {
  const index = places.findIndex((place) => place.id === placeId);
  if (index >= 0) places.splice(index, 1);
  placesById.delete(placeId);
}

export { categoryLabels, cityLabels };
export type { Place, PlaceCategory, TripDay };
