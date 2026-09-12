import React, { useState, useEffect } from 'react';
import { habitAPI, recordAPI, statsAPI } from '../services/api';
import { localDateString, utcDateString } from '../utils/date';
import './Calendar.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Calendar() {
  const [habits, setHabits] = useState([]);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [viewDate, setViewDate] = useState(new Date());
  const [completed, setCompleted] = useState(new Map());
  const [counts, setCounts] = useState(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const response = await habitAPI.getAll();
      setHabits(response.data);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const firstNext = new Date(year, month + 1, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const last = new Date(year, month, daysInMonth);

  const loadMonth = async () => {
    const start = localDateString(first);
    const endExclusive = localDateString(firstNext);
    const endInclusive = localDateString(last);

    setLoading(true);
    try {
      if (selectedHabitId) {
        const response = await recordAPI.getByHabit(selectedHabitId, {
          startDate: start,
          endDate: endExclusive
        });
        const map = new Map();
        for (const record of response.data) {
          if (record.completed) {
            map.set(utcDateString(record.date), record._id);
          }
        }
        setCompleted(map);
        setCounts(new Map());
      } else {
        const response = await statsAPI.getDaily({ startDate: start, endDate: endInclusive });
        const map = new Map();
        for (const day of response.data.days) {
          if (day.completions > 0) {
            map.set(day.date, day.completions);
          }
        }
        setCounts(map);
        setCompleted(new Map());
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHabitId, viewDate]);

  const today = localDateString(new Date());

  const toggleDay = async (dateStr) => {
    if (!selectedHabitId || dateStr > today) return;
    try {
      if (completed.has(dateStr)) {
        await recordAPI.delete(completed.get(dateStr));
      } else {
        await recordAPI.create({ habitId: selectedHabitId, date: dateStr, completed: true });
      }
      await loadMonth();
    } catch (error) {
      console.error('Error toggling day:', error);
    }
  };

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date());

  const selectedHabit = habits.find((h) => h._id === selectedHabitId);
  const title = `${MONTHS[month]} ${year}`;

  const leadingBlanks = first.getDay();
  const dayCells = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const key = localDateString(dateObj);
    const isToday = key === today;
    const isFuture = key > today;

    if (selectedHabitId) {
      const isDone = completed.has(key);
      const className = `cal-cell${isDone ? ' completed' : ''}${isToday ? ' today' : ''}${isFuture ? ' future' : ''}`;
      const style = isDone && selectedHabit ? { backgroundColor: selectedHabit.color } : undefined;
      dayCells.push(
        <div
          key={key}
          className={className}
          style={style}
          onClick={() => !isFuture && toggleDay(key)}
        >
          {d}
        </div>
      );
    } else {
      const count = counts.get(key) || 0;
      const intensity = count === 0 ? 0 : count >= 4 ? 4 : count;
      const className = `cal-cell overview intensity-${isFuture ? 0 : intensity}${isToday ? ' today' : ''}`;
      dayCells.push(
        <div key={key} className={className} title={`${key}: ${count} completed`}>
          {d}
        </div>
      );
    }
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h2>Calendar</h2>
        <div className="calendar-controls">
          <select value={selectedHabitId} onChange={(e) => setSelectedHabitId(e.target.value)}>
            <option value="">All habits</option>
            {habits.map((h) => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>
          <button onClick={goPrevMonth} aria-label="Previous month">‹</button>
          <span className="cal-month">{title}</span>
          <button onClick={goNextMonth} aria-label="Next month">›</button>
          <button onClick={goToday}>Today</button>
        </div>
      </div>

      <div className="cal-dow-row">
        {DOW_LABELS.map((label) => (
          <div key={label} className="cal-dow">{label}</div>
        ))}
      </div>

      <div className="cal-grid">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className="cal-cell blank" />
        ))}
        {dayCells}
      </div>

      <div className="cal-hint">
        {selectedHabitId
          ? 'Tap a day to mark it complete'
          : 'Completions per day across all habits (read-only)'}
      </div>
    </div>
  );
}

export default Calendar;
