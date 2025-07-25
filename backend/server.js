// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { ExpressAuth } from '@auth/express';
import GitHub from '@auth/express/providers/github';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('🔍 Environment Check:');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('AUTH_SECRET:', process.env.AUTH_SECRET ? 'SET' : 'NOT SET');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codeinsight', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Auth.js Configuration
const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'user:email repo read:user'
        }
      }
    })
  ],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.githubId = profile.id;
        token.login = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.user.githubId = token.githubId;
        session.user.login = token.login;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after authentication
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${process.env.FRONTEND_URL}/dashboard`;
    }
  }
};
const verifyJWT = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.AUTH_SECRET);
    req.user = {
      githubId: decoded.githubId,
      login: decoded.login,
      accessToken: decoded.accessToken
    };
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};


// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date() });
});

// Debug endpoint to check OAuth configuration
app.get('/api/debug/oauth', (req, res) => {
  res.json({
    github_client_id: process.env.GITHUB_CLIENT_ID ? 'SET' : 'MISSING',
    github_client_secret: process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'MISSING',
    auth_secret: process.env.AUTH_SECRET ? 'SET' : 'MISSING',
    frontend_url: process.env.FRONTEND_URL || 'DEFAULT',
    port: PORT
  });
});

// Debug endpoint to check available routes
app.get('/api/debug/routes', (req, res) => {
  res.json({
    message: 'Available API routes',
    routes: [
      'GET /api/health',
      'GET /api/debug/oauth',
      'GET /api/debug/routes',
      'GET /api/auth/verify',
      'POST /api/auth/github/callback',
      'GET /auth/github',
      'POST /api/github/sync-profile',
      'POST /api/github/sync-repositories',
      'GET /api/github/repositories',
      'GET /api/github/stats',
      'GET /api/dashboard/overview',
      'GET /api/dashboard/languages',
      'GET /api/dashboard/patterns',
      'GET /api/dashboard/career',
      'POST /api/ai/analyze-languages',
      'POST /api/ai/analyze-patterns',
      'POST /api/ai/career-insights'
    ]
  });
});

// Test JWT verification endpoint
app.get('/api/auth/verify', verifyJWT, (req, res) => {
  res.json({
    valid: true,
    user: {
      githubId: req.user.githubId,
      login: req.user.login
    }
  });
});

// Test route to verify routing works
app.get('/test', (req, res) => {
  res.json({ message: 'Express routing works!' });
});


app.get('/auth/github', async (req, res) => {
  try {
    // Redirect to GitHub OAuth - callback goes to FRONTEND
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email repo read:user&redirect_uri=${encodeURIComponent(`${process.env.FRONTEND_URL}/auth/callback`)}`;
    res.redirect(githubAuthUrl);
  } catch (error) {
    console.error('GitHub auth redirect error:', error);
    res.status(500).json({ error: 'Failed to initiate GitHub authentication' });
  }
});

// API endpoint to exchange GitHub code for JWT token
app.post('/api/auth/github/callback', async (req, res) => {
  try {
    const { code } = req.body;

    console.log('🔍 Received OAuth callback with code:', code ? 'present' : 'missing');

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Verify environment variables
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error('❌ Missing GitHub OAuth credentials');
      return res.status(500).json({ error: 'OAuth configuration error' });
    }

    console.log('🔄 Exchanging code for access token...');

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('📝 GitHub token response status:', tokenResponse.status);

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error('❌ No access token in GitHub response:', tokenResponse.data);
      return res.status(400).json({
        error: 'Failed to get access token',
        details: tokenResponse.data.error_description || 'Unknown error'
      });
    }

    console.log('✅ Got access token, fetching user info...');

    // Get user info from GitHub - with retry logic
    let githubUser;
    let retries = 3;

    while (retries > 0) {
      try {
        const userResponse = await axios.get('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodeInsight-AI'
          },
          timeout: 10000 // 10 second timeout
        });

        console.log('👤 GitHub user response status:', userResponse.status);
        githubUser = userResponse.data;
        console.log('👤 Retrieved user:', githubUser.login);
        break; // Success, exit retry loop

      } catch (userError) {
        retries--;
        console.log(`❌ GitHub user API error (${3 - retries}/3):`, userError.response?.status);

        if (retries === 0) {
          throw userError; // Final attempt failed
        }

        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Create JWT token
    const jwtToken = jwt.sign({
      githubId: githubUser.id,
      login: githubUser.login,
      accessToken: accessToken
    }, process.env.AUTH_SECRET, { expiresIn: '7d' });

    console.log('🎟️ Created JWT token for user:', githubUser.login);

    // Return the JWT token to frontend
    res.json({
      token: jwtToken,
      user: {
        githubId: githubUser.id,
        login: githubUser.login,
        name: githubUser.name,
        email: githubUser.email,
        avatar_url: githubUser.avatar_url,
        bio: githubUser.bio,
        location: githubUser.location,
        company: githubUser.company,
        public_repos: githubUser.public_repos,
        followers: githubUser.followers,
        following: githubUser.following,
        created_at: githubUser.created_at
      }
    });

  } catch (error) {
    console.error('❌ GitHub callback error:', error.message);

    if (error.response) {
      console.error('❌ GitHub API Error Response:', {
        status: error.response.status,
        url: error.config?.url
      });

      // Handle specific GitHub API errors
      if (error.response.status === 400) {
        return res.status(400).json({
          error: 'Invalid authorization code',
          details: 'Code may have expired or been used already'
        });
      }

      if (error.response.status === 401) {
        return res.status(500).json({
          error: 'OAuth configuration error',
          details: 'Invalid client credentials'
        });
      }
    }

    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
});

// JWT Verification Middleware

// Import Routes
import githubRoutes from './routes/github.js';
import aiRoutes from './routes/ai.js';
import dashboardRoutes from './routes/dashboard.js';

// API Routes
app.use('/api/github', verifyJWT, githubRoutes);
app.use('/api/ai', verifyJWT, aiRoutes);
app.use('/api/dashboard', verifyJWT, dashboardRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date() });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Auth: http://localhost:${PORT}/auth/github`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL}`);
});

export default app
