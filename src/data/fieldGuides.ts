import type { PhraseGroup } from "./schema";

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
