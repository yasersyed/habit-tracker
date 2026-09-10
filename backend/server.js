import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import habitRoutes from './routes/habits.js';
import habitRecordRoutes from './routes/habitRecords.js';
import statsRoutes from './routes/stats.js';
import exportRoutes from './routes/export.js';

dotenv.config();

// App version, read from package.json (kept in sync across packages via
// `npm run bump`). Exposed at /api/version and included in /api/health.
const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf8')
);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];
// Set CORS_ORIGINS=* to allow any origin (convenient for a hosted testing
// deployment where the public URL/IP isn't known ahead of time). Tighten to
// explicit origins for production.
const allowAllOrigins = allowedOrigins.includes('*');

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (e.g. curl, server-to-server)
    if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/records', habitRecordRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/export', exportRoutes);

// Version
app.get('/api/version', (req, res) => {
  res.json({ version });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version, message: 'Habit Tracker API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
