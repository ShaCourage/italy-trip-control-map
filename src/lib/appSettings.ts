import type { AppSettings, FilterKey, TabKey } from "../appCore";

const tabKeys = new Set<TabKey>(["today", "map", "plan", "ranking", "more"]);
const filterKeys = new Set<FilterKey>([
  "today",
  "all",
  "must",
  "attraction",
  "food",
  "cafe",
  "view",
  "shopping",
  "photo",
  "korean",
  "reservation",
  "budget",
  "low",
  "rain",
  "night",
]);

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function cleanHotel(value: unknown): AppSettings["romeHotel"] {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as { lat?: unknown; lng?: unknown; label?: unknown };
  if (typeof raw.lat !== "number" || typeof raw.lng !== "number") return undefined;
  if (!Number.isFinite(raw.lat) || !Number.isFinite(raw.lng)) return undefined;

  const label = cleanString(raw.label);
  return label ? { lat: raw.lat, lng: raw.lng, label } : { lat: raw.lat, lng: raw.lng };
}

export function normalizeAppSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") return {};
  const raw = value as Partial<Record<keyof AppSettings, unknown>>;
  const settings: AppSettings = {};

  const romeHotel = cleanHotel(raw.romeHotel);
  const florenceHotel = cleanHotel(raw.florenceHotel);
  if (romeHotel) settings.romeHotel = romeHotel;
  if (florenceHotel) settings.florenceHotel = florenceHotel;
  if (typeof raw.startTab === "string" && tabKeys.has(raw.startTab as TabKey)) {
    settings.startTab = raw.startTab as TabKey;
  }
  if (typeof raw.defaultFilter === "string" && filterKeys.has(raw.defaultFilter as FilterKey)) {
    settings.defaultFilter = raw.defaultFilter as FilterKey;
  }

  const appliedTemplateId = cleanString(raw.appliedTemplateId);
  if (appliedTemplateId) settings.appliedTemplateId = appliedTemplateId;
  return settings;
}
