export interface SummaryParts {
  minutes: number;
  usedWell?: number; // undefined until the day is graded
  fixes: number;
}

/** "12 min · 4 used well · 3 fixes". Used everywhere a session is summarized. */
export function summaryLine({ minutes, usedWell, fixes }: SummaryParts): string {
  const parts = [`${Math.round(minutes)} min`];
  if (usedWell !== undefined) parts.push(`${usedWell} used well`);
  parts.push(fixes === 0 ? "no fixes" : fixes === 1 ? "1 fix" : `${fixes} fixes`);
  return parts.join(" · ");
}
