// 스크립트가 구운 imageUrl/imageSourceUrl 라인 제거 (재굽기 전 초기화)
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "src/placeEnhancements.ts";
const src = readFileSync(FILE, "utf8");
const cleaned = src
  .split("\n")
  .filter(
    (line) =>
      !/^\s+imageUrl: "https:\/\/upload\.wikimedia\.org/.test(line) &&
      !/^\s+imageSourceUrl: "https:\/\/(en|it)\.wikipedia\.org/.test(line)
  )
  .join("\n");
writeFileSync(FILE, cleaned);
console.log(`removed ${src.split("\n").length - cleaned.split("\n").length} lines`);
