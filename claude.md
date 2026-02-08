# Habit Tracker - Project Overview

## Project Description

A full-stack web application for tracking daily habits. Users can create accounts, add habits with custom properties, and track their completion status on a daily basis.

## Technology Stack

### Backend
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Key Dependencies**:
  - `express`: Web server framework
  - `mongoose`: MongoDB object modeling
  - `cors`: Cross-origin resource sharing
  - `dotenv`: Environment variable management

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Styling**: Plain CSS with modern layouts (Grid, Flexbox)

### Infrastructure
- **Database**: MongoDB 7.0 running in Docker
- **Container Orchestration**: Docker Compose

## Project Structure

```
habit-tracker/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection configuration
│   ├── models/
│   │   ├── User.js            # User model (username, email)
│   │   ├── Habit.js           # Habit model (name, description, frequency, color)
│   │   └── HabitRecord.js     # Tracking model (habit completion records)
│   ├── routes/
│   │   ├── users.js           # User CRUD endpoints
│   │   ├── habits.js          # Habit CRUD endpoints
│   │   └── habitRecords.js    # Tracking endpoints
│   ├── .env.example           # Environment variables template
│   ├── package.json
│   └── server.js              # Main Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UserSelector.jsx       # User selection/creation UI
│   │   │   ├── HabitDashboard.jsx     # Main dashboard component
│   │   │   ├── HabitForm.jsx          # Form for creating habits
│   │   │   ├── HabitCard.jsx          # Individual habit display
│   │   │   └── *.css                  # Component-specific styles
│   │   ├── services/
│   │   │   └── api.js                 # Axios API client
│   │   ├── App.jsx                    # Root component
│   │   ├── App.css                    # App-level styles
│   │   ├── main.jsx                   # React entry point
│   │   └── index.css                  # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js         # Vite configuration with proxy
│
├── docker-compose.yml         # MongoDB container definition
├── .gitignore
├── .env.example
└── README.md
```

## Data Models

### User
```javascript
{
  username: String (unique, required, min 3 chars),
  email: String (unique, required, lowercase),
  createdAt: Date (default: now)
}
```

### Habit
```javascript
{
  userId: ObjectId (ref: User, required),
  name: String (required),
  description: String,
  frequency: String (enum: ['daily', 'weekly', 'monthly'], default: 'daily'),
  color: String (default: '#3b82f6'),
  createdAt: Date (default: now)
}
```

### HabitRecord
```javascript
{
  habitId: ObjectId (ref: Habit, required),
  userId: ObjectId (ref: User, required),
  date: Date (required, normalized to midnight UTC),
  completed: Boolean (default: true),
  notes: String,
  createdAt: Date (default: now)
}
// Unique compound index on (habitId, date) - one record per habit per day
```

## API Endpoints

### Users (`/api/users`)
- `GET /` - Get all users
- `GET /:id` - Get user by ID
- `POST /` - Create new user (body: {username, email})
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user

### Habits (`/api/habits`)
- `GET /user/:userId` - Get all habits for a user
- `GET /:id` - Get habit by ID
- `POST /` - Create habit (body: {userId, name, description?, frequency?, color?})
- `PUT /:id` - Update habit
- `DELETE /:id` - Delete habit

### Habit Records (`/api/records`)
- `GET /habit/:habitId` - Get all records for a habit
- `GET /user/:userId` - Get all records for a user (populated with habit data)
- `GET /user/:userId/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get records in date range
- `POST /` - Create or update record (body: {habitId, userId, date, completed, notes?})
- `DELETE /:id` - Delete record

## Key Features

1. **Multi-User Support**: Switch between users or create new ones
2. **Habit Management**: Create, view, and delete habits with custom properties
3. **Daily Tracking**: Mark habits as complete/incomplete for each day
4. **Visual Feedback**: Color-coded habits, completion status indicators
5. **Data Persistence**: MongoDB with Docker volumes for data retention

## Environment Configuration

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/habit_tracker
PORT=5000
```

### Frontend (Vite Proxy)
- Development server runs on port 3000
- API requests to `/api/*` are proxied to `http://localhost:5000`

## Development Workflow

1. Start MongoDB: `docker-compose up -d`
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Access app at `http://localhost:3000`

## Important Notes

- **Date Handling**: HabitRecord dates are normalized to midnight UTC to ensure one record per day
- **Unique Constraints**: Username and email must be unique; one habit record per habit per day
- **CORS**: Backend allows all origins in development
- **API Proxy**: Vite proxies `/api` requests to avoid CORS issues in development
- **ES Modules**: Backend uses `"type": "module"` in package.json

## Completed Features

- [x] User authentication (login/signup with passwords and JWT)
- [x] Gamification system (XP rewards, levels, difficulty tiers)
- [x] Preset habit templates (15 templates with built-in XP values)
- [x] Protected routes with auth middleware
- [x] Comprehensive backend test suite

## Frontend To-Do

- [ ] **Habit Streaks UI** - Display current and best streak counts on each habit card
- [ ] **Calendar View** - Calendar component showing completion history for habits
- [ ] **Statistics / Charts** - Visual progress charts (weekly/monthly completion rates, XP over time)
- [ ] **Habit Categories & Tags** - Organize habits with categories/tags and filter by them
- [ ] **Dark Mode** - Dark theme toggle using CSS variables
- [ ] **Mobile Responsiveness** - Improve layouts for small screens (cards, forms, navigation)
- [ ] **Notifications / Reminders UI** - Settings page for configuring habit reminders
- [ ] **Data Export UI** - Button to export habit data as CSV or JSON
- [ ] **Edit Habit** - UI for editing an existing habit (name, frequency, color, difficulty)
- [ ] **User Profile Page** - View/edit profile info and see overall stats

## Backend To-Do

- [ ] **Streak Calculation** - API logic to compute current/longest streaks per habit
- [ ] **Statistics Endpoints** - Endpoints for aggregated stats (completion rates, XP trends)
- [ ] **Categories/Tags Model** - Category/tag schema and association with habits
- [ ] **Reminder System** - Scheduled notifications (email or push) for habit reminders
- [ ] **Data Export Endpoint** - `GET /api/export` to generate CSV/JSON of user data
- [ ] **Rate Limiting** - Rate limiting middleware to protect API endpoints
- [ ] **Input Validation** - express-validator or similar for stricter request validation
- [ ] **Password Reset** - Forgot password / reset flow with email
- [ ] **Habit Archiving** - Soft-delete / archive habits instead of permanent deletion
- [ ] **Pagination** - Pagination for habits and records list endpoints
