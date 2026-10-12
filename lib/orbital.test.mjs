import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("./orbital.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: "orbital.ts",
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
const { describeOrbitalDiagram, hasOrbitalNotation, parseOrbitalText } = await import(moduleUrl);

test("parses a connected Hund diagram", () => {
  assert.deepEqual(parseOrbitalText("[↑↓][↑][↑]"), [
    { type: "diagram", orbitals: ["↑↓", "↑", "↑"], source: "[↑↓][↑][↑]" },
  ]);
});

test("supports every documented orbital cell", () => {
  assert.deepEqual(parseOrbitalText("[↑↓][↑][↓][ ][↑↑]"), [
    { type: "diagram", orbitals: ["↑↓", "↑", "↓", "", "↑↑"], source: "[↑↓][↑][↓][ ][↑↑]" },
  ]);
});

test("keeps scientifically invalid Pauli distractors unchanged", () => {
  assert.deepEqual(parseOrbitalText("[↑↓][ ][↑↑]"), [
    { type: "diagram", orbitals: ["↑↓", "", "↑↑"], source: "[↑↓][ ][↑↑]" },
  ]);
});

test("only replaces the diagram inside mixed text", () => {
  const text = "Perhatikan diagram orbital berikut: [↑↓][↑][↑]. Tentukan jumlah elektron.";
  assert.deepEqual(parseOrbitalText(text), [
    { type: "text", value: "Perhatikan diagram orbital berikut: " },
    { type: "diagram", orbitals: ["↑↓", "↑", "↑"], source: "[↑↓][↑][↑]" },
    { type: "text", value: ". Tentukan jumlah elektron." },
  ]);
});

test("supports spaces inside and between boxes without crossing a new line", () => {
  assert.deepEqual(parseOrbitalText("[ ↑ ↓ ]  [ ↓ ]\n[↑]"), [
    { type: "diagram", orbitals: ["↑↓", "↓"], source: "[ ↑ ↓ ]  [ ↓ ]" },
    { type: "text", value: "\n" },
    { type: "diagram", orbitals: ["↑"], source: "[↑]" },
  ]);
});

test("does not change ordinary bracketed text or other chemistry symbols", () => {
  const text = "Pilih [A], inti [Ar], Fe[CN]6, [], [↑↓↓], atau kurung [↑ yang belum selesai.";
  assert.deepEqual(parseOrbitalText(text), [{ type: "text", value: text }]);
  assert.equal(hasOrbitalNotation(text), false);
});

test("keeps separated diagram runs separate and is stable across calls", () => {
  const text = "Awal [↑] lalu [↓] akhir";
  const expected = [
    { type: "text", value: "Awal " },
    { type: "diagram", orbitals: ["↑"], source: "[↑]" },
    { type: "text", value: " lalu " },
    { type: "diagram", orbitals: ["↓"], source: "[↓]" },
    { type: "text", value: " akhir" },
  ];
  assert.deepEqual(parseOrbitalText(text), expected);
  assert.deepEqual(parseOrbitalText(text), expected);
});

test("creates an accessible description without correcting spin", () => {
  assert.equal(
    describeOrbitalDiagram(["↑↓", "", "↑↑"]),
    "Diagram orbital: orbital 1 spin atas dan spin bawah, orbital 2 kosong, orbital 3 spin atas dan spin atas",
  );
});
