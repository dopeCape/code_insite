import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Overview from '../components/dashboard/Overview';
import Languages from '../components/dashboard/Languages';
import Patterns from '../components/dashboard/Patterns';
import Career from '../components/dashboard/Career';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, handleApiError } from '../services/api';
import Loading from '../components/Loading';

const Dashboard = () => {
  const { user } = useAuth();
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getOverview();
      setOverviewData(response.data.overview);
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="p-4 bg-red-100 rounded-full inline-block">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <Header user={user} overviewData={overviewData} />

          <main className="p-6">
            <Routes>
              <Route
                path="/"
                element={<Overview data={overviewData} onRefresh={loadDashboardData} />}
              />
              <Route
                path="/languages"
                element={<Languages />}
              />
              <Route
                path="/patterns"
                element={<Patterns />}
              />
              <Route
                path="/career"
                element={<Career />}
              />
              <Route
                path="*"
                element={<Navigate to="/dashboard" replace />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
