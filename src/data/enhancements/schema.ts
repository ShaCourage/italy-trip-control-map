import type { PlaceCategory } from "../schema";

export type PlaceEnhancement = {
  shortLabel?: string;
  /** 원어명을 한국어로 읽을 때의 발음 */
  pronunciation?: string;
  wikiTitle?: string;
  imageUrl?: string;
  imageCredit?: string;
  imageSourceUrl?: string;
  /** 상세 카드용 풀 설명 — 블로그/여행지 평판 리서치 기반 2-4문장 */
  story?: string;
  google?: {
    rating: number;
    reviewCountLabel: string;
    lastChecked?: string; // "YYYY-MM-DD" — 값을 수동 입력/확인한 날짜
    priceLevel?: "무료" | "€" | "€€" | "€€€" | "€€€€";
    crowdLevel?: "낮음" | "보통" | "높음" | "매우 높음";
    visitConfidence?: "검증 강함" | "검증 보통" | "취향 탐";
  };
  highlights?: string[];
  reviewSignals?: string[];
  bestFor?: string[];
};

export const categoryShortLabels: Record<PlaceCategory, string> = {
  stay: "숙소",
  station: "역",
  attraction: "명소",
  food: "맛집",
  cafe: "카페",
  shopping: "쇼핑",
  view: "전망",
  rest: "휴식",
};
