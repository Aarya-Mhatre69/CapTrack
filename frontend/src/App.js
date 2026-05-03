import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import StudentDashboard from './pages/StudentDashboard';
import MentorDashboard from './pages/MentorDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0d0d14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Loading…</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user.role === 'MENTOR') return <Navigate to="/mentor" replace />;
  if (user.role === 'COORDINATOR') return <Navigate to="/coordinator" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/student/*"     element={<PrivateRoute role="STUDENT"><StudentDashboard /></PrivateRoute>} />
            <Route path="/mentor/*"      element={<PrivateRoute role="MENTOR"><MentorDashboard /></PrivateRoute>} />
            <Route path="/coordinator/*" element={<PrivateRoute role="COORDINATOR"><CoordinatorDashboard /></PrivateRoute>} />
            <Route path="*" element={<RoleRedirect />} />
          </Routes>
        </BrowserRouter>
        <div id="toast-root" />
      </ToastProvider>
    </AuthProvider>
  );
}
