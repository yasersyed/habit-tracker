import { describe, test, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import Habit from '../../models/Habit.js';
import User from '../../models/User.js';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';

describe('Habit Model', () => {
  let testUser;

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
  });

  test('should create a valid habit', async () => {
    const habitData = {
      userId: testUser._id,
      name: 'Morning Exercise',
      description: 'Exercise for 30 minutes',
      frequency: 'daily',
      color: '#3b82f6'
    };

    const habit = new Habit(habitData);
    const savedHabit = await habit.save();

    expect(savedHabit._id).toBeDefined();
    expect(savedHabit.name).toBe(habitData.name);
    expect(savedHabit.description).toBe(habitData.description);
    expect(savedHabit.frequency).toBe(habitData.frequency);
    expect(savedHabit.color).toBe(habitData.color);
    expect(savedHabit.userId.toString()).toBe(testUser._id.toString());
    expect(savedHabit.createdAt).toBeDefined();
  });

  test('should require userId', async () => {
    const habit = new Habit({
      name: 'Test Habit'
    });

    let error;
    try {
      await habit.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.userId).toBeDefined();
  });

  test('should require name', async () => {
    const habit = new Habit({
      userId: testUser._id
    });

    let error;
    try {
      await habit.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  test('should use default frequency if not provided', async () => {
    const habit = await Habit.create({
      userId: testUser._id,
      name: 'Test Habit'
    });

    expect(habit.frequency).toBe('daily');
  });

  test('should use default color if not provided', async () => {
    const habit = await Habit.create({
      userId: testUser._id,
      name: 'Test Habit'
    });

    expect(habit.color).toBe('#3b82f6');
  });

  test('should accept valid frequency values', async () => {
    const frequencies = ['daily', 'weekly', 'monthly'];

    for (const frequency of frequencies) {
      const habit = await Habit.create({
        userId: testUser._id,
        name: `Test ${frequency}`,
        frequency
      });

      expect(habit.frequency).toBe(frequency);
    }
  });

  test('should reject invalid frequency values', async () => {
    const habit = new Habit({
      userId: testUser._id,
      name: 'Test Habit',
      frequency: 'invalid'
    });

    let error;
    try {
      await habit.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.frequency).toBeDefined();
  });

  test('should trim whitespace from name', async () => {
    const habit = await Habit.create({
      userId: testUser._id,
      name: '  Test Habit  '
    });

    expect(habit.name).toBe('Test Habit');
  });

  test('should allow description to be optional', async () => {
    const habit = await Habit.create({
      userId: testUser._id,
      name: 'Test Habit'
    });

    expect(habit.description).toBeUndefined();
  });

  test('should populate userId reference', async () => {
    const habit = await Habit.create({
      userId: testUser._id,
      name: 'Test Habit'
    });

    const populatedHabit = await Habit.findById(habit._id).populate('userId');

    expect(populatedHabit.userId.username).toBe(testUser.username);
    expect(populatedHabit.userId.email).toBe(testUser.email);
  });
});
