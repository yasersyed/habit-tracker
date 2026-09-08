# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/yasersyed/habit-tracker/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yasersyed/habit-tracker/releases/tag/v0.1.0
