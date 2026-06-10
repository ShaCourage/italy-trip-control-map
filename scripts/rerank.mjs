// 한국 여행 블로그/가이드 평판 기준 인기점수 보정 (2026-06 리서치)
import { readFileSync, writeFileSync } from "node:fs";

const adjustments = {
  giolitti: 80, // 로마 3대 젤라또, 한국인 필수
  nerbone: 78, // 중앙시장 곱창버거(람프레도토) — 한국 필수 코스
  "all-antico-vinaio": 82, // 세계적 파니니 줄맛집
  vivoli: 74, // 피렌체 최고(最古) 젤라테리아
  "sant-eustachio": 76, // 로마 대표 카페
  "tazza-doro": 72,
  "antico-caffe-greco": 70, // 1760년, 스페인 계단 옆
  "trattoria-zaza": 81, // 한국인 티본 단골
  "perche-no": 73,
  "gelateria-la-carraia": 74,
  frigidarium: 75, // 나보나 옆 인기 젤라또
  "pompi-tiramisu": 79, // 로마 티라미수 대표
};

for (const file of ["src/data.ts", "src/extraData.ts"]) {
  let src = readFileSync(file, "utf8");
  let count = 0;
  for (const [id, rank] of Object.entries(adjustments)) {
    const pattern = new RegExp(`(id: "${id}",[\\s\\S]{0,400}?rank: )(\\d+)`);
    if (pattern.test(src)) {
      src = src.replace(pattern, (_, head, old) => {
        if (Number(old) !== rank) count += 1;
        return `${head}${rank}`;
      });
    }
  }
  writeFileSync(file, src);
  console.log(`${file}: ${count} ranks updated`);
}
