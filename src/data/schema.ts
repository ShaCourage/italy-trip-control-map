export type City = "rome" | "florence";

export type PlaceCategory =
  | "stay"
  | "station"
  | "attraction"
  | "food"
  | "cafe"
  | "shopping"
  | "view"
  | "rest";

export type Priority = 1 | 2 | 3;

export type Place = {
  id: string;
  city: City;
  name: string;
  koName: string;
  category: PlaceCategory;
  area: string;
  lat: number;
  lng: number;
  priority: Priority;
  rank: number;
  durationMin: number;
  reservation: "필수" | "권장" | "불필요" | "확인";
  bestTime: string;
  price: "무료" | "낮음" | "중간" | "높음" | "확인";
  safety: "보통" | "주의" | "밤주의";
  photo: 1 | 2 | 3;
  girlsTripFit: 1 | 2 | 3;
  tags: string[];
  why: string;
  tips: string[];
  koreanTips?: string[];
  menuHints?: string[];
  watchOut?: string[];
  pairWith: string[];
  sourceIds: string[];
};

export type RouteStop = {
  placeId: string;
  time?: string;
  locked?: boolean;
  note?: string;
};

export type TripDay = {
  id: string;
  date: string;
  label: string;
  city: City;
  title: string;
  areaFocus: string;
  route: RouteStop[];
  fallback: string[];
  checklist: string[];
};

export type PhraseGroup = {
  title: string;
  lines: {
    ko: string;
    it: string;
    sound: string;
  }[];
};

export type Source = {
  id: string;
  label: string;
  url: string;
  note: string;
};
