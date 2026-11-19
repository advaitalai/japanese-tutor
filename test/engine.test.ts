import { beforeAll, describe, expect, it } from "vitest";
import { loadTokenizer } from "../src/server/language/tokenizer.js";
import { flush, reply, setup } from "./helpers.js";

beforeAll(async () => void (await loadTokenizer()), 30_000);

const miruFix = { wrong: "みるました", right: "見ました", why: "Past polite: verb stem + ました", tag: "mashita" };

describe("turn engine", () => {
  it("S12: keeps a real fix, captions Yui's Japanese, saves both turns", async () => {
    const { engine, db } = setup([reply({ parts: [{ lang: "ja", text: "何の映画を見ましたか？" }], fixes: [miruFix] })]);
    const r = await engine.turn("きのう、えいがをみるました。");
    expect(r.fixes).toHaveLength(1);
    expect(r.fixes[0]!.right).toEqual([{ t: "見", r: "み" }, { t: "ました" }]);
    expect(r.parts[0]!.segs?.some((s) => s.r === "えいが")).toBe(true);
    expect((db.prepare("SELECT COUNT(*) n FROM turns").get() as { n: number }).n).toBe(2);
  });

  it("the fix's tag counts as a wrong use; other items he used count as correct", async () => {
    const { engine, db } = setup([reply({ fixes: [miruFix] })]);
    await engine.turn("きのう、えいがをみるました。");
    await flush();
    const uses = db.prepare("SELECT item, correct FROM uses").all() as { item: string; correct: number }[];
    expect(uses.find((u) => u.item === "g:mashita")?.correct).toBe(0);
    expect(uses.some((u) => u.item === "g:masu" && u.correct === 1)).toBe(true);
  });

  it("S19: goodbye ends the session even if the model misses it", async () => {
    const { engine, yui } = setup([reply({ mode: "chat", parts: [{ lang: "ja", text: "またね！" }] })]);
    const r = await engine.turn("またね！");
    expect(r.mode).toBe("end");
    expect(r.sessionDone).toBe(true);
    expect(yui.requests[0]!.notes.join(" ")).toContain("goodbye");
  });

  it("S19: the model can't end the session on its own", async () => {
    const { engine } = setup([reply({ mode: "end" })]);
    expect((await engine.turn("映画を見ました")).mode).toBe("chat");
  });

  it("S19: no goodbye from inside a sidebar", async () => {
    const { engine } = setup([
      reply({ mode: "sidebar", parts: [{ lang: "en", text: "It means 'which'." }] }),
      reply({ mode: "sidebar", parts: [{ lang: "en", text: "You say it at night." }] }),
    ]);
    await engine.turn("What does nan no mean?");
    expect((await engine.turn("what does oyasumi mean, bye?")).mode).toBe("sidebar");
  });

  it("S7: how do I say opens a sidebar even if the model misses it, and never fixes there (S11)", async () => {
    const { engine } = setup([reply({ mode: "chat", fixes: [{ ...miruFix, wrong: "coconut" }] })]);
    const r = await engine.turn("How do I say coconut?");
    expect(r.mode).toBe("sidebar");
    expect(r.fixes).toEqual([]);
  });

  it("drops fakes: a fix quoting words he never said", async () => {
    const { engine } = setup([reply({ fixes: [{ wrong: "たべるました", right: "食べました", why: "x", tag: "mashita" }] })]);
    expect((await engine.turn("映画を見ました")).fixes).toEqual([]);
  });

  it("no fixes on a turn speech-to-text wasn't sure about", async () => {
    const { engine } = setup([reply({ fixes: [miruFix] })]);
    expect((await engine.turn("きのう、えいがをみるました。", 0.3)).fixes).toEqual([]);
  });

  it("a word outside the syllabus becomes one of his own items", async () => {
    const { engine, db } = setup([reply({ fixes: [{ wrong: "キャンセル", right: "解約しました", why: "For contracts, use 解約", tag: "解約" }] })]);
    await engine.turn("サブスクをキャンセルしました");
    expect(db.prepare("SELECT id FROM own_items").all()).toEqual([{ id: "o:解約" }]);
  });

  it("S16/S18: Yui speaks first once per day, not again the same day", async () => {
    const { engine, yui, setNow } = setup([reply({ parts: [{ lang: "ja", text: "はじめまして！" }] }), reply({}), reply({ parts: [{ lang: "ja", text: "おかえりなさい！" }] })]);
    expect((await engine.open())?.parts[0]?.text).toBe("はじめまして！");
    expect(yui.requests[0]!.heard).toContain("first time");
    await engine.turn("こんにちは");
    expect(await engine.open()).toBeUndefined();
    setNow(new Date("2026-11-20T09:00:00+09:00"));
    await engine.open();
    expect(yui.requests[2]!.notes[0]).toContain("Greet him back");
    expect(yui.requests[2]!.learner).toContain("Days since you last talked: 1");
  });

  it("S17/S18: 03:59 Tokyo continues yesterday's session, 04:00 starts a new one", async () => {
    const { engine, db, setNow } = setup([reply({}), reply({})], new Date("2026-11-20T03:59:00+09:00"));
    await engine.turn("こんにちは");
    setNow(new Date("2026-11-20T04:00:00+09:00"));
    await engine.turn("こんにちは");
    expect((db.prepare("SELECT day FROM sessions ORDER BY day").all() as { day: string }[]).map((r) => r.day)).toEqual(["2026-11-19", "2026-11-20"]);
  });

  it("S4: her prompt carries recent fixes and asked words", async () => {
    const { engine, yui } = setup([
      reply({ fixes: [miruFix] }),
      reply({ mode: "sidebar", asked: ["何"], parts: [{ lang: "en", text: "It means what." }] }),
      reply({}),
    ]);
    await engine.turn("きのう、えいがをみるました。");
    await engine.turn("What does nan mean?");
    await engine.turn("わかった");
    expect(yui.requests[2]!.learner).toContain("みるました → 見ました");
    expect(yui.requests[2]!.learner).toContain("何");
  });
});
