import { describe, test, expect } from '@jest/globals';
import { xpForLevel, totalXpForLevel, computeLevelInfo } from '../../../shared/xp.js';

describe('XP Utilities', () => {
  describe('xpForLevel', () => {
    test('follows a smooth +50 per level curve (100 + (level-1)*50)', () => {
      expect(xpForLevel(1)).toBe(100);
      expect(xpForLevel(2)).toBe(150);
      expect(xpForLevel(3)).toBe(200);
      expect(xpForLevel(5)).toBe(300);
      expect(xpForLevel(10)).toBe(550);
      expect(xpForLevel(11)).toBe(600);
      expect(xpForLevel(20)).toBe(1050);
    });

    test('strictly increases every level (no flat bands)', () => {
      for (let i = 1; i < 100; i++) {
        expect(xpForLevel(i + 1)).toBeGreaterThan(xpForLevel(i));
      }
    });

    test('clamps level below 1 to the level-1 cost', () => {
      expect(xpForLevel(0)).toBe(100);
      expect(xpForLevel(-5)).toBe(100);
    });
  });

  describe('totalXpForLevel', () => {
    test('cumulative XP to reach a level', () => {
      expect(totalXpForLevel(1)).toBe(0);
      expect(totalXpForLevel(2)).toBe(100);          // 100
      expect(totalXpForLevel(3)).toBe(250);          // 100 + 150
      expect(totalXpForLevel(4)).toBe(450);          // + 200
      expect(totalXpForLevel(5)).toBe(700);          // + 250
    });

    test('is consistent with xpForLevel', () => {
      let running = 0;
      for (let l = 1; l <= 30; l++) {
        expect(totalXpForLevel(l)).toBe(running);
        running += xpForLevel(l);
      }
    });
  });

  describe('computeLevelInfo', () => {
    test('0 XP is level 1 with 0 xp', () => {
      expect(computeLevelInfo(0)).toEqual({ level: 1, xp: 0, xpToNextLevel: 100 });
    });

    test('50 XP is level 1 with 50 xp', () => {
      expect(computeLevelInfo(50)).toEqual({ level: 1, xp: 50, xpToNextLevel: 100 });
    });

    test('100 XP dings level 2 (next level costs 150)', () => {
      expect(computeLevelInfo(100)).toEqual({ level: 2, xp: 0, xpToNextLevel: 150 });
    });

    test('partial progress within a level', () => {
      // Level 4 starts at 450; +249 stays in level 4 (which needs 250).
      expect(computeLevelInfo(699)).toEqual({ level: 4, xp: 249, xpToNextLevel: 250 });
    });

    test('exact level boundary', () => {
      // 700 total = start of level 5; level 5 needs 300.
      expect(computeLevelInfo(700)).toEqual({ level: 5, xp: 0, xpToNextLevel: 300 });
    });

    test('negative totals are treated as 0', () => {
      expect(computeLevelInfo(-100)).toEqual({ level: 1, xp: 0, xpToNextLevel: 100 });
    });

    test('level always matches the cumulative curve', () => {
      for (let l = 1; l <= 25; l++) {
        const info = computeLevelInfo(totalXpForLevel(l));
        expect(info.level).toBe(l);
        expect(info.xp).toBe(0);
        expect(info.xpToNextLevel).toBe(xpForLevel(l));
      }
    });
  });
});
