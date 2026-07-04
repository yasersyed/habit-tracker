import express from 'express';
import { body, param, query } from 'express-validator';
import HabitRecord from '../models/HabitRecord.js';
import Habit from '../models/Habit.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import {
  paginationQueryValidators,
  parsePaginationQuery,
  setPaginationHeaders
} from '../middleware/pagination.js';
import runValidation from '../middleware/validate.js';

const router = express.Router();

router.use(authMiddleware);

const recordIdParam = [param('id').isMongoId().withMessage('Invalid record id'), runValidation];
const habitListQueryValidators = [
  param('habitId').isMongoId().withMessage('Invalid habit id'),
  ...paginationQueryValidators,
  runValidation
];
const rangeQueryValidators = [
  query('startDate').isISO8601().withMessage('Invalid startDate'),
  query('endDate').isISO8601().withMessage('Invalid endDate'),
  ...paginationQueryValidators,
  runValidation
];

const recordBodyValidators = [
  body('habitId').isMongoId().withMessage('Invalid habitId'),
  body('date').isISO8601().withMessage('Invalid date'),
  body('completed').optional().isBoolean().withMessage('Invalid completed'),
  body('notes').optional().isString().withMessage('Invalid notes'),
  runValidation
];

const listQueryValidators = [...paginationQueryValidators, runValidation];

async function getUserXpInfo(userId) {
  const user = await User.findById(userId);
  return { level: user.level, xp: user.xp, totalXp: user.totalXp };
}

// Get all records for a habit (verify ownership)
router.get(
  '/habit/:habitId',
  habitListQueryValidators,
  async (req, res) => {
  try {
    const filter = {
      habitId: req.params.habitId,
      userId: req.user._id
    };
    const { page, limit, skip } = parsePaginationQuery(req);
    const [total, records] = await Promise.all([
      HabitRecord.countDocuments(filter),
      HabitRecord.find(filter)
        .sort({ date: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    setPaginationHeaders(res, total, page, limit);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  }
);

// Get all records for authenticated user
router.get('/', listQueryValidators, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    const { page, limit, skip } = parsePaginationQuery(req);
    const [total, records] = await Promise.all([
      HabitRecord.countDocuments(filter),
      HabitRecord.find(filter)
        .populate('habitId')
        .sort({ date: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    setPaginationHeaders(res, total, page, limit);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get records for a specific date range
router.get('/range', rangeQueryValidators, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {
      userId: req.user._id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    const { page, limit, skip } = parsePaginationQuery(req);
    const [total, records] = await Promise.all([
      HabitRecord.countDocuments(filter),
      HabitRecord.find(filter)
        .populate('habitId')
        .sort({ date: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    setPaginationHeaders(res, total, page, limit);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update habit record
router.post('/', recordBodyValidators, async (req, res) => {
  try {
    const { habitId, date, completed, notes } = req.body;

    const recordDate = new Date(date);
    recordDate.setUTCHours(0, 0, 0, 0);

    const habit = await Habit.findById(habitId);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    const xpReward = habit.xpReward || 0;

    let record = await HabitRecord.findOne({
      habitId,
      userId: req.user._id,
      date: recordDate
    });

    if (record) {
      const wasCompleted = record.completed;
      const isNowCompleted = completed !== undefined ? completed : record.completed;

      record.completed = isNowCompleted;
      record.notes = notes !== undefined ? notes : record.notes;
      await record.save();

      // Toggle XP: false->true = award, true->false = deduct
      if (!wasCompleted && isNowCompleted) {
        const user = await User.findById(req.user._id);
        user.totalXp += xpReward;
        await user.save();
      } else if (wasCompleted && !isNowCompleted) {
        const user = await User.findById(req.user._id);
        user.totalXp = Math.max(0, user.totalXp - xpReward);
        await user.save();
      }
    } else {
      record = new HabitRecord({
        habitId,
        userId: req.user._id,
        date: recordDate,
        completed,
        notes
      });
      await record.save();

      // Award XP for new completed record
      if (completed) {
        const user = await User.findById(req.user._id);
        user.totalXp += xpReward;
        await user.save();
      }
    }

    const userXp = await getUserXpInfo(req.user._id);
    res.status(201).json({ record, userXp });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete habit record (verify ownership)
router.delete('/:id', recordIdParam, async (req, res) => {
  try {
    const record = await HabitRecord.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Deduct XP if record was completed
    if (record.completed) {
      const habit = await Habit.findById(record.habitId);
      if (habit) {
        const user = await User.findById(req.user._id);
        user.totalXp = Math.max(0, user.totalXp - (habit.xpReward || 0));
        await user.save();
      }
    }

    await record.deleteOne();
    const userXp = await getUserXpInfo(req.user._id);
    res.json({ message: 'Record deleted', userXp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
