import type { City, RouteStop, TripDay } from "../data/schema";

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
const citySet = new Set<City>(["rome", "florence"]);

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

function normalizeRoute(value: unknown): RouteStop[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): RouteStop[] => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Partial<Record<keyof RouteStop, unknown>>;
    const placeId = cleanString(raw.placeId);
    if (!placeId) return [];

    const stop: RouteStop = { placeId };
    const time = cleanString(raw.time);
    const note = cleanString(raw.note);
    if (time) stop.time = time;
    if (typeof raw.locked === "boolean") stop.locked = raw.locked;
    if (note) stop.note = note;
    return [stop];
  });
}

export function makeDayLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${parsed.getMonth() + 1}/${parsed.getDate()} ${dayNames[parsed.getDay()]}`;
}

export function normalizeTripDay(value: unknown): TripDay | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Partial<Record<keyof TripDay, unknown>>;
  const date = cleanString(raw.date);
  if (!date) return undefined;

  const id = cleanString(raw.id) ?? date;
  const city = typeof raw.city === "string" && citySet.has(raw.city as City) ? (raw.city as City) : "rome";
  return {
    id,
    date,
    label: cleanString(raw.label) ?? makeDayLabel(date),
    city,
    title: cleanString(raw.title) ?? "직접 만든 일정",
    areaFocus: cleanString(raw.areaFocus) ?? "직접 구성",
    route: normalizeRoute(raw.route),
    fallback: cleanStringArray(raw.fallback),
    checklist: cleanStringArray(raw.checklist),
  };
}

export function normalizeTripDays(value: unknown): TripDay[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): TripDay[] => {
    const day = normalizeTripDay(item);
    return day ? [day] : [];
  });
}
