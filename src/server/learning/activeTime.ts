import { SETTINGS } from "../../shared/settings.js";

/** Talk time: gaps between consecutive turns, each capped, so a long pause adds little. */
export function activeSeconds(turnTimes: Date[], s = SETTINGS): number {
  const t = [...turnTimes].map((d) => d.getTime()).sort((a, b) => a - b);
  let total = 0;
  for (let i = 1; i < t.length; i++) {
    const gap = (t[i]! - t[i - 1]!) / 1000;
    total += Math.min(Math.max(gap, 0), s.activeGapCapSeconds);
  }
  return total;
}
