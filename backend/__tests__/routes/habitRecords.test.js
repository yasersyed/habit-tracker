import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import habitRecordRoutes from '../../routes/habitRecords.js';
import HabitRecord from '../../models/HabitRecord.js';
import Habit from '../../models/Habit.js';
import User from '../../models/User.js';
import { setupTestDB, clearTestDB, teardownTestDB, createAuthenticatedUser } from '../setup.js';

const app = express();
app.use(express.json());
app.use('/api/records', habitRecordRoutes);

describe('HabitRecord Routes', () => {
  let testUser;
  let authToken;
  let testHabit;

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

    testHabit = await Habit.create({
      userId: testUser._id,
      name: 'Test Habit',
      frequency: 'daily'
    });
  });

  describe('GET /api/records/habit/:habitId', () => {
    test('should return all records for a habit', async () => {
      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-01') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-02') }
      ]);

      const response = await request(app)
        .get(`/api/records/habit/${testHabit._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test('should return records sorted by date descending', async () => {
      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-01') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-03') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-02') }
      ]);

      const response = await request(app)
        .get(`/api/records/habit/${testHabit._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(new Date(response.body[0].date).getTime()).toBeGreaterThan(
        new Date(response.body[1].date).getTime()
      );
    });

    test('should return empty array when habit has no records', async () => {
      const response = await request(app)
        .get(`/api/records/habit/${testHabit._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/records/habit/${testHabit._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/records', () => {
    test('should return all records for authenticated user with populated habit data', async () => {
      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-01') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-02') }
      ]);

      const response = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].habitId).toBeDefined();
      expect(response.body[0].habitId.name).toBe('Test Habit');
    });

    test('should not return records from other users', async () => {
      const otherAuth = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com'
      });

      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-01') },
        { habitId: testHabit._id, userId: otherAuth.user._id, date: new Date('2024-01-02') }
      ]);

      const response = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('GET /api/records/range', () => {
    test('should return records within date range', async () => {
      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-05') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-10') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-15') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-20') }
      ]);

      const response = await request(app)
        .get('/api/records/range')
        .query({ startDate: '2024-01-08', endDate: '2024-01-18' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].habitId).toBeDefined();
    });

    test('should return empty array when no records in range', async () => {
      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-01') }
      ]);

      const response = await request(app)
        .get('/api/records/range')
        .query({ startDate: '2024-02-01', endDate: '2024-02-28' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test('should not return records from other users', async () => {
      const otherAuth = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com'
      });

      const otherHabit = await Habit.create({
        userId: otherAuth.user._id,
        name: 'Other Habit',
        frequency: 'daily'
      });

      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-10') },
        { habitId: otherHabit._id, userId: otherAuth.user._id, date: new Date('2024-01-10') }
      ]);

      const response = await request(app)
        .get('/api/records/range')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('POST /api/records', () => {
    test('should create a new habit record', async () => {
      const recordData = {
        habitId: testHabit._id,
        date: '2024-01-15',
        completed: true,
        notes: 'Completed successfully'
      };

      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recordData);

      expect(response.status).toBe(201);
      expect(response.body.record).toBeDefined();
      expect(response.body.userXp).toBeDefined();
      expect(response.body.record.habitId).toBe(testHabit._id.toString());
      expect(response.body.record.userId).toBe(testUser._id.toString());
      expect(response.body.record.completed).toBe(true);
      expect(response.body.record.notes).toBe('Completed successfully');

      const recordInDb = await HabitRecord.findById(response.body.record._id);
      expect(recordInDb).toBeDefined();
    });

    test('should update existing record for same habit and date', async () => {
      const date = '2024-01-15';

      const existingRecord = await HabitRecord.create({
        habitId: testHabit._id,
        userId: testUser._id,
        date: new Date(date),
        completed: true,
        notes: 'First note'
      });

      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: testHabit._id,
          date,
          completed: false,
          notes: 'Updated note'
        });

      expect(response.status).toBe(201);
      expect(response.body.record._id).toBe(existingRecord._id.toString());
      expect(response.body.record.completed).toBe(false);
      expect(response.body.record.notes).toBe('Updated note');

      const count = await HabitRecord.countDocuments({
        habitId: testHabit._id,
        date: new Date(date)
      });
      expect(count).toBe(1);
    });

    test('should normalize date to midnight UTC', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: testHabit._id,
          date: '2024-01-15T14:30:00.000Z',
          completed: true
        });

      expect(response.status).toBe(201);

      const record = await HabitRecord.findById(response.body.record._id);
      const recordDate = new Date(record.date);
      expect(recordDate.getUTCHours()).toBe(0);
      expect(recordDate.getUTCMinutes()).toBe(0);
      expect(recordDate.getUTCSeconds()).toBe(0);
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ habitId: testHabit._id });

      expect(response.status).toBe(400);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/records')
        .send({
          habitId: testHabit._id,
          date: '2024-01-15',
          completed: true
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/records/:id', () => {
    test('should delete a habit record', async () => {
      const record = await HabitRecord.create({
        habitId: testHabit._id,
        userId: testUser._id,
        date: new Date()
      });

      const response = await request(app)
        .delete(`/api/records/${record._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Record deleted');
      expect(response.body.userXp).toBeDefined();

      const deletedRecord = await HabitRecord.findById(record._id);
      expect(deletedRecord).toBeNull();
    });

    test('should return 404 for non-existent record', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/records/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Record not found');
    });

    test('should return 404 for record belonging to other user', async () => {
      const otherAuth = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com'
      });

      const record = await HabitRecord.create({
        habitId: testHabit._id,
        userId: otherAuth.user._id,
        date: new Date()
      });

      const response = await request(app)
        .delete(`/api/records/${record._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);

      const recordStillExists = await HabitRecord.findById(record._id);
      expect(recordStillExists).not.toBeNull();
    });
  });

  describe('XP Award/Deduct', () => {
    test('should award XP when creating a completed record', async () => {
      const habit = await Habit.create({
        userId: testUser._id,
        name: 'XP Habit',
        xpReward: 50
      });

      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habit._id,
          date: '2024-01-15',
          completed: true
        });

      expect(response.status).toBe(201);
      expect(response.body.userXp.totalXp).toBe(50);
    });

    test('should deduct XP when toggling completed to incomplete', async () => {
      const habit = await Habit.create({
        userId: testUser._id,
        name: 'XP Habit',
        xpReward: 50
      });

      // First create a completed record to award XP
      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habit._id,
          date: '2024-01-15',
          completed: true
        });

      // Now toggle it to false
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habit._id,
          date: '2024-01-15',
          completed: false
        });

      expect(response.status).toBe(201);
      expect(response.body.userXp.totalXp).toBe(0);
    });

    test('should deduct XP when deleting a completed record', async () => {
      const habit = await Habit.create({
        userId: testUser._id,
        name: 'XP Habit',
        xpReward: 75
      });

      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habit._id,
          date: '2024-01-15',
          completed: true
        });

      expect(createRes.body.userXp.totalXp).toBe(75);

      const response = await request(app)
        .delete(`/api/records/${createRes.body.record._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.userXp.totalXp).toBe(0);
    });

    test('should never let XP go below 0', async () => {
      const habit = await Habit.create({
        userId: testUser._id,
        name: 'XP Habit',
        xpReward: 100
      });

      // Create and delete without any XP first
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habit._id,
          date: '2024-01-15',
          completed: false
        });

      // Toggle false->true then delete to try to go negative
      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId: habit._id,
          date: '2024-01-15',
          completed: true
        });

      // Delete the record (deducts 100)
      const delRes = await request(app)
        .delete(`/api/records/${createRes.body.record._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(delRes.body.userXp.totalXp).toBe(0);

      const user = await User.findById(testUser._id);
      expect(user.totalXp).toBe(0);
    });
  });
});
