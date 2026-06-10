import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/routes.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  reportDiagnostics: true,
});
const diagnostics = compiled.diagnostics ?? [];
assert.equal(diagnostics.length, 0, diagnostics.map((item) => item.messageText).join("\n"));
const routeModuleUrl = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString("base64")}`;
const {
  appendRouteItems,
  cloneRoute,
  moveRouteItem,
  removePlaceFromRoutes,
  removeRouteItem,
  replaceFirstRouteItem,
  sanitizeRoutes,
} = await import(routeModuleUrl);

const start = [
  { uid: "hotel-start", placeId: "rome-hotel", locked: true },
  { uid: "a", placeId: "pantheon" },
  { uid: "b", placeId: "trevi-fountain" },
  { uid: "hotel-return", placeId: "rome-hotel", locked: true },
];
const isTerminalReturn = (item) => item.uid === "hotel-return";

const appended = appendRouteItems(start, [{ uid: "c", placeId: "piazza-navona" }], isTerminalReturn);
assert.deepEqual(appended.map((item) => item.uid), ["hotel-start", "a", "b", "c", "hotel-return"]);
assert.equal(appendRouteItems(appended, [{ uid: "duplicate", placeId: "pantheon" }], isTerminalReturn), appended);

const replaced = replaceFirstRouteItem(
  start,
  { placeId: "colosseum-forum", note: "현장 교체" },
  (item) => !item.locked && item.uid !== "a"
);
assert.equal(replaced?.[2].placeId, "colosseum-forum");
assert.equal(replaced?.[2].uid, "b");
assert.equal(replaceFirstRouteItem(start, { placeId: "x" }, () => false), undefined);
assert.equal(replaceFirstRouteItem(start, { placeId: "pantheon" }, (item) => item.uid === "b"), start);

assert.equal(removeRouteItem(start, "hotel-start"), start);
assert.deepEqual(removeRouteItem(start, "a").map((item) => item.uid), ["hotel-start", "b", "hotel-return"]);

assert.equal(moveRouteItem(start, 1, -1), start);
assert.deepEqual(moveRouteItem(start, 1, 1).map((item) => item.uid), ["hotel-start", "b", "a", "hotel-return"]);

const routes = { first: start, second: [{ uid: "x", placeId: "pantheon" }] };
assert.deepEqual(removePlaceFromRoutes(routes, "pantheon"), {
  first: [start[0], start[2], start[3]],
  second: [],
});
assert.equal(removePlaceFromRoutes(routes, "missing"), routes);

const sanitized = sanitizeRoutes(
  {
    first: [
      { uid: "ok", placeId: "pantheon", locked: true, time: "오전", note: "keep" },
      { uid: "unknown", placeId: "missing" },
      { placeId: "pantheon" },
    ],
    broken: "not-an-array",
  },
  (placeId) => placeId === "pantheon"
);
assert.deepEqual(sanitized, {
  first: [{ uid: "ok", placeId: "pantheon", locked: true, time: "오전", note: "keep" }],
  broken: [],
});

const cloned = cloneRoute("2026-06-19", start.slice(1, 3), "test", "token");
assert.deepEqual(cloned.map((item) => item.uid), [
  "2026-06-19-test-token-0-pantheon",
  "2026-06-19-test-token-1-trevi-fountain",
]);
assert.equal(start[1].uid, "a");

console.log("OK — route mutation rules");
