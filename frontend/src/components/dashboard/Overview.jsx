
// src/components/dashboard/Overview.jsx
import React, { useState } from 'react';
import {
  RefreshCw,
  GitBranch,
  Star,
  GitCommit,
  Code2,
  Calendar,
  TrendingUp,
  Brain,
  Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import SyncStatus from '../SyncStatus';
import CodeQualityPreview from '../CodeQualityPreview';

const Overview = ({ data, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const { syncRepositories, syncProfile } = useAuth();

  const handleRefresh = async (e) => {
    if (e) e.preventDefault();
    setRefreshing(true);
    setSyncStatus('syncing');
    setSyncMessage('Updating repository data...');

    try {
      await syncRepositories();
      await onRefresh();
      setSyncStatus('success');
      setSyncMessage('Data updated successfully!');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Refresh failed:', error);
      setSyncStatus('error');
      setSyncMessage(error.message || 'Failed to sync data');
      setTimeout(() => setSyncStatus('idle'), 5000);
    } finally {
      setRefreshing(false);
    }
  };

  const handleInitialSync = async (e) => {
    if (e) e.preventDefault();
    setSyncing(true);
    setSyncStatus('syncing');

    try {
      setSyncMessage('Syncing profile information...');
      await syncProfile();

      setSyncMessage('Analyzing repositories (excluding forks)...');
      await syncRepositories();

      setSyncMessage('Generating insights...');
      await onRefresh();

      setSyncStatus('success');
      setSyncMessage('Welcome to CodeInsight AI! 🎉');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setSyncMessage(error.message || 'Sync failed - please try again');
      setTimeout(() => setSyncStatus('idle'), 5000);
    } finally {
      setSyncing(false);
    }
  };

  if (!data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if user needs to sync data
  if (data.user?.needsSync) {
    return (
      <>
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CodeInsight AI! 🎉</h2>
            <p className="text-gray-600">Let's get started by syncing your GitHub data</p>
          </div>

          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-center py-12">
            <div className="mb-6">
              <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                <RefreshCw className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to unlock your insights?</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                We'll analyze your <strong>original repositories</strong> (excluding forks) to generate
                AI-powered insights about your coding patterns, language proficiency, and career opportunities.
              </p>
            </div>

            <button
              onClick={handleInitialSync}
              disabled={syncing}
              className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing Your Data...' : 'Sync GitHub Data'}
            </button>

            <div className="mt-6 text-sm text-gray-500">
              <p className="mb-2">This will:</p>
              <ul className="space-y-1 text-left max-w-md mx-auto">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Import your GitHub profile information
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Analyze your original repositories (skips forks)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Generate AI insights about your coding patterns
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Create personalized career recommendations
                </li>
              </ul>
              <p className="mt-4 text-xs text-gray-400">
                Note: We automatically exclude forked repositories like Linux kernel to ensure fast processing.
              </p>
            </div>
          </div>
        </div>
        <SyncStatus status={syncStatus} message={syncMessage} />
      </>
    );
  }

  const stats = data.stats || {};
  const topRepos = data.topRepositories || [];
  const languageData = data.languageDistribution || [];
  const recentActivity = data.recentActivity || [];

  // Prepare language data for pie chart
  const pieData = languageData.slice(0, 5).map((lang, index) => ({
    name: lang.language,
    value: parseFloat(lang.percentage),
    color: [
      '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ][index]
  }));

  // Prepare activity data for area chart
  const activityData = recentActivity
    .reduce((acc, activity) => {
      const date = new Date(activity.date).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.commits += 1;
        existing.additions += activity.additions || 0;
      } else {
        acc.push({
          date,
          commits: 1,
          additions: activity.additions || 0
        });
      }
      return acc;
    }, [])
    .slice(-7); // Last 7 days

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
            <p className="text-gray-600 mt-1">Your GitHub analytics at a glance</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Repositories</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalRepositories}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <GitBranch className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">Active development</span>
            </div>
          </div>

          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stars</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStars}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600">Community recognition</span>
            </div>
          </div>

          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commits</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCommits}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <GitCommit className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Zap className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">Coding activity</span>
            </div>
          </div>

          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Languages</p>
                <p className="text-3xl font-bold text-gray-900">{stats.languagesCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Code2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Brain className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-purple-600">Technology diversity</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Language Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h3>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {pieData.map((lang) => (
                    <div key={lang.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: lang.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{lang.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No language data available
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {activityData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="commits"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No activity data available
              </div>
            )}
          </div>
        </div>

        {/* Code Quality Preview */}
        {topRepos.length > 0 && (
          <CodeQualityPreview repositories={topRepos} />
        )}

        {/* Top Repositories */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Repositories</h3>
          {topRepos.length > 0 ? (
            <div className="space-y-4">
              {topRepos.map((repo) => (
                <div
                  key={repo.name}
                  onClick={() => {
                    // Find the repository ID from the stored data
                    const repoData = data.topRepositories?.find(r => r.name === repo.name);
                    if (repoData?.id) {
                      window.location.href = `/repository/${repoData.id}`;
                    }
                  }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {repo.name}
                      </h4>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{repo.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {repo.language && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {repo.language}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3" />
                        {repo.stars}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <GitBranch className="w-3 h-3" />
                        {repo.forks}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium">
                        <Brain className="w-3 h-3" />
                        View Analysis
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  💡 <strong>Click any repository</strong> to view detailed analysis, code quality scores, and AI insights!
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No repositories found. Sync your data to see your repositories.
            </div>
          )}
        </div>
      </div>
      <SyncStatus status={syncStatus} message={syncMessage} />
    </>
  );
};


export default Overview;
