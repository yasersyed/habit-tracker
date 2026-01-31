import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import HabitRecord from '../../models/HabitRecord.js';
import Habit from '../../models/Habit.js';
import User from '../../models/User.js';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';

describe('HabitRecord Model', () => {
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
      email: 'test@example.com',
      password: 'password123'
    });

    testHabit = await Habit.create({
      userId: testUser._id,
      name: 'Test Habit',
      frequency: 'daily'
    });
  });

  test('should create a valid habit record', async () => {
    const recordData = {
      habitId: testHabit._id,
      userId: testUser._id,
      date: new Date('2024-01-15'),
      completed: true,
      notes: 'Completed successfully'
    };

    const record = new HabitRecord(recordData);
    const savedRecord = await record.save();

    expect(savedRecord._id).toBeDefined();
    expect(savedRecord.habitId.toString()).toBe(testHabit._id.toString());
    expect(savedRecord.userId.toString()).toBe(testUser._id.toString());
    expect(savedRecord.completed).toBe(true);
    expect(savedRecord.notes).toBe('Completed successfully');
    expect(savedRecord.createdAt).toBeDefined();
  });

  test('should require habitId', async () => {
    const record = new HabitRecord({
      userId: testUser._id,
      date: new Date()
    });

    let error;
    try {
      await record.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.habitId).toBeDefined();
  });

  test('should require userId', async () => {
    const record = new HabitRecord({
      habitId: testHabit._id,
      date: new Date()
    });

    let error;
    try {
      await record.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.userId).toBeDefined();
  });

  test('should require date', async () => {
    const record = new HabitRecord({
      habitId: testHabit._id,
      userId: testUser._id
    });

    let error;
    try {
      await record.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.date).toBeDefined();
  });

  test('should default completed to true', async () => {
    const record = await HabitRecord.create({
      habitId: testHabit._id,
      userId: testUser._id,
      date: new Date()
    });

    expect(record.completed).toBe(true);
  });

  test('should enforce unique habitId and date combination', async () => {
    const date = new Date('2024-01-15');

    await HabitRecord.create({
      habitId: testHabit._id,
      userId: testUser._id,
      date,
      completed: true
    });

    let error;
    try {
      await HabitRecord.create({
        habitId: testHabit._id,
        userId: testUser._id,
        date,
        completed: false
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });

  test('should allow same date for different habits', async () => {
    const habit2 = await Habit.create({
      userId: testUser._id,
      name: 'Another Habit',
      frequency: 'daily'
    });

    const date = new Date('2024-01-15');

    const record1 = await HabitRecord.create({
      habitId: testHabit._id,
      userId: testUser._id,
      date
    });

    const record2 = await HabitRecord.create({
      habitId: habit2._id,
      userId: testUser._id,
      date
    });

    expect(record1).toBeDefined();
    expect(record2).toBeDefined();
  });

  test('should populate habitId reference', async () => {
    const record = await HabitRecord.create({
      habitId: testHabit._id,
      userId: testUser._id,
      date: new Date()
    });

    const populatedRecord = await HabitRecord.findById(record._id).populate('habitId');

    expect(populatedRecord.habitId.name).toBe(testHabit.name);
    expect(populatedRecord.habitId.frequency).toBe(testHabit.frequency);
  });

  test('should populate userId reference', async () => {
    const record = await HabitRecord.create({
      habitId: testHabit._id,
      userId: testUser._id,
      date: new Date()
    });

    const populatedRecord = await HabitRecord.findById(record._id).populate('userId');

    expect(populatedRecord.userId.username).toBe(testUser.username);
    expect(populatedRecord.userId.email).toBe(testUser.email);
  });

  test('should trim whitespace from notes', async () => {
    const record = await HabitRecord.create({
      habitId: testHabit._id,
      userId: testUser._id,
      date: new Date(),
      notes: '  Test notes  '
    });

    expect(record.notes).toBe('Test notes');
  });

  test('should allow notes to be optional', async () => {
    const record = await HabitRecord.create({
      habitId: testHabit._id,
      userId: testUser._id,
      date: new Date()
    });

    expect(record.notes).toBeUndefined();
  });
});
