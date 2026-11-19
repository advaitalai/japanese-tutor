import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Seg } from "../../shared/types.js";
import type { Syllabus } from "../../shared/syllabus.js";
import { analyze, toRomaji, toSegments, type Token } from "./tokenizer.js";
import { detectGrammar } from "./grammarRules.js";
import { buildWordIndex, detectWords, type WordIndex } from "./words.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export function loadSyllabus(file = path.resolve(here, "../../../syllabus/syllabus.json")): Syllabus {
  return JSON.parse(fs.readFileSync(file, "utf8")) as Syllabus;
}

export interface Analysis {
  tokens: Token[];
  segs: Seg[];
  romaji: string;
}

export class Language {
  readonly index: WordIndex;
  constructor(readonly syllabus: Syllabus) {
    this.index = buildWordIndex(syllabus.items);
  }

  /** Captions for one Japanese part: segments with readings, and romaji. */
  async caption(text: string): Promise<Analysis> {
    const tokens = await analyze(text);
    return { tokens, segs: toSegments(tokens), romaji: toRomaji(tokens) };
  }

  /** Word and grammar items (by rule) used in a piece of Japanese. */
  async itemsUsed(text: string): Promise<Set<string>> {
    const tokens = await analyze(text);
    return new Set([...detectWords(tokens, this.index), ...detectGrammar(tokens)]);
  }
}
