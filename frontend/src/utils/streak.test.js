import { describe, test, expect } from 'vitest';
import { computeStreaks } from './streak.js';

const TODAY = new Date(2024, 0, 15); // Jan 15, 2024 local

describe('computeStreaks', () => {
  test('returns zeros for no completions', () => {
    expect(computeStreaks([], TODAY)).toEqual({ current: 0, longest: 0 });
  });

  test('counts a single completion today', () => {
    expect(computeStreaks(['2024-01-15'], TODAY)).toEqual({ current: 1, longest: 1 });
  });

  test('counts consecutive days ending today', () => {
    const dates = ['2024-01-13', '2024-01-14', '2024-01-15'];
    expect(computeStreaks(dates, TODAY)).toEqual({ current: 3, longest: 3 });
  });

  test('an unlogged today does not break the current streak', () => {
    // Today (Jan 15) not completed, but yesterday and before were.
    const dates = ['2024-01-12', '2024-01-13', '2024-01-14'];
    expect(computeStreaks(dates, TODAY)).toEqual({ current: 3, longest: 3 });
  });

  test('current streak is 0 when the last completion is older than yesterday', () => {
    const dates = ['2024-01-10', '2024-01-11', '2024-01-12'];
    const result = computeStreaks(dates, TODAY);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(3);
  });

  test('longest streak reflects the best past run, not the current one', () => {
    // A 5-day run in the past, a broken gap, then a 2-day current run.
    const dates = [
      '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05',
      '2024-01-14', '2024-01-15'
    ];
    expect(computeStreaks(dates, TODAY)).toEqual({ current: 2, longest: 5 });
  });

  test('collapses duplicate dates', () => {
    const dates = ['2024-01-15', '2024-01-15', '2024-01-14'];
    expect(computeStreaks(dates, TODAY)).toEqual({ current: 2, longest: 2 });
  });

  test('handles unsorted input', () => {
    const dates = ['2024-01-15', '2024-01-13', '2024-01-14'];
    expect(computeStreaks(dates, TODAY)).toEqual({ current: 3, longest: 3 });
  });
});
