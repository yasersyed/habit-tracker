import React, { useState, useEffect, useRef } from 'react';
import { statsAPI } from '../services/api';
import { localDateString } from '../utils/date';
import './Statistics.css';

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 }
];

// Chart geometry (viewBox units); the SVG scales to its container width.
const W = 640;
const H = 190;
const PAD = { top: 12, right: 8, bottom: 22, left: 32 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function rangeDates(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return { startDate: localDateString(start), endDate: localDateString(end) };
}

const pct = (x) => `${Math.round(x * 100)}%`;
const shortDate = (iso) => {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
};

// Evenly spaced tick indices (at most `count`) across n points.
function tickIndices(n, count) {
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  const step = (n - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(i * step));
}

function useHoverIndex(n) {
  const svgRef = useRef(null);
  const [index, setIndex] = useState(null);

  const onMove = (e) => {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const frac = (px - PAD.left) / PLOT_W;
    setIndex(clamp(Math.round(frac * (n - 1)), 0, n - 1));
  };
  const onLeave = () => setIndex(null);

  return { svgRef, index, onMove, onLeave };
}

// Shared time-series chart: `mode` is 'area' or 'bar'. data: [{ date, value }].
function TimeSeriesChart({ data, mode, color, formatValue }) {
  const n = data.length;
  const { svgRef, index, onMove, onLeave } = useHoverIndex(n);
  const maxV = Math.max(1, ...data.map((d) => d.value));

  const x = (i) => (n === 1 ? PAD.left + PLOT_W / 2 : PAD.left + (i / (n - 1)) * PLOT_W);
  const y = (v) => PAD.top + PLOT_H * (1 - v / maxV);

  const gridValues = [0, maxV / 2, maxV];
  const xTicks = tickIndices(n, 6);

  let overlay = null;
  if (mode === 'area') {
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
    const area = `${line} L${x(n - 1).toFixed(1)},${(PAD.top + PLOT_H).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + PLOT_H).toFixed(1)} Z`;
    overlay = (
      <>
        <path d={area} fill={color} fillOpacity="0.14" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {index != null && (
          <circle cx={x(index)} cy={y(data[index].value)} r="4" fill={color} stroke="#fff" strokeWidth="1.5" />
        )}
      </>
    );
  } else {
    const bandW = PLOT_W / n;
    const barW = Math.max(1, Math.min(bandW - 2, 26));
    overlay = data.map((d, i) => {
      const cx = x(i);
      const bh = (d.value / maxV) * PLOT_H;
      return (
        <rect
          key={i}
          x={cx - barW / 2}
          y={PAD.top + PLOT_H - bh}
          width={barW}
          height={bh}
          rx={Math.min(4, barW / 2)}
          fill={color}
          fillOpacity={index == null || index === i ? 1 : 0.45}
        />
      );
    });
  }

  const active = index != null ? data[index] : null;

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        role="img"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {gridValues.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#e1e0d9" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" className="chart-axis-label">
              {formatValue ? formatValue(Math.round(v)) : Math.round(v)}
            </text>
          </g>
        ))}
        {overlay}
        {active && (
          <line x1={x(index)} x2={x(index)} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="#898781" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {xTicks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="chart-axis-label">
            {shortDate(data[i].date)}
          </text>
        ))}
      </svg>
      {active && (
        <div
          className="chart-tooltip"
          style={{ left: `${(x(index) / W) * 100}%`, top: `${(y(active.value) / H) * 100}%` }}
        >
          <span className="tt-date">{active.date}</span>
          <span className="tt-value">{formatValue ? formatValue(active.value) : active.value}</span>
        </div>
      )}
    </div>
  );
}

function HabitRateBars({ habits }) {
  const sorted = [...habits].sort((a, b) => b.completionRate - a.completionRate);
  return (
    <div className="habit-bars">
      {sorted.map((h) => (
        <div className="habit-bar-row" key={h.habitId}>
          <span className="habit-bar-name" title={h.name}>{h.name}</span>
          <div className="habit-bar-track">
            <div
              className="habit-bar-fill"
              style={{ width: `${Math.round(h.completionRate * 100)}%`, background: h.color || '#3b82f6' }}
            />
          </div>
          <span className="habit-bar-value">
            {pct(h.completionRate)}
            <span className="habit-bar-sub">{h.completions}/{h.expected}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Kpi({ value, label }) {
  return (
    <div className="kpi-tile">
      <span className="kpi-value">{value}</span>
      <span className="kpi-label">{label}</span>
    </div>
  );
}

function Statistics({ refreshKey }) {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const range = rangeDates(days);
        const [s, d, h] = await Promise.all([
          statsAPI.getSummary(range),
          statsAPI.getDaily(range),
          statsAPI.getHabits(range)
        ]);
        if (cancelled) return;
        setSummary(s.data);
        setDaily(d.data.days);
        setHabits(h.data.habits);
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [days, refreshKey]);

  const xpSeries = daily.map((d) => ({ date: d.date, value: d.cumulativeXp }));
  const completionSeries = daily.map((d) => ({ date: d.date, value: d.completions }));
  const hasHabits = habits.length > 0;

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h3 className="stats-title">Statistics</h3>
        <div className="stats-range" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r.days}
              className={`range-btn ${days === r.days ? 'active' : ''}`}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="stats-loading">Loading statistics…</div>
      ) : !hasHabits ? (
        <div className="stats-empty">Add a habit to start seeing your statistics.</div>
      ) : (
        <>
          <div className="kpi-row">
            <Kpi value={pct(summary.completionRate)} label="Completion rate" />
            <Kpi value={summary.totalCompletions} label="Completions" />
            <Kpi value={summary.activeDays} label="Active days" />
            <Kpi value={summary.xpEarned} label="XP earned" />
          </div>

          <div className="chart-block">
            <h4 className="chart-title">XP earned <span className="chart-subtitle">(cumulative)</span></h4>
            <TimeSeriesChart data={xpSeries} mode="area" color="#7c3aed" />
          </div>

          <div className="chart-block">
            <h4 className="chart-title">Daily completions</h4>
            <TimeSeriesChart data={completionSeries} mode="bar" color="#3b82f6" />
          </div>

          <div className="chart-block">
            <h4 className="chart-title">Completion rate by habit</h4>
            <HabitRateBars habits={habits} />
          </div>
        </>
      )}
    </div>
  );
}

export default Statistics;
