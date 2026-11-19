import { SETTINGS } from "./settings.js";

const HOUR_MS = 3_600_000;

/** The session day an instant belongs to: "YYYY-MM-DD", 4am to 4am Tokyo time. */
export function dayKey(at: Date, s = SETTINGS): string {
  const shifted = new Date(at.getTime() + (s.timeZoneOffsetHours - s.dayRolloverHour) * HOUR_MS);
  return shifted.toISOString().slice(0, 10);
}

/** Whole days from day a to day b (b later = positive). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / (24 * HOUR_MS));
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(day) + n * 24 * HOUR_MS).toISOString().slice(0, 10);
}
