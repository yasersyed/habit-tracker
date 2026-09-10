import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, statsAPI } from '../services/api';
import { localDateString } from '../utils/date';
import './Profile.css';

function Profile() {
  const { logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);

  const [username, setUsername] = useState('');
  const [profileMessage, setProfileMessage] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState(null);

  const [dangerMessage, setDangerMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await userAPI.getProfile();
        setProfile(response.data);
        setUsername(response.data.username);
      } catch (err) {
        console.error(err);
      }

      try {
        const response = await statsAPI.getSummary({
          startDate: '2000-01-01',
          endDate: localDateString()
        });
        setStats(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!username || username === profile?.username) return;

    try {
      await userAPI.updateProfile({ username });
      await refreshUser();
      setProfile((prev) => ({ ...prev, username }));
      setProfileMessage({ type: 'success', text: 'Profile updated' });
    } catch (err) {
      const message = err.response?.data?.message || 'Could not update profile';
      setProfileMessage({ type: 'error', text: message });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password updated' });
    } catch (err) {
      const message = err.response?.data?.message || 'Could not change password';
      setPasswordMessage({ type: 'error', text: message });
    }
  };

  const handleDeleteAccount = async () => {
    setDangerMessage(null);

    if (!window.confirm('Delete your account? This permanently removes your habits, records, and progress. This cannot be undone.')) {
      return;
    }

    try {
      await userAPI.deleteAccount();
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Could not delete account';
      setDangerMessage({ type: 'error', text: message });
    }
  };

  if (!profile || !stats) {
    return <div className="profile-page">Loading…</div>;
  }

  return (
    <div className="profile-page">
      <section className="profile-card profile-identity">
        <div className="profile-avatar">{profile.username.charAt(0).toUpperCase()}</div>
        <h2>{profile.username}</h2>
        <p className="profile-email">{profile.email}</p>
        <p className="profile-member-since">
          Member since {new Date(profile.createdAt).toLocaleDateString()}
        </p>
      </section>

      <section className="profile-card">
        <h3>Overview</h3>
        <div className="profile-stats">
          <div className="stat-tile">
            <div className="value">{profile.level}</div>
            <div className="label">Level</div>
          </div>
          <div className="stat-tile">
            <div className="value">{profile.totalXp}</div>
            <div className="label">Total XP</div>
          </div>
          <div className="stat-tile">
            <div className="value">{stats.habitCount}</div>
            <div className="label">Habits</div>
          </div>
          <div className="stat-tile">
            <div className="value">{stats.totalCompletions}</div>
            <div className="label">Completions</div>
          </div>
          <div className="stat-tile">
            <div className="value">{stats.activeDays}</div>
            <div className="label">Active days</div>
          </div>
        </div>
      </section>

      <section className="profile-card">
        <h3>Edit profile</h3>
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label htmlFor="profile-username">Username</label>
            <input
              type="text"
              id="profile-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {profileMessage && (
            <div className={profileMessage.type === 'success' ? 'form-success' : 'form-error'}>
              {profileMessage.text}
            </div>
          )}
          <button type="submit" className="btn-primary">Save</button>
        </form>
      </section>

      <section className="profile-card">
        <h3>Change password</h3>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label htmlFor="current-password">Current password</label>
            <input
              type="password"
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-password">New password</label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {passwordMessage && (
            <div className={passwordMessage.type === 'success' ? 'form-success' : 'form-error'}>
              {passwordMessage.text}
            </div>
          )}
          <button type="submit" className="btn-primary">Change password</button>
        </form>
      </section>

      <section className="profile-card profile-danger">
        <h3>Danger zone</h3>
        <p>Deleting your account permanently removes your habits, records, and progress.</p>
        {dangerMessage && <div className="form-error">{dangerMessage.text}</div>}
        <button type="button" className="btn-danger" onClick={handleDeleteAccount}>
          Delete account
        </button>
      </section>
    </div>
  );
}

export default Profile;
