import express from 'express';
import HabitRecord from '../models/HabitRecord.js';
import Habit from '../models/Habit.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

async function getUserXpInfo(userId) {
  const user = await User.findById(userId);
  return { level: user.level, xp: user.xp, totalXp: user.totalXp };
}

// Get all records for a habit (verify ownership)
router.get('/habit/:habitId', async (req, res) => {
  try {
    const records = await HabitRecord.find({
      habitId: req.params.habitId,
      userId: req.user._id
    }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all records for authenticated user
router.get('/', async (req, res) => {
  try {
    const records = await HabitRecord.find({ userId: req.user._id })
      .populate('habitId')
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get records for a specific date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const records = await HabitRecord.find({
      userId: req.user._id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('habitId');
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update habit record
router.post('/', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
