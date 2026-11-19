import type { Item } from "../../shared/syllabus.js";
import { toHiragana } from "../../shared/kana.js";
import type { Token } from "./tokenizer.js";

const CONTENT_POS = new Set(["名詞", "動詞", "形容詞", "副詞", "連体詞", "接続詞", "感動詞"]);

export interface WordIndex {
  byForm: Map<string, Item[]>;
  byReading: Map<string, Item[]>;
}

export function buildWordIndex(items: Item[]): WordIndex {
  const byForm = new Map<string, Item[]>();
  const byReading = new Map<string, Item[]>();
  const push = (m: Map<string, Item[]>, k: string, it: Item) => m.set(k, [...(m.get(k) ?? []), it]);
  for (const it of items) {
    if (it.kind !== "word") continue;
    push(byForm, it.form, it);
    push(byReading, toHiragana(it.reading), it);
  }
  return { byForm, byReading };
}

/** Word item ids this text uses. Kana-only words (common in learner speech) fall back to readings. */
export function detectWords(tokens: Token[], index: WordIndex): Set<string> {
  const found = new Set<string>();
  for (const t of tokens) {
    if (!CONTENT_POS.has(t.pos) || t.posDetail === "数" || t.posDetail === "非自立") continue;
    const byForm = index.byForm.get(t.base);
    if (byForm?.length) {
      const exact = byForm.length > 1 ? byForm.filter((i) => toHiragana(i.reading).startsWith(t.reading.slice(0, 1))) : byForm;
      for (const it of exact.length ? exact : byForm.slice(0, 1)) found.add(it.id);
      continue;
    }
    const base = toHiragana(t.base);
    const byReading = index.byReading.get(base);
    if (byReading?.length === 1) found.add(byReading[0]!.id);
  }
  return found;
}
