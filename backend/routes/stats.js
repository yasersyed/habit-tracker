import express from 'express';
import { query } from 'express-validator';
import Habit from '../models/Habit.js';
import HabitRecord from '../models/HabitRecord.js';
import authMiddleware from '../middleware/auth.js';
import runValidation from '../middleware/validate.js';
import { toUtcDayNumber } from '../../shared/streak.js';
import { computeStats, dayNumberToISODate } from '../../shared/stats.js';

const router = express.Router();

router.use(authMiddleware);

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 30;

const rangeQueryValidators = [
  query('startDate').optional().isISO8601().withMessage('Invalid startDate'),
  query('endDate').optional().isISO8601().withMessage('Invalid endDate'),
  runValidation
];

// Resolve the requested inclusive day-number range, defaulting to the last
// DEFAULT_WINDOW_DAYS ending today (UTC). Returns null when startDate > endDate.
function resolveRange(req) {
  const endDay = req.query.endDate
    ? toUtcDayNumber(new Date(req.query.endDate))
    : toUtcDayNumber(new Date());
  const startDay = req.query.startDate
    ? toUtcDayNumber(new Date(req.query.startDate))
    : endDay - (DEFAULT_WINDOW_DAYS - 1);

  if (startDay > endDay) return null;
  return { startDay, endDay };
}

function rangeMeta(startDay, endDay) {
  return {
    startDate: dayNumberToISODate(startDay),
    endDate: dayNumberToISODate(endDay),
    days: endDay - startDay + 1
  };
}

// Load the user's habits and completed in-range records, shaped for computeStats.
async function loadStatsData(userId, startDay, endDay) {
  const start = new Date(startDay * MS_PER_DAY);
  const endExclusive = new Date((endDay + 1) * MS_PER_DAY);

  const [habitDocs, recordDocs] = await Promise.all([
    Habit.find({ userId }).select('_id name color frequency xpReward createdAt'),
    HabitRecord.find({
      userId,
      completed: true,
      date: { $gte: start, $lt: endExclusive }
    }).select('habitId date')
  ]);

  const xpByHabit = new Map(
    habitDocs.map((h) => [h._id.toString(), h.xpReward ?? 0])
  );

  const habits = habitDocs.map((h) => ({
    id: h._id.toString(),
    name: h.name,
    color: h.color,
    frequency: h.frequency,
    xpReward: h.xpReward ?? 0,
    createdDayNumber: toUtcDayNumber(h.createdAt)
  }));

  const records = recordDocs.map((r) => {
    const habitId = r.habitId.toString();
    return {
      habitId,
      dayNumber: toUtcDayNumber(r.date),
      xpReward: xpByHabit.get(habitId) ?? 0
    };
  });

  return { habits, records };
}

// Shared loader: resolve range, fetch data, compute stats. Returns null on a
// bad range so callers can respond with 400.
async function getStats(req) {
  const range = resolveRange(req);
  if (!range) return null;
  const { startDay, endDay } = range;
  const { habits, records } = await loadStatsData(req.user._id, startDay, endDay);
  const stats = computeStats(records, habits, startDay, endDay);
  return { range, habits, stats };
}

const BAD_RANGE = { message: 'startDate must not be after endDate' };

// Overall summary KPIs for the range.
router.get('/summary', rangeQueryValidators, async (req, res) => {
  try {
    const result = await getStats(req);
    if (!result) return res.status(400).json(BAD_RANGE);
    const { range, habits, stats } = result;

    res.json({
      range: rangeMeta(range.startDay, range.endDay),
      habitCount: habits.length,
      totalCompletions: stats.totalCompletions,
      activeDays: stats.activeDays,
      xpEarned: stats.xpEarned,
      completionRate: stats.completionRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Per-day time series (zero-filled) for completion and XP trend charts.
router.get('/daily', rangeQueryValidators, async (req, res) => {
  try {
    const result = await getStats(req);
    if (!result) return res.status(400).json(BAD_RANGE);
    const { range, stats } = result;

    let cumulativeXp = 0;
    const days = stats.days.map((d) => {
      cumulativeXp += d.xpEarned;
      return {
        date: dayNumberToISODate(d.dayNumber),
        completions: d.completions,
        xpEarned: d.xpEarned,
        cumulativeXp
      };
    });

    res.json({ range: rangeMeta(range.startDay, range.endDay), days });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Per-habit breakdown: completions, expected occurrences, rate, XP earned.
router.get('/habits', rangeQueryValidators, async (req, res) => {
  try {
    const result = await getStats(req);
    if (!result) return res.status(400).json(BAD_RANGE);
    const { range, stats } = result;

    res.json({
      range: rangeMeta(range.startDay, range.endDay),
      habits: stats.perHabit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
