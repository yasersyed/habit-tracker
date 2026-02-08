import React, { useState, useEffect } from 'react';
import { habitAPI, recordAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HabitForm from './HabitForm';
import HabitCard from './HabitCard';
import './HabitDashboard.css';

function xpForLevel(level) {
  if (level <= 10) return 100;
  if (level <= 20) return 250;
  if (level <= 30) return 500;
  return 1000;
}

function HabitDashboard() {
  const [habits, setHabits] = useState([]);
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [userXp, setUserXp] = useState({ level: 1, xp: 0, totalXp: 0 });
  const { user } = useAuth();

  useEffect(() => {
    loadHabits();
    loadTodayRecords();
    loadUserXp();
  }, []);

  const loadUserXp = async () => {
    try {
      const response = await userAPI.getProfile();
      const { level, xp, totalXp } = response.data;
      setUserXp({ level, xp, totalXp });
    } catch (error) {
      console.error('Error loading user XP:', error);
    }
  };

  const loadHabits = async () => {
    try {
      const response = await habitAPI.getAll();
      setHabits(response.data);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const loadTodayRecords = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const response = await recordAPI.getByRange(today, tomorrow);
      setRecords(response.data);
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const handleCreateHabit = async (habitData) => {
    try {
      await habitAPI.create(habitData);
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

      let response;
      if (existingRecord) {
        response = await recordAPI.delete(existingRecord._id);
      } else {
        response = await recordAPI.create({
          habitId,
          date: today,
          completed: true
        });
      }

      if (response.data.userXp) {
        setUserXp(response.data.userXp);
      }

      loadTodayRecords();
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const isHabitCompleted = (habitId) => {
    return records.some(r => r.habitId._id === habitId);
  };

  const xpToNext = xpForLevel(userXp.level);
  const xpPercent = xpToNext > 0 ? (userXp.xp / xpToNext) * 100 : 0;

  return (
    <div className="habit-dashboard">
      <div className="xp-progress-bar">
        <div className="xp-header">
          <span className="level-badge">LVL {userXp.level}</span>
          <span className="xp-text">{userXp.xp} / {xpToNext} XP</span>
        </div>
        <div className="xp-bar-bg">
          <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      <div className="dashboard-header">
        <h2>Welcome, {user?.username}!</h2>
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
