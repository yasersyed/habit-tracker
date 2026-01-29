# Habit Tracker Application

A full-stack habit tracking application built with Node.js, Express, MongoDB, and React, featuring JWT-based authentication.

## Project Structure

```
habit-tracker/
├── backend/              # Node.js/Express API
│   ├── config/           # Database configuration
│   ├── middleware/       # Auth middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── server.js         # Main server file
└── frontend/             # React application
    └── src/
        ├── components/   # React components
        ├── context/      # Auth context
        ├── services/     # API services
        └── App.jsx       # Main app component
```

## Features

- User authentication (signup, login, logout)
- JWT-based session management
- Create and manage habits with customizable colors and frequencies
- Track habits daily
- View habit completion status
- Delete habits
- Protected routes - all habit data is user-specific

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

4. Update the `.env` file with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/habit_tracker
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
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

The frontend will run on http://localhost:5173

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

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current authenticated user

### Users (Protected)
- `GET /api/users/me` - Get current user's profile
- `PUT /api/users/me` - Update current user's profile

### Habits (Protected)
- `GET /api/habits` - Get all habits for authenticated user
- `GET /api/habits/:id` - Get habit by ID
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Habit Records (Protected)
- `GET /api/records` - Get all records for authenticated user
- `GET /api/records/habit/:habitId` - Get all records for a habit
- `GET /api/records/range?startDate=&endDate=` - Get records for date range
- `POST /api/records` - Create or update habit record
- `DELETE /api/records/:id` - Delete habit record

All protected routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Usage

1. Sign up for a new account or login with existing credentials
2. Click "Add Habit" to create a new habit
3. Fill in the habit details (name, description, frequency, color)
4. Click on "Mark as Complete" to track your habit for today
5. Completed habits will show a checkmark
6. Click "Logout" to end your session

## Data Models

### User
- username (unique, min 3 characters)
- email (unique)
- password (hashed, min 6 characters)
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

## Security

- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 7 days by default
- All habit and record endpoints are protected
- Users can only access their own data
