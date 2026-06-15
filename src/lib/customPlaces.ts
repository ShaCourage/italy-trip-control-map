import type { City, Place, PlaceCategory } from "../data/schema";

const citySet = new Set<City>(["rome", "florence"]);
const categorySet = new Set<PlaceCategory>(["attraction", "food", "cafe", "shopping", "view", "rest"]);

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const text = cleanString(item);
    return text ? [text] : [];
  });
}

function cleanNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function cleanLiteral<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function optionalArray(value: unknown): string[] | undefined {
  const items = cleanStringArray(value);
  return items.length ? items : undefined;
}

export function normalizeCustomPlace(value: unknown): Place | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Partial<Record<keyof Place, unknown>>;
  const id = cleanString(raw.id);
  const name = cleanString(raw.name) ?? cleanString(raw.koName);
  const lat = cleanNumber(raw.lat);
  const lng = cleanNumber(raw.lng);
  if (!id || !id.startsWith("custom-") || !name || lat === undefined || lng === undefined) return undefined;

  const tags = Array.from(new Set(["내장소", ...cleanStringArray(raw.tags)]));
  const memo = cleanString(raw.why);

  return {
    id,
    city: typeof raw.city === "string" && citySet.has(raw.city as City) ? (raw.city as City) : "rome",
    name,
    koName: cleanString(raw.koName) ?? name,
    category:
      typeof raw.category === "string" && categorySet.has(raw.category as PlaceCategory)
        ? (raw.category as PlaceCategory)
        : "attraction",
    area: cleanString(raw.area) ?? "내 장소",
    lat,
    lng,
    priority: cleanLiteral(raw.priority, [1, 2, 3] as const, 3),
    rank: cleanNumber(raw.rank) ?? 50,
    durationMin: cleanNumber(raw.durationMin) ?? 45,
    reservation: cleanLiteral(raw.reservation, ["필수", "권장", "불필요", "확인"] as const, "불필요"),
    bestTime: cleanString(raw.bestTime) ?? "자유",
    price: cleanLiteral(raw.price, ["무료", "낮음", "중간", "높음", "확인"] as const, "확인"),
    safety: cleanLiteral(raw.safety, ["보통", "주의", "밤주의"] as const, "보통"),
    photo: cleanLiteral(raw.photo, [1, 2, 3] as const, 1),
    girlsTripFit: cleanLiteral(raw.girlsTripFit, [1, 2, 3] as const, 2),
    tags,
    why: memo ?? "직접 추가한 장소",
    tips: cleanStringArray(raw.tips),
    koreanTips: optionalArray(raw.koreanTips),
    menuHints: optionalArray(raw.menuHints),
    watchOut: optionalArray(raw.watchOut),
    pairWith: cleanStringArray(raw.pairWith),
    sourceIds: cleanStringArray(raw.sourceIds),
  };
}

export function normalizeCustomPlaces(value: unknown): Place[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item): Place[] => {
    const place = normalizeCustomPlace(item);
    if (!place || seen.has(place.id)) return [];
    seen.add(place.id);
    return [place];
  });
}
