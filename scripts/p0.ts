// P0 scenarios: scripted conversations through the REAL Claude call, checked on behavior.
// Run: ANTHROPIC_API_KEY=... npx tsx scripts/p0.ts   (costs a few cents per run)
import Anthropic from "@anthropic-ai/sdk";
import { openDb } from "../src/server/db/index.js";
import { Language, loadSyllabus } from "../src/server/language/index.js";
import { loadTokenizer } from "../src/server/language/tokenizer.js";
import { TurnEngine, type TurnResult } from "../src/server/turn/engine.js";
import { ClaudeYui } from "../src/server/turn/claude.js";

type Check = (r: TurnResult) => string | undefined; // undefined = pass
interface Scenario { name: string; story: string; turns: { say: string; check?: Check }[] }

const ja = (r: TurnResult) => r.parts.filter((p) => p.lang === "ja").map((p) => p.text).join("");
const en = (r: TurnResult) => r.parts.filter((p) => p.lang === "en").map((p) => p.text).join(" ");
const short: Check = (r) => (ja(r).length > 90 ? `Japanese too long (${ja(r).length} chars)` : undefined);
const asks: Check = (r) => (/[？?]/.test(ja(r)) ? undefined : "no question for him");
const all = (...cs: Check[]): Check => (r) => cs.map((c) => c(r)).find(Boolean);

const scenarios: Scenario[] = [
  { name: "leads at his level", story: "S4", turns: [{ say: "こんにちは。今日は仕事をしました。", check: all(short, asks) }] },
  {
    name: "corrects a conjugation mistake", story: "S12",
    turns: [{ say: "きのう、えいがをみるました。", check: (r) => (r.fixes.some((f) => f.wrong.includes("みるました")) ? undefined : "missed みるました") }],
  },
  { name: "no fake fix on a correct sentence", story: "S12", turns: [{ say: "昨日、映画を見ました。", check: (r) => (r.fixes.length ? `invented fix: ${r.fixes[0]!.wrong}` : undefined) }] },
  {
    name: "how do I say opens a short English sidebar", story: "S7",
    turns: [{
      say: "How do I say 'coconut' in Japanese?",
      check: (r) => r.mode !== "sidebar" ? "not sidebar" : en(r).split(/\s+/).length > 35 ? "English answer too long" : /[぀-ヿ一-鿿]/.test(en(r)) ? "Japanese inside an English part" : undefined,
    }],
  },
  {
    name: "English statement gets the Japanese first", story: "S6",
    turns: [{ say: "I went to Kyoto last weekend.", check: (r) => (r.parts[0]?.lang === "ja" ? undefined : "did not give the Japanese first") }],
  },
  {
    name: "もういちど repeats the last line", story: "S5",
    turns: [{ say: "今日は暑いですね。" }, { say: "もういちど" }],
  },
  { name: "goodbye ends the session", story: "S19", turns: [{ say: "またね！", check: (r) => (r.mode === "end" ? undefined : `mode ${r.mode}`) }] },
];

const client = new Anthropic();
await loadTokenizer();
const lang = new Language(loadSyllabus());
let failed = 0;
for (const s of scenarios) {
  const engine = new TurnEngine(openDb(":memory:"), lang, new ClaudeYui(client, process.env.TURN_MODEL ?? "claude-opus-5-5"));
  const problems: string[] = [];
  let last: TurnResult | undefined;
  for (const t of s.turns) {
    const r = await engine.turn(t.say);
    if (t.say === "もういちど" && last && ja(r) !== ja(last)) problems.push(`repeat differs: "${ja(last)}" vs "${ja(r)}"`);
    const p = t.check?.(r);
    if (p) problems.push(p);
    last = r;
  }
  failed += problems.length ? 1 : 0;
  console.log(`${problems.length ? "FAIL" : "pass"}  ${s.story}  ${s.name}${problems.length ? `: ${problems.join("; ")}` : ""}`);
}
console.log(`${scenarios.length - failed}/${scenarios.length} passed`);
process.exit(failed ? 1 : 0);
