import { describe, test, expect } from '@jest/globals';
import {
  toUtcDayNumber,
  streaksFromDayNumbers,
  computeStreaks
} from '../../../shared/streak.js';

describe('Streak Utilities', () => {
  describe('toUtcDayNumber', () => {
    test('maps records on the same UTC day to the same integer', () => {
      const a = toUtcDayNumber(new Date('2024-01-15T00:00:00.000Z'));
      const b = toUtcDayNumber(new Date('2024-01-15T23:59:59.000Z'));
      expect(a).toBe(b);
    });

    test('consecutive UTC days differ by exactly 1', () => {
      const d1 = toUtcDayNumber(new Date('2024-01-15T00:00:00.000Z'));
      const d2 = toUtcDayNumber(new Date('2024-01-16T00:00:00.000Z'));
      expect(d2 - d1).toBe(1);
    });

    test('accepts YYYY-MM-DD strings', () => {
      expect(toUtcDayNumber('2024-01-16') - toUtcDayNumber('2024-01-15')).toBe(1);
    });
  });

  describe('streaksFromDayNumbers', () => {
    const today = toUtcDayNumber('2024-01-15');

    test('returns zeros for no days', () => {
      expect(streaksFromDayNumbers([], today)).toEqual({ current: 0, longest: 0 });
    });

    test('counts a consecutive run ending today', () => {
      const days = ['2024-01-13', '2024-01-14', '2024-01-15'].map(toUtcDayNumber);
      expect(streaksFromDayNumbers(days, today)).toEqual({ current: 3, longest: 3 });
    });

    test('an unlogged today does not break the current streak', () => {
      const days = ['2024-01-12', '2024-01-13', '2024-01-14'].map(toUtcDayNumber);
      expect(streaksFromDayNumbers(days, today)).toEqual({ current: 3, longest: 3 });
    });

    test('current is 0 when the latest day is older than yesterday', () => {
      const days = ['2024-01-10', '2024-01-11', '2024-01-12'].map(toUtcDayNumber);
      expect(streaksFromDayNumbers(days, today)).toEqual({ current: 0, longest: 3 });
    });

    test('longest reflects the best past run, not the current one', () => {
      const days = [
        '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05',
        '2024-01-14', '2024-01-15'
      ].map(toUtcDayNumber);
      expect(streaksFromDayNumbers(days, today)).toEqual({ current: 2, longest: 5 });
    });

    test('collapses duplicate days and tolerates unsorted input', () => {
      const days = ['2024-01-15', '2024-01-15', '2024-01-13', '2024-01-14'].map(toUtcDayNumber);
      expect(streaksFromDayNumbers(days, today)).toEqual({ current: 3, longest: 3 });
    });
  });

  describe('computeStreaks', () => {
    test('computes from record dates against a reference today', () => {
      const dates = [
        new Date('2024-01-14T00:00:00.000Z'),
        new Date('2024-01-15T00:00:00.000Z')
      ];
      expect(computeStreaks(dates, new Date('2024-01-15T12:00:00.000Z'))).toEqual({
        current: 2,
        longest: 2
      });
    });
  });
});
