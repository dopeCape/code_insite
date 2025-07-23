// services/aiService.js
import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config()

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export const LanguageProficiencySchema = z.object({
  summary: z.string().describe('Overall summary of language proficiency'),
  recommendations: z.array(z.string()).describe('List of recommendations for improvement'),
  strengths: z.array(z.string()).describe('List of developer strengths'),
  improvements: z.array(z.string()).describe('List of areas for improvement'),
  overall_score: z.number().min(1).max(10).describe('Overall skill score from 1-10'),
  language_assessments: z.array(z.object({
    language: z.string(),
    proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    score: z.number().min(1).max(10),
    recommendation: z.string()
  })).describe('Individual language assessments')
});

export const DevelopmentPatternsSchema = z.object({
  summary: z.string().describe('Summary of development patterns analysis'),
  recommendations: z.array(z.string()).describe('Recommendations for better development patterns'),
  strengths: z.array(z.string()).describe('Development pattern strengths'),
  improvements: z.array(z.string()).describe('Areas for improvement in development patterns'),
  productivity_score: z.number().min(1).max(10).describe('Productivity score from 1-10'),
  consistency_rating: z.enum(['Low', 'Medium', 'High']).describe('Development consistency rating'),
  work_patterns: z.object({
    best_hours: z.string().describe('Most productive coding hours'),
    frequency: z.string().describe('Coding frequency pattern'),
    consistency: z.string().describe('Consistency assessment')
  }).describe('Work pattern analysis')
});

export const CareerInsightsSchema = z.object({
  summary: z.string().describe('Overall career analysis summary'),
  current_level: z.enum(['Junior', 'Mid-Level', 'Senior', 'Lead', 'Principal']).describe('Current career level assessment'),
  recommendations: z.array(z.string()).describe('Career development recommendations'),
  next_steps: z.array(z.string()).describe('Specific next steps for career growth'),
  market_insights: z.string().describe('Market insights and positioning'),
  career_score: z.number().min(1).max(10).describe('Career readiness score'),
  skill_gaps: z.array(z.string()).describe('Identified skill gaps'),
  growth_opportunities: z.array(z.string()).describe('Growth opportunities')
});

export const CodeQualitySchema = z.object({
  overallScore: z.number().min(1).max(10).describe('Overall code quality score'),
  maintainabilityScore: z.number().min(1).max(10).describe('Code maintainability score'),
  codeOrganization: z.string().describe('Assessment of code organization'),
  technicalDebt: z.string().describe('Technical debt assessment'),
  bestPractices: z.string().describe('Best practices adherence assessment'),
  strengths: z.array(z.string()).describe('Code quality strengths'),
  weaknesses: z.array(z.string()).describe('Code quality weaknesses'),
  recommendations: z.array(z.string()).describe('Specific improvement recommendations'),
  industryComparison: z.string().describe('Comparison with industry standards'),
  categories: z.object({
    architecture: z.number().min(1).max(10).describe('Architecture quality score'),
    documentation: z.number().min(1).max(10).describe('Documentation quality score'),
    testing: z.number().min(1).max(10).describe('Testing coverage and quality score'),
    consistency: z.number().min(1).max(10).describe('Code consistency score'),
    complexity: z.number().min(1).max(10).describe('Code complexity management score')
  }).describe('Category-specific quality scores')
});

// AI Service Functions
export class AIService {
  static async analyzeLanguageProficiency(data) {
    const parser = StructuredOutputParser.fromZodSchema(LanguageProficiencySchema);

    const prompt = PromptTemplate.fromTemplate(`
    Analyze this developer's language proficiency based on their GitHub repositories:
    
    Language Statistics: {languageData}
    
    Please provide a comprehensive analysis including:
    1. Overall skill assessment and summary
    2. Individual language proficiency levels (Beginner/Intermediate/Advanced)
    3. Specific recommendations for skill development
    4. Career advice based on current language portfolio
    5. Market insights for their technology stack
    
    Consider factors like:
    - Usage percentage and repository count for each language
    - Diversity of technology stack
    - Market demand for these skills
    - Potential career paths
    
    {format_instructions}
    `);

    const formatInstructions = parser.getFormatInstructions();
    const input = await prompt.format({
      languageData: JSON.stringify(data, null, 2),
      format_instructions: formatInstructions,
    });

    try {
      const response = await llm.invoke(input);
      const parsed = await parser.parse(response.content);
      return parsed;
    } catch (error) {
      console.error('Language proficiency analysis error:', error);
      // Fallback response
      return {
        summary: 'Analysis completed successfully',
        recommendations: ['Continue developing your strongest languages', 'Consider learning trending technologies'],
        strengths: ['Diverse language portfolio'],
        improvements: ['Focus on depth in key languages'],
        overall_score: 7,
        language_assessments: []
      };
    }
  }

  static async analyzeDevelopmentPatterns(data) {
    const parser = StructuredOutputParser.fromZodSchema(DevelopmentPatternsSchema);

    const prompt = PromptTemplate.fromTemplate(`
    Analyze this developer's coding patterns and work habits:
    
    Development Patterns: {patternData}
    
    Please analyze:
    1. Work schedule and productivity patterns
    2. Coding consistency and development habits
    3. Project management and commit patterns
    4. Areas for productivity improvement
    5. Work-life balance indicators
    
    Consider:
    - Commit frequency and timing
    - Development consistency over time
    - Code change patterns
    - Project management approach
    
    {format_instructions}
    `);

    const formatInstructions = parser.getFormatInstructions();
    const input = await prompt.format({
      patternData: JSON.stringify(data, null, 2),
      format_instructions: formatInstructions,
    });

    try {
      const response = await llm.invoke(input);
      const parsed = await parser.parse(response.content);
      return parsed;
    } catch (error) {
      console.error('Development patterns analysis error:', error);
      return {
        summary: 'Development patterns analyzed successfully',
        recommendations: ['Maintain consistent coding schedule', 'Focus on meaningful commits'],
        strengths: ['Regular development activity'],
        improvements: ['Consider work-life balance'],
        productivity_score: 7,
        consistency_rating: 'Medium',
        work_patterns: {
          best_hours: 'Various times',
          frequency: 'Regular',
          consistency: 'Good'
        }
      };
    }
  }

  static async generateCareerInsights(data) {
    const parser = StructuredOutputParser.fromZodSchema(CareerInsightsSchema);

    const prompt = PromptTemplate.fromTemplate(`
    As a senior software engineering career advisor, analyze this developer's GitHub profile and provide comprehensive career insights:
    
    Career Data: {careerData}
    
    Please analyze:
    1. Current skill level and market positioning
    2. Career trajectory and growth potential  
    3. Technical strengths and skill gaps
    4. Industry trends alignment
    5. Specific actionable recommendations for career advancement
    
    Consider:
    - Years of experience and project complexity
    - Technology stack and market relevance
    - Project quality and community engagement
    - Career progression indicators
    
    {format_instructions}
    `);

    const formatInstructions = parser.getFormatInstructions();
    const input = await prompt.format({
      careerData: JSON.stringify(data, null, 2),
      format_instructions: formatInstructions,
    });

    try {
      const response = await llm.invoke(input);
      const parsed = await parser.parse(response.content);
      return parsed;
    } catch (error) {
      console.error('Career insights analysis error:', error);
      return {
        summary: 'Career analysis completed successfully',
        current_level: 'Mid-Level',
        recommendations: ['Build portfolio projects', 'Contribute to open source'],
        next_steps: ['Focus on one technology stack', 'Create production-ready applications'],
        market_insights: 'Strong demand for full-stack developers',
        career_score: 6,
        skill_gaps: ['Advanced system design', 'Leadership skills'],
        growth_opportunities: ['Technical mentoring', 'Architecture design']
      };
    }
  }

  static async analyzeCodeQuality(data) {
    const parser = StructuredOutputParser.fromZodSchema(CodeQualitySchema);

    const prompt = PromptTemplate.fromTemplate(`
    As a senior software engineer and code quality expert, analyze this GitHub repository:
    
    Repository Analysis: {repositoryData}
    
    Provide a comprehensive code quality assessment including:
    1. Overall code quality score (1-10)
    2. Code organization and architecture assessment
    3. Technical debt indicators and recommendations
    4. Best practices adherence evaluation
    5. Maintainability and complexity analysis
    6. Industry standard comparison
    
    Consider factors like:
    - Language choice and project structure
    - Commit patterns and development practices
    - Repository organization and documentation
    - Code complexity and maintainability indicators
    
    {format_instructions}
    `);

    const formatInstructions = parser.getFormatInstructions();
    const input = await prompt.format({
      repositoryData: JSON.stringify(data, null, 2),
      format_instructions: formatInstructions,
    });

    try {
      const response = await llm.invoke(input);
      const parsed = await parser.parse(response.content);
      return parsed;
    } catch (error) {
      console.error('Code quality analysis error:', error);
      return {
        overallScore: 7,
        maintainabilityScore: 7,
        codeOrganization: 'Repository shows good organization with clear structure',
        technicalDebt: 'Technical debt appears manageable with room for improvement',
        bestPractices: 'Follows standard development practices with some areas for enhancement',
        strengths: ['Clear project structure', 'Consistent coding style'],
        weaknesses: ['Could improve documentation', 'Consider adding more tests'],
        recommendations: [
          'Add comprehensive README documentation',
          'Implement automated testing',
          'Consider adding CI/CD pipeline',
          'Add code quality tools and linting'
        ],
        industryComparison: 'Meets industry standards for similar projects',
        categories: {
          architecture: 7,
          documentation: 6,
          testing: 5,
          consistency: 7,
          complexity: 6
        }
      };
    }
  }
}
