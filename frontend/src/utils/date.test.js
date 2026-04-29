import { describe, test, expect } from 'vitest';
import { localDateString, localTomorrowString } from './date.js';

describe('localDateString', () => {
  test('should format date as YYYY-MM-DD in local timezone', () => {
    const d = new Date(2024, 0, 15); // Jan 15, 2024 local
    expect(localDateString(d)).toBe('2024-01-15');
  });

  test('should pad single-digit month and day', () => {
    const d = new Date(2024, 2, 5); // Mar 5, 2024 local
    expect(localDateString(d)).toBe('2024-03-05');
  });

  test('should use current date when no argument provided', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(localDateString()).toBe(expected);
  });

  test('should return local date, not UTC date, near midnight', () => {
    // Simulate 11:30 PM on Jan 15 local time
    const d = new Date(2024, 0, 15, 23, 30, 0);
    expect(localDateString(d)).toBe('2024-01-15');
  });

  test('should differ from toISOString when UTC date rolls over', () => {
    // At 11pm in UTC-5, toISOString gives next day's date.
    // localDateString should still give the local date.
    const d = new Date(2024, 0, 15, 23, 30, 0);
    const localResult = localDateString(d);
    // Local date should always be Jan 15 regardless of UTC offset
    expect(localResult).toBe('2024-01-15');
  });
});

describe('localTomorrowString', () => {
  test('should return the next day in YYYY-MM-DD format', () => {
    const d = new Date(2024, 0, 15); // Jan 15
    expect(localTomorrowString(d)).toBe('2024-01-16');
  });

  test('should handle month boundary', () => {
    const d = new Date(2024, 0, 31); // Jan 31
    expect(localTomorrowString(d)).toBe('2024-02-01');
  });

  test('should handle year boundary', () => {
    const d = new Date(2024, 11, 31); // Dec 31
    expect(localTomorrowString(d)).toBe('2025-01-01');
  });

  test('should handle leap year', () => {
    const d = new Date(2024, 1, 28); // Feb 28, 2024 (leap year)
    expect(localTomorrowString(d)).toBe('2024-02-29');
  });

  test('should not mutate the input date', () => {
    const d = new Date(2024, 0, 15);
    const original = d.getTime();
    localTomorrowString(d);
    expect(d.getTime()).toBe(original);
  });

  test('should use current date when no argument provided', () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expected = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    expect(localTomorrowString()).toBe(expected);
  });
});
