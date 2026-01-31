import { describe, test, expect } from '@jest/globals';
import { xpForLevel, computeLevelInfo } from '../../utils/xp.js';

describe('XP Utilities', () => {
  describe('xpForLevel', () => {
    test('levels 1-10 require 100 XP each', () => {
      for (let i = 1; i <= 10; i++) {
        expect(xpForLevel(i)).toBe(100);
      }
    });

    test('levels 11-20 require 250 XP each', () => {
      for (let i = 11; i <= 20; i++) {
        expect(xpForLevel(i)).toBe(250);
      }
    });

    test('levels 21-30 require 500 XP each', () => {
      for (let i = 21; i <= 30; i++) {
        expect(xpForLevel(i)).toBe(500);
      }
    });

    test('levels 31+ require 1000 XP each', () => {
      expect(xpForLevel(31)).toBe(1000);
      expect(xpForLevel(50)).toBe(1000);
      expect(xpForLevel(100)).toBe(1000);
    });
  });

  describe('computeLevelInfo', () => {
    test('0 XP is level 1 with 0 xp', () => {
      const info = computeLevelInfo(0);
      expect(info.level).toBe(1);
      expect(info.xp).toBe(0);
      expect(info.xpToNextLevel).toBe(100);
    });

    test('50 XP is level 1 with 50 xp', () => {
      const info = computeLevelInfo(50);
      expect(info.level).toBe(1);
      expect(info.xp).toBe(50);
      expect(info.xpToNextLevel).toBe(100);
    });

    test('100 XP is level 2 with 0 xp', () => {
      const info = computeLevelInfo(100);
      expect(info.level).toBe(2);
      expect(info.xp).toBe(0);
      expect(info.xpToNextLevel).toBe(100);
    });

    test('1000 XP is level 11 with 0 xp (tier boundary)', () => {
      const info = computeLevelInfo(1000);
      expect(info.level).toBe(11);
      expect(info.xp).toBe(0);
      expect(info.xpToNextLevel).toBe(250);
    });

    test('999 XP is level 10 with 99 xp', () => {
      const info = computeLevelInfo(999);
      expect(info.level).toBe(10);
      expect(info.xp).toBe(99);
      expect(info.xpToNextLevel).toBe(100);
    });

    test('3500 XP transitions into tier 3 (level 21)', () => {
      // Levels 1-10: 10 * 100 = 1000
      // Levels 11-20: 10 * 250 = 2500
      // Total for level 21: 3500
      const info = computeLevelInfo(3500);
      expect(info.level).toBe(21);
      expect(info.xp).toBe(0);
      expect(info.xpToNextLevel).toBe(500);
    });

    test('8500 XP transitions into tier 4 (level 31)', () => {
      // Levels 1-10: 1000
      // Levels 11-20: 2500
      // Levels 21-30: 5000
      // Total for level 31: 8500
      const info = computeLevelInfo(8500);
      expect(info.level).toBe(31);
      expect(info.xp).toBe(0);
      expect(info.xpToNextLevel).toBe(1000);
    });

    test('partial XP within tier 2', () => {
      // 1000 + 125 = 1125
      const info = computeLevelInfo(1125);
      expect(info.level).toBe(11);
      expect(info.xp).toBe(125);
      expect(info.xpToNextLevel).toBe(250);
    });
  });
});
