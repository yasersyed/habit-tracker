import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import Habit from '../models/Habit.js';
import HabitRecord from '../models/HabitRecord.js';
import authMiddleware from '../middleware/auth.js';
import runValidation from '../middleware/validate.js';

const router = express.Router();

const updateMeValidators = [
  body('username').optional().isString().withMessage('Invalid username'),
  runValidation
];

const changePasswordValidators = [
  body('currentPassword').isString(),
  body('newPassword').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  runValidation
];

// Get current user's profile (protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json(req.user.toPublicJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update current user's profile (protected)
router.put('/me', authMiddleware, updateMeValidators, async (req, res) => {
  try {
    const user = req.user;

    if (req.body.username) user.username = req.body.username;

    const updatedUser = await user.save();
    res.json(updatedUser.toPublicJSON());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Change current user's password (protected)
router.put('/me/password', authMiddleware, changePasswordValidators, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const match = await user.comparePassword(req.body.currentPassword);
    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete current user's account, cascading their habits and records (protected)
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    await HabitRecord.deleteMany({ userId: req.user._id });
    await Habit.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
