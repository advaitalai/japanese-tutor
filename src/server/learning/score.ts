import { SETTINGS } from "../../shared/settings.js";

export interface ScoreInput {
  masteredWords: number;
  masteredGrammar: number;
  accuracy: number; // 0..1, last 5 sessions
  understanding: number; // 0..1, last 5 sessions
}

export interface ScoreBreakdown {
  score: number; // 0..1, "X% of the way to N4"
  coverage: number;
  quality: number; // multiplier, 0.7..1
  words: number; // 0..1 of target
  grammar: number;
}

/** score = (0.55 × words/1500 + 0.45 × grammar/200) × (0.7 + 0.3 × (accuracy + understanding)/2) */
export function levelScore(i: ScoreInput, s = SETTINGS.score): ScoreBreakdown {
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const words = clamp(i.masteredWords / s.wordsTarget);
  const grammar = clamp(i.masteredGrammar / s.grammarTarget);
  const coverage = s.wordsWeight * words + s.grammarWeight * grammar;
  const quality = s.qualityFloor + (1 - s.qualityFloor) * ((clamp(i.accuracy) + clamp(i.understanding)) / 2);
  return { score: clamp(coverage * quality), coverage, quality, words, grammar };
}

/** Accuracy: his Japanese chat turns with no fix, divided by all his Japanese chat turns. */
export function accuracy(japaneseTurns: number, turnsWithFix: number): number {
  return japaneseTurns === 0 ? 1 : (japaneseTurns - turnsWithFix) / japaneseTurns;
}
