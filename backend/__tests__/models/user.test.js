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
      email: 'test@example.com',
      password: 'password123'
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
      email: 'test@example.com',
      password: 'password123'
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
      username: 'testuser',
      password: 'password123'
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

  test('should require password', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com'
    });

    let error;
    try {
      await user.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  test('should enforce unique username', async () => {
    const userData = {
      username: 'testuser',
      email: 'test1@example.com',
      password: 'password123'
    };

    await User.create(userData);

    let error;
    try {
      await User.create({
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123'
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
      email: 'test@example.com',
      password: 'password123'
    };

    await User.create(userData);

    let error;
    try {
      await User.create({
        username: 'testuser2',
        email: 'test@example.com',
        password: 'password123'
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
      email: 'TEST@EXAMPLE.COM',
      password: 'password123'
    });

    expect(user.email).toBe('test@example.com');
  });

  test('should trim whitespace from username', async () => {
    const user = await User.create({
      username: '  testuser  ',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(user.username).toBe('testuser');
  });

  test('should enforce minimum username length', async () => {
    const user = new User({
      username: 'ab',
      email: 'test@example.com',
      password: 'password123'
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

  test('should enforce minimum password length', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: '12345'
    });

    let error;
    try {
      await user.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  test('should hash password before saving', async () => {
    const plainPassword = 'password123';
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: plainPassword
    });

    const userWithPassword = await User.findById(user._id).select('+password');
    expect(userWithPassword.password).not.toBe(plainPassword);
    expect(userWithPassword.password).toMatch(/^\$2[aby]\$/);
  });

  test('should not include password in queries by default', async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    const user = await User.findOne({ username: 'testuser' });
    expect(user.password).toBeUndefined();
  });

  test('should correctly compare passwords', async () => {
    const plainPassword = 'password123';
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: plainPassword
    });

    const userWithPassword = await User.findById(user._id).select('+password');

    const isMatch = await userWithPassword.comparePassword(plainPassword);
    expect(isMatch).toBe(true);

    const isWrongMatch = await userWithPassword.comparePassword('wrongpassword');
    expect(isWrongMatch).toBe(false);
  });

  test('should not rehash password if not modified', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    const userWithPassword = await User.findById(user._id).select('+password');
    const originalHash = userWithPassword.password;

    userWithPassword.username = 'newusername';
    await userWithPassword.save();

    const updatedUser = await User.findById(user._id).select('+password');
    expect(updatedUser.password).toBe(originalHash);
  });
});
