import { describe, test, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import User from '../../models/User.js';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  test('should create a valid user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.createdAt).toBeDefined();
  });

  test('should require username', async () => {
    const user = new User({
      email: 'test@example.com'
    });

    let error;
    try {
      await user.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.username).toBeDefined();
  });

  test('should require email', async () => {
    const user = new User({
      username: 'testuser'
    });

    let error;
    try {
      await user.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  test('should enforce unique username', async () => {
    const userData = {
      username: 'testuser',
      email: 'test1@example.com'
    };

    await User.create(userData);

    let error;
    try {
      await User.create({
        username: 'testuser',
        email: 'test2@example.com'
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });

  test('should enforce unique email', async () => {
    const userData = {
      username: 'testuser1',
      email: 'test@example.com'
    };

    await User.create(userData);

    let error;
    try {
      await User.create({
        username: 'testuser2',
        email: 'test@example.com'
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });

  test('should convert email to lowercase', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'TEST@EXAMPLE.COM'
    });

    expect(user.email).toBe('test@example.com');
  });

  test('should trim whitespace from username', async () => {
    const user = await User.create({
      username: '  testuser  ',
      email: 'test@example.com'
    });

    expect(user.username).toBe('testuser');
  });

  test('should enforce minimum username length', async () => {
    const user = new User({
      username: 'ab',
      email: 'test@example.com'
    });

    let error;
    try {
      await user.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.username).toBeDefined();
  });
});
