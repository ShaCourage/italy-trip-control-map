import type { Place, Source } from "./schema";
import { florencePlaces } from "./places/florence";
import { romePlaces } from "./places/rome";
import { coreSources, researchSources } from "./sources";

export type PlaceDataSetId = "rome" | "florence";

export const placeDataSets: { id: PlaceDataSetId; label: string; places: Place[] }[] = [
  { id: "rome", label: "로마", places: romePlaces },
  { id: "florence", label: "피렌체", places: florencePlaces },
];

export const sourceDataSets: { id: "core" | "research"; label: string; sources: Source[] }[] = [
  { id: "core", label: "공식·교통·안전", sources: coreSources },
  { id: "research", label: "장소 리서치", sources: researchSources },
];

export const rawPlaces = placeDataSets.flatMap((set) => set.places);
export const rawSources = sourceDataSets.flatMap((set) => set.sources);
