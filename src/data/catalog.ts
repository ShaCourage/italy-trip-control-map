import { places as basePlaces, sources as baseSources } from "../data";
import type { Place, Source } from "../data";
import { extraPlaces, extraSources } from "../extraData";
import { morePlaces } from "../morePlaces";
import { sitePlaces } from "../sitePlaces";

export type PlaceDataSetId = "base" | "extra" | "more" | "site";

export const placeDataSets: { id: PlaceDataSetId; label: string; places: Place[] }[] = [
  { id: "base", label: "기본", places: basePlaces },
  { id: "extra", label: "확장", places: extraPlaces },
  { id: "more", label: "대량 수집", places: morePlaces },
  { id: "site", label: "사이트 수집", places: sitePlaces },
];

export const sourceDataSets: { id: "base" | "extra"; label: string; sources: Source[] }[] = [
  { id: "base", label: "기본", sources: baseSources },
  { id: "extra", label: "확장", sources: extraSources },
];

export const rawPlaces = placeDataSets.flatMap((set) => set.places);
export const rawSources = sourceDataSets.flatMap((set) => set.sources);
