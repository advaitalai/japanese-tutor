// "How do I say X?" is a question about Japanese, so it always opens a sidebar.
const PATTERNS = [
  /\bhow (do|would|can|should) (i|you|we) say\b/i,
  /\bwhat('?s| is| are) .+ in japanese\b/i,
  /\bhow is .+ said\b/i,
  /(にほんご|日本語)で(は)?(なん|何|なに)(ですか|と言いますか|といいますか|て言う|っていう)/,
  /\bnihongo de nan desu ka\b/i,
];

export function isHowDoISay(text: string): boolean {
  const t = text.normalize("NFKC");
  return PATTERNS.some((p) => p.test(t));
}
