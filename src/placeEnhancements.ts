import type { PlaceEnhancement } from "./data/enhancements/schema";
import { florencePlaceEnhancements } from "./data/enhancements/florence";
import { romePlaceEnhancements } from "./data/enhancements/rome";

export type { PlaceEnhancement } from "./data/enhancements/schema";
export { categoryShortLabels } from "./data/enhancements/schema";
export { florencePlaceEnhancements } from "./data/enhancements/florence";
export { romePlaceEnhancements } from "./data/enhancements/rome";

export const placeEnhancements: Record<string, PlaceEnhancement> = {
  ...romePlaceEnhancements,
  ...florencePlaceEnhancements,
};
