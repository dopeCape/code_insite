// src/pages/RepositoryDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  GitBranch,
  Eye,
  Calendar,
  Code2,
  FileText,
  Users,
  Activity,
  BarChart3,
  Brain,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { githubAPI, aiAPI, handleApiError } from '../services/api';
import Loading from '../components/Loading';

const RepositoryDetail = () => {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const [repository, setRepository] = useState(null);
  const [codeQuality, setCodeQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRepositoryData();
  }, [repoId]);

  const loadRepositoryData = async () => {
    try {
      setLoading(true);
      const response = await githubAPI.getRepositoryAnalysis(repoId);
      setRepository(response.data.analysis);
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCodeQuality = async () => {
    try {
      setQualityLoading(true);
      const response = await aiAPI.analyzeCodeQuality(repoId);
      setCodeQuality(response.data.codeQuality);
    } catch (error) {
      const errorInfo = handleApiError(error);
      console.error('Code quality analysis failed:', errorInfo.error);
    } finally {
      setQualityLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading repository analysis..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full inline-block mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Repository</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const repo = repository?.repository;
  const metrics = repository?.metrics;
  const languageStats = repository?.languageStats || [];
  const commitTimeline = repository?.commitTimeline || [];

  // Prepare data for charts
  const languagePieData = languageStats.slice(0, 6).map((lang, index) => ({
    name: lang.language,
    value: parseFloat(lang.percentage),
    color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][index]
  }));

  const commitTimelineData = commitTimeline.slice(-10).map(commit => ({
    date: new Date(commit.date).toLocaleDateString(),
    commits: 1,
    message: commit.message
  }));

  const complexityData = [
    { name: 'Code Files', value: metrics?.codeFiles || 0, color: '#3b82f6' },
    { name: 'Other Files', value: (metrics?.totalFiles || 0) - (metrics?.codeFiles || 0), color: '#e5e7eb' }
  ];

  const qualityScoreData = codeQuality ? [{
    name: 'Quality Score',
    score: codeQuality.overallScore * 10,
    fill: codeQuality.overallScore >= 8 ? '#10b981' :
      codeQuality.overallScore >= 6 ? '#f59e0b' : '#ef4444'
  }] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{repo?.name}</h1>
              <p className="text-gray-600 mb-4">{repo?.description || 'No description available'}</p>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>{repo?.stars || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" />
                  <span>{repo?.forks || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{repo?.watchers || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Updated {new Date(repo?.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-2">
                <Code2 className="w-4 h-4" />
                {repo?.language || 'Multiple'}
              </div>
              <div className="text-sm text-gray-500">
                {(repo?.size / 1024).toFixed(1)}MB • {repo?.openIssues || 0} open issues
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="p-3 bg-blue-100 rounded-full inline-block mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Files</h3>
            <p className="text-2xl font-bold text-blue-600">{metrics?.totalFiles || 0}</p>
          </div>

          <div className="card text-center">
            <div className="p-3 bg-green-100 rounded-full inline-block mb-3">
              <Code2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Code Files</h3>
            <p className="text-2xl font-bold text-green-600">{metrics?.codeFiles || 0}</p>
          </div>

          <div className="card text-center">
            <div className="p-3 bg-purple-100 rounded-full inline-block mb-3">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Est. Lines</h3>
            <p className="text-2xl font-bold text-purple-600">{metrics?.totalLines?.toLocaleString() || 0}</p>
          </div>

          <div className="card text-center">
            <div className="p-3 bg-orange-100 rounded-full inline-block mb-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Complexity</h3>
            <p className="text-2xl font-bold text-orange-600">{metrics?.complexity || 1}/5</p>
          </div>
        </div>

        {/* Code Quality Analysis */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Code Quality Analysis</h2>
            <button
              onClick={analyzeCodeQuality}
              disabled={qualityLoading}
              className="btn-primary"
            >
              <Brain className={`w-4 h-4 ${qualityLoading ? 'animate-pulse' : ''}`} />
              {qualityLoading ? 'Analyzing...' : codeQuality ? 'Refresh Analysis' : 'Analyze Code Quality'}
            </button>
          </div>

          {codeQuality ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Score */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Quality Score</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart data={qualityScoreData}>
                      <RadialBar dataKey="score" cornerRadius={10} fill={qualityScoreData[0]?.fill} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-4">
                    <div className="text-3xl font-bold" style={{ color: qualityScoreData[0]?.fill }}>
                      {codeQuality.overallScore}/10
                    </div>
                    <div className="text-sm text-gray-500">Quality Rating</div>
                  </div>
                </div>
              </div>

              {/* Category Scores */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(codeQuality.categories || {}).map(([category, score]) => (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{category}</span>
                        <span>{score}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${score >= 8 ? 'bg-green-500' :
                              score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${score * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
                <div className="space-y-3">
                  {(codeQuality.recommendations || []).slice(0, 4).map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                <Brain className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for AI Code Analysis?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get detailed insights about code quality, best practices, and recommendations for improvement.
              </p>
              <button onClick={analyzeCodeQuality} className="btn-primary">
                <Brain className="w-5 h-5" />
                Analyze Code Quality
              </button>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Language Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Breakdown</h3>
            {languagePieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languagePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {languagePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {languagePieData.map((lang) => (
                    <div key={lang.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lang.color }}></div>
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

          {/* File Composition */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">File Composition</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complexityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {complexityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {((metrics?.codeFiles / metrics?.totalFiles) * 100 || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Code Files</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Commits */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Commits</h3>
          {commitTimeline.length > 0 ? (
            <div className="space-y-3">
              {commitTimeline.slice(0, 8).map((commit) => (
                <div key={commit.sha} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{commit.message}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{commit.sha}</span>
                      <span>{new Date(commit.date).toLocaleDateString()}</span>
                      <span>by {commit.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent commits available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryDetail;
