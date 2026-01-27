import mongoose from 'mongoose';

const habitRecordSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one record per habit per day
habitRecordSchema.index({ habitId: 1, date: 1 }, { unique: true });

const HabitRecord = mongoose.model('HabitRecord', habitRecordSchema);

export default HabitRecord;
