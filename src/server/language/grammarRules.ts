import type { Token } from "./tokenizer.js";

// Grammar points detected by code from tokenizer output. Points that depend on meaning
// (which に is this?) are left to the grading model; see the spec's Detecting uses.
export const RULE_GRAMMAR = new Set([
  "desu", "deshita", "masu", "masen", "mashita", "masen-deshita", "mashou", "mashou-ka", "masen-ka",
  "tai", "nai", "ta", "te", "te-iru", "te-kudasai", "te-mo-ii", "te-wa-ikenai", "ta-koto-ga-aru",
  "ku-nai-katta-ku-nakatta", "ga-hoshii", "tari-tari-suru", "nagara",
]);

const isAux = (t: Token | undefined, base: string) => !!t && t.pos === "助動詞" && t.base === base;
const isTe = (t: Token | undefined) => !!t && t.pos === "助詞" && t.posDetail === "接続助詞" && (t.surface === "て" || t.surface === "で");

/** Grammar item ids ("g:...") that this Japanese text uses. */
export function detectGrammar(tokens: Token[]): Set<string> {
  const found = new Set<string>();
  const add = (id: string) => found.add(`g:${id}`);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const prev = tokens[i - 1];
    const n1 = tokens[i + 1];
    const n2 = tokens[i + 2];
    const n3 = tokens[i + 3];

    // でした inside ませんでした belongs to masen-deshita, not to desu/deshita.
    const afterMasen = isAux(prev, "ん") && isAux(tokens[i - 2], "ます");
    if (isAux(t, "です") && !afterMasen) {
      add("desu");
      if (isAux(n1, "た")) add("deshita");
    }
    if (isAux(t, "ます")) {
      add("masu");
      if (isAux(n1, "た")) add("mashita");
      if (isAux(n1, "ん")) {
        add("masen");
        if (isAux(n2, "です") && isAux(n3, "た")) add("masen-deshita");
        if (n2?.surface === "か") add("masen-ka");
      }
      if (isAux(n1, "う")) {
        add("mashou");
        if (n2?.surface === "か") add("mashou-ka");
      }
    }
    if (isAux(t, "たい")) add("tai");
    if (isAux(t, "ない") && prev?.pos === "動詞") add("nai");
    if (isAux(t, "た") && prev?.pos === "動詞") {
      add("ta");
      if (n1?.base === "こと" && n2?.surface === "が" && n3?.base === "ある") add("ta-koto-ga-aru");
    }
    if (isTe(t) && prev?.pos === "動詞") {
      add("te");
      if (n1?.pos === "動詞" && n1.base === "いる") add("te-iru");
      if (n1?.base === "くださる") add("te-kudasai");
      if (n1?.surface === "も" && n2 && ["いい", "よい", "良い"].includes(n2.base)) add("te-mo-ii");
      if (n1?.surface === "は" && n2?.base === "いける") add("te-wa-ikenai");
    }
    if (t.pos === "形容詞" && t.conjForm === "連用タ接続" && isAux(n1, "た")) add("ku-nai-katta-ku-nakatta");
    if (t.pos === "形容詞" && t.conjForm === "連用テ接続" && n1?.base === "ない") add("ku-nai-katta-ku-nakatta");
    if (t.pos === "形容詞" && (t.base === "ほしい" || t.base === "欲しい") && prev?.surface === "が") add("ga-hoshii");
    if (t.surface === "たり" || t.surface === "だり") add("tari-tari-suru");
    if (t.surface === "ながら" && prev?.pos === "動詞") add("nagara");
  }
  return found;
}
