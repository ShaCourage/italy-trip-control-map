export type RouteItem = {
  uid: string;
  placeId: string;
  locked?: boolean;
  time?: string;
  note?: string;
};

export type RouteMap = Record<string, RouteItem[]>;

export function cloneRoute(dayId: string, route: RouteItem[], prefix: string, token: string): RouteItem[] {
  return route.map((item, index) => ({
    ...item,
    uid: `${dayId}-${prefix}-${token}-${index}-${item.placeId}`,
  }));
}

export function appendRouteItems(
  items: RouteItem[],
  newItems: RouteItem[],
  isTerminalReturn: (item: RouteItem) => boolean
): RouteItem[] {
  const existingIds = new Set(items.map((item) => item.placeId));
  const additions = newItems.filter((item) => {
    if (existingIds.has(item.placeId)) return false;
    existingIds.add(item.placeId);
    return true;
  });
  if (additions.length === 0) return items;

  const last = items[items.length - 1];
  const insertAt = last && isTerminalReturn(last) ? items.length - 1 : items.length;
  return [...items.slice(0, insertAt), ...additions, ...items.slice(insertAt)];
}

export function replaceFirstRouteItem(
  items: RouteItem[],
  replacement: Pick<RouteItem, "placeId"> & Partial<Omit<RouteItem, "placeId" | "uid">>,
  canReplace: (item: RouteItem) => boolean
): RouteItem[] | undefined {
  const index = items.findIndex(canReplace);
  if (index < 0) return undefined;
  if (items.some((item, itemIndex) => itemIndex !== index && item.placeId === replacement.placeId)) return items;
  const next = [...items];
  next[index] = { ...next[index], ...replacement };
  return next;
}

export function removeRouteItem(items: RouteItem[], uid: string): RouteItem[] {
  const target = items.find((item) => item.uid === uid);
  if (!target || target.locked) return items;
  return items.filter((item) => item.uid !== uid);
}

export function moveRouteItem(items: RouteItem[], index: number, direction: -1 | 1): RouteItem[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  if (items[index].locked || items[target].locked) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removePlaceFromRoutes(routes: RouteMap, placeId: string): RouteMap {
  let changed = false;
  const next = Object.fromEntries(
    Object.entries(routes).map(([dayId, items]) => {
      const filtered = items.filter((item) => item.placeId !== placeId);
      if (filtered.length !== items.length) changed = true;
      return [dayId, filtered];
    })
  );
  return changed ? next : routes;
}

export function sanitizeRoutes(value: unknown, isKnownPlace: (placeId: string) => boolean): RouteMap {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([dayId, items]) => {
      if (!dayId.trim() || dayId.startsWith("__")) return [];
      return [
        [
          dayId,
          Array.isArray(items)
            ? items
                .filter(
                  (item): item is RouteItem =>
                    Boolean(
                      item &&
                        typeof item === "object" &&
                        typeof (item as RouteItem).uid === "string" &&
                        typeof (item as RouteItem).placeId === "string" &&
                        isKnownPlace((item as RouteItem).placeId)
                    )
                )
                .map((item) => ({ ...item }))
            : [],
        ],
      ];
    })
  );
}
