import { describe, expect, it } from "vitest";
import { nextDue, schedule, type ItemProgress, type SyllabusItem } from "../src/server/learning/scheduler.js";
import { mastery } from "../src/server/learning/mastery.js";

const item = (id: string, order: number, prereqs: string[] = [], level: "N5" | "N4" = "N5"): SyllabusItem => ({ id, level, order, prereqs });
const prog = (days: [string, number, number][], extra: Partial<ItemProgress> = {}): ItemProgress => ({
  mastery: mastery(days.map(([day, correct, wrong]) => ({ day, correct, wrong }))),
  known: true,
  fixesRecent: [],
  ...extra,
});

describe("S26 scheduler", () => {
  it("spaces reviews 1, 3, 7, then 21 days", () => {
    expect(nextDue(mastery([{ day: "2026-11-01", correct: 1, wrong: 0 }]))).toBe("2026-11-02");
    expect(nextDue(mastery([{ day: "2026-11-01", correct: 1, wrong: 0 }, { day: "2026-11-02", correct: 1, wrong: 0 }]))).toBe("2026-11-05");
  });

  it("picks repair, then review, then new, in that order", () => {
    const items = [item("mashita", 1), item("ni-place", 2), item("eiga", 3), item("tai", 4), item("tekudasai", 5), item("senshuu", 6)];
    const progress = new Map<string, ItemProgress>([
      ["mashita", prog([["2026-11-17", 0, 1]], { fixesRecent: ["2026-11-15", "2026-11-17"] })],
      ["ni-place", prog([["2026-11-18", 0, 1]], { fixesRecent: ["2026-11-18"] })],
      ["eiga", prog([["2026-11-16", 1, 0]])],
      ["tai", prog([["2026-11-15", 1, 0]])],
    ]);
    const t = schedule({ today: "2026-11-19", items, progress, understanding: 0.97 });
    expect(t.map((x) => [x.slot, x.itemId])).toEqual([
      ["repair", "mashita"],
      ["repair", "ni-place"],
      ["review", "tai"],
      ["review", "eiga"],
      ["new", "tekudasai"],
      ["new", "senshuu"],
    ]);
  });

  it("a fix followed by a correct use is no longer a repair", () => {
    const items = [item("mashita", 1)];
    const progress = new Map([["mashita", prog([["2026-11-17", 0, 1], ["2026-11-18", 1, 0]], { fixesRecent: ["2026-11-17"], lastCorrectDay: "2026-11-18" })]]);
    expect(schedule({ today: "2026-11-19", items, progress }).some((x) => x.slot === "repair")).toBe(false);
  });

  it("no new items when understanding is below 95%", () => {
    const items = [item("a", 1), item("b", 2)];
    expect(schedule({ today: "2026-11-19", items, progress: new Map(), understanding: 0.9 })).toEqual([]);
  });

  it("new items wait for their prerequisites to be known", () => {
    const items = [item("masu", 1), item("mashita", 2, ["masu"])];
    const progress = new Map([["masu", prog([], { known: false })]]);
    const t = schedule({ today: "2026-11-19", items, progress });
    expect(t.map((x) => x.itemId)).toEqual(["masu"]);
  });
});
