import express from 'express';
import { query } from 'express-validator';
import Habit from '../models/Habit.js';
import HabitRecord from '../models/HabitRecord.js';
import authMiddleware from '../middleware/auth.js';
import runValidation from '../middleware/validate.js';

const router = express.Router();

router.use(authMiddleware);

// Export the authenticated user's habits and completion history as CSV or JSON.
router.get('/', [
  query('format').optional().isIn(['csv', 'json']).withMessage('Invalid format'),
  runValidation
], async (req, res) => {
  try {
    const format = req.query.format || 'json';

    const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: 1 });
    const records = await HabitRecord.find({ userId: req.user._id })
      .populate('habitId', 'name')
      .sort({ date: 1 });

    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const rows = records.map((r) => [
        esc(r.habitId?.name || ''),
        esc(new Date(r.date).toISOString().slice(0, 10)),
        esc(r.completed),
        esc(r.notes || '')
      ].join(','));
      const csv = ['Habit,Date,Completed,Notes', ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="habit-tracker-export-' + dateStr + '.csv"');
      return res.send(csv);
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      user: req.user.toPublicJSON(),
      habits: habits.map(h => ({
        _id: h._id,
        name: h.name,
        description: h.description,
        frequency: h.frequency,
        color: h.color,
        xpReward: h.xpReward,
        createdAt: h.createdAt
      })),
      records: records.map(r => ({
        habit: r.habitId?.name || null,
        habitId: r.habitId?._id || r.habitId,
        date: r.date,
        completed: r.completed,
        notes: r.notes || ''
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="habit-tracker-export-' + dateStr + '.json"');
    res.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
