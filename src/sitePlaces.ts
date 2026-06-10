// 참고 사이트에서 수집한 장소를 넣는 자리.
// appCore가 basePlaces/extraPlaces/morePlaces와 함께 병합한다(id 중복 시 나중 항목 우선).
// 항목 형식은 src/data.ts의 Place 타입을 따른다. 출처(sourceIds)는 반드시 채울 것.
import type { Place } from "./data";

export const sitePlaces: Place[] = [];
