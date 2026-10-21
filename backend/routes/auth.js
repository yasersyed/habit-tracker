import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import runValidation from '../middleware/validate.js';

const router = express.Router();

// Rate limits are configurable via env vars for testing/tuning
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_MAX, 10) || 10,
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: parseInt(process.env.REGISTER_RATE_WINDOW_MS, 10) || 60 * 60 * 1000,
  max: parseInt(process.env.REGISTER_RATE_MAX, 10) || 5,
  message: { message: 'Too many accounts created from this IP, please try again after an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const registerValidators = [
  body('username').optional().isString().withMessage('Invalid username'),
  body('email').optional().isString().withMessage('Invalid email'),
  body('password').optional().isString().withMessage('Invalid password'),
  runValidation
];

const loginValidators = [
  body('identifier').optional().isString().withMessage('Invalid username or email'),
  body('email').optional().isString().withMessage('Invalid email'),
  body('password').optional().isString().withMessage('Invalid password'),
  runValidation
];

// POST /api/auth/register
router.post('/register', registerLimiter, registerValidators, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, loginValidators, async (req, res) => {
  try {
    // `email` is still accepted so older clients keep working.
    const identifier = (req.body.identifier ?? req.body.email ?? '').trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide username or email and password' });
    }

    // Emails are stored lowercased; usernames are case-sensitive.
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }]
    }).select('+password');

    // Same message for both cases so the login form can't be used to probe
    // which accounts exist.
    const invalidMessage = 'Invalid username/email or password';

    if (!user) {
      return res.status(401).json({ message: invalidMessage });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: invalidMessage });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user.toPublicJSON());
});

export default router;
