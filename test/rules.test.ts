import { describe, expect, it } from "vitest";
import { isGoodbye } from "../src/server/rules/goodbye.js";
import { isHowDoISay } from "../src/server/rules/sidebar.js";
import { filterFixes } from "../src/server/rules/fixFilter.js";
import type { ProposedFix } from "../src/shared/types.js";

describe("S19 goodbye detection", () => {
  it.each(["またね！", "じゃあね", "おやすみなさい。", "バイバイ", "bye!", "OK see you tomorrow", "I have to go", "mata ne", "さようなら〜"])(
    "ends the session on %s",
    (t) => expect(isGoodbye(t)).toBe(true),
  );
  it.each(["おやすみの日に映画を見ました", "またね、とは言いません", "goodbyes are hard to translate? no", "マタ"])(
    "does not end on %s",
    (t) => expect(isGoodbye(t)).toBe(false),
  );
});

describe("S7 how do I say opens a sidebar", () => {
  it.each(["How do I say coconut?", "how would you say 'busy'", "What's 'tired' in Japanese?", "ココナッツは日本語で何ですか", "nihongo de nan desu ka"])(
    "detects %s",
    (t) => expect(isHowDoISay(t)).toBe(true),
  );
  it.each(["映画を見ました", "I watched a movie", "What did you say?"])("ignores %s", (t) => expect(isHowDoISay(t)).toBe(false));
});

const fix = (wrong: string, right: { t: string; r?: string }[]): ProposedFix => ({ wrong, right, why: "x" });

describe("S11/S12 fix filter", () => {
  const miru = fix("みるました", [{ t: "見", r: "み" }, { t: "ました" }]);

  it("keeps a real fix quoted from his words", () => {
    const r = filterFixes({ mode: "chat", heard: "きのう、えいがをみるました。", lowConfidence: false, fixes: [miru] });
    expect(r.kept).toEqual([miru]);
  });
  it("S11: drops every fix in a sidebar", () => {
    const r = filterFixes({ mode: "sidebar", heard: "みるました", lowConfidence: false, fixes: [miru] });
    expect(r.dropped[0]?.reason).toBe("sidebar");
  });
  it("drops fixes on a low-confidence turn", () => {
    const r = filterFixes({ mode: "chat", heard: "みるました", lowConfidence: true, fixes: [miru] });
    expect(r.dropped[0]?.reason).toBe("low-confidence");
  });
  it("drops a fix whose wrong text he never said", () => {
    const r = filterFixes({ mode: "chat", heard: "映画を見ました", lowConfidence: false, fixes: [miru] });
    expect(r.dropped[0]?.reason).toBe("not-in-his-words");
  });
  it("drops a fix that equals the correction, in kanji or kana", () => {
    const same = fix("みました", [{ t: "見", r: "み" }, { t: "ました" }]);
    const r = filterFixes({ mode: "chat", heard: "えいがをみました", lowConfidence: false, fixes: [same] });
    expect(r.dropped[0]?.reason).toBe("same-as-correction");
  });
  it("matches his words across width, case and punctuation", () => {
    const f = fix("ﾐﾙﾏｼﾀ", [{ t: "見", r: "み" }, { t: "ました" }]);
    const r = filterFixes({ mode: "chat", heard: "みるました！", lowConfidence: false, fixes: [f] });
    expect(r.kept).toHaveLength(1);
  });
  it("never counts romaji spelling (o/wo, ou/oo) as a mistake", () => {
    const f = fix("eiga wo mimashita", [{ t: "映画", r: "えいが" }, { t: "を" }, { t: "見", r: "み" }, { t: "ました" }]);
    const r = filterFixes({
      mode: "chat",
      heard: "kinou eiga wo mimashita",
      lowConfidence: false,
      fixes: [f],
      rightRomaji: () => "eiga o mimashita",
    });
    expect(r.dropped[0]?.reason).toBe("romaji-spelling");
  });
});
