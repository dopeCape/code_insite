import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['language_proficiency', 'development_patterns', 'career_insights', 'code_quality'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  aiInsights: {
    summary: String,
    recommendations: [String],
    strengths: [String],
    improvements: [String],
    score: Number
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Analysis', analysisSchema);
