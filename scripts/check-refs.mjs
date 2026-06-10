// 데이터 참조 무결성 검사 — 템플릿 placeId / pairWith가 병합 장소 집합에 존재하는지.
// 사용: node scripts/check-refs.mjs  (깨진 참조 있으면 exit 1)
import { readFileSync } from "node:fs";

const placeFiles = ["src/data.ts", "src/extraData.ts", "src/morePlaces.ts"];
const refFiles = ["src/data.ts", "src/extraData.ts", "src/morePlaces.ts", "src/templates.ts"];

const ids = new Set();
for (const file of placeFiles) {
  const src = readFileSync(file, "utf8");
  for (const match of src.matchAll(/\bid: "([^"]+)"/g)) ids.add(match[1]);
}

let broken = 0;
for (const file of refFiles) {
  const src = readFileSync(file, "utf8");
  for (const match of src.matchAll(/placeId: "([^"]+)"/g)) {
    if (!ids.has(match[1])) {
      console.log(`MISSING placeId  ${file}  ${match[1]}`);
      broken += 1;
    }
  }
  for (const match of src.matchAll(/pairWith: \[([^\]]*)\]/g)) {
    for (const ref of match[1].matchAll(/"([^"]+)"/g)) {
      if (!ids.has(ref[1])) {
        console.log(`MISSING pairWith ${file}  ${ref[1]}`);
        broken += 1;
      }
    }
  }
}

console.log(broken ? `\n${broken} broken reference(s)` : `OK — all placeId/pairWith references resolve (${ids.size} ids)`);
process.exit(broken ? 1 : 0);
