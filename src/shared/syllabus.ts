import type { ItemKind, Level } from "./types.js";

export type Detect = "word" | "rule" | "model";

export interface Item {
  id: string; // w:<word>:<reading> · g:<grammar id> · s:<set>:<n>
  kind: ItemKind;
  level: Level;
  form: string; // 映画 · 〜ました · 三本
  reading: string;
  meaning: string;
  order: number; // position within its kind
  prereqs: string[];
  detect: Detect;
  set?: string;
  formation?: string;
}

export interface Syllabus {
  version: string;
  items: Item[];
}
