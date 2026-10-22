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

### Habit Management
- Create, edit, and delete habits with a name, description, frequency (daily/weekly/monthly), and color
- 15 preset habit templates with built-in difficulty tiers and XP values, or build a fully custom habit
- Custom color picker — preset swatches or an HSV color wheel with a brightness slider
- Archive a habit to hide it from the dashboard without losing its history; unarchive or permanently delete it from a dedicated Archived page

### Tracking & Insights
- Mark habits complete/incomplete for any day
- Per-habit current and longest streaks, shown on each card
- GitHub-style completion heatmap with summary stats (today, streak, active days, total)
- Monthly calendar view — pick a habit to backfill past days, or see a read-only all-habits completion overview
- Statistics tab with a selectable date range: KPIs, a daily-completions chart, a cumulative-XP chart, and per-habit completion-rate bars

### Gamification
- XP rewards per habit, by difficulty tier or custom value
- Account leveling with a smoothly increasing XP curve and a level/XP progress bar
- Star animation when you mark a habit complete

### Account & Data
- JWT-based authentication (signup, login, logout) with rate-limited login/register
- Profile page — view stats, edit username, change password, or delete your account (cascades habits and records)
- Export all habit and completion data as CSV or JSON
- Dark mode, synced with your OS preference and remembered across visits
- Responsive layouts down to phone width

### Security & Architecture
- Protected routes — all habit data is user-specific
- Input validation on every endpoint (`express-validator`)
- Paginated list endpoints

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

### Authentication (`/api/auth`)
- `POST /register` - Register a new user (rate-limited)
- `POST /login` - Login with email and password (rate-limited)
- `GET /me` - Get current authenticated user (protected)

### Users (Protected, `/api/users`)
- `GET /me` - Get current user's profile
- `PUT /me` - Update current user's profile (username)
- `PUT /me/password` - Change password (body: {currentPassword, newPassword})
- `DELETE /me` - Delete current user's account (cascades habits and records)

### Habits (Protected, `/api/habits`)
- `GET /?page=1&limit=20` - Get paginated habits for authenticated user; add `?archived=true` to list archived habits instead
- `GET /streaks?today=YYYY-MM-DD` - Get `{ current, longest }` streaks for every habit, keyed by habit id
- `GET /:id/streak?today=YYYY-MM-DD` - Get `{ current, longest }` streak for one habit
- `GET /:id` - Get habit by ID
- `POST /` - Create new habit
- `PUT /:id` - Update habit
- `PUT /:id/archive` - Archive a habit (hides it from the default list; history is kept)
- `PUT /:id/unarchive` - Unarchive a habit
- `DELETE /:id` - Permanently delete habit (cascades to records, reclaims XP)

### Habit Records (Protected, `/api/records`)
- `GET /?page=1&limit=20` - Get paginated records for authenticated user
- `GET /habit/:habitId?page=1&limit=20&startDate=&endDate=` - Get paginated records for a habit, optionally bounded by date
- `GET /range?startDate=&endDate=&page=1&limit=20` - Get paginated records for a date range
- `POST /` - Create a record, or update the existing one for that habit/date (toggles `completed`, awards or deducts XP)
- `DELETE /:id` - Delete habit record (deducts XP if it was completed)

### Statistics (Protected, `/api/stats`)
All endpoints accept an optional `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (default: the last 30 days ending today, UTC).
- `GET /summary` - KPIs for the range: `{ range, habitCount, totalCompletions, activeDays, xpEarned, completionRate }`
- `GET /daily` - Zero-filled per-day series for trend charts: `{ range, days: [{ date, completions, xpEarned, cumulativeXp }] }`
- `GET /habits` - Per-habit breakdown: `{ range, habits: [{ habitId, name, color, frequency, completions, expected, completionRate, xpEarned }] }`

### Export (Protected, `/api/export`)
- `GET /?format=csv|json` - Download all of the user's habits and completion history (default: `json`)

### Meta
- `GET /api/version` - App version
- `GET /api/health` - Health check (includes version)

Paginated list endpoints return standard pagination headers:
- `X-Total-Count`: total matching documents
- `X-Page`: current page
- `X-Page-Size`: page size
- `X-Total-Pages`: total page count

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
- password (hashed, min 6 characters, never returned by the API)
- level, xp, totalXp — `totalXp` is the source of truth; `level` and `xp` (progress within the level) are always recomputed from it, so the leveling curve can change without a data migration
- createdAt

### Habit
- userId (reference to User)
- name
- description
- frequency (daily/weekly/monthly)
- xpReward
- color
- archived, archivedAt — soft-delete; an archived habit is hidden from the default list but keeps all of its records and earned XP
- createdAt

### HabitRecord
- habitId (reference to Habit)
- userId (reference to User)
- date (normalized to midnight UTC)
- completed (boolean)
- notes
- createdAt
- Unique compound index on (habitId, date) — one record per habit per day

## Security

- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 7 days by default
- All habit and record endpoints are protected
- Users can only access their own data

## Kubernetes Deployment

The application includes Kubernetes manifests using Kustomize with base + overlay structure.

### Build Docker Images

```bash
docker buildx build -t habit-tracker-backend ./backend
docker buildx build -t habit-tracker-frontend ./frontend
```

### Deploy to Dev (NodePort)

```bash
kubectl apply -k kube/overlays/dev/
```

Access the app at `http://<node-ip>:30080`.

### Deploy to Prod (LoadBalancer)

```bash
kubectl apply -k kube/overlays/prod/
```

### Verify Deployment

```bash
kubectl get all -n habit-tracker
```

### Secrets

Update `kube/base/secrets.yaml` with production credentials before deploying. The default values are placeholders only.

## Production Deployment Prerequisites

- **CORS Configuration**: The backend restricts origins via the `CORS_ORIGINS` environment variable (comma-separated list). It defaults to `http://localhost:5173` when unset. Set this to your production domain(s) before deploying.
- **Vite Proxy Replacement**: The Vite dev server proxy (`/api` → `localhost:5000`) only works in development. In production, either serve the frontend from the same origin as the backend (e.g. behind a reverse proxy like Nginx) or configure the frontend to call the backend URL directly with proper CORS headers.
- **JWT Secret**: Replace the default `JWT_SECRET` in `.env` with a strong, randomly generated secret.
- **HTTPS**: Serve all traffic over HTTPS to protect JWT tokens and credentials in transit.
- **Environment Variables**: Ensure all `.env` values are set for production (database URI, port, secrets) and never committed to version control.

## Roadmap

### Bugs & Tech Debt (Priority)

- [x] **`.env` in `.gitignore`** — Already handled
- [x] **MongoDB has no authentication** — Add credentials to the Docker Compose config and connection string
- [x] **CORS wide open** — Restrict `cors()` to specific allowed origins
- [x] **No rate limiting on auth** — Add rate limiting middleware to login/register endpoints
- [ ] **Toggle logic bug** — Dashboard creates/deletes records to toggle, but POST route has dead code for toggling `completed` flag. Pick one approach and remove the other
- [x] **Habit deletion doesn't cascade** — Deleting a habit leaves orphaned `HabitRecord` documents and doesn't reclaim their XP
- [x] **Fragile date handling** — `loadTodayRecords` uses `Date.now() + 86400000` which breaks on DST transitions; frontend sends local date strings but backend normalizes to UTC midnight
- [x] **Duplicated `xpForLevel()`** — Exists in both `backend/utils/xp.js` and `frontend/src/components/HabitDashboard.jsx`; extract to a shared module
- [x] **Duplicated `presetHabits.js`** — Identical files in frontend and backend `data/` dirs; backend copy is unused
- [x] **`/api/auth/me` bypasses auth middleware** — Has inline JWT verification instead of using the shared middleware
- [x] **No input validation/sanitization** — No protection against NoSQL injection; add express-validator or similar
- [ ] **No React error boundary** — Unhandled errors white-screen the app
- [x] **No production Docker setup** — No Dockerfiles for backend/frontend, no nginx config
- [ ] **No structured logging** — Only `console.log/error`
- [x] **Automated releases** — GitHub Actions workflow on `v*` tags: verify the tag matches `package.json`, create the GitHub Release from `CHANGELOG.md`, and push multi-arch Docker images to Docker Hub (needs `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` secrets)
- [x] **Pagination for list endpoints** — Prevents degradation with large datasets

### Frontend To-Do

- [x] **Habit Streaks UI** - Display current and best streak counts on each habit card
- [x] **Completion Heatmap** - GitHub-style activity heatmap showing daily completions with summary stats (today, streak, active days, total)
- [x] **Calendar View** - Calendar component showing completion history for habits
- [x] **Statistics / Charts** - Visual progress charts (completion rates, XP over time), now on their own `/statistics` tab
- [ ] **Habit Categories & Tags** - Organize habits with categories/tags and filter by them
- [x] **Dark Mode** - Dark theme toggle using CSS variables
- [x] **Mobile Responsiveness** - Improve layouts for small screens (cards, forms, navigation)
- [ ] **Notifications / Reminders UI** - Settings page for configuring habit reminders
- [x] **Data Export UI** - Button to export habit data as CSV or JSON
- [x] **Edit Habit** - UI for editing an existing habit (name, frequency, color, difficulty)
- [x] **User Profile Page** - View/edit profile info and see overall stats
- [x] **Habit Archiving UI** - Archive button on habit cards; `/archived` page to unarchive or permanently delete
- [ ] **Level-Up Animation** - Animated graphic/overlay when user reaches a new level *(a gold-star animation plays on marking a habit complete, but nothing level-up-specific yet)*
- [ ] **Toast Notifications** - Add `react-hot-toast` for success/error feedback on habit actions *(still plain `alert()`/`confirm()` — no toast library added)*
- [ ] **Animations** - Add `framer-motion` for UI transitions (card entries, level-up effects) *(the complete-habit star animation is a plain CSS keyframe; no `framer-motion` dependency added)*
- [ ] **Charts Library** - Add `recharts` for statistics/charts feature *(Statistics shipped as hand-built inline SVG; no `recharts` dependency added)*
- [ ] **Date Utilities** - Add `date-fns` for calendar view and reliable date handling *(Calendar and streak/date logic use custom utilities instead; no `date-fns` dependency added)*

### Backend To-Do

- [x] **Streak Calculation** - API logic to compute current/longest streaks per habit
- [x] **Statistics Endpoints** - Endpoints for aggregated stats (completion rates, XP trends)
- [ ] **Categories/Tags Model** - Category/tag schema and association with habits
- [ ] **Reminder System** - Scheduled notifications (email or push) for habit reminders
- [x] **Data Export Endpoint** - `GET /api/export` to generate CSV/JSON of user data
- [x] **Rate Limiting** - Rate limiting middleware to protect API endpoints *(applied to auth login/register; not yet extended to the rest of the API)*
- [x] **Input Validation** - express-validator or similar for stricter request validation
- [ ] **Password Reset** - Forgot password / reset flow with email
- [x] **Habit Archiving** - Soft-delete / archive habits instead of permanent deletion
- [x] **Pagination** - Pagination for habits and records list endpoints
