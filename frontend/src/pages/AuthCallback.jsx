// src/pages/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import axios from 'axios';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      console.log('🔍 AuthCallback received:', { code: code ? 'present' : 'missing', error: errorParam });
      setDebugInfo(`Code: ${code ? 'received' : 'missing'}, Error: ${errorParam || 'none'}`);

      if (errorParam) {
        console.error('OAuth error:', errorParam);
        navigate('/login?error=' + errorParam);
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        navigate('/login?error=no_code');
        return;
      }

      try {
        setDebugInfo(`Exchanging code for token...`);
        console.log('🔄 Sending code to backend for token exchange');

        // Send code to backend for token exchange
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        console.log('🌐 API Base URL:', API_BASE_URL);

        const response = await axios.post(`${API_BASE_URL}/api/auth/github/callback`, {
          code: code
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });

        console.log('✅ Backend response:', response.status, response.data);

        if (response.data.token && response.data.user) {
          console.log('🎟️ Token received, logging in user:', response.data.user.login);
          setDebugInfo(`Authentication successful! Redirecting...`);

          // Login user with token and user data
          login(response.data.token, response.data.user);
          navigate('/dashboard', { replace: true });
        } else {
          console.error('Invalid response structure:', response.data);
          setError('Invalid response from server');
          setTimeout(() => navigate('/login?error=invalid_response'), 2000);
        }

      } catch (error) {
        console.error('❌ Token exchange error:', error);

        if (error.code === 'ECONNABORTED') {
          setError('Request timeout - please try again');
        } else if (error.response) {
          console.error('Backend error response:', error.response.status, error.response.data);
          const errorMessage = error.response.data?.error || 'Authentication failed';
          const errorDetails = error.response.data?.details || '';
          setError(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
        } else if (error.request) {
          console.error('No response from backend:', error.request);
          setError('Cannot connect to server - is backend running on port 8000?');
        } else {
          console.error('Request setup error:', error.message);
          setError('Request failed: ' + error.message);
        }

        setTimeout(() => navigate('/login?error=auth_failed'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-4 bg-red-100 rounded-full inline-block mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-2">Debug info: {debugInfo}</p>
          <p className="text-xs text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loading message="Completing authentication..." />
        <p className="text-sm text-gray-500 mt-4">Debug: {debugInfo}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
