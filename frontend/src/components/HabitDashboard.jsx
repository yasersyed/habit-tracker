import React, { useState, useEffect } from 'react';
import { habitAPI, recordAPI } from '../services/api';
import HabitForm from './HabitForm';
import HabitCard from './HabitCard';
import './HabitDashboard.css';

function HabitDashboard({ userId }) {
  const [habits, setHabits] = useState([]);
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadHabits();
    loadTodayRecords();
  }, [userId]);

  const loadHabits = async () => {
    try {
      const response = await habitAPI.getByUser(userId);
      setHabits(response.data);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const loadTodayRecords = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const response = await recordAPI.getByRange(userId, today, tomorrow);
      setRecords(response.data);
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const handleCreateHabit = async (habitData) => {
    try {
      await habitAPI.create({ ...habitData, userId });
      loadHabits();
      setShowForm(false);
    } catch (error) {
      console.error('Error creating habit:', error);
      alert('Error creating habit');
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await habitAPI.delete(habitId);
        loadHabits();
      } catch (error) {
        console.error('Error deleting habit:', error);
      }
    }
  };

  const handleToggleHabit = async (habitId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingRecord = records.find(r => r.habitId._id === habitId);

      if (existingRecord) {
        await recordAPI.delete(existingRecord._id);
      } else {
        await recordAPI.create({
          habitId,
          userId,
          date: today,
          completed: true
        });
      }
      loadTodayRecords();
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const isHabitCompleted = (habitId) => {
    return records.some(r => r.habitId._id === habitId);
  };

  return (
    <div className="habit-dashboard">
      <div className="dashboard-header">
        <h2>My Habits</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Habit'}
        </button>
      </div>

      {showForm && (
        <HabitForm onSubmit={handleCreateHabit} onCancel={() => setShowForm(false)} />
      )}

      <div className="habits-grid">
        {habits.length === 0 ? (
          <p className="no-habits">No habits yet. Create your first habit to get started!</p>
        ) : (
          habits.map(habit => (
            <HabitCard
              key={habit._id}
              habit={habit}
              isCompleted={isHabitCompleted(habit._id)}
              onToggle={() => handleToggleHabit(habit._id)}
              onDelete={() => handleDeleteHabit(habit._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default HabitDashboard;
