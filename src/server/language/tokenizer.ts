import kuromoji from "kuromoji";
import { createRequire } from "node:module";
import path from "node:path";
import type { Seg } from "../../shared/types.js";
import { toHiragana } from "../../shared/kana.js";
import { kanaToRomaji } from "../../shared/romaji.js";

export interface Token {
  surface: string;
  pos: string; // 名詞, 動詞, 助詞, 助動詞, ...
  posDetail: string;
  conjForm: string;
  base: string; // dictionary form
  reading: string; // hiragana; "" when unknown
}

let tokenizerPromise: Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> | undefined;

/** Loads the dictionary once (about 0.5 s, about 300 MB). */
export function loadTokenizer() {
  if (!tokenizerPromise) {
    const require = createRequire(import.meta.url);
    const dicPath = path.join(path.dirname(require.resolve("kuromoji/package.json")), "dict");
    tokenizerPromise = new Promise((resolve, reject) =>
      kuromoji.builder({ dicPath }).build((err, t) => (err ? reject(err) : resolve(t))),
    );
  }
  return tokenizerPromise;
}

// Known IPADIC reading slips, fixed by the word that follows.
const NAN_BEFORE = new Set(["の", "で", "です", "だ", "と", "か", "年", "時", "人", "日", "回", "本", "枚", "個", "歳"]);

export async function analyze(text: string): Promise<Token[]> {
  const t = await loadTokenizer();
  const raw = t.tokenize(text); // no NFKC: captions keep full-width ！？ as written
  return raw.map((x, i) => {
    let reading = x.reading ? toHiragana(x.reading) : "";
    const next = raw[i + 1]?.surface_form ?? "";
    if (x.surface_form === "何" && NAN_BEFORE.has(next)) reading = "なん";
    return {
      surface: x.surface_form,
      pos: x.pos,
      posDetail: x.pos_detail_1,
      conjForm: x.conjugated_form,
      base: x.basic_form === "*" ? x.surface_form : x.basic_form,
      reading,
    };
  });
}

const KANJI = /[㐀-鿿々々〆]/;
const hasKanji = (s: string) => KANJI.test(s);

/** Splits one word into furigana segments: 食べ/たべ → [食|た][べ]; 取り消し → [取|と][り][消|け][し]. */
export function furigana(surface: string, reading: string): Seg[] {
  if (!hasKanji(surface) || !reading) return [{ t: surface }];
  const parts = surface.match(/[㐀-鿿々々〆]+|[^㐀-鿿々々〆]+/g) ?? [surface];
  const pattern = parts.map((p) => (hasKanji(p) ? "(.+?)" : escape(toHiragana(p)))).join("");
  const m = new RegExp(`^${pattern}$`).exec(reading);
  if (!m) return [{ t: surface, r: reading }];
  let g = 1;
  return parts.map((p) => (hasKanji(p) ? { t: p, r: m[g++]! } : { t: p }));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Segments for captions: kanji pieces carry readings, kana pieces don't, kana runs merged. */
export function toSegments(tokens: Token[]): Seg[] {
  const out: Seg[] = [];
  for (const tk of tokens) {
    for (const s of furigana(tk.surface, tk.reading)) {
      const last = out.at(-1);
      if (!s.r && last && !last.r) last.t += s.t;
      else out.push({ ...s });
    }
  }
  return out;
}

const ATTACH_POS = new Set(["助動詞"]);
const ATTACH_DETAIL = new Set(["接続助詞", "接尾"]);

/** "Nan no eiga o mimashita ka?" from tokens. */
export function toRomaji(tokens: Token[]): string {
  let out = "";
  for (const tk of tokens) {
    let r: string;
    if (tk.pos === "記号") r = tk.surface.replace("、", ",").replace("。", ".").replace("？", "?").replace("！", "!");
    else if (tk.pos === "助詞" && tk.surface === "は") r = "wa";
    else if (tk.pos === "助詞" && tk.surface === "へ") r = "e";
    else r = kanaToRomaji(tk.reading || toHiragana(tk.surface));
    const attach =
      tk.pos === "記号" || (ATTACH_POS.has(tk.pos) && tk.base !== "です" && tk.base !== "だ") || ATTACH_DETAIL.has(tk.posDetail) || (tk.pos === "動詞" && tk.posDetail === "非自立" && /て|で$/.test(out));
    out += out && !attach ? ` ${r}` : r;
  }
  out = out.replace(/\s+([,.?!])/g, "$1").trim();
  return out.replace(/(^|[.?!]\s+)([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
}
