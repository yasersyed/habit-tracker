import React, { useState, useEffect } from 'react';
import { habitAPI, recordAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { localDateString, localTomorrowString, localCurrentPeriodStart } from '../utils/date';
import { xpForLevel } from '../../../shared/xp.js';
import { toUtcDayNumber, toPeriodNumber } from '../../../shared/streak.js';
import HabitForm from './HabitForm';
import HabitCard from './HabitCard';
import CompletionHeatmap from './CompletionHeatmap';
import './HabitDashboard.css';

function HabitDashboard() {
  const [habits, setHabits] = useState([]);
  const [records, setRecords] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [userXp, setUserXp] = useState({ level: 1, xp: 0, totalXp: 0 });
  const { user } = useAuth();

  useEffect(() => {
    loadHabits();
    loadPeriodRecords();
    loadStreaks();
    loadUserXp();
  }, []);

  // Load current + longest streaks per habit from the backend. Passing the
  // local "today" anchors the current-streak boundary to the user's timezone.
  const loadStreaks = async () => {
    try {
      const response = await habitAPI.getStreaks(localDateString());
      setStreaks(response.data);
    } catch (error) {
      console.error('Error loading streaks:', error);
    }
  };

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

  // Weekly/monthly habits count as done for their whole period, so load
  // records back to the start of the current week or month, not just today.
  const loadPeriodRecords = async () => {
    try {
      setRecords(await recordAPI.getAllInRange(localCurrentPeriodStart(), localTomorrowString()));
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

  const handleUpdateHabit = async (habitData) => {
    try {
      await habitAPI.update(editingHabit._id, habitData);
      setEditingHabit(null);
      loadHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      alert('Error updating habit');
    }
  };

  const handleArchiveHabit = async (habitId) => {
    try {
      await habitAPI.archive(habitId);
      loadHabits();
      loadPeriodRecords();
      loadStreaks();
    } catch (error) {
      console.error('Error archiving habit:', error);
      alert('Error archiving habit');
    }
  };

  // The record that completes this habit for its current day/week/month, if any.
  const findPeriodRecord = (habitId) => {
    const habit = habits.find(h => h._id === habitId);
    const frequency = habit?.frequency;
    const currentPeriod = toPeriodNumber(toUtcDayNumber(localDateString()), frequency);
    return records.find(r =>
      r.habitId?._id === habitId &&
      toPeriodNumber(toUtcDayNumber(r.date), frequency) === currentPeriod
    );
  };

  const handleToggleHabit = async (habitId) => {
    try {
      const today = localDateString();
      const existingRecord = findPeriodRecord(habitId);

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

      loadPeriodRecords();
      loadStreaks();
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const isHabitCompleted = (habitId) => !!findPeriodRecord(habitId);

  // Completed habits sink to the bottom so what's left to do stays on top;
  // the sort is stable, so each group keeps its existing order.
  const sortedHabits = [...habits].sort(
    (a, b) => isHabitCompleted(a._id) - isHabitCompleted(b._id)
  );

  const xpToNext = xpForLevel(userXp.level);
  const xpPercent = xpToNext > 0
    ? Math.min(100, Math.max(0, (userXp.xp / xpToNext) * 100))
    : 0;

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

      <CompletionHeatmap key={records.length} totalHabits={habits.length} />

      <div className="dashboard-header">
        <h2>Welcome, {user?.username}!</h2>
        <button onClick={() => {
          setEditingHabit(null);
          setShowForm(!showForm);
        }}>
          {showForm ? 'Cancel' : '+ Add Habit'}
        </button>
      </div>

      {editingHabit ? (
        <HabitForm
          initialValues={editingHabit}
          submitLabel="Save Changes"
          showPresets={false}
          onSubmit={handleUpdateHabit}
          onCancel={() => setEditingHabit(null)}
        />
      ) : showForm && (
        <HabitForm onSubmit={handleCreateHabit} onCancel={() => setShowForm(false)} />
      )}

      <div className="habits-grid">
        {habits.length === 0 ? (
          <p className="no-habits">No habits yet. Create your first habit to get started!</p>
        ) : (
          sortedHabits.map(habit => (
            <HabitCard
              key={habit._id}
              habit={habit}
              isCompleted={isHabitCompleted(habit._id)}
              streak={streaks[habit._id]}
              onToggle={() => handleToggleHabit(habit._id)}
              onArchive={() => handleArchiveHabit(habit._id)}
              onEdit={() => setEditingHabit(habit)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default HabitDashboard;
