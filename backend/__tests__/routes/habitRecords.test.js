import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import habitRecordRoutes from '../../routes/habitRecords.js';
import HabitRecord from '../../models/HabitRecord.js';
import Habit from '../../models/Habit.js';
import User from '../../models/User.js';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';

const app = express();
app.use(express.json());
app.use('/api/records', habitRecordRoutes);

describe('HabitRecord Routes', () => {
  let testUser;
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
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com'
    });

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

      const response = await request(app).get(`/api/records/habit/${testHabit._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test('should return records sorted by date descending', async () => {
      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-01') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-03') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-02') }
      ]);

      const response = await request(app).get(`/api/records/habit/${testHabit._id}`);

      expect(response.status).toBe(200);
      expect(new Date(response.body[0].date).getTime()).toBeGreaterThan(
        new Date(response.body[1].date).getTime()
      );
    });

    test('should return empty array when habit has no records', async () => {
      const response = await request(app).get(`/api/records/habit/${testHabit._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/records/user/:userId', () => {
    test('should return all records for a user with populated habit data', async () => {
      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-01') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-02') }
      ]);

      const response = await request(app).get(`/api/records/user/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].habitId).toBeDefined();
      expect(response.body[0].habitId.name).toBe('Test Habit');
    });

    test('should not return records from other users', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com'
      });

      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-01') },
        { habitId: testHabit._id, userId: otherUser._id, date: new Date('2024-01-02') }
      ]);

      const response = await request(app).get(`/api/records/user/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('GET /api/records/user/:userId/range', () => {
    test('should return records within date range', async () => {
      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-05') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-10') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-15') },
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-20') }
      ]);

      const response = await request(app)
        .get(`/api/records/user/${testUser._id}/range`)
        .query({ startDate: '2024-01-08', endDate: '2024-01-18' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].habitId).toBeDefined();
    });

    test('should return empty array when no records in range', async () => {
      await HabitRecord.create([
        { habitId: testHabit._id, userId: testUser._id, date: new Date('2024-01-01') }
      ]);

      const response = await request(app)
        .get(`/api/records/user/${testUser._id}/range`)
        .query({ startDate: '2024-02-01', endDate: '2024-02-28' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('POST /api/records', () => {
    test('should create a new habit record', async () => {
      const recordData = {
        habitId: testHabit._id,
        userId: testUser._id,
        date: '2024-01-15',
        completed: true,
        notes: 'Completed successfully'
      };

      const response = await request(app)
        .post('/api/records')
        .send(recordData);

      expect(response.status).toBe(201);
      expect(response.body.habitId).toBe(testHabit._id.toString());
      expect(response.body.completed).toBe(true);
      expect(response.body.notes).toBe('Completed successfully');

      const recordInDb = await HabitRecord.findById(response.body._id);
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
        .send({
          habitId: testHabit._id,
          userId: testUser._id,
          date,
          completed: false,
          notes: 'Updated note'
        });

      expect(response.status).toBe(201);
      expect(response.body._id).toBe(existingRecord._id.toString());
      expect(response.body.completed).toBe(false);
      expect(response.body.notes).toBe('Updated note');

      const count = await HabitRecord.countDocuments({
        habitId: testHabit._id,
        date: new Date(date)
      });
      expect(count).toBe(1);
    });

    test('should normalize date to midnight UTC', async () => {
      const response = await request(app)
        .post('/api/records')
        .send({
          habitId: testHabit._id,
          userId: testUser._id,
          date: '2024-01-15T14:30:00.000Z',
          completed: true
        });

      expect(response.status).toBe(201);

      const record = await HabitRecord.findById(response.body._id);
      const recordDate = new Date(record.date);
      expect(recordDate.getUTCHours()).toBe(0);
      expect(recordDate.getUTCMinutes()).toBe(0);
      expect(recordDate.getUTCSeconds()).toBe(0);
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/records')
        .send({ habitId: testHabit._id });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/records/:id', () => {
    test('should delete a habit record', async () => {
      const record = await HabitRecord.create({
        habitId: testHabit._id,
        userId: testUser._id,
        date: new Date()
      });

      const response = await request(app).delete(`/api/records/${record._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Record deleted');

      const deletedRecord = await HabitRecord.findById(record._id);
      expect(deletedRecord).toBeNull();
    });

    test('should return 404 for non-existent record', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app).delete(`/api/records/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Record not found');
    });
  });
});
