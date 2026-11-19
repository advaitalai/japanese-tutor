/** A piece of Japanese text. Pieces with kanji carry their reading for furigana. */
export interface Seg {
  t: string;
  r?: string;
}

export type Mode = "chat" | "sidebar" | "end";

export interface ProposedFix {
  wrong: string; // copied from what he said
  right: Seg[];
  why: string;
  tag?: string; // the item id this fix is about
}

export type ItemKind = "word" | "grammar" | "set";
export type Level = "N5" | "N4" | "own";
