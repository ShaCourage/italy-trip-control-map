import type { Source } from "./data";

export const extraSources: Source[] = [
  {
    id: "timeout-rome",
    label: "Time Out Rome",
    url: "https://www.timeout.com/rome",
    note: "로마 명소, 식당, 젤라또, 동네 후보 교차 확인.",
  },
  {
    id: "lonely-planet-rome",
    label: "Lonely Planet Rome",
    url: "https://www.lonelyplanet.com/destinations/italy/rome",
    note: "로마 대표 명소와 동네/실전 팁 확인.",
  },
  {
    id: "eater-rome",
    label: "Eater Rome 38",
    url: "https://www.eater.com/maps/best-restaurants-rome-italy",
    note: "로마 식당, 피자, 간식, 젤라또 후보 교차 확인.",
  },
  {
    id: "infatuation-rome",
    label: "The Infatuation Rome",
    url: "https://www.theinfatuation.com/rome/guides/best-rome-restaurants",
    note: "로마 식당 분위기와 사용 상황 확인.",
  },
  {
    id: "cntraveler-rome",
    label: "Condé Nast Traveler Rome Restaurants",
    url: "https://www.cntraveler.com/gallery/best-restaurants-in-rome",
    note: "2026년 기준 로마 레스토랑 후보 교차 확인.",
  },
  {
    id: "cntraveler-rome-things",
    label: "Condé Nast Traveler Rome Things To Do",
    url: "https://www.cntraveler.com/gallery/best-things-to-do-in-rome",
    note: "로마 대표 명소와 로컬 추천 동선 교차 확인.",
  },
  {
    id: "katie-parla-rome",
    label: "Katie Parla Rome Food Guide",
    url: "https://katieparla.com/where-to-eat-drink-shop-rome/",
    note: "로마 음식 전문 로컬 가이드 교차 확인.",
  },
  {
    id: "timeout-florence",
    label: "Time Out Florence",
    url: "https://www.timeout.com/florence",
    note: "피렌체 명소, 식당, 카페, 쇼핑 후보 확인.",
  },
  {
    id: "lonely-planet-florence",
    label: "Lonely Planet Florence",
    url: "https://www.lonelyplanet.com/destinations/italy/florence",
    note: "피렌체 명소와 권역 구성 확인.",
  },
  {
    id: "eater-florence",
    label: "Eater Florence 35",
    url: "https://www.eater.com/maps/best-restaurants-florence-italy",
    note: "피렌체 식당과 간단식 후보 확인.",
  },
  {
    id: "cntraveler-florence",
    label: "Condé Nast Traveler Florence Restaurants",
    url: "https://www.cntraveler.com/gallery/best-restaurants-in-florence",
    note: "피렌체 레스토랑 후보 교차 확인.",
  },
  {
    id: "cntraveler-florence-things",
    label: "Condé Nast Traveler Florence Things To Do",
    url: "https://www.cntraveler.com/galleries/2016-07-01/best-things-to-do-in-florence-italy",
    note: "피렌체 명소와 투어/미술관 후보 교차 확인.",
  },
  {
    id: "infatuation-florence",
    label: "The Infatuation Florence",
    url: "https://www.theinfatuation.com/florence/guides/best-restaurants-florence-italy",
    note: "피렌체 식당 분위기와 목적별 후보 확인.",
  },
  {
    id: "girl-in-florence",
    label: "Girl in Florence Food Guide",
    url: "https://girlinflorence.com/2024/01/24/restaurantsnightlife-list/",
    note: "피렌체 로컬 음식/카페/나이트라이프 후보 확인.",
  },
  {
    id: "curious-appetite",
    label: "The Curious Appetite Florence",
    url: "https://thecuriousappetite.com/2024/11/21/best-restaurants-in-florence-italy/",
    note: "피렌체 음식 전문 로컬 가이드 교차 확인.",
  },
  {
    id: "livingetc-florence",
    label: "Livingetc Florence Design Guide",
    url: "https://www.livingetc.com/features/ippolita-rostagnos-guide-to-florence",
    note: "피렌체 디자인, 장인 상점, 로컬 음식 후보 교차 확인.",
  },
  {
    id: "korean-embassy-italy",
    label: "주이탈리아 대한민국 대사관",
    url: "https://it.mofa.go.kr/it-ko/index.do",
    note: "한국인 여행자 긴급 연락처와 영사 정보 확인.",
  },
  {
    id: "adr-fco-taxi",
    label: "Aeroporti di Roma Taxi",
    url: "https://www.adr.it/web/aeroporti-di-roma-en/pax-fco-taxi",
    note: "로마 공항 택시 고정 요금 확인.",
  },
  {
    id: "smartraveller-italy",
    label: "Smartraveller Italy Advice",
    url: "https://www.smartraveller.gov.au/destinations/europe/italy",
    note: "관광지/교통 소매치기와 주의사항 확인.",
  },
];

export const koreanTravelGuides = [
  {
    title: "한국인 2명 여행 운영 원칙",
    items: [
      "하루 Must는 2-3개까지만 고정하고 나머지는 지도에서 근처 후보로 넣는다.",
      "식당 예약은 점심 1개 또는 저녁 1개만 강하게 고정한다. 둘 다 고정하면 현장 피로도가 높다.",
      "두 명 중 한 명이 사진/쇼핑을 좋아하면 중심부 일정마다 카페 1개와 쇼핑 1개를 완충재로 둔다.",
      "숙소 복귀는 밤 9시 이후부터 별도 일정으로 취급한다. 밝은 길, 택시, 지하철 혼잡도를 같이 본다.",
    ],
  },
  {
    title: "한국인 입맛 리셋",
    items: [
      "파스타가 이어지면 다음 끼니는 피자, 샌드위치, 시장, 브런치로 바꾼다.",
      "짜게 느껴질 수 있으니 물을 충분히 주문하고, 둘이 여러 메뉴를 나눠서 간을 분산한다.",
      "스테이크는 레어가 기본인 경우가 많다. 완전 익힘을 기대하면 주문 전에 굽기 표현을 준비한다.",
      "젤라또는 하루 1-2회까지도 여행 리듬상 괜찮지만 식사 직전에는 작은 사이즈로 간다.",
    ],
  },
  {
    title: "쇼핑/택스리펀",
    items: [
      "명품/화장품/가죽 쇼핑 후보는 지도에 미리 찍고, 여권 원본 필요 여부는 매장별로 확인한다.",
      "택스리펀 서류는 결제 직후 바로 사진으로 저장한다.",
      "쇼핑백은 여러 개 들고 밤 이동하지 않는다. 숙소 들렀다 나오는 루트를 우선한다.",
      "가격 비교가 필요한 품목은 한국 가격 캡처를 미리 저장해둔다.",
    ],
  },
  {
    title: "여자 둘 안전 루틴",
    items: [
      "역, 광장, 분수, 박물관 줄에서는 휴대폰을 손에 오래 들고 있지 않는다.",
      "길을 볼 때는 한 명이 지도, 한 명이 주변을 본다.",
      "사진 찍어준다는 접근, 팔찌, 서명, 장미, 무료 선물은 응대하지 않는다.",
      "밤에 분위기가 애매하면 걷기보다 택시 앱/택시 승강장을 우선한다.",
    ],
  },
];

export const foodOrderGuides = [
  {
    city: "로마",
    title: "로마에서 먹어볼 것",
    items: [
      "Carbonara: 크림이 아니라 달걀, 치즈, 후추, guanciale 기반. 짠맛이 강할 수 있다.",
      "Cacio e pepe: 치즈와 후추 중심이라 둘이 나눠 먹기 좋다.",
      "Amatriciana: 토마토와 guanciale가 들어가 한국인 입맛에 비교적 편하다.",
      "Suppli: 튀긴 주먹밥 느낌의 간식. 식사 사이에 좋다.",
      "Maritozzo: 크림빵 계열. 아침이나 카페 간식으로 좋다.",
    ],
  },
  {
    city: "피렌체",
    title: "피렌체에서 먹어볼 것",
    items: [
      "Bistecca alla Fiorentina: 양이 크고 레어가 기본. 둘이 하나를 나누는 전략이 좋다.",
      "Pappardelle al cinghiale: 멧돼지 라구 파스타. 진한 라구 좋아하면 만족도 높다.",
      "Ribollita: 채소/빵 수프. 무거운 고기 식사 사이에 좋다.",
      "Lampredotto: 내장 샌드위치. 호불호가 있어 둘이 하나만 맛보기 추천.",
      "Schiacciata: 피렌체식 납작빵 샌드위치. 일정 빡빡한 날 점심 대체로 좋다.",
    ],
  },
  {
    city: "공통",
    title: "주문 전에 확인",
    items: [
      "Coperto: 자리세/커버차지가 붙을 수 있다.",
      "Acqua naturale: 탄산 없는 물. Acqua frizzante는 탄산수.",
      "카푸치노는 보통 오전 이미지가 강하지만 관광객이라고 큰 문제는 아니다.",
      "테이블에 앉으면 서서 마시는 커피보다 가격이 높을 수 있다.",
      "영업시간은 구글맵과 공식 채널을 당일 한 번 더 확인한다.",
    ],
  },
];
