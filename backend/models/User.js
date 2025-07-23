// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  login: {
    type: String,
    required: true
  },
  name: String,
  email: String,
  avatar_url: String,
  bio: String,
  location: String,
  company: String,
  blog: String,
  public_repos: Number,
  followers: Number,
  following: Number,
  created_at: Date,
  lastAnalysis: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
