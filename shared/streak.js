const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Convert a Date (or date-like value) to a UTC day number — the count of whole
 * days since the Unix epoch. HabitRecord dates are stored at UTC midnight, so
 * two records on the same calendar day map to the same integer, and
 * consecutive days differ by exactly 1.
 *
 * @param {Date|string|number} date
 * @returns {number}
 */
export function toUtcDayNumber(date) {
  const d = new Date(date);
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / MS_PER_DAY
  );
}

/**
 * Compute the current and longest daily streaks from a list of day numbers.
 *
 * A streak is a run of consecutive calendar days. The "current" streak counts
 * back from today (or yesterday, if today is not present, so an unlogged today
 * does not read as a broken streak). The "longest" streak is the best run
 * anywhere in the history.
 *
 * @param {number[]} dayNumbers - day numbers of completed days (duplicates ok).
 * @param {number} todayDayNumber - the day number to treat as "today".
 * @returns {{ current: number, longest: number }}
 */
export function streaksFromDayNumbers(dayNumbers, todayDayNumber) {
  const unique = [...new Set(dayNumbers)].sort((a, b) => a - b);
  if (unique.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Longest run of consecutive days anywhere in history.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    run = unique[i] - unique[i - 1] === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Current streak counts back from today (or yesterday if today is unlogged).
  const completed = new Set(unique);
  let cursor = todayDayNumber;
  if (!completed.has(cursor)) {
    cursor -= 1;
  }
  let current = 0;
  while (completed.has(cursor)) {
    current++;
    cursor -= 1;
  }

  return { current, longest };
}

/**
 * Compute current and longest streaks directly from record dates.
 *
 * @param {Array<Date|string|number>} dates - completed-day dates.
 * @param {Date|string|number} [today] - reference "today"; defaults to now.
 * @returns {{ current: number, longest: number }}
 */
export function computeStreaks(dates, today = new Date()) {
  const dayNumbers = dates.map(toUtcDayNumber);
  return streaksFromDayNumbers(dayNumbers, toUtcDayNumber(today));
}
