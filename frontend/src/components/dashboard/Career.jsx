import React, { useState, useEffect } from 'react';
import { Brain, Briefcase, Target, Star, TrendingUp } from 'lucide-react';
import { dashboardAPI, aiAPI, handleApiError } from '../../services/api';
import Loading from '../Loading';

const Career = () => {
  const [careerData, setCareerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCareerData();
  }, []);

  const loadCareerData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getCareerData();
      setCareerData(response.data.careerData);
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setAnalyzing(true);
      await aiAPI.generateCareerInsights();
      await loadCareerData();
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <Loading message="Generating career insights..." />;
  }

  const insights = careerData?.insights;
  const hasAnalysis = careerData?.hasAnalysis;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Career Insights</h2>
          <p className="text-gray-600 mt-1">AI-powered career analysis and recommendations</p>
        </div>
        <button onClick={generateInsights} disabled={analyzing} className="btn-primary">
          <Brain className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
          {analyzing ? 'Generating...' : hasAnalysis ? 'Refresh Insights' : 'Generate Insights'}
        </button>
      </div>

      {!hasAnalysis ? (
        <div className="card text-center py-12">
          <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
            <Brain className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to unlock your career potential?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Our AI will analyze your GitHub profile, coding patterns, and project portfolio to provide personalized career insights and recommendations.
          </p>
          <button onClick={generateInsights} disabled={analyzing} className="btn-primary">
            <Brain className="w-5 h-5" />
            Generate Career Insights
          </button>
        </div>
      ) : insights ? (
        <div className="space-y-6">
          {/* Main Insights */}
          <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Analysis</h3>
                <p className="text-gray-700 mb-4">{insights.summary}</p>

                {insights.career_score && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Career Readiness Score:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 max-w-xs">
                        <div
                          className="bg-indigo-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${insights.career_score * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {insights.career_score}/10
                      </span>
                    </div>
                  </div>
                )}

                {insights.current_level && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      Current Level: {insights.current_level}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations & Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.recommendations && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {insights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.next_steps && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Next Steps
                </h3>
                <div className="space-y-3">
                  {insights.next_steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-green-600">{index + 1}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Market Insights */}
          {insights.market_insights && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Market Insights
              </h3>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700">{insights.market_insights}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-gray-500">No career insights available. Generate insights to see your analysis.</p>
        </div>
      )}
    </div>
  );
};

export default Career;
