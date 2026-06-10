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
  return value.flatMap((item): TripDoc[] => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Partial<Record<keyof TripDoc, unknown>>;
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!title) return [];
    let url: string | undefined;
    if (typeof raw.url === "string" && raw.url.trim()) {
      try {
        url = normalizeDocUrl(raw.url);
      } catch {
        url = undefined;
      }
    }
    const type = typeof raw.type === "string" && docTypes.has(raw.type as DocType) ? (raw.type as DocType) : "other";
    return [{
      id: typeof raw.id === "string" && raw.id ? raw.id : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      url,
      memo: typeof raw.memo === "string" && raw.memo.trim() ? raw.memo.trim() : undefined,
    }];
  });
}
