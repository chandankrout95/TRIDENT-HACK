import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppLayout from './shared/AppLayout';
import Dashboard from './features/dashboard/Dashboard';
import UsersList from './features/users/UsersList';
import TherapistApprovals from './features/therapists/TherapistApprovals';
import NotificationsSender from './features/notifications/NotificationsSender';
import Reports from './features/reports/Reports';
import Login from './features/auth/Login';

// Placeholder Pages
const Sessions = () => <div>Sessions Page</div>;

function App() {
  const { token } = useSelector(state => state.auth);

  if (!token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersList />} />
          <Route path="therapists" element={<TherapistApprovals />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="notifications" element={<NotificationsSender />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
