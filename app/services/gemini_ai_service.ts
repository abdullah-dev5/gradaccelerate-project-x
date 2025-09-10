import { GoogleGenerativeAI } from '@google/generative-ai'
import env from '#start/env'

export interface AIGeneratedContent {
  labels: string[]
  summary: string
  confidence: number
}

export default class GeminiAIService {
  private static genAI: GoogleGenerativeAI | null = null
  private static model: any = null

  /**
   * Initialize the Gemini AI service
   */
  private static async initialize() {
    try {
      console.log('🔧 [GeminiAIService] Initializing Gemini AI service...')
      
      if (!this.genAI) {
        console.log('🔑 [GeminiAIService] Getting API key from env...')
        const apiKey = env.get('GOOGLE_GEMINI_API_KEY')
        
        if (!apiKey) {
          console.error('❌ [GeminiAIService] Google Gemini API key not configured')
          throw new Error('Google Gemini API key not configured')
        }
        
        console.log('✅ [GeminiAIService] API key found, initializing GoogleGenerativeAI...')
        this.genAI = new GoogleGenerativeAI(apiKey)
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        console.log('✅ [GeminiAIService] Gemini AI service initialized successfully')
      } else {
        console.log('ℹ️ [GeminiAIService] Service already initialized')
      }
    } catch (error) {
      console.error('❌ [GeminiAIService] Failed to initialize:', error)
      throw error
    }
  }

  /**
   * Generate AI labels for a bookmark based on content
   */
  static async generateLabels(content: string, maxLabels: number = 5): Promise<string[]> {
    try {
      console.log(`🏷️ [GeminiAIService] Generating ${maxLabels} labels for content...`)
      console.log(`📝 [GeminiAIService] Content preview: ${content.substring(0, 100)}...`)
      
      await this.initialize()

      const prompt = `Based on the following content, generate ${maxLabels} relevant, concise labels (single words or short phrases) that would help categorize this bookmark. Focus on the main topics, themes, and content type.

Content: ${content}

Generate only the labels, one per line, without numbering or additional text. Keep each label under 3 words.`

      console.log('🤖 [GeminiAIService] Sending prompt to Gemini AI...')
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log(`📄 [GeminiAIService] Raw AI response: ${text}`)

      // Parse the response and clean up
      const labels = text
        .split('\n')
        .map((label: string) => label.trim().replace(/^[0-9.-]+/, '').trim())
        .filter((label: string) => label.length > 0 && label.length < 50)
        .slice(0, maxLabels)

      console.log(`✅ [GeminiAIService] Generated labels: ${JSON.stringify(labels)}`)
      return labels.length > 0 ? labels : ['general']
    } catch (error) {
      console.error('❌ [GeminiAIService] Error generating AI labels:', error)
      return ['general']
    }
  }

  /**
   * Generate TL;DR summary for long content
   */
  static async generateSummary(content: string, maxLength: number = 200): Promise<string> {
    try {
      console.log(`📖 [GeminiAIService] Generating TL;DR summary (max ${maxLength} chars)...`)
      console.log(`📝 [GeminiAIService] Content preview: ${content.substring(0, 100)}...`)
      
      await this.initialize()

      const prompt = `Create a concise TL;DR (Too Long; Didn't Read) summary of the following content. The summary should be informative, engaging, and no more than ${maxLength} characters.

Content: ${content}

TL;DR:`

      console.log('🤖 [GeminiAIService] Sending prompt to Gemini AI...')
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log(`📄 [GeminiAIService] Raw AI response: ${text}`)

      // Clean up the response
      const summary = text
        .replace(/^TL;DR:\s*/i, '')
        .trim()
        .substring(0, maxLength)

      console.log(`✅ [GeminiAIService] Generated summary: ${summary}`)
      return summary || 'No summary available'
    } catch (error) {
      console.error('❌ [GeminiAIService] Error generating AI summary:', error)
      return 'Summary generation failed'
    }
  }

  /**
   * Generate comprehensive AI content for a bookmark
   */
  static async generateBookmarkContent(
    url: string,
    title: string,
    description: string | null,
    content: string
  ): Promise<AIGeneratedContent> {
    try {
      console.log(`🚀 [GeminiAIService] Generating comprehensive AI content for bookmark...`)
      console.log(`🔗 [GeminiAIService] URL: ${url}`)
      console.log(`📝 [GeminiAIService] Title: ${title}`)
      
      await this.initialize()

      const combinedContent = [title, description, content].filter(Boolean).join('. ')
      console.log(`📄 [GeminiAIService] Combined content preview: ${combinedContent.substring(0, 150)}...`)

      // Generate labels and summary in parallel
      console.log('🔄 [GeminiAIService] Generating labels and summary in parallel...')
      const [labels, summary] = await Promise.all([
        this.generateLabels(combinedContent),
        this.generateSummary(combinedContent),
      ])

      const result = {
        labels,
        summary,
        confidence: 0.85, // Default confidence score
      }
      
      console.log(`✅ [GeminiAIService] Generated content:`, result)
      return result
    } catch (error) {
      console.error('❌ [GeminiAIService] Error generating bookmark content:', error)
      return {
        labels: ['general'],
        summary: 'AI content generation failed',
        confidence: 0.0,
      }
    }
  }

  /**
   * Analyze bookmark content and suggest improvements
   */
  static async analyzeBookmark(
    url: string,
    title: string,
    description: string | null
  ): Promise<{
    suggestions: string[]
    category: string
    readability: 'easy' | 'medium' | 'hard'
  }> {
    try {
      console.log(`🔍 [GeminiAIService] Analyzing bookmark content...`)
      console.log(`🔗 [GeminiAIService] URL: ${url}`)
      console.log(`📝 [GeminiAIService] Title: ${title}`)
      
      await this.initialize()

      const prompt = `Analyze this bookmark and provide:
1. 3 suggestions for better organization or categorization
2. The most appropriate content category (e.g., tech, news, tutorial, blog, etc.)
3. Readability level (easy/medium/hard)

Bookmark: ${title}
Description: ${description || 'No description'}
URL: ${url}

Format your response as:
SUGGESTIONS:
- suggestion 1
- suggestion 2
- suggestion 3

CATEGORY: [category]

READABILITY: [easy/medium/hard]`

      console.log('🤖 [GeminiAIService] Sending analysis prompt to Gemini AI...')
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log(`📄 [GeminiAIService] Raw AI analysis response: ${text}`)

      // Parse the response
      const suggestions = text
        .split('SUGGESTIONS:')[1]
        ?.split('CATEGORY:')[0]
        ?.split('\n')
        ?.filter((line: string) => line.trim().startsWith('-'))
        ?.map((line: string) => line.trim().substring(1).trim())
        ?.filter(Boolean) || ['Organize by topic', 'Add tags', 'Create collections']

      const category = text
        .split('CATEGORY:')[1]
        ?.split('READABILITY:')[0]
        ?.trim() || 'general'

      const readability = text
        .split('READABILITY:')[1]
        ?.trim()
        ?.toLowerCase() as 'easy' | 'medium' | 'hard' || 'medium'

      const analysis = {
        suggestions,
        category,
        readability,
      }
      
      console.log(`✅ [GeminiAIService] Analysis complete:`, analysis)
      return analysis
    } catch (error) {
      console.error('❌ [GeminiAIService] Error analyzing bookmark:', error)
      return {
        suggestions: ['Organize by topic', 'Add tags', 'Create collections'],
        category: 'general',
        readability: 'medium',
      }
    }
  }
}
