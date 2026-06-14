// 데이터 커버리지 점검: 장소 수, enhancement/wikiTitle 보유 현황
import { readFileSync } from "node:fs";

const placeFiles = ["src/data/places/rome.ts", "src/data/places/florence.ts"];
const placesSrc = placeFiles.map((file) => readFileSync(file, "utf8")).join("\n").replace(/\r\n/g, "\n");
const placeArrays = [...placesSrc.matchAll(/export const (?:romePlaces|florencePlaces)[\s\S]*?= \[([\s\S]*?)\n\];/g)].map(
  (match) => match[1]
);
const blocks = placeArrays.flatMap((src) => src.split(/\n  \{\n/).slice(1));
const places = [];
for (const block of blocks) {
  const id = block.match(/id: "([^"]+)"/)?.[1];
  const rank = Number(block.match(/rank: (\d+)/)?.[1] ?? 0);
  const category = block.match(/category: "(\w+)"/)?.[1];
  const city = block.match(/city: "(\w+)"/)?.[1];
  const koName = block.match(/koName: "([^"]+)"/)?.[1];
  if (id) places.push({ id, rank, category, city, koName });
}

const enhSrc = readFileSync("src/placeEnhancements.ts", "utf8").replace(/\r\n/g, "\n");
const enhIds = new Set([...enhSrc.matchAll(/^  "?([\w'-]+)"?: \{/gm)].map((m) => m[1]));
const wikiIds = new Set(
  [...enhSrc.matchAll(/^  "?([\w'-]+)"?: \{[\s\S]{0,260}?wikiTitle/gm)].map((m) => m[1])
);

console.log("total places:", places.length);
const real = places.filter((p) => p.category !== "stay" && p.category !== "station");
console.log("listable (no stay/station):", real.length);
console.log("with enhancement:", real.filter((p) => enhIds.has(p.id)).length);
console.log("with wikiTitle:", real.filter((p) => wikiIds.has(p.id)).length);
console.log("\n--- no enhancement, by rank desc ---");
for (const p of real.filter((p) => !enhIds.has(p.id)).sort((a, b) => b.rank - a.rank)) {
  console.log(`${String(p.rank).padStart(3)} ${p.city?.padEnd(8)} ${p.category?.padEnd(10)} ${p.id}  ${p.koName}`);
}
console.log("\n--- has enhancement but no wikiTitle ---");
for (const p of real.filter((p) => enhIds.has(p.id) && !wikiIds.has(p.id)).sort((a, b) => b.rank - a.rank)) {
  console.log(`${String(p.rank).padStart(3)} ${p.city?.padEnd(8)} ${p.category?.padEnd(10)} ${p.id}  ${p.koName}`);
}
