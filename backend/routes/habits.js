import express from 'express';
import Habit from '../models/Habit.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get all habits for authenticated user
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get habit by ID (verify ownership)
router.get('/:id', async (req, res) => {
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
router.post('/', async (req, res) => {
  const habit = new Habit({
    userId: req.user._id,
    name: req.body.name,
    description: req.body.description,
    frequency: req.body.frequency,
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
router.put('/:id', async (req, res) => {
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
    if (req.body.color) habit.color = req.body.color;

    const updatedHabit = await habit.save();
    res.json(updatedHabit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete habit (verify ownership)
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    await habit.deleteOne();
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
