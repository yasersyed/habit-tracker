import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import HabitDashboard from './components/HabitDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Injected at build time by Vite (see vite.config.js); guarded for tests.
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

function App() {
  const { user, logout, loading } = useAuth();

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
        {user && (
          <div className="header-user">
            <span>Hello, {user.username}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        )}
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
