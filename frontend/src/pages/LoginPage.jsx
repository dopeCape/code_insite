// src/pages/LoginPage.jsx
import React, { useEffect, useState } from 'react';
import { Github, BarChart3, Brain, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages = {
        no_code: 'Authorization was cancelled or failed',
        no_token: 'Failed to get access token from GitHub',
        auth_failed: 'Authentication failed. Please try again.',
        invalid_token: 'Invalid authentication token',
        access_denied: 'Access was denied'
      };
      setError(errorMessages[errorParam] || 'Authentication failed');
    }
  }, [searchParams]);

  const handleGitHubLogin = () => {
    // Clear any existing errors
    setError('');
    // Redirect to GitHub OAuth
    window.location.href = authAPI.getGitHubAuthURL();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M0 32V0h32" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Section - Branding & Features */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="max-w-2xl">
            {/* Logo & Title */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary-600 rounded-xl">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">CodeInsight AI</h1>
                  <p className="text-gray-600">Your GitHub Analytics Platform</p>
                </div>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Go beyond the code.
                <span className="block text-primary-600">Get intelligent insights.</span>
              </h2>

              <p className="text-xl text-gray-600 leading-relaxed">
                Transform your GitHub data into actionable career insights with AI-powered analytics.
                Understand your coding patterns, track your growth, and accelerate your development journey.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Advanced Analytics</h3>
                  <p className="text-gray-600 text-sm">Deep insights into your coding patterns and repository activity</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Insights</h3>
                  <p className="text-gray-600 text-sm">Get personalized recommendations for career growth</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Growth Tracking</h3>
                  <p className="text-gray-600 text-sm">Monitor your progress and skill development over time</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Instant Analysis</h3>
                  <p className="text-gray-600 text-sm">Real-time processing of your GitHub repositories</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            <div className="glass-card p-8 animate-fade-in">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h3>
                <p className="text-gray-600">Connect your GitHub account to unlock powerful insights</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Authentication Error</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              )}

              <button
                onClick={handleGitHubLogin}
                className="w-full btn-primary justify-center py-4 text-lg hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Github className="w-6 h-6" />
                Continue with GitHub
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  By continuing, you agree to our terms and privacy policy.
                  <br />
                  We only access public repository data.
                </p>
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Secure OAuth Authentication</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Your data is safe. We use GitHub's official OAuth for authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
