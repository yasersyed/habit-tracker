import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import habitRoutes from '../../routes/habits.js';
import Habit from '../../models/Habit.js';
import HabitRecord from '../../models/HabitRecord.js';
import { setupTestDB, clearTestDB, teardownTestDB, createAuthenticatedUser } from '../setup.js';

const app = express();
app.use(express.json());
app.use('/api/habits', habitRoutes);

// Build a completed record at UTC midnight for a given "YYYY-MM-DD".
const recordOn = (habitId, userId, ymd) => ({
  habitId,
  userId,
  date: new Date(`${ymd}T00:00:00.000Z`),
  completed: true
});

describe('Habit Streak Routes', () => {
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
    habit = await Habit.create({ userId: testUser._id, name: 'Read', frequency: 'daily' });
  });

  describe('GET /api/habits/:id/streak', () => {
    test('returns zeros when the habit has no records', async () => {
      const response = await request(app)
        .get(`/api/habits/${habit._id}/streak`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ current: 0, longest: 0 });
    });

    test('computes current and longest streaks anchored to today', async () => {
      await HabitRecord.create([
        // Past 5-day run
        recordOn(habit._id, testUser._id, '2024-01-01'),
        recordOn(habit._id, testUser._id, '2024-01-02'),
        recordOn(habit._id, testUser._id, '2024-01-03'),
        recordOn(habit._id, testUser._id, '2024-01-04'),
        recordOn(habit._id, testUser._id, '2024-01-05'),
        // Current 2-day run ending on the anchor day
        recordOn(habit._id, testUser._id, '2024-01-14'),
        recordOn(habit._id, testUser._id, '2024-01-15')
      ]);

      const response = await request(app)
        .get(`/api/habits/${habit._id}/streak`)
        .query({ today: '2024-01-15' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ current: 2, longest: 5 });
    });

    test('an unlogged today does not break the current streak', async () => {
      await HabitRecord.create([
        recordOn(habit._id, testUser._id, '2024-01-13'),
        recordOn(habit._id, testUser._id, '2024-01-14')
      ]);

      const response = await request(app)
        .get(`/api/habits/${habit._id}/streak`)
        .query({ today: '2024-01-15' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ current: 2, longest: 2 });
    });

    test('ignores records that are not completed', async () => {
      await HabitRecord.create([
        recordOn(habit._id, testUser._id, '2024-01-14'),
        { habitId: habit._id, userId: testUser._id, date: new Date('2024-01-15T00:00:00.000Z'), completed: false }
      ]);

      const response = await request(app)
        .get(`/api/habits/${habit._id}/streak`)
        .query({ today: '2024-01-15' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // Only Jan 14 counts; today (Jan 15) is not completed, so streak = 1 back from yesterday.
      expect(response.body).toEqual({ current: 1, longest: 1 });
    });

    test('returns 404 for a habit owned by another user', async () => {
      const other = await createAuthenticatedUser({ username: 'other', email: 'other@example.com' });
      const otherHabit = await Habit.create({ userId: other.user._id, name: 'Theirs' });

      const response = await request(app)
        .get(`/api/habits/${otherHabit._id}/streak`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test('returns 400 for an invalid habit id', async () => {
      const response = await request(app)
        .get('/api/habits/not-an-id/streak')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    test('returns 400 for an invalid today param', async () => {
      const response = await request(app)
        .get(`/api/habits/${habit._id}/streak`)
        .query({ today: '01-15-2024' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    test('returns 401 without authentication', async () => {
      const response = await request(app).get(`/api/habits/${habit._id}/streak`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/habits/streaks', () => {
    test('returns a streak entry for every habit, including those without records', async () => {
      const habit2 = await Habit.create({ userId: testUser._id, name: 'Run', frequency: 'daily' });

      await HabitRecord.create([
        recordOn(habit._id, testUser._id, '2024-01-14'),
        recordOn(habit._id, testUser._id, '2024-01-15')
      ]);

      const response = await request(app)
        .get('/api/habits/streaks')
        .query({ today: '2024-01-15' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body[habit._id.toString()]).toEqual({ current: 2, longest: 2 });
      expect(response.body[habit2._id.toString()]).toEqual({ current: 0, longest: 0 });
    });

    test('does not include or count other users\' habits and records', async () => {
      const other = await createAuthenticatedUser({ username: 'other', email: 'other@example.com' });
      const otherHabit = await Habit.create({ userId: other.user._id, name: 'Theirs' });
      await HabitRecord.create(recordOn(otherHabit._id, other.user._id, '2024-01-15'));

      const response = await request(app)
        .get('/api/habits/streaks')
        .query({ today: '2024-01-15' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toEqual([habit._id.toString()]);
    });

    test('returns 401 without authentication', async () => {
      const response = await request(app).get('/api/habits/streaks');
      expect(response.status).toBe(401);
    });

    test('does not treat "streaks" as a habit id (route ordering)', async () => {
      // If /:id matched first, this would 400 on an invalid mongo id.
      const response = await request(app)
        .get('/api/habits/streaks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
    });
  });
});
