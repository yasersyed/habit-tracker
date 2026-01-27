import React from 'react';
import './HabitCard.css';

function HabitCard({ habit, isCompleted, onToggle, onDelete }) {
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
