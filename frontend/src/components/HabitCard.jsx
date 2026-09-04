import React, { useState } from 'react';
import './HabitCard.css';

function HabitCard({ habit, isCompleted, streak, onToggle, onDelete }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const { current = 0, longest = 0 } = streak || {};

  const dayLabel = (n) => (n === 1 ? 'day' : 'days');

  return (
    <div className="habit-card" style={{ borderLeftColor: habit.color }}>
      <div className="habit-card-header">
        <h3>{habit.name}</h3>
        <button className="delete-btn" onClick={onDelete}>×</button>
      </div>

      {habit.description && (
        <p className="habit-description">{habit.description}</p>
      )}

      <div className="habit-meta">
        <span className="frequency-badge">{habit.frequency}</span>
        <span className="xp-badge">+{habit.xpReward || 25} XP</span>
      </div>

      {/* Best streak leads by default — it celebrates progress without
          nagging about whether today's streak is intact. */}
      <div className="streak-section">
        <div className="streak-best" title="Your longest run so far">
          <span className="streak-icon" aria-hidden="true">🏆</span>
          <span className="streak-best-label">Best streak</span>
          <span className="streak-best-value">
            {longest} {dayLabel(longest)}
          </span>
        </div>

        <button
          type="button"
          className="streak-toggle"
          aria-expanded={showCurrent}
          onClick={() => setShowCurrent((v) => !v)}
        >
          {showCurrent ? 'Hide current streak' : 'Show current streak'}
        </button>

        {showCurrent && (
          <div className="streak-current">
            {current > 0 ? (
              <span>
                <span className="streak-icon" aria-hidden="true">🔥</span>
                On a {current}-{dayLabel(current)} streak right now
              </span>
            ) : (
              <span className="streak-current-empty">
                No active streak — complete it today to start one.
              </span>
            )}
          </div>
        )}
      </div>

      <button
        className={`track-btn ${isCompleted ? 'completed' : ''}`}
        onClick={onToggle}
      >
        {isCompleted ? '✓ Completed Today' : 'Mark as Complete'}
      </button>
    </div>
  );
}

export default HabitCard;
