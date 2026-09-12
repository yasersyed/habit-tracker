import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Login from './components/Login';
import Signup from './components/Signup';
import HabitDashboard from './components/HabitDashboard';
import Calendar from './components/Calendar';
import Statistics from './components/Statistics';
import Profile from './components/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Injected at build time by Vite (see vite.config.js); guarded for tests.
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

function App() {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Habit Tracker</h1>
        <div className="header-actions">
          {user && (
            <nav className="app-nav">
              <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
              <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Calendar</NavLink>
              <NavLink to="/statistics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Statistics</NavLink>
              <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Profile</NavLink>
            </nav>
          )}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <div className="header-user">
              <span>Hello, {user.username}</span>
              <button onClick={logout} className="logout-btn">Logout</button>
            </div>
          )}
        </div>
      </header>

      <div className="container">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" replace /> : <Signup />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HabitDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <footer className="app-footer">
        <span>Habit Tracker</span>
        <span className="app-version">v{APP_VERSION}</span>
      </footer>
    </div>
  );
}

export default App;
