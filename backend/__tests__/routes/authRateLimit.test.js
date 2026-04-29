import { describe, test, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';
import User from '../../models/User.js';

// Override rate limits BEFORE importing auth routes (which reads env at load time)
process.env.LOGIN_RATE_MAX = '3';
process.env.LOGIN_RATE_WINDOW_MS = '60000';
process.env.REGISTER_RATE_MAX = '3';
process.env.REGISTER_RATE_WINDOW_MS = '60000';

// Dynamic import so the env vars above are applied before the module evaluates
const { default: authRoutes } = await import('../../routes/auth.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Rate Limiting', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  test('should return 429 after exceeding login rate limit', async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    // Send requests sequentially to ensure ordering
    const responses = [];
    for (let i = 0; i < 4; i++) {
      responses.push(
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrongpassword' })
      );
    }

    const tooMany = responses.filter(r => r.status === 429);

    expect(tooMany.length).toBeGreaterThanOrEqual(1);
    expect(tooMany[0].body.message).toBe(
      'Too many login attempts, please try again after 15 minutes'
    );
  });

  test('should return 429 after exceeding register rate limit', async () => {
    const responses = [];
    for (let i = 0; i < 4; i++) {
      responses.push(
        await request(app)
          .post('/api/auth/register')
          .send({
            username: `user${i}`,
            email: `user${i}@example.com`,
            password: 'password123'
          })
      );
    }

    const tooMany = responses.filter(r => r.status === 429);

    expect(tooMany.length).toBeGreaterThanOrEqual(1);
    expect(tooMany[0].body.message).toBe(
      'Too many accounts created from this IP, please try again after an hour'
    );
  });

  test('should include standard rate limit headers in response', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.headers['ratelimit-limit']).toBeDefined();
    expect(response.headers['ratelimit-remaining']).toBeDefined();
  });
});
