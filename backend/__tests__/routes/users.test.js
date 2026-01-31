import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import userRoutes from '../../routes/users.js';
import User from '../../models/User.js';
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
});
