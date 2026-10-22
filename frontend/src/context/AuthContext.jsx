import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
// Stored in localStorage so activity in any tab keeps every tab signed in,
// and a reopened tab can tell how long the user has been away.
const LAST_ACTIVITY_KEY = 'lastActivity';
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

const markActive = () => localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
const isIdleExpired = () =>
  Date.now() - Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0) > IDLE_TIMEOUT_MS;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token && isIdleExpired()) {
      logout();
    } else if (token) {
      markActive();
      try {
        const response = await authAPI.me();
        setUser(response.data);
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (identifier, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ identifier, password });
      localStorage.setItem('token', response.data.token);
      markActive();
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const response = await authAPI.register({ username, email, password });
      localStorage.setItem('token', response.data.token);
      markActive();
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
  };

  useEffect(() => {
    if (!user) return undefined;

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    const timer = setInterval(() => {
      if (isIdleExpired()) logout();
    }, 30 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
      clearInterval(timer);
    };
  }, [user]);

  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data);
    } catch (err) {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
