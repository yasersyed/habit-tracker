import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let mongoServer;

// Set JWT_SECRET for tests
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '7d';

// Connect to in-memory database before all tests
export const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
};

// Clear all test data after each test
export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

// Disconnect and stop in-memory database after all tests
export const teardownTestDB = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

// Helper to create a test user with password
export const createTestUser = async (userData = {}) => {
  const defaultData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };
  const user = await User.create({ ...defaultData, ...userData });
  return user;
};

// Helper to generate auth token for a user
export const generateAuthToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Helper to create user and get auth token
export const createAuthenticatedUser = async (userData = {}) => {
  const user = await createTestUser(userData);
  const token = generateAuthToken(user._id);
  return { user, token };
};
