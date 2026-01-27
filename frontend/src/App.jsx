import React, { useState, useEffect } from 'react';
import { userAPI } from './services/api';
import HabitDashboard from './components/HabitDashboard';
import UserSelector from './components/UserSelector';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data);
      if (response.data.length > 0) {
        setCurrentUser(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateUser = async (username, email) => {
    try {
      const response = await userAPI.create({ username, email });
      setUsers([...users, response.data]);
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Username or email may already exist.');
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Habit Tracker</h1>
      </header>
      <div className="container">
        <UserSelector
          users={users}
          currentUser={currentUser}
          onUserChange={setCurrentUser}
          onCreateUser={handleCreateUser}
        />
        {currentUser && <HabitDashboard userId={currentUser._id} />}
      </div>
    </div>
  );
}

export default App;
