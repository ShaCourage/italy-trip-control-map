import type { City, PlaceCategory } from "./schema";

export const cityLabels: Record<City, string> = {
  rome: "로마",
  florence: "피렌체",
};

export const categoryLabels: Record<PlaceCategory, string> = {
  stay: "숙소",
  station: "역/이동",
  attraction: "명소",
  food: "맛집",
  cafe: "카페",
  shopping: "쇼핑",
  view: "전망",
  rest: "휴식",
};
