import type { PlaceCategory } from "./data";

export type PlaceEnhancement = {
  shortLabel?: string;
  wikiTitle?: string;
  imageUrl?: string;
  imageCredit?: string;
  imageSourceUrl?: string;
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

export const placeEnhancements: Record<string, PlaceEnhancement> = {
  "colosseum-forum": {
    shortLabel: "콜로세움",
    wikiTitle: "Colosseum",
    google: { lastChecked: "2026-06-10", rating: 4.7, reviewCountLabel: "40만+", priceLevel: "€€", crowdLevel: "매우 높음", visitConfidence: "검증 강함" },
    highlights: ["고대 로마 대표", "예약 필수", "반나절 코스"],
    reviewSignals: ["사진 만족도 높음", "입장 줄/보안검색 변수", "한낮 더위 피하기"],
    bestFor: ["첫 로마", "역사", "사진"],
  },
  pantheon: {
    shortLabel: "판테온",
    wikiTitle: "Pantheon, Rome",
    google: { lastChecked: "2026-06-10", rating: 4.8, reviewCountLabel: "25만+", priceLevel: "€", crowdLevel: "매우 높음", visitConfidence: "검증 강함" },
    highlights: ["중심부 루트 허브", "실내 대체 가능", "짧고 강한 코스"],
    reviewSignals: ["광장 혼잡", "비 오는 날 만족도 높음", "나보나/트레비와 묶기 좋음"],
    bestFor: ["중심부", "비 오는 날", "짧은 관람"],
  },
  "trevi-fountain": {
    shortLabel: "트레비",
    wikiTitle: "Trevi Fountain",
    google: { lastChecked: "2026-06-10", rating: 4.8, reviewCountLabel: "40만+", priceLevel: "무료", crowdLevel: "매우 높음", visitConfidence: "검증 강함" },
    highlights: ["사진 스팟", "무료", "짧은 체류"],
    reviewSignals: ["혼잡도 매우 높음", "아침 일찍 추천", "소매치기 주의"],
    bestFor: ["사진", "야경", "중심부 산책"],
  },
  "spanish-steps": {
    shortLabel: "스페인",
    wikiTitle: "Spanish Steps",
    google: { lastChecked: "2026-06-10", rating: 4.5, reviewCountLabel: "8만+", priceLevel: "무료", crowdLevel: "높음", visitConfidence: "검증 보통" },
    highlights: ["쇼핑 동선", "사진 스팟", "중심부 산책"],
    reviewSignals: ["계단 착석 금지", "쇼핑백 관리", "트레비와 도보 연결"],
    bestFor: ["쇼핑", "사진", "저녁 산책"],
  },
  "piazza-navona": {
    shortLabel: "나보나",
    wikiTitle: "Piazza Navona",
    google: { lastChecked: "2026-06-10", rating: 4.7, reviewCountLabel: "18만+", priceLevel: "무료", crowdLevel: "높음", visitConfidence: "검증 강함" },
    highlights: ["광장 산책", "해질녘", "판테온 근처"],
    reviewSignals: ["광장 앞 식당 가격 확인", "사진 찍기 좋음", "소매치기 주의"],
    bestFor: ["해질녘", "중심부", "카페"],
  },
  "vatican-museums": {
    shortLabel: "바티칸",
    wikiTitle: "Vatican Museums",
    google: { lastChecked: "2026-06-10", rating: 4.6, reviewCountLabel: "18만+", priceLevel: "€€€", crowdLevel: "매우 높음", visitConfidence: "검증 강함" },
    highlights: ["예약 필수", "시스티나 성당", "반나절 이상"],
    reviewSignals: ["입장 시간 엄격", "체력 소모 큼", "대표 작품 우선순위 필요"],
    bestFor: ["미술", "실내", "고정 일정"],
  },
  "st-peters-basilica": {
    shortLabel: "성베드로",
    wikiTitle: "St. Peter's Basilica",
    google: { lastChecked: "2026-06-10", rating: 4.8, reviewCountLabel: "15만+", priceLevel: "무료", crowdLevel: "매우 높음", visitConfidence: "검증 강함" },
    highlights: ["복장 체크", "바티칸 핵심", "사진 스팟"],
    reviewSignals: ["줄 길 수 있음", "성당 복장 필요", "호객 투어 주의"],
    bestFor: ["성당", "바티칸", "사진"],
  },
  "castel-sant-angelo": {
    shortLabel: "산탄젤로",
    wikiTitle: "Castel Sant'Angelo",
    google: { lastChecked: "2026-06-10", rating: 4.7, reviewCountLabel: "9만+", priceLevel: "€€", crowdLevel: "높음", visitConfidence: "검증 보통" },
    highlights: ["전망", "강변 산책", "바티칸 근처"],
    reviewSignals: ["해질녘 만족도 높음", "체력 남을 때 내부", "다리 사진 좋음"],
    bestFor: ["전망", "해질녘", "강변"],
  },
  trastevere: {
    shortLabel: "트라스테베레",
    wikiTitle: "Trastevere",
    google: { lastChecked: "2026-06-10", rating: 4.6, reviewCountLabel: "권역 리뷰 다수", priceLevel: "€€", crowdLevel: "높음", visitConfidence: "검증 강함" },
    highlights: ["저녁 분위기", "맛집 권역", "골목 사진"],
    reviewSignals: ["밤 귀가 경로 확인", "예약 식당 기준으로 걷기", "외진 골목 주의"],
    bestFor: ["저녁", "분위기", "맛집"],
  },
  "villa-borghese": {
    shortLabel: "보르게세",
    wikiTitle: "Villa Borghese gardens",
    google: { lastChecked: "2026-06-10", rating: 4.6, reviewCountLabel: "8만+", priceLevel: "무료", crowdLevel: "보통", visitConfidence: "검증 보통" },
    highlights: ["공원", "핀초 전망", "휴식"],
    reviewSignals: ["해질녘 좋음", "어두워지면 큰길", "스페인 계단과 연결"],
    bestFor: ["휴식", "전망", "산책"],
  },
  "borghese-gallery": {
    shortLabel: "보르게세",
    wikiTitle: "Galleria Borghese",
    google: { lastChecked: "2026-06-10", rating: 4.6, reviewCountLabel: "2만+", priceLevel: "€€€", crowdLevel: "높음", visitConfidence: "검증 강함" },
    highlights: ["예약 필수", "실내 미술관", "공원과 묶기"],
    reviewSignals: ["입장 시간 엄격", "작품 밀도 높음", "바티칸과 같은 날은 과함"],
    bestFor: ["미술", "비 오는 날", "체력 아낌"],
  },
  "campo-de-fiori": {
    shortLabel: "캄포",
    wikiTitle: "Campo de' Fiori",
    highlights: ["시장", "중심부 연결", "짧은 산책"],
    reviewSignals: ["오전 시장", "밤 분위기 확인", "식당은 후기 확인"],
    bestFor: ["시장", "나보나 근처", "간식"],
  },
  "piazza-del-popolo": {
    shortLabel: "포폴로",
    wikiTitle: "Piazza del Popolo",
    highlights: ["광장", "핀초 언덕", "쇼핑 연결"],
    reviewSignals: ["넓어서 사진 편함", "공연 주변 소지품 주의", "스페인 계단과 연결"],
    bestFor: ["사진", "산책", "전망"],
  },
  "capitoline-museums": {
    shortLabel: "카피톨리니",
    wikiTitle: "Capitoline Museums",
    highlights: ["실내", "고대 로마", "비 오는 날"],
    reviewSignals: ["콜로세움 뒤 대체", "관람 피로 관리", "베네치아 광장과 연결"],
    bestFor: ["비", "역사", "실내"],
  },
  "altare-patria": {
    shortLabel: "기념관",
    wikiTitle: "Victor Emmanuel II Monument",
    highlights: ["전망", "중심부", "사진"],
    reviewSignals: ["광장 횡단 주의", "전망대 여부 확인", "콜로세움 전후 연결"],
    bestFor: ["전망", "사진", "중심부"],
  },
  "santa-maria-maggiore": {
    shortLabel: "마조레",
    wikiTitle: "Santa Maria Maggiore",
    highlights: ["역 근처", "성당", "실내"],
    reviewSignals: ["복장 체크", "기차 전후 시간 활용", "역 주변 소지품 주의"],
    bestFor: ["기차 전후", "성당", "실내"],
  },
  "baths-caracalla": {
    shortLabel: "카라칼라",
    wikiTitle: "Baths of Caracalla",
    highlights: ["고대 유적", "덜 붐빔", "사진"],
    reviewSignals: ["그늘 적음", "한낮 피하기", "대중교통 확인"],
    bestFor: ["유적", "사진", "한적함"],
  },
  "orange-garden": {
    shortLabel: "오렌지",
    wikiTitle: "Giardino degli Aranci",
    highlights: ["전망", "무료", "휴식"],
    reviewSignals: ["해질녘 좋음", "밤 늦게 오래 머물지 않기", "테베레섬과 연결"],
    bestFor: ["전망", "휴식", "사진"],
  },
  "duomo-florence": {
    shortLabel: "두오모",
    wikiTitle: "Florence Cathedral",
    google: { lastChecked: "2026-06-10", rating: 4.8, reviewCountLabel: "10만+", priceLevel: "€€", crowdLevel: "매우 높음", visitConfidence: "검증 강함" },
    highlights: ["피렌체 핵심", "예약", "쿠폴라/종탑"],
    reviewSignals: ["쿠폴라 체력 소모", "복장 체크", "광장 혼잡"],
    bestFor: ["첫 피렌체", "사진", "랜드마크"],
  },
  uffizi: {
    shortLabel: "우피치",
    wikiTitle: "Uffizi",
    google: { lastChecked: "2026-06-10", rating: 4.7, reviewCountLabel: "8만+", priceLevel: "€€€", crowdLevel: "매우 높음", visitConfidence: "검증 강함" },
    highlights: ["예약 필수", "핵심 미술관", "반나절"],
    reviewSignals: ["대표 작품 위주", "관람 후 휴식 필요", "가방 규정 확인"],
    bestFor: ["미술", "실내", "고정 일정"],
  },
  accademia: {
    shortLabel: "아카데미아",
    wikiTitle: "Galleria dell'Accademia",
    google: { lastChecked: "2026-06-10", rating: 4.6, reviewCountLabel: "4만+", priceLevel: "€€", crowdLevel: "높음", visitConfidence: "검증 강함" },
    highlights: ["다비드", "예약", "짧고 강함"],
    reviewSignals: ["예약 시간 중요", "두오모와 묶기", "짧게 보기 좋음"],
    bestFor: ["다비드", "미술", "두오모 권역"],
  },
  "ponte-vecchio": {
    shortLabel: "베키오",
    wikiTitle: "Ponte Vecchio",
    google: { lastChecked: "2026-06-10", rating: 4.7, reviewCountLabel: "14만+", priceLevel: "무료", crowdLevel: "매우 높음", visitConfidence: "검증 강함" },
    highlights: ["강변", "해질녘", "무료"],
    reviewSignals: ["다리 위 혼잡", "강변 사진 추천", "올트라르노 연결"],
    bestFor: ["산책", "사진", "해질녘"],
  },
  "piazza-signoria": {
    shortLabel: "시뇨리아",
    wikiTitle: "Piazza della Signoria",
    google: { lastChecked: "2026-06-10", rating: 4.8, reviewCountLabel: "8만+", priceLevel: "무료", crowdLevel: "높음", visitConfidence: "검증 강함" },
    highlights: ["광장", "우피치 근처", "야외 조각"],
    reviewSignals: ["광장 카페 가격 확인", "소지품 주의", "우피치 전후에 좋음"],
    bestFor: ["우피치", "광장", "사진"],
  },
  "piazzale-michelangelo": {
    shortLabel: "미켈란젤로",
    wikiTitle: "Piazzale Michelangelo",
    google: { lastChecked: "2026-06-10", rating: 4.8, reviewCountLabel: "10만+", priceLevel: "무료", crowdLevel: "매우 높음", visitConfidence: "검증 강함" },
    highlights: ["피렌체 전망", "해질녘", "사진"],
    reviewSignals: ["오르막", "해진 뒤 복귀 경로", "버스/택시 고려"],
    bestFor: ["전망", "사진", "해질녘"],
  },
  "pitti-boboli": {
    shortLabel: "피티",
    wikiTitle: "Pitti Palace",
    highlights: ["궁전", "정원", "올트라르노"],
    reviewSignals: ["더운 한낮 피하기", "체력 소모", "보볼리와 시간 관리"],
    bestFor: ["정원", "궁전", "올트라르노"],
  },
  "santa-croce": {
    shortLabel: "산타크로체",
    wikiTitle: "Basilica of Santa Croce, Florence",
    highlights: ["성당", "실내", "산타 크로체 권역"],
    reviewSignals: ["복장 체크", "우피치 후 체력 확인", "젤라또와 묶기"],
    bestFor: ["성당", "비", "동쪽 권역"],
  },
  "mercato-centrale": {
    shortLabel: "중앙시장",
    wikiTitle: "Mercato Centrale (Florence)",
    google: { lastChecked: "2026-06-10", rating: 4.4, reviewCountLabel: "5만+", priceLevel: "€€", crowdLevel: "높음", visitConfidence: "검증 보통" },
    highlights: ["푸드홀", "역 근처", "비상식사"],
    reviewSignals: ["자리 확보 먼저", "혼잡 소지품 주의", "예약 실패 대안"],
    bestFor: ["점심", "가성비", "비상식사"],
  },
  "bargello": {
    shortLabel: "바르젤로",
    wikiTitle: "Bargello",
    highlights: ["조각", "실내", "비 오는 날"],
    reviewSignals: ["미술관 피로 관리", "우피치 다음 단계", "짧게 보기 가능"],
    bestFor: ["미술", "비", "조각"],
  },
  "medici-chapels": {
    shortLabel: "메디치",
    wikiTitle: "Medici Chapel",
    highlights: ["메디치", "실내", "중앙시장 근처"],
    reviewSignals: ["두오모 권역과 묶기", "운영시간 확인", "역사 취향이면 좋음"],
    bestFor: ["역사", "실내", "두오모"],
  },
  "santa-maria-novella-basilica": {
    shortLabel: "SMN성당",
    wikiTitle: "Santa Maria Novella",
    highlights: ["역 근처", "성당", "SMN 약국"],
    reviewSignals: ["기차 전후 좋음", "복장 체크", "역 주변 소지품 주의"],
    bestFor: ["도착일", "출발일", "성당"],
  },
  "san-miniato-al-monte": {
    shortLabel: "산미니아토",
    wikiTitle: "San Miniato al Monte",
    highlights: ["전망", "성당", "조용함"],
    reviewSignals: ["오르막", "해진 뒤 복귀", "미켈란젤로와 묶기"],
    bestFor: ["전망", "성당", "사진"],
  },
  "bardini-garden": {
    shortLabel: "바르디니",
    wikiTitle: "Giardino Bardini",
    highlights: ["정원", "전망", "사진"],
    reviewSignals: ["날씨 영향", "오르막", "보볼리보다 작고 집중형"],
    bestFor: ["사진", "정원", "올트라르노"],
  },
  "trattoria-sostanza": {
    shortLabel: "Sostanza",
    google: { lastChecked: "2026-06-10", rating: 4.5, reviewCountLabel: "2천+", priceLevel: "€€€", crowdLevel: "높음", visitConfidence: "검증 강함" },
    highlights: ["예약 필수", "버터치킨", "피렌체 클래식"],
    reviewSignals: ["한국인 입맛 가능성 높음", "예약 난도", "가격대 확인"],
    bestFor: ["저녁", "클래식", "둘이 식사"],
  },
  "bonci-pizzarium": {
    shortLabel: "Bonci",
    google: { lastChecked: "2026-06-10", rating: 4.3, reviewCountLabel: "8천+", priceLevel: "€€", crowdLevel: "높음", visitConfidence: "검증 보통" },
    highlights: ["바티칸 근처", "피자 al taglio", "간단식"],
    reviewSignals: ["무게 계산", "웨이팅 가능", "좌석 기대 낮추기"],
    bestFor: ["바티칸", "간단 점심", "피자"],
  },
  "vini-e-vecchi-sapori": {
    shortLabel: "Vini",
    google: { lastChecked: "2026-06-10", rating: 4.6, reviewCountLabel: "1천+", priceLevel: "€€", crowdLevel: "높음", visitConfidence: "검증 강함" },
    highlights: ["시뇨리아", "예약", "전통식"],
    reviewSignals: ["우피치 후 동선 좋음", "예약 난도", "메뉴 가격 확인"],
    bestFor: ["저녁", "우피치", "전통식"],
  },
  "all-antico-vinaio": {
    shortLabel: "Vinaio",
    google: { lastChecked: "2026-06-10", rating: 4.5, reviewCountLabel: "4만+", priceLevel: "€", crowdLevel: "매우 높음", visitConfidence: "검증 보통" },
    highlights: ["샌드위치", "유명", "간단식"],
    reviewSignals: ["줄 길면 스킵", "먹을 장소 생각", "간단 점심 대체"],
    bestFor: ["간식", "빠른 점심", "우피치 근처"],
  },
  "la-menagere": {
    shortLabel: "Menagere",
    google: { lastChecked: "2026-06-10", rating: 4.3, reviewCountLabel: "8천+", priceLevel: "€€", crowdLevel: "높음", visitConfidence: "검증 보통" },
    highlights: ["브런치", "사진", "카페"],
    reviewSignals: ["피크 시간 혼잡", "두오모 전후", "한국 카페 감성"],
    bestFor: ["휴식", "브런치", "사진"],
  },
  "bocca-della-verita": {
    shortLabel: "진실의입",
    wikiTitle: "Bocca della Verità",
    highlights: ["로마의 휴일", "인증샷", "아벤티노 묶음"],
    bestFor: ["사진", "영화 따라가기", "짧은 코스"],
  },
  "sant-ignazio": {
    shortLabel: "산티냐치오",
    wikiTitle: "Sant'Ignazio, Rome",
    highlights: ["가짜 돔 천장화", "무료", "판테온 3분"],
    bestFor: ["비 오는 날", "사진", "중심부"],
  },
  "galleria-sciarra": {
    shortLabel: "시아라",
    wikiTitle: "Galleria Sciarra",
    highlights: ["숨은 아르누보 중정", "트레비 2분", "한적"],
    bestFor: ["사진", "숨은 스팟"],
  },
  "via-margutta": {
    shortLabel: "마르구타",
    wikiTitle: "Via Margutta",
    highlights: ["예술가 골목", "로마의 휴일", "조용한 산책"],
    bestFor: ["사진", "산책", "한적함"],
  },
  "aventine-keyhole": {
    shortLabel: "열쇠구멍",
    wikiTitle: "Villa del Priorato di Malta",
    highlights: ["열쇠구멍 너머 성 베드로 돔", "무료", "오렌지 정원 3분"],
    bestFor: ["숨은 스팟", "아벤티노 묶음"],
  },
  "pincio-terrace": {
    shortLabel: "핀초",
    wikiTitle: "Pincian Hill",
    highlights: ["로마 대표 일몰", "무료", "포폴로 광장 위"],
    bestFor: ["해질녘", "사진", "산책"],
  },
  tonnarello: {
    shortLabel: "Tonnarello",
    highlights: ["트라스테베레 인기 1순위", "회전 빠름", "한국인 단골"],
    bestFor: ["저녁", "파스타", "첫 트라스테베레"],
  },
  "osteria-da-fortunata": {
    shortLabel: "Fortunata",
    highlights: ["창가 수타 파스타 시연", "본점 Via del Pellegrino", "캄포 옆"],
    bestFor: ["점심", "파스타", "구경하는 재미"],
  },
  "cantina-e-cucina": {
    shortLabel: "Cantina",
    highlights: ["한국인 리뷰 다수", "친절", "나보나 근처"],
    bestFor: ["첫 끼", "저녁", "무난한 선택"],
  },
  "pompi-tiramisu": {
    shortLabel: "Pompi",
    highlights: ["로마 티라미수 대명사", "테이크아웃", "쇼핑 동선"],
    bestFor: ["간식", "당 충전", "쇼핑 중"],
  },
  "two-sizes-tiramisu": {
    shortLabel: "TwoSizes",
    highlights: ["컵 티라미수", "가성비", "나보나 산책"],
    bestFor: ["간식", "비교 시식"],
  },
  "da-francesco": {
    shortLabel: "DaFrancesco",
    highlights: ["화덕 피자", "현지 손님 비중", "피코 광장"],
    bestFor: ["저녁", "피자", "나보나 근처"],
  },
  "trattoria-mario": {
    shortLabel: "Mario",
    highlights: ["1953년 점심 전용", "비스테카 가성비", "예약 불가 오픈런"],
    bestFor: ["점심", "스테이크", "현지 분위기"],
  },
  "trattoria-zaza": {
    shortLabel: "ZaZa",
    highlights: ["중앙시장 광장", "메뉴 폭 넓음", "저녁 예약 필수"],
    bestFor: ["저녁", "스테이크", "단체/테라스"],
  },
  "golden-view": {
    shortLabel: "GoldenView",
    highlights: ["베키오 다리 뷰", "마지막 밤 후보", "창가 예약"],
    bestFor: ["기념 저녁", "뷰", "해질녘"],
  },
  "san-lorenzo-market": {
    shortLabel: "가죽시장",
    highlights: ["노점 가죽시장", "흥정 기본", "기념품"],
    bestFor: ["쇼핑", "기념품", "시장 구경"],
  },
  "palazzo-vecchio": {
    shortLabel: "베키오궁",
    wikiTitle: "Palazzo Vecchio",
    highlights: ["아르놀포 탑 전망", "두오모 뷰", "야간 개장 변수"],
    bestFor: ["전망", "역사", "쿠폴라 대안"],
  },
  "edoardo-gelato": {
    shortLabel: "Edoardo",
    highlights: ["유기농 젤라또", "수제 콘", "두오모 앞"],
    bestFor: ["간식", "두오모 전후"],
  },
  fiesole: {
    shortLabel: "피에솔레",
    wikiTitle: "Fiesole",
    highlights: ["버스 25분 근교", "피렌체 전경", "반나절"],
    bestFor: ["전망", "한적함", "여유일"],
  },
};
