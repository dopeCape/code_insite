import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  githubRepoId: {
    type: Number,
    required: true
  },
  name: String,
  full_name: String,
  description: String,
  language: String,
  languages: {
    type: Map,
    of: Number // language: bytes
  },
  size: Number,
  stargazers_count: Number,
  forks_count: Number,
  created_at: Date,
  updated_at: Date,
  pushed_at: Date,
  commits: [{
    sha: String,
    message: String,
    author: {
      name: String,
      email: String,
      date: Date
    },
    stats: {
      additions: Number,
      deletions: Number,
      total: Number
    }
  }],
  isPrivate: Boolean,
  topics: [String]
}, {
  timestamps: true
});

export default mongoose.model('Repository', repositorySchema);
