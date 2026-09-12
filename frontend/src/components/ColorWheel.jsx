import React, { useState, useRef, useEffect } from 'react';
import './ColorWheel.css';

// HSV wheel: hue is the angle, saturation the distance from center, and the
// brightness slider controls value. These conversions keep the wheel, the
// marker, and the emitted hex in sync.
function hsvToHex({ h, s, v }) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const hex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function hexToHsv(hex) {
  const full = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const r = parseInt(full.slice(1, 3), 16) / 255;
  const g = parseInt(full.slice(3, 5), 16) / 255;
  const b = parseInt(full.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function ColorWheel({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const containerRef = useRef(null);
  const wheelRef = useRef(null);
  // Track the hex we emitted so external changes (preset swatches) re-sync the
  // wheel without clobbering the value mid-drag.
  const lastHex = useRef(value);

  useEffect(() => {
    if (value !== lastHex.current) {
      setHsv(hexToHsv(value));
      lastHex.current = value;
    }
  }, [value]);

  // Close when the user clicks outside the popover or presses Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const emit = (next) => {
    setHsv(next);
    const hex = hsvToHex(next);
    lastHex.current = hex;
    onChange(hex);
  };

  const pickFromEvent = (e) => {
    const rect = wheelRef.current.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = e.clientX - (rect.left + radius);
    const dy = e.clientY - (rect.top + radius);
    const dist = Math.min(Math.hypot(dx, dy), radius);
    const h = (Math.atan2(dy, dx) * 180) / Math.PI;
    emit({ ...hsv, h: (h + 360) % 360, s: radius ? dist / radius : 0 });
  };

  const onWheelPointerDown = (e) => {
    e.preventDefault();
    pickFromEvent(e);
    const move = (ev) => pickFromEvent(ev);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const angle = (hsv.h * Math.PI) / 180;
  const markerLeft = 50 + Math.cos(angle) * hsv.s * 50;
  const markerTop = 50 + Math.sin(angle) * hsv.s * 50;

  return (
    <div className="color-wheel-picker" ref={containerRef}>
      <button
        type="button"
        className="color-wheel-trigger"
        style={{ backgroundColor: value }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open color wheel"
        aria-expanded={open}
        title="Pick a custom color"
      />
      {open && (
        <div className="color-wheel-popover" role="dialog" aria-label="Color wheel">
          <div className="color-wheel-surface" ref={wheelRef} onPointerDown={onWheelPointerDown}>
            {/* Darkens the wheel to reflect the current brightness (value). */}
            <div className="color-wheel-shade" style={{ opacity: 1 - hsv.v }} />
            <div
              className="color-wheel-marker"
              style={{ left: `${markerLeft}%`, top: `${markerTop}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(hsv.v * 100)}
            onChange={(e) => emit({ ...hsv, v: Number(e.target.value) / 100 })}
            className="color-wheel-brightness"
            aria-label="Brightness"
          />
          <div className="color-wheel-value">{value.toUpperCase()}</div>
        </div>
      )}
    </div>
  );
}

export default ColorWheel;
