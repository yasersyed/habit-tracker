import express from 'express';
import HabitRecord from '../models/HabitRecord.js';

const router = express.Router();

// Get all records for a habit
router.get('/habit/:habitId', async (req, res) => {
  try {
    const records = await HabitRecord.find({ habitId: req.params.habitId }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all records for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const records = await HabitRecord.find({ userId: req.params.userId })
      .populate('habitId')
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get records for a specific date range
router.get('/user/:userId/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const records = await HabitRecord.find({
      userId: req.params.userId,
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

// Create or update habit record (track habit for a day)
router.post('/', async (req, res) => {
  try {
    const { habitId, userId, date, completed, notes } = req.body;

    // Normalize date to midnight UTC
    const recordDate = new Date(date);
    recordDate.setUTCHours(0, 0, 0, 0);

    // Try to find existing record for this habit and date
    let record = await HabitRecord.findOne({
      habitId,
      date: recordDate
    });

    if (record) {
      // Update existing record
      record.completed = completed !== undefined ? completed : record.completed;
      record.notes = notes !== undefined ? notes : record.notes;
      await record.save();
    } else {
      // Create new record
      record = new HabitRecord({
        habitId,
        userId,
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

// Delete habit record
router.delete('/:id', async (req, res) => {
  try {
    const record = await HabitRecord.findById(req.params.id);
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
