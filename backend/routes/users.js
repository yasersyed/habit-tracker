import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get current user's profile (protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      level: req.user.level,
      xp: req.user.xp,
      totalXp: req.user.totalXp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update current user's profile (protected)
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (req.body.username) user.username = req.body.username;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      level: updatedUser.level,
      xp: updatedUser.xp,
      totalXp: updatedUser.totalXp
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
