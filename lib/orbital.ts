export type OrbitalTextSegment =
  | { type: "text"; value: string }
  | { type: "diagram"; orbitals: string[]; source: string };

const ORBITAL_BOX_SOURCE = String.raw`\[(?:[ \t]*(?:[↑↓][ \t]*){1,2}|[ \t]+)\]`;
const ORBITAL_GROUP_PATTERN = new RegExp(`(?:${ORBITAL_BOX_SOURCE})(?:[ \\t]*${ORBITAL_BOX_SOURCE})*`, "gu");
const ORBITAL_BOX_PATTERN = /\[([^\]]*)\]/gu;

export function parseOrbitalText(text: string): OrbitalTextSegment[] {
  if (!text) return [{ type: "text", value: "" }];

  const segments: OrbitalTextSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(ORBITAL_GROUP_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ type: "text", value: text.slice(cursor, start) });

    const source = match[0];
    const orbitals = Array.from(source.matchAll(ORBITAL_BOX_PATTERN), (box) =>
      box[1].replace(/[ \t]/g, ""),
    );
    segments.push({ type: "diagram", orbitals, source });
    cursor = start + source.length;
  }

  if (cursor < text.length) segments.push({ type: "text", value: text.slice(cursor) });
  return segments.length ? segments : [{ type: "text", value: text }];
}

export function hasOrbitalNotation(text: string) {
  return parseOrbitalText(text).some((segment) => segment.type === "diagram");
}

export function describeOrbitalDiagram(orbitals: string[]) {
  const descriptions = orbitals.map((orbital, index) => {
    const spins = [...orbital].map((electron) => electron === "↑" ? "spin atas" : "spin bawah");
    const content = spins.length ? spins.join(" dan ") : "kosong";
    return `orbital ${index + 1} ${content}`;
  });
  return `Diagram orbital: ${descriptions.join(", ")}`;
}
