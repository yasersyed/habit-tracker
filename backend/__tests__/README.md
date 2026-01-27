# Backend Tests

Comprehensive test suite for the Habit Tracker backend using Jest and Supertest.

## Test Structure

```
__tests__/
├── setup.js                      # Test database setup and teardown
├── models/
│   ├── user.test.js             # User model tests
│   ├── habit.test.js            # Habit model tests
│   └── habitRecord.test.js      # HabitRecord model tests
└── routes/
    ├── users.test.js            # User API endpoint tests
    ├── habits.test.js           # Habit API endpoint tests
    └── habitRecords.test.js     # HabitRecord API endpoint tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### User Model Tests
- ✓ Create valid user
- ✓ Require username and email
- ✓ Enforce unique username and email
- ✓ Convert email to lowercase
- ✓ Trim whitespace from username
- ✓ Enforce minimum username length

### User Route Tests
- ✓ GET /api/users - Get all users
- ✓ GET /api/users/:id - Get user by ID
- ✓ POST /api/users - Create new user
- ✓ PUT /api/users/:id - Update user
- ✓ DELETE /api/users/:id - Delete user
- ✓ Error handling for invalid data and missing users

### Habit Model Tests
- ✓ Create valid habit
- ✓ Require userId and name
- ✓ Default values for frequency and color
- ✓ Validate frequency enum values
- ✓ Trim whitespace from name
- ✓ Optional description field
- ✓ Populate userId reference

### Habit Route Tests
- ✓ GET /api/habits/user/:userId - Get all habits for user
- ✓ GET /api/habits/:id - Get habit by ID
- ✓ POST /api/habits - Create new habit
- ✓ PUT /api/habits/:id - Update habit
- ✓ DELETE /api/habits/:id - Delete habit
- ✓ User isolation (users can't see other users' habits)
- ✓ Error handling and validation

### HabitRecord Model Tests
- ✓ Create valid habit record
- ✓ Require habitId, userId, and date
- ✓ Default completed to true
- ✓ Enforce unique habitId/date combination
- ✓ Allow same date for different habits
- ✓ Populate habitId and userId references
- ✓ Optional notes field

### HabitRecord Route Tests
- ✓ GET /api/records/habit/:habitId - Get records for habit
- ✓ GET /api/records/user/:userId - Get records for user with populated data
- ✓ GET /api/records/user/:userId/range - Get records in date range
- ✓ POST /api/records - Create or update record
- ✓ DELETE /api/records/:id - Delete record
- ✓ Date normalization to midnight UTC
- ✓ Record sorting by date
- ✓ User isolation

## Test Database

Tests use `mongodb-memory-server` to create an in-memory MongoDB instance for each test run:

- **Isolation**: Each test run has its own database
- **Speed**: In-memory database is faster than disk-based
- **No cleanup**: Database is automatically destroyed after tests
- **No dependencies**: No need for MongoDB to be running

## Test Utilities

### setup.js Functions

```javascript
setupTestDB()     // Connect to in-memory database
clearTestDB()     // Clear all collections between tests
teardownTestDB()  // Disconnect and cleanup after all tests
```

## Writing New Tests

### Model Test Template

```javascript
import { describe, test, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import YourModel from '../../models/YourModel.js';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';

describe('YourModel Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  test('should create a valid document', async () => {
    // Your test here
  });
});
```

### Route Test Template

```javascript
import { describe, test, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import yourRoutes from '../../routes/yourRoutes.js';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup.js';

const app = express();
app.use(express.json());
app.use('/api/your-route', yourRoutes);

describe('Your Routes', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/your-route', () => {
    test('should work correctly', async () => {
      const response = await request(app).get('/api/your-route');
      expect(response.status).toBe(200);
    });
  });
});
```

## Best Practices

1. **Use beforeEach/afterEach**: Clean up data between tests to avoid test pollution
2. **Test edge cases**: Invalid data, missing fields, non-existent IDs
3. **Test isolation**: Each test should work independently
4. **Descriptive names**: Use clear test descriptions
5. **Assert multiple things**: Check status, response body, and database state
6. **Test error paths**: Don't just test the happy path
7. **Use factories**: Create test data helpers for complex objects
