// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import RepositoryDetail from './pages/RepositoryDetail';
import Loading from './components/Loading';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/auth/callback"
        element={<AuthCallback />}
      />
      <Route
        path="/dashboard/*"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/repository/:repoId"
        element={user ? <RepositoryDetail /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;
