import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './context/UserContext';
import PropTypes from 'prop-types';
import Layout from './components/Layout';
import Login from './components/Login';
import Home from './pages/Home';
import Project from './pages/Project';
import GlobalCalendar from './pages/GlobalCalendar';
import Inbox from './pages/Inbox';
import Today from './pages/Today';
import History from './pages/History';
import { Toaster } from 'sonner';

// Admin imports
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLogin from './pages/admin/AdminLogin';
import DynamicTitle from './components/DynamicTitle';

function App() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const pingServer = async () => {
      try {
        await fetch(`/api/users/${user.id}/ping`, { method: 'POST' });
      } catch (e) {
        console.error('Ping failed', e);
      }
    };

    pingServer(); // Initial ping on mount/login
    const interval = setInterval(pingServer, 3 * 60 * 1000); // Ping every 3 minutes

    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      <DynamicTitle />
      <Toaster position="bottom-right" />
      <Routes>
        {/* Admin Routes - independent of normal user Auth */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Normal App Routes */}
        <Route path="/" element={user ? <Layout /> : <Login />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="projects" element={<Home />} />
          <Route path="project/:projectId" element={<Project />} />
          <Route path="calendar" element={<GlobalCalendar />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="today" element={<Today />} />
          <Route path="history" element={<History />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
