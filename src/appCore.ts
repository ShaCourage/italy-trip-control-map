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

// 필터 칩 하나가 지도 핀 표시 + '지금 추천' 가중치를 동시에 결정한다(모드 드롭다운 통합).
// 그룹: 탐색(today/all/must) · 종류(attraction~photo) · 취향·상황(korean~night)
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
  | "korean"
  | "reservation"
  | "budget"
  | "low"
  | "rain"
  | "night";

export type AppSettings = {
  romeHotel?: { lat: number; lng: number; label?: string };
  florenceHotel?: { lat: number; lng: number; label?: string };
  startTab?: TabKey;
  defaultFilter?: FilterKey;
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
  korean: "한국인",
  reservation: "예약",
  budget: "가성비",
  low: "체력 아낌",
  rain: "비·실내",
  night: "밤 안전",
};

// 칩을 누르면 지도 핀 필터(어떤 핀을 보일지)와 추천 가중치(어떤 곳을 위로)를 함께 묶기 위한 그룹.
// 시각적으로 한 줄 안에서 구분선만 넣는다.
export const filterGroups: { label: string; keys: FilterKey[] }[] = [
  { label: "탐색", keys: ["all", "today", "must"] },
  { label: "종류", keys: ["attraction", "food", "cafe", "view", "shopping", "photo"] },
  { label: "취향·상황", keys: ["korean", "reservation", "budget", "low", "rain", "night"] },
];

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

const pronunciationOverrides: Record<string, string> = {
  "roma-termini": "로마 테르미니",
  "colosseum-forum": "콜로세오 · 포로 로마노 · 팔라티노",
  "spanish-steps": "스패니시 스텝스",
  "piazza-navona": "피아차 나보나",
  "vatican-museums": "바티칸 뮤지엄스 · 시스티나 채플",
  "st-peters-basilica": "세인트 피터스 바실리카",
  "castel-sant-angelo": "카스텔 산탄젤로",
  "villa-borghese": "빌라 보르게세 · 핀초 테라스",
  "campo-de-fiori": "캄포 데 피오리",
  "via-del-corso": "비아 델 코르소",
  "duomo-florence": "카테드랄레 디 산타 마리아 델 피오레",
  uffizi: "우피치 갤러리스",
  accademia: "갤레리아 델라카데미아",
  "ponte-vecchio": "폰테 베키오",
  "piazza-signoria": "피아차 델라 시뇨리아 · 팔라초 베키오",
  "piazzale-michelangelo": "피아찰레 미켈란젤로",
  "pitti-boboli": "피티 팰리스 · 보볼리 가든스",
  "santa-croce": "바실리카 디 산타 크로체",
  "mercato-centrale": "메르카토 첸트랄레",
  "officina-profumo": "오피치나 프로푸모 파르마체우티카 디 산타 마리아 노벨라",
  "borghese-gallery": "갤러리아 보르게세",
  "piazza-del-popolo": "피아차 델 포폴로",
  "capitoline-museums": "카피톨리니 뮤지엄스",
  "altare-patria": "알타레 델라 파트리아",
  "santa-maria-maggiore": "바실리카 디 산타 마리아 마조레",
  "basilica-san-clemente": "바실리카 디 산 클레멘테",
  "baths-caracalla": "테르메 디 카라칼라",
  "orange-garden": "자르디노 델리 아란치",
  "janiculum-terrace": "자니콜로 테라스",
  "tiber-island": "티베르 아일랜드",
  "jewish-ghetto": "주이시 게토",
  "largo-argentina": "라르고 디 토레 아르젠티나",
  "testaccio-market": "메르카토 테스타치오",
  "mercato-trionfale": "메르카토 트리온팔레",
  "santa-maria-trastevere": "바실리카 디 산타 마리아 인 트라스테베레",
  "galleria-doria-pamphilj": "갤러리아 도리아 팜필리",
  "palazzo-barberini": "팔라초 바르베리니",
  "via-condotti": "비아 데이 콘도티",
  "rinascente-rome-rooftop": "리나센테 로마 트리토네 루프탑",
  "bargello": "바르젤로 내셔널 뮤지엄",
  "medici-chapels": "메디치 채플스",
  "santa-maria-novella-basilica": "바실리카 오브 산타 마리아 노벨라",
  "basilica-san-lorenzo": "바실리카 디 산 로렌초",
  "palazzo-strozzi": "팔라초 스트로치",
  "palazzo-medici-riccardi": "팔라초 메디치 리카르디",
  "brancacci-chapel": "브란카치 채플",
  "san-miniato-al-monte": "산 미니아토 알 몬테",
  "rose-garden": "자르디노 델레 로제",
  "bardini-garden": "자르디노 바르디니",
  "museo-galileo": "무세오 갈릴레오",
  "mercato-sant-ambrogio": "메르카토 디 산탐브로조",
  "via-tornabuoni": "비아 데 토르나부오니",
  "rinascente-florence-rooftop": "리나센테 피렌체 루프탑",
  "scuola-del-cuoio": "스쿠올라 델 쿠오이오",
  "bocca-della-verita": "보카 델라 베리타",
  "sant-ignazio": "키에사 디 산티냐치오 디 로욜라",
  "galleria-sciarra": "갈레리아 시아라",
  "via-margutta": "비아 마르구타",
  "aventine-keyhole": "아벤티노 키홀",
  "pincio-terrace": "테라차 델 핀초",
  "san-lorenzo-market": "산 로렌초 레더 마켓",
  "palazzo-vecchio": "팔라초 베키오",
};

export function getPlacePronunciation(place: Place) {
  return getEnhancement(place).pronunciation ?? pronunciationOverrides[place.id] ?? place.koName;
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

// B4: 추정 영업시간 대신, 출처로 이미 검증된 "공식 기관 페이지"를 고정 노출.
// restaurant-official(일반 구글맵)은 공식 채널이 아니므로 제외.
const officialSourceById = new Map(
  sources.filter((source) => source.id.endsWith("-official") || source.id === "vatican-museums").map((source) => [source.id, source])
);

export function getOfficialSource(place: Place): { label: string; url: string } | undefined {
  for (const id of place.sourceIds) {
    const source = officialSourceById.get(id);
    if (source) return { label: source.label, url: source.url };
  }
  return undefined;
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
