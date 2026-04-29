import React, { useState, useEffect } from 'react';
import { recordAPI } from '../services/api';
import { localDateString } from '../utils/date';
import './CompletionHeatmap.css';

const WEEKS_TO_SHOW = 15;
const DAYS = WEEKS_TO_SHOW * 7;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function buildDateGrid() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();

  // End at the current day, start DAYS ago aligned to Sunday
  const endOffset = 6 - dayOfWeek;
  const end = new Date(today);
  end.setDate(end.getDate() + endOffset);

  const dates = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

function dateKey(d) {
  return localDateString(d);
}

function getIntensity(count, max) {
  if (count === 0) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function getMonthLabels(dates) {
  const labels = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = -1;

  for (let col = 0; col < WEEKS_TO_SHOW; col++) {
    const d = dates[col * 7];
    const month = d.getMonth();
    if (month !== lastMonth) {
      labels.push({ col, label: monthNames[month] });
      lastMonth = month;
    }
  }
  return labels;
}

function computeStreak(countByDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const d = new Date(today);

  // If today has no completions, start checking from yesterday
  if (!countByDate[dateKey(d)]) {
    d.setDate(d.getDate() - 1);
  }

  while (countByDate[dateKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function CompletionHeatmap() {
  const [countByDate, setCountByDate] = useState({});
  const [loading, setLoading] = useState(true);

  const dates = buildDateGrid();

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const startDate = dateKey(dates[0]);
      const endOfGrid = new Date(dates[dates.length - 1]);
      endOfGrid.setDate(endOfGrid.getDate() + 1);
      const endDate = dateKey(endOfGrid);
      const response = await recordAPI.getByRange(startDate, endDate);

      const counts = {};
      for (const record of response.data) {
        if (record.completed) {
          const key = localDateString(new Date(record.date));
          counts[key] = (counts[key] || 0) + 1;
        }
      }
      setCountByDate(counts);
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);
  const todayCount = countByDate[todayKey] || 0;
  const maxCount = Math.max(0, ...Object.values(countByDate));
  const totalCompleted = Object.values(countByDate).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(countByDate).filter(c => c > 0).length;
  const streak = computeStreak(countByDate);
  const monthLabels = getMonthLabels(dates);

  // Build weeks (columns) of 7 days each
  const weeks = [];
  for (let col = 0; col < WEEKS_TO_SHOW; col++) {
    const week = [];
    for (let row = 0; row < 7; row++) {
      week.push(dates[col * 7 + row]);
    }
    weeks.push(week);
  }

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h3 className="heatmap-title">Activity</h3>
        <div className="heatmap-stats">
          <div className="heatmap-stat">
            <span className="stat-value">{todayCount}</span>
            <span className="stat-label">Today</span>
          </div>
          <div className="heatmap-stat">
            <span className="stat-value">{streak}</span>
            <span className="stat-label">Day streak</span>
          </div>
          <div className="heatmap-stat">
            <span className="stat-value">{activeDays}</span>
            <span className="stat-label">Active days</span>
          </div>
          <div className="heatmap-stat">
            <span className="stat-value">{totalCompleted}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="heatmap-loading">Loading activity...</div>
      ) : (
        <div className="heatmap-scroll">
          <div className="heatmap-grid-wrapper">
            <div className="heatmap-month-labels">
              {monthLabels.map(({ col, label }) => (
                <span key={`${label}-${col}`} className="month-label" style={{ gridColumn: col + 1 }}>
                  {label}
                </span>
              ))}
            </div>
            <div className="heatmap-body">
              <div className="heatmap-day-labels">
                {DAY_LABELS.map((label, i) => (
                  <span key={i} className="day-label">{label}</span>
                ))}
              </div>
              <div className="heatmap-grid">
                {weeks.map((week, colIdx) => (
                  <div key={colIdx} className="heatmap-column">
                    {week.map((d) => {
                      const key = dateKey(d);
                      const count = countByDate[key] || 0;
                      const isFuture = d > today;
                      const isToday = key === todayKey;
                      const intensity = isFuture ? -1 : getIntensity(count, maxCount);

                      return (
                        <div
                          key={key}
                          className={`heatmap-cell intensity-${intensity}${isToday ? ' today' : ''}`}
                          title={isFuture ? '' : `${key}: ${count} completed`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="heatmap-legend">
              <span className="legend-label">Less</span>
              <div className="heatmap-cell intensity-0" />
              <div className="heatmap-cell intensity-1" />
              <div className="heatmap-cell intensity-2" />
              <div className="heatmap-cell intensity-3" />
              <div className="heatmap-cell intensity-4" />
              <span className="legend-label">More</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompletionHeatmap;
