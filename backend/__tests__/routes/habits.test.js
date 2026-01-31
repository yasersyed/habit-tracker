import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import habitRoutes from '../../routes/habits.js';
import Habit from '../../models/Habit.js';
import User from '../../models/User.js';
import { setupTestDB, clearTestDB, teardownTestDB, createAuthenticatedUser } from '../setup.js';

const app = express();
app.use(express.json());
app.use('/api/habits', habitRoutes);

describe('Habit Routes', () => {
  let testUser;
  let authToken;

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
  });

  describe('GET /api/habits', () => {
    test('should return all habits for authenticated user', async () => {
      await Habit.create([
        { userId: testUser._id, name: 'Habit 1', frequency: 'daily' },
        { userId: testUser._id, name: 'Habit 2', frequency: 'weekly' }
      ]);

      const response = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBeDefined();
      expect(response.body[0].userId).toBe(testUser._id.toString());
    });

    test('should return empty array when user has no habits', async () => {
      const response = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test('should not return habits from other users', async () => {
      const otherAuth = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com'
      });

      await Habit.create([
        { userId: testUser._id, name: 'User 1 Habit' },
        { userId: otherAuth.user._id, name: 'User 2 Habit' }
      ]);

      const response = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('User 1 Habit');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/habits');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/habits/:id', () => {
    test('should return a habit by id', async () => {
      const habit = await Habit.create({
        userId: testUser._id,
        name: 'Test Habit',
        description: 'Test Description',
        frequency: 'daily'
      });

      const response = await request(app)
        .get(`/api/habits/${habit._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Habit');
      expect(response.body.description).toBe('Test Description');
      expect(response.body.frequency).toBe('daily');
    });

    test('should return 404 for non-existent habit', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/habits/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Habit not found');
    });

    test('should return 404 for habit belonging to other user', async () => {
      const otherAuth = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com'
      });

      const habit = await Habit.create({
        userId: otherAuth.user._id,
        name: 'Other User Habit'
      });

      const response = await request(app)
        .get(`/api/habits/${habit._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/habits', () => {
    test('should create a new habit', async () => {
      const habitData = {
        name: 'New Habit',
        description: 'Test Description',
        frequency: 'weekly',
        color: '#ef4444'
      };

      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habitData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(habitData.name);
      expect(response.body.description).toBe(habitData.description);
      expect(response.body.frequency).toBe(habitData.frequency);
      expect(response.body.color).toBe(habitData.color);
      expect(response.body.userId).toBe(testUser._id.toString());
      expect(response.body._id).toBeDefined();

      const habitInDb = await Habit.findById(response.body._id);
      expect(habitInDb).toBeDefined();
      expect(habitInDb.name).toBe(habitData.name);
    });

    test('should create habit with minimal data', async () => {
      const habitData = {
        name: 'Minimal Habit'
      };

      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habitData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(habitData.name);
      expect(response.body.frequency).toBe('daily');
      expect(response.body.color).toBe('#3b82f6');
    });

    test('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    test('should return 400 for invalid frequency', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Habit',
          frequency: 'invalid'
        });

      expect(response.status).toBe(400);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({ name: 'Test Habit' });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/habits/:id', () => {
    test('should update a habit', async () => {
      const habit = await Habit.create({
        userId: testUser._id,
        name: 'Old Name',
        description: 'Old Description',
        frequency: 'daily'
      });

      const response = await request(app)
        .put(`/api/habits/${habit._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
          description: 'New Description',
          frequency: 'weekly',
          color: '#10b981'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.description).toBe('New Description');
      expect(response.body.frequency).toBe('weekly');
      expect(response.body.color).toBe('#10b981');

      const updatedHabit = await Habit.findById(habit._id);
      expect(updatedHabit.name).toBe('New Name');
    });

    test('should return 404 for non-existent habit', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/habits/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
    });

    test('should return 404 for habit belonging to other user', async () => {
      const otherAuth = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com'
      });

      const habit = await Habit.create({
        userId: otherAuth.user._id,
        name: 'Other User Habit'
      });

      const response = await request(app)
        .put(`/api/habits/${habit._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });

    test('should allow partial updates', async () => {
      const habit = await Habit.create({
        userId: testUser._id,
        name: 'Test Habit',
        frequency: 'daily'
      });

      const response = await request(app)
        .put(`/api/habits/${habit._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.frequency).toBe('daily');
    });
  });

  describe('DELETE /api/habits/:id', () => {
    test('should delete a habit', async () => {
      const habit = await Habit.create({
        userId: testUser._id,
        name: 'Test Habit'
      });

      const response = await request(app)
        .delete(`/api/habits/${habit._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Habit deleted');

      const deletedHabit = await Habit.findById(habit._id);
      expect(deletedHabit).toBeNull();
    });

    test('should return 404 for non-existent habit', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/habits/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Habit not found');
    });

    test('should return 404 for habit belonging to other user', async () => {
      const otherAuth = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com'
      });

      const habit = await Habit.create({
        userId: otherAuth.user._id,
        name: 'Other User Habit'
      });

      const response = await request(app)
        .delete(`/api/habits/${habit._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);

      const habitStillExists = await Habit.findById(habit._id);
      expect(habitStillExists).not.toBeNull();
    });
  });
});
