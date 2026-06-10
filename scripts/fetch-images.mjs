// wikiTitle → Wikipedia REST 썸네일 URL을 placeEnhancements.ts에 굽는 스크립트
// 사용: node scripts/fetch-images.mjs          (드라이런 — 결과만 출력)
//       node scripts/fetch-images.mjs --apply  (imageUrl/imageSourceUrl 주입)
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "src/placeEnhancements.ts";
const APPLY = process.argv.includes("--apply");

// 요약 페이지 이미지가 사진이 아니라 문장(紋章)·로고인 경우 대체 문서로 교체
const titleOverrides = {
  "vatican-museums": "Sistine Chapel",
  "medici-chapels": "Medici Chapels",
  "basilica-san-clemente": "Basilica of San Clemente",
  "fassi-gelato": "Palazzo del Freddo Giovanni Fassi",
};

const src = readFileSync(FILE, "utf8");
const entryPattern = /^  ("?)([\w'-]+)\1: \{([\s\S]*?)^  \},/gm;
const targets = [];
for (const match of src.matchAll(entryPattern)) {
  const [, , id, body] = match;
  const wikiTitle = body.match(/wikiTitle: "([^"]+)"/)?.[1];
  const hasImage = /imageUrl:/.test(body);
  if (wikiTitle && !hasImage) targets.push({ id, title: titleOverrides[id] ?? wikiTitle });
}

console.log(`targets: ${targets.length}`);

async function fetchSummary(lang, title, attempt = 0) {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(url, { headers: { "user-agent": "italy-trip-map/1.0 (personal travel app)" } });
  if (response.status === 429 || response.status === 403) {
    if (attempt >= 3) return undefined;
    await new Promise((resolve) => setTimeout(resolve, 2500 * (attempt + 1)));
    return fetchSummary(lang, title, attempt + 1);
  }
  if (!response.ok) return undefined;
  return response.json();
}

function upscale(url) {
  // REST가 주는 크기 그대로 사용 — 임의 px 버킷(320/640/800/1024)은
  // 위키미디어가 400으로 차단하는 것을 확인함 (2026-06)
  return url;
}

const results = [];
for (const target of targets) {
  let data = await fetchSummary("en", target.title);
  let lang = "en";
  if (!data?.thumbnail) {
    data = await fetchSummary("it", target.title);
    lang = "it";
  }
  const image = data?.thumbnail?.source ? upscale(data.thumbnail.source) : undefined;
  results.push({
    id: target.id,
    title: target.title,
    lang,
    image,
    page: data?.content_urls?.desktop?.page,
    desc: (data?.description ?? data?.extract ?? "").slice(0, 70),
  });
  await new Promise((resolve) => setTimeout(resolve, 450));
}

for (const r of results) {
  console.log(`${r.image ? "OK " : "MISS"} ${r.id.padEnd(28)} [${r.lang}] ${r.title} — ${r.desc}`);
}

if (APPLY) {
  let updated = src;
  let count = 0;
  for (const r of results) {
    if (!r.image) continue;
    const keyToken = `  ${/[^\w]/.test(r.id) || r.id.includes("-") ? `"${r.id}"` : r.id}: {`;
    const index = updated.indexOf(keyToken);
    if (index === -1) continue;
    const lineEnd = updated.indexOf("\n", index);
    const injection = `    imageUrl: ${JSON.stringify(r.image)},\n${r.page ? `    imageSourceUrl: ${JSON.stringify(r.page)},\n` : ""}`;
    updated = updated.slice(0, lineEnd + 1) + injection + updated.slice(lineEnd + 1);
    count += 1;
  }
  writeFileSync(FILE, updated);
  console.log(`\napplied imageUrl to ${count} entries`);
}
