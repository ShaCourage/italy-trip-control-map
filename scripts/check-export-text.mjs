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

const { escapeCsvValue, escapeXmlText } = await importTs("exportText.ts");

assert.equal(escapeCsvValue('Melaleuca Bakery & "Bistrot"'), '"Melaleuca Bakery & ""Bistrot"""');
assert.equal(
  escapeXmlText(`Melaleuca Bakery & Bistrot <tag> "quote" 'apos'`),
  "Melaleuca Bakery &amp; Bistrot &lt;tag&gt; &quot;quote&quot; &apos;apos&apos;"
);

console.log("OK - export text escaping");
