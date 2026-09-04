import express from 'express';
import { body, param, query } from 'express-validator';
import Habit from '../models/Habit.js';
import HabitRecord from '../models/HabitRecord.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import {
  paginationQueryValidators,
  parsePaginationQuery,
  setPaginationHeaders
} from '../middleware/pagination.js';
import runValidation from '../middleware/validate.js';
import {
  toUtcDayNumber,
  streaksFromDayNumbers
} from '../../shared/streak.js';

const router = express.Router();

router.use(authMiddleware);

const idParam = [param('id').isMongoId().withMessage('Invalid habit id'), runValidation];

// Optional "today" anchor so the current-streak boundary follows the client's
// local calendar day rather than the server's UTC day.
const todayQueryValidator = [
  query('today')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Invalid today (expected YYYY-MM-DD)'),
  runValidation
];

function resolveTodayDayNumber(req) {
  return toUtcDayNumber(req.query.today ? new Date(req.query.today) : new Date());
}

const habitBodyValidators = [
  body('name').optional().isString().withMessage('Invalid name'),
  body('description').optional().isString().withMessage('Invalid description'),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  body('color').optional().isString().withMessage('Invalid color'),
  body('xpReward').optional().isInt({ min: 0 }).withMessage('Invalid xpReward'),
  runValidation
];

const listQueryValidators = [...paginationQueryValidators, runValidation];

// Get all habits for authenticated user
router.get('/', listQueryValidators, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    const { page, limit, skip } = parsePaginationQuery(req);

    const [total, habits] = await Promise.all([
      Habit.countDocuments(filter),
      Habit.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    setPaginationHeaders(res, total, page, limit);
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current + longest streaks for every habit of the authenticated user.
// Returns a map keyed by habit id: { [habitId]: { current, longest } }.
router.get('/streaks', todayQueryValidator, async (req, res) => {
  try {
    const todayDayNumber = resolveTodayDayNumber(req);

    const [habits, records] = await Promise.all([
      Habit.find({ userId: req.user._id }).select('_id'),
      HabitRecord.find({ userId: req.user._id, completed: true }).select('habitId date')
    ]);

    // Group completed-day numbers by habit.
    const daysByHabit = new Map();
    for (const record of records) {
      const key = record.habitId.toString();
      if (!daysByHabit.has(key)) daysByHabit.set(key, []);
      daysByHabit.get(key).push(toUtcDayNumber(record.date));
    }

    // Include every habit, even those without any records yet.
    const streaks = {};
    for (const habit of habits) {
      const key = habit._id.toString();
      streaks[key] = streaksFromDayNumbers(daysByHabit.get(key) || [], todayDayNumber);
    }

    res.json(streaks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current + longest streak for a single habit (verify ownership)
router.get('/:id/streak', idParam, todayQueryValidator, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const records = await HabitRecord.find({
      habitId: habit._id,
      userId: req.user._id,
      completed: true
    }).select('date');

    const dayNumbers = records.map((r) => toUtcDayNumber(r.date));
    const streak = streaksFromDayNumbers(dayNumbers, resolveTodayDayNumber(req));

    res.json(streak);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get habit by ID (verify ownership)
router.get('/:id', idParam, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new habit
router.post('/', habitBodyValidators, async (req, res) => {
  const habit = new Habit({
    userId: req.user._id,
    name: req.body.name,
    description: req.body.description,
    frequency: req.body.frequency,
    xpReward: req.body.xpReward,
    color: req.body.color
  });

  try {
    const newHabit = await habit.save();
    res.status(201).json(newHabit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update habit (verify ownership)
router.put('/:id', idParam, habitBodyValidators, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (req.body.name) habit.name = req.body.name;
    if (req.body.description) habit.description = req.body.description;
    if (req.body.frequency) habit.frequency = req.body.frequency;
    if (req.body.xpReward !== undefined) habit.xpReward = req.body.xpReward;
    if (req.body.color) habit.color = req.body.color;

    const updatedHabit = await habit.save();
    res.json(updatedHabit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete habit (verify ownership) — cascades to records and reclaims XP
router.delete('/:id', idParam, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Reclaim XP from completed records
    const completedCount = await HabitRecord.countDocuments({
      habitId: habit._id,
      completed: true
    });

    if (completedCount > 0) {
      const user = await User.findById(req.user._id);
      user.totalXp = Math.max(0, user.totalXp - completedCount * (habit.xpReward || 0));
      await user.save();
    }

    // Delete all records for this habit
    await HabitRecord.deleteMany({ habitId: habit._id });

    await habit.deleteOne();

    const user = await User.findById(req.user._id);
    const userXp = { level: user.level, xp: user.xp, totalXp: user.totalXp };
    res.json({ message: 'Habit deleted', userXp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
