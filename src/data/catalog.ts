import { sources as baseSources } from "../data";
import type { Place, Source } from "../data";
import { extraSources } from "../extraData";
import { florencePlaces } from "./places/florence";
import { romePlaces } from "./places/rome";

export type PlaceDataSetId = "rome" | "florence";

export const placeDataSets: { id: PlaceDataSetId; label: string; places: Place[] }[] = [
  { id: "rome", label: "로마", places: romePlaces },
  { id: "florence", label: "피렌체", places: florencePlaces },
];

export const sourceDataSets: { id: "base" | "extra"; label: string; sources: Source[] }[] = [
  { id: "base", label: "기본", sources: baseSources },
  { id: "extra", label: "확장", sources: extraSources },
];

export const rawPlaces = placeDataSets.flatMap((set) => set.places);
export const rawSources = sourceDataSets.flatMap((set) => set.sources);
