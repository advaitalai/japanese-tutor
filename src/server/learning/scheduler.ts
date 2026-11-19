import { SETTINGS } from "../../shared/settings.js";
import { addDays, daysBetween } from "../../shared/day.js";
import type { ItemKind, Level } from "../../shared/types.js";
import type { MasteryResult } from "./mastery.js";

export interface SyllabusItem {
  id: string;
  kind?: ItemKind;
  level: Level;
  order: number; // position in the syllabus
  prereqs: string[];
  elicit?: string; // how Yui can set it up
}

export interface ItemProgress {
  mastery: MasteryResult;
  known: boolean;
  fixesRecent: string[]; // days of fixes in the last 7 days
  lastCorrectDay?: string;
}

export type Slot = "repair" | "review" | "new";

export interface Target {
  slot: Slot;
  itemId: string;
  why: string;
}

export interface ScheduleInput {
  today: string;
  items: SyllabusItem[];
  progress: Map<string, ItemProgress>;
  understanding?: number; // last 5 sessions; undefined before any grading
}

export function nextDue(m: MasteryResult, s = SETTINGS): string | undefined {
  if (!m.lastPracticeDay || m.correctDaysTotal === 0) return undefined;
  const steps = s.reviewIntervalsDays;
  const interval = steps[Math.min(m.correctDaysTotal, steps.length) - 1]!;
  return addDays(m.lastPracticeDay, interval);
}

const levelRank = (l: Level) => (l === "N5" ? 0 : l === "N4" ? 1 : 2);

/** Picks today's targets: up to 2 repair, up to 3 review, then new items. */
export function schedule(input: ScheduleInput, s = SETTINGS): Target[] {
  const { today, items, progress } = input;
  const byId = new Map(items.map((i) => [i.id, i]));
  const picked = new Set<string>();
  const targets: Target[] = [];

  // Repair: fixed in the last 7 days and not used correctly since.
  const repair = items
    .map((item) => ({ item, p: progress.get(item.id) }))
    .filter(({ p }) => {
      if (!p || p.fixesRecent.length === 0) return false;
      const lastFix = [...p.fixesRecent].sort().at(-1)!;
      return daysBetween(lastFix, today) <= s.recentFixDays && !(p.lastCorrectDay && p.lastCorrectDay > lastFix);
    })
    .sort(
      (a, b) =>
        b.p!.fixesRecent.length - a.p!.fixesRecent.length ||
        [...b.p!.fixesRecent].sort().at(-1)!.localeCompare([...a.p!.fixesRecent].sort().at(-1)!) ||
        levelRank(a.item.level) - levelRank(b.item.level),
    );
  for (const { item, p } of repair.slice(0, s.slots.repair)) {
    picked.add(item.id);
    const n = p!.fixesRecent.length;
    targets.push({ slot: "repair", itemId: item.id, why: n > 1 ? `Fixed ${n} times this week` : "Fixed this week" });
  }

  // Review: items with a correct day whose next date has come, most overdue first.
  const due = items
    .map((item) => {
      const p = progress.get(item.id);
      const d = p ? nextDue(p.mastery, s) : undefined;
      return { item, d, overdue: d ? daysBetween(d, today) : -1 };
    })
    .filter((x) => x.d !== undefined && x.overdue >= 0 && !picked.has(x.item.id))
    .sort((a, b) => b.overdue - a.overdue || a.item.order - b.item.order);
  for (const { item, overdue } of due.slice(0, s.slots.review)) {
    picked.add(item.id);
    targets.push({ slot: "review", itemId: item.id, why: overdue === 0 ? "Due today" : `Due, ${overdue} days overdue` });
  }

  // New: next unseen syllabus items whose prerequisites are known.
  let newCount: number = s.slots.newItems;
  if (due.length > s.newItemsZeroAtDue) newCount = 0;
  else if (due.length > s.newItemsDropAtDue) newCount = 1;
  if (input.understanding !== undefined && input.understanding < s.minUnderstandingForNew) newCount = 0;

  const fresh = items
    .filter((item) => {
      const p = progress.get(item.id);
      if (picked.has(item.id) || item.level === "own") return false;
      if (p && p.mastery.state !== "unseen") return false;
      return item.prereqs.every((id) => progress.get(id)?.known || byId.get(id) === undefined);
    })
    .sort((a, b) => a.order - b.order);
  // Rotate kinds so a day mixes grammar, words and sets instead of draining one list.
  const kinds: ItemKind[] = ["grammar", "word", "set"];
  const start = Math.floor(Date.parse(today) / 86_400_000) % kinds.length;
  const queues = kinds.map((_, k) => fresh.filter((i) => (i.kind ?? "word") === kinds[(start + k) % kinds.length]));
  for (let round = 0; targets.filter((t) => t.slot === "new").length < newCount && queues.some((q) => q.length); round++) {
    const q = queues[round % queues.length]!;
    const item = q.shift();
    if (!item) continue;
    picked.add(item.id);
    targets.push({ slot: "new", itemId: item.id, why: "Next on the list" });
  }
  return targets;
}
