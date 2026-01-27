# Habit Tracker Application

A full-stack habit tracking application built with Node.js, Express, MongoDB, and React.

## Project Structure

```
habit-tracker/
├── backend/           # Node.js/Express API
│   ├── config/        # Database configuration
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   └── server.js      # Main server file
└── frontend/          # React application
    └── src/
        ├── components/    # React components
        ├── services/      # API services
        └── App.jsx        # Main app component
```

## Features

- User management (create, select users)
- Create and manage habits with customizable colors and frequencies
- Track habits daily
- View habit completion status
- Delete habits

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose (for MongoDB)
  - OR MongoDB installed locally

## Quick Start with Docker

The easiest way to get MongoDB running is with Docker Compose:

```bash
# Start MongoDB
docker-compose up -d

# Check if MongoDB is running
docker ps
```

To stop MongoDB:
```bash
docker-compose down
```

To stop MongoDB and remove data:
```bash
docker-compose down -v
```

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/habit_tracker
PORT=5000
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:3000

## Testing

The backend includes a comprehensive test suite using Jest and Supertest.

### Running Tests

```bash
# Navigate to backend directory
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

The test suite includes:
- **Model Tests**: Validation, constraints, defaults, and relationships
- **Route Tests**: All CRUD operations, error handling, and edge cases
- **Integration Tests**: End-to-end API testing with in-memory database

Tests cover:
- User management (creation, validation, uniqueness)
- Habit management (CRUD operations, user isolation)
- Habit tracking (daily records, date handling, data integrity)

For more details, see [backend/__tests__/README.md](backend/__tests__/README.md)

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Habits
- `GET /api/habits/user/:userId` - Get all habits for a user
- `GET /api/habits/:id` - Get habit by ID
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Habit Records
- `GET /api/records/habit/:habitId` - Get all records for a habit
- `GET /api/records/user/:userId` - Get all records for a user
- `GET /api/records/user/:userId/range?startDate=&endDate=` - Get records for date range
- `POST /api/records` - Create or update habit record
- `DELETE /api/records/:id` - Delete habit record

## Usage

1. Create a user or select an existing one
2. Click "Add Habit" to create a new habit
3. Fill in the habit details (name, description, frequency, color)
4. Click on "Mark as Complete" to track your habit for today
5. Completed habits will show a checkmark

## Data Models

### User
- username (unique)
- email (unique)
- createdAt

### Habit
- userId (reference to User)
- name
- description
- frequency (daily/weekly/monthly)
- color
- createdAt

### HabitRecord
- habitId (reference to Habit)
- userId (reference to User)
- date
- completed (boolean)
- notes
- createdAt
