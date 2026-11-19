/** Katakana to hiragana, so ミル and みる compare equal. */
export function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** For comparing what he said with a quoted fix: width, case, spaces and punctuation don't count. */
export function normalizeForMatch(s: string): string {
  return toHiragana(s.normalize("NFKC").toLowerCase()).replace(/[\s\p{P}\p{S}]/gu, "");
}

/** Romaji spelling variants that are never mistakes: o/wo, ou/oo/oh, uu/u, ei/ee. */
export function romajiCanonical(s: string): string {
  return normalizeForMatch(s)
    .replace(/wo/g, "o")
    .replace(/(ou|oo|oh|ō)/g, "o")
    .replace(/(uu|ū)/g, "u")
    .replace(/(ei|ee|ē)/g, "e")
    .replace(/(aa|ā)/g, "a")
    .replace(/(ii|ī)/g, "i");
}

export function isMostlyLatin(s: string): boolean {
  const letters = s.replace(/[\s\p{P}\p{S}\d]/gu, "");
  if (letters.length === 0) return false;
  const latin = letters.replace(/[^a-zA-ZÀ-ɏ]/g, "").length;
  return latin / letters.length > 0.6;
}
