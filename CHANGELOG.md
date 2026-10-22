# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-10-22

### Added
- Log in with either your username or email. The backend accepts a new
  `identifier` field on `POST /api/auth/login`; `email` still works.
- On narrow screens the nav shows Dashboard, Calendar and Statistics, with
  Profile and Archived behind a **More** toggle so links are no longer cut off.
- You're logged out automatically after 15 minutes without activity. Activity
  in any open tab counts.

### Changed
- Failed logins now show "Invalid username/email or password".
- Completed habits move to the bottom of the dashboard.

### Fixed
- Submitting the login form with an empty field now shows a warning.
- Failed logins reloaded the page and hid the error message; the error now
  stays visible.
- The heatmap shaded any day with one completion at full strength; shading now
  scales with the share of habits completed that day.
- Weekly and monthly habits only showed as completed on the day they were
  logged, and their streaks counted days. They now stay completed for the whole
  week (Sunday–Saturday) or month, and streaks count consecutive weeks or months.

## [0.4.0] - 2026-10-20

### Added
- Habit Archiving: archive a habit from its card (📦) to remove it from the
  dashboard without losing its history — records, earned XP, stats, and
  exports are unaffected. A new `/archived` page lists archived habits with
  options to unarchive or permanently delete them. Backend: `PUT
  /api/habits/:id/archive` and `/unarchive`, and `GET /api/habits?archived=true`.
- Configurable Docker ports: set `FRONTEND_PORT` (host port, default 80) and
  `BACKEND_PORT` (default 5000) in `.env`. The frontend's nginx config is now
  rendered at startup, so the `/api` proxy follows `BACKEND_PORT` without
  rebuilding the image.

### Changed
- Deployment docs build images with `docker buildx`, and
  `docker-compose.hub.yml` now defaults to the `0.4.0` images.

### Fixed
- The completion heatmap showed only the 20 most recent completions across all
  habits; it now loads every completion in its 15-week window.

## [0.3.0] - 2026-09-12

### Added
- Habit color wheel: an HSV wheel with a brightness slider for choosing any
  habit color beyond the preset swatches; it closes on an outside click or
  Escape.
- A gold-star animation plays when a habit is marked complete (respects
  `prefers-reduced-motion`).

### Changed
- Statistics moved from the dashboard into its own tab (`/statistics`).
- Recolored the brand accent from purple to emerald green throughout — accents,
  the header/auth gradient, the XP chart, and the heatmap/calendar intensity
  ramps.

### Fixed
- Calendar and heatmap marked completions on the previous day for users in
  timezones behind UTC; stored dates (UTC-midnight day markers) are now read
  back with UTC components so they align with the day tapped.

## [0.2.0] - 2026-09-11

### Added
- Dark mode: a theme toggle in the header, built on CSS custom properties.
  The choice is saved to `localStorage`, defaults to the OS preference, and is
  applied before first paint to avoid a flash of the wrong theme.
- Edit Habit: edit an existing habit's name, description, frequency, color, and
  XP from a reused create/edit form.
- Calendar View (`/calendar`): a monthly grid with per-habit backfill (tap a
  past day to mark/unmark it) and a read-only "all habits" completion overview.
- User Profile page (`/profile`): overall stats, edit username, change password
  (`PUT /api/users/me/password`), and delete account (`DELETE /api/users/me`,
  cascading habits and records).
- Data Export: `GET /api/export?format=csv|json` for the user's data, with
  CSV/JSON download buttons on the Profile page.
- Mobile responsiveness: layouts adapt at the 640px breakpoint (wrapping header
  nav, stacked cards/forms, a fitted calendar grid).

### Changed
- Header now has navigation (Dashboard / Calendar / Profile).

## [0.1.0] - 2026-09-08

First versioned release. Establishes the baseline while the app is in user
testing (pre-1.0 — expect changes).

### Added
- User authentication (signup/login) with hashed passwords and JWT.
- Gamification: XP rewards, levels, and difficulty tiers.
- Preset habit templates with built-in XP values.
- Habit tracking with daily completion records and a completion heatmap.
- Habit streaks — best (longest) streak shown per card with a reveal for the
  current streak — backed by `GET /api/habits/streaks` and `/:id/streak`.
- Statistics endpoints (`/api/stats/summary`, `/daily`, `/habits`) and a
  dashboard Statistics panel (KPIs, XP trend, daily completions, per-habit
  completion rates).
- Smoothly increasing leveling curve (`100 + (level - 1) * 50`) with level/xp
  always derived from `totalXp`.
- Single-VM Docker Compose deployment (`docker-compose.prod.yml`) with a
  bundled MongoDB, plus an AWS EC2/Lightsail deployment guide and a deployment
  roadmap (HTTPS, Kubernetes).
- Project versioning: unified SemVer across packages, `GET /api/version`
  (version also included in `/api/health`), an in-app version footer, a
  `npm run bump` script, and a `npm run check:version` guard.

[Unreleased]: https://github.com/yasersyed/habit-tracker/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/yasersyed/habit-tracker/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/yasersyed/habit-tracker/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/yasersyed/habit-tracker/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/yasersyed/habit-tracker/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yasersyed/habit-tracker/releases/tag/v0.1.0
