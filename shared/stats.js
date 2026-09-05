import { toUtcDayNumber } from './streak.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Format a UTC day number (days since epoch) as a "YYYY-MM-DD" string.
 * @param {number} dayNumber
 * @returns {string}
 */
export function dayNumberToISODate(dayNumber) {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Number of scheduled occurrences a habit of the given frequency has across a
 * span of days. Used as the denominator for completion rate.
 *
 * @param {string} frequency - 'daily' | 'weekly' | 'monthly'
 * @param {number} days - number of days the habit was active in the window
 * @returns {number}
 */
export function expectedOccurrences(frequency, days) {
  if (days <= 0) return 0;
  switch (frequency) {
    case 'weekly':
      return Math.ceil(days / 7);
    case 'monthly':
      return Math.ceil(days / 30);
    case 'daily':
    default:
      return days;
  }
}

/**
 * Aggregate completion statistics for a user over an inclusive day-number range.
 *
 * @param {Array<{habitId: string, dayNumber: number, xpReward: number}>} records
 *   completed records already filtered to the user (any date; filtered here).
 * @param {Array<{id: string, name: string, color: string, frequency: string,
 *   xpReward: number, createdDayNumber: number}>} habits - the user's habits.
 * @param {number} startDay - inclusive range start (day number).
 * @param {number} endDay - inclusive range end (day number).
 * @returns {{
 *   totalDays: number,
 *   totalCompletions: number,
 *   activeDays: number,
 *   xpEarned: number,
 *   completionRate: number,
 *   days: Array<{dayNumber: number, completions: number, xpEarned: number}>,
 *   perHabit: Array<object>
 * }}
 */
export function computeStats(records, habits, startDay, endDay) {
  const totalDays = Math.max(0, endDay - startDay + 1);
  const inRange = records.filter(
    (r) => r.dayNumber >= startDay && r.dayNumber <= endDay
  );

  // Bucket completions and XP by day.
  const byDay = new Map();
  for (const r of inRange) {
    const entry = byDay.get(r.dayNumber) || { completions: 0, xpEarned: 0 };
    entry.completions += 1;
    entry.xpEarned += r.xpReward;
    byDay.set(r.dayNumber, entry);
  }

  // Zero-filled day series across the whole range.
  const days = [];
  for (let d = startDay; d <= endDay; d++) {
    const entry = byDay.get(d) || { completions: 0, xpEarned: 0 };
    days.push({ dayNumber: d, completions: entry.completions, xpEarned: entry.xpEarned });
  }

  // Per-habit breakdown.
  const completionsByHabit = new Map();
  const xpByHabit = new Map();
  for (const r of inRange) {
    completionsByHabit.set(r.habitId, (completionsByHabit.get(r.habitId) || 0) + 1);
    xpByHabit.set(r.habitId, (xpByHabit.get(r.habitId) || 0) + r.xpReward);
  }

  let totalExpected = 0;
  const perHabit = habits.map((h) => {
    const completions = completionsByHabit.get(h.id) || 0;
    const xpEarned = xpByHabit.get(h.id) || 0;
    // A habit only counts from the day it was created.
    const effectiveStart = Math.max(startDay, h.createdDayNumber);
    const effectiveDays = Math.max(0, endDay - effectiveStart + 1);
    const expected = expectedOccurrences(h.frequency, effectiveDays);
    totalExpected += expected;
    const completionRate = expected > 0 ? Math.min(1, completions / expected) : 0;
    return {
      habitId: h.id,
      name: h.name,
      color: h.color,
      frequency: h.frequency,
      completions,
      expected,
      completionRate,
      xpEarned
    };
  });

  const totalCompletions = inRange.length;
  const xpEarned = inRange.reduce((sum, r) => sum + r.xpReward, 0);
  const completionRate =
    totalExpected > 0 ? Math.min(1, totalCompletions / totalExpected) : 0;

  return {
    totalDays,
    totalCompletions,
    activeDays: byDay.size,
    xpEarned,
    completionRate,
    days,
    perHabit
  };
}

/**
 * Convenience wrapper that derives day numbers from record/habit dates.
 *
 * @param {Array<{habitId: string, date: Date|string, xpReward: number}>} records
 * @param {Array<{id: string, name: string, color: string, frequency: string,
 *   xpReward: number, createdAt: Date|string}>} habits
 * @param {number} startDay
 * @param {number} endDay
 */
export function computeStatsFromDates(records, habits, startDay, endDay) {
  const mappedRecords = records.map((r) => ({
    habitId: r.habitId,
    dayNumber: toUtcDayNumber(r.date),
    xpReward: r.xpReward
  }));
  const mappedHabits = habits.map((h) => ({
    ...h,
    createdDayNumber: toUtcDayNumber(h.createdAt)
  }));
  return computeStats(mappedRecords, mappedHabits, startDay, endDay);
}
