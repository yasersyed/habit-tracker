import { localDateString } from './date.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute the current and longest daily completion streaks for a habit.
 *
 * A streak is a run of consecutive calendar days on which the habit was
 * completed. The "current" streak counts back from today (or yesterday, if
 * today has not been completed yet, so an unlogged today does not read as a
 * broken streak). The "longest" streak is the best run anywhere in history.
 *
 * @param {string[]} dateStrings - "YYYY-MM-DD" strings for completed days
 *   (duplicates are allowed and collapsed).
 * @param {Date} [today] - reference "today", defaults to the current date.
 * @returns {{ current: number, longest: number }}
 */
export function computeStreaks(dateStrings, today = new Date()) {
  const unique = [...new Set(dateStrings)].sort();
  if (unique.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Longest run of consecutive days anywhere in history.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const diffDays = Math.round(
      (new Date(unique[i]) - new Date(unique[i - 1])) / MS_PER_DAY
    );
    run = diffDays === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Current streak counts back from today (or yesterday if today is unlogged).
  const completed = new Set(unique);
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  if (!completed.has(localDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let current = 0;
  while (completed.has(localDateString(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
}
