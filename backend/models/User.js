import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { computeLevelInfo } from '../../shared/xp.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  totalXp: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('totalXp')) {
    const info = computeLevelInfo(this.totalXp);
    this.level = info.level;
    this.xp = info.xp;
  }

  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Public-safe representation. Level/xp are derived from totalXp so the current
// leveling curve always applies, even to users whose stored fields predate it.
userSchema.methods.toPublicJSON = function() {
  const { level, xp } = computeLevelInfo(this.totalXp);
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    level,
    xp,
    totalXp: this.totalXp
  };
};

const User = mongoose.model('User', userSchema);

export default User;
