// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const apiService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout for sync operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    // Log errors for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });

    return Promise.reject(error);
  }
);

// API Methods
export const authAPI = {
  // GitHub OAuth URL - Updated to use our custom route
  getGitHubAuthURL: () => `${API_BASE_URL}/auth/github`,

  // Handle auth callback (will be handled by our custom handler)
  handleCallback: async (token) => {
    return apiService.get('/api/auth/callback', {
      headers: { authorization: `Bearer ${token}` }
    });
  }
};

export const githubAPI = {
  // Sync user profile
  syncProfile: () => apiService.post('/api/github/sync-profile'),

  // Sync repositories
  syncRepositories: () => apiService.post('/api/github/sync-repositories', {}, {
    timeout: 120000 // 2 minutes for repository sync
  }),

  // Get cached repositories
  getRepositories: () => apiService.get('/api/github/repositories'),

  // Get GitHub statistics
  getStats: () => apiService.get('/api/github/stats'),

  // Get detailed repository analysis
  getRepositoryAnalysis: (repoId) => apiService.get(`/api/github/repository/${repoId}`),
};

export const aiAPI = {
  // Analyze language proficiency
  analyzeLanguages: () => apiService.post('/api/ai/analyze-languages'),

  // Analyze development patterns
  analyzePatterns: () => apiService.post('/api/ai/analyze-patterns'),

  // Generate career insights
  generateCareerInsights: () => apiService.post('/api/ai/career-insights'),

  // Analyze code quality for specific repository
  analyzeCodeQuality: (repoId) => apiService.post(`/api/ai/analyze-code-quality/${repoId}`),

  // Get all analyses
  getAnalyses: () => apiService.get('/api/ai/analyses'),
};

export const dashboardAPI = {
  // Get dashboard overview
  getOverview: () => apiService.get('/api/dashboard/overview'),

  // Get language analytics
  getLanguageData: () => apiService.get('/api/dashboard/languages'),

  // Get development patterns
  getPatternData: () => apiService.get('/api/dashboard/patterns'),

  // Get career insights
  getCareerData: () => apiService.get('/api/dashboard/career'),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
    return { error: message, status: error.response.status };
  } else if (error.request) {
    // Request made but no response
    return { error: 'Network error - please check your connection', status: 0 };
  } else {
    // Something else happened
    return { error: error.message || 'An unexpected error occurred', status: -1 };
  }
};

export default apiService;
