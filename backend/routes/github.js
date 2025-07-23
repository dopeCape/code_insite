// routes/github.js
import express from 'express';
import axios from 'axios';
import User from '../models/User.js';
import Repository from '../models/Repository.js';
const router = express.Router();

// GitHub API Base URL
const GITHUB_API = 'https://api.github.com';

// Helper function to make GitHub API calls
const githubAPI = async (endpoint, accessToken) => {
  try {
    const response = await axios.get(`${GITHUB_API}${endpoint}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`GitHub API Error: ${endpoint}`, error.response?.data);
    throw error;
  }
};

// Sync user profile data
router.post('/sync-profile', async (req, res) => {
  try {
    const { accessToken, githubId } = req.user;

    // Fetch user data from GitHub
    const githubUser = await githubAPI('/user', accessToken);

    // Update or create user in database
    const user = await User.findOneAndUpdate(
      { githubId: githubUser.id },
      {
        githubId: githubUser.id,
        login: githubUser.login,
        name: githubUser.name,
        email: githubUser.email,
        avatar_url: githubUser.avatar_url,
        bio: githubUser.bio,
        location: githubUser.location,
        company: githubUser.company,
        blog: githubUser.blog,
        public_repos: githubUser.public_repos,
        followers: githubUser.followers,
        following: githubUser.following,
        created_at: githubUser.created_at
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error('Profile sync error:', error);
    res.status(500).json({ error: 'Failed to sync profile' });
  }
});

// Fetch and analyze repositories
router.post('/sync-repositories', async (req, res) => {
  try {
    const { accessToken, githubId } = req.user;

    // Find user in database
    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('🔄 Fetching repositories for user:', user.login);

    // Fetch repositories from GitHub - ONLY non-fork repositories
    const repos = await githubAPI('/user/repos?sort=updated&per_page=100&type=owner', accessToken);

    console.log(`📚 Found ${repos.length} total repositories`);

    // Filter out forks and only keep repositories the user created
    const ownRepos = repos.filter(repo => !repo.fork && repo.owner.login === user.login);
    console.log(`✅ Filtered to ${ownRepos.length} original repositories (excluding forks)`);

    const processedRepos = [];
    const maxRepos = Math.min(ownRepos.length, 15); // Limit to 15 repos max

    for (let i = 0; i < maxRepos; i++) {
      const repo = ownRepos[i];
      try {
        console.log(`📁 Processing repo ${i + 1}/${maxRepos}: ${repo.name}`);

        // Skip if repository is too large (>50MB)
        if (repo.size > 50000) {
          console.log(`⚠️ Skipping large repository: ${repo.name} (${repo.size}KB)`);
          continue;
        }

        // Fetch language statistics
        const languages = await githubAPI(`/repos/${repo.full_name}/languages`, accessToken);

        // Fetch recent commits (limited to 10)
        const commits = await githubAPI(
          `/repos/${repo.full_name}/commits?per_page=10&author=${user.login}`,
          accessToken
        );

        console.log(`📝 Found ${commits.length} commits for ${repo.name}`);

        // Process commits with stats (limited processing)
        const processedCommits = [];
        for (let j = 0; j < Math.min(commits.length, 5); j++) {
          const commit = commits[j];
          try {
            // For efficiency, skip detailed commit stats for now
            processedCommits.push({
              sha: commit.sha,
              message: commit.commit.message.substring(0, 100), // Truncate long messages
              author: {
                name: commit.commit.author.name,
                email: commit.commit.author.email,
                date: commit.commit.author.date
              },
              stats: { additions: 0, deletions: 0, total: 0 } // Skip detailed stats for speed
            });
          } catch (error) {
            console.error(`Error processing commit ${commit.sha}:`, error.message);
          }
        }

        // Save repository to database
        const repoData = await Repository.findOneAndUpdate(
          { userId: user._id, githubRepoId: repo.id },
          {
            userId: user._id,
            githubRepoId: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            language: repo.language,
            languages: languages,
            size: repo.size,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            pushed_at: repo.pushed_at,
            commits: processedCommits,
            isPrivate: repo.private,
            topics: repo.topics || []
          },
          { upsert: true, new: true }
        );

        processedRepos.push(repoData);
        console.log(`✅ Processed ${repo.name} successfully`);

      } catch (error) {
        console.error(`❌ Error processing repo: ${repo.name}`, error.response?.status, error.message);

        // Continue processing other repos even if one fails
        if (error.response?.status === 500) {
          console.log(`⏭️ Skipping ${repo.name} due to server error`);
          continue;
        }
      }
    }

    // Update user's last analysis time
    await User.findByIdAndUpdate(user._id, { lastAnalysis: new Date() });

    console.log(`🎉 Repository sync completed: ${processedRepos.length} repos processed`);

    res.json({
      success: true,
      message: `Synced ${processedRepos.length} repositories`,
      repositories: processedRepos,
      skipped: maxRepos - processedRepos.length,
      total: ownRepos.length
    });

  } catch (error) {
    console.error('❌ Repository sync error:', error);
    res.status(500).json({ error: 'Failed to sync repositories' });
  }
});

// Get user's cached repositories
router.get('/repositories', async (req, res) => {
  try {
    const { githubId } = req.user;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const repositories = await Repository.find({ userId: user._id })
      .sort({ updated_at: -1 });

    res.json({ repositories });
  } catch (error) {
    console.error('Get repositories error:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Get GitHub statistics summary
router.get('/stats', async (req, res) => {
  try {
    const { githubId } = req.user;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const repositories = await Repository.find({ userId: user._id });

    // Calculate statistics
    const stats = {
      totalRepos: repositories.length,
      totalCommits: repositories.reduce((sum, repo) => sum + repo.commits.length, 0),
      totalStars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      totalForks: repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
      languages: {},
      recentActivity: []
    };

    // Aggregate language statistics
    repositories.forEach(repo => {
      if (repo.languages) {
        repo.languages.forEach((bytes, language) => {
          stats.languages[language] = (stats.languages[language] || 0) + bytes;
        });
      }
    });

    // Recent commits for activity timeline
    const allCommits = [];
    repositories.forEach(repo => {
      repo.commits.forEach(commit => {
        allCommits.push({
          ...commit,
          repository: repo.name,
          repoFullName: repo.full_name
        });
      });
    });

    stats.recentActivity = allCommits
      .sort((a, b) => new Date(b.author.date) - new Date(a.author.date))
      .slice(0, 20);

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get detailed repository analysis
router.get('/repository/:repoId', async (req, res) => {
  try {
    const { githubId, accessToken } = req.user;
    const { repoId } = req.params;

    const user = await User.findOne({ githubId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find repository in database
    const repository = await Repository.findOne({
      userId: user._id,
      githubRepoId: parseInt(repoId)
    });

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    console.log(`🔍 Analyzing repository: ${repository.name}`);

    try {
      // Get detailed repository info from GitHub
      const [repoDetails, contributors, branches, releases] = await Promise.allSettled([
        githubAPI(`/repos/${repository.full_name}`, accessToken),
        githubAPI(`/repos/${repository.full_name}/contributors`, accessToken),
        githubAPI(`/repos/${repository.full_name}/branches`, accessToken),
        githubAPI(`/repos/${repository.full_name}/releases`, accessToken)
      ]);

      // Get file structure (tree)
      let fileStructure = [];
      try {
        const tree = await githubAPI(`/repos/${repository.full_name}/git/trees/${repoDetails.value?.default_branch || 'main'}?recursive=1`, accessToken);
        fileStructure = tree.tree || [];
      } catch (error) {
        console.log('Could not fetch file structure:', error.message);
      }

      // Analyze file types and complexity
      const fileAnalysis = analyzeFileStructure(fileStructure);

      // Get recent commits with detailed stats
      const recentCommits = await githubAPI(
        `/repos/${repository.full_name}/commits?per_page=30&author=${user.login}`,
        accessToken
      );

      // Process commits for timeline
      const commitTimeline = recentCommits.map(commit => ({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message.split('\n')[0].substring(0, 80),
        date: commit.commit.author.date,
        author: commit.commit.author.name,
        url: commit.html_url
      }));

      // Calculate repository metrics
      const metrics = {
        totalFiles: fileStructure.length,
        codeFiles: fileAnalysis.codeFiles,
        totalLines: fileAnalysis.estimatedLines,
        complexity: calculateComplexity(fileAnalysis),
        maintainability: calculateMaintainability(repository, fileAnalysis),
        lastActivity: repository.pushed_at,
        commitFrequency: calculateCommitFrequency(commitTimeline),
        languageDistribution: repository.languages
      };

      const analysis = {
        repository: {
          id: repository.githubRepoId,
          name: repository.name,
          fullName: repository.full_name,
          description: repository.description,
          language: repository.language,
          size: repository.size,
          stars: repository.stargazers_count,
          forks: repository.forks_count,
          watchers: repoDetails.value?.watchers_count || 0,
          openIssues: repoDetails.value?.open_issues_count || 0,
          createdAt: repository.created_at,
          updatedAt: repository.updated_at,
          pushedAt: repository.pushed_at,
          isPrivate: repository.isPrivate,
          topics: repository.topics,
          defaultBranch: repoDetails.value?.default_branch,
          hasWiki: repoDetails.value?.has_wiki,
          hasPages: repoDetails.value?.has_pages
        },
        metrics,
        fileStructure: fileAnalysis.structure,
        commitTimeline: commitTimeline.slice(0, 20),
        contributors: contributors.status === 'fulfilled' ? contributors.value.slice(0, 10) : [],
        branches: branches.status === 'fulfilled' ? branches.value.slice(0, 10) : [],
        releases: releases.status === 'fulfilled' ? releases.value.slice(0, 5) : [],
        languageStats: Object.entries(repository.languages || {}).map(([lang, bytes]) => ({
          language: lang,
          bytes,
          percentage: ((bytes / repository.size) * 100).toFixed(2)
        })).sort((a, b) => b.bytes - a.bytes)
      };

      res.json({ analysis });

    } catch (error) {
      console.error('Error fetching repository details:', error);
      res.status(500).json({ error: 'Failed to fetch repository details' });
    }

  } catch (error) {
    console.error('Repository analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze repository' });
  }
});

// Helper functions for repository analysis
function analyzeFileStructure(files) {
  const structure = {
    directories: new Set(),
    files: [],
    extensions: {},
    codeFiles: 0,
    documentFiles: 0,
    configFiles: 0,
    estimatedLines: 0
  };

  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb', '.swift', '.kt'];
  const docExtensions = ['.md', '.txt', '.rst', '.doc', '.pdf'];
  const configExtensions = ['.json', '.yml', '.yaml', '.xml', '.toml', '.ini', '.env'];

  files.forEach(file => {
    if (file.type === 'tree') {
      structure.directories.add(file.path);
    } else if (file.type === 'blob') {
      const ext = '.' + file.path.split('.').pop().toLowerCase();
      structure.extensions[ext] = (structure.extensions[ext] || 0) + 1;

      structure.files.push({
        path: file.path,
        size: file.size || 0,
        extension: ext
      });

      // Categorize files
      if (codeExtensions.includes(ext)) {
        structure.codeFiles++;
        // Rough estimate: 30 lines per KB for code files
        structure.estimatedLines += Math.max(1, Math.floor((file.size || 500) / 35));
      } else if (docExtensions.includes(ext)) {
        structure.documentFiles++;
      } else if (configExtensions.includes(ext)) {
        structure.configFiles++;
      }
    }
  });

  structure.directories = Array.from(structure.directories);

  return structure;
}

function calculateComplexity(fileAnalysis) {
  const { codeFiles, extensions, estimatedLines } = fileAnalysis;

  // Complexity factors
  let complexity = 1;

  // More files = higher complexity
  if (codeFiles > 100) complexity += 2;
  else if (codeFiles > 50) complexity += 1;

  // More languages = higher complexity
  const codeLanguages = Object.keys(extensions).filter(ext =>
    ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb'].includes(ext)
  ).length;

  if (codeLanguages > 5) complexity += 2;
  else if (codeLanguages > 3) complexity += 1;

  // More lines = higher complexity
  if (estimatedLines > 10000) complexity += 2;
  else if (estimatedLines > 5000) complexity += 1;

  return Math.min(complexity, 5); // Cap at 5
}

function calculateMaintainability(repository, fileAnalysis) {
  let score = 5; // Base score

  // Has README?
  const hasReadme = fileAnalysis.files.some(f =>
    f.path.toLowerCase().includes('readme')
  );
  if (hasReadme) score += 1;

  // Has tests?
  const hasTests = fileAnalysis.files.some(f =>
    f.path.toLowerCase().includes('test') ||
    f.path.toLowerCase().includes('spec')
  );
  if (hasTests) score += 1;

  // Has CI/CD config?
  const hasCICD = fileAnalysis.files.some(f =>
    f.path.includes('.github/workflows') ||
    f.path.includes('.travis.yml') ||
    f.path.includes('Jenkinsfile')
  );
  if (hasCICD) score += 1;

  // Recent activity
  const daysSinceUpdate = (new Date() - new Date(repository.updated_at)) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 30) score += 1;
  else if (daysSinceUpdate > 180) score -= 1;

  return Math.max(1, Math.min(score, 10));
}

function calculateCommitFrequency(commits) {
  if (commits.length === 0) return 0;

  const dates = commits.map(c => new Date(c.date));
  const earliest = Math.min(...dates);
  const latest = Math.max(...dates);
  const daysDiff = Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24));

  return Math.round((commits.length / daysDiff) * 7 * 10) / 10; // Commits per week
}

export default router;
