import React, { useState, useEffect } from 'react';
import { habitAPI } from '../services/api';
import './ArchivedHabits.css';

function ArchivedHabits() {
  const [archivedHabits, setArchivedHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedHabits();
  }, []);

  const loadArchivedHabits = async () => {
    try {
      const response = await habitAPI.getAll({ archived: true });
      setArchivedHabits(response.data);
    } catch (error) {
      console.error('Error loading archived habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (habitId) => {
    try {
      await habitAPI.unarchive(habitId);
      loadArchivedHabits();
    } catch (error) {
      console.error('Error unarchiving habit:', error);
      alert('Error unarchiving habit');
    }
  };

  const handleDeletePermanently = async (habitId) => {
    if (!window.confirm('Permanently delete this habit? All of its records will be removed and any earned XP will be reclaimed. This cannot be undone.')) {
      return;
    }
    try {
      await habitAPI.delete(habitId);
      loadArchivedHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      alert('Error deleting habit');
    }
  };

  return (
    <div className="archived-page">
      <h2>Archived Habits</h2>

      {loading ? (
        <p className="archived-loading">Loading archived habits...</p>
      ) : archivedHabits.length === 0 ? (
        <p className="no-archived">No archived habits. Habits you archive from the dashboard will show up here.</p>
      ) : (
        <div className="archived-list">
          {archivedHabits.map(habit => (
            <div className="archived-row" key={habit._id}>
              <span className="archived-color" style={{ backgroundColor: habit.color }} />
              <div className="archived-info">
                <h3>{habit.name}</h3>
                <span className="archived-meta">
                  {habit.frequency} · +{habit.xpReward || 25} XP · Archived {new Date(habit.archivedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="archived-actions">
                <button className="btn-primary" onClick={() => handleUnarchive(habit._id)}>Unarchive</button>
                <button className="delete-btn-text" onClick={() => handleDeletePermanently(habit._id)}>Delete Permanently</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArchivedHabits;
