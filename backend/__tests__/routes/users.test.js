import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import userRoutes from '../../routes/users.js';
import User from '../../models/User.js';
import Habit from '../../models/Habit.js';
import HabitRecord from '../../models/HabitRecord.js';
import { setupTestDB, clearTestDB, teardownTestDB, createAuthenticatedUser } from '../setup.js';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
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

  describe('GET /api/users/me', () => {
    test('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(testUser._id.toString());
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.password).toBeUndefined();
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/users/me');

      expect(response.status).toBe(401);
    });

    test('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/me', () => {
    test('should update current user username', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: 'newusername' });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('newusername');
      expect(response.body.email).toBe(testUser.email);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.username).toBe('newusername');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .send({ username: 'newusername' });

      expect(response.status).toBe(401);
    });

    test('should return 400 for duplicate username', async () => {
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: 'existinguser' });

      expect(response.status).toBe(400);
    });

    test('should not change email', async () => {
      const originalEmail = testUser.email;

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'newemail@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(originalEmail);

      const user = await User.findById(testUser._id);
      expect(user.email).toBe(originalEmail);
    });
  });

  describe('PUT /api/users/me/password', () => {
    test('should change password when current password is correct', async () => {
      const response = await request(app)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password updated');

      const updatedUser = await User.findById(testUser._id).select('+password');
      const matchesNew = await updatedUser.comparePassword('newpassword456');
      const matchesOld = await updatedUser.comparePassword('password123');
      expect(matchesNew).toBe(true);
      expect(matchesOld).toBe(false);
    });

    test('should return 400 when current password is incorrect', async () => {
      const response = await request(app)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword456' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/users/me/password')
        .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/me', () => {
    test('should delete the user and cascade their habits and records', async () => {
      const habit = await Habit.create({
        userId: testUser._id,
        name: 'Drink water',
        frequency: 'daily'
      });
      const otherHabit = await Habit.create({
        userId: testUser._id,
        name: 'Read',
        frequency: 'daily'
      });
      await HabitRecord.create({
        habitId: habit._id,
        userId: testUser._id,
        date: new Date('2024-01-01')
      });
      await HabitRecord.create({
        habitId: otherHabit._id,
        userId: testUser._id,
        date: new Date('2024-01-02')
      });

      const response = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Account deleted');

      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();

      const remainingHabits = await Habit.find({ userId: testUser._id });
      expect(remainingHabits).toHaveLength(0);

      const remainingRecords = await HabitRecord.find({ userId: testUser._id });
      expect(remainingRecords).toHaveLength(0);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app).delete('/api/users/me');

      expect(response.status).toBe(401);
    });
  });
});
