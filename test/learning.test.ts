import { describe, expect, it } from "vitest";
import { dayKey } from "../src/shared/day.js";
import { summaryLine } from "../src/shared/summary.js";
import { mastery, usedWellOn } from "../src/server/learning/mastery.js";
import { activeSeconds } from "../src/server/learning/activeTime.js";
import { accuracy, levelScore } from "../src/server/learning/score.js";
import { SETTINGS } from "../src/shared/settings.js";

describe("S18 day rollover at 4am Tokyo time", () => {
  it("03:59 Tokyo still belongs to the previous day", () => {
    expect(dayKey(new Date("2026-11-19T03:59:00+09:00"))).toBe("2026-11-18");
  });
  it("04:00 Tokyo starts a new day", () => {
    expect(dayKey(new Date("2026-11-19T04:00:00+09:00"))).toBe("2026-11-19");
  });
  it("late evening is the same day", () => {
    expect(dayKey(new Date("2026-11-19T23:30:00+09:00"))).toBe("2026-11-19");
  });
});

describe("S19 summary line", () => {
  it("reads minutes, used well, fixes", () => {
    expect(summaryLine({ minutes: 12, usedWell: 4, fixes: 3 })).toBe("12 min · 4 used well · 3 fixes");
  });
  it("leaves out used well until graded", () => {
    expect(summaryLine({ minutes: 9.4, fixes: 1 })).toBe("9 min · 1 fix");
  });
  it("says no fixes", () => {
    expect(summaryLine({ minutes: 5, usedWell: 0, fixes: 0 })).toBe("5 min · 0 used well · no fixes");
  });
});

describe("S24 mastery takes 3 days", () => {
  const d = (day: string, correct: number, wrong = 0) => ({ day, correct, wrong });
  it("3 correct days = mastered", () => {
    expect(mastery([d("2026-11-01", 2), d("2026-11-03", 1), d("2026-11-04", 1)]).state).toBe("mastered");
  });
  it("3 correct uses on one day is still learning", () => {
    expect(mastery([d("2026-11-01", 3)]).state).toBe("learning");
  });
  it("2 correct days and 1 fixed day = 1 day, learning", () => {
    const m = mastery([d("2026-11-01", 1), d("2026-11-02", 1), d("2026-11-03", 0, 1)]);
    expect(m).toMatchObject({ state: "learning", netDays: 1 });
  });
  it("a mixed day counts as wrong", () => {
    const m = mastery([d("2026-11-01", 1), d("2026-11-02", 2, 1)]);
    expect(m.netDays).toBe(0);
  });
  it("a wrong use drops a mastered item back to learning", () => {
    const m = mastery([d("2026-11-01", 1), d("2026-11-02", 1), d("2026-11-03", 1), d("2026-11-04", 1), d("2026-11-20", 0, 1)]);
    expect(m.state).toBe("learning");
  });
  it("used well = correct today with no wrong use today", () => {
    expect(usedWellOn("2026-11-02", [d("2026-11-02", 1)])).toBe(true);
    expect(usedWellOn("2026-11-02", [d("2026-11-02", 1, 1)])).toBe(false);
  });
});

describe("S27 talk time", () => {
  it("caps each gap at 90 seconds", () => {
    const t = (s: number) => new Date(Date.UTC(2026, 10, 19, 0, 0, s));
    expect(activeSeconds([t(0), t(20), t(500), t(530)])).toBe(20 + 90 + 30);
  });
});

describe("S25 level score", () => {
  it("matches the spec's worked example (about 6%)", () => {
    // The spec's example used 1,500 words / 200 grammar points; the formula must still give 6.3%.
    const specTargets = { ...SETTINGS.score, wordsTarget: 1500, grammarTarget: 200 };
    const r = levelScore({ masteredWords: 96, masteredGrammar: 14, accuracy: 0.71, understanding: 0.96 }, specTargets);
    expect(r.score).toBeCloseTo(0.0634, 3);
  });
  it("accuracy counts Japanese turns only", () => {
    expect(accuracy(10, 3)).toBeCloseTo(0.7);
    expect(accuracy(0, 0)).toBe(1);
  });
});
