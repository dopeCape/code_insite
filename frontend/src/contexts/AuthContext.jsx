// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  // Set axios default authorization header
  useEffect(() => {
    if (token) {
      apiService.defaults.headers.authorization = `Bearer ${token}`;
    } else {
      delete apiService.defaults.headers.authorization;
    }
  }, [token]);

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Set token in axios headers
      apiService.defaults.headers.authorization = `Bearer ${storedToken}`;

      // Verify token with simple endpoint first
      const response = await apiService.get('/api/auth/verify');

      if (response.data.valid && response.data.user) {
        // Token is valid, create user object from token data
        setUser({
          githubId: response.data.user.githubId,
          login: response.data.user.login,
          name: response.data.user.login, // Use login as fallback for name
          avatar_url: `https://github.com/${response.data.user.login}.png` // GitHub avatar URL
        });
        setToken(storedToken);
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      delete apiService.defaults.headers.authorization;
    } finally {
      setLoading(false);
    }
  };

  const login = (authToken, userData) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    setUser(userData);
    apiService.defaults.headers.authorization = `Bearer ${authToken}`;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    delete apiService.defaults.headers.authorization;
  };

  const syncProfile = async () => {
    try {
      console.log('🔄 Syncing user profile...');
      const response = await apiService.post('/api/github/sync-profile');
      if (response.data.user) {
        setUser(prevUser => ({ ...prevUser, ...response.data.user, needsSync: false }));
        console.log('✅ Profile synced successfully');
      }
      return response.data;
    } catch (error) {
      console.error('❌ Profile sync failed:', error);
      throw error;
    }
  };

  const syncRepositories = async () => {
    try {
      console.log('🔄 Syncing repositories...');
      const response = await apiService.post('/api/github/sync-repositories', {}, {
        timeout: 120000 // 2 minutes timeout
      });
      console.log('✅ Repository sync completed:', response.data.message);
      return response.data;
    } catch (error) {
      console.error('❌ Repository sync failed:', error);

      if (error.code === 'ECONNABORTED') {
        throw new Error('Sync timed out - you have too many repositories. Please try again.');
      }

      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    syncProfile,
    syncRepositories,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
