import React, { useState, useEffect } from 'react';
import { Brain, Clock, Calendar, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { dashboardAPI, aiAPI, handleApiError } from '../../services/api';
import Loading from '../Loading';

const Patterns = () => {
  const [patternData, setPatternData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPatternData();
  }, []);

  const loadPatternData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getPatternData();
      setPatternData(response.data.patternData);
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.error);
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    try {
      setAnalyzing(true);
      await aiAPI.analyzePatterns();
      await loadPatternData();
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <Loading message="Analyzing development patterns..." />;
  }

  const timeline = patternData?.timeline || [];
  const analysis = patternData?.analysis;
  const patterns = patternData?.patterns;

  // Prepare data for charts
  const timelineData = timeline.slice(-30).map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    commits: item.commits,
    additions: item.additions
  }));

  const dayOfWeekData = patterns?.commitsByDay ?
    Object.entries(patterns.commitsByDay).map(([day, commits]) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(day)],
      commits
    })) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Development Patterns</h2>
          <p className="text-gray-600 mt-1">AI analysis of your coding habits and productivity</p>
        </div>
        <button onClick={runAIAnalysis} disabled={analyzing} className="btn-primary">
          <Brain className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
          {analyzing ? 'Analyzing...' : 'AI Analysis'}
        </button>
      </div>

      {analysis && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pattern Insights</h3>
              <p className="text-gray-700 mb-4">{analysis.summary}</p>

              {analysis.productivity_score && (
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Productivity Score:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${analysis.productivity_score * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {analysis.productivity_score}/10
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.strengths && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-600">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.recommendations && (
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Commit Timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="commits" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity by Day</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="commits" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {patterns && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="p-3 bg-green-100 rounded-full inline-block mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Commits</h3>
            <p className="text-2xl font-bold text-green-600">{patterns.totalCommits}</p>
          </div>

          <div className="card text-center">
            <div className="p-3 bg-blue-100 rounded-full inline-block mb-3">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Avg Commits/Repo</h3>
            <p className="text-2xl font-bold text-blue-600">{patterns.averageCommitsPerRepo}</p>
          </div>

          <div className="card text-center">
            <div className="p-3 bg-purple-100 rounded-full inline-block mb-3">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Code Changes</h3>
            <p className="text-2xl font-bold text-purple-600">
              {patterns.codeChanges?.netChanges || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


export default Patterns
