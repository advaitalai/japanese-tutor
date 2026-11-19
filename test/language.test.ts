import { beforeAll, describe, expect, it } from "vitest";
import { Language, loadSyllabus } from "../src/server/language/index.js";
import { analyze, furigana, loadTokenizer } from "../src/server/language/tokenizer.js";
import { detectGrammar } from "../src/server/language/grammarRules.js";
import { kanaToRomaji } from "../src/shared/romaji.js";

let lang: Language;
beforeAll(async () => {
  await loadTokenizer();
  lang = new Language(loadSyllabus());
}, 30_000);

describe("S3 captions: furigana and romaji from the tokenizer", () => {
  it("puts readings only on kanji, okurigana stays plain", () => {
    expect(furigana("食べ", "たべ")).toEqual([{ t: "食", r: "た" }, { t: "べ" }]);
    expect(furigana("取り消し", "とりけし")).toEqual([{ t: "取", r: "と" }, { t: "り" }, { t: "消", r: "け" }, { t: "し" }]);
    expect(furigana("映画", "えいが")).toEqual([{ t: "映画", r: "えいが" }]);
  });

  it("captions Yui's line the way the mockup shows it", async () => {
    const c = await lang.caption("いいですね！何の映画を見ましたか？");
    expect(c.segs).toEqual([
      { t: "いいですね！" }, { t: "何", r: "なん" }, { t: "の" }, { t: "映画", r: "えいが" },
      { t: "を" }, { t: "見", r: "み" }, { t: "ましたか？" },
    ]);
    expect(c.romaji).toBe("Ii desu ne! Nan no eiga o mimashita ka?");
  });

  it("every piece with kanji has a reading; kana pieces have none", async () => {
    const c = await lang.caption("週末は映画館に行きましたか？楽しかったですか？");
    for (const s of c.segs) expect(!!s.r).toBe(/[㐀-鿿]/.test(s.t));
  });

  it("romaji handles particles and small tsu", () => {
    expect(kanaToRomaji("きって")).toBe("kitte");
    expect(kanaToRomaji("しゅうまつ")).toBe("shuumatsu");
    expect(kanaToRomaji("こんにちは")).toBe("konnichiha");
  });
});

describe("detecting what he used", () => {
  const grammar = async (t: string) => [...detectGrammar(await analyze(t))].sort();

  it("polite past and plain forms", async () => {
    expect(await grammar("映画を見ました")).toEqual(["g:mashita", "g:masu"]);
    expect(await grammar("行きませんでした")).toEqual(["g:masen", "g:masen-deshita", "g:masu"].sort());
    expect(await grammar("食べたことがあります")).toEqual(["g:masu", "g:ta", "g:ta-koto-ga-aru"].sort());
  });
  it("い-adjective past", async () => {
    expect(await grammar("とてもおもしろかったです")).toContain("g:ku-nai-katta-ku-nakatta");
  });
  it("te forms", async () => {
    expect(await grammar("テレビを見ています")).toContain("g:te-iru");
    expect(await grammar("ゆっくり話してください")).toContain("g:te-kudasai");
    expect(await grammar("写真を撮ってもいいですか")).toContain("g:te-mo-ii");
  });
  it("finds words by dictionary form, including kana-only learner speech", async () => {
    const used = await lang.itemsUsed("昨日、映画を見ました");
    expect(used).toContain("w:映画:えいが");
    expect([...used].some((id) => id.startsWith("w:見る:"))).toBe(true);
    const kana = await lang.itemsUsed("きのうえいがをみました");
    expect([...kana].some((id) => id.startsWith("w:見る:"))).toBe(true);
  });
});
