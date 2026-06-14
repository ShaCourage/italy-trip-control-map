import { readFileSync } from "node:fs";
import ts from "typescript";

const placeCollections = [
  { file: "src/data.ts", name: "places" },
  { file: "src/extraData.ts", name: "extraPlaces" },
  { file: "src/morePlaces.ts", name: "morePlaces" },
  { file: "src/sitePlaces.ts", name: "sitePlaces" },
];
const sourceCollections = [
  { file: "src/data.ts", name: "sources" },
  { file: "src/extraData.ts", name: "extraSources" },
];
const routeFiles = ["src/data.ts", "src/templates.ts"];
const enhancementFile = "src/placeEnhancements.ts";
const templateFile = "src/templates.ts";

const parsedFiles = new Map();
const errors = [];

function parseFile(file) {
  if (!parsedFiles.has(file)) {
    parsedFiles.set(
      file,
      ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    );
  }
  return parsedFiles.get(file);
}

function unwrap(node) {
  let current = node;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isTypeAssertionExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) return node.text;
  return undefined;
}

function getProperty(object, name) {
  return object.properties.find(
    (property) => ts.isPropertyAssignment(property) && propertyName(property.name) === name
  );
}

function getString(object, name) {
  const property = getProperty(object, name);
  const value = property && unwrap(property.initializer);
  return value && ts.isStringLiteralLike(value) ? value.text : undefined;
}

function getNumber(object, name) {
  const property = getProperty(object, name);
  const value = property && unwrap(property.initializer);
  if (!value) return undefined;
  if (ts.isNumericLiteral(value)) return Number(value.text);
  if (ts.isPrefixUnaryExpression(value) && ts.isNumericLiteral(value.operand)) {
    const number = Number(value.operand.text);
    return value.operator === ts.SyntaxKind.MinusToken ? -number : number;
  }
  return undefined;
}

function getObject(object, name) {
  const property = getProperty(object, name);
  const value = property && unwrap(property.initializer);
  return value && ts.isObjectLiteralExpression(value) ? value : undefined;
}

function getStringArray(object, name) {
  const property = getProperty(object, name);
  const value = property && unwrap(property.initializer);
  if (!value || !ts.isArrayLiteralExpression(value)) return undefined;
  return value.elements.map((element) => {
    const item = unwrap(element);
    return ts.isStringLiteralLike(item) ? item.text : undefined;
  });
}

function getCollection(file, name, expectedKind) {
  const sourceFile = parseFile(file);
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== name || !declaration.initializer) continue;
      const initializer = unwrap(declaration.initializer);
      if (expectedKind === "array" && ts.isArrayLiteralExpression(initializer)) return initializer;
      if (expectedKind === "object" && ts.isObjectLiteralExpression(initializer)) return initializer;
    }
  }
  errors.push(`${file}: export const ${name} 컬렉션을 찾을 수 없음`);
  return undefined;
}

function location(file, node) {
  const sourceFile = parseFile(file);
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${file}:${line + 1}`;
}

function report(file, node, message) {
  errors.push(`${location(file, node)} ${message}`);
}

function objectElements(file, collection) {
  if (!collection) return [];
  const objects = [];
  for (const element of collection.elements) {
    const value = unwrap(element);
    if (ts.isObjectLiteralExpression(value)) objects.push(value);
    else report(file, element, "객체 리터럴이 아닌 항목");
  }
  return objects;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const placeEntries = placeCollections.flatMap(({ file, name }) =>
  objectElements(file, getCollection(file, name, "array")).map((node) => ({ file, node }))
);
const sourceEntries = sourceCollections.flatMap(({ file, name }) =>
  objectElements(file, getCollection(file, name, "array")).map((node) => ({ file, node }))
);

const placesById = new Map();
for (const entry of placeEntries) {
  const { file, node } = entry;
  const id = getString(node, "id");
  const city = getString(node, "city");
  const category = getString(node, "category");
  const lat = getNumber(node, "lat");
  const lng = getNumber(node, "lng");
  const pairWith = getStringArray(node, "pairWith");
  const sourceIds = getStringArray(node, "sourceIds");

  if (!id) {
    report(file, node, "장소 id가 문자열이 아님");
    continue;
  }
  entry.id = id;
  entry.city = city;
  entry.category = category;
  entry.pairWith = pairWith;
  entry.sourceIds = sourceIds;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) report(file, node, `장소 id 형식 오류: ${id}`);
  if (placesById.has(id)) {
    report(file, node, `중복 장소 id: ${id} (기존 ${location(placesById.get(id).file, placesById.get(id).node)})`);
  } else {
    placesById.set(id, entry);
  }
  if (city !== "rome" && city !== "florence") report(file, node, `${id} city 오류: ${city ?? "없음"}`);
  if (!["stay", "station", "attraction", "food", "cafe", "shopping", "view", "rest"].includes(category)) {
    report(file, node, `${id} category 오류: ${category ?? "없음"}`);
  }
  if (lat === undefined || lng === undefined) {
    report(file, node, `${id} 좌표가 숫자가 아님`);
  } else if (lat < 35 || lat > 47 || lng < 6 || lng > 19) {
    report(file, node, `${id} 좌표가 이탈리아 범위를 벗어남: ${lat}, ${lng}`);
  }
  if (!pairWith) report(file, node, `${id} pairWith가 문자열 배열이 아님`);
  if (!sourceIds) report(file, node, `${id} sourceIds가 문자열 배열이 아님`);
  if (sourceIds?.some((sourceId) => sourceId === undefined)) {
    report(file, node, `${id} sourceIds에 문자열이 아닌 값이 있음`);
  }
  if (category !== "stay" && sourceIds?.length === 0) report(file, node, `${id} 출처(sourceIds) 없음`);
}

const sourcesById = new Map();
for (const entry of sourceEntries) {
  const { file, node } = entry;
  const id = getString(node, "id");
  const url = getString(node, "url");
  if (!id) {
    report(file, node, "출처 id가 문자열이 아님");
    continue;
  }
  if (sourcesById.has(id)) {
    report(file, node, `중복 출처 id: ${id} (기존 ${location(sourcesById.get(id).file, sourcesById.get(id).node)})`);
  } else {
    sourcesById.set(id, entry);
  }
  if (!url || !isHttpUrl(url)) report(file, node, `${id} 출처 URL 오류: ${url ?? "없음"}`);
}

for (const entry of placeEntries) {
  if (!entry.id) continue;
  const seenPairs = new Set();
  for (const pairId of entry.pairWith ?? []) {
    if (pairId === undefined) {
      report(entry.file, entry.node, `${entry.id} pairWith에 문자열이 아닌 값이 있음`);
      continue;
    }
    if (pairId === entry.id) report(entry.file, entry.node, `${entry.id} pairWith가 자기 자신을 참조함`);
    if (seenPairs.has(pairId)) report(entry.file, entry.node, `${entry.id} pairWith 중복: ${pairId}`);
    seenPairs.add(pairId);
    if (!placesById.has(pairId)) report(entry.file, entry.node, `${entry.id} pairWith 깨진 참조: ${pairId}`);
  }
  const seenSources = new Set();
  for (const sourceId of entry.sourceIds ?? []) {
    if (sourceId && seenSources.has(sourceId)) {
      report(entry.file, entry.node, `${entry.id} sourceIds 중복: ${sourceId}`);
    }
    if (sourceId) seenSources.add(sourceId);
    if (sourceId && !sourcesById.has(sourceId)) {
      report(entry.file, entry.node, `${entry.id} sourceIds 깨진 참조: ${sourceId}`);
    }
  }
}

for (const file of routeFiles) {
  const sourceFile = parseFile(file);
  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && propertyName(node.name) === "placeId") {
      const value = unwrap(node.initializer);
      if (!ts.isStringLiteralLike(value)) {
        report(file, node, "placeId가 문자열이 아님");
      } else if (!placesById.has(value.text)) {
        report(file, node, `placeId 깨진 참조: ${value.text}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const enhancementCollection = getCollection(enhancementFile, "placeEnhancements", "object");
const enhancementIds = new Set();
if (enhancementCollection) {
  for (const property of enhancementCollection.properties) {
    if (!ts.isPropertyAssignment(property)) {
      report(enhancementFile, property, "보강 데이터가 속성 할당이 아님");
      continue;
    }
    const id = propertyName(property.name);
    const value = unwrap(property.initializer);
    if (!id || !ts.isObjectLiteralExpression(value)) {
      report(enhancementFile, property, "보강 데이터 키 또는 값 형식 오류");
      continue;
    }
    if (enhancementIds.has(id)) report(enhancementFile, property, `중복 보강 데이터 id: ${id}`);
    enhancementIds.add(id);
    if (!placesById.has(id)) report(enhancementFile, property, `장소 없는 보강 데이터: ${id}`);

    const imageUrl = getString(value, "imageUrl");
    const imageSourceUrl = getString(value, "imageSourceUrl");
    if (imageUrl && !imageSourceUrl) report(enhancementFile, property, `${id} imageSourceUrl 없음`);
    if (imageUrl && !isHttpUrl(imageUrl)) report(enhancementFile, property, `${id} imageUrl 오류: ${imageUrl}`);
    if (imageSourceUrl && !isHttpUrl(imageSourceUrl)) {
      report(enhancementFile, property, `${id} imageSourceUrl 오류: ${imageSourceUrl}`);
    }

    const google = getObject(value, "google");
    if (google) {
      const rating = getNumber(google, "rating");
      const lastChecked = getString(google, "lastChecked");
      if (rating === undefined || rating < 0 || rating > 5) {
        report(enhancementFile, property, `${id} Google rating 범위 오류: ${rating ?? "없음"}`);
      }
      if (!lastChecked || !isValidDate(lastChecked)) {
        report(enhancementFile, property, `${id} Google lastChecked 날짜 오류: ${lastChecked ?? "없음"}`);
      }
    }
  }
}

const templateCollection = getCollection(templateFile, "tripTemplates", "array");
const templateIds = new Set();
for (const template of objectElements(templateFile, templateCollection)) {
  const id = getString(template, "id");
  if (!id) {
    report(templateFile, template, "템플릿 id가 문자열이 아님");
  } else if (templateIds.has(id)) {
    report(templateFile, template, `중복 템플릿 id: ${id}`);
  } else {
    templateIds.add(id);
  }
}

if (errors.length) {
  console.error(`데이터 무결성 검사 실패 (${errors.length}건)\n`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const placeCounts = [...placesById.values()].reduce(
  (counts, entry) => {
    counts.byCity[entry.city] = (counts.byCity[entry.city] ?? 0) + 1;
    counts.byCategory[entry.category] = (counts.byCategory[entry.category] ?? 0) + 1;
    if (entry.category !== "stay" && entry.category !== "station") counts.listable += 1;
    return counts;
  },
  { listable: 0, byCity: {}, byCategory: {} }
);
const categorySummary = Object.entries(placeCounts.byCategory)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([category, count]) => `${category} ${count}`)
  .join(", ");

console.log(
  `OK — ${placesById.size} places, ${sourcesById.size} sources, ${enhancementIds.size} enhancements, ${templateIds.size} templates`
);
console.log(
  `     listable ${placeCounts.listable}; rome ${placeCounts.byCity.rome ?? 0}, florence ${placeCounts.byCity.florence ?? 0}`
);
console.log(`     categories: ${categorySummary}`);
