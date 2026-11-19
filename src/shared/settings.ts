// Every tunable number in one place. The spec calls these settings, not rules.
export const SETTINGS = {
  timeZoneOffsetHours: 9, // Tokyo, no daylight saving
  dayRolloverHour: 4, // a session is 4am to 4am Tokyo time
  activeGapCapSeconds: 90, // a gap between turns counts up to this much talk time
  masteryDays: 3, // correct use on this many different days = mastered
  // Days until an item is due again, by how many correct days it has ever had.
  reviewIntervalsDays: [1, 3, 7, 21],
  recentFixDays: 7,
  slots: { repair: 2, review: 3, newItems: 2 },
  newItemsDropAtDue: 10, // more due than this: 1 new item
  newItemsZeroAtDue: 20, // more due than this: no new items
  minUnderstandingForNew: 0.95,
  score: {
    // Real syllabus counts through N4: 1,304 words + 84 set members, 179 grammar points.
    wordsTarget: 1388,
    grammarTarget: 179,
    wordsWeight: 0.55,
    grammarWeight: 0.45,
    qualityFloor: 0.7,
    lastSessions: 5,
  },
} as const;
