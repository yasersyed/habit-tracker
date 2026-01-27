import { describe, test, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import userRoutes from '../../routes/users.js';
import User from '../../models/User.js';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/users', () => {
    test('should return all users', async () => {
      await User.create([
        { username: 'user1', email: 'user1@example.com' },
        { username: 'user2', email: 'user2@example.com' }
      ]);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].username).toBeDefined();
      expect(response.body[0].email).toBeDefined();
    });

    test('should return empty array when no users exist', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return a user by id', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com'
      });

      const response = await request(app).get(`/api/users/${user._id}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('testuser');
      expect(response.body.email).toBe('test@example.com');
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app).get(`/api/users/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    test('should return 500 for invalid id format', async () => {
      const response = await request(app).get('/api/users/invalid-id');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/users', () => {
    test('should create a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.username).toBe(userData.username);
      expect(response.body.email).toBe(userData.email);
      expect(response.body._id).toBeDefined();

      const userInDb = await User.findById(response.body._id);
      expect(userInDb).toBeDefined();
      expect(userInDb.username).toBe(userData.username);
    });

    test('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });

    test('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
    });

    test('should return 400 for duplicate username', async () => {
      await User.create({
        username: 'testuser',
        email: 'test1@example.com'
      });

      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'test2@example.com'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update a user', async () => {
      const user = await User.create({
        username: 'oldname',
        email: 'old@example.com'
      });

      const response = await request(app)
        .put(`/api/users/${user._id}`)
        .send({
          username: 'newname',
          email: 'new@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('newname');
      expect(response.body.email).toBe('new@example.com');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.username).toBe('newname');
      expect(updatedUser.email).toBe('new@example.com');
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/users/${fakeId}`)
        .send({ username: 'newname' });

      expect(response.status).toBe(404);
    });

    test('should allow partial updates', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com'
      });

      const response = await request(app)
        .put(`/api/users/${user._id}`)
        .send({ username: 'updatedname' });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('updatedname');
      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete a user', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com'
      });

      const response = await request(app).delete(`/api/users/${user._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted');

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app).delete(`/api/users/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });
});
