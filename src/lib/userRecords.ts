function entries(value: unknown): [string, unknown][] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).filter(([key]) => key.length > 0);
}

export function normalizeBooleanRecord(value: unknown): Record<string, boolean> {
  return Object.fromEntries(entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"));
}

export function normalizeStringRecord(value: unknown): Record<string, string> {
  return Object.fromEntries(
    entries(value).flatMap(([key, raw]) => {
      if (typeof raw !== "string") return [];
      const text = raw.trim();
      return text ? [[key, text]] : [];
    })
  );
}
