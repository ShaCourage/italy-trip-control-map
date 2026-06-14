import type { Source } from "../data";

// Core sources for official, transport, and safety references.
export const coreSources: Source[] = [
  {
    id: "turismo-roma",
    label: "Turismo Roma",
    url: "https://www.turismoroma.it/en",
    note: "로마 공식 관광 정보와 권역/명소 확인용.",
  },
  {
    id: "colosseum-official",
    label: "Parco archeologico del Colosseo",
    url: "https://colosseo.it/en/",
    note: "콜로세움, 포로 로마노, 팔라티노 공식 예약 확인용.",
  },
  {
    id: "pantheon-official",
    label: "Pantheon Roma",
    url: "https://www.pantheonroma.com/",
    note: "판테온 입장/예약 확인용.",
  },
  {
    id: "vatican-museums",
    label: "Vatican Museums",
    url: "https://www.museivaticani.va/content/museivaticani/en.html",
    note: "바티칸 박물관 공식 예약 확인용.",
  },
  {
    id: "vatican-official",
    label: "Vatican Basilica",
    url: "https://www.basilicasanpietro.va/en.html",
    note: "성 베드로 대성당 공식 정보 확인용.",
  },
  {
    id: "feelflorence",
    label: "Feel Florence",
    url: "https://www.feelflorence.it/en",
    note: "피렌체 공식 관광 정보 확인용.",
  },
  {
    id: "duomo-official",
    label: "Opera di Santa Maria del Fiore",
    url: "https://duomo.firenze.it/en/home",
    note: "피렌체 두오모 예약/입장 확인용.",
  },
  {
    id: "uffizi-official",
    label: "Uffizi Galleries",
    url: "https://www.uffizi.it/en",
    note: "우피치, 피티, 보볼리 공식 예약 확인용.",
  },
  {
    id: "accademia-official",
    label: "Galleria dell'Accademia di Firenze",
    url: "https://www.galleriaaccademiafirenze.it/en/",
    note: "아카데미아 공식 정보 확인용.",
  },
  {
    id: "state-italy",
    label: "U.S. State Department Italy Travel",
    url: "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Italy.html",
    note: "관광지 절도와 안전 경보 확인용.",
  },
  {
    id: "canada-italy",
    label: "Government of Canada Italy Travel Advice",
    url: "https://travel.gc.ca/destinations/italy",
    note: "소매치기, 역/대중교통 주의사항 교차 확인용.",
  },
  {
    id: "trenitalia",
    label: "Trenitalia",
    url: "https://www.trenitalia.com/en.html",
    note: "로마-피렌체 기차 시간/표 확인용.",
  },
  {
    id: "italo",
    label: "Italo",
    url: "https://www.italotreno.com/en",
    note: "로마-피렌체 기차 대안 확인용.",
  },
  {
    id: "restaurant-official",
    label: "Restaurant official channels",
    url: "https://www.google.com/maps",
    note: "식당 영업시간과 예약은 공식 웹사이트/Google Maps에서 최종 확인.",
  },
];

// Research sources used for place expansion and field guides.
export const researchSources: Source[] = [
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

export const sources: Source[] = [...coreSources, ...researchSources];
