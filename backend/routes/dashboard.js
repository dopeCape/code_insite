// routes/dashboard.js
import express from 'express';
import User from '../models/User.js';
import Repository from '../models/Repository.js';
import Analysis from '../models/Analysis.js';
const router = express.Router();

// Get dashboard overview data
router.get('/overview', async (req, res) => {
  try {
    const { githubId } = req.user;

    // Try to find user in database
    let user = await User.findOne({ githubId });

    if (!user) {
      // User not in database, return minimal data with sync prompt
      return res.json({
        overview: {
          user: {
            githubId: githubId,
            login: req.user.login,
            needsSync: true
          },
          stats: {
            totalRepositories: 0,
            totalCommits: 0,
            totalStars: 0,
            totalForks: 0,
            languagesCount: 0,
            lastAnalysis: null,
            analysesCount: 0
          },
          topRepositories: [],
          languageDistribution: [],
          recentActivity: []
        }
      });
    }

    const repositories = await Repository.find({ userId: user._id });
    const analyses = await Analysis.find({ userId: user._id });

    // Calculate overview statistics
    const overview = {
      user: {
        name: user.name,
        login: user.login,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        company: user.company,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        created_at: user.created_at,
        needsSync: false
      },
      stats: {
        totalRepositories: repositories.length,
        totalCommits: repositories.reduce((sum, repo) => sum + repo.commits.length, 0),
        totalStars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        totalForks: repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
        languagesCount: new Set(repositories.map(repo => repo.language).filter(Boolean)).size,
        lastAnalysis: user.lastAnalysis,
        analysesCount: analyses.length
      },
      topRepositories: repositories
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 5)
        .map(repo => ({
          id: repo.githubRepoId, // Add repository ID for navigation
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          updated_at: repo.updated_at
        })),
      languageDistribution: calculateLanguageDistribution(repositories),
      recentActivity: getRecentActivity(repositories)
    };

    res.json({ overview });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get language analytics
router.get('/languages', async (req, res) => {
  try {
    const { githubId } = req.user;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const repositories = await Repository.find({ userId: user._id });
    const languageAnalysis = await Analysis.findOne({
      userId: user._id,
      type: 'language_proficiency'
    });

    const languageData = {
      distribution: calculateLanguageDistribution(repositories),
      repositories: repositories.map(repo => ({
        name: repo.name,
        language: repo.language,
        languages: repo.languages,
        size: repo.size
      })),
      analysis: languageAnalysis?.aiInsights || null,
      lastAnalyzed: languageAnalysis?.generatedAt || null
    };

    res.json({ languageData });
  } catch (error) {
    console.error('Language analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch language analytics' });
  }
});

// Get development patterns
router.get('/patterns', async (req, res) => {
  try {
    const { githubId } = req.user;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const repositories = await Repository.find({ userId: user._id });
    const patternAnalysis = await Analysis.findOne({
      userId: user._id,
      type: 'development_patterns'
    });

    // Generate activity timeline
    const activityTimeline = generateActivityTimeline(repositories);
    const commitHeatmap = generateCommitHeatmap(repositories);

    const patternData = {
      timeline: activityTimeline,
      heatmap: commitHeatmap,
      analysis: patternAnalysis?.aiInsights || null,
      patterns: patternAnalysis?.data || null,
      lastAnalyzed: patternAnalysis?.generatedAt || null
    };

    res.json({ patternData });
  } catch (error) {
    console.error('Pattern analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch pattern analytics' });
  }
});

// Get career insights
router.get('/career', async (req, res) => {
  try {
    const { githubId } = req.user;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const careerAnalysis = await Analysis.findOne({
      userId: user._id,
      type: 'career_insights'
    });

    const careerData = {
      insights: careerAnalysis?.aiInsights || null,
      profileData: careerAnalysis?.data || null,
      lastAnalyzed: careerAnalysis?.generatedAt || null,
      hasAnalysis: !!careerAnalysis
    };

    res.json({ careerData });
  } catch (error) {
    console.error('Career insights error:', error);
    res.status(500).json({ error: 'Failed to fetch career insights' });
  }
});

// Helper functions
function calculateLanguageDistribution(repositories) {
  const languageStats = {};
  let totalBytes = 0;

  repositories.forEach(repo => {
    if (repo.languages) {
      repo.languages.forEach((bytes, language) => {
        languageStats[language] = (languageStats[language] || 0) + bytes;
        totalBytes += bytes;
      });
    }
  });

  return Object.entries(languageStats)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: parseFloat(((bytes / totalBytes) * 100).toFixed(2)),
      repositories: repositories.filter(repo =>
        repo.languages && repo.languages.has(language)
      ).length
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

function getRecentActivity(repositories) {
  const allCommits = [];

  repositories.forEach(repo => {
    repo.commits.forEach(commit => {
      allCommits.push({
        sha: commit.sha,
        message: commit.message,
        date: commit.author.date,
        repository: repo.name,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0
      });
    });
  });

  return allCommits
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);
}

function generateActivityTimeline(repositories) {
  const timeline = {};

  repositories.forEach(repo => {
    repo.commits.forEach(commit => {
      const date = new Date(commit.author.date).toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = { date, commits: 0, additions: 0, deletions: 0 };
      }
      timeline[date].commits += 1;
      timeline[date].additions += commit.stats?.additions || 0;
      timeline[date].deletions += commit.stats?.deletions || 0;
    });
  });

  return Object.values(timeline)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function generateCommitHeatmap(repositories) {
  const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));

  repositories.forEach(repo => {
    repo.commits.forEach(commit => {
      const date = new Date(commit.author.date);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      heatmap[dayOfWeek][hour] += 1;
    });
  });

  return heatmap;
}

export default router;
