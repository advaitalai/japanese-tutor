import { SETTINGS } from "../../shared/settings.js";

/** One item's uses on one day. */
export interface DayUses {
  day: string; // "YYYY-MM-DD"
  correct: number;
  wrong: number;
}

export type MasteryState = "unseen" | "learning" | "mastered";

export interface MasteryResult {
  state: MasteryState;
  netDays: number; // 0 to masteryDays
  correctDaysTotal: number; // every correct day ever, for spacing
  lastPracticeDay?: string;
}

/**
 * Mastery rule: correct use on 3 different days = mastered. A day with any wrong use
 * counts as wrong and removes one day, so a mastered item drops back to learning.
 */
export function mastery(days: DayUses[], s = SETTINGS): MasteryResult {
  const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day));
  let net = 0;
  let correctDaysTotal = 0;
  let lastPracticeDay: string | undefined;
  for (const d of sorted) {
    if (d.wrong > 0) {
      net = Math.max(0, net - 1);
      lastPracticeDay = d.day;
    } else if (d.correct > 0) {
      net = Math.min(s.masteryDays, net + 1);
      correctDaysTotal += 1;
      lastPracticeDay = d.day;
    }
  }
  const state: MasteryState = net >= s.masteryDays ? "mastered" : net > 0 ? "learning" : "unseen";
  return { state, netDays: net, correctDaysTotal, lastPracticeDay };
}

/** "Used well" today: used correctly today with no wrong use today. */
export function usedWellOn(day: string, days: DayUses[]): boolean {
  const d = days.find((x) => x.day === day);
  return !!d && d.correct > 0 && d.wrong === 0;
}
