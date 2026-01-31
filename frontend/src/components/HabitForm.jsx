import React, { useState } from 'react';
import { PRESET_HABITS, XP_TIERS } from '../data/presetHabits';
import './HabitForm.css';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

const DIFFICULTIES = Object.keys(XP_TIERS);

function HabitForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    color: '#3b82f6',
    xpReward: XP_TIERS.Easy
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState('Easy');
  const [selectedPreset, setSelectedPreset] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name) {
      onSubmit(formData);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePresetChange = (e) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);

    if (!presetName) return;

    const preset = PRESET_HABITS.find(p => p.name === presetName);
    if (preset) {
      setFormData({
        ...formData,
        name: preset.name,
        description: preset.description,
        xpReward: preset.xpReward
      });
      setSelectedDifficulty(preset.difficulty);
    }
  };

  const handleDifficultyChange = (e) => {
    const difficulty = e.target.value;
    setSelectedDifficulty(difficulty);
    setFormData({
      ...formData,
      xpReward: XP_TIERS[difficulty]
    });
  };

  return (
    <form className="habit-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Habit Template</label>
        <select value={selectedPreset} onChange={handlePresetChange}>
          <option value="">Custom Habit</option>
          {PRESET_HABITS.map(preset => (
            <option key={preset.name} value={preset.name}>
              {preset.name} — {preset.difficulty} ({preset.xpReward} XP)
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Habit Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Morning Exercise"
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional description"
          rows="3"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Frequency</label>
          <select name="frequency" value={formData.frequency} onChange={handleChange}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="form-group">
          <label>Difficulty (XP Reward)</label>
          <select value={selectedDifficulty} onChange={handleDifficultyChange}>
            {DIFFICULTIES.map(d => (
              <option key={d} value={d}>
                {d} — {XP_TIERS[d]} XP
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Color</label>
          <div className="color-picker">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`color-option ${formData.color === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          Create Habit
        </button>
      </div>
    </form>
  );
}

export default HabitForm;
