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
- `GET /streaks?today=YYYY-MM-DD` - Get `{ current, longest }` streaks for every habit (map keyed by habit id)
- `GET /:id/streak?today=YYYY-MM-DD` - Get `{ current, longest }` streak for one habit
- `GET /:id` - Get habit by ID
- `POST /` - Create habit (body: {userId, name, description?, frequency?, color?})
- `PUT /:id` - Update habit
- `DELETE /:id` - Delete habit (cascades to records, reclaims XP)

### Habit Records (`/api/records`)
- `GET /habit/:habitId` - Get all records for a habit
- `GET /user/:userId` - Get all records for a user (populated with habit data)
- `GET /user/:userId/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get records in date range
- `POST /` - Create or update record (body: {habitId, userId, date, completed, notes?})
- `DELETE /:id` - Delete record

### Statistics (`/api/stats`)
All endpoints accept optional `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (default: last 30 days ending today, UTC). Completion rate uses each habit's frequency and creation date to compute expected occurrences.
- `GET /summary` - KPIs for the range: `{ range, habitCount, totalCompletions, activeDays, xpEarned, completionRate }`
- `GET /daily` - Zero-filled per-day series for trend charts: `{ range, days: [{ date, completions, xpEarned, cumulativeXp }] }`
- `GET /habits` - Per-habit breakdown: `{ range, habits: [{ habitId, name, color, frequency, completions, expected, completionRate, xpEarned }] }`

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

## Branch Naming

- Feature/fix branches use a zero-padded sequence: `ht-001`, `ht-002`, `ht-003`, …
  Pick the next unused number by checking existing branches (e.g. `git branch -a`)
  and incrementing the highest `ht-NNN` seen.
- **Release branches are the exception**: name them after the release version
  instead of the sequence (e.g. `v0.2.0`).

## Important Notes

- **Date Handling**: HabitRecord dates are normalized to midnight UTC to ensure one record per day
- **Unique Constraints**: Username and email must be unique; one habit record per habit per day
- **CORS**: Backend restricts origins via `CORS_ORIGINS` env var (comma-separated); defaults to `http://localhost:5173`
- **API Proxy**: Vite proxies `/api` requests to avoid CORS issues in development
- **ES Modules**: Backend uses `"type": "module"` in package.json
- **Theming**: Light/dark mode via CSS custom properties defined in `frontend/src/index.css` (`:root` light defaults; dark under `:root[data-theme="dark"]` and a `prefers-color-scheme` fallback). `ThemeContext` persists the choice in `localStorage` and defaults to the OS preference; an inline script in `index.html` stamps the theme before first paint to avoid a flash. Component CSS uses the tokens — add new colors as tokens, not literals.
- **Versioning**: Unified SemVer across all packages; the root `package.json` `version` is the source of truth, propagated by `npm run bump -- <major|minor|patch|X.Y.Z>` and verified by `npm run check:version` (also run in CI). The running version is exposed at `GET /api/version` (and in `/api/health`) and shown in the app footer. See `CHANGELOG.md` and `RELEASING.md`. Currently pre-1.0 (v0.1.0) during user testing.
- **Leveling Curve**: XP to advance a level grows smoothly — `xpForLevel(level) = 100 + (level - 1) * 50` (`shared/xp.js`), so each level costs a little more than the last instead of flat bands. `level`/`xp` are always derived from `totalXp` (via `User.toPublicJSON()` / `computeLevelInfo`), so curve changes apply to existing users without a migration.

## Completed Features

- [x] User authentication (login/signup with passwords and JWT)
- [x] Gamification system (XP rewards, levels, difficulty tiers)
- [x] Preset habit templates (15 templates with built-in XP values)
- [x] Protected routes with auth middleware
- [x] Comprehensive backend test suite
- [x] Cascading habit deletion (removes records, reclaims XP)

## Frontend To-Do

- [x] **Habit Streaks UI** - Display best streak on each habit card, with a button to reveal the current streak
- [x] **Calendar View** - Monthly calendar; per-habit backfill (tap a day) + all-habits overview
- [x] **Statistics / Charts** - Visual progress charts (completion rates, XP over time) powered by `/api/stats`
- [ ] **Habit Categories & Tags** - Organize habits with categories/tags and filter by them
- [x] **Dark Mode** - Dark theme toggle using CSS variables (persisted, honors system preference)
- [x] **Mobile Responsiveness** - Responsive layouts at the 640px breakpoint (header, cards, forms, calendar)
- [ ] **Notifications / Reminders UI** - Settings page for configuring habit reminders
- [x] **Data Export UI** - Export CSV/JSON buttons on the Profile page
- [x] **Edit Habit** - Edit an existing habit (name, description, frequency, color, XP)
- [x] **User Profile Page** - Stats, edit username, change password, delete account

## Backend To-Do

- [x] **Streak Calculation** - API logic to compute current/longest streaks per habit
- [x] **Statistics Endpoints** - Endpoints for aggregated stats (completion rates, XP trends)
- [ ] **Categories/Tags Model** - Category/tag schema and association with habits
- [ ] **Reminder System** - Scheduled notifications (email or push) for habit reminders
- [x] **Data Export Endpoint** - `GET /api/export` (CSV/JSON of the user's data)
- [ ] **Rate Limiting** - Rate limiting middleware to protect API endpoints
- [ ] **Input Validation** - express-validator or similar for stricter request validation
- [ ] **Password Reset** - Forgot password / reset flow with email
- [ ] **Habit Archiving** - Soft-delete / archive habits instead of permanent deletion
- [ ] **Pagination** - Pagination for habits and records list endpoints
