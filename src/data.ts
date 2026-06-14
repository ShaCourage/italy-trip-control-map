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

export const tripDays: TripDay[] = [
  {
    id: "2026-06-19",
    date: "2026-06-19",
    label: "6/19 금",
    city: "rome",
    title: "도착 + 중심부 가볍게",
    areaFocus: "숙소 주변, 판테온, 나보나",
    route: [
      { placeId: "rome-hotel", time: "체크인", locked: true },
      { placeId: "pantheon", note: "도착 체력에 따라 내부 또는 외부만" },
      { placeId: "piazza-navona" },
      { placeId: "sant-eustachio", note: "짧은 카페 브레이크" },
      { placeId: "rome-hotel", time: "밤", locked: true },
    ],
    fallback: ["비행 지연이면 판테온/나보나 중 하나만", "저녁은 숙소 근처 검증 식당으로 축소"],
    checklist: ["숙소 주소 실제 위치로 교체", "유심/eSIM 확인", "첫날 밤 도보 복귀 거리 확인"],
  },
  {
    id: "2026-06-20",
    date: "2026-06-20",
    label: "6/20 토",
    city: "rome",
    title: "고대 로마 + 중심부",
    areaFocus: "콜로세움, 포로 로마노, 몬티",
    route: [
      { placeId: "rome-hotel", locked: true },
      { placeId: "colosseum-forum", time: "오전", locked: true },
      { placeId: "caffe-propaganda", note: "체력 회복" },
      { placeId: "trevi-fountain" },
      { placeId: "spanish-steps" },
      { placeId: "rome-hotel", time: "밤", locked: true },
    ],
    fallback: ["콜로세움 뒤 피곤하면 트레비만", "스페인 계단은 다른 중심부 날로 이동 가능"],
    checklist: ["콜로세움 예약 QR", "편한 신발", "물과 선크림"],
  },
  {
    id: "2026-06-21",
    date: "2026-06-21",
    label: "6/21 일",
    city: "rome",
    title: "바티칸 + 트라스테베레",
    areaFocus: "바티칸, 산탄젤로, 트라스테베레",
    route: [
      { placeId: "rome-hotel", locked: true },
      { placeId: "vatican-museums", time: "예약", locked: true },
      { placeId: "st-peters-basilica" },
      { placeId: "castel-sant-angelo" },
      { placeId: "trastevere", time: "저녁" },
      { placeId: "da-enzo", note: "예약/웨이팅에 따라 Trapizzino 대체" },
      { placeId: "rome-hotel", time: "밤", locked: true },
    ],
    fallback: ["바티칸 후 지치면 산탄젤로는 외부만", "트라스테베레 귀가가 부담되면 프라티 저녁으로 교체"],
    checklist: ["바티칸 예약", "성당 복장", "저녁 후 귀가 루트"],
  },
  {
    id: "2026-06-22",
    date: "2026-06-22",
    label: "6/22 월",
    city: "rome",
    title: "중심부 사진 + 맛집",
    areaFocus: "나보나, 판테온, 트레비, 쇼핑",
    route: [
      { placeId: "rome-hotel", locked: true },
      { placeId: "piazza-navona" },
      { placeId: "pantheon" },
      { placeId: "armando-al-pantheon", time: "점심", locked: true },
      { placeId: "giolitti" },
      { placeId: "via-del-corso" },
      { placeId: "villa-borghese", time: "해질녘" },
      { placeId: "rome-hotel", time: "밤", locked: true },
    ],
    fallback: ["맛집 예약 실패 시 Roscioli/근처 후보로 교체", "더우면 쇼핑 대신 카페 휴식"],
    checklist: ["점심 예약 확인", "쇼핑 예산", "소매치기 많은 중심부 대비"],
  },
  {
    id: "2026-06-23",
    date: "2026-06-23",
    label: "6/23 화",
    city: "rome",
    title: "로마 여유일 + 못 간 곳 회수",
    areaFocus: "트라스테베레, 중심부, 테스타치오 선택",
    route: [
      { placeId: "rome-hotel", locked: true },
      { placeId: "campo-de-fiori" },
      { placeId: "roscioli", time: "점심", locked: true },
      { placeId: "trevi-fountain", note: "아침이나 밤 사진 보충" },
      { placeId: "trastevere", time: "저녁 전" },
      { placeId: "trapizzino-trastevere", note: "가볍게 대체 가능" },
      { placeId: "rome-hotel", time: "밤", locked: true },
    ],
    fallback: ["체력 아끼기 모드면 중심부 카페와 쇼핑만", "테스타치오 저녁은 이동 부담이 작을 때만"],
    checklist: ["다음날 기차 시간", "짐 정리", "피렌체 숙소 체크인 시간"],
  },
  {
    id: "2026-06-24",
    date: "2026-06-24",
    label: "6/24 수",
    city: "florence",
    title: "로마에서 피렌체 이동",
    areaFocus: "테르미니, SMN, 아르노 강변",
    route: [
      { placeId: "rome-hotel", time: "체크아웃", locked: true },
      { placeId: "roma-termini", time: "기차", locked: true },
      { placeId: "santa-maria-novella", time: "도착", locked: true },
      { placeId: "florence-hotel", time: "체크인", locked: true },
      { placeId: "ponte-vecchio", time: "해질녘" },
      { placeId: "piazzale-michelangelo", note: "체력과 날씨 보고" },
      { placeId: "florence-hotel", time: "밤", locked: true },
    ],
    fallback: ["도착이 늦으면 베키오 다리만", "캐리어 피로가 크면 미켈란젤로 광장은 다른 날"],
    checklist: ["기차 QR", "플랫폼 확인", "피렌체 숙소 위치 교체"],
  },
  {
    id: "2026-06-25",
    date: "2026-06-25",
    label: "6/25 목",
    city: "florence",
    title: "두오모 + 아카데미아",
    areaFocus: "두오모, 산 로렌초, 레푸블리카",
    route: [
      { placeId: "florence-hotel", locked: true },
      { placeId: "duomo-florence", time: "오전", locked: true },
      { placeId: "accademia", time: "예약", locked: true },
      { placeId: "mercato-centrale", time: "점심" },
      { placeId: "caffe-gilli" },
      { placeId: "officina-profumo" },
      { placeId: "florence-hotel", time: "밤", locked: true },
    ],
    fallback: ["두오모 등반이 힘들면 외부/성당 중심", "아카데미아 예약이 안 맞으면 다음날로 이동"],
    checklist: ["두오모 예약", "아카데미아 예약", "성당 복장"],
  },
  {
    id: "2026-06-26",
    date: "2026-06-26",
    label: "6/26 금",
    city: "florence",
    title: "우피치 + 강변",
    areaFocus: "시뇨리아, 우피치, 베키오 다리",
    route: [
      { placeId: "florence-hotel", locked: true },
      { placeId: "piazza-signoria" },
      { placeId: "uffizi", time: "예약", locked: true },
      { placeId: "gelateria-dei-neri" },
      { placeId: "ponte-vecchio" },
      { placeId: "la-giostra", time: "저녁", locked: true },
      { placeId: "florence-hotel", time: "밤", locked: true },
    ],
    fallback: ["우피치 후 지치면 산타 크로체 제외", "저녁 예약 실패 시 Santo Spirito 권역으로 전환"],
    checklist: ["우피치 예약", "미술관 볼 작품 목록", "저녁 예약"],
  },
  {
    id: "2026-06-27",
    date: "2026-06-27",
    label: "6/27 토",
    city: "florence",
    title: "올트라르노 + 전망",
    areaFocus: "피티, 보볼리, 산토 스피리토, 미켈란젤로 광장",
    route: [
      { placeId: "florence-hotel", locked: true },
      { placeId: "pitti-boboli" },
      { placeId: "osteria-santo-spirito", time: "점심 또는 저녁" },
      { placeId: "piazzale-michelangelo", time: "해질녘" },
      { placeId: "ponte-vecchio", note: "야경 산책" },
      { placeId: "florence-hotel", time: "밤", locked: true },
    ],
    fallback: ["더우면 피티/보볼리 대신 실내와 카페", "비 오면 미켈란젤로 광장 제외"],
    checklist: ["일몰 시간 확인", "귀가 교통", "편한 신발"],
  },
  {
    id: "2026-06-28",
    date: "2026-06-28",
    label: "6/28 일",
    city: "florence",
    title: "출국/이동 전 버퍼",
    areaFocus: "숙소 주변, 역, 못 간 곳 회수",
    route: [
      { placeId: "florence-hotel", locked: true },
      { placeId: "officina-profumo", note: "선물 회수" },
      { placeId: "mercato-centrale", note: "가벼운 식사" },
      { placeId: "santa-maria-novella", time: "이동", locked: true },
    ],
    fallback: ["출발 시간이 빠르면 숙소-역만", "시간이 남으면 두오모 외부 사진 보충"],
    checklist: ["체크아웃 시간", "짐 보관", "공항/다음 도시 이동 루트"],
  },
];

export const phraseGroups: PhraseGroup[] = [
  {
    title: "식당",
    lines: [
      { ko: "예약했어요.", it: "Abbiamo una prenotazione.", sound: "아비아모 우나 프레노타치오네" },
      { ko: "두 명이에요.", it: "Siamo in due.", sound: "시아모 인 두에" },
      { ko: "추천 메뉴가 뭐예요?", it: "Che cosa ci consiglia?", sound: "케 코자 치 콘실리아" },
      { ko: "계산서 주세요.", it: "Il conto, per favore.", sound: "일 콘토, 페르 파보레" },
      { ko: "물은 탄산 없는 걸로 주세요.", it: "Acqua naturale, per favore.", sound: "아쿠아 나투랄레, 페르 파보레" },
    ],
  },
  {
    title: "길찾기",
    lines: [
      { ko: "여기까지 걸어갈 수 있나요?", it: "Possiamo andarci a piedi?", sound: "포시아모 안다르치 아 피에디" },
      { ko: "이 주소로 가 주세요.", it: "A questo indirizzo, per favore.", sound: "아 퀘스토 인디리초, 페르 파보레" },
      { ko: "택시 정류장이 어디예요?", it: "Dov'e la fermata dei taxi?", sound: "도베 라 페르마타 데이 탁시" },
      { ko: "역이 어디예요?", it: "Dov'e la stazione?", sound: "도베 라 스타치오네" },
    ],
  },
  {
    title: "쇼핑/카페",
    lines: [
      { ko: "이거 얼마예요?", it: "Quanto costa?", sound: "콴토 코스타" },
      { ko: "카드 결제 되나요?", it: "Posso pagare con carta?", sound: "포소 파가레 콘 카르타" },
      { ko: "영수증 주세요.", it: "Lo scontrino, per favore.", sound: "로 스콘트리노, 페르 파보레" },
      { ko: "포장해 주세요.", it: "Da portare via, per favore.", sound: "다 포르타레 비아, 페르 파보레" },
    ],
  },
  {
    title: "긴급",
    lines: [
      { ko: "도와주세요.", it: "Mi aiuti, per favore.", sound: "미 아이우티, 페르 파보레" },
      { ko: "경찰을 불러 주세요.", it: "Chiami la polizia, per favore.", sound: "키아미 라 폴리치아, 페르 파보레" },
      { ko: "약국이 필요해요.", it: "Ho bisogno di una farmacia.", sound: "오 비조뇨 디 우나 파르마치아" },
      { ko: "가방을 잃어버렸어요.", it: "Ho perso la borsa.", sound: "오 페르소 라 보르사" },
    ],
  },
];

export const safetyNotes = [
  {
    title: "소매치기 밀도 높은 구간",
    detail: "역, 지하철, 주요 광장, 분수 앞, 박물관 줄, 붐비는 다리에서는 휴대폰과 가방을 몸 앞쪽으로 둔다.",
    severity: "높음",
  },
  {
    title: "밤 이동 기준",
    detail: "밤에는 외진 골목 산책보다 밝은 큰 길, 검증된 택시, 숙소 복귀 버튼을 우선한다.",
    severity: "높음",
  },
  {
    title: "호객/팔찌/사진 접근",
    detail: "무료처럼 접근해도 응대하지 않고 손을 내밀지 않는다. 사진 찍어준다는 제안도 피한다.",
    severity: "중간",
  },
  {
    title: "성당 복장",
    detail: "어깨와 무릎 노출을 줄이고, 얇은 셔츠나 스카프를 챙긴다.",
    severity: "중간",
  },
  {
    title: "식당 체크",
    detail: "광장 바로 앞 식당은 후기, 메뉴판 가격, coperto 포함 여부를 확인한다.",
    severity: "중간",
  },
];

export const packingChecklist = [
  "여권/카드 분산 보관",
  "eSIM 또는 로밍",
  "보조배터리",
  "편한 신발",
  "얇은 셔츠/스카프",
  "지퍼 있는 크로스백",
  "기차/미술관 QR 오프라인 저장",
  "숙소 주소 이탈리아어 캡처",
  "상비약/생리용품",
  "물병과 선크림",
];
