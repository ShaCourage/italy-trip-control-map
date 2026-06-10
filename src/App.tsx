import { useEffect, useMemo, useState } from "react";
import type { Dispatch, ElementType, ReactNode, SetStateAction } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Languages,
  ListChecks,
  Lock,
  Map as MapIcon,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Route,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Star,
  Train,
  Trophy,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import {
  categoryLabels,
  City,
  cityLabels,
  packingChecklist,
  phraseGroups,
  Place,
  PlaceCategory,
  places as basePlaces,
  safetyNotes,
  sources as baseSources,
  TripDay,
  tripDays as templateDays,
} from "./data";
import { extraPlaces, extraSources, foodOrderGuides, koreanTravelGuides } from "./extraData";
import { morePlaces } from "./morePlaces";
import { tripTemplates } from "./templates";
import { categoryShortLabels, placeEnhancements, PlaceEnhancement } from "./placeEnhancements";
import { loadSlice, saveSlice } from "./lib/storage";

type TabKey = "map" | "today" | "plan" | "ranking" | "more";

type AppSettings = {
  romeHotel?: { lat: number; lng: number; label?: string };
  florenceHotel?: { lat: number; lng: number; label?: string };
  startTab?: TabKey;
  defaultMode?: ModeKey;
  appliedTemplateId?: string;
};

// 문서함 — 예약 링크/번호 모음. 민감정보 원본(여권 등)은 넣지 않는 전제
type TripDoc = {
  id: string;
  title: string;
  url?: string;
  memo?: string;
};
type FilterKey =
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
type ModeKey = "default" | "low" | "photo" | "rain" | "night" | "shopping" | "food" | "korean" | "reservation" | "budget";
type MoreKey = "safety" | "foodGuide" | "phrases" | "checklist" | "docs" | "data";

type RouteItem = {
  uid: string;
  placeId: string;
  locked?: boolean;
  time?: string;
  note?: string;
};

type GooglePlaceMeta = NonNullable<PlaceEnhancement["google"]>;
type GooglePriceLevel = NonNullable<GooglePlaceMeta["priceLevel"]>;
type GoogleCrowdLevel = NonNullable<GooglePlaceMeta["crowdLevel"]>;
type GoogleConfidence = NonNullable<GooglePlaceMeta["visitConfidence"]>;

type PlaceScore = {
  rating?: number;
  ratingText: string;
  reviewCountLabel?: string;
  lastChecked?: string;
  priceLevel: GooglePriceLevel;
  crowdLevel: GoogleCrowdLevel;
  visitConfidence: GoogleConfidence;
  isVerified: boolean;
};

const modeLabels: Record<ModeKey, string> = {
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

const filterLabels: Record<FilterKey, string> = {
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

const categoryColors: Record<PlaceCategory, string> = {
  stay: "#2b241c",
  station: "#7a7164",
  attraction: "#c2502e",
  food: "#2f7d6d",
  cafe: "#b07d2a",
  shopping: "#8a5bb5",
  view: "#3a6ea8",
  rest: "#76814e",
};

const tabItems = [
  { key: "today" as const, label: "오늘", icon: Sparkles },
  { key: "map" as const, label: "지도", icon: MapIcon },
  { key: "ranking" as const, label: "장소", icon: Trophy },
  { key: "plan" as const, label: "일정", icon: CalendarDays },
  { key: "more" as const, label: "더보기", icon: FileText },
];

// id 중복 시 나중 항목이 이긴다 — 중복은 React key 충돌로 화면이 꼬이므로 개발 중 경고
const places = (() => {
  const merged = new Map<string, Place>();
  for (const place of [...basePlaces, ...extraPlaces, ...morePlaces]) {
    if (merged.has(place.id) && import.meta.env.DEV) {
      console.warn(`[data] 중복 장소 id: ${place.id} — 나중 항목으로 대체됨`);
    }
    merged.set(place.id, place);
  }
  return [...merged.values()];
})();
const sources = [...baseSources, ...extraSources];

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

const templateRoutesById: Record<string, Record<string, RouteItem[]>> = Object.fromEntries(
  tripTemplates.map((template) => [template.id, buildTemplateRoutes(template.days)])
);

// "추천 코스"는 마지막으로 적용한 템플릿을 따른다. 모듈 변수로 추적해도 안전한 이유:
// 템플릿 적용 시 days/routes 상태가 같이 바뀌어 재렌더가 항상 따라오기 때문.
let appliedTemplateId: string | undefined;
function activeTemplateRoutes(): Record<string, RouteItem[]> {
  const id = appliedTemplateId ?? initialSettings.appliedTemplateId ?? "classic";
  return templateRoutesById[id] ?? templateRoutesById.classic;
}

const placesById = new Map(places.map((place) => [place.id, place]));

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

function getEnhancement(place: Place) {
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
function getPlaceScore(place: Place, enhancement: PlaceEnhancement = getEnhancement(place)): PlaceScore {
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
function traitBadges(place: Place): string[] {
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
function applyHotelSettings(settings: AppSettings) {
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

const initialSettings = loadSettings();
applyHotelSettings(initialSettings);

function getShortLabel(place: Place) {
  return getEnhancement(place).shortLabel ?? place.koName.replace(/\s+/g, "").slice(0, 7);
}

function escapeHtml(value: string) {
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

function getPlace(id: string) {
  const place = placesById.get(id);
  if (!place) throw new Error(`Unknown place: ${id}`);
  return place;
}

function haversineKm(a: Place, b: Place) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const value =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function makeGooglePlaceUrl(place: Place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${cityLabels[place.city]}`)}`;
}

function makeDirectionsUrl(route: RouteItem[]) {
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

function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function routeStats(route: RouteItem[]) {
  const routePlaces = route.map((item) => getPlace(item.placeId));
  const km = routePlaces.slice(1).reduce((sum, place, index) => sum + haversineKm(routePlaces[index], place), 0);
  const walkMin = Math.round((km / 4.5) * 60);
  const caution = routePlaces.filter((place) => place.safety !== "보통").length;
  const must = routePlaces.filter((place) => place.priority === 1).length;
  return { km, walkMin, caution, must };
}

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const rows = [
    [
      "Name",
      "Description",
      "Latitude",
      "Longitude",
      "Category",
      "Priority",
      "City",
      "Google Rating (verified)",
      "Review Count (verified)",
      "Price Level",
      "Crowd Estimate",
      "Confidence",
      "Highlights",
      "Google Maps",
    ],
    ...places
      .filter((place) => place.priority <= 2)
      .map((place) => {
        const enhancement = getEnhancement(place);
        const google = getPlaceScore(place, enhancement);
        return [
          place.koName,
          `${categoryLabels[place.category]} | ${place.area} | ${place.why}`,
          place.lat,
          place.lng,
          categoryLabels[place.category],
          place.priority === 1 ? "Must" : "Good",
          cityLabels[place.city],
          google.rating?.toFixed(1) ?? "",
          google.reviewCountLabel ?? "",
          google.priceLevel,
          google.crowdLevel,
          google.visitConfidence,
          enhancement.highlights?.join(" | ") ?? "",
          makeGooglePlaceUrl(place),
        ];
      }),
  ];

  downloadFile("italy-trip-map.csv", rows.map((row) => row.map(escapeCsv).join(",")).join("\n"), "text/csv;charset=utf-8");
}

function exportKml() {
  const placemarks = places
    .filter((place) => place.priority <= 2)
    .map((place) => {
      const google = getPlaceScore(place);
      return `<Placemark>
  <name>${place.koName}</name>
  <description>${categoryLabels[place.category]} | ${place.area} | ${google.ratingText}${google.reviewCountLabel ? ` | ${google.reviewCountLabel}` : ""} | ${place.why}</description>
  <Point><coordinates>${place.lng},${place.lat},0</coordinates></Point>
</Placemark>`;
    })
    .join("\n");

  downloadFile(
    "italy-trip-map.kml",
    `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<name>Italy Trip Control Map</name>
${placemarks}
</Document>
</kml>`,
    "application/vnd.google-earth.kml+xml;charset=utf-8"
  );
}

function cloneRoute(dayId: string, route: RouteItem[], prefix = "route") {
  return route.map((item, index) => ({
    ...item,
    uid: `${dayId}-${prefix}-${Date.now()}-${index}-${item.placeId}`,
  }));
}

// 루트 끝이 "숙소 복귀(잠금)"면 그 앞에 끼워넣는다 — 모든 추가 경로의 단일 규칙
function insertBeforeHotelReturn(items: RouteItem[], newItems: RouteItem[]): RouteItem[] {
  const next = [...items];
  const last = next[next.length - 1];
  const insertAt = last && last.locked && getPlace(last.placeId).category === "stay" ? next.length - 1 : next.length;
  next.splice(insertAt, 0, ...newItems);
  return next;
}

// 이탈리아 6월(CEST, UTC+2) 기준 일몰 시각 — 천문 알고리즘 계산값, 오차 ±수 분
function sunsetTime(lat: number, lng: number, dateStr: string): string | undefined {
  const date = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000);
  const lngHour = lng / 15;
  const t = dayOfYear + (18 - lngHour) / 24;
  const meanAnomaly = 0.9856 * t - 3.289;
  let trueLng =
    meanAnomaly + 1.916 * Math.sin(meanAnomaly * rad) + 0.02 * Math.sin(2 * meanAnomaly * rad) + 282.634;
  trueLng = ((trueLng % 360) + 360) % 360;
  let rightAscension = Math.atan(0.91764 * Math.tan(trueLng * rad)) / rad;
  rightAscension = ((rightAscension % 360) + 360) % 360;
  rightAscension += Math.floor(trueLng / 90) * 90 - Math.floor(rightAscension / 90) * 90;
  rightAscension /= 15;
  const sinDec = 0.39782 * Math.sin(trueLng * rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosHourAngle = (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
  if (cosHourAngle < -1 || cosHourAngle > 1) return undefined;
  const hourAngle = Math.acos(cosHourAngle) / rad / 15;
  const localMean = hourAngle + rightAscension - 0.06571 * t - 6.622;
  const utc = (((localMean - lngHour) % 24) + 24) % 24;
  const local = (utc + 2) % 24;
  let hours = Math.floor(local);
  let minutes = Math.round((local - hours) * 60);
  if (minutes === 60) {
    minutes = 0;
    hours = (hours + 1) % 24;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const cityCenters: Record<City, { lat: number; lng: number }> = {
  rome: { lat: 41.9028, lng: 12.4964 },
  florence: { lat: 43.7696, lng: 11.2558 },
};

function sanitizeRoutes(parsed: unknown): Record<string, RouteItem[]> {
  if (!parsed || typeof parsed !== "object") return {};
  return Object.fromEntries(
    Object.entries(parsed as Record<string, RouteItem[]>).map(([dayId, items]) => [
      dayId,
      Array.isArray(items)
        ? items.filter((item) => item && placesById.has(item.placeId)).map((item) => ({ ...item }))
        : [],
    ])
  );
}

function loadStoredRoutes(): Record<string, RouteItem[]> {
  return sanitizeRoutes(loadSlice("routes", {}));
}

// 기본은 빈 일정. 단, 이전 버전에서 루트를 만들어둔 흔적이 있으면 템플릿 일정으로 복원해 데이터를 살린다.
function loadStoredDays(): TripDay[] {
  const stored = loadSlice<TripDay[] | undefined>("days", undefined);
  if (Array.isArray(stored)) {
    return stored.filter((day) => day && typeof day.id === "string" && typeof day.date === "string");
  }
  // days 슬라이스 자체가 없을 때만(첫 실행) 루트 흔적으로 템플릿 복원
  const legacyRoutes = loadSlice<Record<string, RouteItem[]>>("routes", {});
  const hasAny = Object.values(legacyRoutes).some((route) => Array.isArray(route) && route.length > 0);
  if (hasAny) return templateDays.map((day) => ({ ...day }));
  return [];
}

function loadCustomPlaces(): Place[] {
  const parsed = loadSlice<Place[]>("customPlaces", []);
  return Array.isArray(parsed)
    ? parsed.filter(
        (place) =>
          place &&
          typeof place.id === "string" &&
          typeof place.lat === "number" &&
          typeof place.lng === "number"
      )
    : [];
}

// 사용자 장소를 전역 풀에 등록 — places/placesById는 화면 전체가 읽는 단일 소스
function registerPlace(place: Place) {
  if (placesById.has(place.id)) return;
  places.push(place);
  placesById.set(place.id, place);
}

function unregisterPlace(placeId: string) {
  const index = places.findIndex((place) => place.id === placeId);
  if (index >= 0) places.splice(index, 1);
  placesById.delete(placeId);
}

const initialCustomPlaces = loadCustomPlaces();
initialCustomPlaces.forEach(registerPlace);

function localISODate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

function makeDayLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${parsed.getMonth() + 1}/${parsed.getDate()} ${dayNames[parsed.getDay()]}`;
}

const emptyDay: TripDay = {
  id: "__empty__",
  date: "",
  label: "",
  city: "rome",
  title: "일정 없음",
  areaFocus: "",
  route: [],
  fallback: [],
  checklist: [],
};

const initialDays = loadStoredDays();
const initialDayId = (initialDays.find((day) => day.id === localISODate()) ?? initialDays[0])?.id ?? "";

function FitMap({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points).pad(0.2), { animate: false });
  }, [map, points]);

  return null;
}

function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });
  return null;
}

function PlaceMapMarker({
  place,
  routeIndex,
  isSelected,
  inRoute,
  showLabel,
  onSelect,
  addToRoute,
  replaceNext,
}: {
  place: Place;
  routeIndex?: number;
  isSelected: boolean;
  inRoute: boolean;
  showLabel: boolean;
  onSelect: () => void;
  addToRoute: (id: string) => void;
  replaceNext: (id: string) => void;
}) {
  const google = getPlaceScore(place);
  const icon = useMemo(() => {
    const color = categoryColors[place.category];
    // 라벨은 루트 순번·선택·확대 시에만 — 도시 줌에서 136개 라벨이 겹쳐 쌓이는 문제 방지
    if (!showLabel) {
      if (typeof routeIndex === "number") {
        return L.divIcon({
          className: "route-number-marker",
          html: `<span>${routeIndex + 1}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
      }
      const size = isSelected ? 22 : 15;
      return L.divIcon({
        className: "place-dot-wrap",
        html: `<i class="place-dot-marker ${isSelected ? "selected" : ""}" style="--dot-color:${color}"></i>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }
    const label = escapeHtml(getShortLabel(place));
    const category = escapeHtml(categoryShortLabels[place.category]);
    const routeBadge =
      typeof routeIndex === "number"
        ? `<span>${routeIndex + 1}</span>`
        : `<span style="background:${color}">${category}</span>`;
    return L.divIcon({
      className: `place-label-marker ${isSelected ? "selected" : ""} ${inRoute ? "in-route" : ""}`,
      html: `${routeBadge}<strong>${label}</strong>`,
      iconSize: [120, 34],
      iconAnchor: [18, 17],
    });
  }, [inRoute, isSelected, place, routeIndex, showLabel]);

  return (
    <Marker position={[place.lat, place.lng]} icon={icon} eventHandlers={{ click: onSelect }}>
      <Tooltip direction="top" offset={[0, -18]}>
        {place.koName}
      </Tooltip>
      <Popup>
        <div className="map-popup">
          <strong>{place.koName}</strong>
          <span>
            {categoryLabels[place.category]} · {place.area} · {google.ratingText}
          </span>
          <p>{place.why}</p>
          <div className="popup-meta">
            {google.reviewCountLabel && (
              <span>
                <Star size={13} /> {google.reviewCountLabel}
              </span>
            )}
            <span>{google.priceLevel}</span>
            <span>혼잡 {google.crowdLevel}</span>
          </div>
          <div className="popup-actions">
            <button onClick={() => addToRoute(place.id)}>
              <Plus size={14} /> 추가
            </button>
            <button onClick={() => replaceNext(place.id)}>
              <Route size={14} /> 교체
            </button>
            <a href={makeGooglePlaceUrl(place)} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Maps
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function Pill({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "must" | "warn" | "ok" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function IconButton({
  label,
  onClick,
  children,
  disabled,
  title,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button className="icon-button" onClick={onClick} disabled={disabled} title={title ?? label} aria-label={label}>
      {children}
    </button>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>(initialSettings.startTab ?? "today");
  const [days, setDays] = useState<TripDay[]>(initialDays);
  const [selectedDayId, setSelectedDayId] = useState(initialDayId);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [mode, setMode] = useState<ModeKey>(initialSettings.defaultMode ?? "default");
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [customPlaces, setCustomPlaces] = useState<Place[]>(initialCustomPlaces);
  const [routes, setRoutes] = useState<Record<string, RouteItem[]>>(() => loadStoredRoutes());
  const [done, setDone] = useState<Record<string, boolean>>(() => loadSlice("done", {}));
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
    activeTemplateRoutes()[initialDayId]?.[1]?.placeId ?? places[0].id
  );
  const [rankingCategory, setRankingCategory] = useState<PlaceCategory | "all">("all");
  const [rankingCity, setRankingCity] = useState<"all" | "rome" | "florence">("all");
  const [query, setQuery] = useState("");
  const [moreSection, setMoreSection] = useState<MoreKey>("safety");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => loadSlice("checks", {}));
  const [notes, setNotes] = useState<Record<string, string>>(() => loadSlice("notes", {}));
  const [docs, setDocs] = useState<TripDoc[]>(() => loadSlice<TripDoc[]>("docs", []));
  const [toast, setToast] = useState("");

  const selectedDay = days.find((day) => day.id === selectedDayId) ?? days[0] ?? emptyDay;
  const showSetup = days.length === 0 && (activeTab === "map" || activeTab === "today" || activeTab === "plan");
  const selectedRoute = routes[selectedDay.id] ?? [];
  const selectedRoutePlaces = selectedRoute.map((item) => getPlace(item.placeId));
  const relevantCities = useMemo(() => new Set(selectedRoutePlaces.map((place) => place.city).concat(selectedDay.city)), [selectedRoutePlaces, selectedDay.city]);
  const selectedPlace = placesById.get(selectedPlaceId) ?? selectedRoutePlaces[0];
  const nextStop = selectedRoute.find((item) => !done[item.uid] && getPlace(item.placeId).category !== "stay");
  const nextPlace = nextStop ? getPlace(nextStop.placeId) : selectedRoutePlaces.find((place) => place.category !== "stay");
  const stats = routeStats(selectedRoute);
  const sunset = selectedDay.date
    ? sunsetTime(cityCenters[selectedDay.city].lat, cityCenters[selectedDay.city].lng, selectedDay.date)
    : undefined;

  // 이전 날짜에서 완료 못 한 장소 → 오늘 후보로 회수
  const missedPlaces = useMemo(() => {
    const currentIds = new Set(selectedRoute.map((item) => item.placeId));
    const seen = new Set<string>();
    const result: Place[] = [];
    for (const day of days) {
      if (!selectedDay.date || day.date >= selectedDay.date) continue;
      for (const item of routes[day.id] ?? []) {
        if (done[item.uid]) continue;
        const place = placesById.get(item.placeId);
        if (!place || place.category === "stay" || place.category === "station") continue;
        if (currentIds.has(place.id) || seen.has(place.id)) continue;
        seen.add(place.id);
        result.push(place);
      }
    }
    return result.slice(0, 6);
  }, [days, routes, done, selectedDay.date, selectedRoute]);

	  useEffect(() => {
	    if (!toast) return;
	    const timer = window.setTimeout(() => setToast(""), 1700);
	    return () => window.clearTimeout(timer);
	  }, [toast]);

  useEffect(() => {
    saveSlice("routes", routes);
  }, [routes]);

  useEffect(() => {
    saveSlice("done", done);
  }, [done]);

  useEffect(() => {
    saveSlice("checks", checkedItems);
  }, [checkedItems]);

  useEffect(() => {
    saveSlice("settings", settings);
  }, [settings]);

  useEffect(() => {
    saveSlice("days", days);
  }, [days]);

  useEffect(() => {
    saveSlice("customPlaces", customPlaces);
  }, [customPlaces]);

  useEffect(() => {
    saveSlice("notes", notes);
  }, [notes]);

  useEffect(() => {
    saveSlice("docs", docs);
  }, [docs]);

  const mapPlaces = useMemo(() => {
    const routeIds = new Set(selectedRoute.map((item) => item.placeId));
    return places.filter((place) => {
      if (!relevantCities.has(place.city)) return false;
      if (filter === "today") return routeIds.size ? routeIds.has(place.id) : place.priority === 1;
      if (filter === "all") return place.priority <= 2;
      if (filter === "must") return place.priority === 1;
      if (filter === "photo") return place.photo === 3;
      if (filter === "safety") return place.safety !== "보통";
      if (filter === "reservation") return place.reservation === "필수" || place.reservation === "권장";
      if (filter === "korean") return Boolean(place.koreanTips?.length) || place.tags.includes("한국인선호");
      return place.category === filter;
    });
  }, [filter, relevantCities, selectedRoute]);

  const routePositions = selectedRoutePlaces.map((place) => [place.lat, place.lng] as [number, number]);
  const mapFitPoints = (filter === "today" ? selectedRoutePlaces : mapPlaces).map((place) => [place.lat, place.lng] as [number, number]);

  const recommendations = useMemo(() => {
    const routeIds = new Set(selectedRoute.map((item) => item.placeId));
    const anchor = selectedPlace ?? nextPlace ?? selectedRoutePlaces[0];
    return places
      .filter((place) => relevantCities.has(place.city))
      .filter((place) => place.priority <= 2 && !routeIds.has(place.id) && place.category !== "stay" && place.category !== "station")
      .map((place) => {
        const distance = anchor ? haversineKm(anchor, place) : 2;
        let score = place.rank + place.girlsTripFit * 4 + Math.max(0, 18 - distance * 5);
        if (mode === "low") score += place.durationMin <= 45 ? 22 : place.durationMin <= 75 ? 10 : -18;
        if (mode === "low" && ["cafe", "rest", "food"].includes(place.category)) score += 10;
        if (mode === "photo") score += place.photo * 10 + (place.category === "view" ? 12 : 0);
        if (mode === "rain") score += place.tags.includes("실내") ? 26 : place.category === "cafe" ? 12 : place.category === "view" ? -18 : 0;
        if (mode === "night") score += place.safety === "보통" ? 18 : place.safety === "밤주의" ? -28 : -8;
        if (mode === "shopping") score += place.category === "shopping" ? 32 : place.category === "cafe" ? 8 : 0;
        if (mode === "food") score += place.category === "food" ? 32 : place.category === "cafe" ? 12 : 0;
        if (mode === "korean") {
          score += place.tags.includes("한국인선호") ? 30 : 0;
          score += place.koreanTips?.length ? 12 : 0;
          score += ["food", "cafe", "shopping", "view"].includes(place.category) ? 8 : 0;
          score += place.safety === "밤주의" ? -10 : 0;
        }
        if (mode === "reservation") {
          score += place.reservation === "필수" ? 24 : place.reservation === "권장" ? 12 : -8;
          score += place.priority === 1 ? 8 : 0;
        }
        if (mode === "budget") {
          score += place.price === "무료" ? 24 : place.price === "낮음" ? 20 : place.price === "중간" ? 6 : -14;
          score += place.category === "food" || place.category === "cafe" ? 8 : 0;
        }
        return { place, score, distance };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [mode, nextPlace, relevantCities, selectedPlace, selectedRoute, selectedRoutePlaces]);

  function setDay(dayId: string) {
    setSelectedDayId(dayId);
    const day = days.find((item) => item.id === dayId);
    const currentRoute = routes[dayId] ?? [];
    if (currentRoute[0]) {
      setSelectedPlaceId(currentRoute[0].placeId);
      return;
    }
    if (day?.route[1]) setSelectedPlaceId(day.route[1].placeId);
  }

  // 템플릿: 선택한 콘셉트로 6/19-28 전체 일정 + 추천 코스를 채운다
  function applyTemplate(templateId: string) {
    const template = tripTemplates.find((item) => item.id === templateId) ?? tripTemplates[0];
    const hasExisting = days.some((day) => (routes[day.id] ?? []).length > 0);
    if (hasExisting && !window.confirm(`현재 일정을 '${template.name}' 템플릿으로 교체할까요? 기존 코스는 사라져요.`)) {
      return;
    }
    appliedTemplateId = template.id;
    const routesForTemplate = templateRoutesById[template.id] ?? {};
    const newDays = template.days.map((day) => ({ ...day }));
    setDays(newDays);
    setRoutes(
      Object.fromEntries(
        newDays.map((day) => [day.id, (routesForTemplate[day.id] ?? []).map((item) => ({ ...item }))])
      )
    );
    setSettings((current) => ({ ...current, appliedTemplateId: template.id }));
    const todayMatch = newDays.find((day) => day.id === localISODate()) ?? newDays[0];
    setSelectedDayId(todayMatch.id);
    setToast(`${template.name} 템플릿 적용됨`);
  }

  function addDay(input: { date: string; city: City; title?: string }) {
    const id = days.some((day) => day.id === input.date) ? `${input.date}-${days.length}` : input.date;
    const day: TripDay = {
      id,
      date: input.date,
      label: makeDayLabel(input.date),
      city: input.city,
      title: input.title?.trim() || "직접 만든 일정",
      areaFocus: "직접 구성",
      route: [],
      fallback: [],
      checklist: [],
    };
    setDays((current) => [...current, day].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)));
    setSelectedDayId(id);
    setToast(`${day.label} 추가됨`);
  }

  function removeDay(dayId: string) {
    setDays((current) => current.filter((day) => day.id !== dayId));
    setRoutes((current) => {
      const next = { ...current };
      delete next[dayId];
      return next;
    });
    if (selectedDayId === dayId) {
      const remaining = days.filter((day) => day.id !== dayId);
      setSelectedDayId(remaining[0]?.id ?? "");
    }
    setToast("날짜 삭제됨");
  }

  function addCustomPlace(input: { name: string; city: City; category: PlaceCategory; lat: number; lng: number; memo?: string }) {
    const place: Place = {
      id: `custom-${Date.now()}`,
      city: input.city,
      name: input.name,
      koName: input.name,
      category: input.category,
      area: "내 장소",
      lat: input.lat,
      lng: input.lng,
      priority: 2,
      rank: 60,
      durationMin: 45,
      reservation: "확인",
      bestTime: "자유",
      price: "확인",
      safety: "보통",
      photo: 2,
      girlsTripFit: 3,
      tags: ["내장소"],
      why: input.memo?.trim() || "직접 추가한 장소.",
      tips: [],
      pairWith: [],
      sourceIds: [],
    };
    registerPlace(place);
    setCustomPlaces((current) => [...current, place]);
    setSelectedPlaceId(place.id);
    setToast("내 장소 추가됨");
  }

  function removeCustomPlace(placeId: string) {
    unregisterPlace(placeId);
    setCustomPlaces((current) => current.filter((place) => place.id !== placeId));
    setRoutes((current) =>
      Object.fromEntries(
        Object.entries(current).map(([dayId, items]) => [dayId, items.filter((item) => item.placeId !== placeId)])
      )
    );
    if (selectedPlaceId === placeId) setSelectedPlaceId(places[0].id);
    setToast("내 장소 삭제됨");
  }

  function addToRoute(placeId: string) {
    setRoutes((current) => {
      const items = current[selectedDay.id] ?? [];
      if (items.some((item) => item.placeId === placeId)) return current;
      const newItem = { uid: `${selectedDay.id}-custom-${Date.now()}-${placeId}`, placeId };
      return { ...current, [selectedDay.id]: insertBeforeHotelReturn(items, [newItem]) };
    });
    setSelectedPlaceId(placeId);
    setToast("루트에 추가됨");
  }

  function replaceNext(placeId: string) {
    setRoutes((current) => {
      const items = current[selectedDay.id] ?? [];
      // 잠긴 일정(예약/기차)과 숙소·역은 교체 대상에서 제외
      const index = items.findIndex((item) => {
        if (done[item.uid] || item.locked) return false;
        const category = getPlace(item.placeId).category;
        return category !== "stay" && category !== "station";
      });
      if (index < 0) {
        const newItem = { uid: `${selectedDay.id}-custom-${Date.now()}-${placeId}`, placeId, note: "추천으로 추가" };
        return { ...current, [selectedDay.id]: insertBeforeHotelReturn(items, [newItem]) };
      }
      const next = [...items];
      next[index] = { ...next[index], placeId, note: "현장 교체" };
      return { ...current, [selectedDay.id]: next };
    });
    setSelectedPlaceId(placeId);
    setToast("다음 후보로 교체됨");
  }

  function removeRouteItem(uid: string) {
    setRoutes((current) => {
      const items = current[selectedDay.id] ?? [];
      const target = items.find((entry) => entry.uid === uid);
      if (target?.locked) return current;
      return { ...current, [selectedDay.id]: items.filter((entry) => entry.uid !== uid) };
    });
  }

  function moveRouteItem(index: number, direction: -1 | 1) {
    setRoutes((current) => {
      const items = current[selectedDay.id] ?? [];
      const target = index + direction;
      if (target < 0 || target >= items.length) return current;
      if (items[index].locked || items[target].locked) return current;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, [selectedDay.id]: next };
    });
  }

  function toggleDone(uid: string) {
    setDone((current) => ({ ...current, [uid]: !current[uid] }));
  }

  async function copyPhrase(text: string) {
    await navigator.clipboard?.writeText(text);
    setToast("복사됨");
  }

  function setPlaceNote(placeId: string, text: string) {
    setNotes((current) => {
      const next = { ...current };
      if (text.trim()) next[placeId] = text;
      else delete next[placeId];
      return next;
    });
  }

  function addDoc(input: { title: string; url?: string; memo?: string }) {
    setDocs((current) => [
      ...current,
      { id: `doc-${Date.now()}`, title: input.title.trim(), url: input.url?.trim() || undefined, memo: input.memo?.trim() || undefined },
    ]);
    setToast("문서 추가됨");
  }

  function removeDoc(docId: string) {
    setDocs((current) => current.filter((doc) => doc.id !== docId));
    setToast("문서 삭제됨");
  }

  function updateSettings(patch: Partial<AppSettings>) {
    setSettings((current) => {
      const next = { ...current, ...patch };
      applyHotelSettings(next);
      return next;
    });
    setToast("설정 저장됨");
  }

  function exportBackup() {
    downloadFile(
      "italy-trip-backup.json",
      JSON.stringify(
        { version: 5, savedAt: new Date().toISOString(), days, customPlaces, routes, done, checks: checkedItems, notes, docs, settings },
        null,
        2
      ),
      "application/json"
    );
  }

  function importBackup(file: File) {
    file
      .text()
      .then((text) => {
        const data = JSON.parse(text) as {
          days?: TripDay[];
          customPlaces?: Place[];
          routes?: Record<string, RouteItem[]>;
          done?: Record<string, boolean>;
          checks?: Record<string, boolean>;
          notes?: Record<string, string>;
          docs?: TripDoc[];
          settings?: AppSettings;
        };
        if (Array.isArray(data.customPlaces)) {
          data.customPlaces.forEach(registerPlace);
          setCustomPlaces(data.customPlaces);
        }
        if (Array.isArray(data.days)) {
          setDays(data.days);
          setSelectedDayId(data.days[0]?.id ?? "");
        }
        if (data.routes) setRoutes(sanitizeRoutes(data.routes));
        if (data.done) setDone(data.done);
        if (data.checks) setCheckedItems(data.checks);
        if (data.notes) setNotes(data.notes);
        if (Array.isArray(data.docs)) setDocs(data.docs);
        if (data.settings) {
          applyHotelSettings(data.settings);
          setSettings(data.settings);
        }
        setToast("백업 복원됨");
      })
      .catch(() => setToast("백업 파일을 읽지 못했어요"));
  }

  function clearRoute() {
    if (!window.confirm("오늘 코스를 전부 비울까요?")) return;
    setRoutes((current) => ({ ...current, [selectedDay.id]: [] }));
    setDone((current) => {
      const next = { ...current };
      selectedRoute.forEach((item) => delete next[item.uid]);
      return next;
    });
    setToast("오늘 코스 비움");
  }

  function applyRecommendedRoute(mode: "replace" | "append" = "replace") {
    setRoutes((current) => {
      const currentItems = current[selectedDay.id] ?? [];
      const currentIds = new Set(currentItems.map((item) => item.placeId));
      const recommended = cloneRoute(
        selectedDay.id,
        (activeTemplateRoutes()[selectedDay.id] ?? []).filter((item) => mode === "replace" || !currentIds.has(item.placeId)),
        mode === "replace" ? "apply" : "append"
      );
      if (mode === "replace") return { ...current, [selectedDay.id]: recommended };
      return {
        ...current,
        [selectedDay.id]: insertBeforeHotelReturn(
          currentItems,
          recommended.filter((item) => getPlace(item.placeId).category !== "stay")
        ),
      };
    });
    setToast(mode === "replace" ? "추천 코스 적용됨" : "추천 장소 추가됨");
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        {showSetup && <SetupScreen applyTemplate={applyTemplate} addDay={addDay} />}
        {!showSetup && activeTab === "map" && (
          <MapScreen
            days={days}
            selectedDayId={selectedDayId}
            setDay={setDay}
            selectedDay={selectedDay}
            selectedRoute={selectedRoute}
            routePositions={routePositions}
            mapFitPoints={mapFitPoints}
            mapPlaces={mapPlaces}
            selectedPlaceId={selectedPlaceId}
            setSelectedPlaceId={setSelectedPlaceId}
            filter={filter}
            setFilter={setFilter}
            mode={mode}
            setMode={setMode}
            recommendations={recommendations}
            stats={stats}
            done={done}
            nextStop={nextStop}
            addToRoute={addToRoute}
            replaceNext={replaceNext}
            removeRouteItem={removeRouteItem}
            moveRouteItem={moveRouteItem}
            toggleDone={toggleDone}
            clearRoute={clearRoute}
            applyRecommendedRoute={applyRecommendedRoute}
            notes={notes}
            setPlaceNote={setPlaceNote}
          />
        )}
        {!showSetup && activeTab === "today" && (
          <TodayScreen
            days={days}
            selectedDay={selectedDay}
            selectedRoute={selectedRoute}
            done={done}
            stats={stats}
            nextPlace={nextPlace}
            recommendations={recommendations}
            setActiveTab={setActiveTab}
            setDay={setDay}
            toggleDone={toggleDone}
            checkedItems={checkedItems}
            setCheckedItems={setCheckedItems}
            sunset={sunset}
            missedPlaces={missedPlaces}
            addToRoute={addToRoute}
          />
        )}
        {!showSetup && activeTab === "plan" && (
          <PlanScreen
            days={days}
            selectedDayId={selectedDayId}
            setDay={setDay}
            routes={routes}
            setActiveTab={setActiveTab}
            addDay={addDay}
            removeDay={removeDay}
            applyTemplate={applyTemplate}
            applyRecommendedRoute={(dayId) => {
              const day = days.find((item) => item.id === dayId);
              if (!day) return;
              setSelectedDayId(dayId);
              setRoutes((current) => ({ ...current, [dayId]: cloneRoute(dayId, activeTemplateRoutes()[dayId] ?? [], "plan-apply") }));
              setToast("추천 코스 적용됨");
            }}
          />
        )}
        {activeTab === "ranking" && (
          <RankingScreen
            rankingCategory={rankingCategory}
            setRankingCategory={setRankingCategory}
            rankingCity={rankingCity}
            setRankingCity={setRankingCity}
            query={query}
            setQuery={setQuery}
            addToRoute={addToRoute}
            setSelectedPlaceId={setSelectedPlaceId}
            setActiveTab={setActiveTab}
            customPlaces={customPlaces}
            addCustomPlace={addCustomPlace}
            removeCustomPlace={removeCustomPlace}
            selectedRoute={selectedRoute}
            replaceNext={replaceNext}
            notes={notes}
            setPlaceNote={setPlaceNote}
          />
        )}
        {activeTab === "more" && (
          <MoreScreen
            moreSection={moreSection}
            setMoreSection={setMoreSection}
            checkedItems={checkedItems}
            setCheckedItems={setCheckedItems}
            copyPhrase={copyPhrase}
            settings={settings}
            updateSettings={updateSettings}
            exportBackup={exportBackup}
            importBackup={importBackup}
            docs={docs}
            addDoc={addDoc}
            removeDoc={removeDoc}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="주요 메뉴">
        {tabItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={activeTab === item.key ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab(item.key)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function DayStrip({ days, selectedDayId, setDay }: { days: TripDay[]; selectedDayId: string; setDay: (id: string) => void }) {
  return (
    <div className="day-strip" aria-label="날짜 선택">
      {days.map((day) => (
        <button key={day.id} className={selectedDayId === day.id ? "day-chip active" : "day-chip"} onClick={() => setDay(day.id)}>
          <span>{day.label}</span>
          <small>{cityLabels[day.city]}</small>
        </button>
      ))}
    </div>
  );
}

function DayAddForm({ addDay }: { addDay: (input: { date: string; city: City; title?: string }) => void }) {
  const [date, setDate] = useState("");
  const [city, setCity] = useState<City>("rome");
  const [title, setTitle] = useState("");

  return (
    <div className="day-add-form">
      <input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="날짜" />
      <select value={city} onChange={(event) => setCity(event.target.value as City)} aria-label="도시">
        {(Object.keys(cityLabels) as City[]).map((key) => (
          <option key={key} value={key}>
            {cityLabels[key]}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="제목 (예: 바티칸 + 트라스테베레)"
        aria-label="일정 제목"
      />
      <button
        className="solid-button compact"
        disabled={!date}
        onClick={() => {
          if (!date) return;
          addDay({ date, city, title });
          setTitle("");
        }}
      >
        <Plus size={15} /> 날짜 추가
      </button>
    </div>
  );
}

function SetupScreen({
  applyTemplate,
  addDay,
}: {
  applyTemplate: (templateId: string) => void;
  addDay: (input: { date: string; city: City; title?: string }) => void;
}) {
  return (
    <section className="screen setup-screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Start</p>
          <h1>여행 일정 만들기</h1>
          <p className="subline">
            아직 일정이 비어 있어요. 4가지 콘셉트 중 하나로 시작하거나 날짜를 직접 추가하세요. 로마 5일 +
            6/24 이동 + 피렌체 4일 골격과 예약 앵커는 공통이에요.
          </p>
        </div>
      </div>

      {tripTemplates.map((template) => (
        <article key={template.id} className="info-card setup-card template-card">
          <div className="section-title-row">
            <h2>{template.name}</h2>
            <Pill tone={template.id === "classic" ? "ok" : undefined}>6/19 - 6/28</Pill>
          </div>
          <p className="template-tagline">{template.tagline}</p>
          <p>{template.description}</p>
          <div className="template-chips">
            {template.highlights.map((item) => (
              <span key={item} className="template-chip">
                {item}
              </span>
            ))}
          </div>
          <button className="solid-button" onClick={() => applyTemplate(template.id)}>
            <Sparkles size={17} />
            이 콘셉트로 시작
          </button>
        </article>
      ))}

      <article className="info-card setup-card">
        <div className="section-title-row">
          <h2>빈 일정으로 시작</h2>
          <Pill>커스텀</Pill>
        </div>
        <p>날짜와 도시만 정하고, 코스는 지도·장소 탭에서 직접 채워나가는 방식이에요.</p>
        <DayAddForm addDay={addDay} />
      </article>
    </section>
  );
}

function MapLegend({ visibleCount, totalCount }: { visibleCount: number; totalCount: number }) {
  const legendItems: { category: PlaceCategory; label: string }[] = [
    { category: "attraction", label: "명소" },
    { category: "food", label: "맛집" },
    { category: "cafe", label: "카페" },
    { category: "view", label: "전망" },
    { category: "shopping", label: "쇼핑" },
    { category: "station", label: "역" },
  ];

  return (
    <div className="map-legend">
      <div className="map-legend-summary">
        <Filter size={15} />
        <strong>{visibleCount}</strong>
        <span>/ {totalCount}개 중요 핀 표시</span>
      </div>
      <div className="legend-dots">
        {legendItems.map((item) => (
          <span key={item.category}>
            <i style={{ backgroundColor: categoryColors[item.category] }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

type WikiSummary = { url?: string; extract?: string; sourceUrl?: string };

// 같은 장소가 루트/타임라인/카드 여러 곳에서 그려지므로 위키 요청은 1회만
const wikiSummaryCache = new Map<string, Promise<WikiSummary>>();

function fetchWikiSummary(title: string): Promise<WikiSummary> {
  const cached = wikiSummaryCache.get(title);
  if (cached) return cached;
  const request = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
    .then((response) => (response.ok ? response.json() : undefined))
    .then((data): WikiSummary => {
      if (!data) return {};
      return {
        url: data.thumbnail?.source ?? data.originalimage?.source,
        extract: data.extract,
        sourceUrl: data.content_urls?.desktop?.page,
      };
    })
    .catch((): WikiSummary => ({}));
  wikiSummaryCache.set(title, request);
  return request;
}

function usePlaceMedia(place: Place, enhancement: PlaceEnhancement) {
  const [wikiImage, setWikiImage] = useState<WikiSummary>({});
  const imageUrl = enhancement.imageUrl ?? wikiImage.url;
  const sourceUrl = enhancement.imageSourceUrl ?? wikiImage.sourceUrl;

  useEffect(() => {
    let active = true;
    setWikiImage({});
    if (!enhancement.wikiTitle || enhancement.imageUrl) return;

    fetchWikiSummary(enhancement.wikiTitle).then((summary) => {
      if (active) setWikiImage(summary);
    });

    return () => {
      active = false;
    };
  }, [enhancement.imageUrl, enhancement.wikiTitle, place.id]);

  return { imageUrl, extract: wikiImage.extract, sourceUrl };
}

function PlaceThumb({ place, order }: { place: Place; order?: number }) {
  const enhancement = getEnhancement(place);
  const { imageUrl } = usePlaceMedia(place, enhancement);

  return (
    <span className={imageUrl ? "place-thumb has-image" : "place-thumb"} style={{ ["--thumb-color" as string]: categoryColors[place.category] }}>
      {imageUrl ? (
        <img src={imageUrl} alt="" loading="lazy" />
      ) : (
        <>
          <small>{order ?? categoryShortLabels[place.category]}</small>
          <strong>{getShortLabel(place)}</strong>
        </>
      )}
    </span>
  );
}

function PlaceMediaHero({ place, enhancement }: { place: Place; enhancement: PlaceEnhancement }) {
  const { imageUrl, extract, sourceUrl } = usePlaceMedia(place, enhancement);

  return (
    <div className={imageUrl ? "place-media has-image" : "place-media no-image"} style={{ ["--media-color" as string]: categoryColors[place.category] }}>
      {imageUrl ? (
        <img src={imageUrl} alt={place.koName} loading="lazy" />
      ) : (
        <div>
          <span>{categoryShortLabels[place.category]}</span>
          <strong>{getShortLabel(place)}</strong>
        </div>
      )}
      <div className="place-media-caption">
        <strong>{place.koName}</strong>
        <span>{enhancement.imageCredit ?? (sourceUrl ? "Wikimedia / Wikipedia" : categoryLabels[place.category])}</span>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noreferrer" aria-label={`${place.koName} 이미지 출처`}>
            <ExternalLink size={13} />
          </a>
        )}
      </div>
      {extract && !enhancement.highlights?.length ? <p>{extract}</p> : null}
    </div>
  );
}

function PlaceInsightCard({
  place,
  selectedRoute,
  addToRoute,
  replaceNext,
  setSelectedPlaceId,
  note,
  setPlaceNote,
}: {
  place?: Place;
  selectedRoute: RouteItem[];
  addToRoute: (id: string) => void;
  replaceNext: (id: string) => void;
  setSelectedPlaceId: (id: string) => void;
  note?: string;
  setPlaceNote?: (placeId: string, text: string) => void;
}) {
  if (!place) return null;

  const enhancement = getEnhancement(place);
  const google = getPlaceScore(place, enhancement);
  const inRoute = selectedRoute.some((item) => item.placeId === place.id);
  const pairPlaces = place.pairWith.map((id) => placesById.get(id)).filter((item): item is Place => Boolean(item)).slice(0, 6);
  const sourceNames = place.sourceIds
    .map((id) => sources.find((source) => source.id === id)?.label)
    .filter((label): label is string => Boolean(label))
    .slice(0, 3);

  return (
    <article className="place-insight">
      <div className="place-insight-head">
        <span className="category-dot" style={{ backgroundColor: categoryColors[place.category] }} />
        <div>
          <small>
            {cityLabels[place.city]} · {categoryLabels[place.category]} · {place.area}
          </small>
          <h2>{place.koName}</h2>
        </div>
        <Pill tone={place.priority === 1 ? "must" : "plain"}>{place.priority === 1 ? "Must" : "Good"}</Pill>
      </div>

      <PlaceMediaHero place={place} enhancement={enhancement} />

      <p>{place.why}</p>

      {enhancement.story ? <p className="place-story">{enhancement.story}</p> : null}

      <div className="trait-row">
        {traitBadges(place).map((badge) => (
          <span key={badge}>{badge}</span>
        ))}
      </div>

      <div className="google-review-box">
        <div className="google-score">
          <Star size={18} />
          <strong>{google.rating ? google.rating.toFixed(1) : place.rank}</strong>
          <span>
            {google.isVerified
              ? `Google 평점 · ${google.reviewCountLabel ?? "리뷰 다수"} · ${google.lastChecked ?? "확인일 미기록"} 확인`
              : "내부 추천 점수 · Google 평점은 실시간 확인 권장"}
          </span>
        </div>
        <div className="google-tags">
          <span>{google.priceLevel}</span>
          <span>혼잡 {google.crowdLevel}</span>
          <span>{google.visitConfidence}</span>
        </div>
        <a href={makeGooglePlaceUrl(place)} target="_blank" rel="noreferrer">
          실시간 확인 <ExternalLink size={13} />
        </a>
      </div>

      <div className="insight-metrics">
        <span>
          <ClockIcon /> {place.durationMin}분
        </span>
        <span>
          <Camera size={14} /> 사진 {place.photo}
        </span>
        <span>
          <Shield size={14} /> {place.safety}
        </span>
        <span>{place.reservation}</span>
      </div>

      {enhancement.highlights?.length ? (
        <div className="insight-chip-section">
          {enhancement.highlights.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}

      {enhancement.reviewSignals?.length ? (
        <div className="insight-block review-signals">
          <strong>평가에서 자주 갈리는 포인트</strong>
          <ul>
            {enhancement.reviewSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="insight-block">
        <strong>현장 판단</strong>
        <ul>
          {place.tips.slice(0, 2).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
          {(place.koreanTips ?? []).slice(0, 2).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      {place.watchOut?.length ? (
        <div className="watchout-row">
          <AlertTriangle size={15} />
          <span>{place.watchOut.slice(0, 2).join(" · ")}</span>
        </div>
      ) : null}

      {place.menuHints?.length ? (
        <div className="tag-row compact-tags">
          {place.menuHints.slice(0, 4).map((hint) => (
            <span key={hint}>{hint}</span>
          ))}
        </div>
      ) : null}

      {pairPlaces.length ? (
        <div className="pair-box">
          <strong>같이 묶기</strong>
          <div>
            {pairPlaces.map((pair) => (
              <button key={pair.id} onClick={() => setSelectedPlaceId(pair.id)}>
                {pair.koName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {setPlaceNote && (
        <div className="note-box">
          <strong>내 메모</strong>
          <textarea
            value={note ?? ""}
            onChange={(event) => setPlaceNote(place.id, event.target.value)}
            placeholder="예약 번호, 일행 의견, 가고 싶은 이유…"
            rows={2}
          />
        </div>
      )}

      <div className="card-actions">
        <button className="solid-button compact" onClick={() => addToRoute(place.id)} disabled={inRoute}>
          <Plus size={16} />
          {inRoute ? "루트 포함" : "루트 추가"}
        </button>
        <button className="ghost-button compact" onClick={() => replaceNext(place.id)}>
          <Route size={16} />
          다음 교체
        </button>
        <a className="text-link" href={makeGooglePlaceUrl(place)} target="_blank" rel="noreferrer">
          Maps <ExternalLink size={14} />
        </a>
      </div>

      {sourceNames.length ? <small className="source-mini">출처: {sourceNames.join(", ")}</small> : null}
    </article>
  );
}

function RecommendedRouteCard({
  day,
  recommendedRoute,
  currentRoute,
  applyRecommendedRoute,
  addToRoute,
  setSelectedPlaceId,
}: {
  day: TripDay;
  recommendedRoute: RouteItem[];
  currentRoute: RouteItem[];
  applyRecommendedRoute: (mode?: "replace" | "append") => void;
  addToRoute: (id: string) => void;
  setSelectedPlaceId: (id: string) => void;
}) {
  if (recommendedRoute.length === 0) return null;
  const currentIds = new Set(currentRoute.map((item) => item.placeId));
  const suggestedPlaces = recommendedRoute.map((item) => getPlace(item.placeId));
  const stats = routeStats(recommendedRoute);

  return (
    <article className="recommended-route-card">
      <div className="section-title-row">
        <div>
          <h2>추천 코스</h2>
          <p>
            {day.areaFocus} · {suggestedPlaces.length} stops · {formatDistanceKm(stats.km)}
          </p>
        </div>
        <Pill tone="ok">선택 적용</Pill>
      </div>
      <div className="template-route">
        {recommendedRoute.map((item, index) => {
          const place = getPlace(item.placeId);
          const google = getPlaceScore(place);
          const added = currentIds.has(place.id);
          return (
            <button
              key={item.uid}
              className={added ? "added" : ""}
              onClick={() => setSelectedPlaceId(place.id)}
              title={place.why}
            >
              <span>{index + 1}</span>
              <strong>{place.koName}</strong>
              <small>
                {item.time ?? categoryLabels[place.category]} · {google.ratingText}
              </small>
            </button>
          );
        })}
      </div>
      <div className="card-actions">
        <button className="solid-button compact" onClick={() => applyRecommendedRoute("replace")}>
          <RefreshCw size={16} />
          추천안 적용
        </button>
        <button className="ghost-button compact" onClick={() => applyRecommendedRoute("append")}>
          <Plus size={16} />
          빠진 곳 추가
        </button>
      </div>
      <div className="quick-add-row">
        {recommendedRoute
          .filter((item) => !currentIds.has(item.placeId))
          .slice(0, 4)
          .map((item) => {
            const place = getPlace(item.placeId);
            return (
              <button key={item.uid} onClick={() => addToRoute(place.id)}>
                <Plus size={13} />
                {place.koName}
              </button>
            );
          })}
      </div>
    </article>
  );
}

function MapScreen({
  days,
  selectedDayId,
  setDay,
  selectedDay,
  selectedRoute,
  routePositions,
  mapFitPoints,
  mapPlaces,
  selectedPlaceId,
  setSelectedPlaceId,
  filter,
  setFilter,
  mode,
  setMode,
  recommendations,
  stats,
  done,
  nextStop,
  addToRoute,
  replaceNext,
  removeRouteItem,
  moveRouteItem,
  toggleDone,
  clearRoute,
  applyRecommendedRoute,
  notes,
  setPlaceNote,
}: {
  days: TripDay[];
  selectedDayId: string;
  setDay: (id: string) => void;
  selectedDay: TripDay;
  selectedRoute: RouteItem[];
  routePositions: [number, number][];
  mapFitPoints: [number, number][];
  mapPlaces: Place[];
  selectedPlaceId: string;
  setSelectedPlaceId: (id: string) => void;
  filter: FilterKey;
  setFilter: (filter: FilterKey) => void;
  mode: ModeKey;
  setMode: (mode: ModeKey) => void;
  recommendations: { place: Place; score: number; distance: number }[];
  stats: ReturnType<typeof routeStats>;
  done: Record<string, boolean>;
  nextStop?: RouteItem;
  addToRoute: (id: string) => void;
  replaceNext: (id: string) => void;
  removeRouteItem: (uid: string) => void;
  moveRouteItem: (index: number, direction: -1 | 1) => void;
  toggleDone: (uid: string) => void;
  clearRoute: () => void;
  applyRecommendedRoute: (mode?: "replace" | "append") => void;
  notes: Record<string, string>;
  setPlaceNote: (placeId: string, text: string) => void;
}) {
  const [mapZoom, setMapZoom] = useState(13);
  const nextPlace = nextStop ? getPlace(nextStop.placeId) : undefined;
  const selectedPlace = placesById.get(selectedPlaceId);
  const selectedGoogle = selectedPlace ? getPlaceScore(selectedPlace, getEnhancement(selectedPlace)) : undefined;
  const routeAreas = Array.from(new Set(selectedRoute.map((item) => getPlace(item.placeId).area))).slice(0, 3);
  const mustCount = selectedRoute.filter((item) => getPlace(item.placeId).priority === 1).length;
  const foodCount = selectedRoute.filter((item) => getPlace(item.placeId).category === "food" || getPlace(item.placeId).category === "cafe").length;
  const routeIndexByPlaceId = useMemo(
    () => new Map(selectedRoute.map((item, index) => [item.placeId, index])),
    [selectedRoute]
  );

  return (
    <section className="screen map-screen">
      <div className="screen-header map-header">
        <div>
          <p className="eyebrow">Italy Trip Control Map</p>
          <h1>{selectedDay.title}</h1>
          <p className="subline">
            {selectedDay.label} · {selectedDay.areaFocus}
          </p>
        </div>
        <div className="header-actions">
          <select value={mode} onChange={(event) => setMode(event.target.value as ModeKey)} aria-label="루트 모드">
            {Object.entries(modeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <IconButton label="코스 비우기" onClick={clearRoute}>
            <X size={18} />
          </IconButton>
        </div>
      </div>

      <DayStrip days={days} selectedDayId={selectedDayId} setDay={setDay} />

      <div className="filter-row" aria-label="지도 필터">
        {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
          <button key={key} className={filter === key ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(key)}>
            {filterLabels[key]}
          </button>
        ))}
      </div>

      <MapLegend visibleCount={mapPlaces.length} totalCount={places.filter((place) => place.priority <= 2).length} />

      <div className="map-workspace">
        <div className="map-card">
          <MapContainer className="leaflet-map" center={[41.9028, 12.4964]} zoom={13} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitMap points={mapFitPoints.length ? mapFitPoints : routePositions} />
            <ZoomWatcher onZoom={setMapZoom} />
            {routePositions.length > 1 && <Polyline positions={routePositions} pathOptions={{ color: "#c2502e", weight: 4, opacity: 0.78 }} />}
            {mapPlaces.map((place) => {
              const isSelected = selectedPlaceId === place.id;
              const inRoute = selectedRoute.some((item) => item.placeId === place.id);
              const routeIndex = routeIndexByPlaceId.get(place.id);
              return (
                <PlaceMapMarker
                  key={place.id}
                  place={place}
                  routeIndex={routeIndex}
                  isSelected={isSelected}
                  inRoute={inRoute}
                  showLabel={isSelected || mapZoom >= 15}
                  onSelect={() => setSelectedPlaceId(place.id)}
                  addToRoute={addToRoute}
                  replaceNext={replaceNext}
                />
              );
            })}
          </MapContainer>
          {selectedPlace && (
            <div className="map-floating-insight">
              <div>
                <span>
                  {categoryLabels[selectedPlace.category]} · {selectedPlace.area} · {selectedGoogle?.ratingText}
                </span>
                <strong>{selectedPlace.koName}</strong>
                <em>
                  {selectedGoogle?.reviewCountLabel ? `${selectedGoogle.reviewCountLabel} · ` : ""}
                  {selectedGoogle?.priceLevel} · 혼잡 {selectedGoogle?.crowdLevel}
                </em>
                <small>{selectedPlace.why}</small>
              </div>
              <div>
                <a href={makeGooglePlaceUrl(selectedPlace)} target="_blank" rel="noreferrer" aria-label={`${selectedPlace.koName} Google Maps`}>
                  <Navigation size={16} />
                </a>
                <button
                  onClick={() => addToRoute(selectedPlace.id)}
                  disabled={selectedRoute.some((item) => item.placeId === selectedPlace.id)}
                  aria-label={`${selectedPlace.koName} 루트 추가`}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="route-panel">
	          <div className="route-now">
	            <div>
	              <span className="label">다음</span>
	              <strong>{nextPlace?.koName ?? (selectedRoute.length ? "오늘 코스 완료" : "코스 비어 있음")}</strong>
	              <p>
	                {selectedRoute.length ? `${formatDistanceKm(stats.km)} · 도보 약 ${stats.walkMin}분 · 주의 ${stats.caution}` : "지도 핀이나 추천안에서 장소를 추가하세요"}
	              </p>
	            </div>
            <a className={selectedRoute.length ? "solid-button compact" : "solid-button compact disabled-link"} href={makeDirectionsUrl(selectedRoute)} target="_blank" rel="noreferrer">
              <Navigation size={16} />
              길찾기
            </a>
          </div>

          <div className="route-signal-grid">
            <div>
              <MapPin size={16} />
	              <strong>{routeAreas.join(" · ") || "미정"}</strong>
              <span>오늘 권역</span>
            </div>
            <div>
              <Star size={16} />
              <strong>{mustCount}</strong>
              <span>Must</span>
            </div>
            <div>
              <Utensils size={16} />
              <strong>{foodCount}</strong>
              <span>먹고 쉬기</span>
            </div>
            <div>
              <Shield size={16} />
              <strong>{stats.caution}</strong>
              <span>주의 핀</span>
            </div>
          </div>

          <PlaceInsightCard
            place={selectedPlace}
            selectedRoute={selectedRoute}
            addToRoute={addToRoute}
            replaceNext={replaceNext}
            setSelectedPlaceId={setSelectedPlaceId}
            note={selectedPlace ? notes[selectedPlace.id] : undefined}
            setPlaceNote={setPlaceNote}
          />

          <RecommendedRouteCard
            day={selectedDay}
            recommendedRoute={activeTemplateRoutes()[selectedDay.id] ?? []}
            currentRoute={selectedRoute}
            applyRecommendedRoute={applyRecommendedRoute}
            addToRoute={addToRoute}
            setSelectedPlaceId={setSelectedPlaceId}
          />

          <div className="route-list">
            {selectedRoute.length === 0 && (
              <div className="empty-route">
                <strong>오늘 코스가 비어 있어요.</strong>
                <p>지도 핀, 랭킹, 추천 코스에서 장소를 골라 직접 추가하면 선과 순서가 생깁니다.</p>
              </div>
            )}
            {selectedRoute.map((item, index) => {
              const place = getPlace(item.placeId);
              const isDone = done[item.uid];
              const google = getPlaceScore(place);
              return (
                <div key={item.uid} className={isDone ? "route-item done" : "route-item"}>
                  <button className="route-main" onClick={() => setSelectedPlaceId(place.id)}>
                    <PlaceThumb place={place} order={index + 1} />
                    <span>
                      <strong>{place.koName}</strong>
                      <small>
                        {item.time ? `${item.time} · ` : ""}
                        {categoryLabels[place.category]} · {place.durationMin}분 · {google.ratingText}
                      </small>
                    </span>
                  </button>
                  <div className="route-tools">
                    <IconButton label="완료" onClick={() => toggleDone(item.uid)}>
                      <Check size={16} />
                    </IconButton>
                    {item.locked ? (
                      <IconButton label="고정 일정" disabled title="예약/이동 등 고정 일정이라 수정 불가">
                        <Lock size={16} />
                      </IconButton>
                    ) : (
                      <>
                        <IconButton
                          label="위로"
                          onClick={() => moveRouteItem(index, -1)}
                          disabled={index === 0 || Boolean(selectedRoute[index - 1]?.locked)}
                        >
                          <ArrowUp size={16} />
                        </IconButton>
                        <IconButton
                          label="아래로"
                          onClick={() => moveRouteItem(index, 1)}
                          disabled={index === selectedRoute.length - 1 || Boolean(selectedRoute[index + 1]?.locked)}
                        >
                          <ArrowDown size={16} />
                        </IconButton>
                        <IconButton label="삭제" onClick={() => removeRouteItem(item.uid)}>
                          <X size={16} />
                        </IconButton>
                      </>
                    )}
                  </div>
                  {item.note && <p className="route-note">{item.note}</p>}
                </div>
              );
            })}
          </div>

          <div className="recommend-box">
            <div className="section-title-row">
              <h2>지금 추천</h2>
              <Pill tone="ok">{modeLabels[mode]}</Pill>
            </div>
            {recommendations.map(({ place, distance }) => {
              const google = getPlaceScore(place);
              return (
                <div className="recommend-item" key={place.id}>
                  <button onClick={() => setSelectedPlaceId(place.id)}>
                    <strong>{place.koName}</strong>
                    <small>
                      {categoryLabels[place.category]} · {formatDistanceKm(distance)} · {google.ratingText} · {place.durationMin}분
                    </small>
                  </button>
                  <IconButton label="루트에 추가" onClick={() => addToRoute(place.id)}>
                    <Plus size={17} />
                  </IconButton>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

function TodayScreen({
  days,
  selectedDay,
  selectedRoute,
  done,
  stats,
  nextPlace,
  recommendations,
  setActiveTab,
  setDay,
  toggleDone,
  checkedItems,
  setCheckedItems,
  sunset,
  missedPlaces,
  addToRoute,
}: {
  days: TripDay[];
  selectedDay: TripDay;
  selectedRoute: RouteItem[];
  done: Record<string, boolean>;
  stats: ReturnType<typeof routeStats>;
  nextPlace?: Place;
  recommendations: { place: Place; score: number; distance: number }[];
  setActiveTab: (tab: TabKey) => void;
  setDay: (id: string) => void;
  toggleDone: (uid: string) => void;
  checkedItems: Record<string, boolean>;
  setCheckedItems: Dispatch<SetStateAction<Record<string, boolean>>>;
  sunset?: string;
  missedPlaces: Place[];
  addToRoute: (id: string) => void;
}) {
  const nextGoogle = nextPlace ? getPlaceScore(nextPlace, getEnhancement(nextPlace)) : undefined;

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Today</p>
          <h1>{selectedDay.title}</h1>
          <p className="subline">
            {selectedDay.label} · {cityLabels[selectedDay.city]} · {selectedDay.areaFocus}
            {sunset ? ` · 일몰 ${sunset} (계산값)` : ""}
          </p>
        </div>
        <button className="solid-button" onClick={() => setActiveTab("map")}>
          <MapIcon size={17} />
          지도
        </button>
      </div>
      <DayStrip days={days} selectedDayId={selectedDay.id} setDay={setDay} />

      <div className="today-grid">
        <section className="hero-panel">
          <span className="label">다음 목적지</span>
          <h2>{nextPlace?.koName ?? "코스를 직접 만들어보세요"}</h2>
          <p>{nextPlace?.why ?? "지도나 랭킹에서 장소를 추가하거나, 추천 코스를 선택 적용하면 오늘 루트가 만들어진다."}</p>
          {nextGoogle && (
            <div className="hero-meta">
              <span>
                <Star size={14} /> {nextGoogle.ratingText}
              </span>
              {nextGoogle.reviewCountLabel && <span>{nextGoogle.reviewCountLabel}</span>}
              <span>혼잡 {nextGoogle.crowdLevel}</span>
            </div>
          )}
          {nextPlace && (
            <div className="hero-actions">
              <a className="solid-button compact" href={makeGooglePlaceUrl(nextPlace)} target="_blank" rel="noreferrer">
                <Navigation size={16} />
                Maps
              </a>
              <button className="ghost-button compact" onClick={() => setActiveTab("map")}>
                <Route size={16} />
                루트
              </button>
            </div>
          )}
        </section>

        <section className="metric-grid">
          <div className="metric">
            <Route size={18} />
            <strong>{formatDistanceKm(stats.km)}</strong>
            <span>직선 합산</span>
          </div>
          <div className="metric">
            <Navigation size={18} />
            <strong>{stats.walkMin}분</strong>
            <span>도보 감각</span>
          </div>
          <div className="metric">
            <AlertTriangle size={18} />
            <strong>{stats.caution}</strong>
            <span>주의 핀</span>
          </div>
          <div className="metric">
            <Star size={18} />
            <strong>{stats.must}</strong>
            <span>Must</span>
          </div>
        </section>
      </div>

      <section className="content-band">
        <div className="section-title-row">
          <h2>오늘 루트</h2>
          <a className={selectedRoute.length ? "text-link" : "text-link muted-link"} href={makeDirectionsUrl(selectedRoute)} target="_blank" rel="noreferrer">
            Google Maps <ExternalLink size={14} />
          </a>
        </div>
        <div className="timeline">
          {selectedRoute.length === 0 && (
            <div className="empty-route">
              <strong>아직 만든 코스가 없어요.</strong>
              <p>추천 코스를 그대로 적용하거나, 지도에서 원하는 장소만 골라 추가하세요.</p>
            </div>
          )}
          {selectedRoute.map((item, index) => {
            const place = getPlace(item.placeId);
            const google = getPlaceScore(place);
            return (
              <div key={item.uid} className={done[item.uid] ? "timeline-item done" : "timeline-item"}>
                <button className="timeline-check" onClick={() => toggleDone(item.uid)}>
                  {done[item.uid] ? <Check size={16} /> : index + 1}
                </button>
                <div className="timeline-detail">
                  <PlaceThumb place={place} order={index + 1} />
                  <div>
                    <strong>{place.koName}</strong>
                    <p>
                      {item.time ? `${item.time} · ` : ""}
                      {place.area} · {place.durationMin}분 · {google.ratingText} · {place.safety}
                    </p>
                    {item.note && <small>{item.note}</small>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="content-band">
        <div className="section-title-row">
          <h2>상황별 선택</h2>
          <Pill>근처 후보</Pill>
        </div>
        <div className="choice-grid">
          {recommendations.slice(0, 3).map(({ place, distance }) => {
            const google = getPlaceScore(place);
            return (
              <a className="choice-card" key={place.id} href={makeGooglePlaceUrl(place)} target="_blank" rel="noreferrer">
                <span>
                  {categoryLabels[place.category]} · {google.ratingText}
                </span>
                <strong>{place.koName}</strong>
                <small>
                  {formatDistanceKm(distance)} · {place.bestTime} · 혼잡 {google.crowdLevel}
                </small>
              </a>
            );
          })}
        </div>
      </section>

      {missedPlaces.length > 0 && (
        <section className="content-band">
          <div className="section-title-row">
            <h2>못 간 곳 회수</h2>
            <Pill tone="warn">{missedPlaces.length}</Pill>
          </div>
          <p className="settings-hint">이전 날짜에 넣었지만 완료하지 못한 장소예요. 오늘 코스에 다시 넣을 수 있어요.</p>
          <div className="missed-list">
            {missedPlaces.map((place) => (
              <div className="recommend-item" key={place.id}>
                <button onClick={() => setActiveTab("map")}>
                  <strong>{place.koName}</strong>
                  <small>
                    {categoryLabels[place.category]} · {place.area} · {place.durationMin}분
                  </small>
                </button>
                <IconButton label="오늘 코스에 추가" onClick={() => addToRoute(place.id)}>
                  <Plus size={17} />
                </IconButton>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="content-band">
        <div className="section-title-row">
          <h2>체크</h2>
          <Pill tone="warn">당일</Pill>
        </div>
        <div className="check-list">
          {selectedDay.checklist.map((item) => {
            const key = `${selectedDay.id}::${item}`;
            return (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={Boolean(checkedItems[key])}
                  onChange={() => setCheckedItems((current) => ({ ...current, [key]: !current[key] }))}
                />
                <span>{item}</span>
              </label>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function PlanScreen({
  days,
  selectedDayId,
  setDay,
  routes,
  setActiveTab,
  addDay,
  removeDay,
  applyTemplate,
  applyRecommendedRoute,
}: {
  days: TripDay[];
  selectedDayId: string;
  setDay: (id: string) => void;
  routes: Record<string, RouteItem[]>;
  setActiveTab: (tab: TabKey) => void;
  addDay: (input: { date: string; city: City; title?: string }) => void;
  removeDay: (dayId: string) => void;
  applyTemplate: (templateId: string) => void;
  applyRecommendedRoute: (dayId: string) => void;
}) {
  const first = days[0];
  const last = days[days.length - 1];
  const rangeLabel = first && last ? `${first.label} - ${last.label}` : "일정 없음";

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Plan</p>
          <h1>내 일정</h1>
          <p className="subline">
            {rangeLabel} · {days.length}일 · 날짜 추가/삭제와 코스 편집 모두 가능
          </p>
        </div>
      </div>

      <section className="content-band">
        <div className="section-title-row">
          <h2>여행 템플릿</h2>
          <Pill>4종</Pill>
        </div>
        <p className="settings-hint">
          콘셉트를 고르면 6/19-28 전체 일정과 추천 코스가 다시 채워져요. 적용 후에도 자유롭게 수정할 수 있어요.
        </p>
        <div className="template-row">
          {tripTemplates.map((template) => (
            <article key={template.id} className="template-mini-card">
              <strong>{template.name}</strong>
              <span>{template.tagline}</span>
              <button className="ghost-button compact" onClick={() => applyTemplate(template.id)}>
                <Sparkles size={15} />
                적용
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="content-band">
        <div className="section-title-row">
          <h2>날짜 추가</h2>
          <Pill>커스텀</Pill>
        </div>
        <DayAddForm addDay={addDay} />
      </section>

      <div className="plan-list">
        {days.map((day) => {
          const route = routes[day.id] ?? [];
          const recommended = activeTemplateRoutes()[day.id] ?? [];
          const mustCount = route.filter((item) => getPlace(item.placeId).priority === 1).length;
          return (
            <article key={day.id} className={selectedDayId === day.id ? "day-card active" : "day-card"}>
              <div className="day-card-head-row">
                <button
                  className="day-card-head"
                  onClick={() => {
                    setDay(day.id);
                    setActiveTab("map");
                  }}
                >
                  <span>
                    <small>
                      {day.label} · {cityLabels[day.city]}
                    </small>
                    <strong>{day.title}</strong>
                  </span>
                  <ChevronRight size={20} />
                </button>
                <IconButton
                  label="날짜 삭제"
                  onClick={() => {
                    if (window.confirm(`${day.label} 일정을 삭제할까요? 이 날의 코스도 함께 지워집니다.`)) {
                      removeDay(day.id);
                    }
                  }}
                >
                  <X size={16} />
                </IconButton>
              </div>
              <p>{day.areaFocus}</p>
              <div className="plan-section-label">내 코스</div>
              <div className="mini-route">
                {route.length === 0 && <span>아직 비어 있음</span>}
                {route.slice(0, 7).map((item) => (
                  <span key={item.uid}>{getPlace(item.placeId).koName}</span>
                ))}
              </div>
              <div className="day-card-footer">
                <Pill tone={mustCount > 3 ? "must" : "plain"}>Must {mustCount}</Pill>
                <Pill>{route.length} stops</Pill>
                <a className={route.length ? "" : "muted-link"} href={makeDirectionsUrl(route)} target="_blank" rel="noreferrer">
                  Maps <ExternalLink size={13} />
                </a>
              </div>
              {recommended.length > 0 && (
                <>
                  <div className="plan-section-label">추천안</div>
                  <div className="mini-route recommendation-mini">
                    {recommended.slice(0, 8).map((item) => (
                      <span key={item.uid}>{getPlace(item.placeId).koName}</span>
                    ))}
                  </div>
                </>
              )}
              <div className="card-actions plan-actions">
                {recommended.length > 0 && (
                  <button
                    className="ghost-button compact"
                    onClick={() => {
                      applyRecommendedRoute(day.id);
                      setDay(day.id);
                      setActiveTab("map");
                    }}
                  >
                    <RefreshCw size={16} />
                    추천안 적용
                  </button>
                )}
                <button
                  className="solid-button compact"
                  onClick={() => {
                    setDay(day.id);
                    setActiveTab("map");
                  }}
                >
                  <MapIcon size={16} />
                  직접 편집
                </button>
              </div>
              <div className="fallbacks">
                {day.fallback.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type RankSortKey = "popular" | "rating" | "fast";

const rankSortLabels: Record<RankSortKey, string> = {
  popular: "인기순",
  rating: "평점순",
  fast: "소요시간 짧은 순",
};

function RankingScreen({
  rankingCategory,
  setRankingCategory,
  rankingCity,
  setRankingCity,
  query,
  setQuery,
  addToRoute,
  setSelectedPlaceId,
  setActiveTab,
  customPlaces,
  addCustomPlace,
  removeCustomPlace,
  selectedRoute,
  replaceNext,
  notes,
  setPlaceNote,
}: {
  rankingCategory: PlaceCategory | "all";
  setRankingCategory: (category: PlaceCategory | "all") => void;
  rankingCity: "all" | "rome" | "florence";
  setRankingCity: (city: "all" | "rome" | "florence") => void;
  query: string;
  setQuery: (value: string) => void;
  addToRoute: (id: string) => void;
  setSelectedPlaceId: (id: string) => void;
  setActiveTab: (tab: TabKey) => void;
  customPlaces: Place[];
  addCustomPlace: (input: { name: string; city: City; category: PlaceCategory; lat: number; lng: number; memo?: string }) => void;
  removeCustomPlace: (placeId: string) => void;
  selectedRoute: RouteItem[];
  replaceNext: (id: string) => void;
  notes: Record<string, string>;
  setPlaceNote: (placeId: string, text: string) => void;
}) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [sortKey, setSortKey] = useState<RankSortKey>("popular");
  const [detailId, setDetailId] = useState<string>();
  const customIds = new Set(customPlaces.map((place) => place.id));
  const categories: (PlaceCategory | "all")[] = ["all", "attraction", "food", "cafe", "view", "shopping"];
  const sorters: Record<RankSortKey, (a: Place, b: Place) => number> = {
    popular: (a, b) => b.rank - a.rank,
    rating: (a, b) =>
      (getPlaceScore(b).rating ?? 0) - (getPlaceScore(a).rating ?? 0) || b.rank - a.rank,
    fast: (a, b) => a.durationMin - b.durationMin || b.rank - a.rank,
  };
  const filtered = places
    .filter((place) => place.category !== "stay" && place.category !== "station")
    .filter((place) => rankingCategory === "all" || place.category === rankingCategory)
    .filter((place) => rankingCity === "all" || place.city === rankingCity)
    .filter((place) =>
      `${place.koName} ${place.name} ${place.area} ${place.tags.join(" ")} ${(place.menuHints ?? []).join(" ")} ${(getEnhancement(place).highlights ?? []).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    .sort(sorters[sortKey]);
  const detailPlace = detailId ? placesById.get(detailId) : undefined;

  const clusters = Array.from(
    places
      .filter((place) => place.priority <= 2 && place.category !== "stay" && place.category !== "station")
      .reduce((map, place) => {
        const key = `${cityLabels[place.city]} · ${place.area}`;
        const current = map.get(key) ?? [];
        current.push(place);
        map.set(key, current);
        return map;
      }, new Map<string, Place[]>())
  ).sort((a, b) => b[1].reduce((sum, place) => sum + place.rank, 0) - a[1].reduce((sum, place) => sum + place.rank, 0));

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Roma · Firenze</p>
          <h1>인기 장소</h1>
          <p className="subline">명소·맛집·카페를 인기순으로 — 카드를 누르면 상세 정보</p>
        </div>
        <button className="ghost-button compact" onClick={() => setShowCustomForm((current) => !current)}>
          <Plus size={16} />
          내 장소
        </button>
      </div>

      {showCustomForm && (
        <section className="content-band">
          <div className="section-title-row">
            <h2>내 장소 추가</h2>
            <Pill>커스텀</Pill>
          </div>
          <p className="settings-hint">Google Maps에서 장소를 길게 눌러 좌표를 복사해 붙여넣으세요.</p>
          <CustomPlaceForm
            onAdd={(input) => {
              addCustomPlace(input);
              setShowCustomForm(false);
            }}
          />
        </section>
      )}

      <div className="rank-controls">
        <div className="segmented">
          {(["all", "rome", "florence"] as const).map((city) => (
            <button key={city} className={rankingCity === city ? "active" : ""} onClick={() => setRankingCity(city)}>
              {city === "all" ? "전체" : cityLabels[city]}
            </button>
          ))}
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="장소, 권역, 태그 검색" />
      </div>

      <div className="filter-row">
        {categories.map((category) => (
          <button
            key={category}
            className={rankingCategory === category ? "filter-chip active" : "filter-chip"}
            onClick={() => setRankingCategory(category)}
          >
            {category === "all" ? "전체" : categoryLabels[category]}
          </button>
        ))}
      </div>

      <section className="content-band">
        <div className="section-title-row">
          <h2>권역 묶음</h2>
          <Pill>동선 기준</Pill>
        </div>
        <div className="cluster-row">
          {clusters.slice(0, 8).map(([area, list]) => (
            <button
              key={area}
              onClick={() => {
                setQuery(area.split(" · ")[1]);
              }}
            >
              <strong>{area}</strong>
              <span>{list.slice(0, 4).map((place) => place.koName).join(", ")}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="sort-row">
        <span>{filtered.length}곳 · {rankSortLabels[sortKey]}</span>
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as RankSortKey)} aria-label="정렬 기준">
          {(Object.keys(rankSortLabels) as RankSortKey[]).map((key) => (
            <option key={key} value={key}>
              {rankSortLabels[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="place-list">
        {filtered.map((place, index) => (
          <PlacePhotoCard key={place.id} place={place} rank={index + 1} onOpen={() => setDetailId(place.id)} />
        ))}
      </div>

      {detailPlace && (
        <div className="sheet-backdrop" onClick={() => setDetailId(undefined)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <button className="sheet-close" onClick={() => setDetailId(undefined)} aria-label="닫기">
              <X size={16} />
            </button>
            <PlaceInsightCard
              place={detailPlace}
              selectedRoute={selectedRoute}
              addToRoute={addToRoute}
              replaceNext={replaceNext}
              setSelectedPlaceId={setDetailId}
              note={notes[detailPlace.id]}
              setPlaceNote={setPlaceNote}
            />
            <div className="card-actions" style={{ marginTop: 10 }}>
              <button
                className="ghost-button compact"
                onClick={() => {
                  setSelectedPlaceId(detailPlace.id);
                  setActiveTab("map");
                  setDetailId(undefined);
                }}
              >
                <MapPin size={16} /> 지도에서 보기
              </button>
              {customIds.has(detailPlace.id) && (
                <button
                  className="ghost-button compact"
                  onClick={() => {
                    if (window.confirm(`'${detailPlace.koName}'을(를) 삭제할까요?`)) {
                      removeCustomPlace(detailPlace.id);
                      setDetailId(undefined);
                    }
                  }}
                >
                  <X size={16} /> 삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PlacePhotoCard({ place, rank, onOpen }: { place: Place; rank: number; onOpen: () => void }) {
  const enhancement = getEnhancement(place);
  const { imageUrl } = usePlaceMedia(place, enhancement);
  const score = getPlaceScore(place, enhancement);
  const badges = traitBadges(place).slice(0, 3);

  return (
    <article
      className="place-photo-card"
      style={{ ["--photo-color" as string]: categoryColors[place.category] }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="card-photo">
        {imageUrl ? (
          <img src={imageUrl} alt={place.koName} loading="lazy" />
        ) : (
          <div className="photo-fallback">
            <small>{categoryShortLabels[place.category]}</small>
            <strong>{getShortLabel(place)}</strong>
          </div>
        )}
        <span className={rank <= 3 ? "rank-flag top" : "rank-flag"}>{rank}위</span>
      </div>
      <div className="card-body">
        <small>
          {cityLabels[place.city]} · {categoryLabels[place.category]} · {place.area}
        </small>
        <h3>
          <span>{place.koName}</span>
          <span className={score.isVerified ? "score-chip" : "score-chip internal"}>
            <Star size={13} />
            {score.isVerified ? score.rating?.toFixed(1) : `${place.rank}점`}
          </span>
        </h3>
        <p className="card-desc">{place.why}</p>
        <div className="trait-row">
          {badges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function ClockIcon() {
  return <span className="clock-dot" aria-hidden="true" />;
}

function CustomPlaceForm({
  onAdd,
}: {
  onAdd: (input: { name: string; city: City; category: PlaceCategory; lat: number; lng: number; memo?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState<City>("rome");
  const [category, setCategory] = useState<PlaceCategory>("attraction");
  const [coords, setCoords] = useState("");
  const [memo, setMemo] = useState("");
  const match = coords.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
  const formCategories: PlaceCategory[] = ["attraction", "food", "cafe", "shopping", "view", "rest"];

  return (
    <div className="custom-place-form">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="장소 이름" />
      <div className="custom-place-row">
        <select value={city} onChange={(event) => setCity(event.target.value as City)} aria-label="도시">
          {(Object.keys(cityLabels) as City[]).map((key) => (
            <option key={key} value={key}>
              {cityLabels[key]}
            </option>
          ))}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value as PlaceCategory)} aria-label="카테고리">
          {formCategories.map((key) => (
            <option key={key} value={key}>
              {categoryLabels[key]}
            </option>
          ))}
        </select>
      </div>
      <input value={coords} onChange={(event) => setCoords(event.target.value)} placeholder="위도, 경도 붙여넣기 (예: 41.9001, 12.4905)" />
      <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모 (선택) — 왜 가는지, 예약 번호 등" />
      <button
        className="solid-button compact"
        disabled={!name.trim() || !match}
        onClick={() => {
          if (!name.trim() || !match) return;
          onAdd({ name: name.trim(), city, category, lat: parseFloat(match[1]), lng: parseFloat(match[2]), memo });
          setName("");
          setCoords("");
          setMemo("");
        }}
      >
        <Plus size={15} /> 장소 추가
      </button>
    </div>
  );
}

function DocAddForm({ onAdd }: { onAdd: (input: { title: string; url?: string; memo?: string }) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState("");

  return (
    <div className="custom-place-form">
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="제목 (예: 콜로세움 예약)" />
      <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="링크 (선택)" inputMode="url" />
      <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모 (예: 예약번호, 입장 시간)" />
      <button
        className="solid-button compact"
        disabled={!title.trim()}
        onClick={() => {
          if (!title.trim()) return;
          onAdd({ title, url, memo });
          setTitle("");
          setUrl("");
          setMemo("");
        }}
      >
        <Plus size={15} /> 문서 추가
      </button>
    </div>
  );
}

function HotelSettingForm({
  city,
  current,
  onSave,
}: {
  city: string;
  current?: { lat: number; lng: number; label?: string };
  onSave: (value: { lat: number; lng: number; label?: string }) => void;
}) {
  const [coords, setCoords] = useState(current ? `${current.lat}, ${current.lng}` : "");
  const [label, setLabel] = useState(current?.label ?? "");
  const match = coords.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);

  return (
    <div className="hotel-form">
      <strong>{city} 숙소</strong>
      <input
        value={coords}
        onChange={(event) => setCoords(event.target.value)}
        placeholder="위도, 경도 붙여넣기 (예: 41.9001, 12.4905)"
        inputMode="text"
      />
      <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="숙소 이름 (선택)" />
      <button
        className="solid-button compact"
        disabled={!match}
        onClick={() => {
          if (!match) return;
          onSave({ lat: parseFloat(match[1]), lng: parseFloat(match[2]), label: label.trim() || undefined });
        }}
      >
        <Check size={15} /> 저장
      </button>
    </div>
  );
}

function MoreScreen({
  moreSection,
  setMoreSection,
  checkedItems,
  setCheckedItems,
  copyPhrase,
  settings,
  updateSettings,
  exportBackup,
  importBackup,
  docs,
  addDoc,
  removeDoc,
}: {
  moreSection: MoreKey;
  setMoreSection: (key: MoreKey) => void;
  checkedItems: Record<string, boolean>;
  setCheckedItems: Dispatch<SetStateAction<Record<string, boolean>>>;
  copyPhrase: (text: string) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  exportBackup: () => void;
  importBackup: (file: File) => void;
  docs: TripDoc[];
  addDoc: (input: { title: string; url?: string; memo?: string }) => void;
  removeDoc: (docId: string) => void;
}) {
  const sections: { key: MoreKey; label: string; icon: ElementType }[] = [
    { key: "safety", label: "안전·꿀팁", icon: Shield },
    { key: "foodGuide", label: "음식", icon: Utensils },
    { key: "phrases", label: "회화", icon: Languages },
    { key: "checklist", label: "체크", icon: ListChecks },
    { key: "docs", label: "문서함", icon: FileText },
    { key: "data", label: "데이터·설정", icon: SettingsIcon },
  ];

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">More</p>
          <h1>안전, 회화, 설정</h1>
          <p className="subline">현장에서 자주 쓰는 것 + 숙소·백업 설정</p>
        </div>
      </div>

      <div className="more-tabs">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button key={section.key} className={moreSection === section.key ? "active" : ""} onClick={() => setMoreSection(section.key)}>
              <Icon size={17} />
              {section.label}
            </button>
          );
        })}
      </div>

      {moreSection === "safety" && (
        <div className="info-list">
          <article className="info-card emergency-card">
            <div className="section-title-row">
              <h2>비상 연락</h2>
              <Pill tone="warn">112</Pill>
            </div>
            <p>EU 긴급번호 112. 도난/분실은 숙소 프런트, 경찰서, 카드사 앱 순서로 처리.</p>
            <p>주이탈리아 대한민국 대사관: 대표 +39 06 420 402 1, 근무시간 외 긴급 +39 335 185 0499.</p>
          </article>
          {safetyNotes.map((note) => (
            <article key={note.title} className="info-card">
              <div className="section-title-row">
                <h2>{note.title}</h2>
                <Pill tone={note.severity === "높음" ? "warn" : "plain"}>{note.severity}</Pill>
              </div>
              <p>{note.detail}</p>
            </article>
          ))}
          {koreanTravelGuides.map((guide) => (
            <article key={guide.title} className="info-card">
              <div className="section-title-row">
                <h2>{guide.title}</h2>
                <Pill tone="ok">꿀팁</Pill>
              </div>
              <ul className="guide-list">
                {guide.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}

      {moreSection === "foodGuide" && (
        <div className="info-list">
          {foodOrderGuides.map((guide) => (
            <article key={guide.title} className="info-card">
              <div className="section-title-row">
                <h2>{guide.title}</h2>
                <Pill>{guide.city}</Pill>
              </div>
              <ul className="guide-list">
                {guide.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}

      {moreSection === "phrases" && (
        <div className="phrase-list">
          {phraseGroups.map((group) => (
            <section key={group.title} className="content-band">
              <div className="section-title-row">
                <h2>{group.title}</h2>
                <Pill>{group.lines.length}</Pill>
              </div>
              {group.lines.map((line) => (
                <div className="phrase-row" key={line.it}>
                  <button onClick={() => copyPhrase(line.it)}>
                    <strong>{line.it}</strong>
                    <span>{line.sound}</span>
                    <small>{line.ko}</small>
                  </button>
                  <IconButton label="복사" onClick={() => copyPhrase(line.it)}>
                    <Copy size={16} />
                  </IconButton>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {moreSection === "checklist" && (
        <section className="content-band">
          <div className="section-title-row">
            <h2>준비물</h2>
            <Pill>{packingChecklist.filter((item) => checkedItems[item]).length}/{packingChecklist.length}</Pill>
          </div>
          <div className="check-list large">
            {packingChecklist.map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={Boolean(checkedItems[item])}
                  onChange={() => setCheckedItems((current) => ({ ...current, [item]: !current[item] }))}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {moreSection === "docs" && (
        <div className="info-list">
          <section className="content-band">
            <div className="section-title-row">
              <h2>예약·티켓 모음</h2>
              <Pill>{docs.length}</Pill>
            </div>
            <p className="settings-hint">
              항공권, 기차, 미술관 예약의 링크와 번호를 모아두는 곳이에요. 여권 사본 같은 민감한 원본은 넣지
              마세요.
            </p>
            <DocAddForm onAdd={addDoc} />
          </section>
          {docs.length === 0 && (
            <article className="info-card">
              <p>아직 저장된 문서가 없어요. 예약 확정 메일의 링크나 예약 번호부터 추가해보세요.</p>
            </article>
          )}
          {docs.map((doc) => (
            <article key={doc.id} className="info-card doc-card">
              <div className="section-title-row">
                <h2>{doc.title}</h2>
                <IconButton
                  label="문서 삭제"
                  onClick={() => {
                    if (window.confirm(`'${doc.title}' 문서를 삭제할까요?`)) removeDoc(doc.id);
                  }}
                >
                  <X size={16} />
                </IconButton>
              </div>
              {doc.memo && <p>{doc.memo}</p>}
              {doc.url && (
                <a className="text-link" href={doc.url} target="_blank" rel="noreferrer">
                  열기 <ExternalLink size={14} />
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      {moreSection === "data" && (
        <div className="info-list">
          <section className="content-band settings-panel">
            <div className="section-title-row">
              <h2>숙소 설정</h2>
              <Pill tone="warn">루트 기준점</Pill>
            </div>
            <p className="settings-hint">
              Google Maps에서 숙소를 길게 눌러 나오는 좌표를 복사해 붙여넣으세요. 모든 거리·루트·숙소 복귀가 이
              좌표 기준으로 다시 계산됩니다.
            </p>
            <HotelSettingForm city="로마" current={settings.romeHotel} onSave={(value) => updateSettings({ romeHotel: value })} />
            <HotelSettingForm
              city="피렌체"
              current={settings.florenceHotel}
              onSave={(value) => updateSettings({ florenceHotel: value })}
            />
            <div className="settings-row">
              <label>
                시작 화면
                <select
                  value={settings.startTab ?? "map"}
                  onChange={(event) => updateSettings({ startTab: event.target.value as TabKey })}
                >
                  {tabItems.map((tab) => (
                    <option key={tab.key} value={tab.key}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                기본 모드
                <select
                  value={settings.defaultMode ?? "default"}
                  onChange={(event) => updateSettings({ defaultMode: event.target.value as ModeKey })}
                >
                  {Object.entries(modeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="content-band export-panel">
            <div className="section-title-row">
              <h2>백업</h2>
              <Pill>JSON</Pill>
            </div>
            <p className="settings-hint">루트·완료 체크·설정을 파일로 저장하고, 다른 기기에서 복원합니다.</p>
            <div className="export-actions">
              <button className="solid-button" onClick={exportBackup}>
                <Download size={17} />
                백업 저장
              </button>
              <label className="ghost-button file-button">
                <Upload size={17} />
                복원
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) importBackup(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>

          <section className="content-band export-panel">
            <div className="section-title-row">
              <h2>지도 파일</h2>
              <Pill>Google My Maps</Pill>
            </div>
            <div className="export-actions">
              <button className="solid-button" onClick={exportCsv}>
                <Download size={17} />
                CSV
              </button>
              <button className="ghost-button" onClick={exportKml}>
                <Download size={17} />
                KML
              </button>
            </div>
            <div className="export-grid">
              <div>
                <MapPin size={20} />
                <strong>{places.filter((place) => place.priority <= 2).length}</strong>
                <span>핀</span>
              </div>
              <div>
                <Star size={20} />
                <strong>{places.filter((place) => place.priority === 1).length}</strong>
                <span>Must</span>
              </div>
              <div>
                <Train size={20} />
                <strong>2</strong>
                <span>도시</span>
              </div>
            </div>
          </section>

          <section className="content-band">
            <div className="section-title-row">
              <h2>출처</h2>
              <Pill>{sources.length}</Pill>
            </div>
            <div className="source-list">
              {sources.map((source) => (
                <a key={source.id} className="source-row" href={source.url} target="_blank" rel="noreferrer">
                  <span>
                    <strong>{source.label}</strong>
                    <small>{source.note}</small>
                  </span>
                  <ExternalLink size={16} />
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
