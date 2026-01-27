import React, { useState } from 'react';
import './UserSelector.css';

function UserSelector({ users, currentUser, onUserChange, onCreateUser }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && email) {
      onCreateUser(username, email);
      setUsername('');
      setEmail('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="user-selector">
      <div className="user-selector-header">
        <label>Current User: </label>
        <select
          value={currentUser?._id || ''}
          onChange={(e) => {
            const user = users.find(u => u._id === e.target.value);
            onUserChange(user);
          }}
        >
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.username}
            </option>
          ))}
        </select>
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'New User'}
        </button>
      </div>

      {showCreateForm && (
        <form className="create-user-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Create User</button>
        </form>
      )}
    </div>
  );
}

export default UserSelector;
