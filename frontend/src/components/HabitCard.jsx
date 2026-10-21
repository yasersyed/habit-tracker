import React, { useState } from 'react';
import './HabitCard.css';

// Streaks and completion are counted per period, so labels follow the habit's frequency.
const PERIOD_LABELS = {
  daily: { unit: 'day', current: 'today', done: '✓ Completed Today' },
  weekly: { unit: 'week', current: 'this week', done: '✓ Completed This Week' },
  monthly: { unit: 'month', current: 'this month', done: '✓ Completed This Month' }
};

function HabitCard({ habit, isCompleted, streak, onToggle, onArchive, onEdit }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const { current = 0, longest = 0 } = streak || {};

  const period = PERIOD_LABELS[habit.frequency] || PERIOD_LABELS.daily;
  const unitLabel = (n) => (n === 1 ? period.unit : `${period.unit}s`);

  // Celebrate only the completing action, not un-marking.
  const handleToggle = () => {
    if (!isCompleted) setCelebrate(true);
    onToggle();
  };

  return (
    <div className="habit-card" style={{ borderLeftColor: habit.color }}>
      <div className="habit-card-header">
        <h3>{habit.name}</h3>
        <div className="card-actions">
          <button className="edit-btn" onClick={onEdit} aria-label="Edit habit" title="Edit habit">✎</button>
          <button className="archive-btn" onClick={onArchive} aria-label="Archive habit" title="Archive habit">📦</button>
        </div>
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
            {longest} {unitLabel(longest)}
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
                On a {current}-{period.unit} streak right now
              </span>
            ) : (
              <span className="streak-current-empty">
                No active streak — complete it {period.current} to start one.
              </span>
            )}
          </div>
        )}
      </div>

      <div className="track-btn-wrap">
        <button
          className={`track-btn ${isCompleted ? 'completed' : ''}`}
          onClick={handleToggle}
        >
          {isCompleted ? period.done : 'Mark as Complete'}
        </button>
        {celebrate && (
          <span
            className="star-burst"
            aria-hidden="true"
            onAnimationEnd={() => setCelebrate(false)}
          >
            ⭐
          </span>
        )}
      </div>
    </div>
  );
}

export default HabitCard;
