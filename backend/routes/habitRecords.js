import express from 'express';
import HabitRecord from '../models/HabitRecord.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

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

    let record = await HabitRecord.findOne({
      habitId,
      userId: req.user._id,
      date: recordDate
    });

    if (record) {
      record.completed = completed !== undefined ? completed : record.completed;
      record.notes = notes !== undefined ? notes : record.notes;
      await record.save();
    } else {
      record = new HabitRecord({
        habitId,
        userId: req.user._id,
        date: recordDate,
        completed,
        notes
      });
      await record.save();
    }

    res.status(201).json(record);
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

    await record.deleteOne();
    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
