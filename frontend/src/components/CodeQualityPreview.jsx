import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { aiAPI, handleApiError } from '../services/api';

const CodeQualityPreview = ({ repositories }) => {
  const [qualityData, setQualityData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate overall quality metrics from repositories
  const calculateOverallQuality = () => {
    if (!repositories || repositories.length === 0) return null;

    const totalRepos = repositories.length;
    const reposWithReadme = repositories.filter(repo =>
      repo.description && repo.description.length > 20
    ).length;

    const avgStars = repositories.reduce((sum, repo) => sum + repo.stars, 0) / totalRepos;
    const recentlyUpdated = repositories.filter(repo => {
      const daysSinceUpdate = (new Date() - new Date(repo.updated_at)) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate < 30;
    }).length;

    // Simple scoring algorithm
    const documentationScore = Math.min(10, (reposWithReadme / totalRepos) * 10);
    const popularityScore = Math.min(10, avgStars * 2);
    const activityScore = Math.min(10, (recentlyUpdated / totalRepos) * 10);

    const overallScore = Math.round((documentationScore + popularityScore + activityScore) / 3);

    return {
      overallScore,
      totalRepos,
      metrics: {
        documentation: Math.round(documentationScore),
        popularity: Math.round(popularityScore),
        activity: Math.round(activityScore)
      },
      insights: [
        reposWithReadme === totalRepos ? "Excellent documentation coverage" : "Consider adding better descriptions",
        avgStars > 5 ? "Strong community engagement" : "Focus on building visibility",
        recentlyUpdated > totalRepos * 0.5 ? "Active development" : "Several repositories need updates"
      ]
    };
  };

  const qualityMetrics = calculateOverallQuality();

  if (!qualityMetrics) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-100 rounded-full">
          <Brain className="w-6 h-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Code Quality Overview</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(qualityMetrics.overallScore)} ${getScoreColor(qualityMetrics.overallScore)}`}>
              {qualityMetrics.overallScore}/10
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className={`text-lg font-bold ${getScoreColor(qualityMetrics.metrics.documentation)}`}>
                {qualityMetrics.metrics.documentation}/10
              </div>
              <div className="text-xs text-gray-600">Documentation</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${getScoreColor(qualityMetrics.metrics.activity)}`}>
                {qualityMetrics.metrics.activity}/10
              </div>
              <div className="text-xs text-gray-600">Activity</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${getScoreColor(qualityMetrics.metrics.popularity)}`}>
                {qualityMetrics.metrics.popularity}/10
              </div>
              <div className="text-xs text-gray-600">Popularity</div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {qualityMetrics.insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                <span className="text-gray-700">{insight}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-purple-700 font-medium">
              💡 Click any repository above for detailed AI code quality analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeQualityPreview;
