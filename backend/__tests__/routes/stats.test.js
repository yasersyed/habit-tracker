import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import statsRoutes from '../../routes/stats.js';
import Habit from '../../models/Habit.js';
import HabitRecord from '../../models/HabitRecord.js';
import { setupTestDB, clearTestDB, teardownTestDB, createAuthenticatedUser } from '../setup.js';

const app = express();
app.use(express.json());
app.use('/api/stats', statsRoutes);

const completedOn = (habitId, userId, ymd) => ({
  habitId,
  userId,
  date: new Date(`${ymd}T00:00:00.000Z`),
  completed: true
});

describe('Stats Routes', () => {
  let testUser;
  let authToken;
  let habit;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    const auth = await createAuthenticatedUser();
    testUser = auth.user;
    authToken = auth.token;
    habit = await Habit.create({
      userId: testUser._id,
      name: 'Read',
      frequency: 'daily',
      xpReward: 10,
      color: '#111',
      createdAt: new Date('2024-01-01T00:00:00.000Z')
    });
  });

  const auth = (req) => req.set('Authorization', `Bearer ${authToken}`);

  describe('GET /api/stats/summary', () => {
    test('returns aggregated KPIs for the range', async () => {
      await HabitRecord.create([
        completedOn(habit._id, testUser._id, '2024-01-02'),
        completedOn(habit._id, testUser._id, '2024-01-03'),
        completedOn(habit._id, testUser._id, '2024-01-05')
      ]);

      const response = await auth(
        request(app)
          .get('/api/stats/summary')
          .query({ startDate: '2024-01-01', endDate: '2024-01-10' })
      );

      expect(response.status).toBe(200);
      expect(response.body.range).toEqual({ startDate: '2024-01-01', endDate: '2024-01-10', days: 10 });
      expect(response.body.habitCount).toBe(1);
      expect(response.body.totalCompletions).toBe(3);
      expect(response.body.activeDays).toBe(3);
      expect(response.body.xpEarned).toBe(30);
      expect(response.body.completionRate).toBeCloseTo(0.3, 5);
    });

    test('excludes incomplete records and other users', async () => {
      const other = await createAuthenticatedUser({ username: 'other', email: 'other@example.com' });
      const otherHabit = await Habit.create({ userId: other.user._id, name: 'Theirs', xpReward: 10 });

      await HabitRecord.create([
        completedOn(habit._id, testUser._id, '2024-01-02'),
        { habitId: habit._id, userId: testUser._id, date: new Date('2024-01-03T00:00:00.000Z'), completed: false },
        completedOn(otherHabit._id, other.user._id, '2024-01-02')
      ]);

      const response = await auth(
        request(app)
          .get('/api/stats/summary')
          .query({ startDate: '2024-01-01', endDate: '2024-01-10' })
      );

      expect(response.status).toBe(200);
      expect(response.body.totalCompletions).toBe(1);
      expect(response.body.xpEarned).toBe(10);
    });

    test('defaults to a 30-day window when no range is given', async () => {
      const response = await auth(request(app).get('/api/stats/summary'));
      expect(response.status).toBe(200);
      expect(response.body.range.days).toBe(30);
    });

    test('returns 400 when startDate is after endDate', async () => {
      const response = await auth(
        request(app)
          .get('/api/stats/summary')
          .query({ startDate: '2024-01-10', endDate: '2024-01-01' })
      );
      expect(response.status).toBe(400);
    });

    test('returns 400 for an invalid date', async () => {
      const response = await auth(
        request(app).get('/api/stats/summary').query({ startDate: 'nope' })
      );
      expect(response.status).toBe(400);
    });

    test('returns 401 without authentication', async () => {
      const response = await request(app).get('/api/stats/summary');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/stats/daily', () => {
    test('returns a zero-filled series with cumulative XP', async () => {
      await HabitRecord.create([
        completedOn(habit._id, testUser._id, '2024-01-01'),
        completedOn(habit._id, testUser._id, '2024-01-03')
      ]);

      const response = await auth(
        request(app)
          .get('/api/stats/daily')
          .query({ startDate: '2024-01-01', endDate: '2024-01-03' })
      );

      expect(response.status).toBe(200);
      expect(response.body.days).toHaveLength(3);
      expect(response.body.days.map((d) => d.date)).toEqual([
        '2024-01-01', '2024-01-02', '2024-01-03'
      ]);
      expect(response.body.days.map((d) => d.completions)).toEqual([1, 0, 1]);
      expect(response.body.days.map((d) => d.cumulativeXp)).toEqual([10, 10, 20]);
    });

    test('returns 401 without authentication', async () => {
      const response = await request(app).get('/api/stats/daily');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/stats/habits', () => {
    test('returns a per-habit breakdown with completion rates', async () => {
      const habit2 = await Habit.create({
        userId: testUser._id,
        name: 'Meditate',
        frequency: 'daily',
        xpReward: 5,
        createdAt: new Date('2024-01-01T00:00:00.000Z')
      });

      await HabitRecord.create([
        completedOn(habit._id, testUser._id, '2024-01-01'),
        completedOn(habit._id, testUser._id, '2024-01-02')
      ]);

      const response = await auth(
        request(app)
          .get('/api/stats/habits')
          .query({ startDate: '2024-01-01', endDate: '2024-01-02' })
      );

      expect(response.status).toBe(200);
      expect(response.body.habits).toHaveLength(2);

      const read = response.body.habits.find((h) => h.name === 'Read');
      expect(read.completions).toBe(2);
      expect(read.expected).toBe(2);
      expect(read.completionRate).toBe(1);
      expect(read.xpEarned).toBe(20);

      const meditate = response.body.habits.find((h) => h.name === 'Meditate');
      expect(meditate.completions).toBe(0);
      expect(meditate.completionRate).toBe(0);
    });

    test('returns 401 without authentication', async () => {
      const response = await request(app).get('/api/stats/habits');
      expect(response.status).toBe(401);
    });
  });
});
