import express from 'express';
import User from '../models/User.js';
import Repository from '../models/Repository.js';
import Analysis from '../models/Analysis.js';
import { AIService } from '../services/aiService.js';
const router = express.Router();

router.post('/analyze-languages', async (req, res) => {
  try {
    const { githubId } = req.user;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const repositories = await Repository.find({ userId: user._id });

    // Aggregate language statistics
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

    // Calculate percentages and create analysis data
    const languageAnalysis = Object.entries(languageStats)
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: ((bytes / totalBytes) * 100).toFixed(2),
        repositories: repositories.filter(repo =>
          repo.languages && repo.languages.has(language)
        ).length
      }))
      .sort((a, b) => b.bytes - a.bytes);

    // Generate AI insights using the AIService
    const aiInsights = await AIService.analyzeLanguageProficiency(languageAnalysis);

    // Save analysis to database
    const analysis = await Analysis.findOneAndUpdate(
      { userId: user._id, type: 'language_proficiency' },
      {
        userId: user._id,
        type: 'language_proficiency',
        data: languageAnalysis,
        aiInsights,
        generatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      analysis: {
        languageStats: languageAnalysis,
        aiInsights,
        totalLanguages: languageAnalysis.length,
        dominantLanguage: languageAnalysis[0]?.language
      }
    });

  } catch (error) {
    console.error('Language analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze languages' });
  }
});

// Analyze development patterns
router.post('/analyze-patterns', async (req, res) => {
  try {
    const { githubId } = req.user;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const repositories = await Repository.find({ userId: user._id });

    // Collect all commits
    const allCommits = [];
    repositories.forEach(repo => {
      repo.commits.forEach(commit => {
        allCommits.push({
          ...commit,
          repository: repo.name,
          date: new Date(commit.author.date)
        });
      });
    });

    // Analyze commit patterns
    const commitsByDay = {};
    const commitsByHour = {};
    const commitsByMonth = {};
    let totalAdditions = 0;
    let totalDeletions = 0;

    allCommits.forEach(commit => {
      const date = commit.date;
      const dayOfWeek = date.getDay(); // 0 = Sunday
      const hour = date.getHours();
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      commitsByDay[dayOfWeek] = (commitsByDay[dayOfWeek] || 0) + 1;
      commitsByHour[hour] = (commitsByHour[hour] || 0) + 1;
      commitsByMonth[monthKey] = (commitsByMonth[monthKey] || 0) + 1;

      totalAdditions += commit.stats?.additions || 0;
      totalDeletions += commit.stats?.deletions || 0;
    });

    const patterns = {
      totalCommits: allCommits.length,
      averageCommitsPerRepo: (allCommits.length / repositories.length).toFixed(2),
      mostActiveDay: Object.entries(commitsByDay).sort((a, b) => b[1] - a[1])[0],
      mostActiveHour: Object.entries(commitsByHour).sort((a, b) => b[1] - a[1])[0],
      commitFrequency: commitsByMonth,
      codeChanges: {
        totalAdditions,
        totalDeletions,
        netChanges: totalAdditions - totalDeletions,
        averageChangesPerCommit: ((totalAdditions + totalDeletions) / allCommits.length).toFixed(2)
      },
      commitsByHour,
      commitsByDay
    };

    // Generate AI insights using the AIService
    const aiInsights = await AIService.analyzeDevelopmentPatterns(patterns);

    // Save analysis
    const analysis = await Analysis.findOneAndUpdate(
      { userId: user._id, type: 'development_patterns' },
      {
        userId: user._id,
        type: 'development_patterns',
        data: patterns,
        aiInsights,
        generatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      analysis: {
        patterns,
        aiInsights
      }
    });

  } catch (error) {
    console.error('Pattern analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

// Generate career insights
router.post('/career-insights', async (req, res) => {
  try {
    const { githubId } = req.user;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const repositories = await Repository.find({ userId: user._id });

    // Prepare data for career analysis
    const careerData = {
      profile: {
        name: user.name,
        bio: user.bio,
        location: user.location,
        company: user.company,
        publicRepos: user.public_repos,
        followers: user.followers,
        accountAge: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365))
      },
      repositories: repositories.map(repo => ({
        name: repo.name,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        size: repo.size,
        topics: repo.topics,
        commits: repo.commits.length
      })).slice(0, 10), // Top 10 repos
      topLanguages: Object.entries(
        repositories.reduce((acc, repo) => {
          if (repo.language) {
            acc[repo.language] = (acc[repo.language] || 0) + 1;
          }
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 5)
    };

    // Generate comprehensive career insights using AIService
    const aiInsights = await AIService.generateCareerInsights(careerData);

    // Save analysis
    const analysis = await Analysis.findOneAndUpdate(
      { userId: user._id, type: 'career_insights' },
      {
        userId: user._id,
        type: 'career_insights',
        data: careerData,
        aiInsights,
        generatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      analysis: {
        careerData,
        aiInsights
      }
    });

  } catch (error) {
    console.error('Career insights error:', error);
    res.status(500).json({ error: 'Failed to generate career insights' });
  }
});

// Get all analyses for user
router.get('/analyses', async (req, res) => {
  try {
    const { githubId } = req.user;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const analyses = await Analysis.find({ userId: user._id })
      .sort({ generatedAt: -1 });

    res.json({ analyses });
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// Analyze code quality for a specific repository
router.post('/analyze-code-quality/:repoId', async (req, res) => {
  try {
    const { githubId } = req.user;
    const { repoId } = req.params;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const repository = await Repository.findOne({
      userId: user._id,
      githubRepoId: parseInt(repoId)
    });

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    console.log(`🔍 Analyzing code quality for: ${repository.name}`);

    // Prepare repository data for AI analysis
    const analysisData = {
      repository: {
        name: repository.name,
        description: repository.description,
        language: repository.language,
        languages: repository.languages,
        size: repository.size,
        commits: repository.commits.length,
        topics: repository.topics,
        created: repository.created_at,
        lastUpdate: repository.updated_at
      },
      commitPatterns: analyzeCommitPatterns(repository.commits),
      languageDistribution: calculateLanguageDistribution(repository),
      fileStructure: {
        totalFiles: repository.commits.length > 0 ? 'multiple' : 'unknown',
        primaryLanguage: repository.language,
        languages: Object.keys(repository.languages || {})
      }
    };

    // Generate AI insights for code quality using AIService
    const aiInsights = await AIService.analyzeCodeQuality(analysisData);

    // Save analysis to database
    const analysis = await Analysis.findOneAndUpdate(
      { userId: user._id, type: 'code_quality', 'data.repositoryId': parseInt(repoId) },
      {
        userId: user._id,
        type: 'code_quality',
        data: {
          repositoryId: parseInt(repoId),
          repositoryName: repository.name,
          analysisData
        },
        aiInsights,
        generatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Code quality analysis completed for ${repository.name}`);

    res.json({
      success: true,
      repository: {
        id: repository.githubRepoId,
        name: repository.name,
        language: repository.language
      },
      codeQuality: aiInsights
    });

  } catch (error) {
    console.error('Code quality analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze code quality' });
  }
});

// Helper function to analyze commit patterns
function analyzeCommitPatterns(commits) {
  if (!commits || commits.length === 0) {
    return {
      avgCommitsPerMonth: 0,
      messageQuality: 'unknown',
      consistency: 'low'
    };
  }

  // Calculate average commits per month
  const dates = commits.map(c => new Date(c.author.date));
  const earliest = Math.min(...dates);
  const latest = Math.max(...dates);
  const monthsDiff = Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24 * 30));
  const avgCommitsPerMonth = Math.round(commits.length / monthsDiff);

  // Analyze commit message quality
  const avgMessageLength = commits.reduce((sum, c) => sum + c.message.length, 0) / commits.length;
  let messageQuality = 'poor';
  if (avgMessageLength > 50) messageQuality = 'excellent';
  else if (avgMessageLength > 30) messageQuality = 'good';
  else if (avgMessageLength > 15) messageQuality = 'fair';

  // Analyze consistency (commits spread over time)
  const uniqueDays = new Set(commits.map(c =>
    new Date(c.author.date).toDateString()
  )).size;
  const totalDays = Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24));
  const consistency = uniqueDays / totalDays > 0.1 ? 'high' :
    uniqueDays / totalDays > 0.05 ? 'medium' : 'low';

  return {
    avgCommitsPerMonth,
    messageQuality,
    consistency
  };
}

function calculateLanguageDistribution(repository) {
  if (!repository.languages) return [];

  const total = Object.values(repository.languages).reduce((sum, bytes) => sum + bytes, 0);

  return Object.entries(repository.languages).map(([language, bytes]) => ({
    language,
    bytes,
    percentage: ((bytes / total) * 100).toFixed(2)
  })).sort((a, b) => b.bytes - a.bytes);
}

export default router;
