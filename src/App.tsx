import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Map as MapIcon,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  City,
  Place,
  PlaceCategory,
  TripDay,
  tripDays as templateDays,
} from "./data";
import { tripTemplates } from "./templates";
import { loadSlice, saveSlice } from "./lib/storage";
import {
  appendRouteItems,
  cloneRoute,
  moveRouteItem as moveRoute,
  removePlaceFromRoutes,
  removeRouteItem as removeRoute,
  replaceFirstRouteItem,
  sanitizeRoutes,
} from "./lib/routes";
import {
  activeTemplateRoutes,
  applyHotelSettings,
  getPlace,
  haversineKm,
  initialSettings,
  places,
  placesById,
  registerPlace,
  routeStats,
  setAppliedTemplateId,
  templateRoutesById,
  unregisterPlace,
} from "./appCore";
import type { AppSettings, FilterKey, ModeKey, RouteItem, TabKey } from "./appCore";
import { Pill } from "./components/place";
import { DayAddForm } from "./components/schedule";
import { normalizeTripDocs } from "./lib/docs";
import type { TripDoc, TripDocInput } from "./lib/docs";
import { normalizeBudget } from "./lib/budget";
import type { BudgetEntry } from "./lib/budget";
import type { MoreKey } from "./screens/MoreScreen";

const MapScreen = lazy(() => import("./screens/MapScreen"));
const RankingScreen = lazy(() => import("./screens/RankingScreen"));
const TodayScreen = lazy(() => import("./screens/TodayScreen"));
const PlanScreen = lazy(() => import("./screens/PlanScreen"));
const MoreScreen = lazy(() => import("./screens/MoreScreen"));

const tabItems = [
  { key: "today" as const, label: "오늘", icon: Sparkles },
  { key: "map" as const, label: "지도", icon: MapIcon },
  { key: "ranking" as const, label: "장소", icon: Trophy },
  { key: "plan" as const, label: "템플릿", icon: CalendarDays },
  { key: "more" as const, label: "더보기", icon: FileText },
];

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function routeMutationToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isTerminalHotelReturn(item: RouteItem) {
  return Boolean(item.locked && getPlace(item.placeId).category === "stay");
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

function loadStoredRoutes(): Record<string, RouteItem[]> {
  return sanitizeRoutes(loadSlice("routes", {}), (placeId) => placesById.has(placeId));
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
  const [docs, setDocs] = useState<TripDoc[]>(() => normalizeTripDocs(loadSlice<unknown>("docs", [])));
  const [budget, setBudget] = useState<BudgetEntry[]>(() => normalizeBudget(loadSlice<unknown>("budget", [])));
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

  useEffect(() => {
    saveSlice("budget", budget);
  }, [budget]);

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
    setAppliedTemplateId(template.id);
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
      removePlaceFromRoutes(current, placeId)
    );
    if (selectedPlaceId === placeId) setSelectedPlaceId(places[0].id);
    setToast("내 장소 삭제됨");
  }

  function addToRoute(placeId: string) {
    setRoutes((current) => {
      const items = current[selectedDay.id] ?? [];
      const newItem = { uid: `${selectedDay.id}-custom-${Date.now()}-${placeId}`, placeId };
      const next = appendRouteItems(items, [newItem], isTerminalHotelReturn);
      return next === items ? current : { ...current, [selectedDay.id]: next };
    });
    setSelectedPlaceId(placeId);
    setToast("루트에 추가됨");
  }

  function replaceNext(placeId: string) {
    setRoutes((current) => {
      const items = current[selectedDay.id] ?? [];
      // 잠긴 일정(예약/기차)과 숙소·역은 교체 대상에서 제외
      const replaced = replaceFirstRouteItem(
        items,
        { placeId, note: "현장 교체" },
        (item) => {
          if (done[item.uid] || item.locked) return false;
          const category = getPlace(item.placeId).category;
          return category !== "stay" && category !== "station";
        }
      );
      if (!replaced) {
        const newItem = { uid: `${selectedDay.id}-custom-${Date.now()}-${placeId}`, placeId, note: "추천으로 추가" };
        const next = appendRouteItems(items, [newItem], isTerminalHotelReturn);
        return next === items ? current : { ...current, [selectedDay.id]: next };
      }
      if (replaced === items) return current;
      return { ...current, [selectedDay.id]: replaced };
    });
    setSelectedPlaceId(placeId);
    setToast("다음 후보로 교체됨");
  }

  function removeRouteItem(uid: string) {
    setRoutes((current) => {
      const items = current[selectedDay.id] ?? [];
      const next = removeRoute(items, uid);
      return next === items ? current : { ...current, [selectedDay.id]: next };
    });
  }

  function moveRouteItem(index: number, direction: -1 | 1) {
    setRoutes((current) => {
      const items = current[selectedDay.id] ?? [];
      const next = moveRoute(items, index, direction);
      return next === items ? current : { ...current, [selectedDay.id]: next };
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

  function addDoc(input: TripDocInput) {
    setDocs((current) => [
      ...current,
      { id: `doc-${Date.now()}`, ...input },
    ]);
    setToast("문서 추가됨");
  }

  function updateDoc(docId: string, input: TripDocInput) {
    setDocs((current) => current.map((doc) => (doc.id === docId ? { id: doc.id, ...input } : doc)));
    setToast("문서 수정됨");
  }

  function removeDoc(docId: string) {
    setDocs((current) => current.filter((doc) => doc.id !== docId));
    setToast("문서 삭제됨");
  }

  function addBudgetEntry(input: Omit<BudgetEntry, "id">) {
    setBudget((current) => [
      ...current,
      { ...input, id: `budget-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
    ]);
    setToast("지출 기록됨");
  }

  function removeBudgetEntry(id: string) {
    setBudget((current) => current.filter((entry) => entry.id !== id));
    setToast("지출 삭제됨");
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
        { version: 7, savedAt: new Date().toISOString(), days, customPlaces, routes, done, checks: checkedItems, notes, docs, budget, settings },
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
          budget?: BudgetEntry[];
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
        if (data.routes) setRoutes(sanitizeRoutes(data.routes, (placeId) => placesById.has(placeId)));
        if (data.done) setDone(data.done);
        if (data.checks) setCheckedItems(data.checks);
        if (data.notes) setNotes(data.notes);
        if (Array.isArray(data.docs)) setDocs(normalizeTripDocs(data.docs));
        if (Array.isArray(data.budget)) setBudget(normalizeBudget(data.budget));
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
        mode === "replace" ? "apply" : "append",
        routeMutationToken()
      );
      if (mode === "replace") return { ...current, [selectedDay.id]: recommended };
      const next = appendRouteItems(
        currentItems,
        recommended.filter((item) => getPlace(item.placeId).category !== "stay"),
        isTerminalHotelReturn
      );
      if (next === currentItems) return current;
      return {
        ...current,
        [selectedDay.id]: next,
      };
    });
    setToast(mode === "replace" ? "추천 코스 적용됨" : "추천 장소 추가됨");
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        {showSetup && <SetupScreen applyTemplate={applyTemplate} addDay={addDay} />}
        {!showSetup && activeTab === "map" && (
          <Suspense fallback={<div className="content-band">지도를 불러오는 중...</div>}>
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
          </Suspense>
        )}
        {!showSetup && activeTab === "today" && (
          <Suspense fallback={<div className="content-band">오늘 일정을 불러오는 중...</div>}>
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
          </Suspense>
        )}
        {!showSetup && activeTab === "plan" && (
          <Suspense fallback={<div className="content-band">템플릿을 불러오는 중...</div>}>
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
                setRoutes((current) => ({
                  ...current,
                  [dayId]: cloneRoute(dayId, activeTemplateRoutes()[dayId] ?? [], "plan-apply", routeMutationToken()),
                }));
                setToast("추천 코스 적용됨");
              }}
            />
          </Suspense>
        )}
        {activeTab === "ranking" && (
          <Suspense fallback={<div className="content-band">장소 목록을 불러오는 중...</div>}>
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
          </Suspense>
        )}
        {activeTab === "more" && (
          <Suspense fallback={<div className="content-band">도구와 설정을 불러오는 중...</div>}>
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
              updateDoc={updateDoc}
              removeDoc={removeDoc}
              budget={budget}
              addBudgetEntry={addBudgetEntry}
              removeBudgetEntry={removeBudgetEntry}
              days={days}
            />
          </Suspense>
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
