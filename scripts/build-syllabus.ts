// Builds syllabus/syllabus.json from the OpenJLPT CSVs and our sets.json. Run: npx tsx scripts/build-syllabus.ts
import fs from "node:fs";
import { parseCsv } from "../src/shared/csv.js";
import type { Item, Syllabus } from "../src/shared/syllabus.js";
import { RULE_GRAMMAR } from "../src/server/language/grammarRules.js";

const read = (f: string) => parseCsv(fs.readFileSync(`syllabus/source/${f}.csv`, "utf8"));
const items: Item[] = [];

// Grammar points whose meaning or form builds on another.
const PREREQS: Record<string, string[]> = {
  mashita: ["masu"], masen: ["masu"], "masen-deshita": ["masen", "mashita"], mashou: ["masu"],
  "mashou-ka": ["mashou"], "masen-ka": ["masen"], tai: ["masu"], deshita: ["desu"],
  "ta-koto-ga-aru": ["ta"], "tari-tari-suru": ["ta"], "mou-ta": ["ta"], "ato-de": ["ta"],
  "naide-kudasai": ["nai", "te-kudasai"], "nakereba-naranai-nakute-wa-ikenai": ["nai"], "nakute-mo-ii": ["nai", "te-mo-ii"],
  "amari-nai": ["nai"], "zenzen-nai": ["nai"], "mada-te-inai": ["te-iru", "nai"],
};
const needsTe = (id: string) => id !== "te" && /^te-|-te-|^tara$/.test(id);

let order = 0;
for (const f of ["grammar-n5", "grammar-n4"]) {
  for (const r of read(f)) {
    const id = r.id!;
    const prereqs = [...(PREREQS[id] ?? []), ...(needsTe(id) ? ["te"] : [])].map((p) => `g:${p}`);
    items.push({
      id: `g:${id}`, kind: "grammar", level: r.level as "N5" | "N4", form: r.pattern!, reading: r.reading ?? "",
      meaning: r.meaning!, order: order++, prereqs, detect: RULE_GRAMMAR.has(id) ? "rule" : "model", formation: r.formation,
    });
  }
}

order = 0;
const seen = new Set<string>();
for (const f of ["vocab-n5", "vocab-n4"]) {
  for (const r of read(f)) {
    const id = `w:${r.word}:${r.reading}`;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      id, kind: "word", level: r.level as "N5" | "N4", form: r.word!, reading: r.reading!,
      meaning: r.meanings!, order: order++, prereqs: [], detect: "word",
    });
  }
}

order = 0;
const sets = JSON.parse(fs.readFileSync("syllabus/sets.json", "utf8")) as {
  sets: { id: string; name: string; members: { form: string; reading: string }[] }[];
};
for (const s of sets.sets) {
  s.members.forEach((m, i) => {
    items.push({
      id: `s:${s.id}:${i + 1}`, kind: "set", level: "N5", form: m.form, reading: m.reading,
      meaning: s.name, order: order++, prereqs: [], detect: "model", set: s.id,
    });
  });
}

const version = fs.readFileSync("syllabus/source/VERSION", "utf8").trim().split(" ")[0]!.slice(0, 12);
const out: Syllabus = { version, items };
fs.writeFileSync("syllabus/syllabus.json", JSON.stringify(out));
const count = (k: string) => items.filter((i) => i.kind === k).length;
console.log(`syllabus: ${count("word")} words, ${count("grammar")} grammar points (${items.filter((i) => i.detect === "rule").length} by rule), ${count("set")} set members`);
