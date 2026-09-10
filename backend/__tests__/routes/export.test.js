import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import exportRoutes from '../../routes/export.js';
import Habit from '../../models/Habit.js';
import HabitRecord from '../../models/HabitRecord.js';
import { setupTestDB, clearTestDB, teardownTestDB, createAuthenticatedUser } from '../setup.js';

const app = express();
app.use(express.json());
app.use('/api/export', exportRoutes);

describe('Export Routes', () => {
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

    await HabitRecord.create([
      { habitId: habit._id, userId: testUser._id, date: new Date('2024-01-02T00:00:00.000Z'), completed: true },
      { habitId: habit._id, userId: testUser._id, date: new Date('2024-01-03T00:00:00.000Z'), completed: false, notes: 'skipped' }
    ]);
  });

  const auth = (req) => req.set('Authorization', `Bearer ${authToken}`);

  describe('GET /api/export', () => {
    test('returns JSON export by default', async () => {
      const response = await auth(request(app).get('/api/export'));

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.habits.length).toBeGreaterThanOrEqual(1);
      expect(response.body.records.length).toBeGreaterThanOrEqual(2);
    });

    test('returns CSV export when format=csv', async () => {
      const response = await auth(request(app).get('/api/export').query({ format: 'csv' }));

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text.startsWith('Habit,Date,Completed,Notes')).toBe(true);
    });

    test('returns 401 without authentication', async () => {
      const response = await request(app).get('/api/export');
      expect(response.status).toBe(401);
    });
  });
});
