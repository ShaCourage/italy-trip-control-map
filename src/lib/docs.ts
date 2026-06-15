export type DocType = "flight" | "train" | "stay" | "ticket" | "other";

export type TripDoc = {
  id: string;
  type: DocType;
  title: string;
  url?: string;
  memo?: string;
};

export type TripDocInput = Omit<TripDoc, "id">;

export const docTypeLabels: Record<DocType, string> = {
  flight: "항공",
  train: "기차",
  stay: "숙소",
  ticket: "입장권",
  other: "기타",
};

const docTypes = new Set<DocType>(["flight", "train", "stay", "ticket", "other"]);

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function makeFallbackDocId(title: string, index: number) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `doc-${slug || `item-${index + 1}`}`;
}

function makeUniqueDocId(baseId: string, seen: Set<string>) {
  let id = baseId;
  let suffix = 2;
  while (seen.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  seen.add(id);
  return id;
}

export function normalizeDocUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(candidate);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("링크는 http 또는 https 주소만 사용할 수 있어요.");
  }
  return parsed.toString();
}

export function normalizeTripDocs(value: unknown): TripDoc[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item, index): TripDoc[] => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Partial<Record<keyof TripDoc, unknown>>;
    const title = cleanString(raw.title);
    if (!title) return [];
    let url: string | undefined;
    if (cleanString(raw.url)) {
      try {
        url = normalizeDocUrl(raw.url as string);
      } catch {
        url = undefined;
      }
    }
    const type = typeof raw.type === "string" && docTypes.has(raw.type as DocType) ? (raw.type as DocType) : "other";
    const id = makeUniqueDocId(cleanString(raw.id) ?? makeFallbackDocId(title, index), seen);
    return [{
      id,
      type,
      title,
      url,
      memo: cleanString(raw.memo),
    }];
  });
}
