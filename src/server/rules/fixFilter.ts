import type { Mode, ProposedFix } from "../../shared/types.js";
import { isMostlyLatin, normalizeForMatch, romajiCanonical, toHiragana } from "../../shared/kana.js";

export type DropReason =
  | "sidebar"
  | "low-confidence"
  | "not-in-his-words"
  | "same-as-correction"
  | "romaji-spelling";

export interface FilterInput {
  mode: Mode;
  heard: string; // what speech-to-text wrote for his turn
  lowConfidence: boolean;
  fixes: ProposedFix[];
  /** Romaji of each fix's correction, when known, to catch o/wo style "fixes". */
  rightRomaji?: (fix: ProposedFix) => string | undefined;
}

export interface FilterResult {
  kept: ProposedFix[];
  dropped: { fix: ProposedFix; reason: DropReason }[];
}

/** Rules that must never depend on the model: no fixes in sidebars, no fake fixes. */
export function filterFixes(input: FilterInput): FilterResult {
  const kept: ProposedFix[] = [];
  const dropped: FilterResult["dropped"] = [];
  const heard = normalizeForMatch(input.heard);

  for (const fix of input.fixes) {
    const reason = dropReason(fix, input, heard);
    if (reason) dropped.push({ fix, reason });
    else kept.push(fix);
  }
  return { kept, dropped };
}

function dropReason(fix: ProposedFix, input: FilterInput, heard: string): DropReason | undefined {
  if (input.mode !== "chat") return "sidebar";
  if (input.lowConfidence) return "low-confidence";

  const wrong = normalizeForMatch(fix.wrong);
  if (!wrong || !heard.includes(wrong)) return "not-in-his-words";

  const rightText = normalizeForMatch(fix.right.map((s) => s.t).join(""));
  const rightReading = normalizeForMatch(toHiragana(fix.right.map((s) => s.r ?? s.t).join("")));
  if (wrong === rightText || wrong === rightReading) return "same-as-correction";

  if (isMostlyLatin(fix.wrong)) {
    const romaji = input.rightRomaji?.(fix);
    if (romaji && romajiCanonical(fix.wrong) === romajiCanonical(romaji)) return "romaji-spelling";
  }
  return undefined;
}
