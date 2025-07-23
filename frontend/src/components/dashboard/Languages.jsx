import React, { useState, useEffect } from 'react';
import { Brain, Zap, Code2, TrendingUp, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI, aiAPI, handleApiError } from '../../services/api';
import Loading from '../Loading';

const Languages = () => {
  const [languageData, setLanguageData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLanguageData();
  }, []);

  const loadLanguageData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getLanguageData();
      setLanguageData(response.data.languageData);
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
      const response = await aiAPI.analyzeLanguages();
      setAiAnalysis(response.data.analysis.aiInsights);
      // Refresh language data to get updated analysis
      await loadLanguageData();
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <Loading message="Loading language analytics..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full inline-block mb-4">
            <Code2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Languages</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={loadLanguageData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const distribution = languageData?.distribution || [];
  const analysis = languageData?.analysis || aiAnalysis;

  // Prepare data for charts
  const barData = distribution.slice(0, 10).map(lang => ({
    language: lang.language,
    percentage: parseFloat(lang.percentage),
    repositories: lang.repositories
  }));

  const pieData = distribution.slice(0, 6).map((lang, index) => ({
    name: lang.language,
    value: parseFloat(lang.percentage),
    color: [
      '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'
    ][index]
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Language Proficiency</h2>
          <p className="text-gray-600 mt-1">AI-powered analysis of your programming languages</p>
        </div>
        <button
          onClick={runAIAnalysis}
          disabled={analyzing}
          className="btn-primary"
        >
          <Brain className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
          {analyzing ? 'Analyzing...' : 'AI Analysis'}
        </button>
      </div>

      {/* AI Insights Panel */}
      {analysis && (
        <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insights</h3>

              {/* Summary */}
              {analysis.summary && (
                <div className="mb-4">
                  <p className="text-gray-700">{analysis.summary}</p>
                </div>
              )}

              {/* Score */}
              {analysis.overall_score && (
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Overall Score:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${analysis.overall_score * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-purple-600">
                      {analysis.overall_score}/10
                    </span>
                  </div>
                </div>
              )}

              {/* Strengths & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4" />
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Usage Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Usage Distribution</h3>
          {barData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="language"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, 'Usage']}
                    labelFormatter={(label) => `Language: ${label}`}
                  />
                  <Bar
                    dataKey="percentage"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No language data available
            </div>
          )}
        </div>

        {/* Language Composition Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Composition</h3>
          {pieData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No language data available
            </div>
          )}
        </div>
      </div>

      {/* Language Details Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Language Statistics</h3>
        {distribution.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Language</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Usage %</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Repositories</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Bytes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Proficiency</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map((lang, index) => (
                  <tr key={lang.language} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: pieData[index]?.color || '#6b7280' }}
                        ></div>
                        <span className="font-medium text-gray-900">{lang.language}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${lang.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 min-w-12">
                          {lang.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{lang.repositories}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {(lang.bytes / 1024).toFixed(0)}KB
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${lang.percentage > 30 ? 'bg-green-100 text-green-800' :
                        lang.percentage > 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {lang.percentage > 30 ? 'Advanced' :
                          lang.percentage > 15 ? 'Intermediate' : 'Beginner'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No language data available. Sync your repositories to see language statistics.
          </div>
        )}
      </div>
    </div>
  );
};

export default Languages;
