import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = fileURLToPath(new URL("../src", import.meta.url));
const stalePhrases = [
  { text: "지도나 랭킹", replacement: "지도나 장소 탭" },
  { text: "지도 핀, 랭킹", replacement: "지도 핀, 장소 탭" },
  { text: "랭킹 탭", replacement: "장소 탭" },
  { text: "랭킹에서 장소", replacement: "장소 탭에서 장소" },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (/\.[jt]sx?$/.test(path)) {
      yield path;
    }
  }
}

const failures = [];

for (const file of walk(sourceRoot)) {
  const content = readFileSync(file, "utf8");
  for (const phrase of stalePhrases) {
    if (content.includes(phrase.text)) {
      failures.push({
        file: relative(process.cwd(), file),
        ...phrase,
      });
    }
  }
}

if (failures.length) {
  console.error("Stale UI copy found:");
  for (const failure of failures) {
    console.error(`- ${failure.file}: "${failure.text}" -> "${failure.replacement}"`);
  }
  process.exit(1);
}

console.log("OK - UI copy labels");
