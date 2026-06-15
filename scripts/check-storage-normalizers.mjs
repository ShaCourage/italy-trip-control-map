import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

async function importTs(file) {
  const source = readFileSync(new URL(`../src/lib/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  });
  const diagnostics = compiled.diagnostics ?? [];
  assert.equal(diagnostics.length, 0, diagnostics.map((item) => item.messageText).join("\n"));

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString("base64")}`;
  return import(moduleUrl);
}

const { makeDayLabel, normalizeTripDay, normalizeTripDays } = await importTs("tripDays.ts");
const { normalizeCustomPlace, normalizeCustomPlaces } = await importTs("customPlaces.ts");
const { normalizeAppSettings } = await importTs("appSettings.ts");

assert.equal(makeDayLabel("2026-06-20"), "6/20 토");
assert.equal(makeDayLabel("not-a-date"), "not-a-date");
assert.equal(normalizeTripDay({ id: "broken" }), undefined);
assert.deepEqual(normalizeTripDays("bad"), []);

assert.deepEqual(
  normalizeTripDay({
    date: "2026-06-20",
    city: "unknown",
    label: "",
    title: "  ",
    areaFocus: "  남부 테스트  ",
    route: [
      { placeId: " pantheon ", time: " 09:00 ", locked: "yes", note: "  입장 확인  " },
      { placeId: 42 },
    ],
    fallback: [" 카페 ", "", 3],
    checklist: "old-shape",
  }),
  {
    id: "2026-06-20",
    date: "2026-06-20",
    label: "6/20 토",
    city: "rome",
    title: "직접 만든 일정",
    areaFocus: "남부 테스트",
    route: [{ placeId: "pantheon", time: "09:00", note: "입장 확인" }],
    fallback: ["카페"],
    checklist: [],
  }
);

assert.deepEqual(
  normalizeTripDays([
    { date: "2026-06-21", city: "florence", checklist: ["여권"], fallback: [], route: [] },
    null,
  ]),
  [
    {
      id: "2026-06-21",
      date: "2026-06-21",
      label: "6/21 일",
      city: "florence",
      title: "직접 만든 일정",
      areaFocus: "직접 구성",
      route: [],
      fallback: [],
      checklist: ["여권"],
    },
  ]
);

assert.equal(normalizeCustomPlace({ id: "broken", lat: 41.9 }), undefined);
assert.deepEqual(normalizeCustomPlaces("bad"), []);
assert.equal(
  normalizeCustomPlace({ id: "pantheon", name: "Built-in collision", lat: 41.9, lng: 12.5 }),
  undefined
);

assert.deepEqual(
  normalizeCustomPlace({
    id: "custom-1",
    name: "  Test Place  ",
    lat: 41.9,
    lng: 12.5,
    city: "unknown",
    category: "bad",
    tags: ["  야경  ", "", "내장소"],
    why: "  메모  ",
    priority: 1,
    photo: 3,
    girlsTripFit: "bad",
  }),
  {
    id: "custom-1",
    city: "rome",
    name: "Test Place",
    koName: "Test Place",
    category: "attraction",
    area: "내 장소",
    lat: 41.9,
    lng: 12.5,
    priority: 1,
    rank: 50,
    durationMin: 45,
    reservation: "불필요",
    bestTime: "자유",
    price: "확인",
    safety: "보통",
    photo: 3,
    girlsTripFit: 2,
    tags: ["내장소", "야경"],
    why: "메모",
    tips: [],
    koreanTips: undefined,
    menuHints: undefined,
    watchOut: undefined,
    pairWith: [],
    sourceIds: [],
  }
);

assert.deepEqual(
  normalizeCustomPlaces([
    { id: "custom-dup", name: "First", lat: 41.9, lng: 12.5 },
    { id: "custom-dup", name: "Second", lat: 42, lng: 13 },
  ]).map((place) => place.name),
  ["First"]
);

assert.deepEqual(normalizeAppSettings("bad"), {});
assert.deepEqual(
  normalizeAppSettings({
    startTab: "broken",
    defaultFilter: "bad",
    appliedTemplateId: "  foodie  ",
    romeHotel: { lat: 41.9, lng: 12.5, label: "  로마 숙소  " },
    florenceHotel: { lat: Number.NaN, lng: 11.25, label: "bad" },
  }),
  {
    appliedTemplateId: "foodie",
    romeHotel: { lat: 41.9, lng: 12.5, label: "로마 숙소" },
  }
);
assert.deepEqual(
  normalizeAppSettings({ startTab: "ranking", defaultFilter: "photo", florenceHotel: { lat: 43.77, lng: 11.25 } }),
  {
    startTab: "ranking",
    defaultFilter: "photo",
    florenceHotel: { lat: 43.77, lng: 11.25 },
  }
);

console.log("OK - storage normalizers");
