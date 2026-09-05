import { describe, test, expect } from '@jest/globals';
import { toUtcDayNumber } from '../../../shared/streak.js';
import {
  expectedOccurrences,
  dayNumberToISODate,
  computeStats,
  computeStatsFromDates
} from '../../../shared/stats.js';

const day = (ymd) => toUtcDayNumber(ymd);

describe('Statistics Utilities', () => {
  describe('dayNumberToISODate', () => {
    test('round-trips with toUtcDayNumber', () => {
      expect(dayNumberToISODate(toUtcDayNumber('2024-03-10'))).toBe('2024-03-10');
    });
  });

  describe('expectedOccurrences', () => {
    test('daily is one per day', () => {
      expect(expectedOccurrences('daily', 10)).toBe(10);
    });
    test('weekly rounds up per 7 days', () => {
      expect(expectedOccurrences('weekly', 7)).toBe(1);
      expect(expectedOccurrences('weekly', 8)).toBe(2);
    });
    test('monthly rounds up per 30 days', () => {
      expect(expectedOccurrences('monthly', 30)).toBe(1);
      expect(expectedOccurrences('monthly', 31)).toBe(2);
    });
    test('zero or negative days yields 0', () => {
      expect(expectedOccurrences('daily', 0)).toBe(0);
      expect(expectedOccurrences('daily', -5)).toBe(0);
    });
    test('unknown frequency defaults to daily', () => {
      expect(expectedOccurrences('yearly', 5)).toBe(5);
    });
  });

  describe('computeStats', () => {
    const habits = [
      { id: 'h1', name: 'Read', color: '#111', frequency: 'daily', xpReward: 10, createdDayNumber: day('2024-01-01') }
    ];

    test('returns zeros with no records', () => {
      const stats = computeStats([], habits, day('2024-01-01'), day('2024-01-10'));
      expect(stats.totalCompletions).toBe(0);
      expect(stats.activeDays).toBe(0);
      expect(stats.xpEarned).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.totalDays).toBe(10);
      expect(stats.days).toHaveLength(10);
      expect(stats.days.every((d) => d.completions === 0 && d.xpEarned === 0)).toBe(true);
    });

    test('aggregates completions, active days and XP', () => {
      const records = [
        { habitId: 'h1', dayNumber: day('2024-01-02'), xpReward: 10 },
        { habitId: 'h1', dayNumber: day('2024-01-03'), xpReward: 10 },
        { habitId: 'h1', dayNumber: day('2024-01-05'), xpReward: 10 }
      ];
      const stats = computeStats(records, habits, day('2024-01-01'), day('2024-01-10'));
      expect(stats.totalCompletions).toBe(3);
      expect(stats.activeDays).toBe(3);
      expect(stats.xpEarned).toBe(30);
      // 3 of 10 expected daily occurrences
      expect(stats.completionRate).toBeCloseTo(0.3, 5);
    });

    test('zero-filled day series carries per-day totals', () => {
      const records = [
        { habitId: 'h1', dayNumber: day('2024-01-02'), xpReward: 10 },
        { habitId: 'h1', dayNumber: day('2024-01-02'), xpReward: 10 }
      ];
      const stats = computeStats(records, habits, day('2024-01-01'), day('2024-01-03'));
      expect(stats.days.map((d) => d.completions)).toEqual([0, 2, 0]);
      expect(stats.days.map((d) => d.xpEarned)).toEqual([0, 20, 0]);
    });

    test('expected occurrences start from the habit creation day', () => {
      const lateHabit = [
        { id: 'h2', name: 'Run', color: '#222', frequency: 'daily', xpReward: 5, createdDayNumber: day('2024-01-08') }
      ];
      const records = [
        { habitId: 'h2', dayNumber: day('2024-01-08'), xpReward: 5 },
        { habitId: 'h2', dayNumber: day('2024-01-09'), xpReward: 5 }
      ];
      // Window is 10 days but the habit only existed for 3 (Jan 8-10).
      const stats = computeStats(records, lateHabit, day('2024-01-01'), day('2024-01-10'));
      expect(stats.perHabit[0].expected).toBe(3);
      expect(stats.perHabit[0].completions).toBe(2);
      expect(stats.perHabit[0].completionRate).toBeCloseTo(2 / 3, 5);
    });

    test('completion rate is capped at 1', () => {
      const weekly = [
        { id: 'h3', name: 'Weekly', color: '#333', frequency: 'weekly', xpReward: 5, createdDayNumber: day('2024-01-01') }
      ];
      // Logged 3 times in a 7-day window where only 1 is expected.
      const records = [
        { habitId: 'h3', dayNumber: day('2024-01-01'), xpReward: 5 },
        { habitId: 'h3', dayNumber: day('2024-01-03'), xpReward: 5 },
        { habitId: 'h3', dayNumber: day('2024-01-05'), xpReward: 5 }
      ];
      const stats = computeStats(records, weekly, day('2024-01-01'), day('2024-01-07'));
      expect(stats.perHabit[0].completionRate).toBe(1);
    });

    test('excludes records outside the range', () => {
      const records = [
        { habitId: 'h1', dayNumber: day('2023-12-31'), xpReward: 10 },
        { habitId: 'h1', dayNumber: day('2024-01-05'), xpReward: 10 },
        { habitId: 'h1', dayNumber: day('2024-01-20'), xpReward: 10 }
      ];
      const stats = computeStats(records, habits, day('2024-01-01'), day('2024-01-10'));
      expect(stats.totalCompletions).toBe(1);
      expect(stats.xpEarned).toBe(10);
    });
  });

  describe('computeStatsFromDates', () => {
    test('derives day numbers from record and habit dates', () => {
      const records = [
        { habitId: 'h1', date: new Date('2024-01-02T00:00:00.000Z'), xpReward: 10 }
      ];
      const habits = [
        { id: 'h1', name: 'Read', color: '#111', frequency: 'daily', xpReward: 10, createdAt: new Date('2024-01-01T00:00:00.000Z') }
      ];
      const stats = computeStatsFromDates(records, habits, day('2024-01-01'), day('2024-01-05'));
      expect(stats.totalCompletions).toBe(1);
      expect(stats.perHabit[0].expected).toBe(5);
    });
  });
});
